/**
 * ConnectionStats Component
 * T045-T047: 연결 통계 표시 컴포넌트
 *
 * 기능:
 * - 현재 활성 연결 수
 * - 총 연결 시도 횟수
 * - 총 메시지 수 (수신/전송)
 * - 서버 가동 시간
 * - WebSocket을 통한 실시간 업데이트
 */

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

function ConnectionStats({ dashboardWs }) {
  const [stats, setStats] = useState({
    currentActiveConnections: 0,
    totalConnectionsAttempted: 0,
    totalMessagesReceived: 0,
    totalMessagesSent: 0,
    serverStartedAt: '',
    uptimeSeconds: 0
  });

  const [activeConnections, setActiveConnections] = useState([]);

  useEffect(() => {
    if (!dashboardWs) return;

    // 통계 업데이트 수신
    const handleStatistics = (data) => {
      console.log('통계 업데이트:', data);
      setStats(data);
    };

    // 활성 연결 목록 수신
    const handleActiveConnections = (connections) => {
      console.log('활성 연결 목록:', connections);
      setActiveConnections(connections);
    };

    dashboardWs.on('statistics', handleStatistics);
    dashboardWs.on('active_connections', handleActiveConnections);

    return () => {
      dashboardWs.off('statistics', handleStatistics);
      dashboardWs.off('active_connections', handleActiveConnections);
    };
  }, [dashboardWs]);

  // 업타임 포맷팅 (초 -> "1h 23m 45s")
  const formatUptime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    const parts = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0 || parts.length === 0) parts.push(`${s}s`);

    return parts.join(' ');
  };

  // 서버 시작 시각 포맷팅
  const formatServerStartTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('ko-KR');
  };

  return (
    <div className="connection-stats">
      <h2>📊 서버 통계</h2>

      <div className="stats-grid">
        <div className="stat-card stat-primary">
          <div className="stat-icon">🔗</div>
          <div className="stat-content">
            <div className="stat-label">활성 연결</div>
            <div className="stat-value">{stats.currentActiveConnections}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-label">총 연결 시도</div>
            <div className="stat-value">{stats.totalConnectionsAttempted}</div>
          </div>
        </div>

        <div className="stat-card stat-success">
          <div className="stat-icon">📥</div>
          <div className="stat-content">
            <div className="stat-label">수신 메시지</div>
            <div className="stat-value">{stats.totalMessagesReceived}</div>
          </div>
        </div>

        <div className="stat-card stat-info">
          <div className="stat-icon">📤</div>
          <div className="stat-content">
            <div className="stat-label">전송 메시지</div>
            <div className="stat-value">{stats.totalMessagesSent}</div>
          </div>
        </div>

        <div className="stat-card stat-uptime">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <div className="stat-label">가동 시간</div>
            <div className="stat-value">{formatUptime(stats.uptimeSeconds)}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🕐</div>
          <div className="stat-content">
            <div className="stat-label">서버 시작</div>
            <div className="stat-value stat-value-small">
              {formatServerStartTime(stats.serverStartedAt)}
            </div>
          </div>
        </div>
      </div>

      {activeConnections.length > 0 && (
        <div className="active-connections-section">
          <h3>활성 연결 목록 ({activeConnections.length})</h3>
          <div className="connections-list">
            {activeConnections.map((conn) => (
              <div key={conn.connectionId} className="connection-item">
                <div className="connection-header">
                  <span className="connection-id">{conn.connectionId}</span>
                  <span className="connection-duration">
                    {formatUptime(
                      Math.floor((Date.now() - new Date(conn.connectedAt).getTime()) / 1000)
                    )}
                  </span>
                </div>
                <div className="connection-details">
                  <span>🌐 {conn.clientIp}</span>
                  {conn.userAgent && (
                    <span title={conn.userAgent}>
                      💻 {conn.userAgent.substring(0, 40)}...
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .connection-stats {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 20px;
        }

        .connection-stats h2 {
          margin: 0 0 20px 0;
          color: #333;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: #f9f9f9;
          border-radius: 8px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          border: 2px solid transparent;
          transition: all 0.3s;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .stat-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .stat-success {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
        }

        .stat-info {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          color: white;
        }

        .stat-uptime {
          background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
          color: white;
        }

        .stat-icon {
          font-size: 32px;
        }

        .stat-content {
          flex: 1;
        }

        .stat-label {
          font-size: 12px;
          opacity: 0.9;
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
        }

        .stat-value-small {
          font-size: 14px;
          font-weight: 600;
        }

        .active-connections-section {
          border-top: 2px solid #e0e0e0;
          padding-top: 20px;
        }

        .active-connections-section h3 {
          margin: 0 0 12px 0;
          color: #555;
          font-size: 16px;
        }

        .connections-list {
          max-height: 300px;
          overflow-y: auto;
        }

        .connection-item {
          background: #f5f5f5;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 8px;
          border-left: 4px solid #667eea;
        }

        .connection-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .connection-id {
          font-family: monospace;
          font-size: 12px;
          color: #666;
          font-weight: 600;
        }

        .connection-duration {
          font-size: 11px;
          color: #999;
          font-weight: 500;
        }

        .connection-details {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: #666;
          flex-wrap: wrap;
        }
      `}</style>
    </div>
  );
}

ConnectionStats.propTypes = {
  dashboardWs: PropTypes.object
};

export default ConnectionStats;
