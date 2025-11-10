import { useState, useEffect } from 'react';
import WebSocketClient from './services/websocket';
import DashboardWebSocketService from './services/websocket-service';
import ApiList from './components/ApiList';
import LogViewer from './components/LogViewer';
import Stats from './components/Stats';
import MessageLogViewer from './components/MessageLogViewer';
import ConnectionStats from './components/ConnectionStats';
import EventTimeline from './components/EventTimeline';
import './App.css';

function App() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    activeWebSockets: 0,
    totalWebSocketMessages: 0,
    uptime: 0,
    lastUpdated: new Date().toISOString()
  });
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [wsClient, setWsClient] = useState(null);
  const [wsProtocol, setWsProtocol] = useState('ws'); // 'ws' 또는 'wss'

  // Dashboard WebSocket
  const [dashboardWs, setDashboardWs] = useState(null);
  const [dashboardConnectionStatus, setDashboardConnectionStatus] = useState('disconnected');

  useEffect(() => {
    // WebSocket URL 생성 (ws: 1818, wss: 1819)
    const port = wsProtocol === 'wss' ? '1819' : '1818';
    const wsUrl = `${wsProtocol}://localhost:${port}`;

    // WebSocket 클라이언트 초기화
    const client = new WebSocketClient(wsUrl);

    // 로그 이벤트 핸들러
    client.on('log', (logData) => {
      setLogs(prevLogs => [...prevLogs.slice(-99), logData]); // 최대 100개 유지
    });

    // 통계 이벤트 핸들러
    client.on('stats', (statsData) => {
      setStats(statsData);
    });

    // 연결 상태 핸들러
    client.on('connection', ({ status }) => {
      setConnectionStatus(status);
    });

    // 환영 메시지 핸들러
    client.on('welcome', (message) => {
      console.log('서버로부터 환영 메시지:', message);
    });

    // 연결 시작
    client.connect();
    setWsClient(client);

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
      client.disconnect();
      dashboardClient.disconnect();
    };
  }, [wsProtocol]);

  const handleReconnect = () => {
    if (wsClient) {
      wsClient.reconnect();
    }
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
              <span className="status-label">기본 WS:</span>
              <span className={`status-indicator ${connectionStatus}`}></span>
              <span>{connectionStatus === 'connected' ? '연결됨' : '연결 끊김'}</span>
            </div>
            <div className="status-item">
              <span className="status-label">대시보드 WS:</span>
              <span className={`status-indicator ${dashboardConnectionStatus}`}></span>
              <span>{dashboardConnectionStatus === 'connected' ? '연결됨' : '연결 끊김'}</span>
            </div>
            {(connectionStatus !== 'connected' || dashboardConnectionStatus !== 'connected') && (
              <button onClick={handleReconnect} className="reconnect-button">
                재연결
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="dashboard">
        <div className="dashboard-section">
          <Stats stats={stats} />
        </div>

        <div className="dashboard-section">
          <ConnectionStats dashboardWs={dashboardWs} />
        </div>

        <div className="dashboard-section">
          <LogViewer logs={logs} />
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
