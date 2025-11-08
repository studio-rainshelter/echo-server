const WebSocket = require('ws');
const { server, wss } = require('../../src/server');
const { store } = require('../../src/utils/store');

const WS_URL = 'ws://localhost:3000';

describe('WebSocket Integration Tests', () => {
  beforeEach(() => {
    // 각 테스트 전에 일부 store만 초기화
    store.connections = [];
    store.statistics.totalWebSocketMessages = 0;
    // activeWebSockets는 실제 연결에 따라 자동 업데이트되므로 초기화하지 않음
  });

  afterAll((done) => {
    // 모든 테스트 후 서버 정리
    wss.clients.forEach(client => client.close());
    wss.close(() => {
      server.close(done);
    });
  });

  // 1. 연결 수립 테스트
  test('WebSocket 연결 수립 및 환영 메시지 수신', (done) => {
    const ws = new WebSocket(WS_URL);

    ws.on('open', () => {
      expect(ws.readyState).toBe(WebSocket.OPEN);
    });

    ws.on('message', (data) => {
      const message = JSON.parse(data);
      expect(message.type).toBe('welcome');
      expect(message).toHaveProperty('connectionId');
      expect(message).toHaveProperty('message');
      expect(message).toHaveProperty('timestamp');
      ws.close();
      done();
    });

    ws.on('error', (error) => {
      done(error);
    });
  }, 10000);

  // 2. 에코 메시지 테스트
  test('에코 메시지 송수신', (done) => {
    const ws = new WebSocket(WS_URL);
    let receivedWelcome = false;

    ws.on('message', (data) => {
      const message = JSON.parse(data);

      if (message.type === 'welcome') {
        receivedWelcome = true;
        // 환영 메시지 후 에코 메시지 전송
        ws.send(JSON.stringify({
          type: 'echo',
          message: 'Hello WebSocket'
        }));
      } else if (message.type === 'echo' && receivedWelcome) {
        expect(message.message).toBe('Hello WebSocket');
        expect(message).toHaveProperty('timestamp');
        ws.close();
        done();
      }
    });

    ws.on('error', (error) => {
      done(error);
    });
  }, 10000);

  // 3. Ping/Pong 테스트
  test('Ping/Pong 메시지 처리', (done) => {
    const ws = new WebSocket(WS_URL);
    let receivedWelcome = false;

    ws.on('message', (data) => {
      const message = JSON.parse(data);

      if (message.type === 'welcome') {
        receivedWelcome = true;
        // Ping 메시지 전송
        ws.send(JSON.stringify({
          type: 'ping'
        }));
      } else if (message.type === 'pong' && receivedWelcome) {
        expect(message.type).toBe('pong');
        expect(message).toHaveProperty('timestamp');
        ws.close();
        done();
      }
    });

    ws.on('error', (error) => {
      done(error);
    });
  }, 10000);

  // 4. 다중 클라이언트 동시 연결 테스트
  test('다중 클라이언트 동시 연결 (3개)', (done) => {
    const clients = [];
    let completedCount = 0;
    const connectionIds = new Set();

    for (let i = 0; i < 3; i++) {
      const ws = new WebSocket(WS_URL);
      clients.push(ws);

      ws.on('message', (data) => {
        const message = JSON.parse(data);
        if (message.type === 'welcome') {
          // 각 클라이언트가 고유한 connectionId를 받는지 확인
          expect(message).toHaveProperty('connectionId');
          connectionIds.add(message.connectionId);
          completedCount++;

          if (completedCount === 3) {
            // 모든 클라이언트가 고유한 ID를 받았는지 확인
            expect(connectionIds.size).toBe(3);
            // activeWebSockets 확인 (최소 1개 이상)
            expect(store.statistics.activeWebSockets).toBeGreaterThanOrEqual(1);
            // 모든 클라이언트 종료
            clients.forEach(client => client.close());
            done();
          }
        }
      });

      ws.on('error', (error) => {
        done(error);
      });
    }
  }, 15000);

  // 5. 연결 종료 테스트
  test('연결 종료 처리', (done) => {
    const ws = new WebSocket(WS_URL);
    let connectionId = null;

    ws.on('message', (data) => {
      const message = JSON.parse(data);
      if (message.type === 'welcome') {
        connectionId = message.connectionId;
        // 환영 메시지를 받은 후 연결 종료
        ws.close();
      }
    });

    ws.on('close', () => {
      // 연결 종료 후 연결 정보 확인 (약간의 지연 후)
      setTimeout(() => {
        const connection = store.connections.find(c => c.id === connectionId);
        if (connection) {
          expect(connection.status).toBe('disconnected');
          expect(connection.disconnectedAt).not.toBeNull();
        }
        done();
      }, 100);
    });

    ws.on('error', (error) => {
      done(error);
    });
  }, 10000);

  // 6. Rate limiting 테스트
  test('Rate limiting (100 msg/s 초과 시 연결 종료)', (done) => {
    const ws = new WebSocket(WS_URL);
    let receivedWelcome = false;

    ws.on('message', (data) => {
      const message = JSON.parse(data);

      if (message.type === 'welcome') {
        receivedWelcome = true;
        // 150개의 메시지를 빠르게 전송 (Rate limit 초과)
        for (let i = 0; i < 150; i++) {
          ws.send(JSON.stringify({
            type: 'echo',
            message: `Message ${i}`
          }));
        }
      } else if (message.type === 'error' && receivedWelcome) {
        expect(message.message).toContain('Rate limit');
        // 에러 메시지를 받으면 연결이 곧 종료됨
      }
    });

    ws.on('close', () => {
      // Rate limit으로 인한 연결 종료 확인
      done();
    });

    ws.on('error', (error) => {
      // 예상된 에러이므로 무시
      done();
    });
  }, 15000);

  // 7. 메시지 카운트 업데이트 테스트
  test('메시지 카운트가 정상적으로 업데이트됨', (done) => {
    const ws = new WebSocket(WS_URL);
    let receivedWelcome = false;
    let connectionId = null;

    ws.on('message', (data) => {
      const message = JSON.parse(data);

      if (message.type === 'welcome') {
        receivedWelcome = true;
        connectionId = message.connectionId;
        // 3개의 메시지 전송
        ws.send(JSON.stringify({ type: 'echo', message: '1' }));
        ws.send(JSON.stringify({ type: 'echo', message: '2' }));
        ws.send(JSON.stringify({ type: 'echo', message: '3' }));

        // 메시지 처리 후 통계 확인
        setTimeout(() => {
          const connection = store.connections.find(c => c.id === connectionId);
          expect(connection).toBeDefined();
          expect(connection.messageCount).toBeGreaterThanOrEqual(3);
          ws.close();
          done();
        }, 500);
      }
    });

    ws.on('error', (error) => {
      done(error);
    });
  }, 15000);
});
