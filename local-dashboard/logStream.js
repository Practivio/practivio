// Simple in-memory log buffer
let logs = [];

function log(message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}`;
  logs.push(line);

  // Keep only the last 200 lines
  if (logs.length > 200) logs.shift();
}

function getLogs() {
  return logs.join("\n");
}

module.exports = { log, getLogs };
