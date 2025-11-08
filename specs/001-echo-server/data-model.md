# Data Model: 에코 서버

**Feature**: 001-echo-server
**Date**: 2025-11-02

## 개요

에코 서버의 데이터 모델은 인메모리 저장소를 기반으로 하며, 요청/응답 로그와 WebSocket 연결 정보를 관리합니다. 영구 저장소가 필요 없으므로 간단한 JavaScript 객체와 배열로 구성됩니다.

---

## 1. RequestLog (요청 로그)

API 요청 정보를 저장하는 엔티티입니다.

### 필드

| 필드명 | 타입 | 설명 | 필수 | 기본값 |
|--------|------|------|------|--------|
| `id` | string | 고유 식별자 (UUID v4) | ✅ | 자동 생성 |
| `timestamp` | string | ISO 8601 형식 타임스탬프 | ✅ | `new Date().toISOString()` |
| `method` | string | HTTP 메서드 (GET, POST, PUT, DELETE) | ✅ | - |
| `path` | string | 요청 경로 (예: `/api/echo`) | ✅ | - |
| `query` | object | 쿼리 파라미터 (예: `{ message: "hello" }`) | ❌ | `{}` |
| `headers` | object | 요청 헤더 | ✅ | - |
| `body` | any | 요청 바디 (JSON 파싱됨) | ❌ | `null` |
| `clientIp` | string | 클라이언트 IP 주소 | ✅ | - |

### 예시

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "timestamp": "2025-11-02T12:34:56.789Z",
  "method": "POST",
  "path": "/api/echo",
  "query": {},
  "headers": {
    "content-type": "application/json",
    "user-agent": "PostmanRuntime/7.32.3"
  },
  "body": {
    "data": "test"
  },
  "clientIp": "127.0.0.1"
}
```

### 검증 규칙

- `method`: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"] 중 하나
- `path`: 반드시 `/`로 시작
- `timestamp`: 유효한 ISO 8601 형식
- `clientIp`: 유효한 IPv4 또는 IPv6 주소

---

## 2. ResponseLog (응답 로그)

API 응답 정보를 저장하는 엔티티입니다.

### 필드

| 필드명 | 타입 | 설명 | 필수 | 기본값 |
|--------|------|------|------|--------|
| `id` | string | 고유 식별자 (UUID v4) | ✅ | 자동 생성 |
| `requestId` | string | 연관된 RequestLog의 ID | ✅ | - |
| `timestamp` | string | ISO 8601 형식 타임스탬프 | ✅ | `new Date().toISOString()` |
| `statusCode` | number | HTTP 상태 코드 | ✅ | - |
| `headers` | object | 응답 헤더 | ✅ | - |
| `body` | any | 응답 바디 (JSON) | ❌ | `null` |
| `duration` | number | 응답 시간 (밀리초) | ✅ | - |

### 예시

```json
{
  "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "timestamp": "2025-11-02T12:34:56.812Z",
  "statusCode": 200,
  "headers": {
    "content-type": "application/json"
  },
  "body": {
    "echo": {
      "data": "test"
    }
  },
  "duration": 23
}
```

### 검증 규칙

- `statusCode`: 100-599 범위의 정수
- `duration`: 0 이상의 정수
- `requestId`: 존재하는 RequestLog의 ID여야 함

---

## 3. WebSocketConnection (WebSocket 연결)

WebSocket 연결 정보를 추적하는 엔티티입니다.

### 필드

| 필드명 | 타입 | 설명 | 필수 | 기본값 |
|--------|------|------|------|--------|
| `id` | string | 고유 식별자 (UUID v4) | ✅ | 자동 생성 |
| `connectedAt` | string | 연결 시간 (ISO 8601) | ✅ | `new Date().toISOString()` |
| `disconnectedAt` | string | 연결 종료 시간 (ISO 8601) | ❌ | `null` |
| `clientIp` | string | 클라이언트 IP 주소 | ✅ | - |
| `status` | string | 연결 상태 (`connected`, `disconnected`) | ✅ | `connected` |
| `messageCount` | number | 주고받은 메시지 수 | ✅ | `0` |

### 예시

```json
{
  "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "connectedAt": "2025-11-02T12:30:00.000Z",
  "disconnectedAt": null,
  "clientIp": "192.168.1.100",
  "status": "connected",
  "messageCount": 5
}
```

### 상태 전이

```
[초기] → connected (연결 수립)
connected → disconnected (연결 종료)
```

### 검증 규칙

- `status`: ["connected", "disconnected"] 중 하나
- `messageCount`: 0 이상의 정수
- `disconnectedAt`: 설정 시 `connectedAt`보다 이후 시간이어야 함

---

## 4. ServerStatistics (서버 통계)

서버의 실시간 통계 정보를 나타내는 엔티티입니다. (싱글톤)

### 필드

| 필드명 | 타입 | 설명 | 필수 | 기본값 |
|--------|------|------|------|--------|
| `totalRequests` | number | 총 요청 수 | ✅ | `0` |
| `successfulRequests` | number | 성공 요청 수 (2xx, 3xx) | ✅ | `0` |
| `failedRequests` | number | 실패 요청 수 (4xx, 5xx) | ✅ | `0` |
| `activeWebSockets` | number | 현재 활성 WebSocket 연결 수 | ✅ | `0` |
| `totalWebSocketMessages` | number | 총 WebSocket 메시지 수 | ✅ | `0` |
| `uptime` | number | 서버 가동 시간 (초) | ✅ | `0` |
| `lastUpdated` | string | 마지막 업데이트 시간 (ISO 8601) | ✅ | `new Date().toISOString()` |

### 예시

```json
{
  "totalRequests": 1523,
  "successfulRequests": 1489,
  "failedRequests": 34,
  "activeWebSockets": 12,
  "totalWebSocketMessages": 3456,
  "uptime": 86400,
  "lastUpdated": "2025-11-02T12:34:56.789Z"
}
```

### 계산 로직

- **성공률**: `(successfulRequests / totalRequests) * 100`
- **실패율**: `(failedRequests / totalRequests) * 100`
- **가동 시간**: `process.uptime()` 사용

---

## 5. 데이터 저장소 구조

### 인메모리 저장소

```javascript
// backend/src/utils/store.js

const { v4: uuidv4 } = require('uuid');

// 순환 버퍼 설정
const MAX_LOGS = 1000;

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

// 로그 추가 (순환 버퍼)
function addRequest(request) {
  const entry = { id: uuidv4(), ...request };
  store.requests.push(entry);
  if (store.requests.length > MAX_LOGS) {
    store.requests.shift();
  }
  return entry;
}

function addResponse(response) {
  const entry = { id: uuidv4(), ...response };
  store.responses.push(entry);
  if (store.responses.length > MAX_LOGS) {
    store.responses.shift();
  }
  return entry;
}

// 통계 업데이트
function updateStatistics(updates) {
  Object.assign(store.statistics, updates, {
    lastUpdated: new Date().toISOString()
  });
}

module.exports = {
  store,
  addRequest,
  addResponse,
  updateStatistics
};
```

---

## 6. 관계 다이어그램

```
┌─────────────┐       1:1       ┌──────────────┐
│ RequestLog  │ ─────────────── │ ResponseLog  │
└─────────────┘                 └──────────────┘
      │                                │
      │                                │
      └────────────┬───────────────────┘
                   │
                   │ N:1
                   ▼
           ┌────────────────┐
           │ ServerStatistics│
           └────────────────┘
                   ▲
                   │ N:1
                   │
        ┌──────────────────────┐
        │ WebSocketConnection  │
        └──────────────────────┘
```

- **RequestLog ↔ ResponseLog**: 1:1 관계 (`requestId`로 연결)
- **모든 엔티티 → ServerStatistics**: 통계는 모든 요청/응답/연결을 집계

---

## 7. 데이터 라이프사이클

### RequestLog & ResponseLog
1. **생성**: API 요청 발생 시 미들웨어에서 자동 생성
2. **저장**: 인메모리 배열에 추가 (순환 버퍼)
3. **조회**: 대시보드에서 실시간 조회
4. **삭제**: 1000개 초과 시 가장 오래된 항목 자동 삭제

### WebSocketConnection
1. **생성**: WebSocket 연결 수립 시
2. **업데이트**: 메시지 수신/발신 시 `messageCount` 증가
3. **종료**: 연결 종료 시 `status` → `disconnected`, `disconnectedAt` 설정
4. **삭제**: 종료된 연결은 일정 시간 후 제거 (예: 1시간)

### ServerStatistics
1. **초기화**: 서버 시작 시
2. **업데이트**: 모든 요청/응답/연결 이벤트마다 실시간 업데이트
3. **지속**: 서버 종료 시까지 유지 (재시작 시 초기화)

---

## 요약

- **총 4개 엔티티**: RequestLog, ResponseLog, WebSocketConnection, ServerStatistics
- **저장 방식**: 인메모리 (순환 버퍼)
- **관계**: RequestLog ↔ ResponseLog (1:1), 모든 엔티티 → ServerStatistics
- **검증**: 각 엔티티별 명확한 검증 규칙 정의
- **라이프사이클**: 자동 생성, 순환 버퍼 기반 삭제

모든 데이터 모델은 헌법의 "간결성 우선" 원칙을 준수하며, 불필요한 복잡성을 배제했습니다.
