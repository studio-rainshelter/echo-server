# Research: 웹소켓 에코 서버 및 대시보드 로깅

**Feature**: 002-websocket-echo-api
**Date**: 2025-11-09
**Purpose**: Phase 0 연구 결과 - 기술 선택, 모범 사례, 구현 패턴

## 연구 항목 및 결과

### 1. WebSocket 메시지 처리 패턴

**연구 목적**: ws 라이브러리를 사용한 웹소켓 메시지 에코 구현 방법

**결정**: 이벤트 기반 메시지 핸들러 패턴 사용

**근거**:
- ws 라이브러리는 Node.js의 EventEmitter 패턴을 따름
- `message` 이벤트 리스너에서 메시지를 수신하고 즉시 `send()`로 응답
- 텍스트/바이너리 데이터 모두 동일한 방식으로 처리 가능
- 비동기 처리로 높은 처리량 보장

**구현 예시**:
```javascript
ws.on('message', (data, isBinary) => {
  // 에코: 받은 메시지를 그대로 전송
  ws.send(data, { binary: isBinary });
});
```

**대안 고려**:
- Stream API 사용: 과도한 복잡성, 에코 서버에는 불필요
- 메시지 큐 사용: 에코 응답에 추가 지연 발생, 요구사항에 부합하지 않음

---

### 2. 메모리 기반 로그 관리 (최대 1000개)

**연구 목적**: 메모리에서 로그를 효율적으로 관리하고 1000개 제한을 적용하는 방법

**결정**: 순환 버퍼(Circular Buffer) 패턴 사용

**근거**:
- JavaScript 배열의 `push()` + `shift()` 조합으로 간단히 구현
- 최대 1000개 유지: `if (logs.length > 1000) logs.shift()`
- O(1) 시간 복잡도로 삽입/삭제 가능
- 메모리 사용량 예측 가능 (최대 1000개 * 평균 메시지 크기)

**구현 전략**:
```javascript
class LogManager {
  constructor(maxSize = 1000) {
    this.logs = [];
    this.maxSize = maxSize;
  }

  addLog(message, clientInfo) {
    this.logs.push({
      id: Date.now() + Math.random(),
      message,
      clientInfo,
      timestamp: new Date().toISOString()
    });

    if (this.logs.length > this.maxSize) {
      this.logs.shift(); // 가장 오래된 로그 제거
    }
  }

  getLogs() {
    return [...this.logs]; // 복사본 반환 (불변성)
  }
}
```

**대안 고려**:
- 링 버퍼 라이브러리: 단순한 기능에 외부 의존성 추가 불필요
- Map 자료구조: 순서 유지가 필요하므로 배열이 더 적합

---

### 3. 실시간 대시보드 업데이트 (2초 이내)

**연구 목적**: 백엔드 → 프론트엔드 실시간 로그 전송 방법

**결정**: Server-Sent Events (SSE) 또는 WebSocket 양방향 통신

**선택**: WebSocket 사용

**근거**:
- 이미 ws 라이브러리를 사용 중이므로 추가 의존성 불필요
- 양방향 통신으로 대시보드에서 필터링/요청 기능 확장 가능
- SSE는 단방향이므로 향후 기능 확장에 제한적
- 브라우저 호환성 우수 (모든 모던 브라우저 지원)

**구현 전략**:
1. 백엔드: 별도의 웹소켓 엔드포인트 생성 (예: `/ws/dashboard`)
2. 메시지 로그 추가 시 연결된 대시보드 클라이언트에 브로드캐스트
3. 프론트엔드: React 컴포넌트에서 웹소켓 연결 및 실시간 상태 업데이트

**대안 고려**:
- Polling (주기적 REST API 호출): 지연 시간 증가, 서버 부하 증가
- Server-Sent Events: 단방향 통신으로 향후 확장성 제한

---

### 4. 웹소켓 연결 관리 및 추적

**연구 목적**: 동시 접속 클라이언트 관리 및 연결/해제 이벤트 추적

**결정**: Map 자료구조를 사용한 연결 관리

**근거**:
- `Map<connectionId, WebSocket>` 형태로 활성 연결 추적
- connectionId는 UUID 또는 `Date.now() + Math.random()` 조합 사용
- 연결 시 Map에 추가, 해제 시 Map에서 제거
- O(1) 시간 복잡도로 빠른 조회/삭제

**구현 전략**:
```javascript
class ConnectionManager {
  constructor() {
    this.connections = new Map();
  }

  addConnection(ws, clientInfo) {
    const id = `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.connections.set(id, { ws, clientInfo, connectedAt: Date.now() });
    return id;
  }

  removeConnection(id) {
    this.connections.delete(id);
  }

  getActiveConnectionCount() {
    return this.connections.size;
  }
}
```

**대안 고려**:
- 배열 사용: 삭제 시 O(n) 시간 복잡도로 비효율적
- WeakMap 사용: 수동 관리가 필요한 경우 부적합

---

### 5. 웹소켓 테스트 전략

**연구 목적**: Jest + ws 클라이언트를 사용한 웹소켓 통합 테스트 방법

**결정**: ws 클라이언트 라이브러리를 사용한 통합 테스트

**근거**:
- ws 라이브러리는 클라이언트 모드도 지원
- 실제 웹소켓 연결을 생성하여 end-to-end 테스트 가능
- Supertest와 유사한 방식으로 테스트 코드 작성 가능

**구현 예시**:
```javascript
const WebSocket = require('ws');

describe('WebSocket Echo Server', () => {
  let ws;

  beforeEach(() => {
    ws = new WebSocket('ws://localhost:8080/ws/echo');
    return new Promise(resolve => ws.on('open', resolve));
  });

  afterEach(() => {
    ws.close();
  });

  test('should echo text message', (done) => {
    const testMessage = 'Hello WebSocket';

    ws.on('message', (data) => {
      expect(data.toString()).toBe(testMessage);
      done();
    });

    ws.send(testMessage);
  });
});
```

**대안 고려**:
- Mock 라이브러리 사용: 실제 웹소켓 동작과 차이가 있을 수 있음
- Puppeteer/Playwright: 과도한 복잡성, 단위 테스트에 부적합

---

### 6. 클라이언트 정보 추출

**연구 목적**: 웹소켓 연결 시 클라이언트 IP 주소 및 식별 정보 추출 방법

**결정**: `upgrade` 이벤트에서 HTTP 요청 객체 활용

**근거**:
- ws 라이브러리는 `connection` 이벤트에서 HTTP 요청 객체 제공
- `req.socket.remoteAddress`로 클라이언트 IP 추출
- `req.headers['user-agent']`로 사용자 에이전트 추출
- Express.js 미들웨어와 통합 가능 (헤더 파싱, 인증 등)

**구현 예시**:
```javascript
wss.on('connection', (ws, req) => {
  const clientInfo = {
    ip: req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
    connectedAt: new Date().toISOString()
  };

  // connectionId 생성 및 추적
  const connectionId = connectionManager.addConnection(ws, clientInfo);
});
```

**대안 고려**:
- 커스텀 헤더 사용: 클라이언트가 임의로 설정 가능하여 신뢰성 낮음

---

## 모범 사례 (Best Practices)

### WebSocket 서버 구성
1. **핑/퐁 메커니즘**: 30초마다 핑을 보내 연결 유지 및 좀비 연결 정리
2. **에러 핸들링**: `error`, `close` 이벤트 리스너 등록으로 안정성 확보
3. **백프레셔 관리**: `ws.bufferedAmount` 확인하여 과도한 메시지 전송 방지

### 성능 최적화
1. **비동기 로깅**: 메시지 로깅을 비동기로 처리하여 에코 응답 지연 최소화
2. **메모리 효율**: 로그 크기 제한(1000개)으로 메모리 사용량 제어
3. **이벤트 루프 블로킹 방지**: CPU 집약적 작업은 Worker Thread 사용 고려

### 보안
1. **입력 검증**: 메시지 크기 제한 (1MB) 적용
2. **CORS 설정**: 허용된 도메인만 웹소켓 연결 허용
3. **Rate Limiting**: 단일 클라이언트의 과도한 메시지 전송 방지

---

## 통합 전략

### 기존 시스템과의 통합
1. **Express.js 서버**: 동일한 HTTP 서버에서 웹소켓 업그레이드 처리
2. **REST API 엔드포인트**: `/api/logs` 엔드포인트로 로그 조회 기능 제공
3. **React 대시보드**: 기존 컴포넌트 구조에 웹소켓 기반 실시간 업데이트 추가

### 배포 고려사항
1. **포트 설정**: 환경 변수로 웹소켓 포트 구성 가능
2. **프록시 설정**: Nginx/Apache 리버스 프록시 시 웹소켓 업그레이드 헤더 전달 필요
3. **로드 밸런싱**: Sticky Session 설정으로 동일 클라이언트는 동일 서버로 연결

---

## 결론

모든 기술적 불확실성이 해결되었으며, 다음 단계(Phase 1: Design & Contracts)로 진행할 준비가 완료되었습니다.

- ✅ 웹소켓 에코 구현 패턴 확정
- ✅ 메모리 기반 로그 관리 전략 수립
- ✅ 실시간 대시보드 업데이트 방법 결정
- ✅ 연결 관리 및 테스트 전략 확립
