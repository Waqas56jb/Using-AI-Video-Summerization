const OpenAI = require('openai');
const { chunkText } = require('../utils/text-chunker');
const { CHUNK_SIZE_WORDS } = require('../config/constants');

let apiKey = process.env.OPENAI_API_KEY;
if (apiKey) apiKey = apiKey.trim();
if (!apiKey) throw new Error('OPENAI_API_KEY is not set in environment variables');

const client = new OpenAI({ apiKey });

const CHUNK_SYSTEM = `You are summarizing one part of a lecture for students who will NOT watch the video.
Your job: capture the FULL context of this part—every main point, definition, example, and step.
Output format (use exactly these markdown conventions so the final document is structured):
- Use ## for main topic headings
- Use ### for sub-topics
- Use bullet points (- or •) for main points and sub-points
- Keep key definitions, terms, and examples; do not drop content
- Be clear and readable. A student should understand the whole lecture from the summary.`;

const CHUNK_USER = (chunk) => `Summarize this part of the lecture transcript in full context. Use headings (##, ###) and bullet points. Preserve all important points, definitions, and examples.\n\n${chunk}`;

const FINAL_SYSTEM = `You are creating the final lecture summary for students who skip the video.
Combine the given section summaries into ONE well-structured document that gives the ENTIRE context of the lecture.
Rules:
- Use ## for main lecture topics/sections
- Use ### for sub-topics within a section
- Use bullet points (- or •) for main points and details under each heading
- Include a "Key takeaways" or "Summary" section at the end that lists the main points covered
- Do not remove or shorten important content—this document must replace watching the lecture
- Output in clean markdown: ## Heading, ### Subheading, then bullets. No extra commentary.`;

const FINAL_USER = (combined) => `Merge these lecture summary sections into one coherent, fully readable document. Use ## and ### for structure, bullets for points. Add a "Key takeaways" section at the end. Ensure a student gets the full context of the lecture.\n\n${combined}`;

async function summarizeChunk(chunk, isFinal = false) {
  const systemContent = isFinal ? FINAL_SYSTEM : CHUNK_SYSTEM;
  const userContent = isFinal ? FINAL_USER(chunk) : CHUNK_USER(chunk);
  const resp = await client.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemContent },
      { role: 'user', content: userContent }
    ],
    temperature: 0.4,
    max_tokens: isFinal ? 2000 : 800
  });
  return resp.choices[0].message.content;
}

async function summarizeTranscriptMapReduce(text, progressCallback) {
  const chunks = chunkText(text, CHUNK_SIZE_WORDS);
  console.log(`📝 Summarizing ${chunks.length} chunk(s) (full lecture context)...`);

  if (progressCallback) progressCallback(0.1);

  const chunkPromises = chunks.map(async (chunk, index) => {
    console.log(`  Chunk ${index + 1}/${chunks.length}...`);
    const summary = await summarizeChunk(chunk);
    if (progressCallback) progressCallback(0.1 + ((index + 1) / chunks.length) * 0.6);
    return summary;
  });

  const chunkSummaries = await Promise.all(chunkPromises);
  if (progressCallback) progressCallback(0.7);

  if (chunks.length > 1) {
    console.log('  Building final structured summary...');
    const combined = chunkSummaries.join('\n\n');
    if (progressCallback) progressCallback(0.85);
    const finalSummary = await summarizeChunk(combined, true);
    if (progressCallback) progressCallback(1.0);
    return finalSummary;
  }

  if (progressCallback) progressCallback(1.0);
  return chunkSummaries[0];
}

module.exports = { summarizeTranscriptMapReduce };
