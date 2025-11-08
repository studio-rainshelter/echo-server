#!/bin/bash

echo "=========================================="
echo "  에코 서버 시작"
echo "=========================================="
echo ""

# 백엔드 서버 시작
echo "📦 백엔드 서버 시작 중... (포트 1818)"
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# 잠시 대기 (백엔드가 먼저 시작되도록)
sleep 3

# 프론트엔드 서버 시작
echo "🎨 프론트엔드 서버 시작 중... (포트 5173)"
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "=========================================="
echo "✅ 서버가 성공적으로 시작되었습니다!"
echo "=========================================="
echo ""
echo "📌 접속 정보:"
echo "   대시보드: http://localhost:5173"
echo "   API 서버: http://localhost:1818"
echo "   WebSocket: ws://localhost:1818"
echo ""
echo "⚠️  종료하려면 Ctrl+C를 누르세요"
echo ""

# 종료 시그널 처리
trap "echo '\n서버를 종료합니다...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM

# 프로세스가 종료될 때까지 대기
wait
