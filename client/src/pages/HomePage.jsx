import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

function HomePage() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <main className="home-page">
      <header className="home-header">
        <span className="brand">Aura Reserve</span>
        <button className="button-secondary" type="button" onClick={handleLogout}>Sign out</button>
      </header>
      <section className="home-card">
        <p className="eyebrow">YOU’RE ALL SET</p>
        <h1>Welcome, {user?.name}.</h1>
        <p>Your account is ready. Café discovery will arrive in the next build unit.</p>
      </section>
    </main>
  );
}

export default HomePage;
