import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { listCafes } from '../services/cafe.service';
import { placeHold, confirmHold } from '../services/booking.service';
import { useToast } from '../store/ToastContext';
import { getCafeReviews } from '../services/review.service';
import { useSocket } from '../hooks/useSocket';

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
  const toast = useToast();

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

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // Real-time held tables tracking
  const [realTimeHeldTableIds, setRealTimeHeldTableIds] = useState(new Set());

  // Listeners for Socket.io events
  const socketListeners = useMemo(() => ({
    'table:held': (data) => {
      setRealTimeHeldTableIds(prev => {
        const next = new Set(prev);
        next.add(data.tableId);
        return next;
      });
    },
    'table:confirmed': (data) => {
      setRealTimeHeldTableIds(prev => {
        const next = new Set(prev);
        next.add(data.tableId);
        return next;
      });
    },
    'table:available': (data) => {
      setRealTimeHeldTableIds(prev => {
        const next = new Set(prev);
        next.delete(data.tableId);
        return next;
      });
      if (selectedTable?.id === data.tableId) {
        toast.success('Your selected table is now available!');
      }
    }
  }), [selectedTable, toast]);

  // Hook up socket
  useSocket(id, socketListeners);

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

    // Fetch reviews
    setReviewsLoading(true);
    getCafeReviews(id)
      .then(setReviews)
      .catch(() => {})
      .finally(() => setReviewsLoading(false));
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
        toast.error('Booking hold expired.');
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

    const todayStr = new Date().toISOString().split('T')[0];
    if (bookingDate === todayStr) {
      const now = new Date();
      const currentHrs = now.getHours();
      const currentMins = now.getMinutes();
      const [startHrs, startMins] = startTime.split(':').map(Number);
      if (startHrs < currentHrs || (startHrs === currentHrs && startMins <= currentMins)) {
        const errorMsg = 'Start time must be in the future for today\'s booking.';
        setFormError(errorMsg);
        toast.error(errorMsg);
        return;
      }
    }

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
      toast.info('Table held! Please confirm within 5 minutes.');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to place hold. Please try again.';
      setFormError(msg);
      toast.error(msg);
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
      const msg = err.response?.data?.error || 'Failed to confirm booking.';
      setFormError(msg);
      toast.error(msg);
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
                    const isRealTimeUnavailable = realTimeHeldTableIds.has(table.id);
                    return (
                      <div
                        key={table.id}
                        onClick={() => {
                          if (isRealTimeUnavailable) {
                            toast.error('This table is currently held or booked by another customer.');
                            return;
                          }
                          setSelectedTable(table);
                        }}
                        style={{
                          padding: '14px',
                          borderRadius: 'var(--radius-md)',
                          border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border-default)'}`,
                          background: isRealTimeUnavailable
                            ? '#f5f5f5'
                            : isSelected
                            ? 'rgba(var(--primary-rgb, 98, 0, 234), 0.05)'
                            : 'var(--surface-primary)',
                          cursor: isRealTimeUnavailable ? 'not-allowed' : 'pointer',
                          opacity: isRealTimeUnavailable ? 0.6 : 1,
                          transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <p style={{ fontWeight: '700', fontSize: '14px', color: isRealTimeUnavailable ? 'var(--text-muted)' : 'var(--text-heading)', margin: '0 0 4px' }}>
                            {table.name}
                          </p>
                          {isRealTimeUnavailable && (
                            <span style={{ fontSize: '10px', background: '#ffe082', color: '#e65100', padding: '2px 6px', borderRadius: 'var(--radius-full)', fontWeight: '700' }}>
                              HELD/BOOKED
                            </span>
                          )}
                        </div>
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

          {/* Reviews Section */}
          <div style={{ marginTop: '40px', paddingTop: '32px', borderTop: '1px solid var(--border-default)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '6px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-heading)', margin: 0 }}>
                Reviews & Ratings
              </h2>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                ★ {cafe.averageRating ? cafe.averageRating.toFixed(1) : '0.0'} ({cafe.totalReviews || 0} reviews)
              </span>
            </div>

            {reviewsLoading ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading reviews…</p>
            ) : reviews.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic', margin: '12px 0 0' }}>
                No reviews yet for this café. Be the first to leave a review after your completed reservation!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                {reviews.map(r => (
                  <div key={r.id} style={{
                    padding: '16px',
                    background: '#fff',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ fontWeight: '700', color: 'var(--text-heading)' }}>
                        {r.customer?.name}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {new Date(r.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </span>
                    </div>
                    <div style={{ color: 'var(--secondary)', fontSize: '14px', fontWeight: 'bold' }}>
                      {'★'.repeat(r.rating) + '☆'.repeat(5 - r.rating)}
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      {r.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default CafeDetailPage;
