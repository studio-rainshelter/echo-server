# Tasks: 웹소켓 에코 서버 및 대시보드 로깅

**Input**: Design documents from `/specs/002-websocket-echo-api/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Jest를 사용한 통합 테스트 포함 (spec.md 요구사항)

**Organization**: 작업은 User Story별로 그룹화되어 각 스토리를 독립적으로 구현하고 테스트할 수 있습니다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능 (다른 파일, 의존성 없음)
- **[Story]**: 작업이 속한 User Story (예: US1, US2, US3)
- 설명에 정확한 파일 경로 포함

## Path Conventions

이 프로젝트는 Web application 구조를 사용합니다:
- Backend: `backend/src/`, `backend/tests/`
- Frontend: `frontend/src/`

---

## Phase 1: Setup (공유 인프라)

**목적**: 프로젝트 초기화 및 기본 구조 생성

- [ ] T001 package.json에 백엔드 의존성 추가 (express ^5.1.0, ws ^8.18.3, jest ^30.2.0, supertest ^7.1.4)
- [ ] T002 backend/src/ 디렉토리 구조 생성 (websocket/, routes/, middleware/)
- [ ] T003 [P] frontend/src/ 디렉토리 구조 생성 (components/, services/)
- [ ] T004 [P] backend/tests/ 디렉토리 구조 생성 (integration/, unit/)

---

## Phase 2: Foundational (필수 선행 작업)

**목적**: 모든 User Story 구현 전에 완료되어야 하는 핵심 인프라

**⚠️ 중요**: 이 단계가 완료되기 전까지 User Story 작업을 시작할 수 없습니다

- [ ] T005 backend/src/server.js에 Express 서버 및 HTTP 서버 설정
- [ ] T006 [P] backend/src/websocket/connection-manager.js 생성 - WebSocket 연결 추적 클래스 (Map 기반)
- [ ] T007 [P] backend/src/websocket/log-manager.js 생성 - 메시지 로그 관리 클래스 (순환 버퍼, 최대 1000개)
- [ ] T008 [P] backend/src/websocket/statistics-manager.js 생성 - 서버 통계 관리 싱글톤 클래스
- [ ] T009 backend/src/server.js에 WebSocket 서버 통합 (ws 라이브러리 사용)
- [ ] T010 환경 변수 설정 (.env 파일) - PORT, MAX_MESSAGE_SIZE 등

**Checkpoint**: 기반 인프라 준비 완료 - User Story 구현을 병렬로 시작할 수 있습니다

---

## Phase 3: User Story 1 - 웹소켓 연결 및 메시지 에코 (Priority: P1) 🎯 MVP

**목표**: 외부 클라이언트가 웹소켓 서버에 연결하여 메시지를 전송하면, 서버는 받은 메시지를 그대로 응답합니다.

**독립 테스트**: wscat 또는 브라우저 콘솔을 사용하여 `/ws/echo`에 연결하고 메시지를 전송하면 동일한 메시지가 응답으로 반환되는지 확인

### Tests for User Story 1

> **참고: 테스트를 먼저 작성하고, 구현 전에 실패하는지 확인**

- [ ] T011 [US1] backend/tests/integration/websocket-echo.test.js 생성 - 텍스트 메시지 에코 테스트
- [ ] T012 [US1] backend/tests/integration/websocket-echo.test.js에 JSON 메시지 에코 테스트 추가
- [ ] T013 [US1] backend/tests/integration/websocket-echo.test.js에 바이너리 메시지 에코 테스트 추가
- [ ] T014 [US1] backend/tests/integration/websocket-echo.test.js에 다중 클라이언트 동시 연결 테스트 추가

### Implementation for User Story 1

- [ ] T015 [US1] backend/src/websocket/echo-handler.js 생성 - 웹소켓 에코 메시지 처리 로직
- [ ] T016 [US1] backend/src/server.js에 `/ws/echo` 엔드포인트 등록 및 echo-handler 연결
- [ ] T017 [US1] backend/src/websocket/echo-handler.js에 클라이언트 정보 추출 (IP, User-Agent)
- [ ] T018 [US1] backend/src/websocket/echo-handler.js에 메시지 타입 결정 로직 추가 (text/json/binary)
- [ ] T019 [US1] backend/src/websocket/echo-handler.js에 메시지 크기 검증 (최대 1MB)
- [ ] T020 [US1] backend/src/websocket/echo-handler.js에 에러 핸들링 (error, close 이벤트)
- [ ] T021 [US1] backend/src/websocket/echo-handler.js에 Ping/Pong 메커니즘 구현 (30초 주기)
- [ ] T022 [US1] ConnectionManager를 사용한 연결 추가/제거 통합

**Checkpoint**: 이 시점에서 User Story 1은 완전히 작동하며 독립적으로 테스트 가능합니다

---

## Phase 4: User Story 2 - 대시보드에 메시지 로그 기록 (Priority: P2)

**목표**: 외부 클라이언트가 웹소켓을 통해 전송한 모든 메시지는 대시보드에 실시간으로 기록되어 관리자가 확인할 수 있습니다.

**독립 테스트**: wscat으로 메시지를 전송한 후, 브라우저에서 대시보드(`http://localhost:5173`)에 접속하여 메시지가 로그에 표시되는지 확인

### Tests for User Story 2

- [ ] T023 [P] [US2] backend/tests/unit/log-manager.test.js 생성 - LogManager 단위 테스트 (로그 추가/조회/1000개 제한)
- [ ] T024 [P] [US2] backend/tests/integration/websocket-echo.test.js에 로그 기록 통합 테스트 추가

### Backend Implementation for User Story 2

- [ ] T025 [US2] backend/src/websocket/echo-handler.js에 메시지 수신 시 LogManager.addMessageLog 호출 추가
- [ ] T026 [US2] backend/src/websocket/echo-handler.js에 연결/해제 시 LogManager.addConnectionEvent 호출 추가
- [ ] T027 [US2] backend/src/routes/logs.js 생성 - 메시지 로그 조회 REST API (GET /api/logs/messages)
- [ ] T028 [US2] backend/src/routes/logs.js에 쿼리 파라미터 처리 (limit, connectionId)
- [ ] T029 [US2] backend/src/server.js에 logs 라우트 등록
- [ ] T030 [US2] backend/src/server.js에 `/ws/dashboard` 웹소켓 엔드포인트 추가
- [ ] T031 [US2] backend/src/websocket/dashboard-broadcaster.js 생성 - 대시보드 클라이언트에 실시간 로그 브로드캐스트
- [ ] T032 [US2] LogManager에 이벤트 발행 기능 추가 (새 로그 추가 시 대시보드에 알림)

### Frontend Implementation for User Story 2

- [ ] T033 [P] [US2] frontend/src/services/websocket-service.js 생성 - 대시보드 ↔ 백엔드 웹소켓 통신
- [ ] T034 [P] [US2] frontend/src/components/MessageLogViewer.jsx 생성 - 메시지 로그 뷰어 컴포넌트
- [ ] T035 [US2] frontend/src/components/MessageLogViewer.jsx에 실시간 업데이트 로직 (WebSocket 메시지 수신)
- [ ] T036 [US2] frontend/src/components/MessageLogViewer.jsx에 메시지 내용, 타임스탬프, 클라이언트 정보 표시
- [ ] T037 [US2] frontend/src/App.jsx에 MessageLogViewer 컴포넌트 통합

**Checkpoint**: 이 시점에서 User Story 1과 2가 모두 독립적으로 작동합니다

---

## Phase 5: User Story 3 - 연결 상태 및 통계 모니터링 (Priority: P3)

**목표**: 관리자는 대시보드를 통해 현재 연결된 클라이언트 수, 총 메시지 수, 연결/해제 이벤트를 모니터링할 수 있습니다.

**독립 테스트**: 여러 wscat 클라이언트를 연결/해제하면서 대시보드에서 통계 정보가 정확하게 업데이트되는지 확인

### Tests for User Story 3

- [ ] T038 [P] [US3] backend/tests/unit/statistics-manager.test.js 생성 - StatisticsManager 단위 테스트
- [ ] T039 [P] [US3] backend/tests/integration/websocket-echo.test.js에 통계 업데이트 통합 테스트 추가

### Backend Implementation for User Story 3

- [ ] T040 [US3] backend/src/routes/statistics.js 생성 - 서버 통계 조회 REST API (GET /api/statistics)
- [ ] T041 [US3] backend/src/routes/connections.js 생성 - 활성 연결 목록 조회 REST API (GET /api/connections)
- [ ] T042 [US3] backend/src/server.js에 statistics 및 connections 라우트 등록
- [ ] T043 [US3] backend/src/websocket/echo-handler.js에 StatisticsManager 통계 업데이트 호출 추가
- [ ] T044 [US3] backend/src/websocket/dashboard-broadcaster.js에 통계 업데이트 브로드캐스트 기능 추가

### Frontend Implementation for User Story 3

- [ ] T045 [P] [US3] frontend/src/components/ConnectionStats.jsx 생성 - 연결 통계 표시 컴포넌트
- [ ] T046 [P] [US3] frontend/src/components/EventTimeline.jsx 생성 - 연결/해제 이벤트 타임라인 컴포넌트
- [ ] T047 [US3] frontend/src/components/ConnectionStats.jsx에 실시간 통계 업데이트 (WebSocket 메시지 수신)
- [ ] T048 [US3] frontend/src/components/EventTimeline.jsx에 연결 이벤트 로그 표시
- [ ] T049 [US3] frontend/src/App.jsx에 ConnectionStats 및 EventTimeline 컴포넌트 통합

**Checkpoint**: 모든 User Story가 독립적으로 작동합니다

---

## Phase 6: Polish & Cross-Cutting Concerns

**목적**: 여러 User Story에 영향을 미치는 개선 사항

- [ ] T050 [P] backend/src/websocket/echo-handler.js에 상세 로깅 추가 (연결, 메시지, 에러)
- [ ] T051 [P] frontend/src/components/에 CSS 스타일링 추가 (모든 컴포넌트)
- [ ] T052 코드 리팩토링 - 중복 코드 제거 및 함수 분리
- [ ] T053 [P] backend/tests/integration/websocket-echo.test.js에 100개 동시 연결 성능 테스트 추가
- [ ] T054 [P] README.md 업데이트 - 프로젝트 설명, 실행 방법, API 문서
- [ ] T055 quickstart.md 시나리오 검증 (브라우저 콘솔, wscat, Node.js 스크립트)
- [ ] T056 보안 강화 - 메시지 크기 제한, 입력 검증
- [ ] T057 [P] frontend/src/App.jsx에 에러 처리 및 로딩 상태 추가

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존성 없음 - 즉시 시작 가능
- **Foundational (Phase 2)**: Setup 완료 후 시작 - 모든 User Story를 차단
- **User Stories (Phase 3-5)**: 모두 Foundational 완료에 의존
  - User Story들은 병렬로 진행 가능 (인력이 충분한 경우)
  - 또는 우선순위 순서대로 순차 진행 (P1 → P2 → P3)
- **Polish (Phase 6)**: 원하는 모든 User Story가 완료된 후 시작

### User Story Dependencies

- **User Story 1 (P1)**: Foundational 완료 후 시작 가능 - 다른 스토리에 대한 의존성 없음
- **User Story 2 (P2)**: Foundational 완료 후 시작 가능 - US1과 통합되지만 독립적으로 테스트 가능
- **User Story 3 (P3)**: Foundational 완료 후 시작 가능 - US1/US2와 통합되지만 독립적으로 테스트 가능

### Within Each User Story

- 테스트 → 구현 전에 먼저 작성하고 실패 확인
- 모델/매니저 → 서비스/핸들러 전에 완료
- 서비스/핸들러 → 엔드포인트/라우트 전에 완료
- 핵심 구현 → 통합 전에 완료
- 스토리 완료 → 다음 우선순위로 이동 전에 검증

### Parallel Opportunities

- Setup의 모든 [P] 작업은 병렬 실행 가능
- Foundational의 모든 [P] 작업은 병렬 실행 가능 (Phase 2 내에서)
- Foundational 완료 후, 모든 User Story를 병렬로 시작 가능 (팀 역량에 따라)
- 각 User Story 내의 [P] 테스트는 병렬 실행 가능
- 각 User Story 내의 [P] 구현 작업은 병렬 실행 가능
- 다른 팀원이 다른 User Story를 병렬로 작업 가능

---

## Parallel Example: User Story 1

```bash
# User Story 1의 모든 테스트를 함께 실행:
Task: "backend/tests/integration/websocket-echo.test.js 생성 - 텍스트 메시지 에코 테스트"

# User Story 1의 초기 구현 작업:
Task: "backend/src/websocket/echo-handler.js 생성 - 웹소켓 에코 메시지 처리 로직"
```

---

## Parallel Example: User Story 2

```bash
# User Story 2의 백엔드와 프론트엔드를 병렬로 작업:
Backend: "backend/src/websocket/dashboard-broadcaster.js 생성"
Frontend: "frontend/src/services/websocket-service.js 생성"
Frontend: "frontend/src/components/MessageLogViewer.jsx 생성"
```

---

## Implementation Strategy

### MVP First (User Story 1만)

1. Phase 1: Setup 완료
2. Phase 2: Foundational 완료 (중요 - 모든 스토리를 차단)
3. Phase 3: User Story 1 완료
4. **중지 및 검증**: User Story 1을 독립적으로 테스트
5. 준비되면 배포/데모

### Incremental Delivery

1. Setup + Foundational 완료 → 기반 준비
2. User Story 1 추가 → 독립 테스트 → 배포/데모 (MVP!)
3. User Story 2 추가 → 독립 테스트 → 배포/데모
4. User Story 3 추가 → 독립 테스트 → 배포/데모
5. 각 스토리는 이전 스토리를 깨지 않고 가치를 추가

### Parallel Team Strategy

여러 개발자가 있는 경우:

1. 팀이 함께 Setup + Foundational 완료
2. Foundational 완료 후:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. 스토리들이 독립적으로 완료되고 통합

---

## Task Summary

- **총 작업 수**: 57개
- **User Story 1 작업**: 12개 (T011-T022)
- **User Story 2 작업**: 15개 (T023-T037)
- **User Story 3 작업**: 12개 (T038-T049)
- **Setup 작업**: 4개 (T001-T004)
- **Foundational 작업**: 6개 (T005-T010)
- **Polish 작업**: 8개 (T050-T057)

### Parallel Opportunities Identified

- Setup 단계: 2개 병렬 작업 (T003, T004)
- Foundational 단계: 3개 병렬 작업 (T006, T007, T008)
- User Story 1: 테스트 작성 단계에서 병렬 가능
- User Story 2: 백엔드 2개, 프론트엔드 2개 병렬 작업 (T023-T024, T033-T034)
- User Story 3: 백엔드 2개, 프론트엔드 2개 병렬 작업 (T038-T039, T045-T046)
- Polish 단계: 4개 병렬 작업 (T050, T051, T053, T054)

### Independent Test Criteria

- **User Story 1**: wscat 연결 → 메시지 전송 → 동일한 응답 수신 확인
- **User Story 2**: 메시지 전송 → 대시보드에서 로그 확인
- **User Story 3**: 클라이언트 연결/해제 → 대시보드에서 통계 및 이벤트 확인

### Suggested MVP Scope

**MVP = User Story 1만 구현**
- Setup + Foundational + User Story 1 (총 22개 작업)
- 핵심 에코 기능 제공
- 대시보드 없이 wscat/브라우저 콘솔로 테스트 가능
- 가장 빠른 검증 가능

---

## Notes

- [P] 작업 = 다른 파일, 의존성 없음
- [Story] 레이블은 작업을 특정 User Story에 매핑하여 추적 가능
- 각 User Story는 독립적으로 완료 및 테스트 가능
- 구현 전에 테스트가 실패하는지 확인
- 각 작업 또는 논리적 그룹 후에 커밋
- 어떤 체크포인트에서든 중지하여 스토리를 독립적으로 검증
- 피할 것: 모호한 작업, 동일 파일 충돌, 스토리 독립성을 깨는 크로스 스토리 의존성
