import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import HomePage from "./components/HomePage";
import ArticleDetail from "./components/ArticleDetail";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/article/:id" element={<ArticleDetail />} />
          </Routes>
        </main>
        <footer className="site-footer">
          <div className="footer-inner">
            <span className="footer-logo">The Daily Brief</span>
            <p>© 2026 The Daily Brief. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
