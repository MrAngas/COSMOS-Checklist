const express = require('express');
const cors = require('cors');
const app = express();

// Allow CORS only from your GitHub Pages site
app.use(cors({
  origin: "https://mrangas.github.io"
}));

app.use(express.json());

/*
  In-memory storage for demo purposes only.
  For production, use a real database!
*/
const sessions = {};
let liveUsers = 0;

// --- Analytics endpoint ---
app.post('/analytics', (req, res) => {
  const { event, sessionId, ts, userAgent, duration } = req.body;

  // Basic analytics logic
  if (!sessionId) {
    return res.status(400).json({ error: "sessionId is required" });
  }

  if (event === 'visit') {
    // Track new session
    sessions[sessionId] = { lastSeen: Date.now(), userAgent };
  } else if (event === 'heartbeat') {
    if (sessions[sessionId]) {
      sessions[sessionId].lastSeen = Date.now();
    } else {
      sessions[sessionId] = { lastSeen: Date.now(), userAgent };
    }
  } else if (event === 'leave') {
    delete sessions[sessionId];
  }

  res.json({ ok: true });
});

// --- Live users endpoint ---
app.get('/live-users', (req, res) => {
  const now = Date.now();
  // Only count sessions active in the last 35 seconds as "live"
  const threshold = 35000;
  let count = 0;
  for (const sid in sessions) {
    if (now - sessions[sid].lastSeen < threshold) {
      count++;
    }
  }
  res.json({ liveUsers: count });
});

// --- Root endpoint (optional) ---
app.get('/', (req, res) => {
  res.send('COSMOS Checklist backend is running.');
});

// --- Start server ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});