const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
require("dotenv").config();

// Import backend modules
const { submitProducts } = require("./local-dashboard/submitProducts");
const { startAll, stopAll } = require("./local-dashboard/processManager");
const { getStatus } = require("./local-dashboard/status");
const { getLogs } = require("./local-dashboard/logStream");

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve HTML
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "local-dashboard", "dashboard.html"));
});
app.get("/dashboard.html", (req, res) => {
  res.sendFile(path.join(__dirname, "local-dashboard", "dashboard.html"));
});
app.use(express.static(path.join(__dirname, "public")));

// API Routes
app.post("/api/start", (req, res) => {
  startAll();
  res.send("✅ System started.");
});

app.post("/api/stop", (req, res) => {
  stopAll();
  res.send("🛑 System stopped.");
});

// 🔧 FIXED: Pass req/res directly
app.post("/api/submit-products", submitProducts);

app.get("/api/status", async (req, res) => {
  try {
    const status = await getStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/logs", async (req, res) => {
  try {
    const logs = await getLogs();
    res.send(logs);
  } catch (err) {
    res.status(500).send("Error fetching logs: " + err.message);
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Dashboard running at http://localhost:${port}`);
});
