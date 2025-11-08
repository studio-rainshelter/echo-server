# Quickstart Guide: 에코 서버

**Feature**: 001-echo-server
**Date**: 2025-11-02

## 소개

에코 서버는 REST API와 WebSocket을 지원하는 개발/테스트 도구입니다. 10개의 API 엔드포인트, 실시간 WebSocket 통신, 그리고 웹 기반 모니터링 대시보드를 제공합니다.

---

## 빠른 시작 (5분 안에)

### 1. 사전 요구사항

- **Node.js**: 20.x 이상 (LTS 버전 권장)
- **npm**: 10.x 이상

확인:
```bash
node --version  # v20.x.x 이상
npm --version   # 10.x.x 이상
```

---

### 2. 프로젝트 설정

```bash
# 저장소 클론 (또는 다운로드)
git clone <repository-url>
cd EchoServer

# 백엔드 의존성 설치
cd backend
npm install

# 프론트엔드 의존성 설치
cd ../frontend
npm install
```

---

### 3. 서버 실행

#### 개발 모드 (권장)

터미널 1 - 백엔드:
```bash
cd backend
npm run dev
```

터미널 2 - 프론트엔드:
```bash
cd frontend
npm run dev
```

#### 프로덕션 모드

```bash
# 프론트엔드 빌드
cd frontend
npm run build

# 백엔드 시작 (빌드된 프론트엔드 서빙 포함)
cd ../backend
npm start
```

---

### 4. 접속 확인

- **대시보드**: http://localhost:5173 (개발 모드) 또는 http://localhost:3000 (프로덕션)
- **API 서버**: http://localhost:3000
- **WebSocket**: ws://localhost:3000

브라우저에서 대시보드를 열면 API 엔드포인트 목록과 실시간 로그가 표시됩니다.

---

## 기본 사용법

### REST API 테스트

#### 1. 쿼리 파라미터 에코

```bash
curl "http://localhost:3000/api/echo?message=hello"
```

응답:
```json
{
  "echo": {
    "query": {
      "message": "hello"
    }
  },
  "timestamp": "2025-11-02T12:34:56.789Z"
}
```

#### 2. Body 데이터 에코

```bash
curl -X POST http://localhost:3000/api/echo \
  -H "Content-Type: application/json" \
  -d '{"data": "test"}'
```

응답:
```json
{
  "echo": {
    "body": {
      "data": "test"
    }
  },
  "timestamp": "2025-11-02T12:34:56.789Z"
}
```

#### 3. 서버 상태 확인

```bash
curl http://localhost:3000/api/status
```

응답:
```json
{
  "status": "running",
  "uptime": 123,
  "statistics": {
    "totalRequests": 5,
    "successfulRequests": 5,
    "failedRequests": 0,
    "activeWebSockets": 1,
    "totalWebSocketMessages": 0
  },
  "timestamp": "2025-11-02T12:34:56.789Z"
}
```

---

### WebSocket 테스트

#### 브라우저 콘솔에서

```javascript
// WebSocket 연결
const ws = new WebSocket('ws://localhost:3000');

ws.onopen = () => {
  console.log('연결됨');
  // 메시지 전송
  ws.send(JSON.stringify({ type: 'echo', message: 'Hello WebSocket' }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('수신:', message);
};
```

#### Node.js에서

```javascript
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3000');

ws.on('open', () => {
  ws.send(JSON.stringify({ type: 'echo', message: 'Hello from Node.js' }));
});

ws.on('message', (data) => {
  console.log('수신:', JSON.parse(data));
});
```

---

## 10개 API 엔드포인트 요약

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/echo` | GET | 쿼리 파라미터 에코 |
| `/api/echo` | POST | Body 데이터 에코 |
| `/api/users` | GET | Mock 사용자 목록 |
| `/api/users` | POST | 사용자 생성 시뮬레이션 |
| `/api/status` | GET | 서버 상태 및 통계 |
| `/api/json` | POST | JSON 데이터 처리 |
| `/api/delay/:ms` | GET | 지연된 응답 (예: `/api/delay/2000`) |
| `/api/update/:id` | PUT | 업데이트 시뮬레이션 |
| `/api/delete/:id` | DELETE | 삭제 시뮬레이션 |
| `/api/error/:code` | GET | 에러 응답 테스트 (예: `/api/error/404`) |

전체 API 명세는 [contracts/openapi.yaml](./contracts/openapi.yaml)을 참고하세요.

---

## 대시보드 기능

### 1. API 엔드포인트 목록
- 10개 엔드포인트의 설명과 테스트 버튼 제공
- 버튼 클릭으로 즉시 API 호출 가능

### 2. 실시간 로그 뷰어
- 모든 API 요청/응답을 실시간으로 표시
- 요청 메서드, 경로, 상태 코드, 응답 시간 표시
- WebSocket을 통해 지연 없이 업데이트

### 3. 서버 통계
- 총 요청 수
- 성공/실패 요청 수
- 활성 WebSocket 연결 수
- 서버 가동 시간

### 4. WebSocket 연결 상태
- 연결/연결 끊김 상태 실시간 표시
- 재연결 버튼 제공

---

## 테스트

### 테스트 실행

```bash
# 백엔드 테스트
cd backend
npm test

# 프론트엔드 테스트
cd frontend
npm test

# 테스트 커버리지
npm run test:coverage
```

### 테스트 구조

```
backend/tests/
├── contract/       # API 계약 테스트 (Supertest)
├── integration/    # WebSocket 통합 테스트
└── unit/           # 단위 테스트 (로거, 유틸리티)

frontend/tests/
└── components/     # React 컴포넌트 테스트
```

---

## 환경 변수

`.env` 파일을 생성하여 설정을 커스터마이징할 수 있습니다.

### backend/.env

```env
# 서버 포트
PORT=3000

# CORS 설정 (프로덕션)
NODE_ENV=production
ALLOWED_ORIGINS=http://localhost:3000,https://example.com

# 로그 설정
MAX_LOGS=1000

# WebSocket 설정
MAX_MESSAGE_SIZE=1048576  # 1MB
RATE_LIMIT=100            # 100 msg/s
```

### frontend/.env

```env
# API 서버 URL
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

---

## 문제 해결

### 포트 충돌

3000번 포트가 이미 사용 중인 경우:

```bash
# 백엔드 포트 변경
PORT=4000 npm run dev

# 프론트엔드 환경 변수 업데이트
VITE_API_URL=http://localhost:4000 npm run dev
```

### WebSocket 연결 실패

1. 백엔드 서버가 실행 중인지 확인
2. 방화벽 설정 확인
3. 브라우저 콘솔에서 에러 메시지 확인

### CORS 에러

개발 모드에서는 모든 origin이 허용됩니다. 프로덕션 모드에서는 `ALLOWED_ORIGINS` 환경 변수를 설정하세요.

---

## 다음 단계

### 1. API 계약 확인
- [OpenAPI 스펙](./contracts/openapi.yaml) 읽기
- Swagger UI 또는 Postman으로 임포트

### 2. WebSocket 프로토콜 이해
- [WebSocket 프로토콜 문서](./contracts/websocket-protocol.md) 읽기
- 커스텀 클라이언트 구현

### 3. 데이터 모델 학습
- [Data Model](./data-model.md)에서 엔티티 구조 확인
- 로그 형식과 통계 이해

### 4. 구현 계획 확인
- [Implementation Plan](./plan.md)에서 아키텍처 확인
- 헌법 원칙과 설계 결정 이해

---

## 추가 리소스

- **Feature Spec**: [spec.md](./spec.md) - 전체 기능 명세
- **Research**: [research.md](./research.md) - 기술 선택 근거
- **Constitution**: [.specify/memory/constitution.md](../../.specify/memory/constitution.md) - 프로젝트 헌법

---

## 지원

문제가 발생하면:
1. [GitHub Issues](링크)에 이슈 등록
2. 프로젝트 문서 확인
3. 로그 파일 확인 (`backend/logs/`)

---

**즐거운 개발 되세요!** 🚀
