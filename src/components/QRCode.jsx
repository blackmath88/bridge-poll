import { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

export default function QRCode({ value, label, canDownload = false, filename = 'bridge-poll-qr.png' }) {
  const canvasRef = useRef(null);

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const anchor = document.createElement('a');
    anchor.href = canvas.toDataURL('image/png');
    anchor.download = filename;
    anchor.click();
  };

  return (
    <div className="qr-block">
      <QRCodeCanvas
        ref={canvasRef}
        value={value}
        size={180}
        marginSize={2}
        fgColor="#1A1A1A"
        bgColor="#FFFFFF"
      />
      {label ? <div className="qr-label">{label}</div> : null}
      {canDownload ? (
        <button className="qr-download" onClick={downloadPng}>
          Download QR
        </button>
      ) : null}
    </div>
  );
}
