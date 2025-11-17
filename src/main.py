from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn
from typing import Optional
import time

app = FastAPI(title="Echo Server", version="1.0.0")

# CORS 미들웨어 추가
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 모든 도메인 허용 (프로덕션에서는 특정 도메인만 지정)
    allow_credentials=True,
    allow_methods=["*"],  # 모든 HTTP 메서드 허용
    allow_headers=["*"],  # 모든 헤더 허용
)

class EchoMessage(BaseModel):
    message: str

@app.get("/")
async def root():
    """서버 상태 확인"""
    return {"status": "running", "service": "Echo Server"}

@app.post("/echo")
async def echo_rest(request: Request):
    """RestAPI 에코 엔드포인트 - JSON, Form data, Plain text 지원"""
    # 헤더 정보 로깅
    print(f"[HEADERS] {dict(request.headers)}")

    content_type = request.headers.get("content-type", "").lower()

    try:
        # JSON 형식
        if "application/json" in content_type:
            try:
                data = await request.json()
                message = data.get("message", data) if isinstance(data, dict) else data
                print(f"[JSON] 수신: {message}")
                return {"echo": message, "type": "json"}
            except Exception as e:
                body = await request.body()
                decoded = body.decode("utf-8") if body else ""
                print(f"[JSON ERROR] 수신: {decoded} | 에러: {e}")
                return {"echo": decoded or "empty", "type": "json", "error": str(e)}

        # Form data 형식
        elif "application/x-www-form-urlencoded" in content_type or "multipart/form-data" in content_type:
            try:
                form_data = await request.form()
                # form_data를 dict로 변환
                form_dict = {key: form_data[key] for key in form_data.keys()}
                message = form_dict.get("message", form_dict if form_dict else "")
                print(f"[FORM] 수신: {message}")
                return {"echo": message, "type": "form"}
            except Exception as e:
                body = await request.body()
                decoded = body.decode("utf-8") if body else ""
                print(f"[FORM ERROR] 수신: {decoded} | 에러: {e}")
                return {"echo": decoded or "empty", "type": "form", "error": str(e)}

        # Plain text 또는 기타 형식
        else:
            body = await request.body()
            message = body.decode("utf-8") if body else "empty"
            print(f"[TEXT] 수신: {message}")
            return {"echo": message, "type": "text"}

    except Exception as e:
        print(f"[ERROR] 예외 발생: {e}")
        return {"echo": "error", "type": "unknown", "error": str(e)}

@app.websocket("/ws")
async def websocket_echo(websocket: WebSocket):
    """WebSocket 에코 엔드포인트"""
    await websocket.accept()
    print(f"[WebSocket] 클라이언트 연결: {websocket.client}")
    print(f"[WebSocket HEADERS] {dict(websocket.headers)}")

    try:
        while True:
            # 클라이언트로부터 메시지 수신
            message = await websocket.receive_text()
            print(f"[WebSocket] 수신: {message}")
            # 동일한 메시지를 다시 전송
            await websocket.send_text(f"Echo: {message}")

    except WebSocketDisconnect:
        print(f"[WebSocket] 클라이언트 연결 해제: {websocket.client}")

if __name__ == "__main__":
    print("=" * 50)
    print("Echo Server 시작")
    print("=" * 50)
    print("RestAPI: http://localhost:8000")
    print("WebSocket: ws://localhost:8000/ws")
    print("API 문서: http://localhost:8000/docs")
    print("=" * 50)

    uvicorn.run(app, host="0.0.0.0", port=8000)
