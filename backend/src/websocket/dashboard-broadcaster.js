/**
 * Dashboard Broadcaster
 *
 * T031-T032: 대시보드 클라이언트에 실시간 로그 및 통계 브로드캐스트
 *
 * 역할:
 * - 연결된 모든 대시보드 클라이언트 추적
 * - 새로운 메시지 로그 발생 시 브로드캐스트
 * - 연결 이벤트 발생 시 브로드캐스트
 * - 통계 업데이트 브로드캐스트
 */

const WebSocket = require('ws');

class DashboardBroadcaster {
  constructor(logManager, statisticsManager, connectionManager) {
    this.logManager = logManager;
    this.statisticsManager = statisticsManager;
    this.connectionManager = connectionManager;
    this.dashboardClients = new Set();
  }

  /**
   * 대시보드 클라이언트 추가
   * @param {WebSocket} ws
   */
  addClient(ws) {
    this.dashboardClients.add(ws);
    console.log(`✓ 대시보드 클라이언트 연결 (총 ${this.dashboardClients.size}개)`);

    // 연결 직후 현재 상태 전송
    this.sendInitialState(ws);
  }

  /**
   * 대시보드 클라이언트 제거
   * @param {WebSocket} ws
   */
  removeClient(ws) {
    this.dashboardClients.delete(ws);
    console.log(`✓ 대시보드 클라이언트 연결 해제 (총 ${this.dashboardClients.size}개)`);
  }

  /**
   * 초기 상태 전송 (연결 직후)
   * @param {WebSocket} ws
   */
  sendInitialState(ws) {
    if (ws.readyState !== WebSocket.OPEN) return;

    try {
      // 최근 로그 전송
      const recentLogs = this.logManager.getRecentLogs(50);
      ws.send(JSON.stringify({
        type: 'initial_logs',
        data: recentLogs,
        timestamp: new Date().toISOString()
      }));

      // 최근 이벤트 전송
      const recentEvents = this.logManager.getConnectionEvents(50);
      ws.send(JSON.stringify({
        type: 'initial_events',
        data: recentEvents,
        timestamp: new Date().toISOString()
      }));

      // 현재 통계 전송
      const stats = this.statisticsManager.getStats();
      ws.send(JSON.stringify({
        type: 'statistics',
        data: stats,
        timestamp: new Date().toISOString()
      }));

      // 활성 연결 목록 전송
      const activeConnections = this.connectionManager.getActiveConnections();
      ws.send(JSON.stringify({
        type: 'active_connections',
        data: activeConnections,
        timestamp: new Date().toISOString()
      }));

    } catch (error) {
      console.error('초기 상태 전송 에러:', error);
    }
  }

  /**
   * 새 메시지 로그 브로드캐스트
   * @param {Object} log
   */
  broadcastMessageLog(log) {
    this.broadcast({
      type: 'new_message_log',
      data: log,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 연결 이벤트 브로드캐스트
   * @param {Object} event
   */
  broadcastConnectionEvent(event) {
    this.broadcast({
      type: 'connection_event',
      data: event,
      timestamp: new Date().toISOString()
    });

    // 연결 이벤트와 함께 최신 통계도 전송
    this.broadcastStatistics();
  }

  /**
   * 통계 업데이트 브로드캐스트
   */
  broadcastStatistics() {
    const stats = this.statisticsManager.getStats();
    const activeConnections = this.connectionManager.getActiveConnections();

    this.broadcast({
      type: 'statistics',
      data: {
        ...stats,
        currentActiveConnections: activeConnections.length
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 모든 대시보드 클라이언트에 메시지 브로드캐스트
   * @param {Object} message
   */
  broadcast(message) {
    const messageStr = JSON.stringify(message);

    this.dashboardClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(messageStr);
        } catch (error) {
          console.error('브로드캐스트 에러:', error);
        }
      }
    });
  }

  /**
   * 주기적 통계 브로드캐스트 시작 (5초마다)
   */
  startPeriodicBroadcast() {
    this.statsInterval = setInterval(() => {
      if (this.dashboardClients.size > 0) {
        this.broadcastStatistics();
      }
    }, 5000);

    console.log('✓ 주기적 통계 브로드캐스트 시작 (5초 주기)');
  }

  /**
   * 주기적 브로드캐스트 중지
   */
  stopPeriodicBroadcast() {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      console.log('✓ 주기적 통계 브로드캐스트 중지');
    }
  }
}

module.exports = DashboardBroadcaster;
