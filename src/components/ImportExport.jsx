import { useState } from 'react';
import { downloadJson, parsePollJson } from '../utils/importExport.js';

export default function ImportExport({ polls, onImport }) {
  const [text, setText] = useState('');
  const [message, setMessage] = useState('Paste JSON or choose a file.');

  const importText = (value) => {
    const result = parsePollJson(value);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    onImport(result.polls);
    setText('');
    setMessage(`Imported ${result.polls.length} poll${result.polls.length === 1 ? '' : 's'}.`);
  };

  const readFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    importText(await file.text());
    event.target.value = '';
  };

  return (
    <section className="panel import-panel">
      <div className="panel-head">
        <div>
          <h2>Import / Export</h2>
          <p>{message}</p>
        </div>
        <button onClick={() => downloadJson('bridge-polls.json', polls)}>Export all</button>
      </div>
      <textarea
        className="json-box"
        value={text}
        placeholder='{"title":"Team pulse","steps":[...]}'
        onChange={(event) => setText(event.target.value)}
      />
      <div className="inline-actions">
        <button onClick={() => importText(text)} disabled={!text.trim()}>
          Import JSON
        </button>
        <label className="file-button">
          Upload file
          <input type="file" accept="application/json,.json" onChange={readFile} />
        </label>
      </div>
    </section>
  );
}
