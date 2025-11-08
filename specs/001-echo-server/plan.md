# Implementation Plan: 에코 서버 (Echo Server)

**Branch**: `001-echo-server` | **Date**: 2025-11-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-echo-server/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

WebSocket과 REST API를 지원하는 에코 서버를 개발합니다. 10개의 REST API 엔드포인트, WebSocket 양방향 통신, 실시간 모니터링 대시보드를 제공하여 개발자가 API를 테스트하고 디버깅할 수 있도록 지원합니다. 간결성, 최소 의존성, 테스트 우선 원칙을 준수하며, Express.js와 ws 라이브러리를 사용하여 Node.js 기반으로 구현합니다.

## Technical Context

**Language/Version**: Node.js LTS (20.x 이상)
**Primary Dependencies**: Express.js, ws (WebSocket), React (대시보드 프론트엔드)
**Storage**: 인메모리 (로그는 메모리 배열에 저장, 영구 저장소 불필요)
**Testing**: Jest, Supertest (API 테스트), WebSocket 클라이언트 테스트 도구 - NEEDS CLARIFICATION
**Target Platform**: 크로스 플랫폼 (Linux, macOS, Windows 지원)
**Project Type**: web (백엔드 + 프론트엔드 대시보드)
**Performance Goals**:
  - API 응답 시간 < 1초 (지연 API 제외)
  - WebSocket 연결 수립 < 100ms
  - 대시보드 실시간 업데이트 < 500ms
  - 동시 연결 최소 100개 지원
**Constraints**:
  - 모든 API 응답 < 3초 (헌법 요구사항)
  - 로깅은 비동기 처리 (응답 시간 영향 최소화)
  - 최소 의존성 원칙 준수
**Scale/Scope**:
  - 10개 REST API 엔드포인트
  - 1개 WebSocket 서버
  - 1개 실시간 대시보드
  - 100+ 동시 연결 지원

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. 간결성과 가독성 우선 (Simplicity & Readability First)
- ✅ **통과**: 에코 서버는 명확한 단일 목적(테스트 지원)을 가지며, 복잡한 추상화가 필요 없음
- ✅ **통과**: 비즈니스 로직이 단순하여 자체 설명 코드 작성 가능
- ✅ **통과**: YAGNI 원칙 적용 - 현재 필요한 10개 엔드포인트와 WebSocket만 구현

### II. 최소 의존성 (Minimal Dependencies)
- ✅ **통과**: Express.js (웹 서버), ws (WebSocket), React (대시보드) - 모두 핵심 기능에 필수
- ⚠️ **주의**: 프론트엔드 빌드 도구 (Vite 또는 Create React App) 필요 - Phase 0에서 최소 설정 조사 필요
- ✅ **통과**: 인메모리 저장소 사용으로 데이터베이스 의존성 제거

### III. 테스트 우선 (Test-First)
- ✅ **통과**: 모든 API 엔드포인트에 대한 계약 테스트 계획됨
- ✅ **통과**: Jest + Supertest로 70% 커버리지 목표 달성 가능
- ⚠️ **주의**: WebSocket 테스트 도구 선정 필요 (Phase 0 연구 항목)

### IV. 성능과 응답성 (Performance & Responsiveness)
- ✅ **통과**: 성능 목표가 헌법 요구사항 충족 (API < 3초, WebSocket < 100ms)
- ✅ **통과**: 비동기 로깅 패턴으로 응답 시간 보호 계획됨

### V. 관찰 가능성 (Observability)
- ✅ **통과**: 모든 Request/Response 로깅이 기능 요구사항에 포함됨
- ✅ **통과**: 실시간 대시보드로 완전한 관찰 가능성 제공

### 위반 사항 및 정당화
현재 헌법 위반 사항 없음. 주의 항목 2개는 Phase 0 연구로 해결 예정.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
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
│   ├── server.js           # 서버 진입점 (Express + WebSocket 초기화)
│   ├── routes/             # REST API 라우트 정의
│   │   └── api.js          # 10개 엔드포인트 라우터
│   ├── websocket/          # WebSocket 핸들러
│   │   └── handler.js      # 메시지 에코 로직
│   ├── middleware/         # Express 미들웨어
│   │   └── logger.js       # 요청/응답 로깅 미들웨어
│   └── utils/              # 유틸리티 함수
│       └── logger.js       # 로그 저장 및 관리
└── tests/
    ├── contract/           # API 계약 테스트
    │   └── api.test.js
    ├── integration/        # WebSocket 통합 테스트
    │   └── websocket.test.js
    └── unit/               # 단위 테스트
        └── logger.test.js

frontend/
├── src/
│   ├── App.jsx             # 메인 대시보드 컴포넌트
│   ├── components/         # 재사용 가능한 UI 컴포넌트
│   │   ├── LogViewer.jsx   # 실시간 로그 디스플레이
│   │   ├── ApiList.jsx     # API 엔드포인트 목록
│   │   └── Stats.jsx       # 통계 디스플레이
│   ├── services/           # 프론트엔드 서비스 로직
│   │   └── websocket.js    # WebSocket 클라이언트 연결
│   └── main.jsx            # React 앱 진입점
└── tests/
    └── components/         # 컴포넌트 테스트
        └── LogViewer.test.jsx
```

**Structure Decision**: Web 애플리케이션 구조 선택 (Option 2)
- **근거**: 프론트엔드 대시보드와 백엔드 API 서버가 명확히 분리됨
- **백엔드**: Express.js 기반 REST API + WebSocket 서버
- **프론트엔드**: React 기반 실시간 모니터링 대시보드
- **테스트**: 계약 테스트, 통합 테스트, 단위 테스트로 분리하여 70% 커버리지 달성

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

헌법 위반 사항 없음.

---

## Phase 1 완료 후 Constitution Check 재평가

*Date: 2025-11-02*

### I. 간결성과 가독성 우선 (Simplicity & Readability First)
- ✅ **통과**: 설계된 데이터 모델은 4개 엔티티만 사용하며 매우 단순함
- ✅ **통과**: API 계약(OpenAPI)은 표준 RESTful 패턴 준수
- ✅ **통과**: WebSocket 프로토콜은 5개 메시지 타입만 정의

### II. 최소 의존성 (Minimal Dependencies)
- ✅ **통과**: 핵심 의존성만 확인됨
  - 백엔드: Express.js, ws, uuid, cors
  - 프론트엔드: React, Vite
  - 테스트: Jest, Supertest, @testing-library/react
- ✅ **통과**: 모든 의존성이 명확한 근거를 가짐 (research.md 참조)

### III. 테스트 우선 (Test-First)
- ✅ **통과**: 3계층 테스트 전략 수립 (계약, 통합, 단위)
- ✅ **통과**: WebSocket 테스트 도구 선정 완료 (ws 클라이언트 모드)
- ✅ **통과**: 모든 API 엔드포인트에 대한 계약 테스트 계획됨

### IV. 성능과 응답성 (Performance & Responsiveness)
- ✅ **통과**: 비동기 로깅 패턴(EventEmitter) 설계됨
- ✅ **통과**: 순환 버퍼(1000개 제한)로 메모리 효율 확보
- ✅ **통과**: 성능 목표가 헌법 요구사항 충족

### V. 관찰 가능성 (Observability)
- ✅ **통과**: RequestLog, ResponseLog 엔티티로 완전한 로깅 구조 설계됨
- ✅ **통과**: WebSocket을 통한 실시간 로그 스트리밍 프로토콜 정의됨
- ✅ **통과**: ServerStatistics 엔티티로 실시간 모니터링 가능

### 최종 결과
- **헌법 위반 사항**: 0개
- **설계 품질**: 모든 헌법 원칙 충족
- **다음 단계**: Phase 2 (작업 분해) 진행 가능

---

## Phase 0 & Phase 1 산출물 요약

### Phase 0: 연구 (완료)
- ✅ `research.md`: 모든 미결정 사항 해결
  - WebSocket 테스트 도구: ws + Jest
  - 프론트엔드 빌드: Vite
  - 로깅 패턴: EventEmitter
  - 에러 처리: 중앙화 핸들러

### Phase 1: 설계 (완료)
- ✅ `data-model.md`: 4개 엔티티 설계 (RequestLog, ResponseLog, WebSocketConnection, ServerStatistics)
- ✅ `contracts/openapi.yaml`: 10개 API 엔드포인트 OpenAPI 3.0 스펙
- ✅ `contracts/websocket-protocol.md`: WebSocket 프로토콜 명세
- ✅ `quickstart.md`: 개발자 온보딩 가이드
- ✅ `CLAUDE.md`: Agent context 업데이트 완료

---

## 다음 단계

**Phase 2**: `/speckit.tasks` 명령으로 구현 작업 목록 생성
- data-model.md를 기반으로 백엔드 구현 작업 생성
- contracts/를 기반으로 API 라우트 구현 작업 생성
- 테스트 작업 생성 (70% 커버리지 목표)
- 프론트엔드 대시보드 구현 작업 생성

**Phase 3**: `/speckit.implement` 명령으로 작업 실행
