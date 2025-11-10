/**
 * EventTimeline Component
 * T046-T048: 연결/해제 이벤트 타임라인 컴포넌트
 *
 * 기능:
 * - 연결 이벤트 로그 표시
 * - 연결/해제 이벤트 구분
 * - 타임라인 형식으로 표시
 * - WebSocket을 통한 실시간 업데이트
 */

import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

function EventTimeline({ dashboardWs }) {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'connected', 'disconnected'
  const [autoScroll, setAutoScroll] = useState(true);
  const eventsEndRef = useRef(null);

  useEffect(() => {
    if (!dashboardWs) return;

    // 초기 이벤트 데이터 수신
    const handleInitialEvents = (eventsList) => {
      console.log('초기 이벤트 수신:', eventsList.length);
      setEvents(eventsList);
    };

    // 새로운 연결 이벤트 수신
    const handleConnectionEvent = (event) => {
      console.log('새 연결 이벤트:', event);
      setEvents(prev => [...prev, event].slice(-50)); // 최대 50개 유지
    };

    dashboardWs.on('initial_events', handleInitialEvents);
    dashboardWs.on('connection_event', handleConnectionEvent);

    return () => {
      dashboardWs.off('initial_events', handleInitialEvents);
      dashboardWs.off('connection_event', handleConnectionEvent);
    };
  }, [dashboardWs]);

  // 자동 스크롤
  useEffect(() => {
    if (autoScroll && eventsEndRef.current) {
      eventsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events, autoScroll]);

  // 이벤트 필터링
  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    return event.eventType === filter;
  });

  // 시간 포맷팅
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // 상대 시간 계산 ("방금 전", "5분 전")
  const getRelativeTime = (timestamp) => {
    const now = Date.now();
    const eventTime = new Date(timestamp).getTime();
    const diffMs = now - eventTime;
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 10) return '방금 전';
    if (diffSec < 60) return `${diffSec}초 전`;

    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}분 전`;

    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}시간 전`;

    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay}일 전`;
  };

  // 이벤트 타입별 아이콘 및 색상
  const getEventStyle = (eventType) => {
    if (eventType === 'connected') {
      return {
        icon: '🟢',
        color: '#4caf50',
        bgColor: '#e8f5e9',
        label: '연결됨'
      };
    } else {
      return {
        icon: '🔴',
        color: '#f44336',
        bgColor: '#ffebee',
        label: '연결 해제'
      };
    }
  };

  return (
    <div className="event-timeline">
      <div className="timeline-header">
        <h2>📅 연결 이벤트 타임라인</h2>
        <div className="timeline-controls">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="event-filter"
          >
            <option value="all">모든 이벤트</option>
            <option value="connected">연결</option>
            <option value="disconnected">해제</option>
          </select>
          <label className="auto-scroll-toggle">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
            />
            자동 스크롤
          </label>
          <span className="event-count">
            {filteredEvents.length} / {events.length}
          </span>
        </div>
      </div>

      <div className="timeline-list">
        {filteredEvents.length === 0 ? (
          <div className="timeline-empty">
            {events.length === 0
              ? '이벤트가 없습니다.'
              : '필터와 일치하는 이벤트가 없습니다.'}
          </div>
        ) : (
          filteredEvents.map((event, index) => {
            const style = getEventStyle(event.eventType);
            return (
              <div
                key={event.eventId}
                className="timeline-item"
                style={{ borderLeftColor: style.color }}
              >
                <div className="timeline-marker" style={{ backgroundColor: style.color }}>
                  {style.icon}
                </div>
                <div className="timeline-content" style={{ backgroundColor: style.bgColor }}>
                  <div className="timeline-header-row">
                    <span className="event-type" style={{ color: style.color }}>
                      {style.label}
                    </span>
                    <span className="event-time" title={formatTime(event.timestamp)}>
                      {getRelativeTime(event.timestamp)}
                    </span>
                  </div>
                  <div className="event-details">
                    <div className="event-connection-id">
                      🔗 {event.connectionId}
                    </div>
                    <div className="event-client-info">
                      <span>🌐 {event.clientInfo.ip}</span>
                      {event.clientInfo.userAgent && (
                        <span title={event.clientInfo.userAgent}>
                          💻 {event.clientInfo.userAgent.substring(0, 30)}...
                        </span>
                      )}
                    </div>
                    {event.reason && (
                      <div className="event-reason">
                        📝 이유: <code>{event.reason}</code>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={eventsEndRef} />
      </div>

      <style jsx>{`
        .event-timeline {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 20px;
          height: 600px;
          display: flex;
          flex-direction: column;
        }

        .timeline-header {
          margin-bottom: 16px;
          border-bottom: 2px solid #e0e0e0;
          padding-bottom: 12px;
        }

        .timeline-header h2 {
          margin: 0 0 12px 0;
          color: #333;
        }

        .timeline-controls {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
        }

        .event-filter {
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

        .event-count {
          font-size: 14px;
          color: #666;
          font-weight: 500;
        }

        .timeline-list {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
        }

        .timeline-empty {
          text-align: center;
          color: #999;
          padding: 40px;
          font-size: 14px;
        }

        .timeline-item {
          position: relative;
          padding-left: 40px;
          margin-bottom: 20px;
          border-left: 3px solid #ddd;
        }

        .timeline-marker {
          position: absolute;
          left: -16px;
          top: 0;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .timeline-content {
          border-radius: 8px;
          padding: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .timeline-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .event-type {
          font-weight: 700;
          font-size: 14px;
        }

        .event-time {
          font-size: 12px;
          color: #666;
        }

        .event-details {
          font-size: 13px;
        }

        .event-connection-id {
          font-family: monospace;
          margin-bottom: 6px;
          color: #555;
          font-size: 12px;
        }

        .event-client-info {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 6px;
          font-size: 12px;
          color: #666;
        }

        .event-reason {
          margin-top: 6px;
          padding: 6px;
          background: rgba(0, 0, 0, 0.05);
          border-radius: 4px;
          font-size: 12px;
        }

        .event-reason code {
          font-family: monospace;
          color: #d32f2f;
        }
      `}</style>
    </div>
  );
}

EventTimeline.propTypes = {
  dashboardWs: PropTypes.object
};

export default EventTimeline;
