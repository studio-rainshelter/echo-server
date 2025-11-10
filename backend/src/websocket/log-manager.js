/**
 * LogManager - 메시지 로그 및 연결 이벤트 관리
 *
 * 역할:
 * - 메시지 로그 저장 (순환 버퍼, 최대 1000개)
 * - 연결 이벤트 저장 (순환 버퍼, 최대 1000개)
 * - 로그 조회 및 필터링
 */

class LogManager {
  constructor(maxSize = 1000) {
    this.messageLogs = [];      // Array<MessageLog>
    this.connectionEvents = []; // Array<ConnectionEvent>
    this.maxSize = maxSize;
  }

  /**
   * 메시지 로그 추가
   * @param {string} connectionId
   * @param {Object} message - 메시지 정보
   * @param {Object} clientInfo - 클라이언트 정보
   */
  addMessageLog(connectionId, message, clientInfo) {
    const logId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const log = {
      logId,
      connectionId,
      messageType: message.type,
      messageContent: message.content,
      messageSize: message.size,
      timestamp: new Date().toISOString(),
      clientInfo: {
        ip: clientInfo.ip,
        userAgent: clientInfo.userAgent || null
      }
    };

    this.messageLogs.push(log);

    // 최대 크기 제한 (FIFO)
    if (this.messageLogs.length > this.maxSize) {
      this.messageLogs.shift();
    }

    return log;
  }

  /**
   * 연결 이벤트 추가
   * @param {string} eventType - 'connected' | 'disconnected'
   * @param {string} connectionId
   * @param {Object} clientInfo
   * @param {string} reason - 연결 해제 이유 (선택)
   */
  addConnectionEvent(eventType, connectionId, clientInfo, reason = null) {
    const eventId = `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const event = {
      eventId,
      eventType,
      connectionId,
      timestamp: new Date().toISOString(),
      clientInfo: {
        ip: clientInfo.ip,
        userAgent: clientInfo.userAgent || null
      },
      reason
    };

    this.connectionEvents.push(event);

    // 최대 크기 제한 (FIFO)
    if (this.connectionEvents.length > this.maxSize) {
      this.connectionEvents.shift();
    }

    return event;
  }

  /**
   * 최근 메시지 로그 조회
   * @param {number} limit - 조회할 로그 개수
   * @returns {Array}
   */
  getRecentLogs(limit = 100) {
    const start = Math.max(0, this.messageLogs.length - limit);
    return this.messageLogs.slice(start);
  }

  /**
   * 특정 연결의 로그 조회
   * @param {string} connectionId
   * @returns {Array}
   */
  getLogsByConnectionId(connectionId) {
    return this.messageLogs.filter(log => log.connectionId === connectionId);
  }

  /**
   * 모든 메시지 로그 조회
   * @returns {Array}
   */
  getAllLogs() {
    return [...this.messageLogs];
  }

  /**
   * 연결 이벤트 조회
   * @param {number} limit - 조회할 이벤트 개수
   * @returns {Array}
   */
  getConnectionEvents(limit = 100) {
    const start = Math.max(0, this.connectionEvents.length - limit);
    return this.connectionEvents.slice(start);
  }

  /**
   * 로그 통계 조회
   * @returns {Object}
   */
  getLogStats() {
    return {
      totalMessageLogs: this.messageLogs.length,
      totalConnectionEvents: this.connectionEvents.length,
      maxSize: this.maxSize
    };
  }
}

module.exports = LogManager;
