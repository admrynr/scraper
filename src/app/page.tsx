'use client';

import { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
} | null;

export default function Home() {
  const [apiKey, setApiKey] = useState('');
  const [keyword, setKeyword] = useState('');

  // Location States (Names for API)
  const [provinceName, setProvinceName] = useState('');
  const [cityName, setCityName] = useState('');
  const [districtName, setDistrictName] = useState('');
  const [villageName, setVillageName] = useState('');

  // Location Options & IDs (From Emsifa API)
  const [provinces, setProvinces] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);

  const [selectedProvinceId, setSelectedProvinceId] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedVillageId, setSelectedVillageId] = useState('');

  const [waTemplate, setWaTemplate] = useState('Halo {name}, perkenalkan kami dari ...');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // New states for formatting & filtering
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [filterWebsite, setFilterWebsite] = useState(false);
  const [filterPhone, setFilterPhone] = useState(false);

  // Load saved states on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('scraperApiKey');
    if (savedKey) setApiKey(savedKey);

    const savedTemplate = localStorage.getItem('scraperWaTemplate');
    if (savedTemplate) setWaTemplate(savedTemplate);

    const savedResults = localStorage.getItem('scraperResults');
    if (savedResults) {
      try {
        setResults(JSON.parse(savedResults));
      } catch (e) {
        console.error("Failed to parse saved results");
      }
    }
  }, []);

  // Fetch Provinces on load
  useEffect(() => {
    fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
      .then(res => res.json())
      .then(data => setProvinces(data))
      .catch(console.error);
  }, []);

  // Fetch Cities when Province changes
  useEffect(() => {
    if (!selectedProvinceId) {
      setCities([]); setSelectedCityId(''); setCityName('');
      setDistricts([]); setSelectedDistrictId(''); setDistrictName('');
      setVillages([]); setSelectedVillageId(''); setVillageName('');
      return;
    }
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${selectedProvinceId}.json`)
      .then(res => res.json())
      .then(data => setCities(data))
      .catch(console.error);
  }, [selectedProvinceId]);

  // Fetch Districts when City changes
  useEffect(() => {
    if (!selectedCityId) {
      setDistricts([]); setSelectedDistrictId(''); setDistrictName('');
      setVillages([]); setSelectedVillageId(''); setVillageName('');
      return;
    }
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${selectedCityId}.json`)
      .then(res => res.json())
      .then(data => setDistricts(data))
      .catch(console.error);
  }, [selectedCityId]);

  // Fetch Villages when District changes
  useEffect(() => {
    if (!selectedDistrictId) {
      setVillages([]); setSelectedVillageId(''); setVillageName('');
      return;
    }
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${selectedDistrictId}.json`)
      .then(res => res.json())
      .then(data => setVillages(data))
      .catch(console.error);
  }, [selectedDistrictId]);

  // Save API Key when it changes
  useEffect(() => {
    if (apiKey) localStorage.setItem('scraperApiKey', apiKey);
  }, [apiKey]);

  // Save WA Template when it changes
  useEffect(() => {
    if (waTemplate) localStorage.setItem('scraperWaTemplate', waTemplate);
  }, [waTemplate]);

  // Reset page when filters or sorting change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterWebsite, filterPhone, sortConfig]);

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults([]);
    setCurrentPage(1);

    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey,
          keyword,
          city: cityName,
          district: districtName,
          village: villageName,
          province: provinceName
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      if (data.error) {
        setError(data.error);
      } else {
        setResults(data);
        localStorage.setItem('scraperResults', JSON.stringify(data));
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const processedResults = useMemo(() => {
    let filteredData = [...results];

    if (filterWebsite) {
      filteredData = filteredData.filter(item => item.website);
    }
    if (filterPhone) {
      filteredData = filteredData.filter(item => item.phone);
    }

    if (sortConfig !== null) {
      filteredData.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle numeric sorting for rating/reviews
        if (sortConfig.key === 'rating') {
          const reviewsA = Number(a.reviews) || 0;
          const reviewsB = Number(b.reviews) || 0;
          if (reviewsA !== reviewsB) {
            return sortConfig.direction === 'asc' ? reviewsA - reviewsB : reviewsB - reviewsA;
          }
          const ratingA = Number(a.rating) || 0;
          const ratingB = Number(b.rating) || 0;
          return sortConfig.direction === 'asc' ? ratingA - ratingB : ratingB - ratingA;
        } else if (sortConfig.key === 'reviews') {
          const reviewsA = Number(a.reviews) || 0;
          const reviewsB = Number(b.reviews) || 0;
          return sortConfig.direction === 'asc' ? reviewsA - reviewsB : reviewsB - reviewsA;
        } else {
          aValue = aValue ? String(aValue).toLowerCase() : '';
          bValue = bValue ? String(bValue).toLowerCase() : '';
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filteredData;
  }, [results, sortConfig, filterWebsite, filterPhone]);

  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedResults.slice(startIndex, startIndex + itemsPerPage);
  }, [processedResults, currentPage]);

  const totalPages = Math.ceil(processedResults.length / itemsPerPage);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === 'asc'
    ) {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const generateExcel = (data: any[]) => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");

      const maxWidths = data.reduce((acc: any, row: any) => {
        Object.keys(row).forEach(key => {
          const cellValue = row[key] ? String(row[key]) : "";
          acc[key] = Math.max(acc[key] || 0, cellValue.length, key.length);
        });
        return acc;
      }, {});

      worksheet['!cols'] = Object.keys(maxWidths).map(key => ({ wch: maxWidths[key] + 2 }));

      const filenameParts = ['leads', keyword || 'export', cityName || 'data'];
      if (districtName) filenameParts.push(districtName);
      if (villageName) filenameParts.push(villageName);

      const filename = filenameParts.join('_').replace(/\s+/g, '_') + '.xlsx';

      XLSX.writeFile(workbook, filename);
    } catch (err) {
      console.error("Error generating Excel:", err);
      setError("Failed to generate Excel file");
    }
  };

  const formatWhatsAppLink = (phone: string, name: string) => {
    if (!phone) return '#';

    // Clean phone number (remove spaces, -, +, and convert leading 0 to 62)
    let cleanPhone = phone.replace(/[\s\-\+]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('8')) {
      cleanPhone = '62' + cleanPhone;
    }

    // Replace {name} placeholder in template
    const text = waTemplate.replace(/{name}/g, name);
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  const clearResults = () => {
    setResults([]);
    localStorage.removeItem('scraperResults');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-indigo-600 px-6 py-4">
          <h1 className="text-2xl font-bold text-white">Google Maps Scraper CRM</h1>
          <p className="text-indigo-100 text-sm">Serverless Leads Extractor & Prospecting Tool</p>
        </div>

        <div className="p-6">
          <form onSubmit={handleScrape} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">SerpAPI Key (Auto-saved)</label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API Key"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Keyword <span className="text-gray-400 text-xs font-normal">(Pisahkan dengan koma untuk multi-keyword)</span></label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g. Barbershop, Cafe"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Provinsi (Province) *</label>
                <select
                  value={selectedProvinceId}
                  onChange={(e) => {
                    setSelectedProvinceId(e.target.value);
                    setProvinceName(e.target.options[e.target.selectedIndex].text);
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white"
                  required
                >
                  <option value="">-- Pilih Provinsi --</option>
                  {provinces.map((prov) => (
                    <option key={prov.id} value={prov.id}>{prov.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Kota/Kabupaten (City) *</label>
                <select
                  value={selectedCityId}
                  onChange={(e) => {
                    setSelectedCityId(e.target.value);
                    setCityName(e.target.options[e.target.selectedIndex].text);
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white"
                  disabled={!selectedProvinceId}
                  required
                >
                  <option value="">-- Pilih Kota/Kabupaten --</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>{city.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Kecamatan (District) <span className="text-gray-400 text-xs">(Optional)</span></label>
                <select
                  value={selectedDistrictId}
                  onChange={(e) => {
                    setSelectedDistrictId(e.target.value);
                    setDistrictName(e.target.options[e.target.selectedIndex].text);
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white"
                  disabled={!selectedCityId}
                >
                  <option value="">-- Pilih Kecamatan --</option>
                  {districts.map((dist) => (
                    <option key={dist.id} value={dist.id}>{dist.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Kelurahan (Village) <span className="text-gray-400 text-xs">(Optional)</span></label>
                <select
                  value={selectedVillageId}
                  onChange={(e) => {
                    setSelectedVillageId(e.target.value);
                    setVillageName(e.target.options[e.target.selectedIndex].text);
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white"
                  disabled={!selectedDistrictId}
                >
                  <option value="">-- Pilih Kelurahan --</option>
                  {villages.map((vill) => (
                    <option key={vill.id} value={vill.id}>{vill.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading ? 'opacity-75 cursor-not-allowed' : ''
                }`}
            >
              {loading ? 'Scraping...' : 'Start Scrape & Save to LocalStorage'}
            </button>
          </form>

          {error && (
            <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {results.length > 0 && (
        <div className="w-full max-w-6xl mt-6">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col">
            <div className="bg-gray-100 px-6 py-4 flex flex-col items-start sm:flex-row justify-between sm:items-center gap-4 border-b border-gray-200">
              <div className="flex flex-col gap-2">
                <h2 className="text-xl font-semibold text-gray-800">
                  Extracted Leads ({processedResults.length} / {results.length})
                </h2>
                <div className="flex items-center gap-4 text-sm text-gray-700">
                  <label className="flex items-center gap-2 cursor-pointer border border-gray-300 px-3 py-1.5 rounded-md hover:bg-gray-50 transition">
                    <input type="checkbox" checked={filterWebsite} onChange={(e) => setFilterWebsite(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                    Has Website
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer border border-gray-300 px-3 py-1.5 rounded-md hover:bg-gray-50 transition">
                    <input type="checkbox" checked={filterPhone} onChange={(e) => setFilterPhone(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                    Has Phone (WA)
                  </label>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => generateExcel(processedResults)}
                  className="text-sm bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
                >
                  Download Filtered Excel
                </button>
                <button
                  onClick={clearResults}
                  className="text-sm border border-red-200 text-red-600 px-4 py-2 rounded-md hover:bg-red-50 transition"
                >
                  Clear Results
                </button>
              </div>
            </div>

            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Template (Use {'{name}'} for dynamic name insertion)</label>
              <textarea
                value={waTemplate}
                onChange={(e) => setWaTemplate(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 border"
                rows={2}
              />
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => requestSort('name')}>
                      Business Name {sortConfig?.key === 'name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => requestSort('rating')}>
                      Rating / Reviews {sortConfig?.key === 'rating' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-200" onClick={() => requestSort('address')}>
                      Address {sortConfig?.key === 'address' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedResults.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        {item.website && (
                          <a href={item.website} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline">
                            Website
                          </a>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.rating ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              ⭐ {item.rating}
                            </span>
                          ) : <span className="text-gray-400">-</span>}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 cursor-pointer hover:text-indigo-600" onClick={(e) => { e.stopPropagation(); requestSort('reviews'); }}>
                          {item.reviews ? `${item.reviews} reviews ${sortConfig?.key === 'reviews' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}` : 'No reviews'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 max-w-xs truncate" title={item.address}>{item.address}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {item.phone ? (
                          <a
                            href={formatWhatsAppLink(item.phone, item.name)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            Chat WA ({item.phone})
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">No Phone</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6 flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Previous</button>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Next</button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, processedResults.length)}</span> of <span className="font-medium">{processedResults.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">Previous</button>
                      <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">Page {currentPage} of {totalPages}</span>
                      <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">Next</button>
                    </nav>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
