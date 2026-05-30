export const API_BASE = import.meta.env.VITE_API_BASE || null;

export async function createRemoteSession() {
  if (!API_BASE) return null;
  const response = await fetch(`${API_BASE}/api/session`, { method: 'POST' });
  if (!response.ok) throw new Error('Could not create remote session.');
  return response.json();
}

export function connectSession({ sessionCode, role, onMessage, onOpen, onClose, onError }) {
  if (!API_BASE || !sessionCode) return null;
  const wsUrl = `${API_BASE.replace(/^http/, 'ws')}/api/session/${sessionCode}/ws?role=${role}`;
  const socket = new WebSocket(wsUrl);
  socket.onmessage = (event) => onMessage(JSON.parse(event.data));
  socket.onopen = onOpen || null;
  socket.onclose = onClose || null;
  socket.onerror = onError || null;
  return socket;
}

export function sendMessage(socket, message) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}
