import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const rootDir = process.cwd();
const assetsDir = path.join(rootDir, 'dist', 'assets');

if (!fs.existsSync(assetsDir)) {
  console.error('[bundle-report] 未找到 dist/assets，请先执行 npm run build');
  process.exit(1);
}

function formatSize(bytes) {
  return `${(bytes / 1024).toFixed(2)} KB`;
}

function computeSizes(buffer) {
  const raw = buffer.length;
  const gzip = zlib.gzipSync(buffer, {level: 9}).length;
  const brotli = zlib.brotliCompressSync(buffer, {
    params: {
      [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
    },
  }).length;

  return {raw, gzip, brotli};
}

const entries = fs
  .readdirSync(assetsDir)
  .filter(file => /\.(js|css)$/.test(file))
  .map(file => {
    const fullPath = path.join(assetsDir, file);
    const buffer = fs.readFileSync(fullPath);
    const sizes = computeSizes(buffer);
    return {
      file,
      ...sizes,
    };
  })
  .sort((a, b) => b.raw - a.raw);

if (entries.length === 0) {
  console.error('[bundle-report] dist/assets 下没有 js/css 资源');
  process.exit(1);
}

console.log('\nBundle Size Report (raw / gzip / brotli)\n');
console.log('File'.padEnd(34), 'Raw'.padStart(12), 'Gzip'.padStart(12), 'Brotli'.padStart(12));
console.log('-'.repeat(72));

for (const entry of entries) {
  console.log(
    entry.file.padEnd(34),
    formatSize(entry.raw).padStart(12),
    formatSize(entry.gzip).padStart(12),
    formatSize(entry.brotli).padStart(12),
  );
}

const totals = entries.reduce(
  (acc, item) => {
    acc.raw += item.raw;
    acc.gzip += item.gzip;
    acc.brotli += item.brotli;
    return acc;
  },
  {raw: 0, gzip: 0, brotli: 0},
);

console.log('-'.repeat(72));
console.log(
  'TOTAL'.padEnd(34),
  formatSize(totals.raw).padStart(12),
  formatSize(totals.gzip).padStart(12),
  formatSize(totals.brotli).padStart(12),
);
console.log('');
