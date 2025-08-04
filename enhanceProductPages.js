const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const mkdirp = require("mkdirp");

const productsDir = "content/products";
const stagingDir = "content/staging";
mkdirp.sync(stagingDir);

function extractUrl(data, content) {
  if (data.product_url) return data.product_url;
  if (data.canonical) return data.canonical;
  const match = content.match(/\[.*?\]\((https:\/\/www\.amazon\.com\/[^\s)]+)\)/);
  return match ? match[1] : null;
}

function stripFakeReviewLanguage(text) {
  return text
    .replace(/(My dear friend|Let me make you a promise|Reviewers far and wide|You're probably wondering|Take a look at the picture|Based on my experience|In this review|I see you standing|Imagine this scenario|As you can see)[^.?!]*[.?!]/gi, "")
    .replace(/!\[.*?\]\(.*?\)/g, "") // image markdown
    .replace(/<img.*?>/g, "")        // HTML images
    .replace(/\[.*?\]\(https:\/\/www\.amazon\.com\/[^\s)]+\)/g, "") // strip Amazon links
    .replace(/👉\s*/g, "")           // dangling emojis
    .replace(/\n{3,}/g, "\n\n");     // compress blank lines
}

function beautifyMarkdown(text) {
  return text
    .replace(/(^#{1,6})\s+([^\n]+)/gm, (_, hashes, title) => `${hashes} ✨ ${title}`)
    .replace(/(^-|\*|\+)\s+/gm, "• ")
    .replace(/\*\*(.*?)\*\*/g, "🌟 **$1**")
    .replace(/([^\n])\n([^\n])/g, "$1\n\n$2") // ensure spacing between paragraphs
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function insertSmartLinks(body, url) {
  const lines = body.split("\n").filter(Boolean);
  const link = `👉 [Buy on Amazon](${url}) _(paid link)_`;
  const cta = `**Ready to change your life?** Don’t wait — [Buy it now on Amazon](${url}) _(paid link)_`;
  const disclaimer = `> **Affiliate Disclosure**\n> As an Amazon Associate, I earn from qualifying purchases.`;

  const first = Math.floor(lines.length * 0.2);
  const middle = Math.floor(lines.length * 0.6);

  lines.splice(first, 0, link);
  lines.splice(middle, 0, link);

  const noOldDisclaimer = lines.filter(l => !l.toLowerCase().includes("amazon associate"));
  const finalLines = noOldDisclaimer.filter((line, i, arr) =>
    !(line.includes("Ready to change your life?") && i !== arr.length - 1)
  );

  finalLines.push("");
  finalLines.push(cta);
  finalLines.push("");
  finalLines.push(disclaimer);

  return finalLines.join("\n\n");
}

function normalizeFrontmatter(data, filename, url, content) {
  const slug = path.basename(filename, ".md");
  const title = data.title || slug.replace(/-/g, " ");
  const today = new Date().toISOString();
  const description = content.split("\n\n")[0].replace(/[#*>]/g, "").trim().slice(0, 160);

  return {
    title,
    slug,
    date: typeof data.date === "string" && !data.date.includes("[object") ? data.date : today,
    description,
    product_url: url,
    canonical: url,
    draft: false,
    tags: ["air fryer", "kitchen", "healthy cooking"],
    categories: ["Kitchen Appliances"],
    affiliate_disclaimer: true,
    showToc: true,
    UseHugoToc: true,
    ShowReadingTime: true,
    ShowBreadCrumbs: true,
    ShowPostNavLinks: true,
    ShowWordCount: true,
    ShowShareButtons: true,
    images: []
  };
}

function cleanDuplicateFrontmatters(raw) {
  const blocks = raw.split("---").filter(Boolean);
  if (blocks.length > 1 && blocks[1].includes("title:")) {
    return `---\n${blocks[1].trim()}\n---\n${blocks.slice(2).join("---").trimStart()}`;
  }
  return raw;
}

function enhanceFile(filePath) {
  console.log("📥 Processing:", filePath);

  let raw;
  try {
    raw = fs.readFileSync(filePath, "utf8");
  } catch (err) {
    console.error(`❌ Failed to read ${filePath}: ${err.message}`);
    return;
  }

  raw = cleanDuplicateFrontmatters(raw);

  let parsed;
  try {
    parsed = matter(raw);
  } catch (err) {
    console.warn(`❌ YAML parse failed: ${filePath}\n${err.message}`);
    return;
  }

  const { data, content } = parsed;
  const filename = path.basename(filePath);
  const url = extractUrl(data, content);

  if (!url) {
    console.warn(`⚠️ Skipping ${filename} (no usable product_url or canonical link found)`);
    return;
  }

  const cleaned = stripFakeReviewLanguage(content);
  const beautified = beautifyMarkdown(cleaned);
  const spacedBody = insertSmartLinks(beautified, url);

  if (!spacedBody || spacedBody.length < 20) {
    console.warn(`⚠️ Skipping ${filename} (empty or invalid body content)`);
    return;
  }

  const frontmatter = normalizeFrontmatter(data, filename, url, spacedBody);
  const final = matter.stringify(spacedBody, frontmatter);

  const outPath = path.join(stagingDir, filename);
  try {
    fs.writeFileSync(outPath, final);
    fs.unlinkSync(filePath);
    console.log(`✅ Enhanced + moved: ${filename}`);
  } catch (err) {
    console.error(`❌ Failed to write ${filename}: ${err.message}`);
  }
}

// Run enhancement
const files = fs.readdirSync(productsDir).filter(f => f.endsWith(".md"));
console.log(`📂 Found ${files.length} file(s) in content/products/`);
files.forEach(file => enhanceFile(path.join(productsDir, file)));
