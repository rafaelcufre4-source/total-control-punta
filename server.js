const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.static(__dirname));

const DB_FILE = path.join(__dirname, 'tcp_cloud_db.json');

let cloudDB = {
  telemetria: { combustible: 85, bateria: 12.6, uteOk: true, updatedAt: null },
  appState: null
};

if (fs.existsSync(DB_FILE)) {
  try {
    cloudDB = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (err) {
    console.error('Error leyendo DB inicial:', err);
  }
}

function saveCloudDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(cloudDB, null, 2), 'utf8');
  } catch (err) {
    console.error('Error guardando DB:', err);
  }
}

app.get('/api/estado', (req, res) => {
  res.json(cloudDB.telemetria);
});

app.post('/api/telemetria', (req, res) => {
  cloudDB.telemetria = {
    ...cloudDB.telemetria,
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  saveCloudDB();
  res.sendStatus(200);
});

app.get('/api/state', (req, res) => {
  res.json({
    ok: true,
    telemetria: cloudDB.telemetria,
    appState: cloudDB.appState
  });
});

app.post('/api/state', (req, res) => {
  if (req.body && req.body.appState) {
    cloudDB.appState = req.body.appState;
    saveCloudDB();
    return res.json({ ok: true, savedAt: new Date().toISOString() });
  }
  res.status(400).json({ ok: false, error: 'Datos inválidos' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Total Control Punta Cloud activo en puerto ${PORT}`);
});
