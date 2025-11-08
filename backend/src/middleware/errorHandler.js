/**
 * 중앙화된 에러 핸들러 미들웨어
 * 모든 에러를 일관된 JSON 형식으로 응답합니다.
 */
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: {
      code: statusCode,
      message: message,
      timestamp: new Date().toISOString()
    }
  });
}

module.exports = { errorHandler };
