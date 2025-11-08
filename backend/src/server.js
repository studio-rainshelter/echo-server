// .env 파일 로드
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const https = require('https');
const fs = require('fs');
const { loggingMiddleware } = require('./middleware/logger');
const { errorHandler } = require('./middleware/errorHandler');
const { initializeWebSocket } = require('./websocket/handler');

// Express 앱 초기화
const app = express();

// CORS 설정
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? (process.env.ALLOWED_ORIGINS || '').split(',')
    : '*',
  credentials: true
};
app.use(cors(corsOptions));

// JSON body parser
app.use(express.json());

// 프로덕션 모드에서 정적 파일 서빙 (프론트엔드)
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));
}

// 로깅 미들웨어
app.use(loggingMiddleware);

// API 라우터 마운트
const apiRouter = require('./routes/api');
app.use('/api', apiRouter);

// 프로덕션 모드: 모든 비-API 요청을 프론트엔드 index.html로 리다이렉트
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
  });
}

// 에러 핸들러 (마지막에 추가)
app.use(errorHandler);

// HTTP/HTTPS 서버 생성 및 포트 리스닝
const HTTP_PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || (parseInt(HTTP_PORT) + 1);

let httpServer;
let httpsServer;

// HTTP 서버 생성 (항상 실행)
httpServer = http.createServer(app);
httpServer.listen(HTTP_PORT, () => {
  console.log(`🌐 HTTP 에코 서버가 포트 ${HTTP_PORT}에서 실행 중입니다.`);
  console.log(`   접속 URL: http://localhost:${HTTP_PORT}`);
});

// HTTPS 서버 생성 (인증서가 있을 때만 실행)
const certPath = path.join(__dirname, '../certs/cert.pem');
const keyPath = path.join(__dirname, '../certs/key.pem');

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
  };

  httpsServer = https.createServer(httpsOptions, app);
  httpsServer.listen(HTTPS_PORT, () => {
    console.log(`🔒 HTTPS 에코 서버가 포트 ${HTTPS_PORT}에서 실행 중입니다.`);
    console.log(`   접속 URL: https://localhost:${HTTPS_PORT}`);
  });
} else {
  console.log(`⚠️  SSL 인증서를 찾을 수 없습니다. HTTPS 서버는 시작하지 않습니다.`);
}

console.log(`환경: ${process.env.NODE_ENV || 'development'}`);

// WebSocket 서버 초기화 (HTTP 서버에 연결)
const wss = initializeWebSocket(httpServer);

// HTTPS WebSocket 서버 초기화 (HTTPS 서버가 있을 경우)
if (httpsServer) {
  initializeWebSocket(httpsServer);
}

// 기본 서버는 HTTP (테스트 호환성을 위해)
const server = httpServer;

module.exports = { app, server, wss };
