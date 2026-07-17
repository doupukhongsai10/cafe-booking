import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { useToast } from '../store/ToastContext';

function LandingPage() {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [searchCity, setSearchCity] = useState('');
  const [partySize, setPartySize] = useState('2');
  const [bookingDate, setBookingDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info('Please log in or register to search and book tables!');
      navigate('/login');
      return;
    }
    const params = new URLSearchParams();
    if (searchCity) params.append('city', searchCity);
    if (partySize) params.append('partySize', partySize);
    if (bookingDate) params.append('date', bookingDate);
    navigate(`/cafes?${params.toString()}`);
  };

  const handleActionClick = (destination) => {
    if (!isAuthenticated) {
      toast.info('Please log in or register to access this page.');
      navigate('/login');
    } else {
      navigate(destination);
    }
  };

  const handleToastFeature = (featureName) => {
    toast.info(`${featureName} is coming soon in our mobile app release!`);
  };

  return (
    <div className="antialiased flex flex-col min-h-screen bg-background text-on-background">
      {/* TopNavBar */}
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 border-b border-outline-variant/30 shadow-sm z-50">
        <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-4 max-w-container-max mx-auto">
          <div className="flex items-center gap-gutter">
            <Link to="/" className="font-bold text-display-lg-mobile md:text-title-lg text-primary tracking-tight">
              <h1>CafeReserve</h1>
            </Link>
            <nav className="hidden md:flex gap-6 ml-8">
              <button
                onClick={() => handleActionClick('/cafes')}
                className="text-primary font-semibold hover:opacity-80 transition-opacity"
              >
                Explore
              </button>
              <button
                onClick={() => handleToastFeature('Concierge Desk')}
                className="text-on-surface-variant hover:text-primary transition-colors"
              >
                Concierge
              </button>
              <button
                onClick={() => toast.info('Aura Reserve: A premium multi-tenant café booking SaaS experience.')}
                className="text-on-surface-variant hover:text-primary transition-colors"
              >
                About
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => navigate('/home')}
                  className="px-4 py-2 font-semibold text-primary bg-transparent border border-outline rounded-lg hover:bg-surface-container-low transition-colors"
                >
                  My Dashboard
                </button>
                <button
                  onClick={async () => {
                    await logout();
                    toast.success('Logged out successfully!');
                    navigate('/');
                  }}
                  className="px-4 py-2 text-white bg-primary rounded-lg hover:opacity-90 transition-opacity"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="hidden md:inline-flex px-4 py-2 font-semibold text-primary bg-transparent border border-outline rounded-lg hover:bg-surface-container-low transition-colors"
                >
                  Log In
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-4 py-2 text-white bg-primary rounded-lg hover:opacity-90 transition-opacity"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative w-full h-[85vh] min-h-[600px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              alt="Modern airy cafe interior"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB0Ef9-1Ft7h9qF6FJJaOjmX4vunn95jCr9b5IC9FIvWcuoGVUJz8z1b6CDHI6HIyCvToQLHuRBgLZGzijKP5ck6E8nZynVA4eL7UDY2gQGRlpeZ8odSkKgwm2_x6qbopo0leZsibHVGM6mdHVBRPVRSII_nJTE6V7FloZIwYsvfMi0QZInhtTcLdswu9VtH0CiI2gdJ3ykTsfuiLadePMx8HozdrDT5iqyKso09yXLERfcrjJ6Hmz_hdG8iQCXDgHvtjU13dE4RWU"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-primary/30"></div>
          </div>
          <div className="relative z-10 w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop flex flex-col items-center text-center">
            <h1 className="text-white text-4xl md:text-6xl font-bold max-w-3xl mb-8 drop-shadow-xl tracking-tight leading-tight">
              Your Perfect Table Awaits.
            </h1>
            <p className="text-white/90 text-lg md:text-xl mb-8 drop-shadow-md font-medium">
              Discover &amp; Reserve the best spots in town.
            </p>

            {/* Refined Search Bar Overlay */}
            <form
              onSubmit={handleSearch}
              className="w-full max-w-5xl bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-3 flex flex-col md:flex-row gap-3 items-center"
            >
              <div className="flex-1 w-full flex items-center bg-white/60 rounded-xl border border-outline-variant/30 px-4 py-3 focus-within:ring-2 focus-within:ring-secondary/20 transition-all">
                <span className="material-symbols-outlined text-secondary mr-3">location_on</span>
                <input
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  className="w-full bg-transparent border-none focus:ring-0 text-on-surface placeholder-on-surface-variant font-medium text-sm md:text-base outline-none"
                  placeholder="Which city or neighborhood? (e.g. Aizawl)"
                  type="text"
                />
              </div>

              <div className="w-px h-10 bg-outline-variant/30 hidden md:block"></div>

              <div className="flex-1 w-full flex items-center bg-white/60 rounded-xl border border-outline-variant/30 px-4 py-3">
                <span className="material-symbols-outlined text-secondary mr-3">calendar_today</span>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full bg-transparent border-none focus:ring-0 text-on-surface font-medium text-sm md:text-base outline-none cursor-pointer"
                />
              </div>

              <div className="w-px h-10 bg-outline-variant/30 hidden md:block"></div>

              <div className="flex-1 w-full flex items-center bg-white/60 rounded-xl border border-outline-variant/30 px-4 py-3">
                <span className="material-symbols-outlined text-secondary mr-3">group</span>
                <select
                  value={partySize}
                  onChange={(e) => setPartySize(e.target.value)}
                  className="w-full bg-transparent border-none focus:ring-0 text-on-surface font-medium text-sm md:text-base outline-none cursor-pointer"
                >
                  <option value="1">1 Person</option>
                  <option value="2">2 People</option>
                  <option value="4">4 People</option>
                  <option value="6">6 People</option>
                  <option value="8">8 People</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full md:w-auto bg-primary text-white px-8 py-4 rounded-xl flex items-center justify-center hover:opacity-95 transition-all active:scale-95 shadow-lg font-semibold whitespace-nowrap"
              >
                <span className="material-symbols-outlined mr-2">search</span>
                Find a Table
              </button>
            </form>
          </div>
        </section>

        {/* Taste the Season (Curated Menus) */}
        <section className="py-24 bg-surface px-margin-mobile md:px-margin-desktop">
          <div className="max-w-container-max mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-3">Taste the Season</h2>
              <p className="text-on-surface-variant text-base">Hand-picked delights from our most celebrated partner cafes.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Brunch Specials */}
              <div className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col md:flex-row border border-outline-variant/20">
                <div className="w-full md:w-2/5 h-48 md:h-auto overflow-hidden">
                  <img
                    alt="Brunch Specials"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 aspect-square"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDtV8u50m8sB3hzUL-hzGfRhvkcwH3xr_txrPQzK-K2U-M7Mkpe2b4Qkfi6THf7fj5XDxcoJVtehx3looVO1L4_lQFA8FlnDls8W1WZzriPZYKclMPMQFwr5hDTaAbNjYwPC77_dQ02uVp0UYMJbVGEjOyOCqMuC2n2QQkH8baaN4SG40tDnMu2TXib0VbaPk8HG-IwAZKCSA--0Om-GNo-GPrwTaxP1ElUNG6QoL0hFzo8QCMBDHo6vFSR_DfI0_NKOTBUBKK_8W4"
                  />
                </div>
                <div className="p-8 flex flex-col justify-center flex-1 bg-white">
                  <span className="text-secondary text-xs font-semibold tracking-widest mb-2 uppercase">Featured Menu</span>
                  <h3 className="text-xl font-bold text-primary mb-3">The Brunch Collection</h3>
                  <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">
                    Artisan sourdough, poached farm eggs, and our signature avocado mash. A morning ritual redefined.
                  </p>
                  <div className="flex justify-between items-center border-t border-outline-variant/30 pt-4">
                    <span className="text-lg font-bold text-primary">$24.00</span>
                    <button
                      onClick={() => handleActionClick('/cafes')}
                      className="text-secondary font-semibold hover:underline flex items-center gap-1 text-sm"
                    >
                      View Details <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Signature Drinks */}
              <div className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col md:flex-row border border-outline-variant/20">
                <div className="w-full md:w-2/5 h-48 md:h-auto overflow-hidden">
                  <img
                    alt="Signature Drinks"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 aspect-square"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuASuG25loM6Fu6BVS6BaYH6ldxf3oixNo1QLQ_mSII8SK12zUdiyq8546NwvZMHXUSG78SU-UwE7Xad-W8ubRpobVEISJdtJER7pNiaYU-CpWNe09l2jUhbSvuoUBfa5ll8b4sHkAQIOG14n87e0R8TjIVJYeeg9QBSGxI8sAJxIsZwtpYgY74cfnYvXrNyudX7Sbz84sRigIX5nQH2IGgmObY-6OUHJ45bN5PzdKG1tVcU2uq0tT8CbDuyv736UEVVc_9FvD7QWD8"
                  />
                </div>
                <div className="p-8 flex flex-col justify-center flex-1 bg-white">
                  <span className="text-secondary text-xs font-semibold tracking-widest mb-2 uppercase">Barista's Choice</span>
                  <h3 className="text-xl font-bold text-primary mb-3">Salted Caramel Cloud</h3>
                  <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">
                    Double-shot espresso layered with silky cold foam and hand-harvested sea salt caramel drizzle.
                  </p>
                  <div className="flex justify-between items-center border-t border-outline-variant/30 pt-4">
                    <span className="text-lg font-bold text-primary">$7.50</span>
                    <button
                      onClick={() => handleActionClick('/cafes')}
                      className="text-secondary font-semibold hover:underline flex items-center gap-1 text-sm"
                    >
                      View Details <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Discovery Flow: Popular Cafes */}
        <section className="py-24 bg-white px-margin-mobile md:px-margin-desktop border-t border-b border-outline-variant/10">
          <div className="max-w-container-max mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <h2 className="text-3xl font-bold text-primary mb-3">Popular in Your City</h2>
                <p className="text-on-surface-variant text-base">The most booked destinations this week.</p>
              </div>
              <button
                onClick={() => handleActionClick('/cafes')}
                className="text-secondary font-semibold flex items-center gap-2 hover:gap-3 transition-all text-sm md:text-base"
              >
                Explore all cafes <span className="material-symbols-outlined">east</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Cafe Card 1 */}
              <div className="group bg-background rounded-2xl overflow-hidden border border-outline-variant/30 hover:shadow-lg transition-all duration-300">
                <div className="relative h-64 overflow-hidden">
                  <img
                    alt="Cafe Aura"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAyvw475JFZ86c-L3UMcoxEJU0sNxhPemw-QLBP8a5IIbwgNZre-gMAiggYvSAHjdKRKsRh7a5KoLMEIujfyzBIWrk2F5dzcUQzetUAIvommlNYGDITEY2eQbJNt8UztNxVUIcVBSLjlxiD2JobDA68OhAh3wFL_AZ7BxEqiujVu-1zPtquWNcOTMlAnOhfH7opLr1QCrrpmgpjRdP2njEVFfS_jvH-tOdHiQ3tHEEwFnpk8QQHew3WwfnI6JjkXWkg3FPiyCiY9S0"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-secondary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                      Top Rated
                    </span>
                  </div>
                  <button className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white hover:text-primary transition-all">
                    <span className="material-symbols-outlined leading-none text-base">favorite</span>
                  </button>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-lg font-bold text-primary">Cafe Aura</h4>
                    <div className="flex items-center text-secondary">
                      <span className="material-symbols-outlined text-base fill-current">star</span>
                      <span className="font-bold ml-1 text-sm">4.9</span>
                    </div>
                  </div>
                  <p className="text-on-surface-variant text-xs mb-4">Minimalist aesthetic • Speciality Roast • Quiet</p>
                  <button
                    onClick={() => handleActionClick('/cafes')}
                    className="w-full py-3 bg-primary-container text-white rounded-xl font-semibold hover:bg-primary transition-colors text-sm"
                  >
                    Book a Table
                  </button>
                </div>
              </div>

              {/* Cafe Card 2 */}
              <div className="group bg-background rounded-2xl overflow-hidden border border-outline-variant/30 hover:shadow-lg transition-all duration-300">
                <div className="relative h-64 overflow-hidden">
                  <img
                    alt="The Roastary"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwE4iUERoG-qvr_9UpvUewevtl6btI5x808a3jYqyPoc2Ucbp7CNs_plI7UqHBIxEkUZatfIxn6AWsRrHlZv_yfJTg8JKiyfO-7GTwklZ2YEBoBfYe9JjRfdRqvEStEd14nsbbuR1GOBjia6Rnmz-nfwUoTmdfgCxv-UoQb4YMEErWbHxUDHCEwvCtYPbDchwcTI0SGs-FAvRI6nLws2BhcawCScMyd-RUJVWPk8syjZ_DhDG36XxEqt3R_G1SxgOnO6cXfsvshBU"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                      New
                    </span>
                  </div>
                  <button className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white hover:text-primary transition-all">
                    <span className="material-symbols-outlined leading-none text-base">favorite</span>
                  </button>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-lg font-bold text-primary">The Roastary</h4>
                    <div className="flex items-center text-secondary">
                      <span className="material-symbols-outlined text-base fill-current">star</span>
                      <span className="font-bold ml-1 text-sm">4.7</span>
                    </div>
                  </div>
                  <p className="text-on-surface-variant text-xs mb-4">Industrial loft • Live Music • Brunch</p>
                  <button
                    onClick={() => handleActionClick('/cafes')}
                    className="w-full py-3 bg-primary-container text-white rounded-xl font-semibold hover:bg-primary transition-colors text-sm"
                  >
                    Book a Table
                  </button>
                </div>
              </div>

              {/* Cafe Card 3 */}
              <div className="group bg-background rounded-2xl overflow-hidden border border-outline-variant/30 hover:shadow-lg transition-all duration-300">
                <div className="relative h-64 overflow-hidden">
                  <img
                    alt="Botanic Brews"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCjGIinJdY4HRLnBwRS36g-_tMjmJFb4VLgFpvTGNnGe31A-lYfhaairmdr_5JuKUCI2J-lQ0-lxKaDqz4VvvYum0w1StjJMm6fyF3MHZnpWAK1O1GLY2icltb0rkWtT881iY61qVDE0lN9xC_raYu0P2o50AxTzODpj8rl7ceTsUJE9722Tsfr0ls0C6PMLesX43mHuFe5C1JYZyOwQtY1fS3aV5PKa1KF_Zb_-qGMzxZ7x9_s2pF8-XCtJ1Jmr8dzYThkCE1Zj8Q"
                  />
                  <button className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white hover:text-primary transition-all">
                    <span className="material-symbols-outlined leading-none text-base">favorite</span>
                  </button>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-lg font-bold text-primary">Botanic Brews</h4>
                    <div className="flex items-center text-secondary">
                      <span className="material-symbols-outlined text-base fill-current">star</span>
                      <span className="font-bold ml-1 text-sm">4.8</span>
                    </div>
                  </div>
                  <p className="text-on-surface-variant text-xs mb-4">Garden patio • Vegan Friendly • Pet Friendly</p>
                  <button
                    onClick={() => handleActionClick('/cafes')}
                    className="w-full py-3 bg-primary-container text-white rounded-xl font-semibold hover:bg-primary transition-colors text-sm"
                  >
                    Book a Table
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof: Community Section */}
        <section className="py-24 bg-background px-margin-mobile md:px-margin-desktop overflow-hidden">
          <div className="max-w-container-max mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-3">What Our Coffee Community Is Saying</h2>
              <p className="text-on-surface-variant text-base">Join thousands of cafe enthusiasts finding their perfect vibe.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Review Card 1 */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-outline-variant/30 hover:-translate-y-1 transition-transform duration-300">
                <div className="flex text-secondary mb-4">
                  <span className="material-symbols-outlined fill-current text-sm">star</span>
                  <span className="material-symbols-outlined fill-current text-sm">star</span>
                  <span className="material-symbols-outlined fill-current text-sm">star</span>
                  <span className="material-symbols-outlined fill-current text-sm">star</span>
                  <span className="material-symbols-outlined fill-current text-sm">star</span>
                </div>
                <p className="text-on-surface text-sm italic mb-8 leading-relaxed">
                  "Aura Reserve changed how I spend my weekends. I used to wander around hoping for a seat; now I have a guaranteed spot at the best aesthetic cafes in the city."
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center font-bold text-primary text-sm">
                    EM
                  </div>
                  <div>
                    <h5 className="font-bold text-primary text-sm">Eleanor M.</h5>
                    <p className="text-on-surface-variant text-xs">Verified Explorer</p>
                  </div>
                </div>
              </div>

              {/* Review Card 2 */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-outline-variant/30 hover:-translate-y-1 transition-transform duration-300">
                <div className="flex text-secondary mb-4">
                  <span className="material-symbols-outlined fill-current text-sm">star</span>
                  <span className="material-symbols-outlined fill-current text-sm">star</span>
                  <span className="material-symbols-outlined fill-current text-sm">star</span>
                  <span className="material-symbols-outlined fill-current text-sm">star</span>
                  <span className="material-symbols-outlined fill-current text-sm">star</span>
                </div>
                <p className="text-on-surface text-sm italic mb-8 leading-relaxed">
                  "The curation is incredible. I've discovered gems like 'The Roastary' that I never would have found on my own. The reservation process is seamless."
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center font-bold text-secondary text-sm">
                    JH
                  </div>
                  <div>
                    <h5 className="font-bold text-primary text-sm">Julian H.</h5>
                    <p className="text-on-surface-variant text-xs">Coffee Aficionado</p>
                  </div>
                </div>
              </div>

              {/* Review Card 3 */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-outline-variant/30 hover:-translate-y-1 transition-transform duration-300">
                <div className="flex text-secondary mb-4">
                  <span className="material-symbols-outlined fill-current text-sm">star</span>
                  <span className="material-symbols-outlined fill-current text-sm">star</span>
                  <span className="material-symbols-outlined fill-current text-sm">star</span>
                  <span className="material-symbols-outlined fill-current text-sm">star</span>
                  <span className="material-symbols-outlined fill-current text-sm">star</span>
                </div>
                <p className="text-on-surface text-sm italic mb-8 leading-relaxed">
                  "As a remote worker, finding quiet cafes with good Wi-Fi is crucial. Aura Reserve filters make it so easy to find my office for the day."
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-tertiary-fixed flex items-center justify-center font-bold text-tertiary text-sm">
                    SA
                  </div>
                  <div>
                    <h5 className="font-bold text-primary text-sm">Sarah A.</h5>
                    <p className="text-on-surface-variant text-xs">Digital Nomad</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-primary text-white text-center px-margin-mobile">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">Ready for a better coffee experience?</h2>
            <p className="text-base text-white/80 mb-10">Join 50,000+ users discovering the world's most beautiful cafes.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate(isAuthenticated ? '/home' : '/register')}
                className="bg-secondary text-white px-8 py-4 rounded-xl font-bold hover:opacity-90 transition-all shadow-xl"
              >
                Get Started Free
              </button>
              <button
                onClick={() => handleToastFeature('Mobile App')}
                className="bg-white/10 backdrop-blur-md border border-white/30 px-8 py-4 rounded-xl font-bold hover:bg-white/20 transition-all"
              >
                Download App
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-highest w-full py-8 px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row justify-between items-center max-w-container-max mx-auto border-t border-outline-variant mt-auto">
        <div className="mb-4 md:mb-0">
          <span className="text-lg font-bold text-primary">Aura Reserve</span>
        </div>
        <nav className="flex flex-wrap justify-center gap-6 mb-4 md:mb-0">
          <button
            onClick={() => toast.info('Privacy policy is standard compliance.')}
            className="text-xs text-on-surface-variant hover:text-primary transition-colors"
          >
            Privacy Policy
          </button>
          <button
            onClick={() => toast.info('Terms of Service govern usage boundaries.')}
            className="text-xs text-on-surface-variant hover:text-primary transition-colors"
          >
            Terms of Service
          </button>
          <button
            onClick={() => toast.info('Cookie settings: essential session state tokens only.')}
            className="text-xs text-on-surface-variant hover:text-primary transition-colors"
          >
            Cookie Policy
          </button>
          <button
            onClick={() => toast.info('Help Desk available: support@aurareserve.com')}
            className="text-xs text-on-surface-variant hover:text-primary transition-colors"
          >
            Support
          </button>
        </nav>
        <div>
          <p className="text-xs text-primary/70">© 2026 Aura Reserve SaaS Marketplace. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
