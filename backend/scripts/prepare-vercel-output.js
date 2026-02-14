const fs = require('fs');
const path = require('path');
const outDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'index.js'), [
  'module.exports = (req, res) => res.status(200).json({ success: true, message: "Backend API" });'
].join('\n'), 'utf8');
console.log('Vercel output prepared');
