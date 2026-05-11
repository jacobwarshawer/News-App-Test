// Entry point for the Express server
require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const articlesRouter = require("./routes/articles");
const uploadsRouter = require("./routes/uploads");

const app = express();
// Must match the proxy target in client/vite.config.js.
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.use("/api/articles", articlesRouter);
app.use("/api/uploads", uploadsRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
