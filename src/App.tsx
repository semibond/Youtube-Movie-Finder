/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, Download, Youtube, Loader2, AlertCircle } from 'lucide-react';

interface YouTubeResult {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      medium: {
        url: string;
      };
    };
    channelTitle: string;
  };
}

export default function App() {
  const [query, setQuery] = useState('');
  const [maxResults, setMaxResults] = useState(50);
  const [results, setResults] = useState<YouTubeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, maxResults }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search YouTube');
      }

      setResults(data.results || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportToHTML = () => {
    if (results.length === 0) return;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>YouTube Search Results: ${query}</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; background-color: #f9fafb; color: #111827; }
        h1 { color: #ef4444; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; }
        .result-item { display: flex; gap: 1rem; margin-bottom: 1.5rem; padding: 1rem; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .thumbnail { width: 160px; height: 90px; object-fit: cover; border-radius: 4px; }
        .content { flex: 1; }
        .title { margin: 0 0 0.5rem 0; font-size: 1.125rem; }
        .title a { color: #2563eb; text-decoration: none; }
        .title a:hover { text-decoration: underline; }
        .channel { color: #4b5563; font-size: 0.875rem; margin-bottom: 0.5rem; }
        .description { color: #6b7280; font-size: 0.875rem; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .meta { margin-top: 2rem; color: #6b7280; font-size: 0.875rem; text-align: center; }
    </style>
</head>
<body>
    <h1>YouTube Results: "${query}"</h1>
    <p>Found ${results.length} videos.</p>
    
    <div class="results-list">
        ${results.map(item => `
        <div class="result-item">
            <img class="thumbnail" src="${item.snippet.thumbnails?.medium?.url || ''}" alt="Thumbnail">
            <div class="content">
                <h3 class="title">
                    <a href="https://www.youtube.com/watch?v=${item.id.videoId}" target="_blank" rel="noopener noreferrer">
                        ${item.snippet.title}
                    </a>
                </h3>
                <div class="channel">${item.snippet.channelTitle}</div>
                <p class="description">${item.snippet.description}</p>
            </div>
        </div>
        `).join('')}
    </div>

    <div class="meta">
        Exported on ${new Date().toLocaleString()}
    </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `youtube-results-${query.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Youtube className="w-8 h-8 text-red-600" />
            <h1 className="text-xl font-bold tracking-tight">YouTube Movie Finder</h1>
          </div>
          {results.length > 0 && (
            <button
              onClick={exportToHTML}
              className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Export to HTML
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for movies, TV series..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                required
              />
            </div>
            <div className="sm:w-48">
              <select
                value={maxResults}
                onChange={(e) => setMaxResults(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none bg-white"
              >
                <option value={50}>50 Results</option>
                <option value={100}>100 Results</option>
                <option value={150}>150 Results</option>
                <option value={200}>200 Results</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="bg-red-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-red-700 focus:ring-4 focus:ring-red-500/20 transition-all disabled:opacity-50 flex items-center justify-center min-w-[120px]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
            </button>
          </form>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start gap-3 mb-8">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium">Error</h3>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {!loading && results.length === 0 && !error && query && (
          <div className="text-center py-12 text-gray-500">
            No results found. Try a different search term.
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Found {results.length} videos
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((item, index) => (
                <a
                  key={`${item.id.videoId}-${index}`}
                  href={`https://www.youtube.com/watch?v=${item.id.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-md transition-all"
                >
                  <div className="relative aspect-video overflow-hidden bg-gray-100">
                    {item.snippet.thumbnails?.medium?.url ? (
                      <img
                        src={item.snippet.thumbnails.medium.url}
                        alt={item.snippet.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No thumbnail
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1 group-hover:text-red-600 transition-colors" dangerouslySetInnerHTML={{ __html: item.snippet.title }} />
                    <p className="text-sm text-gray-500 mb-3">{item.snippet.channelTitle}</p>
                    <p className="text-sm text-gray-600 line-clamp-2 mt-auto" dangerouslySetInnerHTML={{ __html: item.snippet.description }} />
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
