import { useMemo, useState } from 'react';
import QRCode from './QRCode.jsx';
import {
  buildJoinUrl,
  buildPresenterUrl,
  copyToClipboard,
  downloadJson,
  exportSessionToCsv,
  openInNewTab,
} from '../utils/sessionTools.js';

export default function SessionManager({
  sessions,
  selectedSession,
  onSelectSession,
  onEndSession,
  onDuplicateSession,
}) {
  const [toast, setToast] = useState('');
  const joinUrl = selectedSession ? buildJoinUrl(selectedSession.code) : '';
  const presenterUrl = selectedSession ? buildPresenterUrl(selectedSession.code) : '';
  const sortedSessions = useMemo(
    () =>
      [...sessions].sort((a, b) => {
        const aTime = new Date(a.createdAt || 0).getTime();
        const bTime = new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
      }),
    [sessions],
  );

  const showCopied = (message = 'Copied!') => {
    setToast(message);
    window.setTimeout(() => setToast(''), 1400);
  };

  const copy = async (value) => {
    try {
      await copyToClipboard(value);
      showCopied();
    } catch {
      showCopied('Copy failed');
    }
  };

  return (
    <section className="panel session-panel">
      <div className="panel-head">
        <div>
          <h2>Sessions</h2>
          <p>{selectedSession ? `${selectedSession.code} is ready` : 'Start a poll to launch.'}</p>
        </div>
        {toast ? <span className="toast-pill">{toast}</span> : null}
      </div>

      {selectedSession ? (
        <div className="launch-card">
          <div>
            <div className="session-code">{selectedSession.code}</div>
            <h3>{selectedSession.pollTitle}</h3>
            <p>{`Join: /join/${selectedSession.code}`}</p>
            <div className="inline-actions">
              <button onClick={() => copy(joinUrl)}>Copy Join Link</button>
              <button onClick={() => copy(presenterUrl)}>Copy Presenter Link</button>
              <button onClick={() => openInNewTab(presenterUrl)}>Open Presenter</button>
              <button onClick={() => openInNewTab(joinUrl)}>Open Join</button>
              <button onClick={() => onEndSession?.(selectedSession)}>End session</button>
              <button onClick={() => onDuplicateSession?.(selectedSession)}>Duplicate session</button>
              <button onClick={() => downloadJson(`bridge-poll-session-${selectedSession.code}.json`, selectedSession)}>
                Export JSON
              </button>
              <button onClick={() => exportSessionToCsv(selectedSession)}>Export CSV</button>
            </div>
          </div>
          <QRCode
            value={joinUrl}
            label={`${selectedSession.code} | /join/${selectedSession.code}`}
            canDownload
            filename={`${selectedSession.code}-join-qr.png`}
          />
        </div>
      ) : null}

      <div className="session-list">
        {sortedSessions.map((session) => (
          <article
            className={`session-row ${selectedSession?.id === session.id ? 'active' : ''}`}
            key={session.id}
            onClick={() => onSelectSession?.(session)}
          >
            <strong>{session.code}</strong>
            <span>{session.pollTitle}</span>
            <em>{session.status}</em>
            <div className="session-row-actions" onClick={(event) => event.stopPropagation()}>
              <button onClick={() => openInNewTab(buildPresenterUrl(session.code))}>Present</button>
              <button onClick={() => onDuplicateSession?.(session)}>Duplicate</button>
              <button onClick={() => onEndSession?.(session)} disabled={session.status === 'ended'}>
                End
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
