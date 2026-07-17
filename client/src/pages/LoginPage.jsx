import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../store/AuthContext';

const INITIAL_FORM = { email: '', password: '' };

function LoginPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

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
      navigate('/home');
    } catch (requestError) {
      setError(requestError.response?.data?.error ?? 'Unable to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to manage your reservations and discover your next café."
      footerText="New to CafeReserve?"
      footerLink="/register"
      footerLinkLabel="Create an account"
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <p className="form-error" role="alert">{error}</p>}
        <label htmlFor="email">Email address</label>
        <input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange} required />
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" value={form.password} onChange={handleChange} required />
        <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </AuthLayout>
  );
}

export default LoginPage;
