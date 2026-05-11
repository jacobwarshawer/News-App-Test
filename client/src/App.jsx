import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import HomePage from "./components/HomePage";
import ArticleDetail from "./components/ArticleDetail";
import UploadPage from "./components/UploadPage";
import AskPanel from "./components/AskPanel";
import { DEFAULTS } from "./constants";
import "./App.css";

function App() {
  const [reading, setReading] = useState(DEFAULTS.READING);
  const [articles, setArticles] = useState(null);
  const [askOpen, setAskOpen] = useState(false);
  const [askStory, setAskStory] = useState(null);
  const [askSeed, setAskSeed] = useState(null);

  const openAsk = (story, seed = null) => {
    setAskStory(story);
    setAskSeed(seed);
    setAskOpen(true);
  };

  return (
    <BrowserRouter>
      <div className="app">
        <div className="wr-shell">
          <Header />
          <div className="wr-shell__body">
            <Routes>
              <Route
                path="/"
                element={
                  <HomePage
                    reading={reading}
                    setReading={setReading}
                    articles={articles}
                    setArticles={setArticles}
                  />
                }
              />
              <Route
                path="/article/:id"
                element={<ArticleDetail openAsk={openAsk} />}
              />
              <Route path="/upload" element={<UploadPage />} />
            </Routes>
          </div>
        </div>
        <AskPanel
          open={askOpen}
          story={askStory}
          seed={askSeed}
          onClose={() => setAskOpen(false)}
        />
      </div>
    </BrowserRouter>
  );
}

export default App;
