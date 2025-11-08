import { useEffect, useRef } from 'react';

function LogViewer({ logs }) {
  const logEndRef = useRef(null);

  // 새 로그가 추가될 때마다 자동 스크롤
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getStatusColor = (statusCode) => {
    if (statusCode >= 200 && statusCode < 300) return 'success';
    if (statusCode >= 300 && statusCode < 400) return 'redirect';
    if (statusCode >= 400 && statusCode < 500) return 'client-error';
    if (statusCode >= 500) return 'server-error';
    return 'default';
  };

  const getMethodColor = (method) => {
    const colors = {
      GET: 'get',
      POST: 'post',
      PUT: 'put',
      DELETE: 'delete',
      PATCH: 'patch'
    };
    return colors[method] || 'default';
  };

  return (
    <div className="log-viewer">
      <h2>실시간 로그</h2>
      <div className="logs-container">
        {logs.length === 0 ? (
          <div className="no-logs">로그가 없습니다. API를 호출하면 여기에 표시됩니다.</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="log-entry">
              <div className="log-time">
                {new Date(log.request.timestamp).toLocaleTimeString()}
              </div>
              <span className={`log-method ${getMethodColor(log.request.method)}`}>
                {log.request.method}
              </span>
              <span className="log-path">{log.request.path}</span>
              <span className={`log-status ${getStatusColor(log.response.statusCode)}`}>
                {log.response.statusCode}
              </span>
              <span className="log-duration">{log.response.duration}ms</span>
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}

export default LogViewer;
