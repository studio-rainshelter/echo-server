const { store, addRequest, addResponse, updateStatistics, addConnection } = require('../../src/utils/store');

describe('Store - 인메모리 저장소', () => {
  beforeEach(() => {
    // 각 테스트 전에 store 초기화
    store.requests = [];
    store.responses = [];
    store.connections = [];
    store.statistics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      activeWebSockets: 0,
      totalWebSocketMessages: 0,
      uptime: 0,
      lastUpdated: new Date().toISOString()
    };
  });

  describe('addRequest - 순환 버퍼 테스트', () => {
    test('요청을 정상적으로 추가한다', () => {
      const request = {
        method: 'GET',
        path: '/api/echo',
        query: { message: 'hello' },
        headers: {},
        body: null,
        clientIp: '127.0.0.1'
      };

      const entry = addRequest(request);

      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('timestamp');
      expect(entry.method).toBe('GET');
      expect(store.requests.length).toBe(1);
    });

    test('1000개 초과 시 가장 오래된 요청을 제거한다', () => {
      // 1001개 요청 추가
      for (let i = 0; i < 1001; i++) {
        addRequest({
          method: 'GET',
          path: `/api/test/${i}`,
          query: {},
          headers: {},
          body: null,
          clientIp: '127.0.0.1'
        });
      }

      // 최대 1000개만 유지
      expect(store.requests.length).toBe(1000);

      // 첫 번째 요청은 제거되고, 마지막 요청은 유지됨
      expect(store.requests[0].path).toBe('/api/test/1');
      expect(store.requests[999].path).toBe('/api/test/1000');
    });
  });

  describe('addResponse', () => {
    test('응답을 정상적으로 추가한다', () => {
      const requestEntry = addRequest({
        method: 'POST',
        path: '/api/echo',
        query: {},
        headers: {},
        body: { data: 'test' },
        clientIp: '127.0.0.1'
      });

      const response = {
        requestId: requestEntry.id,
        statusCode: 200,
        headers: { 'content-type': 'application/json' },
        body: { echo: { data: 'test' } },
        duration: 23
      };

      const entry = addResponse(response);

      expect(entry).toHaveProperty('id');
      expect(entry.requestId).toBe(requestEntry.id);
      expect(entry.statusCode).toBe(200);
      expect(store.responses.length).toBe(1);
    });
  });

  describe('updateStatistics', () => {
    test('통계를 정상적으로 업데이트한다', () => {
      updateStatistics({
        totalRequests: 10,
        successfulRequests: 8,
        failedRequests: 2
      });

      expect(store.statistics.totalRequests).toBe(10);
      expect(store.statistics.successfulRequests).toBe(8);
      expect(store.statistics.failedRequests).toBe(2);
      expect(store.statistics.lastUpdated).toBeDefined();
    });

    test('uptime이 자동으로 갱신된다', () => {
      const initialUptime = store.statistics.uptime;
      updateStatistics({ totalRequests: 5 });

      expect(store.statistics.uptime).toBeGreaterThanOrEqual(initialUptime);
    });
  });

  describe('addConnection', () => {
    test('WebSocket 연결을 정상적으로 추가한다', () => {
      const connection = {
        clientIp: '192.168.1.100'
      };

      const entry = addConnection(connection);

      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('connectedAt');
      expect(entry.status).toBe('connected');
      expect(entry.messageCount).toBe(0);
      expect(entry.disconnectedAt).toBeNull();
      expect(store.connections.length).toBe(1);
    });
  });
});
