# WebSocket, Rest API 를 지원하는 **에코 서버** 개발 요청.

Node.js 사용 
10개의 테스트 API 
연결 및 Request, Resposne 현황과 사용가능한 API를 확인 할 수 있는 대쉬보드

## 백엔드 (Node.js + Express)

Express.js 기반 REST API 서버
WebSocket 서버 (ws 라이브러리 사용)
Request/Response 로깅 시스템
실시간 모니터링 데이터 전송

## 10개 테스트 API 엔드포인트:

GET /api/echo - 쿼리 파라미터 에코
POST /api/echo - Body 데이터 에코
GET /api/users - Mock 사용자 목록
POST /api/users - 사용자 생성 시뮬레이션
GET /api/status - 서버 상태 확인
POST /api/json - JSON 데이터 처리
GET /api/delay/:ms - 지연된 응답 테스트
PUT /api/update/:id - 업데이트 시뮬레이션
DELETE /api/delete/:id - 삭제 시뮬레이션
GET /api/error/:code - 에러 응답 테스트

## 프론트엔드 대시보드 (React)

실시간 Request/Response 로그 표시
API 엔드포인트 목록 및 설명
각 API 테스트 기능
WebSocket 연결 상태 표시
통계: 총 요청 수, 성공/실패율