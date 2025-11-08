# PowerShell 인코딩 설정
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  에코 서버 시작" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 스크립트 디렉터리 저장
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path

# 백엔드 서버 시작
Write-Host "📦 백엔드 서버 시작 중... (포트 1818)" -ForegroundColor Yellow
$backendPath = Join-Path $scriptPath "backend"
$backendJob = Start-Job -ScriptBlock {
    param($path)
    Set-Location $path
    npm run dev
} -ArgumentList $backendPath

# 잠시 대기 (백엔드가 먼저 시작되도록)
Start-Sleep -Seconds 3

# 프론트엔드 서버 시작
Write-Host "🎨 프론트엔드 서버 시작 중... (포트 5173)" -ForegroundColor Yellow
$frontendPath = Join-Path $scriptPath "frontend"
$frontendJob = Start-Job -ScriptBlock {
    param($path)
    Set-Location $path
    npm run dev
} -ArgumentList $frontendPath

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "✅ 서버가 성공적으로 시작되었습니다!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📌 접속 정보:" -ForegroundColor White
Write-Host "   대시보드: http://localhost:5173"
Write-Host "   API 서버: http://localhost:1818"
Write-Host "   WebSocket: ws://localhost:1818"
Write-Host ""
Write-Host "⚠️  종료하려면 Ctrl+C를 누르세요" -ForegroundColor Red
Write-Host ""

# 종료 시그널 처리
try {
    # 작업이 실행 중인 동안 출력 표시
    while ($backendJob.State -eq 'Running' -or $frontendJob.State -eq 'Running') {
        # 백엔드 출력
        $backendOutput = Receive-Job -Job $backendJob
        if ($backendOutput) {
            Write-Host "[Backend] " -ForegroundColor Cyan -NoNewline
            Write-Host $backendOutput
        }

        # 프론트엔드 출력
        $frontendOutput = Receive-Job -Job $frontendJob
        if ($frontendOutput) {
            Write-Host "[Frontend] " -ForegroundColor Magenta -NoNewline
            Write-Host $frontendOutput
        }

        Start-Sleep -Milliseconds 500
    }
} finally {
    Write-Host ""
    Write-Host "서버를 종료합니다..." -ForegroundColor Yellow
    Stop-Job -Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
    Remove-Job -Job $backendJob, $frontendJob -Force -ErrorAction SilentlyContinue
    Write-Host "종료 완료" -ForegroundColor Green
}
