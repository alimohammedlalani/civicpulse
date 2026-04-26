import { useState, useEffect, useRef } from 'react'
import { MapPin, Search, Loader2 } from 'lucide-react'
import { T } from '../../styles/tokens'

const MOCK_SUGGESTIONS = [
  { label: 'Banjara Hills, Hyderabad', lat: 17.4156, lng: 78.4347 },
  { label: 'Jubilee Hills, Hyderabad', lat: 17.4326, lng: 78.4071 },
  { label: 'Madhapur, Hyderabad', lat: 17.4483, lng: 78.3915 },
  { label: 'Gachibowli, Hyderabad', lat: 17.4401, lng: 78.3489 },
  { label: 'Kondapur, Hyderabad', lat: 17.4622, lng: 78.3568 },
  { label: 'Hitech City, Hyderabad', lat: 17.4435, lng: 78.3772 },
  { label: 'Kukatpally, Hyderabad', lat: 17.4948, lng: 78.3996 },
  { label: 'Secunderabad, Hyderabad', lat: 17.4399, lng: 78.4983 },
]

export default function LocationSearch({ value, onChange, placeholder = 'Search area or city...', error }) {
  const [query, setQuery] = useState(value || '')
  const [suggestions, setSuggestions] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = async (q) => {
    setQuery(q)
    if (q.length < 3) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    setLoading(true)
    setIsOpen(true)
    
    try {
      // Using OpenStreetMap Nominatim API for 'proper' fetching
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=in&limit=5`)
      const data = await response.json()
      
      const results = data.map(item => ({
        label: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon)
      }))
      
      setSuggestions(results)
    } catch (err) {
      console.error('Location search error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (s) => {
    setQuery(s.label)
    setSuggestions([])
    setIsOpen(false)
    onChange({
      label: s.label,
      coords: { lat: s.lat, lng: s.lng }
    })
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: T.textSecondary, marginBottom: '8px' }}>
        Location
      </label>
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: T.textTertiary }}>
          {loading ? <Loader2 size={18} className="spin" /> : <Search size={18} />}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '12px 12px 12px 40px',
            borderRadius: T.radiusMd,
            border: `1px solid ${error ? T.danger : T.border}`,
            fontSize: '15px',
            outline: 'none',
            backgroundColor: T.white,
            transition: 'border-color 0.2s',
            fontFamily: 'inherit'
          }}
        />
      </div>
      
      {error && <p style={{ color: T.danger, fontSize: '12px', marginTop: '4px' }}>{error}</p>}

      {isOpen && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          backgroundColor: T.white, borderRadius: T.radiusMd, boxShadow: T.shadowLg,
          border: `1px solid ${T.border}`, marginTop: '4px', maxHeight: '240px', overflowY: 'auto'
        }}>
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(s)}
              style={{
                width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px',
                border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left',
                borderBottom: i === suggestions.length - 1 ? 'none' : `1px solid ${T.border}`,
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = T.surface2}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <MapPin size={16} color={T.textTertiary} />
              <span style={{ fontSize: '14px', color: T.textPrimary }}>{s.label}</span>
            </button>
          ))}
        </div>
      )}

      {isOpen && !loading && suggestions.length === 0 && query.length >= 2 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          backgroundColor: T.white, borderRadius: T.radiusMd, boxShadow: T.shadowLg,
          border: `1px solid ${T.border}`, marginTop: '4px', padding: '16px', textAlign: 'center'
        }}>
          <p style={{ fontSize: '14px', color: T.textSecondary }}>No results found for "{query}"</p>
        </div>
      )}
    </div>
  )
}
