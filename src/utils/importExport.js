import { validatePoll } from './pollSchema.js';

export function parsePollJson(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return { ok: false, error: error.message };
  }

  if (Array.isArray(parsed)) {
    const polls = [];
    for (const item of parsed) {
      const result = validatePoll(item);
      if (!result.ok) return result;
      polls.push(result.poll);
    }
    return { ok: true, polls };
  }

  const result = validatePoll(parsed);
  return result.ok ? { ok: true, polls: [result.poll] } : result;
}

export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
