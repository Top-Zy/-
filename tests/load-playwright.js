/**
 * 测试公共工具：优先使用项目内安装的 playwright-core，
 * 也兼容当前开发环境中放在 .tools 下的测试依赖。
 */
const fs = require('fs');
const path = require('path');

function loadPlaywright() {
  try {
    return require('playwright-core');
  } catch (e) { /* try local tooling */ }
  try {
    return require(path.join(__dirname, '..', '..', '.tools', 'wo-test', 'node_modules', 'playwright-core'));
  } catch (e) { /* ignore */ }
  throw new Error('未找到 playwright-core，请先在项目根目录执行：npm install');
}

function findEdge() {
  const candidates = [
    process.env.EDGE_PATH,
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Microsoft\\Edge\\Application\\msedge.exe')
  ].filter(Boolean);
  return candidates.find(p => fs.existsSync(p)) || null;
}

function launchOptions() {
  const edge = findEdge();
  if (edge) return { executablePath: edge, headless: true };
  return { channel: 'msedge', headless: true };
}

module.exports = {
  chromium: loadPlaywright().chromium,
  findEdge,
  launchOptions
};
