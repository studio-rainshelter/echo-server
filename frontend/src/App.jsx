import { useState, useEffect } from 'react';
import WebSocketClient from './services/websocket';
import ApiList from './components/ApiList';
import LogViewer from './components/LogViewer';
import Stats from './components/Stats';
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

    // 정리
    return () => {
      client.disconnect();
    };
  }, [wsProtocol]);

  const handleReconnect = () => {
    if (wsClient) {
      wsClient.reconnect();
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
            <span className={`status-indicator ${connectionStatus}`}></span>
            <span>{connectionStatus === 'connected' ? '연결됨' : '연결 끊김'}</span>
            {connectionStatus !== 'connected' && (
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
          <LogViewer logs={logs} />
        </div>

        <div className="dashboard-section wide">
          <ApiList />
        </div>
      </div>
    </div>
  );
}

export default App;
