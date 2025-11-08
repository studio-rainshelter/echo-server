const request = require('supertest');
const { app, server, wss } = require('../../src/server');
const { store } = require('../../src/utils/store');

describe('API Contract Tests - 10개 엔드포인트', () => {
  // 각 테스트 후 서버 정리
  afterAll((done) => {
    wss.close(() => {
      server.close(done);
    });
  });

  beforeEach(() => {
    // 각 테스트 전에 store 초기화
    store.requests = [];
    store.responses = [];
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

  // 1. GET /api/echo - 쿼리 파라미터 에코
  test('GET /api/echo - 쿼리 파라미터 에코', async () => {
    const response = await request(app)
      .get('/api/echo?message=hello&name=world')
      .expect(200)
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('echo');
    expect(response.body.echo.query).toEqual({ message: 'hello', name: 'world' });
    expect(response.body).toHaveProperty('timestamp');
  });

  // 2. POST /api/echo - Body 데이터 에코
  test('POST /api/echo - Body 데이터 에코', async () => {
    const testData = { data: 'test', number: 123 };
    const response = await request(app)
      .post('/api/echo')
      .send(testData)
      .expect(200)
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('echo');
    expect(response.body.echo.body).toEqual(testData);
    expect(response.body).toHaveProperty('timestamp');
  });

  // 3. GET /api/users - Mock 사용자 목록
  test('GET /api/users - Mock 사용자 목록 반환', async () => {
    const response = await request(app)
      .get('/api/users')
      .expect(200)
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('users');
    expect(Array.isArray(response.body.users)).toBe(true);
    expect(response.body.users.length).toBeGreaterThan(0);
    expect(response.body).toHaveProperty('total');
    expect(response.body.total).toBe(response.body.users.length);

    // 첫 번째 사용자 스키마 검증
    const firstUser = response.body.users[0];
    expect(firstUser).toHaveProperty('id');
    expect(firstUser).toHaveProperty('name');
    expect(firstUser).toHaveProperty('email');
  });

  // 4. POST /api/users - 사용자 생성 시뮬레이션
  test('POST /api/users - 사용자 생성 (201 상태 코드)', async () => {
    const newUser = { name: 'Test User', email: 'test@example.com' };
    const response = await request(app)
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user).toHaveProperty('id');
    expect(response.body.user.name).toBe(newUser.name);
    expect(response.body.user.email).toBe(newUser.email);
    expect(response.body.user).toHaveProperty('createdAt');
  });

  // 5. GET /api/status - 서버 상태 및 통계
  test('GET /api/status - 서버 상태 및 통계 스키마 검증', async () => {
    const response = await request(app)
      .get('/api/status')
      .expect(200)
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('status');
    expect(response.body.status).toBe('running');
    expect(response.body).toHaveProperty('uptime');
    expect(typeof response.body.uptime).toBe('number');

    // 통계 스키마 검증
    expect(response.body).toHaveProperty('statistics');
    const stats = response.body.statistics;
    expect(stats).toHaveProperty('totalRequests');
    expect(stats).toHaveProperty('successfulRequests');
    expect(stats).toHaveProperty('failedRequests');
    expect(stats).toHaveProperty('activeWebSockets');
    expect(stats).toHaveProperty('totalWebSocketMessages');
    expect(stats).toHaveProperty('lastUpdated');
  });

  // 6. POST /api/json - JSON 데이터 처리
  test('POST /api/json - JSON 데이터 처리', async () => {
    const testData = { key: 'value', nested: { foo: 'bar' } };
    const response = await request(app)
      .post('/api/json')
      .send(testData)
      .expect(200)
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('received');
    expect(response.body.received).toEqual(testData);
    expect(response.body).toHaveProperty('processed');
    expect(response.body.processed).toBe(true);
    expect(response.body).toHaveProperty('timestamp');
  });

  // 7. GET /api/delay/:ms - 지연된 응답 (2초)
  test('GET /api/delay/2000 - 2초 지연 검증', async () => {
    const startTime = Date.now();
    const response = await request(app)
      .get('/api/delay/2000')
      .expect(200)
      .expect('Content-Type', /json/);

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(duration).toBeGreaterThanOrEqual(2000);
    expect(duration).toBeLessThan(2500); // 2.5초 이내
    expect(response.body).toHaveProperty('message');
    expect(response.body.delay).toBe(2000);
  }, 10000); // 10초 타임아웃

  test('GET /api/delay/15000 - 잘못된 파라미터 (10000ms 초과)', async () => {
    const response = await request(app)
      .get('/api/delay/15000')
      .expect(400)
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error.code).toBe(400);
  });

  // 8. PUT /api/update/:id - 업데이트 시뮬레이션
  test('PUT /api/update/:id - 업데이트 시뮬레이션', async () => {
    const updateData = { name: 'Updated Name', status: 'active' };
    const response = await request(app)
      .put('/api/update/123')
      .send(updateData)
      .expect(200)
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('id');
    expect(response.body.id).toBe('123');
    expect(response.body).toHaveProperty('updates');
    expect(response.body.updates).toEqual(updateData);
  });

  // 9. DELETE /api/delete/:id - 삭제 시뮬레이션
  test('DELETE /api/delete/:id - 삭제 시뮬레이션', async () => {
    const response = await request(app)
      .delete('/api/delete/456')
      .expect(200)
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('id');
    expect(response.body.id).toBe('456');
    expect(response.body).toHaveProperty('timestamp');
  });

  // 10. GET /api/error/:code - 에러 응답 테스트
  test('GET /api/error/404 - 404 에러 응답', async () => {
    const response = await request(app)
      .get('/api/error/404')
      .expect(404)
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error.code).toBe(404);
    expect(response.body.error).toHaveProperty('message');
    expect(response.body.error).toHaveProperty('timestamp');
  });

  test('GET /api/error/500 - 500 에러 응답', async () => {
    const response = await request(app)
      .get('/api/error/500')
      .expect(500)
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error.code).toBe(500);
  });

  // 11. GET /api/logs - 로그 조회
  test('GET /api/logs - 로그 조회 (limit 파라미터)', async () => {
    // 먼저 몇 개의 요청을 만들어서 로그 생성
    await request(app).get('/api/echo?test=1');
    await request(app).get('/api/echo?test=2');

    const response = await request(app)
      .get('/api/logs?limit=10')
      .expect(200)
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('requests');
    expect(response.body).toHaveProperty('responses');
    expect(response.body).toHaveProperty('total');
    expect(Array.isArray(response.body.requests)).toBe(true);
    expect(Array.isArray(response.body.responses)).toBe(true);
  });

  test('GET /api/logs - 기본 limit (파라미터 없음)', async () => {
    const response = await request(app)
      .get('/api/logs')
      .expect(200)
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('requests');
    expect(response.body).toHaveProperty('responses');
  });
});
