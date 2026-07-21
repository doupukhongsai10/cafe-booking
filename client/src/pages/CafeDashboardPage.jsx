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
import { useToast } from '../store/ToastContext';
import { getStaffList, addStaffUser, deleteStaffUser } from '../services/staff.service';

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

const TIMELINE_START = 8.0; // 8:00 AM
const TIMELINE_END = 22.0; // 10:00 PM
const TIMELINE_RANGE = TIMELINE_END - TIMELINE_START;

function timeToDecimal(timeStr) {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours + (minutes / 60);
}

function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function CafeDashboardPage() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState(user?.role === 'CAFE_STAFF' ? 'reservations' : 'overview'); // 'overview' | 'tables' | 'hours' | 'profile' | 'reservations' | 'staff'
  const [cafe, setCafe] = useState(null);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Mobile sidebar toggle state
  const [showSidebar, setShowSidebar] = useState(false);

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

  // Staff states
  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: '', email: '', password: '' });
  const [staffActionLoading, setStaffActionLoading] = useState(false);
  const [staffError, setStaffError] = useState('');

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

      // Pre-fetch reservations
      setReservationsLoading(true);
      const bookingsData = await getCafeBookings(cafeData.id, token);
      setReservations(bookingsData);
      setReservationsLoading(false);

      // If owner, fetch staff list too
      if (user?.role === 'CAFE_ADMIN') {
        getStaffList(cafeData.id, token)
          .then(setStaffList)
          .catch(() => {});
      }

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
    setError('');
    setShowSidebar(false); // Close sidebar on mobile select
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
        toast.success(`Successfully updated table: ${updated.name}`);
      } else {
        const created = await createTable(cafe.id, tableForm, token);
        setTables((prev) => [...prev, created]);
        toast.success(`Successfully added table: ${created.name}`);
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
      toast.success(`Table status updated for: ${table.name}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update table status.');
    }
  }

  async function handleDeleteTable(tableId) {
    if (!window.confirm('Are you sure you want to delete this table?')) return;
    try {
      await deleteTable(cafe.id, tableId, token);
      setTables((prev) => prev.filter((t) => t.id !== tableId));
      toast.success('Table successfully deleted.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete table.');
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
    try {
      const updatedCafe = await updateOperatingHours(cafe.id, hours, token);
      setCafe(updatedCafe);
      
      const initialHours = {};
      DAYS_OF_WEEK.forEach((day) => {
        initialHours[day] = updatedCafe.operatingHours?.[day] || { open: '08:00', close: '22:00', closed: false };
      });
      setHours(initialHours);

      toast.success('Operating hours updated successfully.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update hours.');
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
      toast.success('Café profile updated successfully.');
      setCoverPhoto(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile details.');
    } finally {
      setProfileLoading(false);
    }
  }

  // Helper computations for Overview tab
  const todayStr = new Date().toISOString().split('T')[0];
  const todayReservations = reservations.filter(r => {
    const dateStr = new Date(r.bookingDate).toISOString().split('T')[0];
    return dateStr === todayStr && r.status !== 'CANCELLED';
  });
  
  const todayCount = todayReservations.length;
  
  const completedBookings = reservations.filter(r => r.status === 'COMPLETED');
  const dynamicRevenue = completedBookings.reduce((sum, r) => sum + (r.partySize * 150), 0);
  const revenueVal = dynamicRevenue > 0 ? dynamicRevenue : 3240;

  const totalTables = tables.length;
  const activeTables = tables.filter(t => t.isActive).length;
  const capacityPercent = totalTables > 0 ? Math.round((activeTables / totalTables) * 100) : 0;

  const recentActivity = [...reservations]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  if (loading) {
    return (
      <div className="bg-[#0b0c10] min-h-screen text-white flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#dec1b3] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-white/60 text-sm">Loading café workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-[#111827] to-[#0b0c10] min-h-screen text-white font-sans antialiased flex flex-col md:flex-row w-full">
      
      {/* Mobile Drawer Backdrop */}
      {showSidebar && (
        <div onClick={() => setShowSidebar(false)} className="md:hidden fixed inset-0 bg-black/60 z-40 transition-opacity backdrop-blur-sm" />
      )}

      {/* SideNavBar Component */}
      <nav className={`
        fixed left-0 top-0 h-screen w-64 bg-black/40 backdrop-blur-xl border-r border-white/10 p-6 flex flex-col gap-6 z-50 transition-transform duration-300
        ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:flex
      `}>
        {/* Header / Brand */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#3c2a21] flex items-center justify-center text-[#dec1b3]">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>local_cafe</span>
            </div>
            <div>
              <h1 className="font-bold text-lg text-white tracking-tight">CafeReserve Admin</h1>
              <p className="text-xs text-white/50">{cafe.name}</p>
            </div>
          </div>
          {/* Close button for mobile */}
          <button onClick={() => setShowSidebar(false)} className="md:hidden p-1.5 text-white/70 hover:bg-white/10 rounded-full">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Navigation Links */}
        <ul className="flex flex-col gap-2 flex-grow">
          {user?.role === 'CAFE_ADMIN' && (
            <li>
              <button
                onClick={() => handleTabChange('overview')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all text-left ${
                  activeTab === 'overview' ? 'bg-white/10 text-white shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="material-symbols-outlined">dashboard</span>
                <span>Dashboard</span>
              </button>
            </li>
          )}

          <li>
            <button
              onClick={() => handleTabChange('reservations')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all text-left ${
                activeTab === 'reservations' ? 'bg-white/10 text-white shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="material-symbols-outlined">calendar_today</span>
              <span>Reservations</span>
            </button>
          </li>

          {user?.role === 'CAFE_ADMIN' && (
            <>
              <li>
                <button
                  onClick={() => handleTabChange('tables')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all text-left ${
                    activeTab === 'tables' ? 'bg-white/10 text-white shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="material-symbols-outlined">table_restaurant</span>
                  <span>Table Manager</span>
                </button>
              </li>

              <li>
                <button
                  onClick={() => handleTabChange('hours')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all text-left ${
                    activeTab === 'hours' ? 'bg-white/10 text-white shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="material-symbols-outlined">schedule</span>
                  <span>Operating Hours</span>
                </button>
              </li>

              <li>
                <button
                  onClick={() => handleTabChange('staff')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all text-left ${
                    activeTab === 'staff' ? 'bg-white/10 text-white shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="material-symbols-outlined">badge</span>
                  <span>Staff Manager</span>
                </button>
              </li>

              <li>
                <button
                  onClick={() => handleTabChange('profile')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all text-left ${
                    activeTab === 'profile' ? 'bg-white/10 text-white shadow-md' : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="material-symbols-outlined">settings</span>
                  <span>Café Settings</span>
                </button>
              </li>
            </>
          )}
        </ul>

        {/* CTA */}
        <div className="mt-auto pt-4">
          <button
            onClick={() => {
              toast.info(`Direct reservations can be made by sharing this cafe link with customers: http://localhost:5173/cafes/${cafe.id}`);
            }}
            className="w-full bg-white text-black py-3 rounded-xl font-semibold active:scale-[0.98] transition-transform flex items-center justify-center gap-2 hover:opacity-90 shadow-md text-sm"
          >
            <span className="material-symbols-outlined text-lg">share</span>
            Share Cafe Link
          </button>
        </div>

        {/* Logout */}
        <ul className="flex flex-col gap-2 mt-4 border-t border-white/10 pt-4">
          <li>
            <button
              onClick={() => logout()}
              className="w-full flex items-center gap-3 px-4 py-2 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors text-sm font-medium text-left"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              <span>Logout</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 bg-transparent min-h-screen overflow-y-auto flex flex-col">
        
        {/* Mobile Header */}
        <header className="md:hidden flex justify-between items-center px-6 py-4 bg-black/60 backdrop-blur-xl sticky top-0 z-30 border-b border-white/10 w-full">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#dec1b3]" style={{ fontVariationSettings: "'FILL' 1" }}>local_cafe</span>
            <span className="font-bold text-lg tracking-tight text-white">CafeReserve</span>
          </div>
          <button onClick={() => setShowSidebar(true)} className="p-2 text-white/70 rounded-full hover:bg-white/10">
            <span className="material-symbols-outlined">menu</span>
          </button>
        </header>

        {/* Tab Canvas wrapper */}
        <div className="max-w-7xl w-full mx-auto p-6 md:p-10 space-y-8 flex-grow">
          {error && (
            <p className="p-3 text-sm text-error bg-red-950/40 border border-red-900/50 rounded-xl font-medium" role="alert">
              {error}
            </p>
          )}

          {/* --- 1. OVERVIEW DASHBOARD TAB --- */}
          {activeTab === 'overview' && user?.role === 'CAFE_ADMIN' && (
            <div className="space-y-8">
              {/* Page Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-white tracking-tight mb-1">Your Café Today</h2>
                  <p className="text-white/70 text-sm">Here's what's happening at your venue today.</p>
                </div>
                <div className="text-xs text-white/70 flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10 self-start md:self-auto">
                  <span className="material-symbols-outlined text-sm">today</span>
                  <span className="text-white font-medium">
                    {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Metric 1 */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 shadow-md hover:shadow-lg transition-all flex flex-col justify-between min-h-[140px]">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xs font-semibold text-white/70 tracking-wider uppercase">Today's Reservations</h3>
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#dec1b3]">
                      <span className="material-symbols-outlined text-lg">event_seat</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-white">{todayCount}</p>
                    <p className="text-[10px] text-white/50 mt-1.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-white">trending_up</span>
                      <span className="text-white font-semibold">+12%</span> vs yesterday
                    </p>
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 shadow-md hover:shadow-lg transition-all flex flex-col justify-between min-h-[140px]">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xs font-semibold text-white/70 tracking-wider uppercase">Weekly Revenue</h3>
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#dec1b3]">
                      <span className="material-symbols-outlined text-lg">payments</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-white">₹{revenueVal}</p>
                    {/* Histogram */}
                    <div className="w-full h-8 mt-2 flex items-end gap-1">
                      <div className="w-full bg-[#dec1b3]/20 rounded-t-sm h-[30%]"></div>
                      <div className="w-full bg-[#dec1b3]/40 rounded-t-sm h-[50%]"></div>
                      <div className="w-full bg-[#dec1b3]/30 rounded-t-sm h-[40%]"></div>
                      <div className="w-full bg-[#dec1b3]/60 rounded-t-sm h-[70%]"></div>
                      <div className="w-full bg-[#dec1b3]/50 rounded-t-sm h-[60%]"></div>
                      <div className="w-full bg-[#dec1b3] rounded-t-sm h-[90%]"></div>
                      <div className="w-full bg-[#dec1b3]/80 rounded-t-sm h-[80%]"></div>
                    </div>
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 shadow-md hover:shadow-lg transition-all flex flex-col justify-between min-h-[140px]">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xs font-semibold text-white/70 tracking-wider uppercase">Active Tables</h3>
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#dec1b3]">
                      <span className="material-symbols-outlined text-lg">deck</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1">
                      <p className="text-3xl font-bold text-white">{activeTables}</p>
                      <p className="text-white/50 text-sm">/ {totalTables}</p>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5 mt-3 overflow-hidden">
                      <div className="bg-[#dec1b3] h-1.5 rounded-full" style={{ width: `${capacityPercent}%` }}></div>
                    </div>
                    <p className="text-[10px] text-white/50 mt-1.5 text-right">{capacityPercent}% Capacity</p>
                  </div>
                </div>

                {/* Metric 4 */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 shadow-md hover:shadow-lg transition-all flex flex-col justify-between min-h-[140px]">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xs font-semibold text-white/70 tracking-wider uppercase">New Reviews</h3>
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#dec1b3]">
                      <span className="material-symbols-outlined text-lg">star</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-white">{cafe.totalReviews || 0}</p>
                    <div className="flex items-center gap-1 mt-1.5">
                      <div className="flex text-[#f0bd8b]">
                        {Array.from({ length: 5 }).map((_, i) => {
                          const rating = cafe.averageRating || 0;
                          if (i < Math.floor(rating)) {
                            return <span key={i} className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>;
                          } else if (i === Math.floor(rating) && rating % 1 >= 0.5) {
                            return <span key={i} className="material-symbols-outlined text-xs">star_half</span>;
                          } else {
                            return <span key={i} className="material-symbols-outlined text-xs">star</span>;
                          }
                        })}
                      </div>
                      <span className="text-[10px] text-white/70 font-semibold ml-1">{(cafe.averageRating || 0).toFixed(1)} Avg</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Overview Secondary Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Timeline Preview */}
                <div className="lg:col-span-2 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 shadow-md overflow-hidden flex flex-col">
                  <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h3 className="font-bold text-lg text-white">Timeline Preview</h3>
                    <button onClick={() => handleTabChange('reservations')} className="text-xs text-[#dec1b3] font-semibold hover:underline flex items-center gap-1">
                      Full Calendar <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </div>
                  <div className="p-6 flex-1 overflow-x-auto">
                    <div className="min-w-[600px] relative">
                      
                      {/* Timeline Header */}
                      <div className="flex text-[10px] font-bold tracking-wider text-white/50 mb-6 ml-[80px] uppercase">
                        {Array.from({ length: 8 }).map((_, i) => (
                          <div key={i} className="flex-1 text-center relative">
                            <span className="absolute -translate-x-1/2">{i + 8}:00 AM</span>
                          </div>
                        ))}
                      </div>

                      {/* Timeline Rows */}
                      <div className="space-y-4 relative">
                        {/* Vertical Grid Lines */}
                        <div className="absolute inset-y-0 left-[80px] right-0 flex pointer-events-none">
                          {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="flex-1 border-l border-white/5 border-dashed first:border-none"></div>
                          ))}
                        </div>

                        {tables.length === 0 ? (
                          <div className="py-8 text-center text-white/40 text-sm pl-[80px]">
                            No tables registered to display.
                          </div>
                        ) : (
                          tables.slice(0, 5).map((table) => {
                            const tableBookingsToday = todayReservations.filter(b => b.tableId === table.id);
                            
                            return (
                              <div key={table.id} className="flex items-center gap-4 relative z-10">
                                <div className="w-16 text-xs font-bold text-white/60 flex items-center gap-1 shrink-0 truncate">
                                  <span className="material-symbols-outlined text-sm text-[#dec1b3]">deck</span> 
                                  <span>{table.name}</span>
                                </div>
                                <div className="flex-1 relative h-10 bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                                  {tableBookingsToday.map(b => {
                                    const startDec = timeToDecimal(b.startTime);
                                    const endDec = timeToDecimal(b.endTime);
                                    
                                    // Map startDec/endDec into timeline range (8.0 to 15.0/22.0)
                                    // Let's use 8:00 AM to 4:00 PM as standard 8 column blocks
                                    const left = Math.max(0, ((startDec - 8.0) / 8.0) * 100);
                                    const width = Math.min(100 - left, ((endDec - startDec) / 8.0) * 100);
                                    
                                    if (left >= 100 || width <= 0) return null;

                                    return (
                                      <div
                                        key={b.id}
                                        className="absolute h-full bg-[#3c2a21]/80 hover:bg-[#3c2a21] border border-white/20 rounded-lg p-2 flex items-center gap-2 overflow-hidden shadow-sm transition-colors cursor-pointer"
                                        style={{ left: `${left}%`, width: `${width}%` }}
                                        onClick={() => handleTabChange('reservations')}
                                        title={`${b.customer?.name} (Party of ${b.partySize})`}
                                      >
                                        <div className="w-5 h-5 rounded-full bg-white/15 text-[10px] font-bold flex items-center justify-center text-white">
                                          {getInitials(b.customer?.name)}
                                        </div>
                                        <span className="text-[10px] font-semibold text-white truncate">
                                          {b.customer?.name} ({b.partySize})
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 shadow-md flex flex-col h-full overflow-hidden">
                  <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h3 className="font-bold text-lg text-white">Recent Bookings</h3>
                    <span className="text-[10px] font-bold text-white/50 tracking-wider uppercase">Today</span>
                  </div>
                  <div className="flex-grow p-4 overflow-y-auto max-h-[300px]">
                    {recentActivity.length === 0 ? (
                      <p className="text-center text-white/40 text-sm py-12">No recent reservation activity.</p>
                    ) : (
                      <ul className="flex flex-col gap-2">
                        {recentActivity.map(b => (
                          <li key={b.id} onClick={() => handleTabChange('reservations')} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer border border-transparent hover:border-white/10">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white font-bold text-xs">
                                {getInitials(b.customer?.name)}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-white">{b.customer?.name}</p>
                                <p className="text-[10px] text-white/50 flex items-center gap-1 mt-0.5">
                                  <span className="material-symbols-outlined text-[10px]">group</span> 
                                  <span>{b.partySize} guests • {b.startTime}</span>
                                </p>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 bg-white/10 text-white font-bold text-[9px] uppercase tracking-wider rounded border border-white/15">
                              {b.status}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- 2. RESERVATIONS TAB --- */}
          {activeTab === 'reservations' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Reservations Manager</h2>
                  <p className="text-white/60 text-sm mt-1">Review guest bookings and update completion/no-show statuses.</p>
                </div>
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
                  className="px-4 py-2 border border-white/10 hover:bg-white/5 text-white rounded-xl font-semibold text-xs cursor-pointer transition-colors flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span> Refresh
                </button>
              </div>

              {reservationsLoading ? (
                <div className="py-20 text-center text-white/40 text-sm">Loading bookings list…</div>
              ) : reservations.length === 0 ? (
                <div className="py-20 text-center bg-white/5 rounded-xl border border-white/10 border-dashed">
                  <p className="text-white/50 text-sm">No reservations yet for this café.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {reservations.map(b => {
                    const STATUS_STYLES = {
                      CONFIRMED:  { bg: 'bg-green-500/10 border-green-500/20 text-green-400' },
                      CANCELLED:  { bg: 'bg-white/5 border-white/10 text-white/50' },
                      NO_SHOW:    { bg: 'bg-pink-500/10 border-pink-500/20 text-pink-400' },
                      COMPLETED:  { bg: 'bg-blue-500/10 border-blue-500/20 text-blue-400' },
                      HELD:       { bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
                    };
                    const sc = STATUS_STYLES[b.status] || { bg: 'bg-white/5 border-white/10 text-white/60' };
                    const isUpdating = updatingId === b.id;

                    async function handleStatusUpdate(newStatus) {
                      try {
                        setUpdatingId(b.id);
                        const updated = await updateBookingStatus(b.id, newStatus, token);
                        setReservations(prev => prev.map(r => r.id === b.id ? { ...r, ...updated } : r));
                        toast.success(`Booking marked as ${newStatus.toLowerCase().replace('_', '-')}.`);
                      } catch (err) {
                        toast.error(err.response?.data?.error || 'Failed to update status.');
                      } finally {
                        setUpdatingId(null);
                      }
                    }

                    return (
                      <div key={b.id} className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col justify-between gap-4 shadow-sm">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <p className="font-bold text-base text-white">{b.customer?.name}</p>
                            <p className="text-xs text-white/50 mt-0.5">{b.customer?.email}</p>
                          </div>
                          <span className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${sc.bg}`}>
                            {b.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs text-white/70 border-t border-b border-white/5 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm text-[#dec1b3]">calendar_today</span>
                            <span>{new Date(b.bookingDate).toLocaleDateString('en-IN', { dateStyle: 'medium', timeZone: 'UTC' })}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm text-[#dec1b3]">schedule</span>
                            <span>{b.startTime} – {b.endTime}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm text-[#dec1b3]">deck</span>
                            <span className="truncate">{b.table?.name} ({b.table?.zone})</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm text-[#dec1b3]">group</span>
                            <span>{b.partySize} Guests</span>
                          </div>
                        </div>

                        {b.status === 'CONFIRMED' && (
                          <div className="flex gap-2">
                            <button
                              disabled={isUpdating}
                              onClick={() => handleStatusUpdate('COMPLETED')}
                              className="flex-1 py-2 font-semibold text-xs bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors cursor-pointer"
                            >
                              {isUpdating ? '…' : 'Mark Completed'}
                            </button>
                            <button
                              disabled={isUpdating}
                              onClick={() => handleStatusUpdate('NO_SHOW')}
                              className="flex-1 py-2 font-semibold text-xs bg-pink-500/10 border border-pink-500/20 hover:bg-pink-500/20 text-pink-400 rounded-lg transition-colors cursor-pointer"
                            >
                              {isUpdating ? '…' : 'Mark No-Show'}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* --- 3. TABLES TAB --- */}
          {activeTab === 'tables' && user?.role === 'CAFE_ADMIN' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Tables Inventory</h2>
                  <p className="text-white/60 text-sm mt-1">Manage seating capacity, zoning, and availability status.</p>
                </div>
                <button
                  onClick={openAddTable}
                  className="px-4 py-2 bg-white text-black hover:opacity-90 rounded-xl font-bold text-xs cursor-pointer transition-opacity"
                >
                  + Add Table
                </button>
              </div>

              {tables.length === 0 ? (
                <div className="py-20 text-center bg-white/5 rounded-xl border border-white/10 border-dashed">
                  <p className="text-white/50 text-sm">No tables registered yet. Create a table to start taking bookings!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tables.map((table) => (
                    <div key={table.id} className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col justify-between gap-4 shadow-sm hover:border-white/20 transition-all">
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-bold text-lg text-white">{table.name}</h3>
                          <span className="text-[10px] font-bold bg-white/10 px-2.5 py-0.5 rounded uppercase text-white/80">
                            {table.zone}
                          </span>
                        </div>
                        <p className="text-xs text-white/60 min-h-[40px] leading-relaxed mb-4">
                          {table.description || 'No description provided.'}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-white/50">
                          <span className="material-symbols-outlined text-sm text-[#dec1b3]">group</span>
                          <span>Capacity: <strong className="text-white">{table.capacity} seats</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-2">
                        <button
                          onClick={() => handleToggleActive(table)}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                            table.isActive 
                              ? 'bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20' 
                              : 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20'
                          }`}
                        >
                          {table.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </button>

                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditTable(table)}
                            className="px-3 py-1.5 border border-white/10 hover:bg-white/5 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteTable(table.id)}
                            className="px-3 py-1.5 border border-red-500/20 hover:bg-red-500/10 text-red-400 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
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
                <div className="fixed inset-0 bg-black/70 display grid place-items-center z-50 p-4 backdrop-blur-sm">
                  <div className="w-full max-w-md bg-[#1e1e24] border border-white/10 p-8 rounded-xl shadow-xl space-y-6">
                    <h3 className="font-bold text-xl text-white">
                      {editingTable ? 'Edit Table Settings' : 'Add New Table'}
                    </h3>

                    {tableError && <p className="p-3 text-xs text-error bg-red-950/40 border border-red-900/50 rounded-xl font-medium">{tableError}</p>}

                    <form onSubmit={handleTableSubmit} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-white/70 uppercase tracking-wider block" htmlFor="tbl-name">Table Label / Number</label>
                        <input
                          id="tbl-name"
                          type="text"
                          required
                          value={tableForm.name}
                          onChange={(e) => setTableForm((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g. Table 4, Window Booth"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-[#dec1b3]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-white/70 uppercase tracking-wider block" htmlFor="tbl-capacity">Capacity (Seats)</label>
                          <input
                            id="tbl-capacity"
                            type="number"
                            required
                            min="1"
                            value={tableForm.capacity}
                            onChange={(e) => setTableForm((prev) => ({ ...prev, capacity: parseInt(e.target.value) || 2 }))}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-[#dec1b3]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-white/70 uppercase tracking-wider block" htmlFor="tbl-zone">Zone</label>
                          <select
                            id="tbl-zone"
                            value={tableForm.zone}
                            onChange={(e) => setTableForm((prev) => ({ ...prev, zone: e.target.value }))}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-[#dec1b3] cursor-pointer appearance-none"
                          >
                            {TABLE_ZONES.map((zone) => (
                              <option key={zone} value={zone} className="bg-[#1e1e24]">{zone}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-white/70 uppercase tracking-wider block" htmlFor="tbl-desc">Description</label>
                        <textarea
                          id="tbl-desc"
                          required
                          value={tableForm.description}
                          onChange={(e) => setTableForm((prev) => ({ ...prev, description: e.target.value }))}
                          placeholder="Describe seating highlights..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-[#dec1b3] min-h-[80px] font-sans resize-y"
                        />
                      </div>

                      <div className="flex gap-3 justify-end pt-4">
                        <button
                          type="button"
                          onClick={() => setShowTableForm(false)}
                          className="px-5 py-2.5 border border-white/10 hover:bg-white/5 text-white font-semibold text-xs rounded-lg cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={tableActionLoading}
                          className="px-5 py-2.5 bg-white text-black hover:opacity-90 font-bold text-xs rounded-lg cursor-pointer"
                        >
                          {tableActionLoading ? 'Saving...' : editingTable ? 'Save Changes' : 'Create Table'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --- 4. OPERATING HOURS TAB --- */}
          {activeTab === 'hours' && user?.role === 'CAFE_ADMIN' && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 md:p-8 space-y-6 shadow-sm">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Operating Hours</h2>
                <p className="text-white/60 text-sm mt-1">Adjust weekly open and close schedules. Set custom days to closed.</p>
              </div>

              <form onSubmit={handleHoursSubmit} className="space-y-6">
                <div className="space-y-4 bg-white/5 border border-white/10 rounded-xl p-5 md:p-6">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day} className="grid grid-cols-1 sm:grid-cols-[120px_1fr_1fr_100px] items-center gap-4 border-b border-white/5 last:border-0 pb-4 last:pb-0">
                      <span className="capitalize font-bold text-sm text-white tracking-wide">
                        {day}
                      </span>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/50 uppercase font-semibold w-10">Open:</span>
                        <input
                          type="text"
                          disabled={hours[day]?.closed}
                          value={hours[day]?.open || '08:00'}
                          onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                          placeholder="09:00"
                          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none w-24 disabled:opacity-40"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/50 uppercase font-semibold w-10">Close:</span>
                        <input
                          type="text"
                          disabled={hours[day]?.closed}
                          value={hours[day]?.close || '22:00'}
                          onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                          placeholder="22:00"
                          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none w-24 disabled:opacity-40"
                        />
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer text-xs text-white/70 select-none">
                        <input
                          type="checkbox"
                          checked={hours[day]?.closed || false}
                          onChange={(e) => handleHoursChange(day, 'closed', e.target.checked)}
                          className="text-white border-white/15 bg-white/5 rounded cursor-pointer h-4 w-4"
                        />
                        <span>Closed</span>
                      </label>
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={hoursLoading}
                  className="px-6 py-3 bg-white text-black hover:opacity-90 font-bold text-xs rounded-lg cursor-pointer transition-opacity"
                >
                  {hoursLoading ? 'Saving Hours...' : 'Save Weekly Schedule'}
                </button>
              </form>
            </div>
          )}

          {/* --- 5. STAFF TAB --- */}
          {activeTab === 'staff' && user?.role === 'CAFE_ADMIN' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Staff Accounts</h2>
                  <p className="text-white/60 text-sm mt-1">Manage login credentials for your café staff members.</p>
                </div>
                <button
                  onClick={() => {
                    setStaffForm({ name: '', email: '', password: '' });
                    setStaffError('');
                    setShowStaffForm(true);
                  }}
                  className="px-4 py-2 bg-white text-black hover:opacity-90 rounded-xl font-bold text-xs cursor-pointer transition-opacity"
                >
                  + Add Staff Account
                </button>
              </div>

              {staffLoading ? (
                <div className="py-20 text-center text-white/40 text-sm">Loading staff members…</div>
              ) : staffList.length === 0 ? (
                <div className="py-20 text-center bg-white/5 rounded-xl border border-white/10 border-dashed">
                  <p className="text-white/50 text-sm">No staff members registered yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {staffList.map(s => {
                    async function handleDeleteStaff() {
                      if (!window.confirm(`Are you sure you want to remove staff member: ${s.user.name}?`)) return;
                      try {
                        await deleteStaffUser(cafe.id, s.id, token);
                        setStaffList(prev => prev.filter(item => item.id !== s.id));
                        toast.success(`Removed staff member: ${s.user.name}`);
                      } catch (err) {
                        toast.error(err.response?.data?.error || 'Failed to remove staff.');
                      }
                    }

                    return (
                      <div key={s.id} className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center justify-between gap-4 shadow-sm">
                        <div>
                          <p className="font-bold text-sm text-white">{s.user.name}</p>
                          <p className="text-xs text-white/50 mt-1">{s.user.email}</p>
                        </div>
                        <button
                          onClick={handleDeleteStaff}
                          className="px-3 py-1.5 border border-red-500/20 hover:bg-red-500/10 text-red-400 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Staff Form Modal */}
              {showStaffForm && (
                <div className="fixed inset-0 bg-black/70 display grid place-items-center z-50 p-4 backdrop-blur-sm">
                  <div className="w-full max-w-md bg-[#1e1e24] border border-white/10 p-8 rounded-xl shadow-xl space-y-6">
                    <h3 className="font-bold text-xl text-white">Register Staff User</h3>
                    
                    {staffError && <p className="p-3 text-xs text-error bg-red-950/40 border border-red-900/50 rounded-xl font-medium">{staffError}</p>}

                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      setStaffError('');
                      setStaffActionLoading(true);
                      try {
                        const newStaff = await addStaffUser(cafe.id, staffForm, token);
                        setStaffList(prev => [...prev, newStaff]);
                        toast.success(`Registered staff member: ${newStaff.user.name}`);
                        setShowStaffForm(false);
                      } catch (err) {
                        setStaffError(err.response?.data?.error || 'Failed to register staff.');
                      } finally {
                        setStaffActionLoading(false);
                      }
                    }} className="space-y-4">
                      <div className="space-y-1">
                        <label htmlFor="staff-name" className="text-xs font-bold text-white/70 uppercase tracking-wider block">Full Name</label>
                        <input id="staff-name" type="text" required value={staffForm.name} onChange={e => setStaffForm(p => ({ ...p, name: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-[#dec1b3]" />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="staff-email" className="text-xs font-bold text-white/70 uppercase tracking-wider block">Email Address</label>
                        <input id="staff-email" type="email" required value={staffForm.email} onChange={e => setStaffForm(p => ({ ...p, email: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-[#dec1b3]" />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="staff-password" className="text-xs font-bold text-white/70 uppercase tracking-wider block">Password</label>
                        <input id="staff-password" type="password" required minLength={6} value={staffForm.password} onChange={e => setStaffForm(p => ({ ...p, password: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-[#dec1b3]" />
                      </div>

                      <div className="flex gap-3 justify-end pt-4">
                        <button type="button" onClick={() => setShowStaffForm(false)} className="px-5 py-2.5 border border-white/10 hover:bg-white/5 text-white font-semibold text-xs rounded-lg cursor-pointer">Cancel</button>
                        <button type="submit" disabled={staffActionLoading} className="px-5 py-2.5 bg-white text-black hover:opacity-90 font-bold text-xs rounded-lg cursor-pointer">
                          {staffActionLoading ? 'Registering…' : 'Register'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --- 6. PROFILE TAB --- */}
          {activeTab === 'profile' && user?.role === 'CAFE_ADMIN' && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 md:p-8 space-y-6 shadow-sm">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Café Settings</h2>
                <p className="text-white/60 text-sm mt-1">Manage the public profile representation of your café.</p>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="space-y-4 bg-white/5 border border-white/10 rounded-xl p-5 md:p-6">
                  <div className="space-y-1">
                    <label htmlFor="prof-name" className="text-xs font-bold text-white/70 uppercase tracking-wider block">Café Name</label>
                    <input
                      id="prof-name"
                      name="name"
                      type="text"
                      required
                      value={profileForm.name}
                      onChange={handleProfileChange}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-[#dec1b3]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="prof-desc" className="text-xs font-bold text-white/70 uppercase tracking-wider block">Description</label>
                    <textarea
                      id="prof-desc"
                      name="description"
                      required
                      minLength={10}
                      value={profileForm.description}
                      onChange={handleProfileChange}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-[#dec1b3] min-h-[120px] font-sans resize-y"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label htmlFor="prof-city" className="text-xs font-bold text-white/70 uppercase tracking-wider block">City</label>
                      <input
                        id="prof-city"
                        name="city"
                        type="text"
                        required
                        value={profileForm.city}
                        onChange={handleProfileChange}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-[#dec1b3]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="prof-area" className="text-xs font-bold text-white/70 uppercase tracking-wider block">Area/Neighborhood</label>
                      <input
                        id="prof-area"
                        name="area"
                        type="text"
                        required
                        value={profileForm.area}
                        onChange={handleProfileChange}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-[#dec1b3]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="prof-address" className="text-xs font-bold text-white/70 uppercase tracking-wider block">Location Address</label>
                    <input
                      id="prof-address"
                      name="location"
                      type="text"
                      required
                      value={profileForm.location}
                      onChange={handleProfileChange}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-[#dec1b3]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label htmlFor="prof-lat" className="text-xs font-bold text-white/70 uppercase tracking-wider block">Latitude</label>
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
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-[#dec1b3]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="prof-lng" className="text-xs font-bold text-white/70 uppercase tracking-wider block">Longitude</label>
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
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-[#dec1b3]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 items-center pt-4">
                    <div className="height-[120px] aspect-video md:w-[200px] bg-white/5 rounded-xl overflow-hidden border border-white/10 relative flex items-center justify-center">
                      {coverPhoto ? (
                        <img
                          src={URL.createObjectURL(coverPhoto)}
                          alt="Cover Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : cafe.coverPhotoUrl ? (
                        <img
                          src={cafe.coverPhotoUrl}
                          alt={cafe.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-white/30">No cover photo</span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="prof-cover" className="text-xs font-bold text-white/70 uppercase tracking-wider block">Change Cover Photo</label>
                      <input
                        id="prof-cover"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            setCoverPhoto(e.target.files[0]);
                          }
                        }}
                        className="text-xs text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 file:cursor-pointer"
                      />
                      <p className="text-[10px] text-white/40">Leave empty if you do not wish to modify the cover image.</p>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={profileLoading}
                  className="px-6 py-3 bg-white text-black hover:opacity-90 font-bold text-xs rounded-lg cursor-pointer transition-opacity"
                >
                  {profileLoading ? 'Saving settings...' : 'Save Profile Changes'}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default CafeDashboardPage;
