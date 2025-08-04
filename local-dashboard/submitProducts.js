const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");
require("dotenv").config();

const productsDir = "content/products";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateKeywords(title) {
  const prompt = `Generate up to 50 distinct high-intent buyer search phrases or keywords for the product: "${title}". Each one should reflect a unique pain point, use case, or buying situation. Format as a comma-separated list.`;
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
  });
  const raw = response.choices[0].message.content;
  return raw
    .split(",")
    .map(k => k.trim())
    .filter(k => k.length > 0);
}

async function generateSalesPage({ title, url, keyword }) {
  const prompt = `
You are Zig Ziglar writing a persuasive product sales page in Hugo Markdown format.

Write a unique, powerful, emotionally persuasive sales page for the product: "${title}" targeting this high-intent keyword: "${keyword}".

Tone: conversational, empathetic, motivational — like Zig Ziglar selling a life-changing product.

Requirements:
- Start with an emotional hook related to the pain point
- Explain how this product solves the problem
- Include the Amazon affiliate link (${url}) up to 3 times, not all at the end
- Add a Hugo-compatible frontmatter section
- Include a clear call-to-action
- Include the disclaimer: "_Disclaimer: As an Amazon Associate I earn from qualifying purchases._"
- Do not include internal links or placeholder text
- Filename will be auto-generated, you don’t need to worry about that

Return only the full \`.md\` file contents, nothing else.
  `.trim();

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
  });

  return response.choices[0].message.content;
}

async function submitProducts(req, res) {
  const products = req.body.products || [];

  for (const product of products) {
    const { title, url } = product;

    try {
      const keywords = await generateKeywords(title);

      for (const keyword of keywords) {
        const mdContent = await generateSalesPage({ title, url, keyword });

        const slug = keyword
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");

        const filePath = path.join(productsDir, `${slug}.md`);
        fs.writeFileSync(filePath, mdContent);
        console.log(`✅ Created: ${filePath}`);
      }
    } catch (err) {
      console.error(`❌ Failed to process product "${title}":`, err);
    }
  }

  res.send("✅ Products submitted and pages generated.");
}

module.exports = { submitProducts };
