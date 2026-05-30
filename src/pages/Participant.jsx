import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../components/Header.jsx';
import { loadSessions, saveSessions } from '../utils/storage.js';
import { API_BASE, connectSession, sendMessage } from '../utils/realtime.js';

function firstInputAtOrAfter(steps, startIndex) {
  const found = steps.findIndex((step, index) => index >= startIndex && step.type === 'input');
  return found === -1 ? steps.findIndex((step) => step.type === 'input') : found;
}

function writeStateSnapshot(code, snapshot) {
  const sessions = loadSessions();
  const nextSessions = sessions.map((item) =>
    item.code === code
      ? {
          ...item,
          currentStep: snapshot.currentStep ?? item.currentStep,
          responses: snapshot.responses || item.responses,
          lastSyncedAt: new Date().toISOString(),
        }
      : item,
  );
  saveSessions(nextSessions);
  return nextSessions.find((item) => item.code === code);
}

export default function Participant() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(() => loadSessions().find((item) => item.code === sessionId));
  const [answer, setAnswer] = useState('');
  const [submittedStep, setSubmittedStep] = useState(null);
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(API_BASE ? 'connecting' : 'local');
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef(null);
  const shouldReconnectRef = useRef(true);
  const textareaRef = useRef(null);

  useEffect(() => {
    const sync = () => setSession(loadSessions().find((item) => item.code === sessionId));
    sync();
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('storage', sync);
    };
  }, [sessionId]);

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
        role: 'participant',
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
  const stepIndex = useMemo(
    () => (poll ? firstInputAtOrAfter(poll.steps, session.currentStep || 0) : -1),
    [poll, session],
  );
  const step = stepIndex >= 0 ? poll.steps[stepIndex] : null;
  const isWaiting = submittedStep === step?.id;

  useEffect(() => {
    if (submittedStep && step?.id !== submittedStep) {
      setSubmittedStep(null);
    }
  }, [step?.id, submittedStep]);

  useEffect(() => {
    if (step?.id && !isWaiting) {
      textareaRef.current?.focus();
    }
  }, [isWaiting, step?.id]);

  if (!session || !poll) {
    return (
      <>
        <Header center="Join" status="Session missing" />
        <main className="center-state">
          <h1>Session not found</h1>
          <Link to="/">Return to Control Center</Link>
        </main>
      </>
    );
  }

  const submit = () => {
    const text = answer.trim();
    if (!text || !step) return;
    const sessions = loadSessions();
    const nextSessions = sessions.map((item) => {
      if (item.code !== session.code) return item;
      return {
        ...item,
        responses: {
          ...item.responses,
          [step.id]: [...(item.responses?.[step.id] || []), text],
        },
      };
    });
    saveSessions(nextSessions);
    setSession(nextSessions.find((item) => item.code === session.code));
    sendMessage(socket, { type: 'response', stepId: step.id, text });
    setSubmittedStep(step.id);
    setAnswer('');
  };

  return (
    <>
      <Header center={poll.title} status={`Session ${session.code} · ${connectionStatus}`} />
      <main className="participant-shell">
        <section className="participant-card">
          {step ? (
            <>
              <p className="step-kicker">
                Step {stepIndex + 1} of {poll.steps.length}
              </p>
              <h1>{step.prompt}</h1>
              {step.helper ? <p>{step.helper}</p> : null}
              {isWaiting ? (
                <div className="thanks">
                  <h2>Thank you</h2>
                  <p>Wait for the presenter to move to the next question.</p>
                </div>
              ) : (
                <>
                  <textarea
                    ref={textareaRef}
                    value={answer}
                    maxLength={180}
                    placeholder={step.placeholder || 'Type here...'}
                    onChange={(event) => setAnswer(event.target.value)}
                    onKeyDown={(event) => {
                      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                        event.preventDefault();
                        submit();
                      }
                    }}
                  />
                  <div className="participant-actions">
                    <span>{answer.length}/180</span>
                    <button onClick={submit} disabled={!answer.trim()}>
                      Submit
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="thanks">
              <h1>No input questions are open</h1>
              <p>Watch the presenter screen for the next prompt.</p>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
