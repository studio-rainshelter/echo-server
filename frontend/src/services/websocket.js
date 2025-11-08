/**
 * WebSocket 클라이언트 서비스
 * 서버와의 실시간 통신을 관리합니다.
 */
class WebSocketClient {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.handlers = {
      log: [],
      stats: [],
      connection: [],
      welcome: []
    };
    this.reconnectDelay = 3000; // 3초
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
  }

  /**
   * WebSocket 연결
   */
  connect() {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('WebSocket 연결됨');
        this.reconnectAttempts = 0;
        this._triggerHandlers('connection', { status: 'connected' });
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this._handleMessage(message);
        } catch (error) {
          console.error('메시지 파싱 에러:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket 연결 끊김');
        this._triggerHandlers('connection', { status: 'disconnected' });
        this._attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket 에러:', error);
      };
    } catch (error) {
      console.error('WebSocket 연결 실패:', error);
      this._attemptReconnect();
    }
  }

  /**
   * 메시지 핸들러 등록
   * @param {string} type - 메시지 타입 ('log', 'stats', 'connection', 'welcome')
   * @param {Function} handler - 핸들러 함수
   */
  on(type, handler) {
    if (this.handlers[type]) {
      this.handlers[type].push(handler);
    }
  }

  /**
   * 메시지 전송
   * @param {Object} message - 전송할 메시지
   */
  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * 연결 종료
   */
  disconnect() {
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
    this.connect();
  }

  /**
   * 메시지 처리
   * @private
   */
  _handleMessage(message) {
    const { type, data } = message;

    switch (type) {
      case 'log':
        this._triggerHandlers('log', data);
        break;
      case 'stats':
        this._triggerHandlers('stats', data);
        break;
      case 'welcome':
        this._triggerHandlers('welcome', message);
        break;
      default:
        console.log('알 수 없는 메시지 타입:', type);
    }
  }

  /**
   * 핸들러 트리거
   * @private
   */
  _triggerHandlers(type, data) {
    if (this.handlers[type]) {
      this.handlers[type].forEach(handler => handler(data));
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

      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay);
    } else {
      console.error('최대 재연결 시도 횟수 초과');
    }
  }
}

export default WebSocketClient;
