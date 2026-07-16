import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import {
  getOwnedCafe,
  getTables,
  createTable,
  updateTable,
  deleteTable,
  updateOperatingHours,
  updateCafeProfile
} from '../services/cafe.service';
import { getCafeBookings, updateBookingStatus } from '../services/booking.service';

const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const TABLE_ZONES = ['INDOOR', 'OUTDOOR', 'ROOFTOP', 'PRIVATE'];

function CafeDashboardPage() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('tables'); // 'tables' | 'hours' | 'profile' | 'reservations'
  const [cafe, setCafe] = useState(null);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Tables state
  const [editingTable, setEditingTable] = useState(null); // table object or null
  const [showTableForm, setShowTableForm] = useState(false);
  const [tableForm, setTableForm] = useState({ name: '', capacity: 2, zone: 'INDOOR', description: '' });
  const [tableActionLoading, setTableActionLoading] = useState(false);
  const [tableError, setTableError] = useState('');

  // Reservations state
  const [reservations, setReservations] = useState([]);
  const [reservationsLoading, setReservationsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  // Operating Hours state
  const [hours, setHours] = useState({});
  const [hoursLoading, setHoursLoading] = useState(false);

  // Profile Form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    description: '',
    location: '',
    city: '',
    area: '',
    latitude: '',
    longitude: ''
  });
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      setError('');
      const cafeData = await getOwnedCafe(token);
      if (!cafeData) {
        navigate('/onboard');
        return;
      }
      setCafe(cafeData);

      // Populate hours
      const initialHours = {};
      DAYS_OF_WEEK.forEach((day) => {
        initialHours[day] = cafeData.operatingHours?.[day] || { open: '08:00', close: '22:00', closed: false };
      });
      setHours(initialHours);

      // Populate profile settings
      setProfileForm({
        name: cafeData.name || '',
        description: cafeData.description || '',
        location: cafeData.location || '',
        city: cafeData.city || '',
        area: cafeData.area || '',
        latitude: String(cafeData.latitude || '40.7128'),
        longitude: String(cafeData.longitude || '-74.0060')
      });

      // Fetch tables
      const tablesData = await getTables(cafeData.id, token);
      setTables(tablesData);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  // Tab switching clears messages
  function handleTabChange(tab) {
    setActiveTab(tab);
    setSuccessMsg('');
    setError('');
  }

  // --- Table Actions ---
  function openAddTable() {
    setEditingTable(null);
    setTableForm({ name: '', capacity: 2, zone: 'INDOOR', description: '' });
    setTableError('');
    setShowTableForm(true);
  }

  function openEditTable(table) {
    setEditingTable(table);
    setTableForm({
      name: table.name,
      capacity: table.capacity,
      zone: table.zone,
      description: table.description
    });
    setTableError('');
    setShowTableForm(true);
  }

  async function handleTableSubmit(e) {
    e.preventDefault();
    setTableActionLoading(true);
    setTableError('');

    try {
      if (editingTable) {
        const updated = await updateTable(cafe.id, editingTable.id, tableForm, token);
        setTables((prev) => prev.map((t) => (t.id === editingTable.id ? updated : t)));
        setSuccessMsg(`Successfully updated table: ${updated.name}`);
      } else {
        const created = await createTable(cafe.id, tableForm, token);
        setTables((prev) => [...prev, created]);
        setSuccessMsg(`Successfully added table: ${created.name}`);
      }
      setShowTableForm(false);
    } catch (err) {
      setTableError(err.response?.data?.error || err.message || 'Failed to save table.');
    } finally {
      setTableActionLoading(false);
    }
  }

  async function handleToggleActive(table) {
    try {
      const updated = await updateTable(cafe.id, table.id, { isActive: !table.isActive }, token);
      setTables((prev) => prev.map((t) => (t.id === table.id ? updated : t)));
      setSuccessMsg(`Table status updated for: ${table.name}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update table status.');
    }
  }

  async function handleDeleteTable(tableId) {
    if (!window.confirm('Are you sure you want to delete this table?')) return;
    setError('');
    setSuccessMsg('');

    try {
      await deleteTable(cafe.id, tableId, token);
      setTables((prev) => prev.filter((t) => t.id !== tableId));
      setSuccessMsg('Table successfully deleted.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete table.');
    }
  }

  // --- Hours Actions ---
  function handleHoursChange(day, field, value) {
    setHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  }

  async function handleHoursSubmit(e) {
    e.preventDefault();
    setHoursLoading(true);
    setSuccessMsg('');
    setError('');

    try {
      const updatedCafe = await updateOperatingHours(cafe.id, hours, token);
      setCafe(updatedCafe);
      setSuccessMsg('Operating hours updated successfully.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update hours.');
    } finally {
      setHoursLoading(false);
    }
  }

  // --- Profile Actions ---
  function handleProfileChange(e) {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setProfileLoading(true);
    setSuccessMsg('');
    setError('');

    try {
      const formData = new FormData();
      formData.append('name', profileForm.name);
      formData.append('description', profileForm.description);
      formData.append('location', profileForm.location);
      formData.append('city', profileForm.city);
      formData.append('area', profileForm.area);
      formData.append('latitude', profileForm.latitude);
      formData.append('longitude', profileForm.longitude);
      if (coverPhoto) {
        formData.append('coverPhoto', coverPhoto);
      }

      const updated = await updateCafeProfile(cafe.id, formData, token);
      setCafe(updated);
      setSuccessMsg('Café profile updated successfully.');
      setCoverPhoto(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile details.');
    } finally {
      setProfileLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="home-page">
        <header className="home-header">
          <span className="brand">Aura Reserve</span>
        </header>
        <section style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading café workspace...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="home-page">
      <header className="home-header" style={{ position: 'sticky', top: 0, zIndex: 100, background: 'var(--bg-overlay)', backdropFilter: 'blur(var(--bg-overlay-blur))', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span className="brand" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>Aura Reserve</span>
          <span style={{ fontSize: '13px', background: 'var(--primary-subtle)', color: 'var(--primary-subtle-text)', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Workspace
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{cafe.name}</span>
          <button className="button-secondary" type="button" onClick={() => logout()}>Sign out</button>
        </div>
      </header>

      <div style={{ maxWidth: '1000px', margin: '40px auto 100px', padding: '0 20px' }}>
        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-default)', marginBottom: '32px', paddingBottom: '4px' }}>
          <button
            onClick={() => handleTabChange('tables')}
            style={{
              padding: '12px 20px',
              border: 0,
              background: 'transparent',
              color: activeTab === 'tables' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'tables' ? '2px solid var(--primary)' : '2px solid transparent',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '15px',
              transition: 'all 0.2s ease'
            }}
          >
            Table Manager
          </button>
          <button
            onClick={() => handleTabChange('hours')}
            style={{
              padding: '12px 20px',
              border: 0,
              background: 'transparent',
              color: activeTab === 'hours' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'hours' ? '2px solid var(--primary)' : '2px solid transparent',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '15px',
              transition: 'all 0.2s ease'
            }}
          >
            Operating Hours
          </button>
          <button
            onClick={() => handleTabChange('profile')}
            style={{
              padding: '12px 20px',
              border: 0,
              background: 'transparent',
              color: activeTab === 'profile' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'profile' ? '2px solid var(--primary)' : '2px solid transparent',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '15px',
              transition: 'all 0.2s ease'
            }}
          >
            Profile Editor
          </button>
          <button
            onClick={() => {
              handleTabChange('reservations');
              if (cafe) {
                setReservationsLoading(true);
                getCafeBookings(cafe.id, token)
                  .then(setReservations)
                  .catch((err) => {
                    setError(err.response?.data?.error || 'Failed to fetch reservations.');
                  })
                  .finally(() => setReservationsLoading(false));
              }
            }}
            style={{
              padding: '12px 20px',
              border: 0,
              background: 'transparent',
              color: activeTab === 'reservations' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'reservations' ? '2px solid var(--primary)' : '2px solid transparent',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '15px',
              transition: 'all 0.2s ease'
            }}
          >
            Reservations
          </button>
        </nav>

        {error && <div className="form-error" style={{ marginBottom: '24px' }}>{error}</div>}
        {successMsg && (
          <div style={{ padding: '16px', background: 'var(--status-success-subtle)', color: 'var(--status-success-text)', borderRadius: 'var(--radius-md)', border: '1px solid #c8e6c9', marginBottom: '24px', fontSize: '14px', fontWeight: '500' }}>
            {successMsg}
          </div>
        )}

        {/* --- 1. TABLES MANAGER TAB --- */}
        {activeTab === 'tables' && (
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ color: 'var(--text-heading)', margin: 0, fontSize: '24px' }}>Tables Inventory</h2>
                <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0', fontSize: '14px' }}>Manage seating capacity, zoning, and availability status.</p>
              </div>
              <button
                onClick={openAddTable}
                style={{
                  padding: '10px 20px',
                  color: '#fff',
                  background: 'var(--primary)',
                  border: 0,
                  borderRadius: 'var(--radius-md)',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Add Table
              </button>
            </div>

            {tables.length === 0 ? (
              <div style={{ padding: '64px', textAlign: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)' }}>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No tables registered. Create a table to start taking bookings!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {tables.map((table) => (
                  <div
                    key={table.id}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-xl)',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-heading)' }}>{table.name}</h3>
                        <span style={{ fontSize: '11px', background: 'var(--bg-surface-sunken)', padding: '4px 8px', borderRadius: 'var(--radius-sm)', fontWeight: '600', color: 'var(--text-muted)' }}>
                          {table.zone}
                        </span>
                      </div>
                      
                      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 16px', minHeight: '40px', lineHeight: '1.4' }}>
                        {table.description || 'No description provided.'}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Capacity:</span>
                        <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{table.capacity} seats</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                      <button
                        onClick={() => handleToggleActive(table)}
                        style={{
                          border: 0,
                          background: table.isActive ? 'var(--status-success-subtle)' : 'var(--status-error-subtle)',
                          color: table.isActive ? 'var(--status-success-text)' : 'var(--status-error-text)',
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        {table.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </button>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => openEditTable(table)}
                          style={{
                            border: '1px solid var(--border-strong)',
                            background: 'transparent',
                            color: 'var(--text-primary)',
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTable(table.id)}
                          style={{
                            border: '1px solid var(--status-error-subtle)',
                            background: 'transparent',
                            color: 'var(--status-error)',
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Table Edit/Add Overlay Modal */}
            {showTableForm && (
              <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'var(--scrim)', display: 'grid', placeItems: 'center', zIndex: 1000 }}>
                <div style={{ width: '100%', maxWidth: '440px', padding: '28px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl)' }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: '20px', color: 'var(--text-heading)' }}>
                    {editingTable ? 'Edit Table Settings' : 'Add New Table'}
                  </h3>

                  {tableError && <div className="form-error" style={{ marginBottom: '16px' }}>{tableError}</div>}

                  <form onSubmit={handleTableSubmit} className="auth-form" style={{ gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label htmlFor="tbl-name">Table Label / Number</label>
                      <input
                        id="tbl-name"
                        type="text"
                        required
                        value={tableForm.name}
                        onChange={(e) => setTableForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. Table 4, Window Booth"
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label htmlFor="tbl-capacity">Capacity (Seats)</label>
                        <input
                          id="tbl-capacity"
                          type="number"
                          required
                          min="1"
                          value={tableForm.capacity}
                          onChange={(e) => setTableForm((prev) => ({ ...prev, capacity: parseInt(e.target.value) || 2 }))}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label htmlFor="tbl-zone">Zone</label>
                        <select
                          id="tbl-zone"
                          value={tableForm.zone}
                          onChange={(e) => setTableForm((prev) => ({ ...prev, zone: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            color: 'var(--text-primary)',
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-default)',
                            borderRadius: 'var(--radius-md)'
                          }}
                        >
                          {TABLE_ZONES.map((zone) => (
                            <option key={zone} value={zone}>{zone}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label htmlFor="tbl-desc">Description</label>
                      <textarea
                        id="tbl-desc"
                        required
                        value={tableForm.description}
                        onChange={(e) => setTableForm((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe seating highlights..."
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          color: 'var(--text-primary)',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-default)',
                          borderRadius: 'var(--radius-md)',
                          minHeight: '80px',
                          fontFamily: 'inherit',
                          resize: 'vertical'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                      <button
                        type="button"
                        onClick={() => setShowTableForm(false)}
                        style={{
                          padding: '10px 20px',
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
                        disabled={tableActionLoading}
                        style={{
                          padding: '10px 20px',
                          borderRadius: 'var(--radius-md)',
                          border: 0,
                          background: 'var(--primary)',
                          color: '#fff',
                          fontWeight: '600',
                          cursor: tableActionLoading ? 'wait' : 'pointer',
                          opacity: tableActionLoading ? 0.7 : 1
                        }}
                      >
                        {tableActionLoading ? 'Saving...' : editingTable ? 'Save Changes' : 'Create Table'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </section>
        )}

        {/* --- 2. OPERATING HOURS TAB --- */}
        {activeTab === 'hours' && (
          <section style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', padding: '32px', boxShadow: 'var(--shadow-sm)' }}>
            <h2 style={{ color: 'var(--text-heading)', margin: '0 0 8px', fontSize: '24px' }}>Operating Hours</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '0 0 32px', fontSize: '14px' }}>Adjust weekly open and close schedules. Set custom days to closed.</p>

            <form onSubmit={handleHoursSubmit} className="auth-form" style={{ gap: '20px' }}>
              <div style={{ display: 'grid', gap: '16px', padding: '20px', background: 'var(--bg-surface-sunken)', borderRadius: 'var(--radius-md)' }}>
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 100px', alignItems: 'center', gap: '16px' }}>
                    <span style={{ textTransform: 'capitalize', fontWeight: '600', fontSize: '15px', color: 'var(--text-heading)' }}>
                      {day}
                    </span>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Open:</span>
                      <input
                        type="text"
                        disabled={hours[day]?.closed}
                        value={hours[day]?.open || '08:00'}
                        onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                        placeholder="09:00"
                        style={{ padding: '6px 12px', fontSize: '14px' }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Close:</span>
                      <input
                        type="text"
                        disabled={hours[day]?.closed}
                        value={hours[day]?.close || '22:00'}
                        onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                        placeholder="22:00"
                        style={{ padding: '6px 12px', fontSize: '14px' }}
                      />
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0, textTransform: 'none', fontSize: '14px', fontWeight: 'normal' }}>
                      <input
                        type="checkbox"
                        checked={hours[day]?.closed || false}
                        onChange={(e) => handleHoursChange(day, 'closed', e.target.checked)}
                        style={{ width: 'auto', margin: 0 }}
                      />
                      Closed
                    </label>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={hoursLoading}
                style={{
                  marginTop: '12px',
                  padding: '12px 24px',
                  alignSelf: 'flex-start',
                  color: '#fff',
                  background: 'var(--primary)',
                  border: 0,
                  borderRadius: 'var(--radius-md)',
                  fontWeight: '600',
                  cursor: hoursLoading ? 'wait' : 'pointer',
                  opacity: hoursLoading ? 0.7 : 1
                }}
              >
                {hoursLoading ? 'Saving hours...' : 'Save Weekly Schedule'}
              </button>
            </form>
          </section>
        )}

        {/* --- 3. PROFILE EDITOR TAB --- */}
        {activeTab === 'profile' && (
          <section style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', padding: '32px', boxShadow: 'var(--shadow-sm)' }}>
            <h2 style={{ color: 'var(--text-heading)', margin: '0 0 8px', fontSize: '24px' }}>Café Settings</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '0 0 32px', fontSize: '14px' }}>Manage the public profile representation of your café.</p>

            <form onSubmit={handleProfileSubmit} className="auth-form" style={{ gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label htmlFor="prof-name">Café Name</label>
                <input
                  id="prof-name"
                  name="name"
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={handleProfileChange}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label htmlFor="prof-desc">Description</label>
                <textarea
                  id="prof-desc"
                  name="description"
                  required
                  minLength={10}
                  value={profileForm.description}
                  onChange={handleProfileChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    color: 'var(--text-primary)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    minHeight: '120px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label htmlFor="prof-city">City</label>
                  <input
                    id="prof-city"
                    name="city"
                    type="text"
                    required
                    value={profileForm.city}
                    onChange={handleProfileChange}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label htmlFor="prof-area">Area/Neighborhood</label>
                  <input
                    id="prof-area"
                    name="area"
                    type="text"
                    required
                    value={profileForm.area}
                    onChange={handleProfileChange}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label htmlFor="prof-address">Location Address</label>
                <input
                  id="prof-address"
                  name="location"
                  type="text"
                  required
                  value={profileForm.location}
                  onChange={handleProfileChange}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label htmlFor="prof-lat">Latitude</label>
                  <input
                    id="prof-lat"
                    name="latitude"
                    type="number"
                    step="any"
                    required
                    min="-90"
                    max="90"
                    value={profileForm.latitude}
                    onChange={handleProfileChange}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label htmlFor="prof-lng">Longitude</label>
                  <input
                    id="prof-lng"
                    name="longitude"
                    type="number"
                    step="any"
                    required
                    min="-180"
                    max="180"
                    value={profileForm.longitude}
                    onChange={handleProfileChange}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '24px', alignItems: 'center', marginTop: '12px' }}>
                <div style={{ height: '120px', background: '#e9e9dd', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-default)', position: 'relative' }}>
                  {coverPhoto ? (
                    <img
                      src={URL.createObjectURL(coverPhoto)}
                      alt="Cover Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : cafe.coverPhotoUrl ? (
                    <img
                      src={cafe.coverPhotoUrl}
                      alt={cafe.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '13px' }}>
                      No cover photo
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="prof-cover" style={{ marginBottom: '4px' }}>Change Cover Photo</label>
                  <input
                    id="prof-cover"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setCoverPhoto(e.target.files[0]);
                      }
                    }}
                    style={{ border: 0, padding: '8px 0' }}
                  />
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Leave empty if you do not wish to modify the cover image.</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={profileLoading}
                style={{
                  marginTop: '12px',
                  padding: '12px 24px',
                  alignSelf: 'flex-start',
                  color: '#fff',
                  background: 'var(--primary)',
                  border: 0,
                  borderRadius: 'var(--radius-md)',
                  fontWeight: '600',
                  cursor: profileLoading ? 'wait' : 'pointer',
                  opacity: profileLoading ? 0.7 : 1
                }}
              >
                {profileLoading ? 'Saving settings...' : 'Save Profile Changes'}
              </button>
            </form>
          </section>
        )}

        {/* --- 4. RESERVATIONS TAB --- */}
        {activeTab === 'reservations' && (
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-heading)', margin: 0 }}>Incoming Reservations</h2>
              <button
                onClick={() => {
                  if (!cafe) return;
                  setError('');
                  setReservationsLoading(true);
                  getCafeBookings(cafe.id, token)
                    .then(setReservations)
                    .catch((err) => {
                      setError(err.response?.data?.error || 'Failed to refresh reservations.');
                    })
                    .finally(() => setReservationsLoading(false));
                }}
                style={{ padding: '8px 16px', border: '1px solid var(--border-default)', background: 'transparent', borderRadius: 'var(--radius-md)', fontWeight: '600', fontSize: '13px', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                ↻ Refresh
              </button>
            </div>

            {reservationsLoading ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading reservations…</p>
            ) : reservations.length === 0 ? (
              <div style={{ padding: '48px 20px', textAlign: 'center', background: 'var(--surface-secondary)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-default)' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>No reservations yet for this café.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {reservations.map(b => {
                  const STATUS_COLORS = {
                    CONFIRMED:  { bg: '#e8f5e9', color: '#1b5e20' },
                    CANCELLED:  { bg: '#fafafa',  color: '#999' },
                    NO_SHOW:    { bg: '#fce4ec',  color: '#880e4f' },
                    COMPLETED:  { bg: '#e3f2fd',  color: '#0d47a1' },
                  };
                  const sc = STATUS_COLORS[b.status] || { bg: '#f5f5f5', color: '#555' };
                  const isUpdating = updatingId === b.id;

                  async function handleStatusUpdate(newStatus) {
                    try {
                      setUpdatingId(b.id);
                      const updated = await updateBookingStatus(b.id, newStatus, token);
                      setReservations(prev => prev.map(r => r.id === b.id ? { ...r, ...updated } : r));
                    } catch (err) {
                      alert(err.response?.data?.error || 'Failed to update status.');
                    } finally {
                      setUpdatingId(null);
                    }
                  }

                  return (
                    <div key={b.id} style={{
                      background: 'var(--surface-primary)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '18px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <p style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-heading)', margin: 0 }}>
                            {b.customer?.name}
                          </p>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                            {b.customer?.email}
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

                      {b.status === 'CONFIRMED' && (
                        <div style={{ display: 'flex', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
                          <button
                            disabled={isUpdating}
                            onClick={() => handleStatusUpdate('COMPLETED')}
                            style={{
                              padding: '7px 16px',
                              fontSize: '13px',
                              fontWeight: '600',
                              border: '1px solid #a5d6a7',
                              background: '#e8f5e9',
                              color: '#1b5e20',
                              borderRadius: 'var(--radius-md)',
                              cursor: 'pointer',
                            }}
                          >
                            {isUpdating ? '…' : '✓ Mark Completed'}
                          </button>
                          <button
                            disabled={isUpdating}
                            onClick={() => handleStatusUpdate('NO_SHOW')}
                            style={{
                              padding: '7px 16px',
                              fontSize: '13px',
                              fontWeight: '600',
                              border: '1px solid #f48fb1',
                              background: '#fce4ec',
                              color: '#880e4f',
                              borderRadius: 'var(--radius-md)',
                              cursor: 'pointer',
                            }}
                          >
                            {isUpdating ? '…' : '✗ Mark No-Show'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

export default CafeDashboardPage;
