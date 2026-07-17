import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { getPendingCafes, approveCafe, rejectCafe } from '../services/cafe.service';

function SuperAdminDashboard() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [cafes, setCafes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Rejection modal/popup state
  const [rejectingCafeId, setRejectingCafeId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState('');

  async function fetchPending() {
    try {
      setLoading(true);
      setError('');
      const data = await getPendingCafes(token);
      setCafes(data);
    } catch (err) {
      setError('Failed to fetch pending café registrations.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPending();
  }, [token]);

  async function handleApprove(id) {
    if (!window.confirm('Are you sure you want to approve this café registration?')) {
      return;
    }
    try {
      setSubmittingAction(true);
      setActionError('');
      await approveCafe(id, token);
      // Refresh list
      await fetchPending();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to approve café.';
      setActionError(msg);
    } finally {
      setSubmittingAction(false);
    }
  }

  async function handleRejectSubmit(e) {
    e.preventDefault();
    if (rejectionReason.trim().length < 5) {
      setActionError('Rejection reason must be at least 5 characters long.');
      return;
    }
    try {
      setSubmittingAction(true);
      setActionError('');
      await rejectCafe(rejectingCafeId, rejectionReason, token);
      // Reset state and modal
      setRejectingCafeId(null);
      setRejectionReason('');
      // Refresh list
      await fetchPending();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to reject café.';
      setActionError(msg);
    } finally {
      setSubmittingAction(false);
    }
  }

  return (
    <main className="home-page">
      <header className="home-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span className="brand" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>CafeReserve</span>
          <span style={{ fontSize: '14px', background: 'var(--border-default)', padding: '4px 12px', borderRadius: 'var(--radius-full)', color: 'var(--text-heading)', fontWeight: '600' }}>
            SUPER ADMIN PANEL
          </span>
        </div>
        <button className="button-secondary" type="button" onClick={() => logout()}>Sign out</button>
      </header>

      <section style={{ maxWidth: '960px', margin: '40px auto 0' }}>
        <h1 style={{ color: 'var(--text-heading)', fontSize: '32px', marginBottom: '8px' }}>Pending Café Registrations</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Review and approve or reject submissions from café owners.</p>

        {error && <div className="form-error" style={{ marginBottom: '24px' }}>{error}</div>}
        {actionError && <div className="form-error" style={{ marginBottom: '24px' }}>{actionError}</div>}

        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading registrations...</p>
        ) : cafes.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)' }}>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '16px' }}>No pending café registrations to review.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '32px' }}>
            {cafes.map((cafe) => (
              <div
                key={cafe.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '300px 1fr',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-xl)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ height: '100%', minHeight: '220px', background: '#e9e9dd', position: 'relative' }}>
                  {cafe.coverPhotoUrl ? (
                    <img
                      src={cafe.coverPhotoUrl}
                      alt={cafe.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
                      No cover photo
                    </div>
                  )}
                </div>

                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                      <h2 style={{ margin: 0, fontSize: '22px', color: 'var(--text-heading)' }}>{cafe.name}</h2>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'var(--bg-surface-sunken)', padding: '4px 8px', borderRadius: '4px' }}>
                        {cafe.city} / {cafe.area}
                      </span>
                    </div>

                    <p style={{ margin: '0 0 16px', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      {cafe.description}
                    </p>

                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                      <strong>Owner:</strong> {cafe.owner.name} ({cafe.owner.email}) <br />
                      <strong>Address:</strong> {cafe.location} <br />
                      <strong>Coords:</strong> Lat: {cafe.latitude}, Lng: {cafe.longitude}
                    </div>

                    {cafe.photos && Array.isArray(cafe.photos) && cafe.photos.length > 0 && (
                      <div style={{ marginBottom: '16px' }}>
                        <span style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-heading)', marginBottom: '6px' }}>GALLERY PHOTOS:</span>
                        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                          {cafe.photos.map((url, idx) => (
                            <img
                              key={idx}
                              src={url}
                              alt={`gallery-${idx}`}
                              style={{ width: '60px', height: '60px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button
                      className="button-secondary"
                      type="button"
                      disabled={submittingAction}
                      onClick={() => handleApprove(cafe.id)}
                      style={{
                        margin: 0,
                        flex: '1',
                        color: 'var(--status-success-text, #1b5e20)',
                        border: '1px solid #c8e6c9',
                        padding: '10px 20px',
                        background: 'transparent'
                      }}
                    >
                      Approve Cafe
                    </button>
                    <button
                      className="button-secondary"
                      type="button"
                      disabled={submittingAction}
                      onClick={() => setRejectingCafeId(cafe.id)}
                      style={{
                        margin: 0,
                        flex: '1',
                        color: 'var(--status-error)',
                        border: '1px solid var(--status-error-subtle)',
                        padding: '10px 20px',
                        background: 'transparent'
                      }}
                    >
                      Reject Cafe
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Rejection Modal overlay */}
      {rejectingCafeId && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(26, 18, 11, 0.40)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 1000
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '28px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-xl)'
            }}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: '20px', color: 'var(--text-heading)' }}>Reject Café Registration</h3>
            <p style={{ margin: '0 0 20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              Provide a reason for rejecting this café onboarding request. The owner will see this feedback.
            </p>

            <form onSubmit={handleRejectSubmit}>
              <textarea
                required
                minLength={5}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Cover photo quality is too low, or GPS coordinates are invalid."
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '12px',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  resize: 'vertical',
                  marginBottom: '20px'
                }}
              />

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setRejectingCafeId(null);
                    setRejectionReason('');
                    setActionError('');
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                    background: 'transparent',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '0',
                    background: 'var(--status-error)',
                    color: '#fff',
                    fontWeight: '600',
                    cursor: submittingAction ? 'wait' : 'pointer',
                    opacity: submittingAction ? 0.7 : 1
                  }}
                >
                  {submittingAction ? 'Submitting...' : 'Reject Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default SuperAdminDashboard;
