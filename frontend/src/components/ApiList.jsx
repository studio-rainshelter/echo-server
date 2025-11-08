import { useState } from 'react';

const API_ENDPOINTS = [
  {
    name: 'Echo (GET)',
    method: 'GET',
    path: '/api/echo?message=hello',
    description: '쿼리 파라미터를 에코합니다'
  },
  {
    name: 'Echo (POST)',
    method: 'POST',
    path: '/api/echo',
    description: 'Body 데이터를 에코합니다',
    body: { data: 'test' }
  },
  {
    name: 'Users (GET)',
    method: 'GET',
    path: '/api/users',
    description: 'Mock 사용자 목록을 반환합니다'
  },
  {
    name: 'Users (POST)',
    method: 'POST',
    path: '/api/users',
    description: '새 사용자를 생성합니다',
    body: { name: 'Test User', email: 'test@example.com' }
  },
  {
    name: 'Status',
    method: 'GET',
    path: '/api/status',
    description: '서버 상태 및 통계를 조회합니다'
  },
  {
    name: 'JSON',
    method: 'POST',
    path: '/api/json',
    description: 'JSON 데이터를 처리합니다',
    body: { key: 'value' }
  },
  {
    name: 'Delay',
    method: 'GET',
    path: '/api/delay/1000',
    description: '1초 지연된 응답을 받습니다'
  },
  {
    name: 'Update',
    method: 'PUT',
    path: '/api/update/123',
    description: '리소스를 업데이트합니다',
    body: { name: 'Updated' }
  },
  {
    name: 'Delete',
    method: 'DELETE',
    path: '/api/delete/123',
    description: '리소스를 삭제합니다'
  },
  {
    name: 'Error',
    method: 'GET',
    path: '/api/error/404',
    description: '404 에러를 시뮬레이션합니다'
  }
];

function ApiList() {
  const [loading, setLoading] = useState({});
  const [results, setResults] = useState({});

  const testEndpoint = async (endpoint, protocol = 'http') => {
    const key = `${endpoint.name}-${protocol}`;
    setLoading(prev => ({ ...prev, [key]: true }));

    try {
      const options = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (endpoint.body) {
        options.body = JSON.stringify(endpoint.body);
      }

      // HTTP: 포트 1818, HTTPS: 포트 1819
      const port = protocol === 'https' ? '1819' : '1818';
      const apiUrl = `${protocol}://localhost:${port}`;
      const response = await fetch(`${apiUrl}${endpoint.path}`, options);
      const data = await response.json();

      setResults(prev => ({
        ...prev,
        [key]: { status: response.status, data, protocol }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [key]: { error: error.message, protocol }
      }));
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  return (
    <div className="api-list">
      <h2>API 엔드포인트 목록</h2>
      <div className="endpoints">
        {API_ENDPOINTS.map(endpoint => (
          <div key={endpoint.name} className="endpoint-card">
            <div className="endpoint-header">
              <span className={`method-badge ${endpoint.method.toLowerCase()}`}>
                {endpoint.method}
              </span>
              <span className="endpoint-name">{endpoint.name}</span>
            </div>
            <div className="endpoint-path">{endpoint.path}</div>
            <div className="endpoint-description">{endpoint.description}</div>

            <div className="button-group">
              <button
                onClick={() => testEndpoint(endpoint, 'http')}
                disabled={loading[`${endpoint.name}-http`]}
                className="test-button http-button"
              >
                {loading[`${endpoint.name}-http`] ? '테스트 중...' : 'HTTP 테스트'}
              </button>
              <button
                onClick={() => testEndpoint(endpoint, 'https')}
                disabled={loading[`${endpoint.name}-https`]}
                className="test-button https-button"
              >
                {loading[`${endpoint.name}-https`] ? '테스트 중...' : 'HTTPS 테스트'}
              </button>
            </div>

            {/* HTTP 결과 */}
            {results[`${endpoint.name}-http`] && (
              <div className="result">
                <div className="result-header">HTTP (포트 1818) 결과:</div>
                {results[`${endpoint.name}-http`].error ? (
                  <div className="error">에러: {results[`${endpoint.name}-http`].error}</div>
                ) : (
                  <div className="success">
                    <div>상태: {results[`${endpoint.name}-http`].status}</div>
                    <pre>{JSON.stringify(results[`${endpoint.name}-http`].data, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}

            {/* HTTPS 결과 */}
            {results[`${endpoint.name}-https`] && (
              <div className="result">
                <div className="result-header">HTTPS (포트 1819) 결과:</div>
                {results[`${endpoint.name}-https`].error ? (
                  <div className="error">에러: {results[`${endpoint.name}-https`].error}</div>
                ) : (
                  <div className="success">
                    <div>상태: {results[`${endpoint.name}-https`].status}</div>
                    <pre>{JSON.stringify(results[`${endpoint.name}-https`].data, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ApiList;
