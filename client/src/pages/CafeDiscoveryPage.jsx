import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { listCafes } from '../services/cafe.service';

const ZONE_LABELS = { INDOOR: 'Indoor', OUTDOOR: 'Outdoor', ROOFTOP: 'Rooftop', PRIVATE: 'Private' };

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function getTodayHours(operatingHours) {
  const day = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
  const h = operatingHours?.[day];
  if (!h || h.closed) return 'Closed today';
  return `Today: ${h.open} – ${h.close}`;
}

function CafeDiscoveryPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [cafes, setCafes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    listCafes()
      .then(setCafes)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = cafes.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.city.toLowerCase().includes(search.toLowerCase()) ||
    c.area.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-base)', paddingBottom: '60px' }}>
      {/* Header */}
      <header style={{
        padding: '18px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-default)',
        background: 'var(--surface-primary)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: '600', fontSize: '14px' }}
        >
          ← Back
        </button>
        <span style={{ fontWeight: '700', fontSize: '17px', color: 'var(--text-heading)' }}>Discover Cafés</span>
        <span style={{ width: 60 }} />
      </header>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '28px 20px' }}>
        {/* Search */}
        <input
          type="text"
          placeholder="Search by name, city, or area…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
            fontSize: '15px',
            marginBottom: '28px',
            boxSizing: 'border-box',
            outline: 'none',
            background: 'var(--surface-primary)',
            color: 'var(--text-heading)',
          }}
        />

        {loading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Loading cafés…</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>No cafés found matching your search.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {filtered.map(cafe => (
              <div
                key={cafe.id}
                onClick={() => navigate(`/cafes/${cafe.id}`)}
                style={{
                  background: 'var(--surface-primary)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-default)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
              >
                {/* Cover photo */}
                <div style={{ height: '160px', overflow: 'hidden', background: '#e8e8e8' }}>
                  {cafe.coverPhotoUrl ? (
                    <img
                      src={cafe.coverPhotoUrl}
                      alt={cafe.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                      No photo
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: '16px' }}>
                  <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '700', color: 'var(--text-heading)' }}>
                    {cafe.name}
                  </h3>
                  <p style={{ margin: '0 0 10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    📍 {cafe.area}, {cafe.city}
                  </p>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {[...new Set((cafe.tables || []).map(t => t.zone))].map(z => (
                      <span key={z} style={{
                        background: 'var(--surface-secondary)',
                        color: 'var(--text-secondary)',
                        fontSize: '11px',
                        fontWeight: '600',
                        padding: '3px 10px',
                        borderRadius: 'var(--radius-full)',
                      }}>
                        {ZONE_LABELS[z] || z}
                      </span>
                    ))}
                  </div>

                  <p style={{ margin: '0 0 14px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    🕐 {getTodayHours(cafe.operatingHours)} · 🪑 {cafe.tables?.length || 0} tables
                  </p>

                  <button
                    style={{
                      width: '100%',
                      padding: '9px',
                      background: 'var(--primary)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: '600',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    Book a Table
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default CafeDiscoveryPage;
