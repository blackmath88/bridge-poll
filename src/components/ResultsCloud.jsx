const colors = ['#E8175D', '#D4940A', '#1A8A7D', '#6B3FA0', '#C45D20', '#30B880', '#0071E3'];

function hashText(text) {
  return [...text].reduce((total, char) => total + char.charCodeAt(0), 0);
}

export default function ResultsCloud({ responses }) {
  if (!responses.length) {
    return <div className="empty-cloud">Waiting for responses...</div>;
  }

  const counts = responses.reduce((acc, text) => {
    const key = text.trim().toLowerCase();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="cloud">
      {responses.map((text, index) => {
        const hash = hashText(`${text}-${index}`);
        const count = counts[text.trim().toLowerCase()] || 1;
        return (
          <span
            className="cloud-word"
            key={`${text}-${index}`}
            style={{
              color: colors[hash % colors.length],
              fontSize: `${Math.min(16 + count * 5 + (hash % 11), 42)}px`,
              left: `${8 + (hash % 72)}%`,
              top: `${8 + ((hash * 7) % 76)}%`,
            }}
          >
            {text}
          </span>
        );
      })}
    </div>
  );
}
