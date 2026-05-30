import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../components/Header.jsx';
import QRCode from '../components/QRCode.jsx';
import ResultsCloud from '../components/ResultsCloud.jsx';
import { loadSessions, saveSessions } from '../utils/storage.js';
import { connectSession, sendMessage } from '../utils/realtime.js';

function updateStoredSession(code, updater) {
  const sessions = loadSessions();
  const next = sessions.map((session) => (session.code === code ? updater(session) : session));
  saveSessions(next);
  return next.find((session) => session.code === code);
}

export default function Presenter() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(() => loadSessions().find((item) => item.code === sessionId));
  const [socket, setSocket] = useState(null);
  const origin = window.location.origin;

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
    const ws = connectSession({
      sessionCode: sessionId,
      role: 'presenter',
      onMessage: (message) => {
        if (message.type === 'state') {
          setSession((current) =>
            current
              ? {
                  ...current,
                  currentStep: message.currentStep ?? current.currentStep,
                  responses: message.responses || current.responses,
                }
              : current,
          );
        }
      },
    });
    setSocket(ws);
    return () => ws?.close();
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

  return (
    <>
      <Header center={poll.title} status={`Session ${session.code}`} />
      <main className="presenter-layout">
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
          <QRCode value={`${origin}/join/${session.code}`} label={`${origin}/join/${session.code}`} />
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
