import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { getOwnedCafe } from '../services/cafe.service';
import { getMyBookings, cancelBooking } from '../services/booking.service';
import { useToast } from '../store/ToastContext';
import { submitReview } from '../services/review.service';

function HomePage() {
  const { logout, user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [cafe, setCafe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  // Review modal states
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewBookingId, setReviewBookingId] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');

  async function handleReviewSubmit(e) {
    e.preventDefault();
    setReviewError('');
    setReviewSubmitting(true);
    try {
      const reviewObj = await submitReview({
        bookingId: reviewBookingId,
        rating: Number(rating),
        comment,
      }, token);
      
      setBookings(prev => prev.map(bk => bk.id === reviewBookingId ? { ...bk, review: reviewObj } : bk));
      toast.success('Review submitted successfully!');
      setReviewModalOpen(false);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to submit review.';
      setReviewError(msg);
      toast.error(msg);
    } finally {
      setReviewSubmitting(false);
    }
  }

  // Check for confirmed booking state on redirect
  useEffect(() => {
    if (location.state?.confirmed) {
      toast.success('Reservation confirmed successfully!');
      // Clear location state so the toast doesn't reappear on reload
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, toast, navigate]);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  useEffect(() => {
    if (user?.role === 'CAFE_ADMIN' || user?.role === 'CAFE_STAFF') {
      async function fetchCafe() {
        try {
          setLoading(true);
          setError('');
          const data = await getOwnedCafe(token);
          setCafe(data);
        } catch (err) {
          setError('Failed to fetch café status.');
        } finally {
          setLoading(false);
        }
      }
      fetchCafe();
    }

    if (user?.role === 'CUSTOMER') {
      async function fetchBookings() {
        try {
          setBookingsLoading(true);
          const data = await getMyBookings(token);
          setBookings(data);
        } catch (err) {
          // silently fail — empty list is fine
        } finally {
          setBookingsLoading(false);
        }
      }
      fetchBookings();
    }
  }, [user, token]);

  return (
    <main className="home-page">
      <header className="home-header">
        <span className="brand">CafeReserve</span>
        <button className="button-secondary" type="button" onClick={handleLogout}>Sign out</button>
      </header>

      <section className="home-card" style={{ marginTop: '8vh' }}>
        <p className="eyebrow">WELCOME TO CAFERESERVE</p>
        <h1 style={{ color: 'var(--text-heading)', fontWeight: '600' }}>Hello, {user?.name}.</h1>

        {user?.role === 'SUPER_ADMIN' && (
          <div style={{ marginTop: '24px' }}>
            <p style={{ marginBottom: '20px' }}>You are logged in as a Super Administrator.</p>
            <button
              onClick={() => navigate('/admin/dashboard')}
              style={{
                padding: '12px 24px',
                color: '#fff',
                background: 'var(--primary)',
                border: '0',
                borderRadius: 'var(--radius-md)',
                fontWeight: '600',
                fontSize: '15px'
              }}
            >
              Go to Super Admin Dashboard
            </button>
          </div>
        )}

        {user?.role === 'CUSTOMER' && (
          <div style={{ marginTop: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '6px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-heading)', margin: 0 }}>
                My Reservations
              </h2>
              <button
                onClick={() => navigate('/cafes')}
                style={{
                  padding: '9px 18px',
                  background: 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                + Browse Cafés
              </button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
              View and manage your upcoming and past café reservations.
            </p>

            {bookingsLoading ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading your reservations...</p>
            ) : bookings.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', background: 'var(--surface-secondary)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-default)' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>You have no reservations yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {bookings.map(b => {
                  const STATUS_COLORS = {
                    HELD: { bg: '#fff8e1', color: '#e65100' },
                    CONFIRMED: { bg: '#e8f5e9', color: '#1b5e20' },
                    CANCELLED: { bg: '#fafafa', color: '#999' },
                    NO_SHOW: { bg: '#fce4ec', color: '#880e4f' },
                    COMPLETED: { bg: '#e3f2fd', color: '#0d47a1' },
                  };
                  const sc = STATUS_COLORS[b.status] || { bg: '#f5f5f5', color: '#555' };

                  // Compute whether the cancellation window is still open
                  const [h, m] = b.startTime.split(':').map(Number);
                  const startDt = new Date(b.bookingDate);
                  startDt.setUTCHours(h, m, 0, 0);
                  const canCancel = (b.status === 'CONFIRMED' || b.status === 'HELD') &&
                    (startDt.getTime() - Date.now()) > 20 * 60 * 1000;
                  const windowClosed = (b.status === 'CONFIRMED' || b.status === 'HELD') && !canCancel;

                  async function handleCancel(bookingId) {
                    if (!window.confirm('Are you sure you want to cancel this reservation?')) return;
                    try {
                      setCancellingId(bookingId);
                      const updated = await cancelBooking(bookingId, token);
                      setBookings(prev => prev.map(bk => bk.id === bookingId ? { ...bk, ...updated } : bk));
                      toast.success('Reservation cancelled successfully.');
                    } catch (err) {
                      const msg = err.response?.data?.error || 'Failed to cancel reservation.';
                      toast.error(msg);
                    } finally {
                      setCancellingId(null);
                    }
                  }

                  return (
                    <div key={b.id} style={{
                      background: '#fff',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '18px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <p style={{ fontWeight: '700', color: 'var(--text-heading)', fontSize: '15px', margin: 0 }}>
                            {b.cafe?.name ?? 'Café'}
                          </p>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '2px 0 0' }}>
                            {b.cafe?.area}, {b.cafe?.city}
                          </p>
                        </div>
                        <span style={{ padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '12px', fontWeight: '700', background: sc.bg, color: sc.color }}>
                          {b.status}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '6px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        <span>📅 {new Date(b.bookingDate).toLocaleDateString('en-IN', { dateStyle: 'medium', timeZone: 'UTC' })}</span>
                        <span>⏰ {b.startTime} – {b.endTime}</span>
                        <span>🪑 {b.table?.name} · {b.table?.zone}</span>
                        <span>👥 Party of {b.partySize}</span>
                      </div>

                      {(b.status === 'CONFIRMED' || b.status === 'HELD') && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                          <button
                            disabled={!canCancel || cancellingId === b.id}
                            onClick={() => handleCancel(b.id)}
                            style={{
                              padding: '7px 16px',
                              fontSize: '13px',
                              fontWeight: '600',
                              border: '1px solid var(--status-error)',
                              background: 'transparent',
                              color: canCancel ? 'var(--status-error)' : '#bbb',
                              borderColor: canCancel ? 'var(--status-error)' : '#ddd',
                              borderRadius: 'var(--radius-md)',
                              cursor: canCancel ? 'pointer' : 'not-allowed',
                            }}
                          >
                            {cancellingId === b.id ? 'Cancelling...' : 'Cancel Reservation'}
                          </button>
                          {windowClosed && (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              Cancellation window closed (&lt;20 min to start)
                            </span>
                          )}
                        </div>
                      )}
                      {b.status === 'COMPLETED' && !b.review && (
                        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                          <button
                            onClick={() => {
                              setReviewBookingId(b.id);
                              setRating(5);
                              setComment('');
                              setReviewError('');
                              setReviewModalOpen(true);
                            }}
                            style={{
                              padding: '7px 16px',
                              fontSize: '13px',
                              fontWeight: '600',
                              border: '1px solid var(--secondary)',
                              background: 'transparent',
                              color: 'var(--text-heading)',
                              borderRadius: 'var(--radius-md)',
                              cursor: 'pointer',
                            }}
                          >
                            ✏ Write Review
                          </button>
                        </div>
                      )}
                      {b.status === 'COMPLETED' && b.review && (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: '600' }}>
                          ★ Reviewed ({b.review.rating}/5)
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Review Modal Overlay */}
            {reviewModalOpen && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '20px',
              }}>
                <div style={{
                  background: '#fff',
                  padding: '28px',
                  borderRadius: 'var(--radius-xl)',
                  width: '100%',
                  maxWidth: '460px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                }}>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-heading)', margin: 0 }}>
                    Write a Review
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
                    Share your experience with CafeReserve and other diners!
                  </p>

                  <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-heading)', display: 'block', marginBottom: '8px' }}>
                        Rating
                      </label>
                      <div style={{ display: 'flex', gap: '8px', fontSize: '28px', cursor: 'pointer', color: 'var(--secondary)' }}>
                        {[1, 2, 3, 4, 5].map(num => (
                          <span
                            key={num}
                            onClick={() => setRating(num)}
                            style={{ userSelect: 'none' }}
                          >
                            {num <= rating ? '★' : '☆'}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="review-comment" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-heading)', display: 'block', marginBottom: '6px' }}>
                        Comment
                      </label>
                      <textarea
                        id="review-comment"
                        rows={4}
                        required
                        placeholder="Tell us what you liked or how we can improve..."
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-default)',
                          fontSize: '14px',
                          boxSizing: 'border-box',
                          outline: 'none',
                          resize: 'vertical',
                          fontFamily: 'inherit',
                        }}
                      />
                    </div>

                    {reviewError && (
                      <p style={{ color: 'var(--status-error)', fontSize: '13px', margin: 0 }}>{reviewError}</p>
                    )}

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '4px' }}>
                      <button
                        type="button"
                        onClick={() => { setReviewModalOpen(false); setReviewError(''); }}
                        style={{
                          padding: '8px 16px',
                          border: '1px solid var(--border-default)',
                          background: 'transparent',
                          color: 'var(--text-secondary)',
                          borderRadius: 'var(--radius-md)',
                          fontWeight: '600',
                          fontSize: '14px',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={reviewSubmitting}
                        style={{
                          padding: '8px 20px',
                          background: 'var(--primary)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 'var(--radius-md)',
                          fontWeight: '700',
                          fontSize: '14px',
                          cursor: 'pointer',
                        }}
                      >
                        {reviewSubmitting ? 'Submitting…' : 'Submit Review'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {(user?.role === 'CAFE_ADMIN' || user?.role === 'CAFE_STAFF') && (
          <div style={{ marginTop: '24px' }}>
            {loading ? (
              <p style={{ color: 'var(--text-muted)' }}>Checking café onboarding status...</p>
            ) : error ? (
              <div className="form-error">{error}</div>
            ) : !cafe ? (
              user.role === 'CAFE_ADMIN' ? (
                <div>
                  <p style={{ marginBottom: '20px', color: 'var(--text-secondary)' }}>
                    You have not registered a café yet. Get started by registering your café profile.
                  </p>
                  <button
                    onClick={() => navigate('/onboard')}
                    style={{
                      padding: '12px 24px',
                      color: '#fff',
                      background: 'var(--primary)',
                      border: '0',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: '600',
                      fontSize: '15px'
                    }}
                  >
                    Register Your Café
                  </button>
                </div>
              ) : (
                <p style={{ color: 'var(--text-secondary)' }}>
                  You are added as a staff member, but no café has been initialized by the administrator yet.
                </p>
              )
            ) : (
              <div style={{ padding: '24px', background: 'var(--bg-surface-sunken)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-default)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  CAFÉ ONBOARDING STATUS
                </span>
                
                <h3 style={{ fontSize: '20px', color: 'var(--text-heading)', margin: '8px 0' }}>
                  {cafe.name}
                </h3>

                {cafe.status === 'PENDING' && (
                  <div>
                    <div style={{ display: 'inline-block', background: '#fff3e0', color: '#e65100', padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: '13px', fontWeight: '600', marginBottom: '14px' }}>
                      PENDING REVIEW
                    </div>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
                      Your café onboarding application has been submitted and is currently being reviewed by our Super Admin. We will notify you once it goes live.
                    </p>
                  </div>
                )}

                {cafe.status === 'APPROVED' && (
                  <div>
                    <div style={{ display: 'inline-block', background: '#e8f5e9', color: '#1b5e20', padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>
                      APPROVED & LIVE
                    </div>
                    <p style={{ margin: '0 0 20px', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
                      Congratulations! Your café is live on the platform. You can now manage your tables inventory and operating hours.
                    </p>
                    <button
                      onClick={() => navigate('/dashboard')}
                      style={{
                        padding: '10px 20px',
                        color: '#fff',
                        background: 'var(--primary)',
                        border: '0',
                        borderRadius: 'var(--radius-md)',
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      Go to Cafe Dashboard
                    </button>
                  </div>
                )}

                {cafe.status === 'REJECTED' && (
                  <div>
                    <div style={{ display: 'inline-block', background: '#ffdad6', color: '#93000a', padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: '13px', fontWeight: '600', marginBottom: '14px' }}>
                      REJECTED
                    </div>
                    <div style={{ padding: '16px', background: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', marginBottom: '16px' }}>
                      <strong style={{ color: 'var(--text-heading)', display: 'block', marginBottom: '4px', fontSize: '13px' }}>REJECTION REASON:</strong>
                      <span style={{ color: 'var(--status-error)', fontSize: '14px' }}>{cafe.rejectionReason}</span>
                    </div>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
                      Your onboarding application was not approved. Please reach out to the support team or resubmit a corrected application when options become available.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

export default HomePage;
