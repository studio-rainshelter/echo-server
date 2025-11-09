# WebSocket API Contract

**Feature**: 002-websocket-echo-api
**Date**: 2025-11-09
**Protocol**: WebSocket (RFC 6455)

## 개요

이 문서는 웹소켓 에코 서버와 클라이언트 간의 통신 계약을 정의합니다.

---

## 1. 에코 서버 엔드포인트

### 연결 정보

**URL**: `ws://[host]:[port]/ws/echo`

**예시**:
- 개발 환경: `ws://localhost:3001/ws/echo`
- 프로덕션: `ws://echo-server.example.com/ws/echo`

**프로토콜**: WebSocket (ws) 또는 WebSocket Secure (wss)

### 연결 수립

**요청 (HTTP Upgrade)**:
```http
GET /ws/echo HTTP/1.1
Host: localhost:3001
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
```

**응답 (성공)**:
```http
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

**응답 (실패)**:
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "Invalid WebSocket upgrade request"
}
```

---

### 메시지 에코 (Text)

**클라이언트 → 서버**:
```
FRAME: TEXT
PAYLOAD: "Hello, WebSocket!"
```

**서버 → 클라이언트**:
```
FRAME: TEXT
PAYLOAD: "Hello, WebSocket!"
```

---

### 메시지 에코 (JSON)

**클라이언트 → 서버**:
```json
{
  "type": "ping",
  "timestamp": "2025-11-09T16:30:45.123Z",
  "data": {
    "message": "test"
  }
}
```

**서버 → 클라이언트**:
```json
{
  "type": "ping",
  "timestamp": "2025-11-09T16:30:45.123Z",
  "data": {
    "message": "test"
  }
}
```

---

### 메시지 에코 (Binary)

**클라이언트 → 서버**:
```
FRAME: BINARY
PAYLOAD: [0x48, 0x65, 0x6C, 0x6C, 0x6F] (바이트 배열)
```

**서버 → 클라이언트**:
```
FRAME: BINARY
PAYLOAD: [0x48, 0x65, 0x6C, 0x6C, 0x6F] (동일한 바이트 배열)
```

---

### 연결 유지 (Ping/Pong)

**서버 → 클라이언트 (Ping)**:
```
FRAME: PING
PAYLOAD: (empty or custom payload)
```

**클라이언트 → 서버 (Pong)**:
```
FRAME: PONG
PAYLOAD: (same as ping payload)
```

**주기**: 30초마다 서버에서 Ping 전송

---

### 연결 종료

**정상 종료 (클라이언트)**:
```
FRAME: CLOSE
STATUS CODE: 1000 (Normal Closure)
REASON: "Client disconnecting"
```

**정상 종료 (서버)**:
```
FRAME: CLOSE
STATUS CODE: 1000 (Normal Closure)
REASON: "Server shutting down"
```

**비정상 종료 (타임아웃)**:
```
FRAME: CLOSE
STATUS CODE: 1001 (Going Away)
REASON: "Timeout - no activity for 30 seconds"
```

**비정상 종료 (에러)**:
```
FRAME: CLOSE
STATUS CODE: 1011 (Internal Server Error)
REASON: "Server error occurred"
```

---

## 2. 대시보드 엔드포인트

### 연결 정보

**URL**: `ws://[host]:[port]/ws/dashboard`

**예시**:
- 개발 환경: `ws://localhost:3001/ws/dashboard`
- 프로덕션: `ws://echo-server.example.com/ws/dashboard`

### 실시간 로그 브로드캐스트

**서버 → 대시보드 (새 메시지 로그)**:
```json
{
  "type": "message_log",
  "data": {
    "logId": "log-1699564832456-x1y2z3",
    "connectionId": "conn-1699564832123-a9b3c4d5e",
    "messageType": "text",
    "messageContent": "Hello, WebSocket!",
    "messageSize": 18,
    "timestamp": "2025-11-09T16:30:45.123Z",
    "clientInfo": {
      "ip": "192.168.1.100",
      "userAgent": "Mozilla/5.0..."
    }
  }
}
```

**서버 → 대시보드 (연결 이벤트)**:
```json
{
  "type": "connection_event",
  "data": {
    "eventId": "event-1699564832789-p9q8r7",
    "eventType": "connected",
    "connectionId": "conn-1699564832123-a9b3c4d5e",
    "timestamp": "2025-11-09T16:30:45.123Z",
    "clientInfo": {
      "ip": "192.168.1.100",
      "userAgent": "Mozilla/5.0..."
    }
  }
}
```

**서버 → 대시보드 (통계 업데이트)**:
```json
{
  "type": "statistics_update",
  "data": {
    "currentActiveConnections": 5,
    "totalConnectionsAttempted": 42,
    "totalMessagesReceived": 150,
    "totalMessagesSent": 150,
    "serverStartedAt": "2025-11-09T10:00:00.000Z",
    "uptimeSeconds": 23445
  }
}
```

---

## 3. 에러 처리

### 클라이언트 에러

**메시지 크기 초과**:
```json
{
  "type": "error",
  "code": "MESSAGE_TOO_LARGE",
  "message": "Message size exceeds 1MB limit",
  "maxSize": 1048576
}
```

**잘못된 형식**:
```json
{
  "type": "error",
  "code": "INVALID_FORMAT",
  "message": "Message format is invalid"
}
```

### 서버 에러

**내부 서버 오류**:
```json
{
  "type": "error",
  "code": "INTERNAL_SERVER_ERROR",
  "message": "An internal server error occurred"
}
```

---

## 4. 제약사항 (Constraints)

### 메시지 크기
- **최대 크기**: 1MB (1,048,576 바이트)
- **권장 크기**: 64KB 이하 (최적 성능)

### 연결 제한
- **최대 동시 연결**: 제한 없음 (성능 목표: 최소 100개 지원)
- **연결 타임아웃**: 30초 무응답 시 자동 종료

### 메시지 전송률
- **제한 없음**: 클라이언트는 원하는 속도로 메시지 전송 가능
- **백프레셔**: 서버 버퍼가 가득 찰 경우 전송 지연 가능

---

## 5. 클라이언트 구현 예시

### JavaScript (브라우저)

```javascript
// 연결 수립
const ws = new WebSocket('ws://localhost:3001/ws/echo');

// 연결 성공
ws.onopen = () => {
  console.log('Connected to echo server');
  ws.send('Hello, Server!');
};

// 메시지 수신
ws.onmessage = (event) => {
  console.log('Received:', event.data);
};

// 에러 처리
ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

// 연결 종료
ws.onclose = (event) => {
  console.log('Disconnected:', event.code, event.reason);
};
```

### Node.js (ws 라이브러리)

```javascript
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3001/ws/echo');

ws.on('open', () => {
  console.log('Connected to echo server');
  ws.send('Hello, Server!');
});

ws.on('message', (data) => {
  console.log('Received:', data.toString());
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});

ws.on('close', (code, reason) => {
  console.log('Disconnected:', code, reason.toString());
});
```

---

## 6. 테스트 시나리오

### 시나리오 1: 단순 텍스트 에코
1. 클라이언트가 `/ws/echo`에 연결
2. 클라이언트가 "Hello" 전송
3. 서버가 "Hello" 응답
4. 검증: 송신 메시지 == 수신 메시지

### 시나리오 2: JSON 에코
1. 클라이언트가 `/ws/echo`에 연결
2. 클라이언트가 `{"test": true}` 전송
3. 서버가 `{"test": true}` 응답
4. 검증: JSON 파싱 성공 및 내용 일치

### 시나리오 3: 바이너리 에코
1. 클라이언트가 `/ws/echo`에 연결
2. 클라이언트가 바이트 배열 `[0x01, 0x02, 0x03]` 전송
3. 서버가 동일한 바이트 배열 응답
4. 검증: 바이트 단위 비교 일치

### 시나리오 4: 대시보드 실시간 업데이트
1. 대시보드가 `/ws/dashboard`에 연결
2. 다른 클라이언트가 `/ws/echo`에 연결하여 메시지 전송
3. 대시보드가 `message_log` 이벤트 수신
4. 검증: 로그 데이터 정확성

---

## 7. 보안 고려사항

### 인증
- 현재 버전: 인증 없음 (로컬 네트워크 전용)
- 향후 확장: JWT 토큰 기반 인증 추가 가능

### CORS
- WebSocket은 CORS 정책의 영향을 받지 않음
- HTTP Upgrade 요청에서 Origin 헤더 검증 권장

### 입력 검증
- 메시지 크기 제한 (1MB)
- 잘못된 형식의 데이터 처리

---

## 8. 버전 관리

**현재 버전**: 1.0.0
**프로토콜 버전**: WebSocket RFC 6455

향후 버전에서 API 변경 시:
- `/ws/echo/v2`, `/ws/dashboard/v2` 형태로 엔드포인트 버저닝
- 하위 호환성 유지
