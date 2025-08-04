const chokidar = require("chokidar");
const path = require("path");
const { exec } = require("child_process");

const watchDir = path.join(__dirname, "content", "products");

console.log("👀 Watching for new .md files in:", watchDir);

const watcher = chokidar.watch("*.md", {
  cwd: watchDir,
  persistent: true,
  ignoreInitial: true,
});

watcher.on("add", file => {
  console.log(`📦 New file detected: ${file}`);
  console.log(`⚙️ Enhancing...`);

  exec("node enhanceProductPages.js", (err, stdout, stderr) => {
    if (err) {
      console.error("❌ Enhancement failed:", err.message);
      return;
    }
    if (stderr) {
      console.error("⚠️ stderr:", stderr);
    }
    console.log(stdout.trim());
    console.log("✅ Enhancement complete.");
  });
});
