import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { getOwnedCafe } from '../services/cafe.service';

function HomePage() {
  const { logout, user, token } = useAuth();
  const navigate = useNavigate();

  const [cafe, setCafe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
  }, [user, token]);

  return (
    <main className="home-page">
      <header className="home-header">
        <span className="brand">Aura Reserve</span>
        <button className="button-secondary" type="button" onClick={handleLogout}>Sign out</button>
      </header>

      <section className="home-card" style={{ marginTop: '8vh' }}>
        <p className="eyebrow">WELCOME TO AURA RESERVE</p>
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
          <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>
            Your customer account is active. Café discovery and table reservation features will be available in the next build unit!
          </p>
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
                    <div style={{ display: 'inline-block', background: '#e8f5e9', color: '#1b5e20', padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: '13px', fontWeight: '600', marginBottom: '14px' }}>
                      APPROVED & LIVE
                    </div>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
                      Congratulations! Your café is live on the platform. The dashboard to manage tables and bookings will be available in the next build unit.
                    </p>
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
