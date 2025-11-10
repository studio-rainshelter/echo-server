/**
 * Statistics API Routes
 *
 * T040: 서버 통계 조회 REST API
 * - GET /api/statistics - 서버 통계 조회
 */

const express = require('express');
const router = express.Router();

// StatisticsManager와 ConnectionManager는 server.js에서 주입됨
let statisticsManager;
let connectionManager;

/**
 * StatisticsManager 인스턴스 설정
 */
function setStatisticsManager(manager) {
  statisticsManager = manager;
}

/**
 * ConnectionManager 인스턴스 설정
 */
function setConnectionManager(manager) {
  connectionManager = manager;
}

/**
 * GET /api/statistics
 * 서버 통계 조회
 *
 * Response:
 * - currentActiveConnections: 현재 활성 연결 수
 * - totalConnectionsAttempted: 총 연결 시도 횟수
 * - totalMessagesReceived: 총 수신 메시지 수
 * - totalMessagesSent: 총 전송 메시지 수
 * - serverStartedAt: 서버 시작 시각 (ISO 8601)
 * - uptimeSeconds: 서버 가동 시간 (초)
 */
router.get('/', (req, res) => {
  try {
    if (!statisticsManager) {
      return res.status(500).json({
        success: false,
        error: 'StatisticsManager가 초기화되지 않았습니다'
      });
    }

    const stats = statisticsManager.getStats();

    // ConnectionManager에서 실제 활성 연결 수 가져오기
    if (connectionManager) {
      stats.currentActiveConnections = connectionManager.getActiveConnectionCount();
    }

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('통계 조회 에러:', error);
    res.status(500).json({
      success: false,
      error: '통계 조회 중 에러 발생'
    });
  }
});

module.exports = {
  router,
  setStatisticsManager,
  setConnectionManager
};
