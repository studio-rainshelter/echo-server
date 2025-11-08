# Research: 에코 서버 기술 조사

**Feature**: 001-echo-server
**Date**: 2025-11-02
**Status**: 완료

## 개요

이 문서는 에코 서버 구현을 위한 기술 조사 결과를 담고 있습니다. Technical Context에서 식별된 미결정 사항(NEEDS CLARIFICATION)과 주요 기술 선택에 대한 근거를 제공합니다.

---

## 1. WebSocket 테스트 도구 선정

### 결정: ws (클라이언트 모드) + Jest

**근거**:
- `ws` 라이브러리는 서버와 클라이언트 양쪽 모두 지원
- 서버에서 이미 사용 중인 라이브러리를 테스트에서도 활용하여 의존성 최소화
- Jest와의 통합이 간단하며 추가 설정 불필요
- 가볍고 설정이 단순하여 "간결성 우선" 원칙에 부합

**대안 검토**:
- **Socket.IO**: 더 많은 기능 제공하지만 에코 서버에는 과도하게 복잡함. WebSocket 표준만으로 충분.
- **Supertest-ws**: Supertest의 WebSocket 확장이지만, 유지보수가 활발하지 않고 의존성 추가가 필요.

**구현 방식**:
```javascript
// 테스트 예시
const WebSocket = require('ws');

test('WebSocket 에코 테스트', (done) => {
  const ws = new WebSocket('ws://localhost:3000');

  ws.on('open', () => {
    ws.send('Hello WebSocket');
  });

  ws.on('message', (data) => {
    expect(data).toBe('Hello WebSocket');
    ws.close();
    done();
  });
});
```

---

## 2. 프론트엔드 빌드 도구 선정

### 결정: Vite

**근거**:
- **빠른 개발 경험**: HMR(Hot Module Replacement)이 매우 빠름
- **최소 설정**: 기본 템플릿으로 React 앱을 즉시 시작 가능
- **작은 번들 크기**: Rollup 기반 프로덕션 빌드로 최적화됨
- **최소 의존성 원칙**: Create React App보다 의존성이 적고 빌드 구성이 단순

**대안 검토**:
- **Create React App (CRA)**: 안정적이지만 느리고 의존성이 많음. eject 없이는 설정 커스터마이징이 어려움.
- **Next.js**: SSR/SSG 기능은 에코 서버에 불필요. 과도한 복잡성.
- **Parcel**: 간단하지만 Vite보다 빌드 속도가 느림.

**설정 계획**:
```bash
npm create vite@latest frontend -- --template react
```

최소 설정으로 시작하며, 필요한 경우에만 `vite.config.js`를 수정합니다.

---

## 3. 비동기 로깅 패턴

### 결정: 이벤트 기반 로거 (EventEmitter 활용)

**근거**:
- Node.js 표준 라이브러리 `events` 모듈 사용으로 추가 의존성 없음
- 요청 처리와 로깅을 분리하여 응답 시간에 영향 최소화
- 간결하고 이해하기 쉬운 패턴

**대안 검토**:
- **Winston/Bunyan**: 강력한 로깅 라이브러리지만 에코 서버에는 과도함. 인메모리 로깅만 필요하므로 불필요.
- **Queue 기반 (Bull/BullMQ)**: Redis 의존성 추가. 에코 서버의 단순한 요구사항에 비해 복잡.

**구현 방식**:
```javascript
const EventEmitter = require('events');
const logEmitter = new EventEmitter();

// 로그 저장소 (인메모리)
const logs = [];

logEmitter.on('log', (entry) => {
  logs.push(entry);
  // WebSocket으로 대시보드에 실시간 전송
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'log', data: entry }));
    }
  });
});

// 미들웨어에서 비동기 로깅
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logEmitter.emit('log', {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: Date.now() - start
    });
  });
  next();
});
```

---

## 4. CORS 설정

### 결정: 개발 환경에서는 모든 origin 허용, 프로덕션에서는 명시적 설정

**근거**:
- 에코 서버는 개발/테스트 도구이므로 개발 편의성 우선
- 프로덕션 환경에서는 환경 변수로 허용할 origin 지정
- Express의 `cors` 미들웨어 사용 (표준 패턴)

**설정 예시**:
```javascript
const cors = require('cors');

const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.ALLOWED_ORIGINS?.split(',')
    : '*',
  credentials: true
};

app.use(cors(corsOptions));
```

---

## 5. 에러 처리 표준화

### 결정: 중앙화된 에러 핸들러 미들웨어

**근거**:
- Express의 에러 핸들링 미들웨어 패턴 활용
- 일관된 에러 응답 형식 보장
- 간결하고 유지보수하기 쉬움

**구현 방식**:
```javascript
// 에러 응답 형식
{
  "error": {
    "code": 404,
    "message": "Resource not found",
    "timestamp": "2025-11-02T12:00:00.000Z"
  }
}

// 에러 핸들러 미들웨어
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: {
      code: statusCode,
      message: err.message || 'Internal Server Error',
      timestamp: new Date().toISOString()
    }
  });
});
```

---

## 6. 테스트 전략

### 결정: 3계층 테스트 (Contract, Integration, Unit)

**근거**:
- **계약 테스트**: 모든 API 엔드포인트의 입출력 검증
- **통합 테스트**: WebSocket 연결과 실시간 통신 검증
- **단위 테스트**: 로거, 유틸리티 함수 등 개별 모듈 검증
- 70% 코드 커버리지 목표 달성을 위한 균형 잡힌 전략

**도구**:
- Jest: 테스트 프레임워크
- Supertest: HTTP API 테스트
- ws (클라이언트 모드): WebSocket 테스트
- @testing-library/react: React 컴포넌트 테스트

---

## 7. 성능 최적화 전략

### 결정: 인메모리 로그 크기 제한 + 순환 버퍼

**근거**:
- 무제한 로그 저장 시 메모리 누수 가능성
- 최근 1000개 로그만 유지하는 순환 버퍼 구현
- 간단하고 효과적인 메모리 관리

**구현**:
```javascript
const MAX_LOGS = 1000;
const logs = [];

function addLog(entry) {
  logs.push(entry);
  if (logs.length > MAX_LOGS) {
    logs.shift(); // 가장 오래된 로그 제거
  }
}
```

---

## 요약

모든 미결정 사항이 해결되었으며, 선택된 기술은 다음과 같습니다:

| 항목 | 선택 | 대안 | 근거 |
|------|------|------|------|
| WebSocket 테스트 | ws + Jest | Socket.IO, Supertest-ws | 최소 의존성, 간결성 |
| 프론트엔드 빌드 | Vite | CRA, Next.js, Parcel | 빠름, 최소 설정 |
| 로깅 패턴 | EventEmitter | Winston, Queue | 표준 라이브러리, 단순 |
| CORS | cors 미들웨어 | 수동 설정 | 표준 패턴 |
| 에러 처리 | 중앙화 핸들러 | 분산 처리 | 일관성, 유지보수성 |
| 성능 최적화 | 순환 버퍼 | 외부 저장소 | 메모리 효율, 단순 |

이제 Phase 1(설계)로 진행할 준비가 완료되었습니다.
