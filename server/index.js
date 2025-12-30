import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { spawn } from 'child_process';
import axios from 'axios';

// Import routes
import authRoutes from './routes/auth.js';
import sessionRoutes from './routes/sessions.js';
import documentRoutes from './routes/documents.routes.js';
import vesselRoutes from './routes/vessel.routes.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// --- AUTO-START PYTHON FASTAPI SERVICE ---
const startPythonService = () => {
  const pyFile = path.join(__dirname, 'python', 'vesselTracking.py');

  console.log('🚢 Starting Vessel Tracking FastAPI service...');
  const pythonProcess = spawn('python', [pyFile]);

  pythonProcess.stdout.on('data', (data) => {
    console.log(`[FastAPI]: ${data.toString().trim()}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`[FastAPI Error]: ${data.toString().trim()}`);
  });

  pythonProcess.on('close', (code) => {
    console.log(`⚠️ FastAPI service exited with code ${code}`);
  });
};

// ✅ Start FastAPI when Node starts
startPythonService();

// --- EXPRESS SETUP ---
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static folders
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/outputs', express.static(path.join(__dirname, '..', 'outputs')));
app.use('/grouped', express.static(path.join(__dirname, '..', 'grouped')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/vessels', vesselRoutes);

// --- 🔁 PROXY TO FASTAPI (For vessel tracking) ---
app.get('/vessel/:imo', async (req, res) => {
  try {
    const { imo } = req.params;
    const response = await axios.get(`http://127.0.0.1:8001/vessel/${imo}`);
    res.json(response.data);
  } catch (err) {
    console.error('❌ Vessel tracking error:', err.message);
    res.status(500).json({ error: 'Failed to fetch vessel data' });
  }
});

// 404 handler (compatible with Express 5)
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});



// --- START NODE SERVER ---
app.listen(PORT, () => {
  console.log(`🚀 TF_genie API Server running on port ${PORT}`);
  console.log(`📊 Database: ${process.env.DB_DATABASE} on ${process.env.DB_SERVER}`);
  console.log(`🔍 OCR Processing: Enhanced with multi-pass recognition`);
  console.log(`📄 Document Splitting: Enabled by form type`);
  console.log(`💾 Download Manager: Multiple formats available`);
  console.log(`🤖 Automatic Processing: Enabled`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
