import { useState, useEffect, useRef } from "react";

function Dropdown({ label, icon, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="wr-ctrl-drop" ref={ref}>
      <button
        className={`wr-ctrl-drop__btn${open ? " is-open" : ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        {icon}
        <span className="wr-ctrl-drop__label">{label}</span>
        {value !== null && <span className="wr-ctrl-drop__sep">·</span>}
        {value !== null && <span className="wr-ctrl-drop__val">{value}</span>}
        <svg className="wr-ctrl-drop__chev" width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3.5l3 3 3-3" />
        </svg>
      </button>
      {open && (
        <div className="wr-ctrl-drop__menu">
          {options.map((opt) => (
            <button
              key={opt}
              className={`wr-ctrl-drop__item${value === opt ? " is-active" : ""}`}
              onClick={() => { onChange(opt); setOpen(false); }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dropdown;
