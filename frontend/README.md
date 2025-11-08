# 에코 서버 프론트엔드

에코 서버의 실시간 모니터링 대시보드입니다.

## 기능

- ✅ 실시간 로그 뷰어
- ✅ 서버 통계 대시보드
- ✅ API 엔드포인트 테스트 UI
- ✅ WebSocket 연결 상태 모니터링
- ✅ 자동 재연결

## 설치

```bash
npm install
```

## 실행

### 개발 서버

```bash
npm run dev
```

브라우저에서 http://localhost:5173 접속

### 프로덕션 빌드

```bash
npm run build
```

빌드된 파일은 `dist/` 디렉토리에 생성됩니다.

### 프리뷰

```bash
npm run preview
```

## 구성 요소

### WebSocket 클라이언트 (`src/services/websocket.js`)

서버와의 실시간 통신을 관리하는 WebSocket 클라이언트:

- 자동 재연결 (최대 10회)
- 이벤트 핸들러 등록 시스템
- 메시지 타입별 라우팅

### 컴포넌트

#### `ApiList.jsx`
- 10개 API 엔드포인트 목록 표시
- 각 엔드포인트 테스트 버튼
- 요청/응답 결과 표시

#### `LogViewer.jsx`
- 실시간 로그 스트림
- 메서드별 색상 코딩
- 상태 코드별 시각화
- 자동 스크롤

#### `Stats.jsx`
- 총 요청 수
- 성공/실패 요청 통계
- WebSocket 연결 정보
- 서버 가동 시간

## 환경 설정

필요한 경우 `.env` 파일에서 설정:

```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

## 기술 스택

- **React** 19.x
- **Vite** 7.x
- **WebSocket** API
