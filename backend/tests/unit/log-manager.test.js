/**
 * LogManager 단위 테스트
 *
 * T023: LogManager 기능 검증
 * - 로그 추가
 * - 로그 조회
 * - 1000개 제한 (순환 버퍼)
 */

const LogManager = require('../../src/websocket/log-manager');

describe('LogManager', () => {
  let logManager;

  beforeEach(() => {
    logManager = new LogManager();
  });

  describe('addMessageLog', () => {
    test('should add message log successfully', () => {
      const connectionId = 'conn-123';
      const message = {
        type: 'text',
        content: 'Hello, World!',
        size: 13
      };
      const clientInfo = {
        ip: '127.0.0.1',
        userAgent: 'test-agent'
      };

      const log = logManager.addMessageLog(connectionId, message, clientInfo);

      expect(log).toHaveProperty('logId');
      expect(log.connectionId).toBe(connectionId);
      expect(log.messageType).toBe('text');
      expect(log.messageContent).toBe('Hello, World!');
      expect(log.messageSize).toBe(13);
      expect(log).toHaveProperty('timestamp');
      expect(log.clientInfo.ip).toBe('127.0.0.1');
      expect(log.clientInfo.userAgent).toBe('test-agent');
    });

    test('should handle null userAgent', () => {
      const log = logManager.addMessageLog(
        'conn-123',
        { type: 'text', content: 'test', size: 4 },
        { ip: '127.0.0.1' }
      );

      expect(log.clientInfo.userAgent).toBeNull();
    });
  });

  describe('addConnectionEvent', () => {
    test('should add connection event successfully', () => {
      const eventType = 'connected';
      const connectionId = 'conn-123';
      const clientInfo = {
        ip: '127.0.0.1',
        userAgent: 'test-agent'
      };

      const event = logManager.addConnectionEvent(eventType, connectionId, clientInfo);

      expect(event).toHaveProperty('eventId');
      expect(event.eventType).toBe('connected');
      expect(event.connectionId).toBe(connectionId);
      expect(event).toHaveProperty('timestamp');
      expect(event.clientInfo.ip).toBe('127.0.0.1');
      expect(event.reason).toBeNull();
    });

    test('should add disconnection event with reason', () => {
      const event = logManager.addConnectionEvent(
        'disconnected',
        'conn-123',
        { ip: '127.0.0.1', userAgent: 'test-agent' },
        'client_close'
      );

      expect(event.eventType).toBe('disconnected');
      expect(event.reason).toBe('client_close');
    });
  });

  describe('getRecentLogs', () => {
    test('should return recent logs with default limit', () => {
      // 150개 로그 추가
      for (let i = 0; i < 150; i++) {
        logManager.addMessageLog(
          `conn-${i}`,
          { type: 'text', content: `message ${i}`, size: 10 },
          { ip: '127.0.0.1' }
        );
      }

      const recentLogs = logManager.getRecentLogs();

      expect(recentLogs.length).toBe(100); // 기본 limit 100
      expect(recentLogs[0].messageContent).toBe('message 50'); // 가장 오래된 것
      expect(recentLogs[99].messageContent).toBe('message 149'); // 가장 최신
    });

    test('should return logs with custom limit', () => {
      for (let i = 0; i < 50; i++) {
        logManager.addMessageLog(
          `conn-${i}`,
          { type: 'text', content: `message ${i}`, size: 10 },
          { ip: '127.0.0.1' }
        );
      }

      const recentLogs = logManager.getRecentLogs(10);

      expect(recentLogs.length).toBe(10);
      expect(recentLogs[0].messageContent).toBe('message 40');
      expect(recentLogs[9].messageContent).toBe('message 49');
    });
  });

  describe('getLogsByConnectionId', () => {
    test('should return logs for specific connection', () => {
      logManager.addMessageLog('conn-1', { type: 'text', content: 'msg1', size: 4 }, { ip: '127.0.0.1' });
      logManager.addMessageLog('conn-2', { type: 'text', content: 'msg2', size: 4 }, { ip: '127.0.0.1' });
      logManager.addMessageLog('conn-1', { type: 'text', content: 'msg3', size: 4 }, { ip: '127.0.0.1' });

      const conn1Logs = logManager.getLogsByConnectionId('conn-1');

      expect(conn1Logs.length).toBe(2);
      expect(conn1Logs[0].messageContent).toBe('msg1');
      expect(conn1Logs[1].messageContent).toBe('msg3');
    });

    test('should return empty array for non-existent connection', () => {
      const logs = logManager.getLogsByConnectionId('non-existent');

      expect(logs).toEqual([]);
    });
  });

  describe('circular buffer (1000 logs limit)', () => {
    test('should maintain max 1000 message logs', () => {
      const maxSize = 1000;
      logManager = new LogManager(maxSize);

      // 1200개 로그 추가
      for (let i = 0; i < 1200; i++) {
        logManager.addMessageLog(
          `conn-${i}`,
          { type: 'text', content: `message ${i}`, size: 10 },
          { ip: '127.0.0.1' }
        );
      }

      const allLogs = logManager.getAllLogs();

      expect(allLogs.length).toBe(maxSize);
      // 가장 오래된 200개가 제거되고 최신 1000개만 유지
      expect(allLogs[0].messageContent).toBe('message 200');
      expect(allLogs[999].messageContent).toBe('message 1199');
    });

    test('should maintain max 1000 connection events', () => {
      const maxSize = 1000;
      logManager = new LogManager(maxSize);

      // 1200개 이벤트 추가
      for (let i = 0; i < 1200; i++) {
        logManager.addConnectionEvent(
          i % 2 === 0 ? 'connected' : 'disconnected',
          `conn-${i}`,
          { ip: '127.0.0.1' }
        );
      }

      const allEvents = logManager.getConnectionEvents(2000);

      expect(allEvents.length).toBe(maxSize);
    });
  });

  describe('getLogStats', () => {
    test('should return correct log statistics', () => {
      // 10개 메시지 로그 추가
      for (let i = 0; i < 10; i++) {
        logManager.addMessageLog(`conn-${i}`, { type: 'text', content: `msg${i}`, size: 4 }, { ip: '127.0.0.1' });
      }

      // 5개 연결 이벤트 추가
      for (let i = 0; i < 5; i++) {
        logManager.addConnectionEvent('connected', `conn-${i}`, { ip: '127.0.0.1' });
      }

      const stats = logManager.getLogStats();

      expect(stats.totalMessageLogs).toBe(10);
      expect(stats.totalConnectionEvents).toBe(5);
      expect(stats.maxSize).toBe(1000);
    });
  });

  describe('getConnectionEvents', () => {
    test('should return recent connection events', () => {
      for (let i = 0; i < 20; i++) {
        logManager.addConnectionEvent(
          i % 2 === 0 ? 'connected' : 'disconnected',
          `conn-${i}`,
          { ip: '127.0.0.1' }
        );
      }

      const events = logManager.getConnectionEvents(10);

      expect(events.length).toBe(10);
      expect(events[0].connectionId).toBe('conn-10');
      expect(events[9].connectionId).toBe('conn-19');
    });
  });
});
