/**
 * StatisticsManager - 서버 통계 관리 (싱글톤)
 *
 * 역할:
 * - 서버 전체 활동 통계 추적
 * - 실시간 통계 업데이트
 * - 통계 조회
 */

class StatisticsManager {
  constructor() {
    // 싱글톤 패턴
    if (StatisticsManager.instance) {
      return StatisticsManager.instance;
    }

    this.stats = {
      currentActiveConnections: 0,
      totalConnectionsAttempted: 0,
      totalMessagesReceived: 0,
      totalMessagesSent: 0,
      serverStartedAt: new Date().toISOString(),
      uptimeSeconds: 0
    };

    // 업타임 계산을 위한 시작 시각
    this.startTime = Date.now();

    StatisticsManager.instance = this;
  }

  /**
   * 연결 수 증가
   */
  incrementConnection() {
    this.stats.totalConnectionsAttempted++;
    this.stats.currentActiveConnections++;
  }

  /**
   * 연결 수 감소
   */
  decrementConnection() {
    this.stats.currentActiveConnections = Math.max(0, this.stats.currentActiveConnections - 1);
  }

  /**
   * 수신 메시지 카운트 증가
   */
  incrementMessagesReceived() {
    this.stats.totalMessagesReceived++;
  }

  /**
   * 전송 메시지 카운트 증가
   */
  incrementMessagesSent() {
    this.stats.totalMessagesSent++;
  }

  /**
   * 현재 활성 연결 수 설정
   * @param {number} count
   */
  setActiveConnections(count) {
    this.stats.currentActiveConnections = count;
  }

  /**
   * 통계 조회
   * @returns {Object}
   */
  getStats() {
    // 업타임 계산
    this.stats.uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);

    return { ...this.stats };
  }

  /**
   * 통계 초기화 (테스트용)
   */
  reset() {
    // 개별 속성 변경 (Object.freeze 고려)
    this.stats.currentActiveConnections = 0;
    this.stats.totalConnectionsAttempted = 0;
    this.stats.totalMessagesReceived = 0;
    this.stats.totalMessagesSent = 0;
    this.stats.serverStartedAt = new Date().toISOString();
    this.stats.uptimeSeconds = 0;
    this.startTime = Date.now();
  }
}

// 싱글톤 인스턴스 생성
const instance = new StatisticsManager();

module.exports = instance;
