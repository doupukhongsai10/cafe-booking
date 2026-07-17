import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { listCafes } from '../services/cafe.service';
import { placeHold, confirmHold } from '../services/booking.service';
import { useToast } from '../store/ToastContext';
import { getCafeReviews } from '../services/review.service';
import { useSocket } from '../hooks/useSocket';

const ZONE_LABELS = { INDOOR: 'Indoor', OUTDOOR: 'Outdoor', ROOFTOP: 'Rooftop', PRIVATE: 'Private' };
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday'
};

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
  const { token, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [cafe, setCafe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

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
  }, [id, navigate]);

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
  }, [hold, toast]);

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
      navigate('/home', { state: { confirmed: true } });
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to confirm booking.';
      setFormError(msg);
      toast.error(msg);
      setConfirming(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-on-surface-variant font-medium">Loading café details…</p>
      </main>
    );
  }

  if (!cafe) return null;

  // Minimum date = today
  const todayStr = new Date().toISOString().split('T')[0];

  // Gallery images with fallbacks
  const mainCoverImage = cafe.coverPhotoUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBnDEwkbxKsDN4ldZA8ApQYnV06nI_06xs11TZWEF6aVqzl7YWljVHkz0IyoECCAaI7Fb-H2ikIWrdDlM5LMvQDPDuXEADpj-yXvSDhrBkD5zmzHLXll8Wf_aveZ0H2QxrDX9gfYpmxl82So3ETjn632ld3gRndw64PCaslm3mnx4tQZ4lFW7jT_uSntyxuycjmuh3A-kSYCGBsqaBjtBMmPoIV9_H50QrNrwas79kBWZxFLCKFy9lAQBTMZ8zaQrDdjK88qwo4U28';
  const sidePhoto1 = (cafe.photos && cafe.photos[0]) || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBw8tscr8vQJZTUvq_MnctIPTVO22RsuLrHtIUyFhpKF_dYHTzf5rpnzGJ3zWAZ2pVs828JDpcnuso6xdjN0IcatUENpCIYLvsEU9BYoA5pCemBF_UfV6tp2Eng5-z-cXRNhTbeUpLsTbsyB9WowHUTzFeE9gTX7kzdU1_jCANmiU6tXCNMnScPLlQaU6NKmga4WhOEHtp5fYjqINvY32iv5gejyRZ-Gb8MCn_n7j2D92YhVs0EkuOdwQwUQOa2EaTsyQcjv6lej1w';
  const sidePhoto2 = (cafe.photos && cafe.photos[1]) || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCQj-4cNYL53xD7PRAOIu2VkQdEFAvkJt1udmaQ_Q0suG8Rlvtgt2oJ1A5-x1iXptXsHt0UmzQA_yyslqrVnnK7rh0AxqHUS6-Uf5k0VhYxr06C3FQ3F8Mfo2YL4l_42APEHJNCW1ccNze0ro_EHuLLo1zG1y0HMc_m75GuWwozLUONJt03PQ4XXQ26dOrqWSvOK60F8DIdwqIvtcrt9LJL2mFBeU7we7QJbOXOVCZdHbLQ6SfXg8NFe-fRY66Fhz7MckxJ7qb-eSA';

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      {/* TopNavBar */}
      <nav className="bg-white/80 backdrop-blur-xl sticky top-0 border-b border-outline-variant/30 shadow-sm z-50 transition-all duration-300">
        <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-4 max-w-container-max mx-auto z-50">
          <div className="flex items-center gap-gutter">
            <Link to="/" className="font-bold text-title-lg text-primary tracking-tight">
              CafeReserve
            </Link>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => navigate('/cafes')} className="text-primary font-semibold border-b-2 border-primary pb-1">
              Explore
            </button>
            <button onClick={() => toast.info('Concierge Desk is coming soon!')} className="text-on-surface-variant hover:text-primary transition-colors">
              Concierge
            </button>
            <button onClick={() => toast.info('CafeReserve connects coffee enthusiasts with boutique cafes.')} className="text-on-surface-variant hover:text-primary transition-colors">
              About
            </button>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <button onClick={() => navigate('/home')} className="px-4 py-2 font-semibold text-primary bg-transparent border border-outline rounded-lg hover:bg-surface-container-low transition-colors">
                  My Dashboard
                </button>
                <button onClick={async () => { await logout(); toast.success('Logged out!'); navigate('/'); }} className="px-4 py-2 text-white bg-primary rounded-lg hover:opacity-90 transition-opacity">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('/login')} className="hidden md:inline-flex px-4 py-2 font-semibold text-primary bg-transparent border border-outline rounded-lg hover:bg-surface-container-low transition-colors">
                  Log In
                </button>
                <button onClick={() => navigate('/register')} className="px-4 py-2 text-white bg-primary rounded-lg hover:opacity-90 transition-opacity">
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 flex flex-col gap-8">
        {/* Back link */}
        <button
          onClick={() => navigate('/cafes')}
          className="self-start text-primary font-semibold hover:opacity-85 transition-opacity flex items-center gap-1 text-sm"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span> Back to Exploration
        </button>

        {/* Hero Gallery */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-2 h-[320px] md:h-[420px] rounded-2xl overflow-hidden shadow-sm">
          <div className="md:col-span-2 relative h-full bg-surface-container-low">
            <img className="absolute inset-0 w-full h-full object-cover" alt={cafe.name} src={mainCoverImage} />
          </div>
          <div className="hidden md:flex flex-col gap-2 h-full">
            <div className="relative h-1/2 overflow-hidden bg-surface-container-low">
              <img className="absolute inset-0 w-full h-full object-cover" alt={`${cafe.name} gallery 1`} src={sidePhoto1} />
            </div>
            <div className="relative h-1/2 overflow-hidden bg-surface-container-low">
              <img className="absolute inset-0 w-full h-full object-cover" alt={`${cafe.name} gallery 2`} src={sidePhoto2} />
            </div>
          </div>
        </section>

        {/* Main Info Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Info, Tabs & Booking */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            {/* Header Description */}
            <div>
              <div className="flex justify-between items-start mb-2 gap-4">
                <h1 className="text-3xl md:text-4xl font-bold text-primary tracking-tight leading-tight">
                  {cafe.name}
                </h1>
                <div className="flex items-center gap-1 bg-surface-container px-3 py-1 rounded-full shrink-0">
                  <span className="material-symbols-outlined text-secondary fill-current text-sm">star</span>
                  <span className="font-bold text-sm text-on-surface">
                    {cafe.averageRating ? cafe.averageRating.toFixed(1) : '0.0'}
                  </span>
                </div>
              </div>
              <p className="text-sm text-on-surface-variant font-medium mb-4">
                📍 {cafe.area}, {cafe.city}
              </p>
              <p className="text-sm md:text-base text-on-surface-variant leading-relaxed">
                {cafe.description}
              </p>
            </div>

            {/* Tabs & Content Area */}
            <div className="bg-white/80 backdrop-blur-md border border-outline-variant/30 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
              {/* Tab Headers */}
              <div className="flex gap-6 border-b border-outline-variant/30 pb-2 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`text-sm md:text-base font-semibold pb-1 transition-all ${
                    activeTab === 'overview' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('amenities')}
                  className={`text-sm md:text-base font-semibold pb-1 transition-all ${
                    activeTab === 'amenities' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  Amenities
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`text-sm md:text-base font-semibold pb-1 transition-all ${
                    activeTab === 'reviews' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  Reviews ({reviews.length})
                </button>
              </div>

              {/* Tab Contents */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Hours */}
                  <div className="flex flex-col gap-2">
                    <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Operating Hours</h3>
                    <ul className="text-sm text-on-surface space-y-2">
                      {DAYS.map((day) => {
                        const hr = cafe.operatingHours?.[day];
                        return (
                          <li key={day} className="flex justify-between border-b border-outline-variant/10 pb-1">
                            <span className="capitalize">{DAY_LABELS[day]}</span>
                            <span className="font-semibold">
                              {hr && !hr.closed ? `${hr.open} – ${hr.close}` : 'Closed'}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  {/* Summary */}
                  <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Key Rules</h3>
                    <ul className="text-sm text-on-surface-variant space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-secondary text-base mt-0.5">lock_clock</span>
                        <span>Holds are active for 5 minutes only.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-secondary text-base mt-0.5">warning</span>
                        <span>Cancellations are blocked within 20 minutes of start time.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-secondary text-base mt-0.5">rate_review</span>
                        <span>Reviews are limited to completed customer reservations.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'amenities' && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Cafe Amenities</h3>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="flex items-center gap-2 text-sm text-on-surface">
                      <span className="material-symbols-outlined text-secondary">wifi</span> High-Speed WiFi
                    </div>
                    <div className="flex items-center gap-2 text-sm text-on-surface">
                      <span className="material-symbols-outlined text-secondary">power</span> Outlets Available
                    </div>
                    <div className="flex items-center gap-2 text-sm text-on-surface">
                      <span className="material-symbols-outlined text-secondary">music_note</span> Curated Lofi Playlists
                    </div>
                    <div className="flex items-center gap-2 text-sm text-on-surface">
                      <span className="material-symbols-outlined text-secondary">air</span> Air Conditioned
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Ratings & Comments</h3>
                  </div>
                  {reviewsLoading ? (
                    <p className="text-xs text-on-surface-variant">Loading reviews…</p>
                  ) : reviews.length === 0 ? (
                    <p className="text-sm text-on-surface-variant italic">No reviews yet for this café. Submit your rating after your next completed booking!</p>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {reviews.map((r) => (
                        <div key={r.id} className="bg-background p-4 rounded-xl border border-outline-variant/30 flex flex-col gap-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-primary">{r.customer?.name}</span>
                            <span className="text-on-surface-variant">{new Date(r.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                          </div>
                          <div className="text-secondary text-sm font-semibold tracking-wide">
                            {'★'.repeat(r.rating) + '☆'.repeat(5 - r.rating)}
                          </div>
                          <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed">{r.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Available Tables Section */}
            <div>
              <h2 className="text-2xl font-bold text-primary mb-4">Available Tables</h2>

              {/* Hold Confirmation Panel (Overlay/Replacement) */}
              {hold ? (
                <div className={`p-6 rounded-2xl border text-center transition-all ${
                  countdown > 60000 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
                }`}>
                  <p className="text-xs font-bold text-on-surface-variant tracking-wider uppercase mb-1">TABLE HELD</p>
                  <p className={`text-5xl font-black mb-1 ${countdown > 60000 ? 'text-green-800' : 'text-amber-800'}`}>
                    {formatCountdown(countdown)}
                  </p>
                  <p className="text-xs text-on-surface-variant mb-6">Confirm within this window or your hold will expire</p>

                  <div className="bg-white rounded-xl p-4 mb-6 text-left text-xs md:text-sm text-on-surface-variant shadow-sm border border-outline-variant/10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-medium">
                      <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-base">store</span> <strong>{cafe.name}</strong></div>
                      <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-base">chair</span> {selectedTable?.name} · {ZONE_LABELS[selectedTable?.zone] || selectedTable?.zone}</div>
                      <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-base">calendar_today</span> {new Date(bookingDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</div>
                      <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-base">schedule</span> {startTime} – {endTime}</div>
                      <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-base">group</span> Party of {partySize} guests</div>
                    </div>
                  </div>

                  {formError && <p className="text-sm text-error font-medium mb-4">{formError}</p>}

                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => { clearInterval(timerRef.current); setHold(null); setFormError(''); }}
                      className="px-6 py-3 border border-outline-variant rounded-xl font-bold text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors"
                    >
                      Cancel Hold
                    </button>
                    <button
                      onClick={handleConfirm}
                      disabled={confirming || countdown <= 0}
                      className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {confirming ? 'Confirming…' : 'Confirm Reservation ✓'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {cafe.tables?.length === 0 ? (
                    <p className="text-sm text-on-surface-variant italic">No tables registered yet for this café.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(cafe.tables || []).map((table) => {
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
                            className={`bg-white rounded-2xl p-5 border transition-all duration-300 relative overflow-hidden flex flex-col gap-2 cursor-pointer ${
                              isRealTimeUnavailable
                                ? 'bg-neutral-50 border-outline-variant/20 opacity-60 cursor-not-allowed'
                                : isSelected
                                ? 'border-primary shadow-md ring-2 ring-primary/5'
                                : 'border-outline-variant/30 hover:shadow-md'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-lg font-bold text-primary">{table.name}</h3>
                                <p className="text-xs text-on-surface-variant">{ZONE_LABELS[table.zone] || table.zone} Seat</p>
                              </div>
                              {isRealTimeUnavailable ? (
                                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider">
                                  HELD/BOOKED
                                </span>
                              ) : (
                                <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider">
                                  Available
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-on-surface-variant text-xs mt-2">
                              <span className="material-symbols-outlined text-base">group</span>
                              <span>Up to {table.capacity} Guests</span>
                            </div>
                            {!isRealTimeUnavailable && (
                              <button className={`mt-3 w-full font-semibold text-sm py-2.5 rounded-xl transition-all active:scale-95 ${
                                isSelected ? 'bg-secondary text-white' : 'bg-primary text-white'
                              }`}>
                                {isSelected ? 'Selected' : 'Reserve Now'}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Booking Inputs overlay card */}
                  {selectedTable && (
                    <form
                      onSubmit={handlePlaceHold}
                      className="mt-6 bg-white border border-outline-variant/30 rounded-2xl p-6 shadow-sm flex flex-col gap-4"
                    >
                      <div className="flex justify-between items-center border-b border-outline-variant/10 pb-2">
                        <h3 className="text-lg font-bold text-primary">Configure booking for {selectedTable.name}</h3>
                        <button
                          type="button"
                          onClick={() => setSelectedTable(null)}
                          className="text-on-surface-variant hover:text-primary text-xs font-semibold"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-on-surface-variant block mb-1">Booking Date</label>
                          <input
                            type="date"
                            min={todayStr}
                            value={bookingDate}
                            onChange={(e) => setBookingDate(e.target.value)}
                            required
                            className="w-full px-3 py-2.5 rounded-xl border border-outline-variant/30 text-sm focus:ring-primary focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-on-surface-variant block mb-1">Party Size (Max {selectedTable.capacity})</label>
                          <input
                            type="number"
                            min={1}
                            max={selectedTable.capacity}
                            value={partySize}
                            onChange={(e) => setPartySize(e.target.value)}
                            required
                            className="w-full px-3 py-2.5 rounded-xl border border-outline-variant/30 text-sm focus:ring-primary focus:border-primary"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-on-surface-variant block mb-1">Start Time</label>
                          <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            required
                            className="w-full px-3 py-2.5 rounded-xl border border-outline-variant/30 text-sm focus:ring-primary focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-on-surface-variant block mb-1">End Time</label>
                          <input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            required
                            className="w-full px-3 py-2.5 rounded-xl border border-outline-variant/30 text-sm focus:ring-primary focus:border-primary"
                          />
                        </div>
                      </div>

                      {formError && <p className="text-xs text-error font-medium">{formError}</p>}

                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm hover:opacity-95 transition-opacity disabled:opacity-50"
                      >
                        {submitting ? 'Placing hold…' : 'Place 5-Minute Hold'}
                      </button>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right Column: Sidebar Map & Location Panel */}
          <div className="flex flex-col gap-6">
            <div className="bg-white/85 backdrop-blur-md border border-outline-variant/30 rounded-2xl p-6 flex flex-col gap-4 shadow-sm lg:sticky lg:top-24">
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold text-primary">Location Details</h3>
                <p className="text-sm text-on-surface-variant flex items-start gap-2 leading-relaxed">
                  <span className="material-symbols-outlined text-secondary mt-0.5">location_on</span>
                  <span>
                    {cafe.location ? `${cafe.location},` : ''} <br />
                    {cafe.area}, <br />
                    {cafe.city}
                  </span>
                </p>
              </div>

              {/* Map Placeholder */}
              <div className="w-full h-48 rounded-xl overflow-hidden border border-outline-variant/30 relative bg-surface-container flex items-center justify-center">
                <div className="absolute inset-0 bg-secondary/5 opacity-50 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-secondary/10 animate-ping absolute"></div>
                </div>
                <div className="relative flex flex-col items-center gap-1 z-10">
                  <span className="material-symbols-outlined text-secondary text-4xl fill-current">location_on</span>
                  <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Cafe coordinates</span>
                  <span className="text-[9px] text-on-surface-variant font-semibold">Lat: {cafe.latitude?.toFixed(4)}, Lon: {cafe.longitude?.toFixed(4)}</span>
                </div>
              </div>

              {/* Get Directions Directions API link */}
              {cafe.latitude && cafe.longitude && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${cafe.latitude},${cafe.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full border-2 border-outline-variant text-primary font-bold text-sm py-2.5 rounded-xl hover:bg-surface-container-low transition-colors text-center flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">directions</span> Get Directions
                </a>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-highest border-t border-outline-variant/20 mt-auto py-8">
        <div className="w-full px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row justify-between items-center max-w-container-max mx-auto gap-4">
          <span className="font-bold text-lg text-primary">CafeReserve</span>
          <div className="flex flex-wrap justify-center gap-6">
            <button onClick={() => toast.info('Privacy policy is standard compliance.')} className="text-xs text-on-surface-variant hover:text-primary transition-colors">Privacy Policy</button>
            <button onClick={() => toast.info('Terms of Service govern usage boundaries.')} className="text-xs text-on-surface-variant hover:text-primary transition-colors">Terms of Service</button>
            <button onClick={() => toast.info('Cookie policy details.')} className="text-xs text-on-surface-variant hover:text-primary transition-colors">Cookie Policy</button>
            <button onClick={() => toast.info('Support email: support@cafereserve.com')} className="text-xs text-on-surface-variant hover:text-primary transition-colors">Support</button>
          </div>
          <p className="text-xs text-on-surface-variant">© 2026 CafeReserve SaaS Marketplace. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default CafeDetailPage;
