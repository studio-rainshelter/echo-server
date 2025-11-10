/**
 * StatisticsManager 단위 테스트
 *
 * T038: StatisticsManager 기능 검증
 * - 연결 통계 추적
 * - 메시지 통계 추적
 * - 업타임 계산
 */

const statisticsManager = require('../../src/websocket/statistics-manager');

describe('StatisticsManager', () => {
  beforeEach(() => {
    // 각 테스트 전에 통계 초기화
    statisticsManager.reset();
  });

  describe('incrementConnection', () => {
    test('should increment connection counts', () => {
      const initialStats = statisticsManager.getStats();
      expect(initialStats.currentActiveConnections).toBe(0);
      expect(initialStats.totalConnectionsAttempted).toBe(0);

      statisticsManager.incrementConnection();

      const stats = statisticsManager.getStats();
      expect(stats.currentActiveConnections).toBe(1);
      expect(stats.totalConnectionsAttempted).toBe(1);
    });

    test('should increment multiple connections', () => {
      statisticsManager.incrementConnection();
      statisticsManager.incrementConnection();
      statisticsManager.incrementConnection();

      const stats = statisticsManager.getStats();
      expect(stats.currentActiveConnections).toBe(3);
      expect(stats.totalConnectionsAttempted).toBe(3);
    });
  });

  describe('decrementConnection', () => {
    test('should decrement active connections', () => {
      statisticsManager.incrementConnection();
      statisticsManager.incrementConnection();

      expect(statisticsManager.getStats().currentActiveConnections).toBe(2);

      statisticsManager.decrementConnection();

      expect(statisticsManager.getStats().currentActiveConnections).toBe(1);
    });

    test('should not go below zero', () => {
      statisticsManager.decrementConnection();
      statisticsManager.decrementConnection();

      const stats = statisticsManager.getStats();
      expect(stats.currentActiveConnections).toBe(0);
    });

    test('should not affect totalConnectionsAttempted', () => {
      statisticsManager.incrementConnection();
      statisticsManager.incrementConnection();
      statisticsManager.decrementConnection();

      const stats = statisticsManager.getStats();
      expect(stats.totalConnectionsAttempted).toBe(2);
      expect(stats.currentActiveConnections).toBe(1);
    });
  });

  describe('incrementMessagesReceived', () => {
    test('should increment received message count', () => {
      expect(statisticsManager.getStats().totalMessagesReceived).toBe(0);

      statisticsManager.incrementMessagesReceived();
      statisticsManager.incrementMessagesReceived();

      expect(statisticsManager.getStats().totalMessagesReceived).toBe(2);
    });
  });

  describe('incrementMessagesSent', () => {
    test('should increment sent message count', () => {
      expect(statisticsManager.getStats().totalMessagesSent).toBe(0);

      statisticsManager.incrementMessagesSent();
      statisticsManager.incrementMessagesSent();
      statisticsManager.incrementMessagesSent();

      expect(statisticsManager.getStats().totalMessagesSent).toBe(3);
    });
  });

  describe('setActiveConnections', () => {
    test('should set active connection count directly', () => {
      statisticsManager.setActiveConnections(10);

      expect(statisticsManager.getStats().currentActiveConnections).toBe(10);
    });

    test('should override previous count', () => {
      statisticsManager.incrementConnection();
      statisticsManager.incrementConnection();

      statisticsManager.setActiveConnections(5);

      expect(statisticsManager.getStats().currentActiveConnections).toBe(5);
    });
  });

  describe('getStats', () => {
    test('should return all statistics', () => {
      const stats = statisticsManager.getStats();

      expect(stats).toHaveProperty('currentActiveConnections');
      expect(stats).toHaveProperty('totalConnectionsAttempted');
      expect(stats).toHaveProperty('totalMessagesReceived');
      expect(stats).toHaveProperty('totalMessagesSent');
      expect(stats).toHaveProperty('serverStartedAt');
      expect(stats).toHaveProperty('uptimeSeconds');
    });

    test('should calculate uptime correctly', (done) => {
      statisticsManager.reset();

      setTimeout(() => {
        const stats = statisticsManager.getStats();
        expect(stats.uptimeSeconds).toBeGreaterThanOrEqual(1);
        expect(stats.uptimeSeconds).toBeLessThan(3);
        done();
      }, 1000);
    }, 5000);

    test('should have valid ISO 8601 timestamp', () => {
      const stats = statisticsManager.getStats();
      const timestamp = new Date(stats.serverStartedAt);

      expect(timestamp.toString()).not.toBe('Invalid Date');
      expect(stats.serverStartedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('reset', () => {
    test('should reset all statistics', () => {
      // 통계 증가
      statisticsManager.incrementConnection();
      statisticsManager.incrementConnection();
      statisticsManager.incrementMessagesReceived();
      statisticsManager.incrementMessagesSent();

      // 리셋
      statisticsManager.reset();

      const stats = statisticsManager.getStats();
      expect(stats.currentActiveConnections).toBe(0);
      expect(stats.totalConnectionsAttempted).toBe(0);
      expect(stats.totalMessagesReceived).toBe(0);
      expect(stats.totalMessagesSent).toBe(0);
      expect(stats.uptimeSeconds).toBe(0);
    });
  });

  describe('singleton pattern', () => {
    test('should maintain same instance across requires', () => {
      const instance1 = require('../../src/websocket/statistics-manager');
      const instance2 = require('../../src/websocket/statistics-manager');

      instance1.incrementConnection();

      expect(instance2.getStats().currentActiveConnections).toBe(1);
      expect(instance1).toBe(instance2);
    });
  });

  describe('concurrent operations', () => {
    test('should handle multiple simultaneous operations', () => {
      // 동시에 여러 작업 수행
      for (let i = 0; i < 10; i++) {
        statisticsManager.incrementConnection();
        statisticsManager.incrementMessagesReceived();
        statisticsManager.incrementMessagesSent();
      }

      for (let i = 0; i < 5; i++) {
        statisticsManager.decrementConnection();
      }

      const stats = statisticsManager.getStats();
      expect(stats.currentActiveConnections).toBe(5);
      expect(stats.totalConnectionsAttempted).toBe(10);
      expect(stats.totalMessagesReceived).toBe(10);
      expect(stats.totalMessagesSent).toBe(10);
    });
  });
});
