from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, Form, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn
from typing import Optional, List
import time
import base64
import datetime

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

def log_request_header(request: Request, request_type: str, content_type: str):
    """요청 헤더 로깅"""
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print("\n" + "="*70)
    print(f"[{timestamp}] 📥 새로운 요청")
    print(f"  타입: {request_type}")
    print(f"  Content-Type: {content_type}")
    print(f"  🔖 요청 헤더:")

    # 모든 헤더 출력
    for header_name, header_value in request.headers.items():
        # 민감한 헤더는 마스킹 (선택적)
        if header_name.lower() in ['authorization', 'cookie']:
            masked_value = header_value[:10] + "..." if len(header_value) > 10 else "***"
            print(f"     {header_name}: {masked_value}")
        else:
            print(f"     {header_name}: {header_value}")

    print("-"*70)

def log_request_footer():
    """요청 푸터 로깅"""
    print("="*70 + "\n")

@app.get("/")
async def root():
    """서버 상태 확인"""
    return {"status": "running", "service": "Echo Server"}

@app.post("/echo")
async def echo_rest(request: Request):
    """RestAPI 에코 엔드포인트 - 모든 Content-Type 지원"""
    content_type = request.headers.get("content-type", "").lower()

    try:
        # 1. JSON 형식
        if "application/json" in content_type:
            log_request_header(request, "JSON", content_type)
            try:
                data = await request.json()
                message = data.get("message", data) if isinstance(data, dict) else data

                print(f"  📄 수신 데이터:")
                print(f"     {message}")
                log_request_footer()

                return {
                    "echo": message,
                    "type": "json",
                    "content_type": content_type
                }
            except Exception as e:
                body = await request.body()
                decoded = body.decode("utf-8") if body else ""
                print(f"  ⚠️  파싱 에러: {e}")
                print(f"  📄 원본 데이터: {decoded}")
                log_request_footer()
                return {"echo": decoded or "empty", "type": "json", "error": str(e)}

        # 2. Form Urlencoded
        elif "application/x-www-form-urlencoded" in content_type:
            log_request_header(request, "FORM URLENCODED", content_type)
            try:
                form_data = await request.form()
                form_dict = {key: form_data[key] for key in form_data.keys()}

                print(f"  📋 폼 필드 ({len(form_dict)}개):")
                for key, value in form_dict.items():
                    print(f"     - {key}: {value}")
                log_request_footer()

                message = form_dict.get("message", form_dict if form_dict else "")
                return {
                    "echo": message,
                    "type": "form-urlencoded",
                    "content_type": content_type,
                    "all_fields": form_dict
                }
            except Exception as e:
                print(f"  ⚠️  에러: {e}")
                log_request_footer()
                return {"echo": "error", "type": "form-urlencoded", "error": str(e)}

        # 3. Form Multipart
        elif "multipart/form-data" in content_type:
            log_request_header(request, "FORM MULTIPART", content_type)
            try:
                form_data = await request.form()
                form_dict = {}
                files_info = {}

                # 폼 필드와 파일 구분
                for key in form_data.keys():
                    value = form_data[key]
                    if hasattr(value, 'filename'):  # 파일인 경우
                        file_content = await value.read()
                        file_size = len(file_content)

                        files_info[key] = {
                            "filename": value.filename,
                            "content_type": value.content_type,
                            "size": file_size,
                            "size_kb": round(file_size / 1024, 2),
                            "content_base64": base64.b64encode(file_content).decode('utf-8')
                        }
                    else:  # 일반 필드
                        form_dict[key] = value

                if form_dict:
                    print(f"  📋 폼 필드 ({len(form_dict)}개):")
                    for key, value in form_dict.items():
                        print(f"     - {key}: {value}")

                if files_info:
                    print(f"  📎 업로드된 파일 ({len(files_info)}개):")
                    for key, info in files_info.items():
                        print(f"     - 필드명: {key}")
                        print(f"       파일명: {info['filename']}")
                        print(f"       MIME: {info['content_type']}")
                        print(f"       크기: {info['size']:,} bytes ({info['size_kb']} KB)")

                log_request_footer()

                return {
                    "echo": form_dict.get("message", form_dict if form_dict else ""),
                    "type": "form-multipart",
                    "content_type": content_type,
                    "fields": form_dict,
                    "files": files_info,
                    "summary": {
                        "total_fields": len(form_dict),
                        "total_files": len(files_info),
                        "filenames": [info['filename'] for info in files_info.values()]
                    }
                }
            except Exception as e:
                print(f"  ⚠️  에러: {e}")
                log_request_footer()
                return {"echo": "error", "type": "form-multipart", "error": str(e)}

        # 4. Plain Text
        elif "text/plain" in content_type:
            log_request_header(request, "PLAIN TEXT", content_type)
            body = await request.body()
            message = body.decode("utf-8") if body else "empty"

            print(f"  📄 텍스트 내용 ({len(body)} bytes):")
            print(f"     {message[:200]}{'...' if len(message) > 200 else ''}")
            log_request_footer()

            return {
                "echo": message,
                "type": "text/plain",
                "content_type": content_type,
                "length": len(body)
            }

        # 5. HTML
        elif "text/html" in content_type:
            log_request_header(request, "HTML", content_type)
            body = await request.body()
            message = body.decode("utf-8") if body else "empty"

            print(f"  📄 HTML 내용 ({len(body)} bytes):")
            print(f"     {message[:200]}{'...' if len(message) > 200 else ''}")
            log_request_footer()

            return {
                "echo": message,
                "type": "text/html",
                "content_type": content_type,
                "length": len(body)
            }

        # 6. XML
        elif "application/xml" in content_type or "text/xml" in content_type:
            log_request_header(request, "XML", content_type)
            body = await request.body()
            message = body.decode("utf-8") if body else "empty"

            print(f"  📄 XML 내용 ({len(body)} bytes):")
            print(f"     {message[:200]}{'...' if len(message) > 200 else ''}")
            log_request_footer()

            return {
                "echo": message,
                "type": "xml",
                "content_type": content_type,
                "length": len(body)
            }

        # 7. JavaScript
        elif "application/javascript" in content_type or "text/javascript" in content_type:
            log_request_header(request, "JAVASCRIPT", content_type)
            body = await request.body()
            message = body.decode("utf-8") if body else "empty"

            print(f"  📄 JavaScript 내용 ({len(body)} bytes):")
            print(f"     {message[:200]}{'...' if len(message) > 200 else ''}")
            log_request_footer()

            return {
                "echo": message,
                "type": "javascript",
                "content_type": content_type,
                "length": len(body)
            }

        # 8. Binary (octet-stream 및 기타 바이너리)
        elif "application/octet-stream" in content_type or "image/" in content_type or "video/" in content_type or "audio/" in content_type:
            log_request_header(request, "BINARY", content_type)
            body = await request.body()
            encoded = base64.b64encode(body).decode('utf-8') if body else ""

            print(f"  💾 바이너리 데이터:")
            print(f"     크기: {len(body):,} bytes ({len(body)/1024:.2f} KB)")
            print(f"     Base64 인코딩 길이: {len(encoded)} chars")
            log_request_footer()

            return {
                "echo": encoded,
                "type": "binary",
                "content_type": content_type,
                "size": len(body),
                "encoding": "base64",
                "note": "Binary data encoded in base64"
            }

        # 9. 기타 형식
        else:
            log_request_header(request, "UNKNOWN", content_type)
            body = await request.body()
            message = body.decode("utf-8", errors='replace') if body else "empty"

            print(f"  ❓ 알 수 없는 형식 ({len(body)} bytes):")
            print(f"     {message[:200]}{'...' if len(message) > 200 else ''}")
            log_request_footer()

            return {
                "echo": message,
                "type": "unknown",
                "content_type": content_type,
                "length": len(body)
            }

    except Exception as e:
        print(f"\n❌ 예외 발생: {e}\n")
        return {"echo": "error", "type": "error", "error": str(e)}

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
