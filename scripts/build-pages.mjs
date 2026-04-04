import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const sheetDir = path.join(rootDir, 'character-sheet');
const dataDir = path.join(sheetDir, 'data');

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function copyFileToDist(sourcePath, targetPath) {
  await ensureDir(path.dirname(targetPath));
  await fs.copyFile(sourcePath, targetPath);
}

async function copyDirToDist(sourceDir, targetDir) {
  await ensureDir(targetDir);
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      await copyDirToDist(sourcePath, targetPath);
      continue;
    }

    if (entry.isFile()) {
      await copyFileToDist(sourcePath, targetPath);
    }
  }
}

async function loadSheets() {
  const entries = await fs.readdir(dataDir, { withFileTypes: true });
  const jsonFiles = entries
    .filter(entry => entry.isFile() && entry.name.endsWith('.json'))
    .map(entry => entry.name)
    .sort((a, b) => a.localeCompare(b, 'hu'));

  if (!jsonFiles.length) {
    throw new Error('Nem található karakter JSON a character-sheet/data mappában.');
  }

  const sheets = [];
  for (const fileName of jsonFiles) {
    const fullPath = path.join(dataDir, fileName);
    const raw = await fs.readFile(fullPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.id || !parsed.name) {
      throw new Error(`Hibás karakter JSON: ${fileName}`);
    }

    sheets.push({
      fileName,
      id: parsed.id,
      name: parsed.name,
      raceClass: parsed.raceClass || '',
      href: `character-sheet/character-sheet.html?data=${encodeURIComponent(`data/${fileName}`)}`
    });
  }

  return sheets;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderIndexPage(sheets) {
  const cards = sheets.map(sheet => `
        <a class="sheet-link" href="${sheet.href}">
            <span class="sheet-name">${escapeHtml(sheet.name)}</span>
            <span class="sheet-meta">${escapeHtml(sheet.raceClass || sheet.id)}</span>
            <span class="sheet-path">${escapeHtml(sheet.fileName)}</span>
        </a>`).join('');

  return `<!DOCTYPE html>
<html lang="hu">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Karakterlapok</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700&family=Noto+Serif:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #0b0e14;
            --card: #151a22;
            --border: #2a3341;
            --accent: #00e5ff;
            --gold: #d4af37;
            --text: #e0e0e0;
            --muted: #91a1ab;
            --font-display: 'Noto Serif', serif;
            --font-body: 'Noto Sans', sans-serif;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            min-height: 100vh;
            background: radial-gradient(circle at top, rgba(0,229,255,0.08), transparent 40%), var(--bg);
            color: var(--text);
            font-family: var(--font-body);
            padding: 32px 20px;
        }
        main { max-width: 960px; margin: 0 auto; }
        h1 {
            font-family: var(--font-display);
            font-size: clamp(2rem, 4vw, 3.2rem);
            color: white;
            margin-bottom: 10px;
        }
        .lead {
            color: var(--muted);
            line-height: 1.6;
            margin-bottom: 28px;
            max-width: 720px;
        }
        .sheet-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 16px;
        }
        .sheet-link {
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 18px;
            border-radius: 14px;
            border: 1px solid var(--border);
            background: var(--card);
            color: inherit;
            text-decoration: none;
            box-shadow: 0 10px 30px rgba(0,0,0,0.28);
            transition: transform 0.15s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .sheet-link:hover {
            transform: translateY(-2px);
            border-color: var(--accent);
            box-shadow: 0 0 0 1px rgba(0,229,255,0.12), 0 14px 32px rgba(0,0,0,0.34);
        }
        .sheet-name {
            font-family: var(--font-display);
            color: white;
            font-size: 1.1rem;
        }
        .sheet-meta {
            color: var(--gold);
            font-size: 0.9rem;
        }
        .sheet-path {
            color: var(--muted);
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.06em;
        }
    </style>
</head>
<body>
<main>
    <h1>Karakterlapok</h1>
    <p class="lead">Válassz karaktert. Minden link ugyanazt a generikus karakterlap oldalt nyitja meg, a megfelelő JSON adatfájllal.</p>
    <section class="sheet-grid">${cards}
    </section>
</main>
</body>
</html>
`;
}

async function build() {
  const sheets = await loadSheets();

  await fs.rm(distDir, { recursive: true, force: true });
  await ensureDir(path.join(distDir, 'character-sheet', 'data'));

  await copyFileToDist(path.join(sheetDir, 'character-sheet.html'), path.join(distDir, 'character-sheet', 'character-sheet.html'));
  await copyDirToDist(dataDir, path.join(distDir, 'character-sheet', 'data'));

  await fs.writeFile(
    path.join(distDir, 'character-sheet', 'data', 'index.json'),
    JSON.stringify(sheets, null, 2) + '\n',
    'utf8'
  );

  await fs.writeFile(path.join(distDir, 'index.html'), renderIndexPage(sheets), 'utf8');
  await fs.writeFile(path.join(distDir, '.nojekyll'), '', 'utf8');
}

build().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

