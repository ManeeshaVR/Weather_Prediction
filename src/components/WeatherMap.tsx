import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Search } from 'lucide-react';

interface WeatherMapProps {
  onLocationSelect: (lat: number, lon: number, locationName: string) => void;
}

export function WeatherMap({ onLocationSelect }: WeatherMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const markerRef = useRef<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!mapRef.current) return;

    // Load Leaflet CSS and JS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      const L = (window as any).L;

      const mapInstance = L.map(mapRef.current).setView([20, 0], 2);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(mapInstance);

      mapInstance.on('click', async (e: any) => {
        const { lat, lng } = e.latlng;

        // Reverse geocode to get location name
        try {
          const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const data = await response.json();
          const locationName = data.display_name || `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;

          // Remove old marker if it exists
          if (markerRef.current) {
            mapInstance.removeLayer(markerRef.current);
          }

          // Add new marker
          const newMarker = L.marker([lat, lng]).addTo(mapInstance);
          markerRef.current = newMarker;

          onLocationSelect(lat, lng, locationName);
        } catch (error) {
          onLocationSelect(lat, lng, `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`);
        }
      });

      setMap(mapInstance);
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(script);
    };
  }, []);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(value);
    }, 500);
  };

  const selectSearchResult = (result: any) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);

    if (map) {
      const L = (window as any).L;
      map.setView([lat, lon], 10);

      // Remove old marker if it exists
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
      }

      // Add new marker
      const newMarker = L.marker([lat, lon]).addTo(map);
      markerRef.current = newMarker;
    }

    onLocationSelect(lat, lon, result.display_name);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
      <div className="relative h-full w-full">
        <div className="absolute top-4 left-4 z-[1000] w-80">
          <div className="bg-white rounded-lg shadow-lg">
            <div className="relative">
              <Search className="absolute left-3 top-3 size-5 text-gray-400" />
              <input
                  type="text"
                  placeholder="Search for a location..."
                  value={searchQuery}
                  onChange={handleSearchInput}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {searchResults.length > 0 && (
                <div className="mt-1 bg-white rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((result, index) => (
                      <button
                          key={index}
                          onClick={() => selectSearchResult(result)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-start gap-2 border-b border-gray-100 last:border-b-0"
                      >
                        <MapPin className="size-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{result.display_name}</span>
                      </button>
                  ))}
                </div>
            )}

            {isSearching && (
                <div className="mt-1 bg-white rounded-lg shadow-lg px-4 py-3">
                  <p className="text-sm text-gray-500">Searching...</p>
                </div>
            )}
          </div>
        </div>

        <div ref={mapRef} className="h-full w-full rounded-lg" />
      </div>
  );
}