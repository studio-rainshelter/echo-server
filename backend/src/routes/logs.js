/**
 * Logs API Routes
 *
 * T027-T028: 메시지 로그 조회 REST API
 * - GET /api/logs/messages - 메시지 로그 조회
 * - 쿼리 파라미터: limit, connectionId
 */

const express = require('express');
const router = express.Router();

// LogManager와 ConnectionManager는 server.js에서 주입됨
let logManager;
let connectionManager;

/**
 * LogManager 인스턴스 설정
 */
function setLogManager(manager) {
  logManager = manager;
}

/**
 * ConnectionManager 인스턴스 설정
 */
function setConnectionManager(manager) {
  connectionManager = manager;
}

/**
 * GET /api/logs/messages
 * 메시지 로그 조회
 *
 * Query Parameters:
 * - limit (number, optional): 조회할 로그 개수 (기본: 100, 최대: 1000)
 * - connectionId (string, optional): 특정 연결의 로그만 조회
 */
router.get('/messages', (req, res) => {
  try {
    if (!logManager) {
      return res.status(500).json({
        success: false,
        error: 'LogManager가 초기화되지 않았습니다'
      });
    }

    // 쿼리 파라미터 파싱
    const limit = parseInt(req.query.limit) || 100;
    const connectionId = req.query.connectionId;

    // limit 유효성 검증
    if (limit < 1 || limit > 1000) {
      return res.status(400).json({
        success: false,
        error: 'limit은 1에서 1000 사이여야 합니다'
      });
    }

    let logs;

    // connectionId가 있으면 특정 연결의 로그만 조회
    if (connectionId) {
      logs = logManager.getLogsByConnectionId(connectionId);

      // limit 적용
      if (logs.length > limit) {
        logs = logs.slice(-limit); // 최신 limit개만
      }
    } else {
      // 전체 로그에서 최근 limit개 조회
      logs = logManager.getRecentLogs(limit);
    }

    // 응답
    res.json({
      success: true,
      data: {
        logs,
        total: logs.length,
        limit,
        connectionId: connectionId || null
      }
    });

  } catch (error) {
    console.error('로그 조회 에러:', error);
    res.status(500).json({
      success: false,
      error: '로그 조회 중 에러 발생'
    });
  }
});

/**
 * GET /api/logs/events
 * 연결 이벤트 조회
 *
 * Query Parameters:
 * - limit (number, optional): 조회할 이벤트 개수 (기본: 100, 최대: 1000)
 */
router.get('/events', (req, res) => {
  try {
    if (!logManager) {
      return res.status(500).json({
        success: false,
        error: 'LogManager가 초기화되지 않았습니다'
      });
    }

    const limit = parseInt(req.query.limit) || 100;

    if (limit < 1 || limit > 1000) {
      return res.status(400).json({
        success: false,
        error: 'limit은 1에서 1000 사이여야 합니다'
      });
    }

    const events = logManager.getConnectionEvents(limit);

    res.json({
      success: true,
      data: {
        events,
        total: events.length,
        limit
      }
    });

  } catch (error) {
    console.error('이벤트 조회 에러:', error);
    res.status(500).json({
      success: false,
      error: '이벤트 조회 중 에러 발생'
    });
  }
});

/**
 * GET /api/logs/stats
 * 로그 통계 조회
 */
router.get('/stats', (req, res) => {
  try {
    if (!logManager) {
      return res.status(500).json({
        success: false,
        error: 'LogManager가 초기화되지 않았습니다'
      });
    }

    const stats = logManager.getLogStats();

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
  setLogManager,
  setConnectionManager
};
