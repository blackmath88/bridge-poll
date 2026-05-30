import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../components/Header.jsx';
import QRCode from '../components/QRCode.jsx';
import ResultsCloud from '../components/ResultsCloud.jsx';
import { loadSessions, saveSessions } from '../utils/storage.js';
import { API_BASE, connectSession, sendMessage } from '../utils/realtime.js';
import {
  buildJoinUrl,
  buildPresenterUrl,
  copyToClipboard,
  downloadJson,
  exportSessionToCsv,
  openInNewTab,
} from '../utils/sessionTools.js';

function updateStoredSession(code, updater) {
  const sessions = loadSessions();
  const next = sessions.map((session) => (session.code === code ? updater(session) : session));
  saveSessions(next);
  return next.find((session) => session.code === code);
}

function writeStateSnapshot(code, snapshot) {
  return updateStoredSession(code, (item) => ({
    ...item,
    currentStep: snapshot.currentStep ?? item.currentStep,
    responses: snapshot.responses || item.responses,
    lastSyncedAt: new Date().toISOString(),
  }));
}

export default function Presenter() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(() => loadSessions().find((item) => item.code === sessionId));
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(API_BASE ? 'connecting' : 'local');
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef(null);
  const shouldReconnectRef = useRef(true);
  const presenterRef = useRef(null);
  const [showQr, setShowQr] = useState(() => sessionStorage.getItem('bridge-poll-show-qr') !== 'false');
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const [toast, setToast] = useState('');

  useEffect(() => {
    const sync = () => setSession(loadSessions().find((item) => item.code === sessionId));
    const interval = window.setInterval(sync, 900);
    window.addEventListener('storage', sync);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('storage', sync);
    };
  }, [sessionId]);

  useEffect(() => {
    const updateFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', updateFullscreen);
    return () => document.removeEventListener('fullscreenchange', updateFullscreen);
  }, []);

  useEffect(() => {
    if (!API_BASE) {
      setConnectionStatus('local');
      return undefined;
    }

    shouldReconnectRef.current = true;

    const scheduleReconnect = () => {
      if (!shouldReconnectRef.current) return;
      const attempt = reconnectAttemptRef.current + 1;
      reconnectAttemptRef.current = attempt;
      const delay = Math.min(30000, 800 * 2 ** Math.min(attempt - 1, 5));
      setConnectionStatus('reconnecting');
      reconnectTimerRef.current = window.setTimeout(connect, delay);
    };

    const connect = () => {
      setConnectionStatus(reconnectAttemptRef.current ? 'reconnecting' : 'connecting');
      const ws = connectSession({
        sessionCode: sessionId,
        role: 'presenter',
        onOpen: () => {
          reconnectAttemptRef.current = 0;
          setConnectionStatus('connected');
        },
        onClose: scheduleReconnect,
        onError: () => setConnectionStatus('reconnecting'),
        onMessage: (message) => {
          if (message.type === 'state') {
            const next = writeStateSnapshot(sessionId, message);
            if (next) setSession(next);
          }
        },
      });
      setSocket(ws);
    };

    connect();

    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      setSocket((current) => {
        current?.close();
        return null;
      });
    };
  }, [sessionId]);

  const poll = session?.poll;
  const step = poll?.steps[session.currentStep || 0];
  const responses = useMemo(() => (step ? session?.responses?.[step.id] || [] : []), [session, step]);

  if (!session || !poll) {
    return (
      <>
        <Header center="Presenter" status="Session missing" />
        <main className="center-state">
          <h1>Session not found</h1>
          <Link to="/">Return to Control Center</Link>
        </main>
      </>
    );
  }

  const setStep = (index) => {
    const nextIndex = Math.max(0, Math.min(index, poll.steps.length - 1));
    const next = updateStoredSession(session.code, (item) => ({ ...item, currentStep: nextIndex }));
    setSession(next);
    sendMessage(socket, { type: 'advance_step', step: nextIndex });
  };

  const clearCurrent = () => {
    if (!step || step.type !== 'input') return;
    const next = updateStoredSession(session.code, (item) => ({
      ...item,
      responses: { ...item.responses, [step.id]: [] },
    }));
    setSession(next);
    sendMessage(socket, { type: 'clear_step', stepId: step.id });
  };

  const simulate = () => {
    if (!step || step.type !== 'input') return;
    const sample = step.samples?.length ? step.samples : ['Clarity', 'Momentum', 'Focus', 'Trust'];
    const next = updateStoredSession(session.code, (item) => ({
      ...item,
      responses: {
        ...item.responses,
        [step.id]: [...(item.responses?.[step.id] || []), ...sample.slice(0, 4)],
      },
    }));
    setSession(next);
  };

  const showCopied = (message = 'Copied!') => {
    setToast(message);
    window.setTimeout(() => setToast(''), 1500);
  };

  const copy = async (value) => {
    try {
      await copyToClipboard(value);
      showCopied();
    } catch {
      showCopied('Copy failed');
    }
  };

  const toggleQr = () => {
    setShowQr((current) => {
      const next = !current;
      sessionStorage.setItem('bridge-poll-show-qr', String(next));
      return next;
    });
  };

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    await (presenterRef.current || document.documentElement).requestFullscreen();
  };

  const joinUrl = buildJoinUrl(session.code);
  const presenterUrl = buildPresenterUrl(session.code);

  return (
    <>
      <Header center={poll.title} status={`Session ${session.code} · ${connectionStatus}`} />
      <main className="presenter-layout" ref={presenterRef}>
        <section className="presenter-main">
          <div className="step-strip">
            {poll.steps.map((item, index) => (
              <button
                className={index === session.currentStep ? 'active' : index < session.currentStep ? 'done' : ''}
                key={item.id}
                onClick={() => setStep(index)}
              >
                {item.pill || index + 1}
              </button>
            ))}
          </div>

          <div className="question-block">
            <p>{step.type}</p>
            <h1>{step.prompt}</h1>
            {step.helper ? <span>{step.helper}</span> : null}
          </div>

          {step.type === 'input' ? <ResultsCloud responses={responses} /> : null}
          {step.type === 'narrate' ? <div className="narrate-box">{step.helper || step.prompt}</div> : null}
          {step.type === 'reflect' ? (
            <div className="reflect-grid">
              {(step.cards || []).map((card) => (
                <article key={card.title}>
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                </article>
              ))}
            </div>
          ) : null}
        </section>

        <aside className="presenter-side">
          <div className="presenter-tools">
            <div>
              <div className="session-code">{session.code}</div>
              <p>{showQr ? 'Participants can scan or use the join link.' : 'QR hidden. Session code remains visible.'}</p>
            </div>
            {toast ? <span className="toast-pill">{toast}</span> : null}
            <div className="side-actions">
              <button onClick={() => copy(joinUrl)}>Copy Join Link</button>
              <button onClick={() => copy(presenterUrl)}>Copy Presenter Link</button>
              <button onClick={() => openInNewTab(joinUrl)}>Open Join</button>
              <button onClick={() => openInNewTab(presenterUrl)}>Open Presenter</button>
              <button onClick={toggleFullscreen}>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</button>
              <button onClick={toggleQr}>{showQr ? 'Hide QR' : 'Show QR'}</button>
              <button onClick={() => downloadJson(`bridge-poll-session-${session.code}.json`, session)}>
                Export JSON
              </button>
              <button onClick={() => exportSessionToCsv(session)}>Export CSV</button>
            </div>
          </div>
          {showQr ? (
            <QRCode
              value={joinUrl}
              label={`${session.code} | /join/${session.code}`}
              canDownload
              filename={`${session.code}-join-qr.png`}
            />
          ) : null}
          <div className="stat-grid">
            <div>
              <strong>{responses.length}</strong>
              <span>Total</span>
            </div>
            <div>
              <strong>{new Set(responses.map((item) => item.toLowerCase())).size}</strong>
              <span>Unique</span>
            </div>
          </div>
          <div className="feed">
            {responses.slice(-8).map((response, index) => (
              <p key={`${response}-${index}`}>{response}</p>
            ))}
          </div>
          <div className="side-actions">
            <button onClick={() => setStep(session.currentStep - 1)}>Back</button>
            <button onClick={() => setStep(session.currentStep + 1)}>Next</button>
            <button onClick={simulate}>Simulate</button>
            <button onClick={clearCurrent}>Clear</button>
          </div>
        </aside>
      </main>
    </>
  );
}
