require("dotenv").config();
require("./db/db");
const express = require("express");
const app = express();
const userRoutes = require("./routes/user.routes");

app.use(express.json());

app.use(userRoutes);

// Handle 404 app.all
app.all("*", (req, res) => {
  res.status(404).json({ success: false, message: "Resource not found" });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
