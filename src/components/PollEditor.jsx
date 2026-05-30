const STEP_TYPES = ['input', 'narrate', 'reflect'];

function updateStep(steps, index, patch) {
  return steps.map((step, itemIndex) => (itemIndex === index ? { ...step, ...patch } : step));
}

export default function PollEditor({ poll, onChange }) {
  if (!poll) return null;

  const setPoll = (patch) => onChange({ ...poll, ...patch, updatedAt: new Date().toISOString() });
  const setStep = (index, patch) => setPoll({ steps: updateStep(poll.steps, index, patch) });

  const addStep = () => {
    setPoll({
      steps: [
        ...poll.steps,
        {
          id: `step-${Date.now().toString(36)}`,
          type: 'input',
          pill: `${poll.steps.length + 1}`,
          prompt: 'New question',
          helper: '',
          placeholder: 'Type here...',
          samples: [],
          cards: [],
        },
      ],
    });
  };

  const removeStep = (index) => setPoll({ steps: poll.steps.filter((_, itemIndex) => itemIndex !== index) });
  const moveStep = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= poll.steps.length) return;
    const steps = [...poll.steps];
    const [step] = steps.splice(index, 1);
    steps.splice(nextIndex, 0, step);
    setPoll({ steps });
  };

  return (
    <section className="panel editor-panel">
      <div className="panel-head">
        <div>
          <h2>Poll Editor</h2>
          <p>Edit structure, prompts, and response behavior.</p>
        </div>
      </div>

      <div className="form-grid">
        <label>
          Title
          <input value={poll.title} onChange={(event) => setPoll({ title: event.target.value })} />
        </label>
        <label>
          Status
          <select value={poll.status || 'draft'} onChange={(event) => setPoll({ status: event.target.value })}>
            <option value="draft">draft</option>
            <option value="ready">ready</option>
            <option value="archived">archived</option>
          </select>
        </label>
        <label className="wide">
          Subtitle
          <input value={poll.subtitle || ''} onChange={(event) => setPoll({ subtitle: event.target.value })} />
        </label>
      </div>

      <div className="steps-editor">
        {poll.steps.map((step, index) => (
          <article className="step-card" key={step.id}>
            <div className="step-card-head">
              <strong>{index + 1}</strong>
              <select value={step.type} onChange={(event) => setStep(index, { type: event.target.value })}>
                {STEP_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <button onClick={() => moveStep(index, -1)} disabled={index === 0} title="Move up">
                Up
              </button>
              <button onClick={() => moveStep(index, 1)} disabled={index === poll.steps.length - 1} title="Move down">
                Down
              </button>
              <button onClick={() => removeStep(index)} title="Remove step">
                Remove
              </button>
            </div>
            <label>
              Prompt
              <textarea value={step.prompt} onChange={(event) => setStep(index, { prompt: event.target.value })} />
            </label>
            <label>
              Helper text
              <input value={step.helper || ''} onChange={(event) => setStep(index, { helper: event.target.value })} />
            </label>
            {step.type === 'input' ? (
              <label>
                Placeholder
                <input
                  value={step.placeholder || ''}
                  onChange={(event) => setStep(index, { placeholder: event.target.value })}
                />
              </label>
            ) : null}
            {step.type === 'reflect' ? (
              <label>
                Cards JSON
                <textarea
                  value={step.cardsText ?? JSON.stringify(step.cards || [], null, 2)}
                  onChange={(event) => {
                    try {
                      const cards = JSON.parse(event.target.value);
                      if (Array.isArray(cards)) setStep(index, { cards, cardsText: undefined });
                    } catch {
                      setStep(index, { cardsText: event.target.value });
                    }
                  }}
                />
              </label>
            ) : null}
          </article>
        ))}
      </div>

      <button className="secondary-action" onClick={addStep}>
        Add question
      </button>
    </section>
  );
}
