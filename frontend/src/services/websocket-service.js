/**
 * Dashboard WebSocket Service
 * T033: 대시보드 ↔ 백엔드 웹소켓 통신
 *
 * /ws/dashboard 엔드포인트와 통신하여 실시간 데이터를 수신합니다.
 * - 메시지 로그
 * - 연결 이벤트
 * - 서버 통계
 * - 활성 연결 목록
 */

class DashboardWebSocketService {
  constructor() {
    this.ws = null;
    this.url = null;
    this.handlers = {
      initial_logs: [],
      initial_events: [],
      new_message_log: [],
      connection_event: [],
      statistics: [],
      active_connections: [],
      connection_status: [],
      error: []
    };
    this.reconnectDelay = 3000;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectTimer = null;
  }

  /**
   * WebSocket 연결
   * @param {string} host - 서버 호스트 (예: 'localhost:1818')
   * @param {string} protocol - 'ws' 또는 'wss'
   */
  connect(host = 'localhost:1818', protocol = 'ws') {
    this.url = `${protocol}://${host}/ws/dashboard`;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('✓ Dashboard WebSocket 연결됨:', this.url);
        this.reconnectAttempts = 0;
        this._triggerHandlers('connection_status', { status: 'connected', url: this.url });
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this._handleMessage(message);
        } catch (error) {
          console.error('메시지 파싱 에러:', error);
          this._triggerHandlers('error', { type: 'parse_error', error });
        }
      };

      this.ws.onclose = (event) => {
        console.log('✗ Dashboard WebSocket 연결 종료:', event.code, event.reason);
        this._triggerHandlers('connection_status', { status: 'disconnected', code: event.code });
        this._attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('✗ Dashboard WebSocket 에러:', error);
        this._triggerHandlers('error', { type: 'connection_error', error });
      };
    } catch (error) {
      console.error('WebSocket 연결 실패:', error);
      this._triggerHandlers('error', { type: 'connection_failed', error });
      this._attemptReconnect();
    }
  }

  /**
   * 이벤트 핸들러 등록
   * @param {string} type - 이벤트 타입
   * @param {Function} handler - 핸들러 함수
   */
  on(type, handler) {
    if (this.handlers[type]) {
      this.handlers[type].push(handler);
    } else {
      console.warn(`알 수 없는 이벤트 타입: ${type}`);
    }
  }

  /**
   * 이벤트 핸들러 제거
   * @param {string} type - 이벤트 타입
   * @param {Function} handler - 제거할 핸들러 함수
   */
  off(type, handler) {
    if (this.handlers[type]) {
      this.handlers[type] = this.handlers[type].filter(h => h !== handler);
    }
  }

  /**
   * 메시지 전송
   * @param {Object} message - 전송할 메시지
   */
  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket이 연결되지 않았습니다');
    }
  }

  /**
   * 연결 종료
   */
  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * 수동 재연결
   */
  reconnect() {
    this.disconnect();
    this.reconnectAttempts = 0;

    if (this.url) {
      // URL에서 프로토콜과 호스트 추출
      const urlObj = new URL(this.url.replace('ws://', 'http://').replace('wss://', 'https://'));
      const protocol = this.url.startsWith('wss') ? 'wss' : 'ws';
      this.connect(urlObj.host, protocol);
    }
  }

  /**
   * 연결 상태 확인
   * @returns {boolean}
   */
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * 메시지 처리
   * @private
   */
  _handleMessage(message) {
    const { type, data, timestamp } = message;

    switch (type) {
      case 'initial_logs':
        // 초기 로그 데이터
        this._triggerHandlers('initial_logs', data);
        break;

      case 'initial_events':
        // 초기 이벤트 데이터
        this._triggerHandlers('initial_events', data);
        break;

      case 'new_message_log':
        // 새로운 메시지 로그
        this._triggerHandlers('new_message_log', data);
        break;

      case 'connection_event':
        // 연결 이벤트 (connected/disconnected)
        this._triggerHandlers('connection_event', data);
        break;

      case 'statistics':
        // 서버 통계 업데이트
        this._triggerHandlers('statistics', data);
        break;

      case 'active_connections':
        // 활성 연결 목록
        this._triggerHandlers('active_connections', data);
        break;

      default:
        console.log('알 수 없는 메시지 타입:', type, data);
    }
  }

  /**
   * 핸들러 트리거
   * @private
   */
  _triggerHandlers(type, data) {
    if (this.handlers[type]) {
      this.handlers[type].forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`핸들러 실행 에러 (${type}):`, error);
        }
      });
    }
  }

  /**
   * 자동 재연결 시도
   * @private
   */
  _attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);

      this.reconnectTimer = setTimeout(() => {
        this.reconnect();
      }, this.reconnectDelay);
    } else {
      console.error('최대 재연결 시도 횟수 초과');
      this._triggerHandlers('error', {
        type: 'max_reconnect_attempts',
        message: '최대 재연결 시도 횟수를 초과했습니다'
      });
    }
  }
}

export default DashboardWebSocketService;
