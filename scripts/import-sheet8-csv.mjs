import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const defaultInput = path.join(rootDir, 'character-sheet', 'data', 'exports', '01 - Bárd - Angyalvér - Sheet8.csv');
const spellCompendiumPath = path.join(rootDir, 'character-sheet', 'data', 'compendium', 'spells.json');
const itemCompendiumPath = path.join(rootDir, 'character-sheet', 'data', 'compendium', 'items.json');

const STAT_LABELS = ['ERŐ', 'ÜGYESSÉG', 'ÁLLÓKÉPESSÉG', 'INTELLIGENCIA', 'BÖLCSESSÉG', 'KARIZMA'];
const STAT_ALIASES = {
  'ERŐ': 0,
  'ERO': 0,
  'STR': 0,
  'ÜGY': 1,
  'UGY': 1,
  'ÜGYESSÉG': 1,
  'UGYESSEG': 1,
  'DEX': 1,
  'ÁLL': 2,
  'ALL': 2,
  'ÁLLÓKÉPESSÉG': 2,
  'ALLOKEPESSEG': 2,
  'CON': 2,
  'INT': 3,
  'INTELLIGENCIA': 3,
  'BÖL': 4,
  'BOL': 4,
  'BÖLCSESSÉG': 4,
  'BOLCSESSEG': 4,
  'WIS': 4,
  'KAR': 5,
  'KARIZMA': 5,
  'CHA': 5
};
const PROFICIENCY_TITLES = {
  'fegyver': 'Fegyverek',
  'fegyverek': 'Fegyverek',
  'páncél': 'Páncélok',
  'páncélok': 'Páncélok',
  'eszköz': 'Eszközök',
  'eszközök': 'Eszközök',
  'nyelv': 'Nyelvek',
  'nyelvek': 'Nyelvek'
};
const BOX_PATTERN = /[⎕☐□◻]/g;

function normalizeLookupKey(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function slugify(value) {
  return normalizeLookupKey(value).replace(/\s+/g, '_') || 'sheet8_import';
}

function titleCaseWords(value) {
  return String(value || '')
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function parseArgs(argv) {
  const args = { input: defaultInput };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--') && !args.inputSet) {
      args.input = path.resolve(argv[i]);
      args.inputSet = true;
      continue;
    }

    if (arg === '--out') args.out = path.resolve(argv[++i]);
    else if (arg === '--id') args.id = argv[++i];
    else if (arg === '--name') args.name = argv[++i];
    else if (arg === '--race-class') args.raceClass = argv[++i];
  }
  delete args.inputSet;
  return args;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      continue;
    }

    cell += char;
  }

  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }

  return rows.map(columns => {
    const copy = columns.slice();
    while (copy.length < 5) copy.push('');
    return copy.slice(0, 5);
  });
}

async function loadCompendium(filePath, key) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object'
      ? { items: parsed[key] || {}, lookup: parsed.lookup || {} }
      : { items: {}, lookup: {} };
  } catch {
    return { items: {}, lookup: {} };
  }
}

function canonicalizeName(name, compendium) {
  if (!name) return null;
  if (compendium.items[name]) return name;
  const lookupName = compendium.lookup[normalizeLookupKey(name)];
  return lookupName || name;
}

function fmtSigned(value) {
  const number = Number(value) || 0;
  return number >= 0 ? `+${number}` : `${number}`;
}

function parseNumber(value, fallback = 0) {
  const sanitized = String(value || '').replace(',', '.').replace(/[^0-9.-]/g, '');
  const parsed = Number(sanitized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseBoolean(value) {
  return String(value || '').trim().toUpperCase() === 'TRUE';
}

function cleanupCell(value) {
  return String(value || '')
    .replace(/\r/g, '')
    .replace(/\u00a0/g, ' ')
    .normalize('NFC')
    .trim();
}

function getStatIndex(label) {
  const normalized = cleanupCell(label).toUpperCase();
  return STAT_ALIASES[normalized] ?? STAT_LABELS.findIndex(stat => normalizeLookupKey(stat) === normalizeLookupKey(normalized));
}

function deriveMetaFromFilename(inputPath, level) {
  const stem = cleanupCell(path.basename(inputPath, path.extname(inputPath)));
  const parts = stem.split(' - ').map(part => cleanupCell(part)).filter(Boolean);
  const cleanedParts = parts.filter(part => !/^\d+$/.test(part) && !/^(copy of\s+)*sheet\d+(?:\s+page\s+\d+)?$/i.test(part));
  const [maybeClass = 'Ismeretlen', maybeRace = 'Ismeretlen'] = cleanedParts;
  const visibleName = cleanedParts.join(' - ') || stem;
  return {
    id: slugify(cleanedParts.join(' ')),
    name: visibleName,
    raceClass: `${cleanupCell(maybeRace)} | ${cleanupCell(maybeClass)}${level ? ` ${level}` : ''}`
  };
}

function parseStatRows(rows) {
  const stats = [];
  const savingThrows = [];

  rows.slice(9, 15).forEach((row, index) => {
    const label = cleanupCell(row[0]) || STAT_LABELS[index];
    const score = parseNumber(row[1], 0);
    const mod = parseNumber(row[2], 0);
    stats.push({ label, val: score, mod: fmtSigned(mod) });
    savingThrows.push({ statIndex: index, p: parseBoolean(row[3]) });
  });

  return { stats, savingThrows };
}

function parseSkillRows(rows) {
  return rows.slice(17, 34).map(row => {
    const label = cleanupCell(row[0]);
    const match = label.match(/^(.*?)\s*\((.*?)\)$/);
    const name = match ? cleanupCell(match[1]) : label;
    const ability = match ? cleanupCell(match[2]) : '';
    const statIndex = getStatIndex(ability);
    const multiplier = parseNumber(row[3], cleanupCell(row[2]) === '●' ? 1 : 0);
    return {
      n: name,
      a: ability,
      statIndex: statIndex >= 0 ? statIndex : 0,
      s: multiplier
    };
  });
}

function parseSpellcasting(rows, stats) {
  const abilityLabelRaw = cleanupCell(rows[36]?.[1]);
  const abilityIndex = abilityLabelRaw ? getStatIndex(abilityLabelRaw) : -1;
  const spellcasting = abilityIndex >= 0 ? { abilityIndex } : {};
  const spellSlots = rows.slice(38, 47)
    .map(row => ({
      level: parseNumber(row[0], 0),
      count: cleanupCell(row[1]) === '—' ? 0 : parseNumber(row[1], 0)
    }))
    .filter(slot => slot.level > 0 && slot.count > 0);

  return { spellcasting, spellSlots };
}

function parseCoins(rows) {
  const coinMap = {
    'réz': 'cp',
    'ezüst': 'sp',
    'elektrum': 'ep',
    'arany': 'gp',
    'platina': 'pp'
  };

  return rows.slice(48, 53).reduce((coins, row) => {
    const label = cleanupCell(row[0]).toLowerCase();
    const key = coinMap[label];
    if (!key) return coins;
    coins[key] = parseNumber(row[1], 0);
    return coins;
  }, { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 });
}

function splitCommaItems(value) {
  return String(value || '')
    .split(',')
    .map(part => cleanupCell(part))
    .filter(Boolean);
}

function parseFeatureCell(value) {
  const text = cleanupCell(value);
  if (!text) return null;
  const separatorIndex = text.indexOf(':');
  let title = '';
  let description = '';

  if (separatorIndex >= 0) {
    title = cleanupCell(text.slice(0, separatorIndex));
    description = cleanupCell(text.slice(separatorIndex + 1));
  } else {
    const [firstLine, ...rest] = text.split('\n');
    title = cleanupCell(firstLine);
    description = cleanupCell(rest.join('\n'));
  }

  const count = (text.match(BOX_PATTERN) || []).length;
  const feature = { title, description };
  if (count > 0) feature.count = count;
  return feature;
}

function stripSpellNotes(value) {
  return cleanupCell(value).replace(/\s*\([^)]*\)/g, '').trim();
}

function parseEquipmentCell(value, itemCompendium) {
  const text = cleanupCell(value);
  if (!text) return null;
  const match = text.match(/^(.*?)\s*\((\d+)\)\s*$/);
  const rawName = match ? cleanupCell(match[1]) : text;
  const canonicalName = canonicalizeName(rawName, itemCompendium);
  if (match) {
    return { name: canonicalName, count: parseNumber(match[2], 1) };
  }
  return canonicalName;
}

function parseProficiencies(rows) {
  const groups = new Map();
  let currentTitle = null;

  rows.forEach(row => {
    const cell = cleanupCell(row[3]);
    if (!cell) return;

    const separatorIndex = cell.indexOf(':');
    if (separatorIndex >= 0) {
      const rawTitle = cleanupCell(cell.slice(0, separatorIndex)).toLowerCase();
      currentTitle = PROFICIENCY_TITLES[rawTitle] || titleCaseWords(rawTitle);
      if (!groups.has(currentTitle)) groups.set(currentTitle, []);
      splitCommaItems(cell.slice(separatorIndex + 1)).forEach(item => groups.get(currentTitle).push(item));
      return;
    }

    if (!currentTitle) return;
    splitCommaItems(cell).forEach(item => groups.get(currentTitle).push(item));
  });

  return Array.from(groups.entries()).map(([title, items]) => ({
    title,
    items: Array.from(new Set(items))
  })).filter(group => group.items.length);
}

function parseFeaturesSpellsEquipment(rows, spellCompendium, itemCompendium) {
  const features = [];
  const spells = [];
  const equipment = [];

  rows.slice(55).forEach(row => {
    [0, 1].forEach(index => {
      const feature = parseFeatureCell(row[index]);
      if (feature) features.push(feature);
    });

    const colC = cleanupCell(row[2]);
    if (colC) {
      const spellName = stripSpellNotes(colC);
      const canonicalSpellName = canonicalizeName(spellName, spellCompendium);
      if (canonicalSpellName && spellCompendium.items[canonicalSpellName]) {
        spells.push(canonicalSpellName);
      } else {
        const feature = parseFeatureCell(colC);
        if (feature) features.push(feature);
      }
    }

    const item = parseEquipmentCell(row[4], itemCompendium);
    if (item) equipment.push(item);
  });

  return { features, spells, equipment };
}

async function importSheet8Csv(options = {}) {
  const inputPath = path.resolve(options.input || defaultInput);
  const csvText = await fs.readFile(inputPath, 'utf8');
  const rows = parseCsv(csvText);

  const spellCompendium = await loadCompendium(spellCompendiumPath, 'spells');
  const itemCompendium = await loadCompendium(itemCompendiumPath, 'items');

  const init = cleanupCell(rows[1]?.[1]);
  const speed = cleanupCell(rows[2]?.[1]);
  const size = cleanupCell(rows[3]?.[1]);
  const prof = cleanupCell(rows[4]?.[1]);
  const hpMax = parseNumber(rows[5]?.[1], 0);
  const hitDiceFormula = cleanupCell(rows[6]?.[1]) || '1d8';
  const hitDiceMatch = hitDiceFormula.match(/^(\d+)\s*(d\d+)$/i);
  const hitDice = {
    total: hitDiceMatch ? parseNumber(hitDiceMatch[1], 1) : 1,
    die: hitDiceMatch ? hitDiceMatch[2].toLowerCase() : 'd8'
  };
  const acValue = parseNumber(rows[7]?.[1], 10);

  const { stats, savingThrows } = parseStatRows(rows);
  const skills = parseSkillRows(rows);
  const { spellcasting, spellSlots } = parseSpellcasting(rows, stats);
  const coins = parseCoins(rows);
  const proficiencies = parseProficiencies(rows.slice(55));
  const { features, spells, equipment } = parseFeaturesSpellsEquipment(rows, spellCompendium, itemCompendium);

  const inferred = deriveMetaFromFilename(inputPath, hitDice.total);
  const sheetData = {
    id: options.id || inferred.id,
    name: options.name || inferred.name,
    raceClass: options.raceClass || inferred.raceClass,
    ac: {
      base: acValue,
      current: acValue
    },
    init,
    speed,
    size,
    spellcasting,
    prof,
    hpMax,
    hitDice,
    stats,
    savingThrows,
    skills,
    attacks: [],
    inspiration: {
      active: false
    },
    spellSlots,
    coins,
    proficiencies,
    equipment,
    spells,
    features
  };

  const outputPath = options.out || path.join(rootDir, 'character-sheet', 'data', 'generated', `${sheetData.id}.json`);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(sheetData, null, 2) + '\n', 'utf8');

  return { outputPath, sheetData };
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isDirectRun) {
  const args = parseArgs(process.argv.slice(2));
  importSheet8Csv(args)
    .then(({ outputPath, sheetData }) => {
      console.log(`SheetData generated: ${path.relative(rootDir, outputPath)}`);
      console.log(`Name: ${sheetData.name}`);
      console.log(`Race/Class: ${sheetData.raceClass}`);
      console.log(`Features: ${sheetData.features.length}, Spells: ${sheetData.spells.length}, Equipment: ${sheetData.equipment.length}`);
    })
    .catch(error => {
      console.error(error);
      process.exitCode = 1;
    });
}

export { importSheet8Csv };




