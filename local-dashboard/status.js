const fs = require("fs");
const path = require("path");
const { isRunning } = require("./processManager");

const STAGES = {
  products: "content/products",
  staging: "content/staging",
  final: "content/final",
  review: "content/review-needed"
};

function ensureFoldersExist() {
  for (const dir of Object.values(STAGES)) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (err) {
      console.error(`⚠️ Failed to ensure folder ${dir}:`, err.message);
    }
  }
}

function countMarkdownFiles(dir) {
  try {
    return fs.readdirSync(dir).filter(file => file.endsWith(".md")).length;
  } catch (err) {
    return 0;
  }
}

function getStatus() {
  ensureFoldersExist();

  const status = {
    productsCount: countMarkdownFiles(STAGES.products),
    stagingCount: countMarkdownFiles(STAGES.staging),
    finalCount: countMarkdownFiles(STAGES.final),
    reviewCount: countMarkdownFiles(STAGES.review),
    systemRunning: safeIsRunning("main") // 🔐 Wrapped for reliability
  };

  return status;
}

function safeIsRunning(name) {
  try {
    return isRunning(name);
  } catch (err) {
    console.error(`⚠️ Could not check if ${name} is running:`, err.message);
    return false;
  }
}

module.exports = { getStatus };
