/**
 * MessageLogViewer Component
 * T034-T036: 메시지 로그 뷰어 컴포넌트
 *
 * 기능:
 * - 메시지 로그 실시간 표시
 * - 메시지 내용, 타임스탬프, 클라이언트 정보 표시
 * - WebSocket을 통한 실시간 업데이트
 */

import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

function MessageLogViewer({ dashboardWs }) {
  const [messageLogs, setMessageLogs] = useState([]);
  const [filter, setFilter] = useState('');
  const [messageTypeFilter, setMessageTypeFilter] = useState('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef(null);

  useEffect(() => {
    if (!dashboardWs) return;

    // 초기 로그 데이터 수신
    const handleInitialLogs = (logs) => {
      console.log('초기 로그 수신:', logs.length);
      setMessageLogs(logs);
    };

    // 새로운 메시지 로그 수신
    const handleNewMessageLog = (log) => {
      console.log('새 메시지 로그:', log);
      setMessageLogs(prev => [...prev, log].slice(-100)); // 최대 100개 유지
    };

    dashboardWs.on('initial_logs', handleInitialLogs);
    dashboardWs.on('new_message_log', handleNewMessageLog);

    return () => {
      dashboardWs.off('initial_logs', handleInitialLogs);
      dashboardWs.off('new_message_log', handleNewMessageLog);
    };
  }, [dashboardWs]);

  // 자동 스크롤
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messageLogs, autoScroll]);

  // 메시지 필터링
  const filteredLogs = messageLogs.filter(log => {
    const matchesSearch = filter === '' ||
      log.messageContent.toString().toLowerCase().includes(filter.toLowerCase()) ||
      log.connectionId.toLowerCase().includes(filter.toLowerCase()) ||
      log.clientInfo.ip.includes(filter);

    const matchesType = messageTypeFilter === 'all' || log.messageType === messageTypeFilter;

    return matchesSearch && matchesType;
  });

  // 메시지 타입에 따른 스타일
  const getMessageTypeClass = (type) => {
    switch (type) {
      case 'text': return 'message-type-text';
      case 'json': return 'message-type-json';
      case 'binary': return 'message-type-binary';
      default: return 'message-type-unknown';
    }
  };

  // 메시지 내용 포맷팅
  const formatMessageContent = (content, type) => {
    if (type === 'json') {
      try {
        const parsed = JSON.parse(content);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return content;
      }
    } else if (type === 'binary') {
      return `[Binary: ${content.length} bytes]`;
    }
    return content;
  };

  // 시간 포맷팅
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  return (
    <div className="message-log-viewer">
      <div className="log-header">
        <h2>📨 메시지 로그</h2>
        <div className="log-controls">
          <input
            type="text"
            placeholder="검색 (메시지 내용, 연결 ID, IP...)"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="filter-input"
          />
          <select
            value={messageTypeFilter}
            onChange={(e) => setMessageTypeFilter(e.target.value)}
            className="type-filter"
          >
            <option value="all">모든 타입</option>
            <option value="text">텍스트</option>
            <option value="json">JSON</option>
            <option value="binary">바이너리</option>
          </select>
          <label className="auto-scroll-toggle">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
            />
            자동 스크롤
          </label>
          <span className="log-count">
            {filteredLogs.length} / {messageLogs.length}
          </span>
        </div>
      </div>

      <div className="log-list">
        {filteredLogs.length === 0 ? (
          <div className="log-empty">
            {messageLogs.length === 0
              ? '메시지 로그가 없습니다. 웹소켓 클라이언트를 연결하고 메시지를 전송해보세요.'
              : '필터와 일치하는 로그가 없습니다.'}
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.logId} className="log-item">
              <div className="log-meta">
                <span className="log-time">{formatTime(log.timestamp)}</span>
                <span className={`log-type ${getMessageTypeClass(log.messageType)}`}>
                  {log.messageType.toUpperCase()}
                </span>
                <span className="log-size">{log.messageSize} bytes</span>
              </div>
              <div className="log-content">
                <pre className="message-content">
                  {formatMessageContent(log.messageContent, log.messageType)}
                </pre>
              </div>
              <div className="log-client-info">
                <span className="client-ip">🌐 {log.clientInfo.ip}</span>
                <span className="connection-id">🔗 {log.connectionId.substring(0, 20)}...</span>
                {log.clientInfo.userAgent && (
                  <span className="user-agent" title={log.clientInfo.userAgent}>
                    💻 {log.clientInfo.userAgent.substring(0, 50)}...
                  </span>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>

      <style jsx>{`
        .message-log-viewer {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 20px;
          height: 600px;
          display: flex;
          flex-direction: column;
        }

        .log-header {
          margin-bottom: 16px;
          border-bottom: 2px solid #e0e0e0;
          padding-bottom: 12px;
        }

        .log-header h2 {
          margin: 0 0 12px 0;
          color: #333;
        }

        .log-controls {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
        }

        .filter-input {
          flex: 1;
          min-width: 200px;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .type-filter {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          background: white;
        }

        .auto-scroll-toggle {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          cursor: pointer;
        }

        .log-count {
          font-size: 14px;
          color: #666;
          font-weight: 500;
        }

        .log-list {
          flex: 1;
          overflow-y: auto;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          padding: 12px;
          background: #f9f9f9;
        }

        .log-empty {
          text-align: center;
          color: #999;
          padding: 40px;
          font-size: 14px;
        }

        .log-item {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          padding: 12px;
          margin-bottom: 12px;
          transition: box-shadow 0.2s;
        }

        .log-item:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .log-meta {
          display: flex;
          gap: 12px;
          margin-bottom: 8px;
          font-size: 12px;
        }

        .log-time {
          color: #666;
          font-family: monospace;
        }

        .log-type {
          padding: 2px 8px;
          border-radius: 3px;
          font-weight: 600;
          font-size: 11px;
        }

        .message-type-text {
          background: #e3f2fd;
          color: #1976d2;
        }

        .message-type-json {
          background: #fff3e0;
          color: #f57c00;
        }

        .message-type-binary {
          background: #f3e5f5;
          color: #7b1fa2;
        }

        .log-size {
          color: #999;
          font-family: monospace;
        }

        .log-content {
          margin-bottom: 8px;
        }

        .message-content {
          margin: 0;
          padding: 8px;
          background: #f5f5f5;
          border-radius: 4px;
          font-size: 13px;
          font-family: 'Courier New', monospace;
          overflow-x: auto;
          max-height: 150px;
          overflow-y: auto;
        }

        .log-client-info {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: #666;
          flex-wrap: wrap;
        }

        .client-ip, .connection-id, .user-agent {
          display: inline-block;
        }

        .connection-id {
          font-family: monospace;
        }
      `}</style>
    </div>
  );
}

MessageLogViewer.propTypes = {
  dashboardWs: PropTypes.object
};

export default MessageLogViewer;
