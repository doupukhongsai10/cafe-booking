import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { listCafes } from '../services/cafe.service';
import { placeHold, confirmHold } from '../services/booking.service';

const ZONE_LABELS = { INDOOR: 'Indoor', OUTDOOR: 'Outdoor', ROOFTOP: 'Rooftop', PRIVATE: 'Private' };
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function pad(n) { return String(n).padStart(2, '0'); }

function formatCountdown(ms) {
  if (ms <= 0) return '0:00';
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${pad(s)}`;
}

function CafeDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [cafe, setCafe] = useState(null);
  const [loading, setLoading] = useState(true);

  // Booking form state
  const [selectedTable, setSelectedTable] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [partySize, setPartySize] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Hold state
  const [hold, setHold] = useState(null); // booking object
  const [countdown, setCountdown] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    // We use listCafes (which is already built) to get cafe with tables included
    listCafes()
      .then(cafes => {
        const found = cafes.find(c => c.id === id);
        if (!found) navigate('/cafes');
        else setCafe(found);
      })
      .catch(() => navigate('/cafes'))
      .finally(() => setLoading(false));
  }, [id]);

  // Countdown ticker
  useEffect(() => {
    if (!hold) return;
    const expiresAt = new Date(hold.holdExpiresAt).getTime();

    timerRef.current = setInterval(() => {
      const remaining = expiresAt - Date.now();
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        setHold(null);
        setFormError('Your hold has expired. Please try again.');
      }
    }, 500);

    return () => clearInterval(timerRef.current);
  }, [hold]);

  async function handlePlaceHold(e) {
    e.preventDefault();
    setFormError('');
    if (!selectedTable) { setFormError('Please select a table.'); return; }
    if (!bookingDate) { setFormError('Please pick a date.'); return; }
    if (!startTime || !endTime) { setFormError('Please fill in start and end times.'); return; }
    if (startTime >= endTime) { setFormError('Start time must be before end time.'); return; }

    try {
      setSubmitting(true);
      const booking = await placeHold({
        tableId: selectedTable.id,
        bookingDate: new Date(bookingDate).toISOString(),
        startTime,
        endTime,
        partySize: Number(partySize),
      }, token);
      setHold(booking);
      setCountdown(new Date(booking.holdExpiresAt).getTime() - Date.now());
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to place hold. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirm() {
    if (!hold) return;
    try {
      setConfirming(true);
      await confirmHold(hold.id, token);
      clearInterval(timerRef.current);
      navigate('/', { state: { confirmed: true } });
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to confirm booking.');
      setConfirming(false);
    }
  }

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading café…</p>
      </main>
    );
  }

  if (!cafe) return null;

  const todayDay = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
  const todayHours = cafe.operatingHours?.[todayDay];

  // Minimum date = today
  const todayStr = new Date().toISOString().split('T')[0];

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
          onClick={() => navigate('/cafes')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: '600', fontSize: '14px' }}
        >
          ← Cafés
        </button>
        <span style={{ fontWeight: '700', fontSize: '17px', color: 'var(--text-heading)' }}>{cafe.name}</span>
        <span style={{ width: 60 }} />
      </header>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 0 40px' }}>
        {/* Cover */}
        {cafe.coverPhotoUrl && (
          <div style={{ height: '240px', overflow: 'hidden', background: '#e0e0e0' }}>
            <img src={cafe.coverPhotoUrl} alt={cafe.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        <div style={{ padding: '24px 20px' }}>
          {/* Info */}
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-heading)', margin: '0 0 4px' }}>{cafe.name}</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0 0 12px', fontSize: '14px' }}>📍 {cafe.area}, {cafe.city}</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', marginBottom: '16px' }}>{cafe.description}</p>

          {/* Today hours */}
          <div style={{ background: 'var(--surface-secondary)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: '28px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            🕐 {todayHours && !todayHours.closed
              ? `Open today: ${todayHours.open} – ${todayHours.close}`
              : 'Closed today'}
          </div>

          {/* Hold Confirmation View */}
          {hold ? (
            <div style={{
              background: countdown > 60000 ? '#e8f5e9' : '#fff8e1',
              border: `1.5px solid ${countdown > 60000 ? '#a5d6a7' : '#ffe082'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '28px',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', letterSpacing: '0.05em' }}>
                TABLE HELD
              </p>
              <p style={{ fontSize: '44px', fontWeight: '800', color: countdown > 60000 ? '#1b5e20' : '#e65100', margin: '0 0 6px', letterSpacing: '-1px' }}>
                {formatCountdown(countdown)}
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                Confirm within this window or your hold will expire
              </p>

              <div style={{ background: '#fff', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '20px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <span>🏷️ <strong>{cafe.name}</strong></span>
                  <span>🪑 {selectedTable?.name} · {ZONE_LABELS[selectedTable?.zone] || selectedTable?.zone}</span>
                  <span>📅 {new Date(bookingDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                  <span>⏰ {startTime} – {endTime}</span>
                  <span>👥 Party of {partySize}</span>
                </div>
              </div>

              {formError && <p style={{ color: 'var(--status-error)', fontSize: '13px', marginBottom: '12px' }}>{formError}</p>}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  onClick={() => { clearInterval(timerRef.current); setHold(null); setFormError(''); }}
                  style={{ padding: '10px 20px', border: '1px solid var(--border-default)', background: 'transparent', borderRadius: 'var(--radius-md)', fontWeight: '600', fontSize: '14px', cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                  Cancel Hold
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={confirming || countdown <= 0}
                  style={{ padding: '10px 24px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
                >
                  {confirming ? 'Confirming…' : 'Confirm Reservation ✓'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Table Selection */}
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '14px' }}>Choose a Table</h2>
              {cafe.tables?.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No tables available at this café.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '28px' }}>
                  {(cafe.tables || []).map(table => {
                    const isSelected = selectedTable?.id === table.id;
                    return (
                      <div
                        key={table.id}
                        onClick={() => setSelectedTable(table)}
                        style={{
                          padding: '14px',
                          borderRadius: 'var(--radius-md)',
                          border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border-default)'}`,
                          background: isSelected ? 'rgba(var(--primary-rgb, 98, 0, 234), 0.05)' : 'var(--surface-primary)',
                          cursor: 'pointer',
                          transition: 'border-color 0.15s',
                        }}
                      >
                        <p style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-heading)', margin: '0 0 4px' }}>{table.name}</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                          {ZONE_LABELS[table.zone] || table.zone} · Up to {table.capacity} guests
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Booking Form */}
              {selectedTable && (
                <form onSubmit={handlePlaceHold} style={{ background: 'var(--surface-primary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-heading)', margin: 0 }}>
                    Book {selectedTable.name}
                  </h2>

                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Date</label>
                    <input
                      type="date"
                      min={todayStr}
                      value={bookingDate}
                      onChange={e => setBookingDate(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Start Time</label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={e => setStartTime(e.target.value)}
                        required
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', fontSize: '14px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>End Time</label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={e => setEndTime(e.target.value)}
                        required
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', fontSize: '14px', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                      Party Size (max {selectedTable.capacity})
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={selectedTable.capacity}
                      value={partySize}
                      onChange={e => setPartySize(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>

                  {formError && (
                    <p style={{ color: 'var(--status-error)', fontSize: '13px', margin: 0 }}>{formError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    style={{ padding: '12px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: '700', fontSize: '15px', cursor: 'pointer' }}
                  >
                    {submitting ? 'Placing Hold…' : 'Place 5-Minute Hold'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default CafeDetailPage;
