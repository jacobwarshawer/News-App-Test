import { Link } from "react-router-dom";

const NAV_LINKS = ["World", "Technology", "Science", "Business", "Sports", "Politics", "Health", "Culture"];

function Header() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="site-header">
      <div className="header-top">
        <Link to="/" className="site-logo">
          The Daily<span>Brief</span>
        </Link>
        <span className="header-date">{today}</span>
      </div>
      <nav className="header-nav">
        <div className="nav-inner">
          {NAV_LINKS.map((label) => (
            <Link key={label} to="/">
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}

export default Header;
