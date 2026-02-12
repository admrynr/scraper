'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';

export default function Home() {
  const [apiKey, setApiKey] = useState('');
  const [keyword, setKeyword] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey, keyword, city }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      if (data.error) {
        setError(data.error);
      } else {
        setResults(data);
        generateExcel(data);
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateExcel = (data: any[]) => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");

      // Auto-fit columns
      const maxWidths = data.reduce((acc: any, row: any) => {
        Object.keys(row).forEach(key => {
          const cellValue = row[key] ? String(row[key]) : "";
          acc[key] = Math.max(acc[key] || 0, cellValue.length, key.length);
        });
        return acc;
      }, {});

      worksheet['!cols'] = Object.keys(maxWidths).map(key => ({ wch: maxWidths[key] + 2 }));

      XLSX.writeFile(workbook, `leads_${keyword}_${city}.xlsx`);
    } catch (err) {
      console.error("Error generating Excel:", err);
      setError("Failed to generate Excel file");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-indigo-600 px-6 py-4">
          <h1 className="text-2xl font-bold text-white">Google Maps Scraper</h1>
          <p className="text-indigo-100 text-sm">Minimalist Scraper GUI (Serverless)</p>
        </div>

        <div className="p-6">
          <form onSubmit={handleScrape} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">SerpAPI Key</label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API Key"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Keyword</label>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="e.g. Barbershop"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Jakarta"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading ? 'opacity-75 cursor-not-allowed' : ''
                }`}
            >
              {loading ? 'Scraping...' : 'Start Scrape & Download'}
            </button>
          </form>

          {error && (
            <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {results.length > 0 && (
        <div className="w-full max-w-2xl mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Results ({results.length})</h2>
            <button
              onClick={() => generateExcel(results)}
              className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
            >
              Download Excel Again
            </button>
          </div>

          {results.map((item, index) => (
            <div key={index} className="bg-white shadow rounded-lg p-4 border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{item.address}</p>
              <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                {item.phone && <span>📞 {item.phone}</span>}
                {item.rating && <span>⭐ {item.rating}</span>}
              </div>
              {item.website && (
                <a
                  href={item.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 text-indigo-600 hover:text-indigo-500 block text-sm"
                >
                  Visit Website &rarr;
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
