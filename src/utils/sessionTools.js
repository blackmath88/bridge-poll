export function buildJoinUrl(sessionCode) {
  return `${window.location.origin}/join/${sessionCode}`;
}

export function buildPresenterUrl(sessionCode) {
  return `${window.location.origin}/present/${sessionCode}`;
}

export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadBlob(filename, blob);
}

export function escapeCsv(value) {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  downloadBlob(filename, blob);
}

export function exportSessionToCsv(session) {
  const steps = session.poll?.steps || [];
  const prompts = new Map(steps.map((step) => [step.id, step.prompt]));
  const rows = [['sessionCode', 'pollTitle', 'stepId', 'stepPrompt', 'response']];

  for (const [stepId, responses] of Object.entries(session.responses || {})) {
    for (const response of responses || []) {
      rows.push([session.code, session.pollTitle || session.poll?.title || '', stepId, prompts.get(stepId) || '', response]);
    }
  }

  downloadCsv(`bridge-poll-session-${session.code}.csv`, rows);
}

export async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();

  try {
    document.execCommand('copy');
  } finally {
    document.body.removeChild(textarea);
  }
}

export function openInNewTab(url) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
