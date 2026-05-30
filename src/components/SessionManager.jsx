import { Link } from 'react-router-dom';
import QRCode from './QRCode.jsx';

export default function SessionManager({ sessions, selectedSession }) {
  const origin = window.location.origin;
  const joinUrl = selectedSession ? `${origin}/join/${selectedSession.code}` : '';

  return (
    <section className="panel session-panel">
      <div className="panel-head">
        <div>
          <h2>Sessions</h2>
          <p>{selectedSession ? `${selectedSession.code} is ready` : 'Start a poll to launch.'}</p>
        </div>
      </div>

      {selectedSession ? (
        <div className="launch-card">
          <div>
            <div className="session-code">{selectedSession.code}</div>
            <h3>{selectedSession.pollTitle}</h3>
            <p>{joinUrl}</p>
            <div className="inline-actions">
              <Link to={`/present/${selectedSession.code}`}>Presenter</Link>
              <Link to={`/join/${selectedSession.code}`}>Participant</Link>
            </div>
          </div>
          <QRCode value={joinUrl} label="Join URL" />
        </div>
      ) : null}

      <div className="session-list">
        {sessions.map((session) => (
          <Link className="session-row" to={`/present/${session.code}`} key={session.id}>
            <strong>{session.code}</strong>
            <span>{session.pollTitle}</span>
            <em>{session.status}</em>
          </Link>
        ))}
      </div>
    </section>
  );
}
