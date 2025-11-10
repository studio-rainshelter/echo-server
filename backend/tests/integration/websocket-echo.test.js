/**
 * WebSocket Echo Server 통합 테스트
 *
 * User Story 1: 웹소켓 연결 및 메시지 에코
 */

const WebSocket = require('ws');
const http = require('http');
const express = require('express');

describe('WebSocket Echo Server - User Story 1', () => {
  let server;
  let httpServer;
  let wss;
  const PORT = 3999; // 테스트용 포트

  beforeAll((done) => {
    // 테스트용 Express 서버 생성
    const app = express();
    httpServer = http.createServer(app);

    // WebSocket 서버 설정
    const ConnectionManager = require('../../src/websocket/connection-manager');
    const LogManager = require('../../src/websocket/log-manager');
    const statisticsManager = require('../../src/websocket/statistics-manager');

    const connectionManager = new ConnectionManager();
    const logManager = new LogManager();

    const WebSocketServer = require('ws').Server;
    wss = new WebSocketServer({ server: httpServer, path: '/ws/echo' });

    wss.on('connection', (ws, req) => {
      const clientIp = req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      // 연결 추가
      const connectionId = connectionManager.addConnection(ws, {
        ip: clientIp,
        userAgent
      });

      statisticsManager.incrementConnection();

      // 연결 이벤트 로그
      logManager.addConnectionEvent('connected', connectionId, {
        ip: clientIp,
        userAgent
      });

      // 메시지 핸들러
      ws.on('message', (data, isBinary) => {
        try {
          // 메시지 타입 결정
          let messageType, messageContent;

          if (isBinary) {
            messageType = 'binary';
            messageContent = data;
          } else {
            const dataStr = data.toString();
            try {
              JSON.parse(dataStr);
              messageType = 'json';
              messageContent = dataStr;
            } catch {
              messageType = 'text';
              messageContent = dataStr;
            }
          }

          // 통계 업데이트
          statisticsManager.incrementMessagesReceived();
          connectionManager.updateLastActivity(connectionId);

          // 로그 추가
          logManager.addMessageLog(
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

          // 에코 응답
          ws.send(data, { binary: isBinary });
          statisticsManager.incrementMessagesSent();

        } catch (error) {
          console.error('Message processing error:', error);
        }
      });

      // 연결 종료 핸들러
      ws.on('close', () => {
        connectionManager.removeConnection(connectionId);
        statisticsManager.decrementConnection();

        logManager.addConnectionEvent('disconnected', connectionId, {
          ip: clientIp,
          userAgent
        }, 'client_close');
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });

    httpServer.listen(PORT, () => {
      done();
    });
  });

  afterAll((done) => {
    wss.close(() => {
      httpServer.close(() => {
        done();
      });
    });
  });

  // T011: 텍스트 메시지 에코 테스트
  test('should echo text message', (done) => {
    const ws = new WebSocket(`ws://localhost:${PORT}/ws/echo`);
    const testMessage = 'Hello, WebSocket!';

    ws.on('open', () => {
      ws.send(testMessage);
    });

    ws.on('message', (data) => {
      expect(data.toString()).toBe(testMessage);
      ws.close();
      done();
    });

    ws.on('error', (error) => {
      done(error);
    });
  });

  // T012: JSON 메시지 에코 테스트
  test('should echo JSON message', (done) => {
    const ws = new WebSocket(`ws://localhost:${PORT}/ws/echo`);
    const testMessage = { type: 'ping', timestamp: Date.now() };
    const testMessageStr = JSON.stringify(testMessage);

    ws.on('open', () => {
      ws.send(testMessageStr);
    });

    ws.on('message', (data) => {
      expect(data.toString()).toBe(testMessageStr);
      const parsed = JSON.parse(data.toString());
      expect(parsed.type).toBe('ping');
      ws.close();
      done();
    });

    ws.on('error', (error) => {
      done(error);
    });
  });

  // T013: 바이너리 메시지 에코 테스트
  test('should echo binary message', (done) => {
    const ws = new WebSocket(`ws://localhost:${PORT}/ws/echo`);
    const testBuffer = Buffer.from([0x48, 0x65, 0x6C, 0x6C, 0x6F]); // "Hello"

    ws.on('open', () => {
      ws.send(testBuffer);
    });

    ws.on('message', (data, isBinary) => {
      expect(isBinary).toBe(true);
      expect(Buffer.compare(data, testBuffer)).toBe(0);
      ws.close();
      done();
    });

    ws.on('error', (error) => {
      done(error);
    });
  });

  // T014: 다중 클라이언트 동시 연결 테스트
  test('should handle multiple concurrent connections', (done) => {
    const numClients = 5;
    const clients = [];
    let completedClients = 0;

    for (let i = 0; i < numClients; i++) {
      const ws = new WebSocket(`ws://localhost:${PORT}/ws/echo`);
      const testMessage = `Message from client ${i}`;

      ws.on('open', () => {
        ws.send(testMessage);
      });

      ws.on('message', (data) => {
        expect(data.toString()).toBe(testMessage);
        ws.close();

        completedClients++;
        if (completedClients === numClients) {
          done();
        }
      });

      ws.on('error', (error) => {
        done(error);
      });

      clients.push(ws);
    }
  });

  // 추가: 연결 직후 연결 해제 테스트
  test('should handle connection and disconnection', (done) => {
    const ws = new WebSocket(`ws://localhost:${PORT}/ws/echo`);

    ws.on('open', () => {
      ws.close();
    });

    ws.on('close', () => {
      done();
    });

    ws.on('error', (error) => {
      done(error);
    });
  });
});
