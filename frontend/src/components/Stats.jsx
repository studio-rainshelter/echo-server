function Stats({ stats }) {
  const calculateSuccessRate = () => {
    if (stats.totalRequests === 0) return 0;
    return ((stats.successfulRequests / stats.totalRequests) * 100).toFixed(1);
  };

  const calculateFailureRate = () => {
    if (stats.totalRequests === 0) return 0;
    return ((stats.failedRequests / stats.totalRequests) * 100).toFixed(1);
  };

  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}시간 ${minutes}분 ${secs}초`;
  };

  return (
    <div className="stats">
      <h2>서버 통계</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">총 요청 수</div>
          <div className="stat-value">{stats.totalRequests || 0}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">성공 요청</div>
          <div className="stat-value success">{stats.successfulRequests || 0}</div>
          <div className="stat-percentage">{calculateSuccessRate()}%</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">실패 요청</div>
          <div className="stat-value error">{stats.failedRequests || 0}</div>
          <div className="stat-percentage">{calculateFailureRate()}%</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">활성 WebSocket</div>
          <div className="stat-value">{stats.activeWebSockets || 0}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">WebSocket 메시지</div>
          <div className="stat-value">{stats.totalWebSocketMessages || 0}</div>
        </div>

        <div className="stat-card wide">
          <div className="stat-label">서버 가동 시간</div>
          <div className="stat-value small">{formatUptime(stats.uptime || 0)}</div>
        </div>
      </div>

      {stats.lastUpdated && (
        <div className="last-updated">
          마지막 업데이트: {new Date(stats.lastUpdated).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}

export default Stats;
