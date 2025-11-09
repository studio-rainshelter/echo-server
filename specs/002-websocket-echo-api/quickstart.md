# Quick Start Guide: 웹소켓 에코 서버

**Feature**: 002-websocket-echo-api
**Date**: 2025-11-09
**Audience**: 개발자, 테스터, 운영자

## 개요

이 가이드는 웹소켓 에코 서버를 빠르게 시작하고 테스트하는 방법을 설명합니다.

---

## 전제 조건

- Node.js LTS (20.x 이상) 설치
- npm 또는 yarn 설치
- 기본 웹소켓 및 JavaScript 지식

---

## 1. 서버 시작

### 개발 모드 실행

```bash
# 루트 디렉토리에서
npm run dev

# 또는 백엔드만 실행
npm run dev:backend
```

서버가 성공적으로 시작되면 다음과 같은 메시지가 표시됩니다:

```
✓ HTTP Server running on port 3001
✓ WebSocket Echo Server running on ws://localhost:3001/ws/echo
✓ WebSocket Dashboard Server running on ws://localhost:3001/ws/dashboard
```

---

## 2. 웹소켓 에코 테스트

### 방법 1: 브라우저 콘솔 (가장 빠름)

1. 브라우저 개발자 도구 열기 (F12)
2. 콘솔 탭으로 이동
3. 다음 코드 실행:

```javascript
// 연결 생성
const ws = new WebSocket('ws://localhost:3001/ws/echo');

// 연결 성공 시
ws.onopen = () => {
  console.log('✓ Connected to echo server');
  ws.send('Hello, WebSocket!');
};

// 메시지 수신 시
ws.onmessage = (event) => {
  console.log('✓ Received:', event.data);
};

// 에러 발생 시
ws.onerror = (error) => {
  console.error('✗ Error:', error);
};
```

**예상 출력**:
```
✓ Connected to echo server
✓ Received: Hello, WebSocket!
```

---

### 방법 2: wscat (CLI 도구)

wscat을 설치하고 사용:

```bash
# wscat 설치 (전역)
npm install -g wscat

# 에코 서버 연결
wscat -c ws://localhost:3001/ws/echo

# 연결 후 메시지 입력
> Hello, Server!
< Hello, Server!

> {"type": "test"}
< {"type": "test"}
```

---

### 방법 3: Node.js 스크립트

`test-echo.js` 파일 생성:

```javascript
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3001/ws/echo');

ws.on('open', () => {
  console.log('✓ Connected to echo server');

  // 텍스트 메시지 테스트
  ws.send('Hello, WebSocket!');

  // JSON 메시지 테스트
  setTimeout(() => {
    ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
  }, 1000);

  // 바이너리 메시지 테스트
  setTimeout(() => {
    const buffer = Buffer.from([0x48, 0x65, 0x6C, 0x6C, 0x6F]);
    ws.send(buffer);
  }, 2000);
});

ws.on('message', (data, isBinary) => {
  if (isBinary) {
    console.log('✓ Received binary:', data);
  } else {
    console.log('✓ Received text:', data.toString());
  }
});

ws.on('close', () => {
  console.log('✓ Connection closed');
});

ws.on('error', (error) => {
  console.error('✗ Error:', error);
});
```

실행:

```bash
node test-echo.js
```

---

## 3. 대시보드 확인

### 웹 대시보드 열기

1. 브라우저에서 `http://localhost:5173` 접속
2. 대시보드에서 다음 정보 확인:
   - 현재 활성 연결 수
   - 메시지 로그 (실시간 업데이트)
   - 연결/해제 이벤트
   - 서버 통계

### 실시간 로그 확인

1. 다른 터미널에서 `wscat -c ws://localhost:3001/ws/echo` 실행
2. 메시지 전송: `Hello!`
3. 대시보드에서 실시간으로 로그 확인

---

## 4. REST API 테스트

### 메시지 로그 조회

```bash
# 최근 10개 로그 조회
curl http://localhost:3001/api/logs/messages?limit=10

# 특정 연결의 로그만 조회
curl "http://localhost:3001/api/logs/messages?connectionId=conn-1699564832123-a9b3c4d5e"
```

**응답 예시**:
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "logId": "log-1699564832456-x1y2z3",
        "connectionId": "conn-1699564832123-a9b3c4d5e",
        "messageType": "text",
        "messageContent": "Hello, WebSocket!",
        "messageSize": 18,
        "timestamp": "2025-11-09T16:30:45.123Z",
        "clientInfo": {
          "ip": "::1",
          "userAgent": "node-websocket-client/1.0"
        }
      }
    ],
    "total": 1,
    "limit": 10,
    "offset": 0
  }
}
```

### 서버 통계 조회

```bash
curl http://localhost:3001/api/statistics
```

**응답 예시**:
```json
{
  "success": true,
  "data": {
    "currentActiveConnections": 2,
    "totalConnectionsAttempted": 5,
    "totalMessagesReceived": 15,
    "totalMessagesSent": 15,
    "serverStartedAt": "2025-11-09T10:00:00.000Z",
    "uptimeSeconds": 23445
  }
}
```

### 활성 연결 목록 조회

```bash
curl http://localhost:3001/api/connections
```

---

## 5. 성능 테스트

### 동시 연결 테스트

`load-test.js` 파일 생성:

```javascript
const WebSocket = require('ws');

const NUM_CONNECTIONS = 100;
const connections = [];

for (let i = 0; i < NUM_CONNECTIONS; i++) {
  const ws = new WebSocket('ws://localhost:3001/ws/echo');

  ws.on('open', () => {
    console.log(`Connection ${i + 1}/${NUM_CONNECTIONS} established`);
    ws.send(`Message from connection ${i + 1}`);
  });

  ws.on('message', (data) => {
    console.log(`Connection ${i + 1} received: ${data}`);
  });

  connections.push(ws);
}

// 10초 후 모든 연결 종료
setTimeout(() => {
  connections.forEach(ws => ws.close());
  console.log('All connections closed');
}, 10000);
```

실행:

```bash
node load-test.js
```

---

## 6. 문제 해결 (Troubleshooting)

### 연결 실패: "ECONNREFUSED"

**원인**: 서버가 실행되지 않음
**해결**:
```bash
# 서버가 실행 중인지 확인
ps aux | grep node

# 서버 재시작
npm run dev:backend
```

---

### 메시지가 에코되지 않음

**원인**: 잘못된 엔드포인트 또는 메시지 형식
**확인 사항**:
1. 올바른 URL 사용 확인: `ws://localhost:3001/ws/echo`
2. WebSocket 연결이 `open` 상태인지 확인
3. 서버 로그에서 에러 메시지 확인

---

### 대시보드에 로그가 표시되지 않음

**원인**: 대시보드 웹소켓 연결 실패
**해결**:
1. 브라우저 개발자 도구에서 WebSocket 연결 상태 확인
2. 프론트엔드 콘솔에서 에러 메시지 확인
3. 백엔드 서버가 `/ws/dashboard` 엔드포인트를 제공하는지 확인

---

## 7. 다음 단계

### 고급 사용법
- [WebSocket API 계약](./contracts/websocket-api.md) 참조
- [REST API 명세](./contracts/rest-api.yaml) 참조
- [데이터 모델](./data-model.md) 참조

### 개발
- 백엔드 코드: `backend/src/websocket/`
- 프론트엔드 컴포넌트: `frontend/src/components/`
- 테스트 코드: `backend/tests/integration/`

### 배포
- 프로덕션 빌드: `npm run build:frontend`
- 프로덕션 실행: `npm run start:prod`
- 환경 변수 설정: `backend/.env` 파일 참조

---

## 8. 추가 리소스

### 공식 문서
- [WebSocket RFC 6455](https://tools.ietf.org/html/rfc6455)
- [ws 라이브러리 문서](https://github.com/websockets/ws)
- [Express.js 문서](https://expressjs.com/)

### 예제 코드
- 브라우저 클라이언트: `frontend/src/services/websocket-service.js`
- Node.js 클라이언트: `backend/tests/integration/websocket-echo.test.js`

---

## 요약

**최소 실행 단계**:
1. `npm run dev` - 서버 시작
2. 브라우저 콘솔에서 WebSocket 연결 테스트
3. `http://localhost:5173`에서 대시보드 확인

**빠른 확인 체크리스트**:
- ✓ 서버가 정상 시작되었는가?
- ✓ WebSocket 연결이 성공하는가?
- ✓ 메시지가 정확히 에코되는가?
- ✓ 대시보드에 로그가 표시되는가?

모든 항목이 체크되면 시스템이 정상 작동하는 것입니다!
