import { Link, NavLink } from 'react-router-dom';

export default function Header({ center, status }) {
  return (
    <header className="app-header">
      <Link className="brand" to="/">
        bridge<span>-</span>poll
      </Link>
      {center ? <div className="header-center">{center}</div> : null}
      <nav className="header-nav">
        <NavLink to="/admin">Admin</NavLink>
        {status ? <span className="status-pill">{status}</span> : null}
      </nav>
    </header>
  );
}
