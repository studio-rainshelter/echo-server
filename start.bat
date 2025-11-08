@echo off
chcp 65001 >nul
echo ==========================================
echo   에코 서버 시작
echo ==========================================
echo.

REM 백엔드 서버 시작
echo 📦 백엔드 서버 시작 중... (포트 1818)
start "Echo Server Backend" cmd /k "cd /d %~dp0backend && npm run dev"

REM 잠시 대기 (백엔드가 먼저 시작되도록)
timeout /t 3 /nobreak >nul

REM 프론트엔드 서버 시작
echo 🎨 프론트엔드 서버 시작 중... (포트 5173)
start "Echo Server Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ==========================================
echo ✅ 서버가 성공적으로 시작되었습니다!
echo ==========================================
echo.
echo 📌 접속 정보:
echo    대시보드: http://localhost:5173
echo    API 서버: http://localhost:1818
echo    WebSocket: ws://localhost:1818
echo.
echo ⚠️  종료하려면 각 터미널 창을 닫으세요
echo.
