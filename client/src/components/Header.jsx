import { Link } from "react-router-dom";

function Header() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <header className="wr-header">
      <div className="wr-header__brand">
        <Link to="/" className="wr-logo" aria-label="The DailyBrief">
          <span className="wr-logo__the">The</span>
          <span className="wr-logo__daily">Daily</span>
          <span className="wr-logo__brief">Brief</span>
          <span className="wr-logo__dot" aria-hidden="true" />
        </Link>
      </div>
      <nav className="wr-header__nav">
        <Link to="/">Home</Link>
        <Link to="/upload">Upload</Link>
        <span className="wr-header__live">Live</span>
        <span className="wr-header__date">{today}</span>
      </nav>
    </header>
  );
}

export default Header;
