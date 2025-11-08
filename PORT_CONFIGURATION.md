# 포트 설정 가이드

에코 서버의 백엔드와 프론트엔드 포트를 변경하는 방법입니다.

## 📋 기본 포트

- **백엔드 (API + WebSocket)**: 3000
- **프론트엔드 (개발 서버)**: 5173
- **프론트엔드 (프리뷰)**: 4173

---

## 🔧 백엔드 포트 변경

### 방법 1: 환경 변수 파일 (.env) 사용 ✅ 권장

`backend/.env` 파일을 편집:

```env
PORT=4000
NODE_ENV=development
```

### 방법 2: 명령줄에서 직접 설정

```bash
cd backend
PORT=4000 npm run dev
```

Windows PowerShell:
```powershell
cd backend
$env:PORT=4000; npm run dev
```

Windows CMD:
```cmd
cd backend
set PORT=4000 && npm run dev
```

---

## 🎨 프론트엔드 포트 변경

### Vite 설정 파일 수정

`frontend/vite.config.js` 파일을 편집:

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 8080,      // 원하는 개발 서버 포트로 변경
    host: true,      // 네트워크에서 접근 가능
  },
  preview: {
    port: 8081,      // 원하는 프리뷰 포트로 변경
  }
})
```

---

## 🔗 프론트엔드에서 백엔드 URL 설정

백엔드 포트를 변경한 경우, 프론트엔드도 업데이트해야 합니다.

### 환경 변수 파일 사용 ✅ 권장

`frontend/.env` 파일을 생성/편집:

```env
VITE_API_URL=http://localhost:4000
VITE_WS_URL=ws://localhost:4000
```

**중요**: 프론트엔드 개발 서버를 재시작해야 환경 변수가 적용됩니다!

```bash
# 개발 서버 중지 후 재시작
cd frontend
npm run dev
```

---

## 🎯 실전 예시: 모든 포트 변경하기

### 시나리오: 백엔드 4000, 프론트엔드 8080으로 변경

#### 1단계: 백엔드 포트 변경

`backend/.env`:
```env
PORT=4000
NODE_ENV=development
```

#### 2단계: 프론트엔드 백엔드 URL 설정

`frontend/.env`:
```env
VITE_API_URL=http://localhost:4000
VITE_WS_URL=ws://localhost:4000
```

#### 3단계: 프론트엔드 개발 서버 포트 변경

`frontend/vite.config.js`:
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 8080,
    host: true,
  },
  preview: {
    port: 8081,
  }
})
```

#### 4단계: 서버 실행

```bash
# 터미널 1 - 백엔드
cd backend
npm run dev
# 에코 서버가 포트 4000에서 실행 중입니다.

# 터미널 2 - 프론트엔드
cd frontend
npm run dev
# Local: http://localhost:8080/
```

#### 5단계: 브라우저에서 확인

- **대시보드**: http://localhost:8080
- **API**: http://localhost:4000/api/status
- **WebSocket**: ws://localhost:4000

---

## 🐛 문제 해결

### 포트가 이미 사용 중인 경우

#### 포트 사용 중인 프로세스 확인

**Linux/Mac:**
```bash
lsof -i :3000
```

**Windows:**
```powershell
netstat -ano | findstr :3000
```

#### 프로세스 종료

**Linux/Mac:**
```bash
kill -9 <PID>
```

**Windows:**
```powershell
taskkill /PID <PID> /F
```

### 환경 변수가 적용되지 않는 경우

1. **프론트엔드**: 개발 서버를 **완전히 재시작**해야 합니다.
   ```bash
   # Ctrl+C로 서버 종료 후
   npm run dev
   ```

2. **.env 파일 위치 확인**:
   - 백엔드: `backend/.env`
   - 프론트엔드: `frontend/.env`

3. **Vite 환경 변수 접두사**: 반드시 `VITE_`로 시작해야 합니다!
   - ✅ `VITE_API_URL`
   - ❌ `API_URL`

### CORS 에러가 발생하는 경우

프로덕션 모드에서 포트를 변경한 경우, 백엔드 CORS 설정 확인:

`backend/.env`:
```env
NODE_ENV=production
ALLOWED_ORIGINS=http://localhost:8080,http://127.0.0.1:8080
```

---

## 📦 프로덕션 빌드 시 포트 설정

### 프론트엔드 빌드

```bash
cd frontend
npm run build
```

빌드 시에는 `.env.production` 파일을 사용할 수도 있습니다:

`frontend/.env.production`:
```env
VITE_API_URL=http://your-production-domain.com
VITE_WS_URL=ws://your-production-domain.com
```

### 통합 서버 실행

프로덕션 모드에서는 백엔드가 빌드된 프론트엔드를 서빙합니다:

```bash
cd backend
NODE_ENV=production PORT=8000 npm start
```

접속: http://localhost:8000

---

## 🔐 보안 고려사항

### 프로덕션 환경

1. **환경 변수는 git에 커밋하지 마세요!**
   - `.env` 파일은 `.gitignore`에 포함되어 있습니다.

2. **프로덕션 URL 설정**:
   ```env
   # frontend/.env.production
   VITE_API_URL=https://api.yourdomain.com
   VITE_WS_URL=wss://api.yourdomain.com
   ```

3. **CORS 설정**:
   ```env
   # backend/.env
   NODE_ENV=production
   ALLOWED_ORIGINS=https://yourdomain.com
   ```

---

## 📞 추가 도움말

포트 설정과 관련하여 문제가 발생하면:

1. 백엔드 로그 확인: `에코 서버가 포트 XXXX에서 실행 중입니다.`
2. 프론트엔드 로그 확인: `Local: http://localhost:XXXX/`
3. 브라우저 개발자 도구 콘솔에서 WebSocket 연결 상태 확인

모든 설정이 완료되면 대시보드에서 "WebSocket: 연결됨" 표시를 확인하세요!
