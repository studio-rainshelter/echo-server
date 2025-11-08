const EventEmitter = require('events');
const { addRequest, addResponse, updateStatistics, store } = require('../utils/store');

// 이벤트 기반 로거
const logEmitter = new EventEmitter();

/**
 * 로깅 미들웨어
 * 모든 HTTP 요청/응답을 비동기적으로 로깅합니다.
 */
function loggingMiddleware(req, res, next) {
  const start = Date.now();

  // 요청 정보 저장
  const requestEntry = addRequest({
    method: req.method,
    path: req.path,
    query: req.query,
    headers: req.headers,
    body: req.body,
    clientIp: req.ip || req.connection.remoteAddress
  });

  // 응답 완료 시 이벤트 핸들러
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;

    // 응답 정보 저장
    const responseEntry = addResponse({
      requestId: requestEntry.id,
      statusCode: statusCode,
      headers: res.getHeaders(),
      body: null, // Body는 미들웨어에서 직접 접근 불가
      duration: duration
    });

    // 통계 업데이트
    const isSuccess = statusCode >= 200 && statusCode < 400;
    updateStatistics({
      totalRequests: store.statistics.totalRequests + 1,
      successfulRequests: isSuccess
        ? store.statistics.successfulRequests + 1
        : store.statistics.successfulRequests,
      failedRequests: !isSuccess
        ? store.statistics.failedRequests + 1
        : store.statistics.failedRequests
    });

    // 로그 이벤트 발생 (WebSocket 브로드캐스트용)
    const logData = {
      request: requestEntry,
      response: responseEntry
    };
    logEmitter.emit('log', logData);
  });

  next();
}

module.exports = {
  loggingMiddleware,
  logEmitter
};
