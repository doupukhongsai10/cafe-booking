import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { onboardCafe } from '../services/cafe.service';

const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

function CafeOnboardingPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [latitude, setLatitude] = useState('40.7128');
  const [longitude, setLongitude] = useState('-74.0060');

  // Operating Hours state
  const [hours, setHours] = useState(() => {
    const initialHours = {};
    DAYS_OF_WEEK.forEach((day) => {
      initialHours[day] = { open: '08:00', close: '22:00', closed: false };
    });
    return initialHours;
  });

  const [coverPhoto, setCoverPhoto] = useState(null);
  const [photos, setPhotos] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleHoursChange(day, field, value) {
    setHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  }

  function handleFileChange(e, setFileFn) {
    if (e.target.files && e.target.files.length > 0) {
      setFileFn(e.target.files[0]);
    }
  }

  function handleMultipleFilesChange(e) {
    if (e.target.files) {
      setPhotos(Array.from(e.target.files));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!coverPhoto) {
      setError('Cover photo is required.');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('location', location);
      formData.append('city', city);
      formData.append('area', area);
      formData.append('latitude', latitude);
      formData.append('longitude', longitude);
      formData.append('operatingHours', JSON.stringify(hours));
      formData.append('coverPhoto', coverPhoto);
      
      photos.forEach((photo) => {
        formData.append('photos', photo);
      });

      await onboardCafe(formData, token);
      navigate('/home');
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to submit café onboarding details.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="home-page">
      <header className="home-header">
        <span className="brand" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>CafeReserve</span>
        <button className="button-secondary" type="button" onClick={() => logout()}>Sign out</button>
      </header>

      <section style={{ maxWidth: '800px', margin: '40px auto', padding: '32px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
        <p className="eyebrow">STEP 2 OF ONBOARDING</p>
        <h1 style={{ margin: '0 0 24px', fontSize: '32px', color: 'var(--text-heading)', fontWeight: '600' }}>Register Your Café</h1>
        <p style={{ margin: '0 0 32px', color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.5' }}>
          Provide the detail profile information for your café. Once submitted, your registration request will go to the Super Admin for approval.
        </p>

        {error && <div className="form-error" style={{ marginBottom: '24px' }}>{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form" style={{ gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="cafe-name">Café Name</label>
            <input
              id="cafe-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Central Perk"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="cafe-desc">Description</label>
            <textarea
              id="cafe-desc"
              required
              minLength={10}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell customers about your vibe, specialty brews, and seating space..."
              style={{
                width: '100%',
                padding: '12px 16px',
                color: 'var(--text-primary)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                minHeight: '100px',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label htmlFor="cafe-city">City</label>
              <input
                id="cafe-city"
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. New York"
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label htmlFor="cafe-area">Area/Neighborhood</label>
              <input
                id="cafe-area"
                type="text"
                required
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g. Greenwich Village"
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="cafe-address">Location Address</label>
            <input
              id="cafe-address"
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. 128 Greenwich St"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label htmlFor="cafe-lat">Latitude</label>
              <input
                id="cafe-lat"
                type="number"
                step="any"
                required
                min="-90"
                max="90"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label htmlFor="cafe-lng">Longitude</label>
              <input
                id="cafe-lng"
                type="number"
                step="any"
                required
                min="-180"
                max="180"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '12px' }}>Operating Hours</label>
            <div style={{ display: 'grid', gap: '12px', padding: '16px', background: 'var(--bg-surface-sunken)', borderRadius: 'var(--radius-md)' }}>
              {DAYS_OF_WEEK.map((day) => (
                <div key={day} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 100px', alignItems: 'center', gap: '12px' }}>
                  <span style={{ textTransform: 'capitalize', fontWeight: '500', fontSize: '14px', color: 'var(--text-heading)' }}>
                    {day}
                  </span>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Open:</span>
                    <input
                      type="text"
                      disabled={hours[day].closed}
                      value={hours[day].open}
                      onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                      placeholder="09:00"
                      style={{ padding: '6px 8px', fontSize: '13px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Close:</span>
                    <input
                      type="text"
                      disabled={hours[day].closed}
                      value={hours[day].close}
                      onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                      placeholder="22:00"
                      style={{ padding: '6px 8px', fontSize: '13px' }}
                    />
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0, textTransform: 'none', fontSize: '13px', fontWeight: 'normal' }}>
                    <input
                      type="checkbox"
                      checked={hours[day].closed}
                      onChange={(e) => handleHoursChange(day, 'closed', e.target.checked)}
                      style={{ width: 'auto', margin: 0 }}
                    />
                    Closed
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label htmlFor="cafe-cover">Cover Photo (Required)</label>
              <input
                id="cafe-cover"
                type="file"
                accept="image/*"
                required
                onChange={(e) => handleFileChange(e, setCoverPhoto)}
                style={{ border: '0', padding: '8px 0' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label htmlFor="cafe-gallery">Gallery Photos (Optional, max 10)</label>
              <input
                id="cafe-gallery"
                type="file"
                accept="image/*"
                multiple
                onChange={handleMultipleFilesChange}
                style={{ border: '0', padding: '8px 0' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '24px',
              padding: '14px 28px',
              color: '#ffffff',
              background: 'var(--primary)',
              border: '0',
              borderRadius: 'var(--radius-md)',
              fontWeight: '600',
              fontSize: '16px',
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Submitting Details...' : 'Submit Cafe Registration'}
          </button>
        </form>
      </section>
    </main>
  );
}

export default CafeOnboardingPage;
