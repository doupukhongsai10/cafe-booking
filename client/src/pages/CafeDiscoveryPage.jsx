import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { listCafes } from '../services/cafe.service';
import { useToast } from '../store/ToastContext';

const ZONE_LABELS = { INDOOR: 'Indoor', OUTDOOR: 'Outdoor', ROOFTOP: 'Rooftop', PRIVATE: 'Private' };
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function getTodayHours(operatingHours) {
  const day = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
  const h = operatingHours?.[day];
  if (!h || h.closed) return 'Closed today';
  return `Today: ${h.open} – ${h.close}`;
}

function CafeDiscoveryPage() {
  const { token, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
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
    <div className="bg-background text-on-background min-h-screen flex flex-col">
      {/* TopNavBar */}
      <nav className="bg-white/80 backdrop-blur-xl sticky top-0 border-b border-outline-variant/30 shadow-sm z-50 transition-all duration-300">
        <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-4 max-w-container-max mx-auto z-50">
          <div className="flex items-center gap-gutter">
            <Link to="/" className="flex items-center gap-2 font-bold text-title-lg text-primary tracking-tight hover:opacity-85">
              <span className="material-symbols-outlined text-xl">home</span>
              <span>CafeReserve</span>
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
      <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 flex flex-col gap-6 animate-fade-in">
        {/* Header Title */}
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-primary tracking-tight">Discover Cafés</h1>
          <p className="text-sm text-on-surface-variant">Find the perfect aesthetic workspace or coffee corner in your city.</p>
        </div>

        {/* Search Input */}
        <div className="relative w-full max-w-xl">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input
            type="text"
            placeholder="Search by name, city, or area…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-outline-variant/30 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all"
          />
        </div>

        {/* Loading / Results Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant gap-2">
            <span className="material-symbols-outlined animate-spin text-3xl text-secondary">progress_activity</span>
            <p className="text-sm font-medium">Finding artisan spots...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant">sentiment_dissatisfied</span>
            <p className="text-sm text-on-surface-variant font-medium">No cafés found matching your search query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(cafe => (
              <div
                key={cafe.id}
                onClick={() => navigate(`/cafes/${cafe.id}`)}
                className="bg-white rounded-2xl border border-outline-variant/30 overflow-hidden cursor-pointer shadow-[0px_4px_20px_rgba(60,42,33,0.02)] hover:shadow-[0px_8px_24px_rgba(60,42,33,0.07)] hover:-translate-y-1 transition-all duration-300 flex flex-col group"
              >
                {/* Cover Photo */}
                <div className="h-48 overflow-hidden relative bg-neutral-100 shrink-0">
                  {cafe.coverPhotoUrl ? (
                    <img
                      src={cafe.coverPhotoUrl}
                      alt={cafe.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-xs font-semibold gap-1">
                      <span className="material-symbols-outlined text-base">image</span> No Photo
                    </div>
                  )}
                  {/* Rating Badge */}
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-on-surface flex items-center gap-0.5 shadow-sm">
                    <span className="material-symbols-outlined text-secondary fill-current text-[12px]">star</span>
                    {cafe.averageRating ? cafe.averageRating.toFixed(1) : '0.0'}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-grow gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-primary tracking-tight leading-snug group-hover:text-secondary transition-colors">
                      {cafe.name}
                    </h3>
                    <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                      📍 {cafe.area}, {cafe.city}
                    </p>
                  </div>

                  {/* Zones */}
                  <div className="flex gap-1.5 flex-wrap">
                    {[...new Set((cafe.tables || []).map(t => t.zone))].map(z => (
                      <span key={z} className="bg-surface-container-low text-on-surface-variant text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider">
                        {ZONE_LABELS[z] || z}
                      </span>
                    ))}
                  </div>

                  {/* Open details */}
                  <p className="text-xs text-on-surface-variant/80 font-medium mt-auto flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    <span>{getTodayHours(cafe.operatingHours)}</span>
                    <span className="text-outline-variant/30">•</span>
                    <span className="material-symbols-outlined text-sm">chair</span>
                    <span>{cafe.tables?.length || 0} tables</span>
                  </p>

                  <button className="w-full py-2.5 bg-primary text-white text-xs font-bold rounded-xl group-hover:bg-primary-container transition-colors mt-2 active:scale-95 duration-200">
                    Book a Table
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-highest border-t border-outline-variant/20 mt-auto py-8">
        <div className="w-full px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row justify-between items-center max-w-container-max mx-auto gap-4">
          <span className="font-bold text-lg text-primary">CafeReserve</span>
          <div className="flex flex-wrap justify-center gap-6">
            <button onClick={() => toast.info('Privacy policy details.')} className="text-xs text-on-surface-variant hover:text-primary transition-colors">Privacy Policy</button>
            <button onClick={() => toast.info('Terms of Service details.')} className="text-xs text-on-surface-variant hover:text-primary transition-colors">Terms of Service</button>
            <button onClick={() => toast.info('Cookie policy details.')} className="text-xs text-on-surface-variant hover:text-primary transition-colors">Cookie Policy</button>
            <button onClick={() => toast.info('Support email: support@cafereserve.com')} className="text-xs text-on-surface-variant hover:text-primary transition-colors">Support</button>
          </div>
          <p className="text-xs text-on-surface-variant">© 2026 CafeReserve SaaS Marketplace. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default CafeDiscoveryPage;
