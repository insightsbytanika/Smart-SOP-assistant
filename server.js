import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOPS_FILE = path.join(__dirname, 'sops.json');

// Initialize Gemini AI client using the key from .env
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Initializes the sops.json file if it doesn't exist.
 * This ensures the application has a place to store data.
 */
async function initStorage() {
  try {
    await fs.access(SOPS_FILE);
  } catch {
    await fs.writeFile(SOPS_FILE, JSON.stringify([], null, 2));
    console.log('Created sops.json storage file.');
  }
}

async function startServer() {
  await initStorage();

  const app = express();
  const PORT = 3000;

  app.use(express.json());

  /**
   * API Route: Generate an SOP using Gemini AI.
   * The frontend sends a task, the backend calls Gemini and returns the result.
   * This keeps the API key secure on the server side.
   */
  app.post('/api/generate', async (req, res) => {
    try {
      const { task } = req.body;
      if (!task) {
        return res.status(400).json({ error: 'Task is required' });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-lite',
        contents: `Create a professional, step-by-step Standard Operating Procedure (SOP) for the following task: "${task}". Include a Title, Purpose, Scope, and detailed Steps. Use markdown headers (#, ##) and bullet points.`,
      });

      res.json({ text: response.text });
    } catch (error) {
      console.error('Gemini error:', error);
      res.status(500).json({ error: 'Failed to generate SOP' });
    }
  });

  /**
   * API Route: Get all saved SOPs.
   * Reads the sops.json file and returns the array of SOP objects.
   */
  app.get('/api/sops', async (req, res) => {
    try {
      const data = await fs.readFile(SOPS_FILE, 'utf8');
      res.json(JSON.parse(data));
    } catch (error) {
      console.error('Error reading SOPs:', error);
      res.status(500).json({ error: 'Failed to read SOPs' });
    }
  });

  /**
   * API Route: Save a new SOP.
   * Appends the new SOP to the array in sops.json.
   */
  app.post('/api/sops', async (req, res) => {
    try {
      const newSop = req.body;
      if (!newSop.title || !newSop.content) {
        return res.status(400).json({ error: 'Title and content are required' });
      }

      const data = await fs.readFile(SOPS_FILE, 'utf8');
      const sops = JSON.parse(data);
      
      const sopToSave = {
        id: Date.now().toString(),
        title: newSop.title,
        content: newSop.content,
        createdAt: new Date().toISOString()
      };

      sops.unshift(sopToSave);
      await fs.writeFile(SOPS_FILE, JSON.stringify(sops, null, 2));
      
      res.status(201).json(sopToSave);
    } catch (error) {
      console.error('Error saving SOP:', error);
      res.status(500).json({ error: 'Failed to save SOP' });
    }
  });

  /**
   * API Route: Update an existing SOP.
   * Finds the SOP by ID and overwrites its title and content.
   */
  app.put('/api/sops/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { title, content } = req.body;

      if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
      }

      const data = await fs.readFile(SOPS_FILE, 'utf8');
      let sops = JSON.parse(data);
      
      const index = sops.findIndex(sop => sop.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'SOP not found' });
      }

      sops[index] = {
        ...sops[index],
        title,
        content,
        updatedAt: new Date().toISOString()
      };

      await fs.writeFile(SOPS_FILE, JSON.stringify(sops, null, 2));
      res.json(sops[index]);
    } catch (error) {
      console.error('Error updating SOP:', error);
      res.status(500).json({ error: 'Failed to update SOP' });
    }
  });

  /**
   * API Route: Delete an SOP.
   * Removes an SOP by ID from sops.json.
   */
  app.delete('/api/sops/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const data = await fs.readFile(SOPS_FILE, 'utf8');
      let sops = JSON.parse(data);
      
      sops = sops.filter(sop => sop.id !== id);
      await fs.writeFile(SOPS_FILE, JSON.stringify(sops, null, 2));
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting SOP:', error);
      res.status(500).json({ error: 'Failed to delete SOP' });
    }
  });

  // Vite integration for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart SOP Assistant server running at http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);