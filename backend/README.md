# 에코 서버 백엔드

REST API와 WebSocket을 지원하는 에코 서버의 백엔드입니다.

## 기능

- ✅ 10개의 REST API 엔드포인트
- ✅ WebSocket 실시간 양방향 통신
- ✅ 실시간 로그 및 통계 브로드캐스트
- ✅ 인메모리 순환 버퍼 저장소
- ✅ Rate limiting 및 입력 검증

## 설치

```bash
npm install
```

## 실행

### 개발 모드

```bash
npm run dev
```

### 프로덕션 모드

```bash
npm start
```

## 테스트

### 모든 테스트 실행

```bash
npm test
```

### 커버리지 확인

```bash
npm run test:coverage
```

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/echo` | 쿼리 파라미터 에코 |
| POST | `/api/echo` | Body 데이터 에코 |
| GET | `/api/users` | Mock 사용자 목록 |
| POST | `/api/users` | 사용자 생성 시뮬레이션 |
| GET | `/api/status` | 서버 상태 및 통계 |
| POST | `/api/json` | JSON 데이터 처리 |
| GET | `/api/delay/:ms` | 지연된 응답 (0-10000ms) |
| PUT | `/api/update/:id` | 업데이트 시뮬레이션 |
| DELETE | `/api/delete/:id` | 삭제 시뮬레이션 |
| GET | `/api/error/:code` | 에러 응답 테스트 |
| GET | `/api/logs` | 요청/응답 로그 조회 |

## WebSocket

WebSocket 서버는 HTTP 서버와 동일한 포트(3000)를 사용합니다.

### 연결

```javascript
const ws = new WebSocket('ws://localhost:3000');
```

### 메시지 형식

```json
{
  "type": "echo",
  "message": "Hello"
}
```

지원되는 타입:
- `echo`: 메시지 에코
- `ping`: Ping/Pong

## 환경 변수

`.env` 파일에서 설정:

```env
PORT=3000
NODE_ENV=development
```

## 프로젝트 구조

```
src/
├── server.js           # 서버 진입점
├── routes/             # API 라우트
│   └── api.js          # 10개 엔드포인트
├── websocket/          # WebSocket 핸들러
│   └── handler.js      # 메시지 처리
├── middleware/         # Express 미들웨어
│   ├── logger.js       # 로깅
│   └── errorHandler.js # 에러 처리
└── utils/              # 유틸리티
    └── store.js        # 인메모리 저장소

tests/
├── contract/           # API 계약 테스트
├── integration/        # 통합 테스트
└── unit/               # 단위 테스트
```

## 기술 스택

- **Node.js** 20.x (LTS)
- **Express.js** 5.x
- **ws** (WebSocket)
- **Jest** + **Supertest** (테스팅)
