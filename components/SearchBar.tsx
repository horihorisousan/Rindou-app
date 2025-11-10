'use client';

import { useState, useEffect, useRef } from 'react';
import { useMenu } from '@/lib/menu-context';

interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  class: string;
}

interface SearchBarProps {
  onLocationSelect: (lat: number, lng: number, name: string) => void;
}

// 緯度経度の入力をパースする関数（コンポーネント外に定義）
const parseCoordinates = (input: string): { lat: number; lng: number } | null => {
  // カンマまたはスペースで区切られた2つの数値を検索
  const patterns = [
    /^\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*$/, // カンマ区切り: 35.6762, 139.6503
    /^\s*(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s*$/, // スペース区切り: 35.6762 139.6503
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);

      // 有効な緯度経度の範囲をチェック
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }
  }

  return null;
};

export default function SearchBar({ onLocationSelect }: SearchBarProps) {
  const { mobileMenuOpen } = useMenu();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Search with debounce
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (searchQuery.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      // まず緯度経度かチェック
      const coords = parseCoordinates(searchQuery);
      if (coords) {
        // 緯度経度が入力された場合は、直接その位置へ移動
        onLocationSelect(coords.lat, coords.lng, `${coords.lat}, ${coords.lng}`);
        setSearchQuery('');
        setShowResults(false);
        setResults([]);
        return;
      }

      // 緯度経度でない場合は、通常の地名検索
      setIsSearching(true);
      try {
        // OpenStreetMap Nominatim API - 日本に限定して検索
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(searchQuery)}` +
          `&format=json` +
          `&countrycodes=jp` + // 日本に限定
          `&limit=5` +
          `&accept-language=ja`, // 日本語優先
          {
            headers: {
              'User-Agent': 'RindouApp/1.0', // Nominatimは User-Agent を要求
            },
          }
        );

        if (response.ok) {
          const data: SearchResult[] = await response.json();
          setResults(data);
          setShowResults(data.length > 0);
        }
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500); // 500msのデバウンス
  }, [searchQuery, onLocationSelect]);

  const handleResultClick = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    onLocationSelect(lat, lng, result.display_name);
    setSearchQuery('');
    setShowResults(false);
    setResults([]);
  };

  // モバイルメニューが開いている時は非表示
  if (mobileMenuOpen) {
    return null;
  }

  return (
    <div
      ref={searchRef}
      style={{
        position: 'absolute',
        top: '74px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        width: '90%',
        maxWidth: '500px',
      }}
    >
      <div style={{ position: 'relative' }}>
        {/* Search Input */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="地名または緯度経度を検索（例: 東京タワー、35.6585,139.7454）"
          style={{
            width: '100%',
            padding: '12px 40px 12px 16px',
            fontSize: '16px',
            border: '2px solid #2d5016',
            borderRadius: '8px',
            backgroundColor: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />

        {/* Search Icon */}
        <div
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#666',
            pointerEvents: 'none',
          }}
        >
          {isSearching ? (
            <span style={{ fontSize: '14px' }}>検索中...</span>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          )}
        </div>

        {/* Search Results */}
        {showResults && results.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              backgroundColor: 'white',
              border: '2px solid #2d5016',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              maxHeight: '300px',
              overflowY: 'auto',
            }}
          >
            {results.map((result) => (
              <div
                key={result.place_id}
                onClick={() => handleResultClick(result)}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #e5e7eb',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0fdf4';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#333',
                    marginBottom: '4px',
                  }}
                >
                  {result.display_name.split(',')[0]}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#666',
                  }}
                >
                  {result.display_name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
