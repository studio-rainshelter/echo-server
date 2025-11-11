# Echo Server

파이썬 기반의 간단한 RestAPI 및 WebSocket 에코 서버

## 설치

```bash
pip install -r requirements.txt
```

## 실행

```bash
python main.py
```

서버가 시작되면 다음 URL에서 접근할 수 있습니다:
- RestAPI: http://localhost:8000
- WebSocket: ws://localhost:8000/ws
- API 문서: http://localhost:8000/docs

## 사용법

### RestAPI

#### 상태 확인
```bash
curl http://localhost:8000/
```

#### 에코 메시지
```bash
curl -X POST http://localhost:8000/echo \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello World"}'
```

### WebSocket (Python 클라이언트 예제)

```python
import asyncio
import websockets

async def test_websocket():
    async with websockets.connect("ws://localhost:8000/ws") as websocket:
        await websocket.send("Hello WebSocket!")
        response = await websocket.recv()
        print(response)

asyncio.run(test_websocket())
```

## 기능

- **GET /** - 서버 상태 확인
- **POST /echo** - JSON 메시지를 받아 에코 반환
- **WebSocket /ws** - 실시간 양방향 에코 통신

## 기술 스택

- FastAPI - 고성능 웹 프레임워크
- Uvicorn - ASGI 서버
- WebSockets - 실시간 통신
