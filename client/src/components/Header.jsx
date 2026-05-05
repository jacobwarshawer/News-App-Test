import { Link } from "react-router-dom";

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
    </header>
  );
}

export default Header;
