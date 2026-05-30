import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../components/Header.jsx';
import { loadSessions, saveSessions } from '../utils/storage.js';
import { connectSession, sendMessage } from '../utils/realtime.js';

function firstInputAtOrAfter(steps, startIndex) {
  const found = steps.findIndex((step, index) => index >= startIndex && step.type === 'input');
  return found === -1 ? steps.findIndex((step) => step.type === 'input') : found;
}

export default function Participant() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(() => loadSessions().find((item) => item.code === sessionId));
  const [answer, setAnswer] = useState('');
  const [submittedStep, setSubmittedStep] = useState(null);
  const [socket, setSocket] = useState(null);

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
      role: 'participant',
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
      <Header center={poll.title} status={`Session ${session.code}`} />
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
                    value={answer}
                    maxLength={180}
                    placeholder={step.placeholder || 'Type here...'}
                    onChange={(event) => setAnswer(event.target.value)}
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
