import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import ytsr from 'ytsr';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.post('/api/search', async (req, res) => {
    try {
      const { query, maxResults = 50 } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }

      // Suppress ytsr internal warnings
      const originalConsoleError = console.error;
      console.error = () => {};
      
      let searchResults;
      try {
        searchResults = await ytsr(query, { limit: maxResults });
      } finally {
        console.error = originalConsoleError;
      }

      const videos = searchResults.items.filter((item: any) => item.type === 'video');

      const mappedResults = videos.map((v: any) => ({
        id: { videoId: v.id },
        snippet: {
          title: v.title,
          description: v.description || '',
          thumbnails: {
            medium: { url: v.bestThumbnail?.url || v.thumbnails?.[0]?.url || '' }
          },
          channelTitle: v.author?.name || 'Unknown Channel'
        }
      }));

      res.json({ results: mappedResults });
    } catch (error: any) {
      console.error('Search error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
