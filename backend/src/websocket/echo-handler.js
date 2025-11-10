/**
 * Echo Handler - 웹소켓 에코 메시지 처리
 *
 * User Story 1: 외부 클라이언트가 웹소켓을 통해 전송한 메시지를 그대로 응답
 *
 * 기능:
 * - 텍스트/JSON/바이너리 메시지 에코
 * - 클라이언트 정보 추출 (IP, User-Agent)
 * - 메시지 크기 검증 (최대 1MB)
 * - Ping/Pong 메커니즘 (30초 주기)
 * - 연결 추적 및 로깅
 */

const ConnectionManager = require('./connection-manager');
const LogManager = require('./log-manager');
const statisticsManager = require('./statistics-manager');

const MAX_MESSAGE_SIZE = parseInt(process.env.MAX_MESSAGE_SIZE) || 1048576; // 1MB
const PING_INTERVAL = 30000; // 30초

/**
 * 메시지 타입 결정
 * @param {Buffer|string} data
 * @param {boolean} isBinary
 * @returns {string} 'text' | 'json' | 'binary'
 */
function determineMessageType(data, isBinary) {
  if (isBinary) {
    return 'binary';
  }

  const dataStr = data.toString();
  try {
    JSON.parse(dataStr);
    return 'json';
  } catch {
    return 'text';
  }
}

/**
 * Echo Handler 생성
 * @param {ConnectionManager} connectionManager
 * @param {LogManager} logManager
 * @param {DashboardBroadcaster} dashboardBroadcaster (optional)
 * @returns {Function} WebSocket connection handler
 */
function createEchoHandler(connectionManager, logManager, dashboardBroadcaster = null) {
  return function handleConnection(ws, req) {
    // T017: 클라이언트 정보 추출
    const clientIp = req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // T015, T022: 연결 추가 및 추적
    const connectionId = connectionManager.addConnection(ws, {
      ip: clientIp,
      userAgent
    });

    // 통계 업데이트
    statisticsManager.incrementConnection();

    // 연결 이벤트 로그
    const connEvent = logManager.addConnectionEvent('connected', connectionId, {
      ip: clientIp,
      userAgent
    });

    // 대시보드에 브로드캐스트
    if (dashboardBroadcaster) {
      dashboardBroadcaster.broadcastConnectionEvent(connEvent);
    }

    console.log(`✓ WebSocket 연결: ${connectionId} (${clientIp})`);

    // T021: Ping/Pong 메커니즘 (30초 주기)
    const pingInterval = setInterval(() => {
      if (ws.readyState === ws.OPEN) {
        ws.ping();
      }
    }, PING_INTERVAL);

    // Pong 응답 처리
    ws.on('pong', () => {
      connectionManager.updateLastActivity(connectionId);
    });

    // T015, T018: 메시지 핸들러
    ws.on('message', (data, isBinary) => {
      try {
        // T019: 메시지 크기 검증
        if (data.length > MAX_MESSAGE_SIZE) {
          ws.send(JSON.stringify({
            type: 'error',
            message: `메시지 크기가 ${MAX_MESSAGE_SIZE} 바이트를 초과했습니다`,
            timestamp: new Date().toISOString()
          }));
          return;
        }

        // T018: 메시지 타입 결정
        const messageType = determineMessageType(data, isBinary);
        const messageContent = isBinary ? data : data.toString();

        // 통계 및 활동 업데이트
        statisticsManager.incrementMessagesReceived();
        connectionManager.updateLastActivity(connectionId);

        // 로그 추가
        const messageLog = logManager.addMessageLog(
          connectionId,
          {
            type: messageType,
            content: messageContent,
            size: data.length
          },
          {
            ip: clientIp,
            userAgent
          }
        );

        // 대시보드에 브로드캐스트
        if (dashboardBroadcaster) {
          dashboardBroadcaster.broadcastMessageLog(messageLog);
        }

        // T015: 에코 응답 - 받은 메시지를 그대로 전송
        ws.send(data, { binary: isBinary });
        statisticsManager.incrementMessagesSent();

      } catch (error) {
        console.error(`✗ 메시지 처리 에러 (${connectionId}):`, error);
        // T020: 에러 핸들링
        ws.send(JSON.stringify({
          type: 'error',
          message: '메시지 처리 중 에러 발생',
          timestamp: new Date().toISOString()
        }));
      }
    });

    // T020: 연결 종료 이벤트
    ws.on('close', (code, reason) => {
      console.log(`✓ WebSocket 연결 종료: ${connectionId} (코드: ${code})`);

      // Ping 인터벌 정리
      clearInterval(pingInterval);

      // 연결 제거
      connectionManager.removeConnection(connectionId);
      statisticsManager.decrementConnection();

      // 연결 해제 이벤트 로그
      const disconnEvent = logManager.addConnectionEvent('disconnected', connectionId, {
        ip: clientIp,
        userAgent
      }, reason ? reason.toString() : 'client_close');

      // 대시보드에 브로드캐스트
      if (dashboardBroadcaster) {
        dashboardBroadcaster.broadcastConnectionEvent(disconnEvent);
      }
    });

    // T020: 에러 이벤트
    ws.on('error', (error) => {
      console.error(`✗ WebSocket 에러 (${connectionId}):`, error);

      // 에러 로그
      const errorEvent = logManager.addConnectionEvent('disconnected', connectionId, {
        ip: clientIp,
        userAgent
      }, `error: ${error.message}`);

      // 대시보드에 브로드캐스트
      if (dashboardBroadcaster) {
        dashboardBroadcaster.broadcastConnectionEvent(errorEvent);
      }
    });
  };
}

module.exports = { createEchoHandler, determineMessageType };
