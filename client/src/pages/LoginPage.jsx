import { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { useToast } from '../store/ToastContext';

const INITIAL_FORM = { email: '', password: '' };

function LoginPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated, login } = useAuth();
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
      await login(form);
      toast.success('Welcome back!');
      navigate('/home');
    } catch (requestError) {
      setError(requestError.response?.data?.error ?? 'Unable to sign in. Please try again.');
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

        {/* Right Side: Login Form */}
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
              <p className="text-sm text-on-surface-variant font-medium">Welcome back. Please enter your details.</p>
            </div>

            {/* Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && <p className="p-3 text-sm text-error bg-red-50 border border-red-200 rounded-xl font-medium" role="alert">{error}</p>}
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block" htmlFor="email">Email</label>
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
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input 
                    className="h-4 w-4 text-primary focus:ring-primary/20 border-outline-variant/50 rounded bg-surface-container-lowest cursor-pointer" 
                    id="remember-me" 
                    type="checkbox"
                  />
                  <label className="ml-2 block text-xs text-on-surface-variant font-medium cursor-pointer" htmlFor="remember-me">
                    Remember for 30 days
                  </label>
                </div>
                <button 
                  type="button"
                  onClick={() => toast.info('Password reset is coming soon in our mobile app release!')} 
                  className="text-xs text-primary hover:text-secondary font-semibold transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <button 
                className="w-full bg-primary hover:bg-primary/95 text-on-primary font-semibold py-3 px-6 rounded-xl shadow-sm hover:shadow-[0px_8px_24px_rgba(60,42,33,0.08)] transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2" 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing in…' : 'Log In'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant/30"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-surface-container-lowest text-on-surface-variant font-bold tracking-wider uppercase text-[10px]">OR CONTINUE WITH</span>
              </div>
            </div>

            {/* Social Login */}
            <div className="space-y-2">
              <button 
                type="button"
                onClick={() => toast.info('Google Sign-In is coming soon!')}
                className="w-full bg-surface-container-lowest border border-outline-variant/50 hover:bg-surface-container-low text-on-surface font-semibold py-2.5 px-6 rounded-xl transition-colors flex items-center justify-center gap-3 text-sm"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                </svg>
                Google
              </button>
              <button 
                type="button"
                onClick={() => toast.info('Apple Sign-In is coming soon!')}
                className="w-full bg-surface-container-lowest border border-outline-variant/50 hover:bg-surface-container-low text-on-surface font-semibold py-2.5 px-6 rounded-xl transition-colors flex items-center justify-center gap-3 text-sm"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.126 3.805 3.053 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.352.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.613 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.246-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.702z"></path>
                </svg>
                Apple
              </button>
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-on-surface-variant">
              Don't have an account? <Link className="font-semibold text-primary hover:text-secondary transition-colors ml-1" to="/register">Sign Up</Link>
            </p>

          </div>
        </div>

      </div>
    </div>
  );
}

export default LoginPage;
