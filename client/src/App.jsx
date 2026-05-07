import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import HomePage from "./components/HomePage";
import ArticleDetail from "./components/ArticleDetail";
import AskPanel from "./components/AskPanel";
import "./App.css";

function App() {
  const [reading, setReading] = useState("Neutral");
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
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  reading={reading}
                  setReading={setReading}
                  openAsk={openAsk}
                />
              }
            />
            <Route
              path="/article/:id"
              element={<ArticleDetail openAsk={openAsk} />}
            />
          </Routes>
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
