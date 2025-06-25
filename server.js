const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();

const PORT = process.env.PORT || 3001;
const SESSION_TIMEOUT_MS = 40 * 1000; // 40 seconds for "live" user tracking

app.use(cors());
app.use(express.json());

const sessions = {}; // { sessionId: lastSeenTimestamp }

app.post('/analytics', (req, res) => {
  const event = req.body;
  event.serverTimestamp = new Date().toISOString();

  // Live tracking
  if (event.sessionId) {
    if (event.event === 'visit' || event.event === 'heartbeat') {
      sessions[event.sessionId] = Date.now();
    }
    if (event.event === 'leave') {
      delete sessions[event.sessionId];
    }
  }

  // Logging for later analysis
  fs.appendFile('analytics.log', JSON.stringify(event) + '\n', (err) => {
    if (err) {
      console.error('Failed to log analytics', err);
      return res.status(500).send('error');
    }
    res.send('ok');
  });
});

app.get('/live-users', (req, res) => {
  const now = Date.now();
  // Remove stale sessions
  for (const [sid, lastSeen] of Object.entries(sessions)) {
    if (now - lastSeen > SESSION_TIMEOUT_MS) {
      delete sessions[sid];
    }
  }
  res.json({ liveUsers: Object.keys(sessions).length });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Analytics server running on port ${PORT}`);
});