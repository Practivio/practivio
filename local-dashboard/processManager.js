const { spawn } = require("child_process");

let processes = {};

function startProcess(name, script) {
  const existing = processes[name];
  if (existing && typeof existing.kill === "function" && !existing.killed) {
    console.log(`⚠️ ${name} is already running.`);
    return;
  }

  const proc = spawn("node", [`local-dashboard/${script}`], {
    stdio: "inherit",
  });

  processes[name] = proc;
  console.log(`✅ Started: ${name}`);
}

function stopProcess(name) {
  const proc = processes[name];

  if (!proc) {
    console.log(`⚠️ ${name} does not exist.`);
    return;
  }

  // Kill only if it's a real child process
  if (typeof proc.kill === "function" && !proc.killed) {
    proc.kill();
    console.log(`🛑 Stopped: ${name}`);
  } else {
    console.log(`ℹ️ ${name} is not a real process (skipping kill).`);
  }

  delete processes[name];
}

function isRunning(name) {
  const proc = processes[name];
  return proc && !proc.killed;
}

function stopAll() {
  Object.keys(processes).forEach(name => stopProcess(name));
}

function startAll() {
  // Start subprocesses individually
  startProcess("submitProducts", "submitProducts.js");
  startProcess("status", "status.js");
  startProcess("logStream", "logStream.js");

  // Mark system as "main" to reflect dashboard running state
  processes["main"] = { fake: true }; // No need for 'killed: false'
}

module.exports = {
  startAll,
  stopAll,
  isRunning,
  startProcess,
  stopProcess
};
