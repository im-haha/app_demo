import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const rootDir = process.cwd();
const assetsDir = path.join(rootDir, 'dist', 'assets');

if (!fs.existsSync(assetsDir)) {
  console.error('[bundle-budget] 未找到 dist/assets，请先执行 npm run build');
  process.exit(1);
}

function toKb(bytes) {
  return bytes / 1024;
}

function gzipSize(buffer) {
  return zlib.gzipSync(buffer, {level: 9}).length;
}

function brotliSize(buffer) {
  return zlib.brotliCompressSync(buffer, {
    params: {
      [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
    },
  }).length;
}

function readBudgetEnv(name, fallback) {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }

  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    console.warn(`[bundle-budget] 忽略无效阈值 ${name}=${raw}`);
    return fallback;
  }

  return value;
}

const budgets = {
  maxMainJsGzipKb: readBudgetEnv('BUDGET_MAX_MAIN_JS_GZIP_KB', 12),
  maxVendorReactGzipKb: readBudgetEnv('BUDGET_MAX_VENDOR_REACT_GZIP_KB', 48),
  maxTotalGzipKb: readBudgetEnv('BUDGET_MAX_TOTAL_GZIP_KB', 70),
  maxTotalBrotliKb: readBudgetEnv('BUDGET_MAX_TOTAL_BROTLI_KB', 60),
};

const files = fs.readdirSync(assetsDir).filter(file => /\.(js|css)$/.test(file));

if (!files.length) {
  console.error('[bundle-budget] dist/assets 下没有 js/css 文件');
  process.exit(1);
}

const metrics = files.map(file => {
  const filePath = path.join(assetsDir, file);
  const content = fs.readFileSync(filePath);
  return {
    file,
    gzipKb: toKb(gzipSize(content)),
    brotliKb: toKb(brotliSize(content)),
  };
});

const mainJs = metrics.find(item => /^index-.*\.js$/.test(item.file));
const vendorReact = metrics.find(item => /^vendor-react-.*\.js$/.test(item.file));

const totals = metrics.reduce(
  (acc, item) => {
    acc.gzipKb += item.gzipKb;
    acc.brotliKb += item.brotliKb;
    return acc;
  },
  {gzipKb: 0, brotliKb: 0},
);

const errors = [];

if (!mainJs) {
  errors.push('未找到主入口 JS（index-*.js）');
} else if (mainJs.gzipKb > budgets.maxMainJsGzipKb) {
  errors.push(
    `主入口 JS gzip 超限：${mainJs.gzipKb.toFixed(2)}KB > ${budgets.maxMainJsGzipKb.toFixed(2)}KB`,
  );
}

if (!vendorReact) {
  errors.push('未找到 vendor-react chunk（vendor-react-*.js）');
} else if (vendorReact.gzipKb > budgets.maxVendorReactGzipKb) {
  errors.push(
    `vendor-react gzip 超限：${vendorReact.gzipKb.toFixed(2)}KB > ${budgets.maxVendorReactGzipKb.toFixed(2)}KB`,
  );
}

if (totals.gzipKb > budgets.maxTotalGzipKb) {
  errors.push(
    `总 gzip 超限：${totals.gzipKb.toFixed(2)}KB > ${budgets.maxTotalGzipKb.toFixed(2)}KB`,
  );
}

if (totals.brotliKb > budgets.maxTotalBrotliKb) {
  errors.push(
    `总 brotli 超限：${totals.brotliKb.toFixed(2)}KB > ${budgets.maxTotalBrotliKb.toFixed(2)}KB`,
  );
}

console.log('[bundle-budget] Budget thresholds');
console.log(
  JSON.stringify(
    {
      ...budgets,
      measured: {
        mainJsGzipKb: mainJs?.gzipKb ?? null,
        vendorReactGzipKb: vendorReact?.gzipKb ?? null,
        totalGzipKb: totals.gzipKb,
        totalBrotliKb: totals.brotliKb,
      },
    },
    null,
    2,
  ),
);

if (errors.length) {
  console.error('\n[bundle-budget] FAILED');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('\n[bundle-budget] PASSED');
