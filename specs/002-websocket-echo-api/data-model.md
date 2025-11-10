# Data Model: 웹소켓 에코 서버 및 대시보드 로깅

**Feature**: 002-websocket-echo-api
**Date**: 2025-11-09
**Storage**: 메모리 (최대 1000개 로그)

## 개요

이 기능은 메모리 기반 데이터 저장소를 사용하며, 영구 저장소(데이터베이스)를 사용하지 않습니다. 모든 데이터는 서버 프로세스의 메모리에 저장되며, 서버 재시작 시 초기화됩니다.

## 엔티티 (Entities)

### 1. WebSocket Connection

클라이언트와 서버 간의 활성 웹소켓 연결을 나타냅니다.

**속성**:
- `connectionId` (string): 고유 연결 식별자 (예: `conn-1699564832123-a9b3c4d5e`)
- `clientIp` (string): 클라이언트 IP 주소 (예: `192.168.1.100`)
- `userAgent` (string, optional): 클라이언트 User-Agent 헤더
- `connectedAt` (number): 연결 수립 시각 (Unix timestamp)
- `lastActivityAt` (number): 마지막 메시지 수신 시각 (Unix timestamp)
- `ws` (WebSocket): ws 라이브러리의 WebSocket 객체 인스턴스

**저장 위치**: `ConnectionManager` 클래스의 `Map<connectionId, Connection>` 자료구조

**생명주기**:
- 생성: 클라이언트가 웹소켓 연결 요청 시
- 업데이트: 메시지 수신 시 `lastActivityAt` 갱신
- 삭제: 클라이언트 연결 해제 또는 타임아웃 시

**유효성 검증**:
- `connectionId`: 비어있지 않은 문자열
- `clientIp`: 유효한 IPv4 또는 IPv6 주소 형식
- `connectedAt`: 현재 시각보다 과거 시각

---

### 2. Message Log

클라이언트가 전송한 메시지의 로그 기록을 나타냅니다.

**속성**:
- `logId` (string): 고유 로그 식별자 (예: `log-1699564832456-x1y2z3`)
- `connectionId` (string): 메시지를 전송한 연결의 ID (WebSocket Connection 참조)
- `messageType` (string): 메시지 타입 (`text`, `binary`, `json`)
- `messageContent` (string | Buffer): 메시지 내용
  - 텍스트: UTF-8 문자열
  - JSON: 문자열화된 JSON
  - 바이너리: Buffer 객체 또는 Base64 인코딩 문자열
- `messageSize` (number): 메시지 크기 (바이트)
- `timestamp` (string): 메시지 수신 시각 (ISO 8601 형식, 예: `2025-11-09T16:30:45.123Z`)
- `clientInfo` (object): 클라이언트 정보 스냅샷
  - `ip` (string): 클라이언트 IP
  - `userAgent` (string, optional): User-Agent

**저장 위치**: `LogManager` 클래스의 `Array<MessageLog>` 순환 버퍼

**생명주기**:
- 생성: 웹소켓 메시지 수신 시
- 삭제: 로그 개수가 1000개 초과 시 가장 오래된 로그 자동 삭제 (FIFO)

**유효성 검증**:
- `messageType`: `text`, `binary`, `json` 중 하나
- `messageSize`: 0보다 큰 정수, 최대 1MB (1,048,576 바이트)
- `timestamp`: 유효한 ISO 8601 형식
- `messageContent`: 비어있지 않음

**메시지 타입 결정 로직**:
```javascript
function determineMessageType(data, isBinary) {
  if (isBinary) return 'binary';

  try {
    JSON.parse(data);
    return 'json';
  } catch {
    return 'text';
  }
}
```

---

### 3. Connection Event

클라이언트의 연결 또는 해제 이벤트를 나타냅니다.

**속성**:
- `eventId` (string): 고유 이벤트 식별자 (예: `event-1699564832789-p9q8r7`)
- `eventType` (string): 이벤트 타입 (`connected`, `disconnected`)
- `connectionId` (string): 관련된 연결의 ID
- `timestamp` (string): 이벤트 발생 시각 (ISO 8601 형식)
- `clientInfo` (object): 클라이언트 정보 스냅샷
  - `ip` (string): 클라이언트 IP
  - `userAgent` (string, optional): User-Agent
- `reason` (string, optional): 연결 해제 이유 (예: `client_close`, `timeout`, `error`)

**저장 위치**: `LogManager` 클래스의 `Array<ConnectionEvent>` 순환 버퍼 (메시지 로그와 별도)

**생명주기**:
- 생성: 연결 수립 또는 해제 시
- 삭제: 이벤트 개수가 1000개 초과 시 가장 오래된 이벤트 자동 삭제 (FIFO)

**유효성 검증**:
- `eventType`: `connected` 또는 `disconnected`
- `timestamp`: 유효한 ISO 8601 형식

---

### 4. Statistics

서버 전체의 활동 통계를 나타냅니다.

**속성**:
- `currentActiveConnections` (number): 현재 활성 연결 수
- `totalConnectionsAttempted` (number): 서버 시작 이후 총 연결 시도 횟수
- `totalMessagesReceived` (number): 서버 시작 이후 총 수신 메시지 수
- `totalMessagesSent` (number): 서버 시작 이후 총 전송 메시지 수 (에코 응답)
- `serverStartedAt` (string): 서버 시작 시각 (ISO 8601 형식)
- `uptimeSeconds` (number): 서버 가동 시간 (초)

**저장 위치**: `StatisticsManager` 클래스의 단일 인스턴스 (싱글톤)

**생명주기**:
- 생성: 서버 시작 시 초기화
- 업데이트: 이벤트 발생 시 실시간 갱신
- 삭제: 서버 재시작 시 초기화

**계산 로직**:
- `currentActiveConnections`: `ConnectionManager.connections.size`
- `uptimeSeconds`: `(Date.now() - serverStartedAt) / 1000`

---

## 관계 (Relationships)

### WebSocket Connection ↔ Message Log
- **관계 타입**: 1:N (한 연결은 여러 메시지 로그를 생성)
- **참조**: `MessageLog.connectionId` → `Connection.connectionId`
- **삭제 정책**: 연결이 해제되어도 로그는 유지 (연결 정보는 스냅샷으로 저장)

### WebSocket Connection ↔ Connection Event
- **관계 타입**: 1:2 (한 연결은 최대 2개의 이벤트 생성: connected, disconnected)
- **참조**: `ConnectionEvent.connectionId` → `Connection.connectionId`
- **삭제 정책**: 연결이 해제되어도 이벤트는 유지

---

## 데이터 저장소 구조

### ConnectionManager
```javascript
class ConnectionManager {
  constructor() {
    // Map<connectionId, Connection>
    this.connections = new Map();
  }
}
```

### LogManager
```javascript
class LogManager {
  constructor(maxSize = 1000) {
    this.messageLogs = [];      // Array<MessageLog>
    this.connectionEvents = [];  // Array<ConnectionEvent>
    this.maxSize = maxSize;
  }
}
```

### StatisticsManager
```javascript
class StatisticsManager {
  constructor() {
    this.stats = {
      currentActiveConnections: 0,
      totalConnectionsAttempted: 0,
      totalMessagesReceived: 0,
      totalMessagesSent: 0,
      serverStartedAt: new Date().toISOString(),
    };
  }
}
```

---

## 메모리 관리 전략

### 로그 크기 제한
- 메시지 로그: 최대 1000개
- 연결 이벤트: 최대 1000개
- 활성 연결: 제한 없음 (실제 연결된 클라이언트 수에 따라 동적)

### 예상 메모리 사용량
- 단일 메시지 로그: 평균 1KB (메시지 내용 포함)
- 1000개 메시지 로그: 약 1MB
- 단일 연결 객체: 약 500 바이트
- 100개 동시 연결: 약 50KB

**총 예상 메모리**: 약 2-3MB (로그 + 연결)

### 메모리 누수 방지
1. 연결 해제 시 `ConnectionManager`에서 즉시 제거
2. 순환 버퍼로 로그 크기 자동 제한
3. 주기적인 타임아웃 연결 정리 (30초 무응답 시 종료)

---

## 상태 전이 (State Transitions)

### WebSocket Connection 상태
```
[없음] → [연결 중] → [활성] → [해제됨]
                         ↓
                      [타임아웃]
```

- **연결 중**: 클라이언트가 웹소켓 핸드셰이크 수행 중
- **활성**: 연결 수립 완료, 메시지 송수신 가능
- **타임아웃**: 30초 이상 무응답 시 자동 종료
- **해제됨**: 클라이언트 또는 서버가 연결 종료

### Message Log 상태
로그는 상태 전이 없음 (불변 데이터)

---

## 데이터 접근 패턴

### 쓰기 (Write) 패턴
1. **메시지 수신**: `LogManager.addMessageLog(connectionId, message)`
2. **연결 이벤트**: `LogManager.addConnectionEvent(eventType, connectionId, clientInfo)`
3. **통계 업데이트**: `StatisticsManager.incrementMessageCount()`

### 읽기 (Read) 패턴
1. **최근 로그 조회**: `LogManager.getRecentLogs(limit)` - O(1)
2. **특정 연결의 로그**: `LogManager.getLogsByConnectionId(connectionId)` - O(n)
3. **통계 조회**: `StatisticsManager.getStats()` - O(1)
4. **활성 연결 목록**: `ConnectionManager.getActiveConnections()` - O(n)

---

## 인덱싱 전략

메모리 기반 저장소이므로 별도의 인덱스는 사용하지 않습니다. 필요 시 다음과 같은 최적화 가능:

1. **connectionId 인덱스**: Map 자료구조 사용으로 O(1) 조회
2. **timestamp 정렬**: 배열에 삽입 시 이미 시간순으로 정렬됨 (FIFO)

---

## 확장 고려사항

향후 영구 저장소가 필요한 경우:
1. **SQLite**: 단일 파일 데이터베이스로 간단히 마이그레이션 가능
2. **MongoDB**: JSON 형태의 로그 저장에 적합
3. **PostgreSQL**: 관계형 데이터베이스로 복잡한 쿼리 지원

현재 메모리 기반 설계는 이러한 저장소로의 마이그레이션을 쉽게 할 수 있도록 구조화되어 있습니다.
