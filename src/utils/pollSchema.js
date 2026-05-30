export const POLL_STORAGE_KEY = 'bridge-poll-polls';
export const SESSION_STORAGE_KEY = 'bridge-poll-sessions';

export const createId = (prefix = 'id') =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;

export const createSessionCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export const defaultPoll = {
  id: 'immunity-to-change',
  title: 'Immunity to Change',
  subtitle: 'Change Management - Opening Exercise',
  status: 'ready',
  createdAt: 'builtin',
  updatedAt: 'builtin',
  steps: [
    {
      id: 'col1',
      type: 'input',
      pill: '1 - Goal',
      prompt: "Is there anything in your life you'd like to change?",
      helper: 'Think of one thing you genuinely want to change, personal or professional.',
      placeholder: 'I would like to...',
      samples: ['Exercise more', 'Delegate better', 'Sleep earlier', 'Speak up', 'Stop procrastinating'],
    },
    {
      id: 'pivot',
      type: 'narrate',
      pill: 'Pivot',
      prompt: 'Now imagine the change is not yours.',
      helper:
        'You chose these changes. That matters. Now notice what happens when a change is imposed from the outside.',
    },
    {
      id: 'col2',
      type: 'input',
      pill: '2 - Doing instead',
      prompt: 'What do you do instead?',
      helper: 'Name the behavior that competes with your stated goal.',
      placeholder: 'Instead, I...',
      samples: ['Avoid hard conversations', 'Take on too much', 'Check email late', 'Stay quiet'],
    },
    {
      id: 'col3',
      type: 'input',
      pill: '3 - Protecting',
      prompt: 'What are you also protecting?',
      helper: 'Look for the hidden commitment beneath the behavior.',
      placeholder: 'I may be protecting...',
      samples: ['Being liked', 'Control', 'Certainty', 'Competence', 'Harmony'],
    },
    {
      id: 'col4',
      type: 'input',
      pill: '4 - Assumptions',
      prompt: 'What must be true for this to hold?',
      helper: 'Write the assumption that makes the competing commitment feel necessary.',
      placeholder: 'If I do not..., then...',
      samples: ['People will judge me', 'It will fail', 'I will lose control', 'I will disappoint them'],
    },
    {
      id: 'close',
      type: 'reflect',
      pill: 'Close',
      prompt: 'Make it testable.',
      helper: 'Small experiments beat heroic commitments.',
      cards: [
        { title: 'Start micro', body: 'Choose a test small enough that you will actually run it.' },
        { title: 'Watch the assumption', body: 'Treat the belief as a hypothesis, not a verdict.' },
        { title: 'Learn in public', body: 'Use feedback to update the experiment.' },
        { title: 'Repeat', body: 'Behavior change compounds through short loops.' },
      ],
    },
  ],
};

export const starterPolls = [
  defaultPoll,
  {
    id: 'quick-retro',
    title: 'Quick Retro',
    subtitle: 'Team reflection pulse',
    status: 'draft',
    createdAt: 'builtin',
    updatedAt: 'builtin',
    steps: [
      {
        id: 'worked',
        type: 'input',
        pill: 'Worked',
        prompt: 'What worked well?',
        placeholder: 'One thing that helped...',
        samples: ['Clear goals', 'Fast decisions', 'Better handoffs'],
      },
      {
        id: 'stuck',
        type: 'input',
        pill: 'Stuck',
        prompt: 'Where did we get stuck?',
        placeholder: 'One friction point...',
        samples: ['Too many meetings', 'Late feedback', 'Unclear ownership'],
      },
      {
        id: 'next',
        type: 'input',
        pill: 'Next',
        prompt: 'What should we try next?',
        placeholder: 'One useful experiment...',
        samples: ['Shorter standups', 'Decision log', 'Weekly demo'],
      },
    ],
  },
];

export function normalizePoll(candidate) {
  const now = new Date().toISOString();
  return {
    id: candidate.id || createId('poll'),
    title: candidate.title || 'Untitled poll',
    subtitle: candidate.subtitle || '',
    status: candidate.status || 'draft',
    createdAt: candidate.createdAt || now,
    updatedAt: now,
    steps: candidate.steps.map((step, index) => ({
      id: step.id || createId(`step-${index + 1}`),
      type: step.type || 'input',
      pill: step.pill || `${index + 1}`,
      prompt: step.prompt || step.question || 'Untitled question',
      helper: step.helper || step.sub || '',
      placeholder: step.placeholder || 'Type here...',
      samples: Array.isArray(step.samples) ? step.samples : [],
      cards: Array.isArray(step.cards) ? step.cards : [],
    })),
  };
}

export function validatePoll(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, error: 'Expected a poll object.' };
  }
  if (!Array.isArray(value.steps) || value.steps.length === 0) {
    return { ok: false, error: 'Expected a non-empty steps array.' };
  }
  const invalid = value.steps.find((step) => !['input', 'narrate', 'reflect'].includes(step.type));
  if (invalid) {
    return { ok: false, error: `Unsupported step type "${invalid.type}".` };
  }
  const missingPrompt = value.steps.find((step) => !step.prompt && !step.question);
  if (missingPrompt) {
    return { ok: false, error: 'Every step needs a prompt.' };
  }
  return { ok: true, poll: normalizePoll(value) };
}
