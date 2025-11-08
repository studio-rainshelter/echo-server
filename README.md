# 에코 서버 (Echo Server)

REST API와 WebSocket을 지원하는 풀스택 에코 서버 애플리케이션입니다.

## 개요

에코 서버는 개발자가 API를 테스트하고 디버깅할 수 있도록 지원하는 도구입니다. 10개의 REST API 엔드포인트, WebSocket 실시간 통신, 실시간 모니터링 대시보드를 제공합니다.

## 주요 기능

### 🌐 REST API (10개 엔드포인트)
- GET/POST 에코 엔드포인트
- Mock 사용자 CRUD
- 지연 응답 시뮬레이션
- 에러 응답 테스트
- 서버 상태 조회

### 🔌 WebSocket
- 실시간 양방향 통신
- 에코 메시지
- Ping/Pong
- Rate limiting (100 msg/s)

### 📊 실시간 대시보드
- 모든 요청/응답 로그
- 서버 통계 (성공률, 실패율)
- API 엔드포인트 테스트 UI
- WebSocket 연결 상태

## 빠른 시작

### 사전 요구사항

- Node.js 20.x 이상
- npm 10.x 이상

### 설치 및 실행

#### 방법 1: 통합 실행 (권장) 🚀

백엔드와 프론트엔드를 동시에 실행합니다.

**Linux/Mac:**
```bash
# 의존성 설치
npm run install:all

# 개발 서버 시작 (concurrently 사용)
npm run dev

# 또는 bash 스크립트 사용
./start.sh
```

**Windows CMD:**
```cmd
REM 의존성 설치
npm run install:all

REM 개발 서버 시작
start.bat
```

**Windows PowerShell:**
```powershell
# 의존성 설치
npm run install:all

# 개발 서버 시작
.\start.ps1
```

#### 방법 2: 개별 실행

```bash
# 1. 백엔드 설치 및 실행
cd backend
npm install
npm run dev

# 2. 프론트엔드 설치 및 실행 (새 터미널)
cd frontend
npm install
npm run dev
```

### 접속

- **대시보드**: http://localhost:5173
- **API 서버**: http://localhost:1818
- **WebSocket**: ws://localhost:1818

## 프로젝트 구조

```
EchoServer/
├── backend/                # 백엔드 (Node.js + Express + WebSocket)
│   ├── src/
│   │   ├── server.js       # 서버 진입점
│   │   ├── routes/         # API 라우트
│   │   ├── websocket/      # WebSocket 핸들러
│   │   ├── middleware/     # 미들웨어
│   │   └── utils/          # 유틸리티
│   ├── tests/              # 테스트 (Jest + Supertest)
│   └── package.json
│
├── frontend/               # 프론트엔드 (React + Vite)
│   ├── src/
│   │   ├── App.jsx         # 메인 컴포넌트
│   │   ├── components/     # UI 컴포넌트
│   │   └── services/       # WebSocket 클라이언트
│   └── package.json
│
└── specs/                  # 기능 명세 문서
    └── 001-echo-server/
        ├── spec.md
        ├── plan.md
        ├── tasks.md
        └── ...
```

## 개발

### 테스트 실행

```bash
cd backend
npm test                    # 모든 테스트
npm run test:coverage       # 커버리지 확인
```

### 프로덕션 빌드

```bash
# 프론트엔드 빌드
cd frontend
npm run build

# 백엔드 프로덕션 실행 (빌드된 프론트엔드 포함)
cd ../backend
npm start
```

## API 문서

전체 API 명세는 [specs/001-echo-server/contracts/openapi.yaml](./specs/001-echo-server/contracts/openapi.yaml)을 참조하세요.

## 상세 가이드

- [백엔드 README](./backend/README.md)
- [프론트엔드 README](./frontend/README.md)
- [Quickstart Guide](./specs/001-echo-server/quickstart.md)

## 기술 스택

### 백엔드
- Node.js 20.x (LTS)
- Express.js 5.x
- ws (WebSocket)
- Jest + Supertest (테스팅)

### 프론트엔드
- React 19.x
- Vite 7.x
- WebSocket API

## 성능 목표

- API 응답 시간: < 1초 (지연 API 제외)
- WebSocket 연결 수립: < 100ms
- 대시보드 실시간 업데이트: < 500ms
- 동시 연결 지원: 100개 이상

## 테스트 커버리지

- **단위 테스트**: 인메모리 저장소
- **계약 테스트**: 10개 API 엔드포인트
- **통합 테스트**: WebSocket 실시간 통신

목표 커버리지: 70% 이상

## 라이선스

ISC

## 기여

이슈 및 PR은 언제든지 환영합니다!
