/**
 * Connections API Routes
 *
 * T041: 활성 연결 목록 조회 REST API
 * - GET /api/connections - 활성 연결 목록 조회
 */

const express = require('express');
const router = express.Router();

// ConnectionManager는 server.js에서 주입됨
let connectionManager;

/**
 * ConnectionManager 인스턴스 설정
 */
function setConnectionManager(manager) {
  connectionManager = manager;
}

/**
 * GET /api/connections
 * 활성 연결 목록 조회
 *
 * Response:
 * - connections: 활성 연결 배열
 *   - connectionId: 연결 ID
 *   - clientIp: 클라이언트 IP
 *   - userAgent: User-Agent
 *   - connectedAt: 연결 시각 (ISO 8601)
 *   - lastActivityAt: 마지막 활동 시각 (ISO 8601)
 * - total: 총 활성 연결 수
 */
router.get('/', (req, res) => {
  try {
    if (!connectionManager) {
      return res.status(500).json({
        success: false,
        error: 'ConnectionManager가 초기화되지 않았습니다'
      });
    }

    const connections = connectionManager.getActiveConnections();

    res.json({
      success: true,
      data: {
        connections,
        total: connections.length
      }
    });

  } catch (error) {
    console.error('연결 목록 조회 에러:', error);
    res.status(500).json({
      success: false,
      error: '연결 목록 조회 중 에러 발생'
    });
  }
});

/**
 * GET /api/connections/:connectionId
 * 특정 연결 정보 조회
 */
router.get('/:connectionId', (req, res) => {
  try {
    if (!connectionManager) {
      return res.status(500).json({
        success: false,
        error: 'ConnectionManager가 초기화되지 않았습니다'
      });
    }

    const { connectionId } = req.params;
    const connection = connectionManager.getConnection(connectionId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: '연결을 찾을 수 없습니다'
      });
    }

    // WebSocket 객체 제외하고 반환
    const connectionInfo = {
      connectionId: connection.connectionId,
      clientIp: connection.clientIp,
      userAgent: connection.userAgent,
      connectedAt: new Date(connection.connectedAt).toISOString(),
      lastActivityAt: new Date(connection.lastActivityAt).toISOString()
    };

    res.json({
      success: true,
      data: connectionInfo
    });

  } catch (error) {
    console.error('연결 정보 조회 에러:', error);
    res.status(500).json({
      success: false,
      error: '연결 정보 조회 중 에러 발생'
    });
  }
});

module.exports = {
  router,
  setConnectionManager
};
