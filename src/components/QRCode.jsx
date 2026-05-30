import { QRCodeSVG } from 'qrcode.react';

export default function QRCode({ value, label }) {
  return (
    <div className="qr-block">
      <QRCodeSVG value={value} size={180} marginSize={2} fgColor="#1A1A1A" bgColor="#FFFFFF" />
      {label ? <div className="qr-label">{label}</div> : null}
    </div>
  );
}
