import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header.jsx';
import ImportExport from '../components/ImportExport.jsx';
import PollEditor from '../components/PollEditor.jsx';
import PollList from '../components/PollList.jsx';
import SessionManager from '../components/SessionManager.jsx';
import { createId, createSessionCode, defaultPoll, normalizePoll } from '../utils/pollSchema.js';
import { pollTemplates } from '../utils/pollTemplates.js';
import { loadPolls, loadSessions, savePolls, saveSessions, upsertSession } from '../utils/storage.js';
import { createRemoteSession } from '../utils/realtime.js';

export default function Admin() {
  const [polls, setPolls] = useState(() => loadPolls());
  const [sessions, setSessions] = useState(() => sortSessions(loadSessions()));
  const [selectedPollId, setSelectedPollId] = useState(() => loadPolls()[0]?.id);
  const [selectedSession, setSelectedSession] = useState(null);

  const selectedPoll = useMemo(
    () => polls.find((poll) => poll.id === selectedPollId) || polls[0],
    [polls, selectedPollId],
  );

  useEffect(() => {
    const refreshSessions = () => {
      const nextSessions = sortSessions(loadSessions());
      setSessions(nextSessions);
      setSelectedSession((current) => {
        if (!current) return current;
        return nextSessions.find((session) => session.id === current.id) || current;
      });
    };

    window.addEventListener('storage', refreshSessions);
    return () => window.removeEventListener('storage', refreshSessions);
  }, []);

  const persistPolls = (nextPolls) => {
    setPolls(nextPolls);
    savePolls(nextPolls);
  };

  const updatePoll = (poll) => {
    persistPolls(polls.map((item) => (item.id === poll.id ? poll : item)));
  };

  const createPoll = () => {
    const poll = normalizePoll({
      ...defaultPoll,
      id: createId('poll'),
      title: 'Untitled poll',
      subtitle: '',
      status: 'draft',
      steps: [{ type: 'input', prompt: 'What should we ask?', placeholder: 'Type here...' }],
    });
    persistPolls([poll, ...polls]);
    setSelectedPollId(poll.id);
  };

  const addTemplate = (template) => {
    const poll = normalizePoll({
      ...template.poll,
      id: createId('poll'),
      title: template.poll.title || template.name,
      createdAt: new Date().toISOString(),
    });
    persistPolls([poll, ...polls]);
    setSelectedPollId(poll.id);
  };

  const duplicatePoll = (poll) => {
    const copy = normalizePoll({
      ...poll,
      id: createId('poll'),
      title: `${poll.title} copy`,
      createdAt: new Date().toISOString(),
    });
    persistPolls([copy, ...polls]);
    setSelectedPollId(copy.id);
  };

  const deletePoll = (pollId) => {
    const next = polls.filter((poll) => poll.id !== pollId);
    persistPolls(next);
    setSelectedPollId(next[0]?.id);
  };

  const importPolls = (incoming) => {
    const existing = new Map(polls.map((poll) => [poll.id, poll]));
    incoming.forEach((poll) => existing.set(poll.id, poll));
    persistPolls([...existing.values()]);
    setSelectedPollId(incoming[0]?.id);
  };

  function sortSessions(nextSessions) {
    return [...nextSessions].sort((a, b) => {
      const aTime = new Date(a.createdAt || 0).getTime();
      const bTime = new Date(b.createdAt || 0).getTime();
      return bTime - aTime;
    });
  }

  const persistSessions = (nextSessions) => {
    const sorted = sortSessions(nextSessions);
    saveSessions(sorted);
    setSessions(sorted);
    return sorted;
  };

  const startSession = async (poll) => {
    let remoteCode = null;
    let presenterToken = null;
    try {
      const remote = await createRemoteSession();
      remoteCode = remote?.code;
      presenterToken = remote?.presenterToken || null;
    } catch {
      remoteCode = null;
      presenterToken = null;
    }

    const session = {
      id: createId('session'),
      code: remoteCode || createSessionCode(),
      pollId: poll.id,
      pollTitle: poll.title,
      poll,
      presenterToken,
      status: 'live',
      currentStep: 0,
      responses: {},
      createdAt: new Date().toISOString(),
    };
    const nextSessions = upsertSession(session);
    persistSessions(nextSessions);
    setSelectedSession(session);
  };

  const endSession = (session) => {
    const ended = {
      ...session,
      status: 'ended',
      endedAt: new Date().toISOString(),
    };
    persistSessions(sessions.map((item) => (item.id === session.id ? ended : item)));
    if (selectedSession?.id === session.id) {
      setSelectedSession(ended);
    }
  };

  const duplicateSession = (session) => {
    if (session?.poll) {
      startSession(session.poll);
    }
  };

  const clearSessions = () => {
    saveSessions([]);
    setSessions([]);
    setSelectedSession(null);
  };

  return (
    <>
      <Header center="Control Center" status="Local first" />
      <main className="admin-layout">
        <div className="admin-left">
          <PollList
            polls={polls}
            selectedPollId={selectedPoll?.id}
            onSelect={setSelectedPollId}
            onCreate={createPoll}
            onDuplicate={duplicatePoll}
            onDelete={deletePoll}
            onStart={startSession}
          />
          <ImportExport polls={polls} onImport={importPolls} />
          <section className="panel templates-panel">
            <div className="panel-head">
              <div>
                <h2>Templates</h2>
                <p>Add a ready-made poll to your list.</p>
              </div>
            </div>
            <div className="template-list">
              {pollTemplates.map((template) => (
                <article className="template-row" key={template.name}>
                  <div>
                    <h3>{template.name}</h3>
                    <p>{template.description}</p>
                  </div>
                  <button onClick={() => addTemplate(template)}>Add template</button>
                </article>
              ))}
            </div>
          </section>
        </div>
        <PollEditor poll={selectedPoll} onChange={updatePoll} />
        <div className="admin-right">
          <SessionManager
            sessions={sessions}
            selectedSession={selectedSession}
            onSelectSession={setSelectedSession}
            onEndSession={endSession}
            onDuplicateSession={duplicateSession}
          />
          <section className="panel compact-panel">
            <div className="panel-head">
              <div>
                <h2>Analytics</h2>
                <p>Export-ready session data is stored with each launched poll.</p>
              </div>
            </div>
            <button onClick={() => saveSessions(sessions)}>Save sessions</button>
            <button onClick={clearSessions}>Clear recent</button>
          </section>
        </div>
      </main>
    </>
  );
}
