# WebSocket 프로토콜 명세

**Feature**: 001-echo-server
**Date**: 2025-11-02
**Version**: 1.0.0

## 개요

에코 서버는 WebSocket을 통해 양방향 실시간 통신을 지원합니다. 클라이언트가 보낸 메시지를 그대로 에코하며, 실시간 로그를 대시보드로 스트리밍합니다.

---

## 연결

### 엔드포인트

```
ws://localhost:3000
```

### 연결 수립

```javascript
const ws = new WebSocket('ws://localhost:3000');

ws.onopen = () => {
  console.log('WebSocket 연결 성공');
};

ws.onerror = (error) => {
  console.error('WebSocket 에러:', error);
};

ws.onclose = (event) => {
  console.log('WebSocket 연결 종료:', event.code, event.reason);
};
```

### 연결 성공 응답

서버는 연결 수립 시 환영 메시지를 전송합니다.

```json
{
  "type": "connection",
  "status": "connected",
  "connectionId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "timestamp": "2025-11-02T12:30:00.000Z"
}
```

---

## 메시지 타입

### 1. 에코 메시지 (Echo Message)

클라이언트가 보낸 텍스트 메시지를 그대로 반환합니다.

#### 클라이언트 → 서버

```json
{
  "type": "echo",
  "message": "Hello WebSocket"
}
```

또는 단순 텍스트:

```
Hello WebSocket
```

#### 서버 → 클라이언트

```json
{
  "type": "echo",
  "message": "Hello WebSocket",
  "timestamp": "2025-11-02T12:34:56.789Z"
}
```

---

### 2. 로그 스트림 (Log Stream)

서버는 모든 API 요청/응답 로그를 실시간으로 대시보드에 전송합니다.

#### 서버 → 클라이언트 (자동)

```json
{
  "type": "log",
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "timestamp": "2025-11-02T12:34:56.789Z",
    "request": {
      "method": "POST",
      "path": "/api/echo",
      "body": { "data": "test" }
    },
    "response": {
      "statusCode": 200,
      "body": { "echo": { "body": { "data": "test" } } },
      "duration": 23
    }
  }
}
```

---

### 3. 통계 업데이트 (Statistics Update)

서버 통계가 변경될 때마다 업데이트를 전송합니다.

#### 서버 → 클라이언트 (자동)

```json
{
  "type": "stats",
  "data": {
    "totalRequests": 1524,
    "successfulRequests": 1490,
    "failedRequests": 34,
    "activeWebSockets": 12,
    "totalWebSocketMessages": 3457,
    "uptime": 86401,
    "lastUpdated": "2025-11-02T12:34:57.000Z"
  }
}
```

---

### 4. Ping/Pong (Heartbeat)

연결 유지를 위한 heartbeat 메커니즘입니다.

#### 클라이언트 → 서버

```json
{
  "type": "ping"
}
```

#### 서버 → 클라이언트

```json
{
  "type": "pong",
  "timestamp": "2025-11-02T12:34:56.789Z"
}
```

---

### 5. 에러 (Error)

서버에서 에러 발생 시 에러 메시지를 전송합니다.

#### 서버 → 클라이언트

```json
{
  "type": "error",
  "error": {
    "code": "INVALID_MESSAGE",
    "message": "Invalid message format",
    "timestamp": "2025-11-02T12:34:56.789Z"
  }
}
```

---

## 메시지 흐름 예시

### 시나리오 1: 단순 에코

```
[클라이언트] 연결 요청
    ↓
[서버] 연결 수락 + 환영 메시지
    ↓
[클라이언트] "Hello WebSocket"
    ↓
[서버] {"type": "echo", "message": "Hello WebSocket", "timestamp": "..."}
```

### 시나리오 2: 대시보드 실시간 모니터링

```
[대시보드 클라이언트] 연결 요청
    ↓
[서버] 연결 수락 + 환영 메시지
    ↓
[다른 클라이언트] POST /api/echo 요청
    ↓
[서버] API 처리
    ↓
[서버 → 대시보드] {"type": "log", "data": {...}}
    ↓
[서버 → 대시보드] {"type": "stats", "data": {...}}
```

---

## 연결 종료

### 정상 종료

클라이언트에서 연결을 종료할 때:

```javascript
ws.close(1000, 'Normal closure');
```

서버는 종료 이벤트를 로깅하고 연결 통계를 업데이트합니다.

### 비정상 종료

네트워크 오류 또는 타임아웃 발생 시:

```javascript
ws.onclose = (event) => {
  if (event.code !== 1000) {
    console.error('비정상 종료:', event.code, event.reason);
  }
};
```

---

## 에러 코드

| 코드 | 설명 |
|------|------|
| `1000` | 정상 종료 |
| `1001` | 클라이언트 이탈 (예: 브라우저 닫기) |
| `1002` | 프로토콜 에러 |
| `1003` | 지원하지 않는 데이터 타입 |
| `1006` | 비정상 종료 (연결 끊김) |
| `1011` | 서버 내부 오류 |

---

## 클라이언트 구현 예시

### JavaScript (브라우저)

```javascript
class EchoClient {
  constructor(url) {
    this.url = url;
    this.ws = null;
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('연결됨');
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.ws.onclose = (event) => {
      console.log('연결 종료:', event.code);
    };

    this.ws.onerror = (error) => {
      console.error('에러:', error);
    };
  }

  sendEcho(text) {
    const message = {
      type: 'echo',
      message: text
    };
    this.ws.send(JSON.stringify(message));
  }

  handleMessage(message) {
    switch (message.type) {
      case 'connection':
        console.log('연결 ID:', message.connectionId);
        break;
      case 'echo':
        console.log('에코:', message.message);
        break;
      case 'log':
        console.log('로그:', message.data);
        break;
      case 'stats':
        console.log('통계:', message.data);
        break;
      case 'pong':
        console.log('Pong 수신');
        break;
      case 'error':
        console.error('서버 에러:', message.error);
        break;
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Normal closure');
    }
  }
}

// 사용 예시
const client = new EchoClient('ws://localhost:3000');
client.connect();
client.sendEcho('Hello WebSocket');
```

### Node.js (테스트용)

```javascript
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3000');

ws.on('open', () => {
  console.log('연결됨');
  ws.send(JSON.stringify({ type: 'echo', message: 'Hello from Node.js' }));
});

ws.on('message', (data) => {
  const message = JSON.parse(data);
  console.log('수신:', message);
});

ws.on('close', (code, reason) => {
  console.log('연결 종료:', code, reason);
});

ws.on('error', (error) => {
  console.error('에러:', error);
});
```

---

## 보안 고려사항

### 1. 메시지 크기 제한

```javascript
const MAX_MESSAGE_SIZE = 1024 * 1024; // 1MB

ws.on('message', (data) => {
  if (data.length > MAX_MESSAGE_SIZE) {
    ws.close(1009, 'Message too large');
    return;
  }
  // 처리 로직
});
```

### 2. Rate Limiting

```javascript
const RATE_LIMIT = 100; // 100 messages per second
const messageTimestamps = [];

ws.on('message', (data) => {
  const now = Date.now();
  messageTimestamps.push(now);

  // 1초 이전 타임스탬프 제거
  const oneSecondAgo = now - 1000;
  while (messageTimestamps.length > 0 && messageTimestamps[0] < oneSecondAgo) {
    messageTimestamps.shift();
  }

  if (messageTimestamps.length > RATE_LIMIT) {
    ws.close(1008, 'Rate limit exceeded');
    return;
  }

  // 처리 로직
});
```

### 3. 입력 검증

```javascript
ws.on('message', (data) => {
  try {
    const message = JSON.parse(data);

    if (!message.type || typeof message.type !== 'string') {
      ws.send(JSON.stringify({
        type: 'error',
        error: {
          code: 'INVALID_MESSAGE',
          message: 'Missing or invalid type field'
        }
      }));
      return;
    }

    // 처리 로직
  } catch (error) {
    ws.send(JSON.stringify({
      type: 'error',
      error: {
        code: 'PARSE_ERROR',
        message: 'Invalid JSON format'
      }
    }));
  }
});
```

---

## 성능 목표

- **연결 수립 시간**: < 100ms
- **메시지 에코 지연**: < 50ms
- **동시 연결**: 최소 100개
- **메시지 처리량**: 1000 msg/s

---

## 테스트 체크리스트

- [ ] 연결 수립 성공
- [ ] 에코 메시지 정상 동작
- [ ] 로그 스트림 실시간 수신
- [ ] 통계 업데이트 실시간 수신
- [ ] Ping/Pong heartbeat 동작
- [ ] 정상 종료 처리
- [ ] 비정상 종료 처리
- [ ] 에러 메시지 처리
- [ ] 메시지 크기 제한 검증
- [ ] Rate limiting 동작 확인
- [ ] 다중 클라이언트 동시 연결
- [ ] 재연결 메커니즘 (클라이언트 측)

---

이 프로토콜은 헌법의 "간결성 우선" 원칙을 준수하며, 표준 WebSocket 메커니즘만 사용합니다.
