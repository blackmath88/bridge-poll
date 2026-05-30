import { defaultPoll } from './pollSchema.js';

export const pollTemplates = [
  {
    name: 'Immunity to Change',
    description: 'Default Kegan-Lahey opening exercise.',
    poll: defaultPoll,
  },
  {
    name: 'Retro: Start / Stop / Continue',
    description: 'Classic three-question team retrospective.',
    poll: {
      title: 'Retro: Start / Stop / Continue',
      subtitle: 'Team improvement retro',
      status: 'ready',
      steps: [
        {
          id: 'start',
          type: 'input',
          pill: 'Start',
          prompt: 'What should we start doing?',
          placeholder: 'One new behavior or practice...',
        },
        {
          id: 'stop',
          type: 'input',
          pill: 'Stop',
          prompt: 'What should we stop doing?',
          placeholder: 'One thing to reduce or remove...',
        },
        {
          id: 'continue',
          type: 'input',
          pill: 'Continue',
          prompt: 'What should we continue doing?',
          placeholder: 'One thing worth keeping...',
        },
      ],
    },
  },
  {
    name: 'NPS + Why',
    description: 'Collect a 0-10 score and a short explanation.',
    poll: {
      title: 'NPS + Why',
      subtitle: 'Satisfaction pulse',
      status: 'ready',
      steps: [
        {
          id: 'score',
          type: 'input',
          pill: 'Score',
          prompt: 'On a scale of 0-10, how likely are you to recommend this?',
          placeholder: 'Enter a number from 0 to 10...',
        },
        {
          id: 'why',
          type: 'input',
          pill: 'Why',
          prompt: 'What is the main reason for your score?',
          placeholder: 'Because...',
        },
      ],
    },
  },
  {
    name: 'Q&A Intake',
    description: 'Gather anonymous questions for a live session.',
    poll: {
      title: 'Q&A Intake',
      subtitle: 'Anonymous audience questions',
      status: 'ready',
      steps: [
        {
          id: 'question',
          type: 'input',
          pill: 'Q&A',
          prompt: 'What question would you like us to discuss?',
          placeholder: 'Ask anything...',
        },
      ],
    },
  },
  {
    name: 'Confidence Pulse',
    description: 'Check confidence before and after a workshop segment.',
    poll: {
      title: 'Confidence Pulse',
      subtitle: 'Before and after confidence check',
      status: 'ready',
      steps: [
        {
          id: 'before',
          type: 'input',
          pill: 'Before',
          prompt: 'How confident do you feel right now?',
          placeholder: 'Low, medium, high, or a short phrase...',
        },
        {
          id: 'blockers',
          type: 'input',
          pill: 'Blockers',
          prompt: 'What would increase your confidence?',
          placeholder: 'One thing that would help...',
        },
        {
          id: 'after',
          type: 'input',
          pill: 'After',
          prompt: 'How confident do you feel now?',
          placeholder: 'What changed?',
        },
      ],
    },
  },
];
