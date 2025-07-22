import { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import { storage } from '../server/storage.js';
import { insertUserSchema, insertMemorySchema } from '../shared/schema.js';

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Basic routes for the app
app.get('/api/users', async (req, res) => {
  try {
    const users = await storage.getUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/memories', async (req, res) => {
  try {
    const memories = await storage.getMemories();
    res.json(memories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch memories' });
  }
});

app.post('/api/memories', async (req, res) => {
  try {
    const memoryData = insertMemorySchema.parse(req.body);
    const memory = await storage.createMemory(memoryData);
    res.json(memory);
  } catch (error) {
    res.status(400).json({ error: 'Invalid memory data' });
  }
});

let initialized = false;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!initialized) {
    initialized = true;
  }
  
  app(req, res);
}