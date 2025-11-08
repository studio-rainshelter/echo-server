const express = require('express');
const { store } = require('../utils/store');

const router = express.Router();

// 1. GET /api/echo - 쿼리 파라미터 에코
router.get('/echo', (req, res) => {
  res.json({
    echo: {
      query: req.query
    },
    timestamp: new Date().toISOString()
  });
});

// 2. POST /api/echo - Body 데이터 에코
router.post('/echo', (req, res) => {
  res.json({
    echo: {
      body: req.body
    },
    timestamp: new Date().toISOString()
  });
});

// 3. GET /api/users - Mock 사용자 목록
router.get('/users', (req, res) => {
  const mockUsers = [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' },
    { id: 3, name: 'Charlie', email: 'charlie@example.com' }
  ];
  res.json({
    users: mockUsers,
    total: mockUsers.length,
    timestamp: new Date().toISOString()
  });
});

// 4. POST /api/users - 사용자 생성 시뮬레이션
router.post('/users', (req, res) => {
  const newUser = {
    id: Math.floor(Math.random() * 10000),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  res.status(201).json({
    message: 'User created successfully',
    user: newUser,
    timestamp: new Date().toISOString()
  });
});

// 5. GET /api/status - 서버 상태 및 통계
router.get('/status', (req, res) => {
  res.json({
    status: 'running',
    uptime: Math.floor(process.uptime()),
    statistics: store.statistics,
    timestamp: new Date().toISOString()
  });
});

// 6. POST /api/json - JSON 데이터 처리
router.post('/json', (req, res) => {
  res.json({
    received: req.body,
    processed: true,
    timestamp: new Date().toISOString()
  });
});

// 7. GET /api/delay/:ms - 지연된 응답
router.get('/delay/:ms', (req, res) => {
  const delay = parseInt(req.params.ms, 10);

  // 파라미터 검증 (0-10000ms)
  if (isNaN(delay) || delay < 0 || delay > 10000) {
    return res.status(400).json({
      error: {
        code: 400,
        message: 'Delay must be between 0 and 10000 milliseconds',
        timestamp: new Date().toISOString()
      }
    });
  }

  setTimeout(() => {
    res.json({
      message: `Delayed response after ${delay}ms`,
      delay: delay,
      timestamp: new Date().toISOString()
    });
  }, delay);
});

// 8. PUT /api/update/:id - 업데이트 시뮬레이션
router.put('/update/:id', (req, res) => {
  const id = req.params.id;
  res.json({
    message: 'Resource updated successfully',
    id: id,
    updates: req.body,
    timestamp: new Date().toISOString()
  });
});

// 9. DELETE /api/delete/:id - 삭제 시뮬레이션
router.delete('/delete/:id', (req, res) => {
  const id = req.params.id;
  res.json({
    message: 'Resource deleted successfully',
    id: id,
    timestamp: new Date().toISOString()
  });
});

// 10. GET /api/error/:code - 에러 응답 테스트
router.get('/error/:code', (req, res) => {
  const statusCode = parseInt(req.params.code, 10);

  // 유효한 HTTP 상태 코드 검증
  if (isNaN(statusCode) || statusCode < 100 || statusCode > 599) {
    return res.status(400).json({
      error: {
        code: 400,
        message: 'Invalid status code. Must be between 100 and 599',
        timestamp: new Date().toISOString()
      }
    });
  }

  res.status(statusCode).json({
    error: {
      code: statusCode,
      message: `Simulated error with status code ${statusCode}`,
      timestamp: new Date().toISOString()
    }
  });
});

// 11. GET /api/logs - 요청/응답 로그 조회
router.get('/logs', (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 100;
  const recentRequests = store.requests.slice(-limit);
  const recentResponses = store.responses.slice(-limit);

  res.json({
    requests: recentRequests,
    responses: recentResponses,
    total: {
      requests: store.requests.length,
      responses: store.responses.length
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
