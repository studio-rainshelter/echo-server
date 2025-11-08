const crypto = require('crypto');

// UUID v4 생성 함수
const uuidv4 = () => crypto.randomUUID();

// 순환 버퍼 설정
const MAX_LOGS = 1000;

// 인메모리 저장소
const store = {
  requests: [],       // RequestLog[]
  responses: [],      // ResponseLog[]
  connections: [],    // WebSocketConnection[]
  statistics: {       // ServerStatistics (싱글톤)
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    activeWebSockets: 0,
    totalWebSocketMessages: 0,
    uptime: 0,
    lastUpdated: new Date().toISOString()
  }
};

/**
 * 요청 로그 추가 (순환 버퍼)
 * @param {Object} request - 요청 정보
 * @returns {Object} 생성된 RequestLog 엔티티
 */
function addRequest(request) {
  const entry = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    ...request
  };
  store.requests.push(entry);

  // 순환 버퍼: 1000개 초과 시 가장 오래된 항목 제거
  if (store.requests.length > MAX_LOGS) {
    store.requests.shift();
  }

  return entry;
}

/**
 * 응답 로그 추가 (순환 버퍼)
 * @param {Object} response - 응답 정보
 * @returns {Object} 생성된 ResponseLog 엔티티
 */
function addResponse(response) {
  const entry = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    ...response
  };
  store.responses.push(entry);

  // 순환 버퍼: 1000개 초과 시 가장 오래된 항목 제거
  if (store.responses.length > MAX_LOGS) {
    store.responses.shift();
  }

  return entry;
}

/**
 * 서버 통계 업데이트
 * @param {Object} updates - 업데이트할 통계 필드
 */
function updateStatistics(updates) {
  Object.assign(store.statistics, updates, {
    uptime: Math.floor(process.uptime()),
    lastUpdated: new Date().toISOString()
  });
}

/**
 * WebSocket 연결 추가
 * @param {Object} connection - 연결 정보
 * @returns {Object} 생성된 WebSocketConnection 엔티티
 */
function addConnection(connection) {
  const entry = {
    id: uuidv4(),
    connectedAt: new Date().toISOString(),
    disconnectedAt: null,
    status: 'connected',
    messageCount: 0,
    ...connection
  };
  store.connections.push(entry);
  return entry;
}

module.exports = {
  store,
  addRequest,
  addResponse,
  updateStatistics,
  addConnection
};
