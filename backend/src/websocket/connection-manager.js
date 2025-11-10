/**
 * ConnectionManager - WebSocket 연결 추적 및 관리
 *
 * 역할:
 * - 활성 WebSocket 연결 추적 (Map 기반)
 * - 연결 추가/제거
 * - 연결 정보 조회
 */

class ConnectionManager {
  constructor() {
    // Map<connectionId, Connection>
    this.connections = new Map();
  }

  /**
   * 새로운 연결 추가
   * @param {WebSocket} ws - WebSocket 객체
   * @param {Object} clientInfo - 클라이언트 정보
   * @returns {string} connectionId
   */
  addConnection(ws, clientInfo) {
    const connectionId = `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const connection = {
      connectionId,
      clientIp: clientInfo.ip,
      userAgent: clientInfo.userAgent || null,
      connectedAt: Date.now(),
      lastActivityAt: Date.now(),
      ws
    };

    this.connections.set(connectionId, connection);
    return connectionId;
  }

  /**
   * 연결 제거
   * @param {string} connectionId
   */
  removeConnection(connectionId) {
    this.connections.delete(connectionId);
  }

  /**
   * 연결 정보 조회
   * @param {string} connectionId
   * @returns {Object|undefined}
   */
  getConnection(connectionId) {
    return this.connections.get(connectionId);
  }

  /**
   * 마지막 활동 시각 업데이트
   * @param {string} connectionId
   */
  updateLastActivity(connectionId) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.lastActivityAt = Date.now();
    }
  }

  /**
   * 활성 연결 수 조회
   * @returns {number}
   */
  getActiveConnectionCount() {
    return this.connections.size;
  }

  /**
   * 모든 활성 연결 목록 조회
   * @returns {Array}
   */
  getActiveConnections() {
    const connections = [];

    this.connections.forEach((conn, id) => {
      connections.push({
        connectionId: id,
        clientIp: conn.clientIp,
        userAgent: conn.userAgent,
        connectedAt: new Date(conn.connectedAt).toISOString(),
        lastActivityAt: new Date(conn.lastActivityAt).toISOString()
      });
    });

    return connections;
  }

  /**
   * 타임아웃된 연결 정리 (30초 무응답)
   * @param {number} timeoutMs - 타임아웃 시간 (밀리초)
   * @returns {Array} 제거된 연결 ID 목록
   */
  cleanupStaleConnections(timeoutMs = 30000) {
    const now = Date.now();
    const staleConnections = [];

    this.connections.forEach((conn, id) => {
      if (now - conn.lastActivityAt > timeoutMs) {
        staleConnections.push(id);
      }
    });

    // 타임아웃된 연결 제거
    staleConnections.forEach(id => {
      const conn = this.connections.get(id);
      if (conn && conn.ws) {
        conn.ws.close();
      }
      this.connections.delete(id);
    });

    return staleConnections;
  }
}

module.exports = ConnectionManager;
