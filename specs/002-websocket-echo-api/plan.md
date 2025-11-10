# Implementation Plan: 웹소켓 에코 서버 및 대시보드 로깅

**Branch**: `002-websocket-echo-api` | **Date**: 2025-11-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-websocket-echo-api/spec.md`

## Summary

웹소켓 프로토콜을 통해 클라이언트가 전송한 메시지를 그대로 응답(에코)하는 서버를 구현하고, 모든 메시지를 실시간으로 대시보드에 기록하는 기능을 추가합니다. 기존 Express.js 백엔드와 React 프론트엔드 구조를 활용하며, ws 라이브러리를 사용한 웹소켓 서버를 구축합니다.

## Technical Context

**Language/Version**: Node.js LTS (20.x 이상)
**Primary Dependencies**: Express.js (^5.1.0), ws (^8.18.3), React (프론트엔드)
**Storage**: 메모리 내 임시 저장 (최대 1000개 로그, 서버 재시작 시 삭제)
**Testing**: Jest (^30.2.0), Supertest (^7.1.4)
**Target Platform**: Linux/Windows 서버, 웹 브라우저 (대시보드)
**Project Type**: Web (backend + frontend)
**Performance Goals**:
- 웹소켓 연결 수락: 100ms 이내
- 메시지 에코 응답: 1초 이내
- 대시보드 업데이트: 2초 이내
- 동시 연결 지원: 최소 100개

**Constraints**:
- 메시지 크기: 기본 1MB 이하
- 로그 보관: 최대 1000개 (메모리 관리)
- 응답 시간: p95 < 1초

**Scale/Scope**:
- 100개 이상 동시 연결
- 1000개 메시지 로그 버퍼
- 단일 관리자 대시보드

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. 간결성과 가독성 우선
- ✅ **PASS**: 웹소켓 에코 기능은 매우 간단하며 복잡한 추상화가 필요 없음
- ✅ **PASS**: 기존 프로젝트 구조(backend/frontend)를 유지하여 복잡도 증가 없음
- ✅ **PASS**: 메모리 기반 로그 저장으로 간단한 구현 가능

### II. 최소 의존성
- ✅ **PASS**: 기존 의존성 활용 (Express.js, ws, React)
- ✅ **PASS**: 새로운 외부 라이브러리 추가 불필요
- ✅ **PASS**: 표준 Node.js 기능으로 대부분 구현 가능

### III. 테스트 우선
- ✅ **PASS**: 웹소켓 연결/메시지 에코는 통합 테스트로 검증 가능
- ✅ **PASS**: 기존 Jest + Supertest 환경 활용
- ✅ **RESOLVED**: 웹소켓 테스트 전략 수립 완료 (research.md 참조)
- 목표: 최소 70% 코드 커버리지

### IV. 성능과 응답성
- ✅ **PASS**: 웹소켓 연결 수락 100ms 이내 (헌법 요구사항 충족)
- ✅ **PASS**: 에코 응답 1초 이내 (명세 요구사항)
- ✅ **PASS**: 비동기 로깅으로 응답 시간 영향 최소화
- ✅ **PASS**: 대시보드 실시간 업데이트 2초 이내

### V. 관찰 가능성
- ✅ **PASS**: 모든 웹소켓 메시지를 로깅
- ✅ **PASS**: 연결/해제 이벤트 추적
- ✅ **PASS**: 대시보드를 통한 실시간 모니터링
- ✅ **PASS**: 구조화된 로그 형식 (메시지 내용, 타임스탬프, 클라이언트 정보)

### 헌법 준수 결과 (Phase 1 재검토 완료)
- **전체 평가**: ✅ PASS
- **Phase 0 이후 변경사항**: 모든 기술적 불확실성 해결 (research.md)
- **Phase 1 이후 변경사항**: 데이터 모델 및 API 계약 수립 완료
- **조건부 통과 항목**: 모두 해결됨
- **위반 사항**: 없음
- **다음 단계**: `/speckit.tasks` 명령으로 작업 분해 진행 가능

## Project Structure

### Documentation (this feature)

```text
specs/002-websocket-echo-api/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── websocket/
│   │   ├── echo-handler.js       # 웹소켓 에코 메시지 처리
│   │   ├── connection-manager.js # 연결 관리 및 추적
│   │   └── log-manager.js        # 메시지 로그 관리 (최대 1000개)
│   ├── routes/
│   │   └── logs.js               # 로그 조회 REST API
│   ├── middleware/
│   └── server.js                 # 웹소켓 서버 통합
└── tests/
    ├── integration/
    │   └── websocket-echo.test.js  # 웹소켓 에코 통합 테스트
    └── unit/
        └── log-manager.test.js     # 로그 관리 단위 테스트

frontend/
├── src/
│   ├── components/
│   │   ├── MessageLogViewer.jsx  # 메시지 로그 뷰어
│   │   ├── ConnectionStats.jsx   # 연결 통계 표시
│   │   └── EventTimeline.jsx     # 연결/해제 이벤트 타임라인
│   ├── services/
│   │   └── websocket-service.js  # 대시보드 ↔ 백엔드 웹소켓 통신
│   └── App.jsx                   # 대시보드 메인 (기존 확장)
└── tests/
```

**Structure Decision**: 기존 Web application 구조(backend + frontend)를 유지합니다. 백엔드의 `src/websocket/` 디렉토리에 에코 서버 로직을 추가하고, 프론트엔드의 `src/components/`에 대시보드 컴포넌트를 추가합니다.

## Complexity Tracking

> 헌법 위반 사항 없음 - 이 섹션은 비워둡니다.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A       | N/A        | N/A                                 |
