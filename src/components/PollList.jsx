export default function PollList({
  polls,
  selectedPollId,
  onSelect,
  onCreate,
  onDuplicate,
  onDelete,
  onStart,
}) {
  return (
    <section className="panel poll-list">
      <div className="panel-head">
        <div>
          <h2>Polls</h2>
          <p>{polls.length} available flows</p>
        </div>
        <button className="icon-button primary" onClick={onCreate} title="Create poll">
          +
        </button>
      </div>

      <div className="poll-items">
        {polls.map((poll) => {
          const inputCount = poll.steps.filter((step) => step.type === 'input').length;
          return (
            <article
              className={`poll-row ${poll.id === selectedPollId ? 'active' : ''}`}
              key={poll.id}
              onClick={() => onSelect(poll.id)}
            >
              <div>
                <h3>{poll.title}</h3>
                <p>
                  {poll.steps.length} steps, {inputCount} inputs
                </p>
              </div>
              <span className={`state ${poll.status || 'draft'}`}>{poll.status || 'draft'}</span>
              <div className="row-actions" onClick={(event) => event.stopPropagation()}>
                <button onClick={() => onStart(poll)} title="Start session">
                  Start
                </button>
                <button onClick={() => onDuplicate(poll)} title="Duplicate poll">
                  Copy
                </button>
                <button onClick={() => onDelete(poll.id)} title="Delete poll">
                  Delete
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
