# Implementation Tasks: 에코 서버 (Echo Server)

**Feature**: 001-echo-server
**Branch**: `001-echo-server`
**Generated**: 2025-11-02
**Plan**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md)

---

## 개요

이 문서는 에코 서버 구현을 위한 실행 가능한 작업 목록입니다. User Story 우선순위(P1 → P2 → P3)에 따라 구조화되어 있으며, 각 단계는 독립적으로 테스트 가능한 증분 단위입니다.

### User Story 매핑

| User Story | Priority | 주요 컴포넌트 |
|------------|----------|--------------|
| **US1**: REST API 테스트 및 검증 | P1 | 10개 API 엔드포인트, 로깅 시스템 |
| **US2**: WebSocket 실시간 통신 | P2 | WebSocket 서버, 에코 로직 |
| **US3**: 실시간 모니터링 대시보드 | P3 | React 대시보드, 실시간 업데이트 |

### MVP 권장 범위

**MVP = User Story 1 (P1)**만 구현하면 핵심 기능이 작동합니다:
- 10개 REST API 엔드포인트
- 로깅 시스템
- 기본 서버 상태 조회

---

## Phase 1: Setup & Project Initialization

**목표**: 프로젝트 구조 생성 및 기본 의존성 설치

### Setup Tasks

- [X] T001 프로젝트 루트에 backend/ 및 frontend/ 디렉토리 생성
- [X] T002 backend/에 Node.js 프로젝트 초기화 (npm init -y)
- [X] T003 [P] backend/에 Express.js 설치 (npm install express)
- [X] T004 [P] backend/에 ws 설치 (npm install ws)
- [X] T005 [P] backend/에 uuid 설치 (npm install uuid)
- [X] T006 [P] backend/에 cors 설치 (npm install cors)
- [X] T007 [P] backend/에 개발 의존성 설치 (npm install --save-dev jest supertest)
- [X] T008 backend/에 프로젝트 구조 생성 (src/, tests/)
- [X] T009 backend/src/에 하위 디렉토리 생성 (routes/, websocket/, middleware/, utils/)
- [X] T010 backend/tests/에 하위 디렉토리 생성 (contract/, integration/, unit/)
- [X] T011 frontend/에 Vite + React 프로젝트 생성 (npm create vite@latest frontend -- --template react)
- [X] T012 frontend/src/에 하위 디렉토리 생성 (components/, services/)
- [X] T013 [P] backend/package.json에 스크립트 추가 (dev, start, test)
- [X] T014 [P] frontend/package.json에 스크립트 확인 (dev, build, preview)
- [X] T015 backend/에 .env 파일 생성 (PORT=3000, NODE_ENV=development)

---

## Phase 2: Foundational Infrastructure

**목표**: 모든 User Story가 의존하는 공통 기반 구현

**독립 테스트 기준**:
- 서버가 정상적으로 시작되고 3000번 포트를 리스닝한다
- 인메모리 저장소가 초기화되고 통계가 정상 작동한다

### Foundational Tasks

- [X] T016 backend/src/utils/store.js 파일 생성
- [X] T017 backend/src/utils/store.js에 인메모리 저장소 구조 구현 (requests, responses, connections, statistics 배열/객체)
- [X] T018 backend/src/utils/store.js에 addRequest() 함수 구현 (UUID 생성, 순환 버퍼 1000개 제한)
- [X] T019 backend/src/utils/store.js에 addResponse() 함수 구현 (UUID 생성, requestId 연결)
- [X] T020 backend/src/utils/store.js에 updateStatistics() 함수 구현 (lastUpdated 자동 갱신)
- [X] T021 backend/src/utils/store.js에 addConnection() 함수 구현 (WebSocket 연결 추적)
- [X] T022 backend/src/utils/store.js 모듈 내보내기 (module.exports)
- [X] T023 backend/src/middleware/logger.js 파일 생성
- [X] T024 backend/src/middleware/logger.js에 EventEmitter 기반 로거 구현 (logEmitter 생성)
- [X] T025 backend/src/middleware/logger.js에 로깅 미들웨어 함수 구현 (res.on('finish') 이벤트 핸들러)
- [X] T026 backend/src/middleware/logger.js에서 store.addRequest/addResponse 호출
- [X] T027 backend/src/middleware/errorHandler.js 파일 생성
- [X] T028 backend/src/middleware/errorHandler.js에 중앙화 에러 핸들러 구현 (표준 JSON 에러 형식)
- [X] T029 backend/src/server.js 파일 생성
- [X] T030 backend/src/server.js에 Express 앱 초기화
- [X] T031 backend/src/server.js에 CORS 미들웨어 설정 (개발 환경 전체 허용)
- [X] T032 backend/src/server.js에 JSON body parser 설정 (express.json())
- [X] T033 backend/src/server.js에 로깅 미들웨어 연결
- [X] T034 backend/src/server.js에 에러 핸들러 미들웨어 연결
- [X] T035 backend/src/server.js에서 HTTP 서버 생성 및 포트 3000 리스닝
- [X] T036 [P] backend/tests/unit/store.test.js 파일 생성
- [X] T037 [P] backend/tests/unit/store.test.js에 addRequest 순환 버퍼 테스트 작성
- [X] T038 [P] backend/tests/unit/store.test.js에 updateStatistics 테스트 작성

---

## Phase 3: User Story 1 - REST API 테스트 및 검증 (P1)

**User Story**: 개발자가 REST API 엔드포인트를 테스트하고 다양한 HTTP 메서드와 응답 형식을 검증할 수 있어야 합니다.

**독립 테스트 기준**:
- 10개 API 엔드포인트 각각 호출 시 올바른 에코 응답과 HTTP 상태 코드를 받는다
- `/api/echo?message=hello` GET 요청 시 쿼리 파라미터가 JSON으로 에코된다
- `/api/echo` POST 요청 시 body 데이터가 에코된다
- `/api/delay/2000` GET 요청 시 2초 후 응답을 받는다
- `/api/error/404` GET 요청 시 404 상태 코드와 에러 메시지를 받는다

### API Implementation Tasks

- [X] T039 [US1] backend/src/routes/api.js 파일 생성
- [X] T040 [US1] backend/src/routes/api.js에 Express Router 초기화
- [X] T041 [P] [US1] backend/src/routes/api.js에 GET /api/echo 엔드포인트 구현 (쿼리 파라미터 에코)
- [X] T042 [P] [US1] backend/src/routes/api.js에 POST /api/echo 엔드포인트 구현 (body 데이터 에코)
- [X] T043 [P] [US1] backend/src/routes/api.js에 GET /api/users 엔드포인트 구현 (Mock 사용자 목록 반환)
- [X] T044 [P] [US1] backend/src/routes/api.js에 POST /api/users 엔드포인트 구현 (사용자 생성 시뮬레이션, 201 상태 코드)
- [X] T045 [P] [US1] backend/src/routes/api.js에 GET /api/status 엔드포인트 구현 (store.statistics 반환, process.uptime() 사용)
- [X] T046 [P] [US1] backend/src/routes/api.js에 POST /api/json 엔드포인트 구현 (JSON 데이터 처리)
- [X] T047 [P] [US1] backend/src/routes/api.js에 GET /api/delay/:ms 엔드포인트 구현 (setTimeout 사용, 파라미터 검증 0-10000ms)
- [X] T048 [P] [US1] backend/src/routes/api.js에 PUT /api/update/:id 엔드포인트 구현 (업데이트 시뮬레이션)
- [X] T049 [P] [US1] backend/src/routes/api.js에 DELETE /api/delete/:id 엔드포인트 구현 (삭제 시뮬레이션)
- [X] T050 [P] [US1] backend/src/routes/api.js에 GET /api/error/:code 엔드포인트 구현 (요청된 상태 코드로 에러 응답)
- [X] T051 [P] [US1] backend/src/routes/api.js에 GET /api/logs 엔드포인트 구현 (store.requests/responses 조회, limit 쿼리 파라미터)
- [X] T052 [US1] backend/src/routes/api.js 라우터 내보내기 (module.exports)
- [X] T053 [US1] backend/src/server.js에 /api 라우터 마운트 (app.use('/api', apiRouter))

### API Contract Tests

- [X] T054 [P] [US1] backend/tests/contract/api.test.js 파일 생성
- [X] T055 [P] [US1] backend/tests/contract/api.test.js에 GET /api/echo 계약 테스트 작성 (Supertest 사용)
- [X] T056 [P] [US1] backend/tests/contract/api.test.js에 POST /api/echo 계약 테스트 작성
- [X] T057 [P] [US1] backend/tests/contract/api.test.js에 GET /api/users 계약 테스트 작성 (배열 반환 검증)
- [X] T058 [P] [US1] backend/tests/contract/api.test.js에 POST /api/users 계약 테스트 작성 (201 상태 코드 검증)
- [X] T059 [P] [US1] backend/tests/contract/api.test.js에 GET /api/status 계약 테스트 작성 (statistics 스키마 검증)
- [X] T060 [P] [US1] backend/tests/contract/api.test.js에 POST /api/json 계약 테스트 작성
- [X] T061 [P] [US1] backend/tests/contract/api.test.js에 GET /api/delay/:ms 계약 테스트 작성 (2초 지연 검증)
- [X] T062 [P] [US1] backend/tests/contract/api.test.js에 PUT /api/update/:id 계약 테스트 작성
- [X] T063 [P] [US1] backend/tests/contract/api.test.js에 DELETE /api/delete/:id 계약 테스트 작성
- [X] T064 [P] [US1] backend/tests/contract/api.test.js에 GET /api/error/:code 계약 테스트 작성 (404, 500 검증)
- [X] T065 [P] [US1] backend/tests/contract/api.test.js에 GET /api/logs 계약 테스트 작성 (limit 파라미터 검증)

### US1 Integration

- [X] T066 [US1] backend/에서 npm test 실행하여 모든 US1 테스트 통과 확인
- [X] T067 [US1] backend/에서 npm run dev 실행 후 수동으로 10개 엔드포인트 테스트 (curl 또는 Postman)

---

## Phase 4: User Story 2 - WebSocket 실시간 통신 (P2)

**User Story**: 개발자가 WebSocket 연결을 통해 실시간 양방향 통신을 테스트할 수 있어야 합니다.

**독립 테스트 기준**:
- WebSocket 클라이언트가 서버에 연결하면 환영 메시지를 받는다
- 클라이언트가 메시지를 보내면 동일한 메시지가 에코되어 돌아온다
- 여러 클라이언트가 동시에 연결되어도 각자 자신의 메시지만 에코 받는다
- 연결 종료 시 클라이언트가 종료 이벤트를 받는다

**의존성**: Phase 3 (US1) 완료 필요 (store.statistics 업데이트를 위해)

### WebSocket Implementation Tasks

- [X] T068 [US2] backend/src/websocket/handler.js 파일 생성
- [X] T069 [US2] backend/src/websocket/handler.js에 WebSocket 서버 초기화 함수 구현 (ws.Server 사용)
- [X] T070 [US2] backend/src/websocket/handler.js에 connection 이벤트 핸들러 구현 (환영 메시지 전송, connectionId 생성)
- [X] T071 [US2] backend/src/websocket/handler.js에서 store.addConnection() 호출 (연결 정보 저장)
- [X] T072 [US2] backend/src/websocket/handler.js에서 store.updateStatistics() 호출 (activeWebSockets 증가)
- [X] T073 [P] [US2] backend/src/websocket/handler.js에 message 이벤트 핸들러 구현 (에코 메시지, ping/pong 처리)
- [X] T074 [P] [US2] backend/src/websocket/handler.js에 JSON 파싱 및 타입별 분기 처리 (echo, ping)
- [X] T075 [P] [US2] backend/src/websocket/handler.js에 입력 검증 (메시지 크기 제한 1MB)
- [X] T076 [P] [US2] backend/src/websocket/handler.js에 Rate limiting 구현 (100 msg/s)
- [X] T077 [US2] backend/src/websocket/handler.js에 close 이벤트 핸들러 구현 (연결 종료 처리)
- [X] T078 [US2] backend/src/websocket/handler.js에서 연결 종료 시 store 업데이트 (status → disconnected, disconnectedAt 설정)
- [X] T079 [US2] backend/src/websocket/handler.js에 error 이벤트 핸들러 구현 (에러 로깅)
- [X] T080 [US2] backend/src/websocket/handler.js 모듈 내보내기 (module.exports)
- [X] T081 [US2] backend/src/server.js에서 HTTP 서버를 WebSocket 핸들러에 전달 (동일 포트 사용)
- [X] T082 [US2] backend/src/server.js에서 WebSocket 서버 초기화

### WebSocket Integration Tests

- [X] T083 [P] [US2] backend/tests/integration/websocket.test.js 파일 생성
- [X] T084 [P] [US2] backend/tests/integration/websocket.test.js에 연결 수립 테스트 작성 (환영 메시지 검증)
- [X] T085 [P] [US2] backend/tests/integration/websocket.test.js에 에코 메시지 테스트 작성 (ws 클라이언트 모드 사용)
- [X] T086 [P] [US2] backend/tests/integration/websocket.test.js에 ping/pong 테스트 작성
- [X] T087 [P] [US2] backend/tests/integration/websocket.test.js에 다중 클라이언트 동시 연결 테스트 작성 (3개 클라이언트)
- [X] T088 [P] [US2] backend/tests/integration/websocket.test.js에 연결 종료 테스트 작성 (close 이벤트 검증)
- [X] T089 [P] [US2] backend/tests/integration/websocket.test.js에 Rate limiting 테스트 작성 (100 msg/s 초과 시 종료 검증)

### US2 Integration

- [X] T090 [US2] backend/에서 npm test 실행하여 모든 US2 테스트 통과 확인
- [X] T091 [US2] WebSocket 클라이언트(wscat 또는 브라우저 콘솔)로 수동 테스트

---

## Phase 5: User Story 3 - 실시간 모니터링 대시보드 (P3)

**User Story**: 개발자가 웹 브라우저에서 실시간 대시보드를 통해 모든 요청/응답 로그와 서버 상태를 시각적으로 모니터링할 수 있어야 합니다.

**독립 테스트 기준**:
- 브라우저에서 대시보드에 접속하면 10개 API 엔드포인트 목록이 표시된다
- REST API 요청 발생 시 대시보드의 로그 영역에 실시간으로 Request/Response 정보가 표시된다
- 대시보드에서 특정 API의 "테스트" 버튼 클릭 시 해당 API가 호출되고 응답이 표시된다
- 대시보드 통계 섹션에 총 요청 수, 성공률, 실패율이 정확하게 표시된다
- WebSocket 연결 상태가 실시간으로 표시된다

**의존성**: Phase 3 (US1), Phase 4 (US2) 완료 필요

### Backend WebSocket Log Streaming

- [ ] T092 [US3] backend/src/middleware/logger.js에 logEmitter.on('log') 이벤트 핸들러 추가
- [ ] T093 [US3] backend/src/middleware/logger.js에서 모든 WebSocket 클라이언트에게 로그 브로드캐스트 (type: 'log')
- [ ] T094 [US3] backend/src/websocket/handler.js에서 통계 변경 시 브로드캐스트 (type: 'stats')

### Frontend Setup

- [ ] T095 [P] [US3] frontend/src/services/websocket.js 파일 생성
- [ ] T096 [P] [US3] frontend/src/services/websocket.js에 WebSocket 클라이언트 클래스 구현 (연결, 재연결 로직)
- [ ] T097 [P] [US3] frontend/src/services/websocket.js에 메시지 타입별 핸들러 등록 기능 구현 (onLog, onStats, onConnection)
- [ ] T098 [US3] frontend/src/services/websocket.js에 자동 재연결 로직 구현 (연결 끊김 시 3초 후 재시도)

### Frontend Components

- [ ] T099 [P] [US3] frontend/src/components/ApiList.jsx 파일 생성
- [ ] T100 [P] [US3] frontend/src/components/ApiList.jsx에 10개 API 엔드포인트 정보 하드코딩 (이름, 설명, 메서드, 경로)
- [ ] T101 [P] [US3] frontend/src/components/ApiList.jsx에 각 엔드포인트별 "테스트" 버튼 구현 (fetch API 호출)
- [ ] T102 [P] [US3] frontend/src/components/LogViewer.jsx 파일 생성
- [ ] T103 [P] [US3] frontend/src/components/LogViewer.jsx에 로그 목록 표시 (메서드, 경로, 상태 코드, 응답 시간)
- [ ] T104 [P] [US3] frontend/src/components/LogViewer.jsx에 실시간 스크롤 기능 구현 (최신 로그 자동 표시)
- [ ] T105 [P] [US3] frontend/src/components/Stats.jsx 파일 생성
- [ ] T106 [P] [US3] frontend/src/components/Stats.jsx에 서버 통계 표시 (총 요청, 성공/실패율, WebSocket 연결 수, 가동 시간)
- [ ] T107 [P] [US3] frontend/src/components/Stats.jsx에 성공률/실패율 계산 로직 구현

### Frontend Integration

- [ ] T108 [US3] frontend/src/App.jsx에서 WebSocket 클라이언트 초기화 (useEffect)
- [ ] T109 [US3] frontend/src/App.jsx에 useState로 로그 및 통계 상태 관리
- [ ] T110 [US3] frontend/src/App.jsx에서 WebSocket 메시지 수신 시 상태 업데이트 (onLog, onStats)
- [ ] T111 [US3] frontend/src/App.jsx에 ApiList, LogViewer, Stats 컴포넌트 배치
- [ ] T112 [US3] frontend/src/App.jsx에 WebSocket 연결 상태 표시 (연결됨/연결 끊김)
- [ ] T113 [US3] frontend/src/App.jsx에 기본 CSS 스타일링 (그리드 레이아웃)

### Frontend Testing (Optional - 명세에 테스트 요청 없음)

- [ ] T114 [P] [US3] frontend/tests/components/LogViewer.test.jsx 파일 생성 (선택 사항)
- [ ] T115 [P] [US3] frontend/tests/components/LogViewer.test.jsx에 컴포넌트 렌더링 테스트 작성 (선택 사항)

### US3 Integration

- [ ] T116 [US3] frontend/에서 npm run dev 실행
- [ ] T117 [US3] 브라우저에서 http://localhost:5173 접속하여 대시보드 확인
- [ ] T118 [US3] 대시보드에서 API 테스트 버튼 클릭 후 실시간 로그 업데이트 확인
- [ ] T119 [US3] 별도 터미널에서 curl로 API 호출 후 대시보드 로그 업데이트 확인

---

## Phase 6: Polish & Cross-Cutting Concerns

**목표**: 프로덕션 준비 및 최종 검증

### Polish Tasks

- [ ] T120 [P] backend/에 README.md 생성 (설치 방법, 실행 방법, 테스트 방법)
- [ ] T121 [P] frontend/에 README.md 생성 (개발 서버 실행, 빌드 방법)
- [ ] T122 backend/package.json에 test:coverage 스크립트 추가 (jest --coverage)
- [ ] T123 backend/에서 npm run test:coverage 실행하여 70% 이상 커버리지 확인
- [ ] T124 frontend/에서 npm run build 실행하여 프로덕션 빌드 성공 확인
- [ ] T125 backend/src/server.js에 프로덕션 모드에서 정적 파일 서빙 추가 (frontend/dist 폴더)
- [ ] T126 backend/에 .gitignore 생성 (node_modules/, .env, coverage/)
- [ ] T127 [P] frontend/에 .gitignore 확인 (dist/, node_modules/)
- [ ] T128 프로젝트 루트에 README.md 생성 (전체 프로젝트 개요, quickstart.md 링크)
- [ ] T129 모든 엔드포인트 수동 테스트 (Postman 또는 curl 스크립트)
- [ ] T130 WebSocket 연결 100개 동시 연결 부하 테스트 (선택 사항)

---

## Dependencies & Execution Order

### Story Completion Order

```
Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3 (US1) → Phase 4 (US2) → Phase 5 (US3) → Phase 6 (Polish)
```

### Critical Path

1. **Setup** (T001-T015): 프로젝트 초기화
2. **Foundational** (T016-T038): 공통 인프라
3. **US1** (T039-T067): REST API (MVP)
4. **US2** (T068-T091): WebSocket (US1 의존)
5. **US3** (T092-T119): 대시보드 (US1, US2 의존)
6. **Polish** (T120-T130): 최종 마무리

### Phase 간 의존성

- **Phase 2 → Phase 3**: store, 로깅 미들웨어 필요
- **Phase 3 → Phase 4**: statistics 업데이트 로직 재사용
- **Phase 3, 4 → Phase 5**: REST API와 WebSocket이 대시보드 데이터 소스
- **Phase 5 → Phase 6**: 프로덕션 빌드는 프론트엔드 완성 후

### Parallel Execution Opportunities

#### Phase 1: Setup (모두 병렬 가능)
- T003-T007 (의존성 설치) 병렬 실행 가능
- T013-T014 (스크립트 추가) 병렬 실행 가능

#### Phase 2: Foundational
- T036-T038 (테스트 작성) 병렬 실행 가능 (T016-T022 완료 후)

#### Phase 3: US1
- T041-T051 (API 엔드포인트 구현) 모두 병렬 실행 가능 (각 엔드포인트 독립)
- T054-T065 (계약 테스트) 모두 병렬 실행 가능 (T041-T051 완료 후)

#### Phase 4: US2
- T073-T076 (메시지 핸들러) 병렬 실행 가능
- T083-T089 (WebSocket 테스트) 모두 병렬 실행 가능 (T068-T082 완료 후)

#### Phase 5: US3
- T095-T097 (WebSocket 클라이언트), T099-T107 (컴포넌트) 병렬 실행 가능
- T114-T115 (프론트 테스트) 병렬 실행 가능

#### Phase 6: Polish
- T120-T121 (README) 병렬 실행 가능
- T126-T127 (.gitignore) 병렬 실행 가능

---

## Implementation Strategy

### Incremental Delivery Approach

1. **Milestone 1 (MVP)**: Phase 1 + Phase 2 + Phase 3 완료
   - 결과: 10개 REST API 엔드포인트 작동, 로깅 시스템 완성
   - 테스트 방법: `npm test` + 수동 API 테스트

2. **Milestone 2**: Phase 4 완료
   - 결과: WebSocket 실시간 통신 추가
   - 테스트 방법: WebSocket 클라이언트로 에코 테스트

3. **Milestone 3**: Phase 5 완료
   - 결과: 실시간 모니터링 대시보드 완성
   - 테스트 방법: 브라우저에서 대시보드 확인

4. **Milestone 4**: Phase 6 완료
   - 결과: 프로덕션 준비 완료
   - 테스트 방법: 프로덕션 빌드 및 배포 테스트

### Recommended Development Workflow

```bash
# 1. Setup
npm install  # backend/와 frontend/ 각각 실행

# 2. 개발 서버 실행 (2개 터미널)
cd backend && npm run dev
cd frontend && npm run dev

# 3. 테스트 주도 개발 (TDD)
npm test -- --watch  # backend/에서 실행

# 4. 통합 테스트
npm test  # 모든 테스트 실행
npm run test:coverage  # 커버리지 확인

# 5. 프로덕션 빌드
cd frontend && npm run build
cd ../backend && NODE_ENV=production npm start
```

---

## Task Summary

| Phase | Task Count | Parallel Tasks | Estimated Time |
|-------|------------|----------------|----------------|
| Phase 1: Setup | 15 | 8 | 30분 |
| Phase 2: Foundational | 23 | 3 | 2시간 |
| Phase 3: US1 (MVP) | 29 | 23 | 4시간 |
| Phase 4: US2 | 24 | 11 | 3시간 |
| Phase 5: US3 | 28 | 14 | 4시간 |
| Phase 6: Polish | 11 | 4 | 1시간 |
| **Total** | **130** | **63 (48%)** | **~14-16시간** |

### Test Coverage Breakdown

- **Contract Tests**: 12개 (10개 API + 2개 보조 엔드포인트)
- **Integration Tests**: 7개 (WebSocket)
- **Unit Tests**: 2개 (store 로직)
- **Component Tests**: 1개 (선택 사항)
- **Total Test Tasks**: 22개

### Format Validation

✅ 모든 작업이 체크리스트 형식을 준수합니다:
- 체크박스: `- [ ]` 형식
- Task ID: T001-T130 순차적
- [P] 마커: 병렬 가능 작업 표시
- [US1/US2/US3] 레이블: User Story 매핑
- 파일 경로: 각 작업에 구체적 경로 포함

---

## Next Steps

이제 `/speckit.implement` 명령을 실행하여 작업을 순차적으로 실행할 수 있습니다.

**권장 시작점**: Phase 1 (Setup) 완료 후 Phase 2 (Foundational) 시작
**MVP 목표**: Phase 3 (US1) 완료까지 진행하면 핵심 기능 작동

**테스트 실행**:
```bash
cd backend
npm test  # 모든 테스트 실행
npm run test:coverage  # 커버리지 확인 (70% 목표)
```

**수동 테스트 체크리스트**:
- [ ] 10개 API 엔드포인트 각각 호출 (Postman 또는 curl)
- [ ] WebSocket 연결 및 에코 테스트 (wscat 또는 브라우저)
- [ ] 대시보드 접속 및 실시간 로그 확인
- [ ] 통계 정확성 검증
- [ ] 다중 클라이언트 동시 연결 테스트
