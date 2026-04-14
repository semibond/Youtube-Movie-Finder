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
      const { query, maxResults = 50, sortBy = 'relevance' } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }

      // Suppress ytsr internal warnings
      const originalConsoleError = console.error;
      console.error = () => {};
      
      let searchResults;
      try {
        // Fetch more results initially to compensate for filtered out shorts
        searchResults = await ytsr(query, { limit: maxResults * 2 });
      } finally {
        console.error = originalConsoleError;
      }

      const parseDurationToSeconds = (durationStr: string | null): number => {
        if (!durationStr) return 0;
        const parts = durationStr.split(':').map(Number);
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        if (parts.length === 1) return parts[0];
        return 0;
      };

      const parseUploadedAt = (uploadedAt: string | null): number => {
        if (!uploadedAt) return 0;
        const now = Date.now();
        // Match English and Turkish time units
        const match = uploadedAt.match(/(\d+)\s+(second|minute|hour|day|week|month|year|saniye|dakika|saat|gün|hafta|ay|yıl)s?\s+(ago|önce)/i);
        if (!match) return 0;
        
        const amount = parseInt(match[1], 10);
        const unit = match[2].toLowerCase();
        
        const multipliers: Record<string, number> = {
          second: 1000, saniye: 1000,
          minute: 60 * 1000, dakika: 60 * 1000,
          hour: 60 * 60 * 1000, saat: 60 * 60 * 1000,
          day: 24 * 60 * 60 * 1000, gün: 24 * 60 * 60 * 1000,
          week: 7 * 24 * 60 * 60 * 1000, hafta: 7 * 24 * 60 * 60 * 1000,
          month: 30 * 24 * 60 * 60 * 1000, ay: 30 * 24 * 60 * 60 * 1000,
          year: 365 * 24 * 60 * 60 * 1000, yıl: 365 * 24 * 60 * 60 * 1000,
        };
        
        return now - (amount * (multipliers[unit] || 0));
      };

      let videos = searchResults.items
        .filter((item: any) => item.type === 'video')
        .filter((item: any) => parseDurationToSeconds(item.duration) > 65); // Exclude shorts (<= 65 seconds)

      if (sortBy === 'date') {
        videos.sort((a: any, b: any) => {
          const timeA = parseUploadedAt(a.uploadedAt);
          const timeB = parseUploadedAt(b.uploadedAt);
          return timeB - timeA; // Newest first
        });
      }

      videos = videos.slice(0, maxResults);

      const mappedResults = videos.map((v: any) => ({
        id: { videoId: v.id },
        snippet: {
          title: v.title,
          description: v.description || '',
          thumbnails: {
            medium: { url: v.bestThumbnail?.url || v.thumbnails?.[0]?.url || '' }
          },
          channelTitle: v.author?.name || 'Unknown Channel',
          duration: v.duration || '',
          uploadedAt: v.uploadedAt || ''
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
