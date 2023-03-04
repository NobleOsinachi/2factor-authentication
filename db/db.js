const mongoose = require("mongoose");

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/jail", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
  process.exit(-1);
});
mongoose.connection.once("open", () => {
    console.log("Connected to MongoDB");
});


module.exports = mongoose;