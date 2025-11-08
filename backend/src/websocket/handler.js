const WebSocket = require('ws');
const { addConnection, updateStatistics, store } = require('../utils/store');
const { logEmitter } = require('../middleware/logger');

// Rate limiting 설정
const MAX_MESSAGES_PER_SECOND = 100;
const MESSAGE_SIZE_LIMIT = 1024 * 1024; // 1MB

// WebSocket 서버 인스턴스 (브로드캐스트용)
let wssInstance = null;

/**
 * WebSocket 서버 초기화
 * @param {http.Server} server - HTTP 서버 인스턴스
 * @returns {WebSocket.Server} WebSocket 서버 인스턴스
 */
function initializeWebSocket(server) {
  const wss = new WebSocket.Server({ server });
  wssInstance = wss;

  // 로그 이벤트 리스너: 모든 WebSocket 클라이언트에게 로그 브로드캐스트
  logEmitter.on('log', (logData) => {
    const message = JSON.stringify({
      type: 'log',
      data: logData,
      timestamp: new Date().toISOString()
    });

    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  // 통계 변경 시 브로드캐스트 함수
  const broadcastStats = () => {
    const message = JSON.stringify({
      type: 'stats',
      data: store.statistics,
      timestamp: new Date().toISOString()
    });

    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  // 주기적으로 통계 브로드캐스트 (5초마다)
  const statsInterval = setInterval(broadcastStats, 5000);

  // 서버 종료 시 인터벌 정리
  wss.on('close', () => {
    clearInterval(statsInterval);
  });

  wss.on('connection', (ws, req) => {
    const clientIp = req.socket.remoteAddress;

    // 연결 정보 저장
    const connectionEntry = addConnection({
      clientIp: clientIp
    });

    // 통계 업데이트 (activeWebSockets 증가)
    updateStatistics({
      activeWebSockets: store.statistics.activeWebSockets + 1
    });

    // Rate limiting을 위한 메시지 카운터
    let messageCount = 0;
    let lastResetTime = Date.now();

    // 환영 메시지 전송
    ws.send(JSON.stringify({
      type: 'welcome',
      message: 'WebSocket 연결 성공',
      connectionId: connectionEntry.id,
      timestamp: new Date().toISOString()
    }));

    console.log(`새 WebSocket 연결: ${connectionEntry.id} (${clientIp})`);

    // 메시지 이벤트 핸들러
    ws.on('message', (data) => {
      try {
        // 메시지 크기 제한 검증
        if (data.length > MESSAGE_SIZE_LIMIT) {
          ws.send(JSON.stringify({
            type: 'error',
            message: '메시지 크기가 1MB를 초과했습니다',
            timestamp: new Date().toISOString()
          }));
          return;
        }

        // Rate limiting 체크
        const now = Date.now();
        if (now - lastResetTime > 1000) {
          // 1초마다 리셋
          messageCount = 0;
          lastResetTime = now;
        }

        messageCount++;
        if (messageCount > MAX_MESSAGES_PER_SECOND) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Rate limit 초과 (100 msg/s)',
            timestamp: new Date().toISOString()
          }));
          ws.close();
          return;
        }

        // JSON 파싱
        let message;
        try {
          message = JSON.parse(data);
        } catch (e) {
          // JSON이 아닌 경우 문자열로 처리
          message = { type: 'echo', message: data.toString() };
        }

        // 메시지 카운트 업데이트
        const connection = store.connections.find(c => c.id === connectionEntry.id);
        if (connection) {
          connection.messageCount++;
        }

        // 통계 업데이트
        updateStatistics({
          totalWebSocketMessages: store.statistics.totalWebSocketMessages + 1
        });

        // 타입별 메시지 처리
        switch (message.type) {
          case 'echo':
            // 에코 메시지
            ws.send(JSON.stringify({
              type: 'echo',
              message: message.message,
              timestamp: new Date().toISOString()
            }));
            break;

          case 'ping':
            // Ping/Pong
            ws.send(JSON.stringify({
              type: 'pong',
              timestamp: new Date().toISOString()
            }));
            break;

          default:
            // 알 수 없는 타입은 그대로 에코
            ws.send(JSON.stringify({
              type: 'echo',
              received: message,
              timestamp: new Date().toISOString()
            }));
        }

      } catch (error) {
        console.error('WebSocket 메시지 처리 에러:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: '메시지 처리 중 에러 발생',
          timestamp: new Date().toISOString()
        }));
      }
    });

    // 연결 종료 이벤트 핸들러
    ws.on('close', () => {
      console.log(`WebSocket 연결 종료: ${connectionEntry.id}`);

      // 연결 정보 업데이트
      const connection = store.connections.find(c => c.id === connectionEntry.id);
      if (connection) {
        connection.status = 'disconnected';
        connection.disconnectedAt = new Date().toISOString();
      }

      // 통계 업데이트 (activeWebSockets 감소)
      updateStatistics({
        activeWebSockets: Math.max(0, store.statistics.activeWebSockets - 1)
      });
    });

    // 에러 이벤트 핸들러
    ws.on('error', (error) => {
      console.error(`WebSocket 에러 (${connectionEntry.id}):`, error);
    });
  });

  console.log('WebSocket 서버 초기화 완료');
  return wss;
}

module.exports = { initializeWebSocket };
