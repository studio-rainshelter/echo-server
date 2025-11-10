import { useState, useEffect } from 'react';
import DashboardWebSocketService from './services/websocket-service';
import ApiList from './components/ApiList';
import MessageLogViewer from './components/MessageLogViewer';
import ConnectionStats from './components/ConnectionStats';
import EventTimeline from './components/EventTimeline';
import './App.css';

function App() {
  const [wsProtocol, setWsProtocol] = useState('ws'); // 'ws' 또는 'wss'

  // Dashboard WebSocket
  const [dashboardWs, setDashboardWs] = useState(null);
  const [dashboardConnectionStatus, setDashboardConnectionStatus] = useState('disconnected');

  useEffect(() => {
    // WebSocket URL 생성 (ws: 1818, wss: 1819)
    const port = wsProtocol === 'wss' ? '1819' : '1818';

    // Dashboard WebSocket 초기화
    const dashboardClient = new DashboardWebSocketService();

    // Dashboard 연결 상태 핸들러
    dashboardClient.on('connection_status', ({ status }) => {
      setDashboardConnectionStatus(status);
    });

    // Dashboard 연결
    dashboardClient.connect(`localhost:${port}`, wsProtocol);
    setDashboardWs(dashboardClient);

    // 정리
    return () => {
      dashboardClient.disconnect();
    };
  }, [wsProtocol]);

  const handleReconnect = () => {
    if (dashboardWs) {
      dashboardWs.reconnect();
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>에코 서버 대시보드</h1>
        <div className="header-controls">
          <div className="ws-protocol-selector">
            <label>WebSocket:</label>
            <select
              value={wsProtocol}
              onChange={(e) => setWsProtocol(e.target.value)}
              className="protocol-select"
            >
              <option value="ws">WS (포트 1818)</option>
              <option value="wss">WSS (포트 1819)</option>
            </select>
          </div>
          <div className="connection-status">
            <div className="status-item">
              <span className="status-label">WebSocket:</span>
              <span className={`status-indicator ${dashboardConnectionStatus}`}></span>
              <span>{dashboardConnectionStatus === 'connected' ? '연결됨' : '연결 끊김'}</span>
            </div>
            {dashboardConnectionStatus !== 'connected' && (
              <button onClick={handleReconnect} className="reconnect-button">
                재연결
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="dashboard">
        <div className="dashboard-section">
          <ConnectionStats dashboardWs={dashboardWs} />
        </div>

        <div className="dashboard-section wide">
          <MessageLogViewer dashboardWs={dashboardWs} />
        </div>

        <div className="dashboard-section wide">
          <EventTimeline dashboardWs={dashboardWs} />
        </div>

        <div className="dashboard-section wide">
          <ApiList />
        </div>
      </div>
    </div>
  );
}

export default App;
