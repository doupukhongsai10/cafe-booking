import { Link } from 'react-router-dom';

function AuthLayout({ title, description, children, footerText, footerLink, footerLinkLabel }) {
  return (
    <main className="auth-page">
      <section className="auth-intro" aria-labelledby="brand-heading">
        <Link className="brand" to="/">Aura Reserve</Link>
        <div>
          <p className="eyebrow">LOCAL CAFÉ BOOKINGS</p>
          <h1 id="brand-heading">Make time for your favourite places.</h1>
          <p>Discover a table that feels just right, then reserve it in a few simple steps.</p>
        </div>
      </section>
      <section className="auth-panel" aria-labelledby="auth-heading">
        <div className="auth-card">
          <p className="eyebrow">WELCOME</p>
          <h2 id="auth-heading">{title}</h2>
          <p className="auth-description">{description}</p>
          {children}
          <p className="auth-footer">
            {footerText} <Link to={footerLink}>{footerLinkLabel}</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default AuthLayout;
