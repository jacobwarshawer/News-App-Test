const express = require("express");
const cors = require("cors");
const articlesRouter = require("./routes/articles");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.use("/api/articles", articlesRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
