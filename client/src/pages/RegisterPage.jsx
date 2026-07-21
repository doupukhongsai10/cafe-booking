import { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { useToast } from '../store/ToastContext';

const INITIAL_FORM = { name: '', email: '', password: '', role: 'CUSTOMER' };

function RegisterPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated, register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await register(form);
      toast.success('Account created successfully!');
      navigate('/home');
    } catch (requestError) {
      setError(requestError.response?.data?.error ?? 'Unable to create your account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-0 md:p-8">
      <div className="w-full max-w-container-max h-screen md:h-[800px] flex md:rounded-xl overflow-hidden md:shadow-[0px_4px_20px_rgba(60,42,33,0.04)] border border-outline-variant/30 bg-surface-container-lowest">
        
        {/* Left Side: Image */}
        <div className="hidden md:flex md:w-1/2 relative bg-surface-variant flex-col justify-end p-margin-desktop overflow-hidden group">
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105" 
            style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCbhzki22rgHNamCkw-V9utXeilGLowA5-BE4pCLb8BZOJD-Hf19Sf48L9tMpib2BYBOD3GNlsi-WKZpm4ylVEjH35ES4wjS76Do6lENkw1JBWsp2LGupEYNF2DTLgNwQMRxnbTUK6be0BYuhsjNsOkzrD9Wm3HZXVOmPlQGGRnN4rCpoYrwx7pymwzF4T38UMOFd4xJy39R6FYbDAn4YUzeBzrOGnkb9FRyH2GVl-YKaR9oS60RZhz6I6xbJdmwugcpqAqtgjUG8U")' }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent"></div>
          <div className="relative z-10 bg-white/80 backdrop-blur-md border border-white/30 rounded-xl p-8 max-w-md shadow-sm">
            <h2 className="font-semibold text-2xl text-primary mb-2">Join the Community</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Discover hidden gems, reserve your perfect corner, and connect with fellow café enthusiasts.
            </p>
          </div>
        </div>

        {/* Right Side: Register Form */}
        <div className="w-full md:w-1/2 flex flex-col justify-center px-6 md:px-margin-desktop py-8 relative overflow-y-auto bg-surface-container-lowest">
          <div className="max-w-md w-full mx-auto space-y-6">
            
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 
                onClick={() => navigate('/')} 
                className="font-black text-4xl md:text-5xl text-primary tracking-tight cursor-pointer hover:opacity-85"
              >
                CafeReserve
              </h1>
              <p className="text-sm text-on-surface-variant font-medium">Create your account to get started.</p>
            </div>

            {/* Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && <p className="p-3 text-sm text-error bg-red-50 border border-red-200 rounded-xl font-medium" role="alert">{error}</p>}
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block" htmlFor="name">Your Name</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-xl">person</span>
                  <input 
                    className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface font-medium text-sm" 
                    id="name" 
                    name="name"
                    placeholder="Enter your name" 
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block" htmlFor="email">Email Address</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-xl">mail</span>
                  <input 
                    className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface font-medium text-sm" 
                    id="email" 
                    name="email"
                    placeholder="Enter your email" 
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block" htmlFor="password">Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-xl">lock</span>
                  <input 
                    className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface font-medium text-sm" 
                    id="password" 
                    name="password"
                    placeholder="••••••••" 
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block" htmlFor="role">I want to register as a</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-xl">badge</span>
                  <select 
                    className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface font-medium text-sm appearance-none cursor-pointer" 
                    id="role" 
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    required
                  >
                    <option value="CUSTOMER">Customer (Browse & Book Cafés)</option>
                    <option value="CAFE_ADMIN">Café Owner (Register & Manage Café)</option>
                  </select>
                </div>
              </div>

              <button 
                className="w-full bg-primary hover:bg-primary/95 text-on-primary font-semibold py-3 px-6 rounded-xl shadow-sm hover:shadow-[0px_8px_24px_rgba(60,42,33,0.08)] transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2" 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating account…' : 'Create Account'}
              </button>
            </form>

            {/* Footer */}
            <p className="text-center text-xs text-on-surface-variant">
              Already have an account? <Link className="font-semibold text-primary hover:text-secondary transition-colors ml-1" to="/login">Sign In</Link>
            </p>

          </div>
        </div>

      </div>
    </div>
  );
}

export default RegisterPage;
