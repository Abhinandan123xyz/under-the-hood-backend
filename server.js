// Simple contest backend (sample)
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const DATA_DIR = __dirname;
const PROBLEMS_FILE = path.join(DATA_DIR, 'problems.json');
const PROGRESS_FILE = path.join(DATA_DIR, 'progress.json');
const FILES_DIR = path.join(DATA_DIR, 'files');

function loadJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file,'utf8')); } catch(e) { return fallback; }
}
function saveJson(file, obj) { fs.writeFileSync(file, JSON.stringify(obj, null, 2)); }

let problems = loadJson(PROBLEMS_FILE, []);
let progress = loadJson(PROGRESS_FILE, {});

function hashFlag(s) { return crypto.createHash('sha256').update(s).digest('hex'); }

app.get('/api/progress', (req, res) => {
  const team = req.query.team || 'anon';
  if (!progress[team]) {
    progress[team] = { currentIndex: 0, solved: [], lastUpdated: Date.now() };
    saveJson(PROGRESS_FILE, progress);
  }
  const probs = problems.map(p => ({ id: p.id, title: p.title, description: p.description, files: p.files || [] }));
  res.json({ problems: probs, currentIndex: progress[team].currentIndex });
});

app.post('/api/submit', (req, res) => {
  const { team, problemId, flag } = req.body;
  if (!team || !problemId || !flag) return res.status(400).json({ ok:false, message:'Missing fields' });

  const p = problems.find(x => x.id === problemId);
  if (!p) return res.status(400).json({ ok:false, message:'Problem not found' });

  if (!progress[team]) progress[team] = { currentIndex: 0, solved: [], lastUpdated: Date.now() };

  if (progress[team].currentIndex >= problems.length) return res.status(400).json({ ok:false, message:'All problems solved' });
  if (problems[progress[team].currentIndex].id !== problemId) return res.status(403).json({ ok:false, message:'This problem is not unlocked yet' });

  const submittedHash = hashFlag(flag.trim());
  if (submittedHash === p.flagHash) {
    progress[team].solved.push(problemId);
    progress[team].currentIndex = Math.min(progress[team].currentIndex + 1, problems.length);
    progress[team].lastUpdated = Date.now();
    saveJson(PROGRESS_FILE, progress);
    return res.json({ ok:true, currentIndex: progress[team].currentIndex, message:'Correct' });
  } else {
    return res.status(400).json({ ok:false, message:'Incorrect flag' });
  }
});

app.use('/files', express.static(FILES_DIR));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log('Server listening on', PORT));
