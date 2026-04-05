/**
 * svelte-i18n 构建脚本
 * 输出 ESM (.mjs) / CJS (.cjs) / IIFE (.js)
 */
import esbuild from 'esbuild'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DIST = path.join(ROOT, 'dist')
const ENTRY = path.join(ROOT, 'src', 'index.ts')

// 清空 dist 目录
if (fs.existsSync(DIST)) {
    fs.rmSync(DIST, { recursive: true })
}
fs.mkdirSync(DIST, { recursive: true })

const commonOptions = {
    entryPoints: [ENTRY],
    bundle: true,
    external: ['svelte', 'svelte/*'],
    minify: true,
    target: 'esnext',
    logLevel: 'info',
}

console.log('🔨 开始构建 svelte-i18n...\n')

// 1. ESM 格式
console.log('📦 构建 ESM (.mjs)...')
await esbuild.build({
    ...commonOptions,
    format: 'esm',
    outfile: path.join(DIST, 'svelte-i18n.mjs'),
})

// 2. CJS 格式
console.log('📦 构建 CJS (.cjs)...')
await esbuild.build({
    ...commonOptions,
    format: 'cjs',
    outfile: path.join(DIST, 'svelte-i18n.cjs'),
})

// 3. IIFE 格式 (CDN)
console.log('📦 构建 IIFE (.js) — CDN 使用...')
await esbuild.build({
    ...commonOptions,
    format: 'iife',
    globalName: 'SvelteI18n',
    external: [],
    outfile: path.join(DIST, 'svelte-i18n.iife.js'),
})

// 复制类型声明
const srcDir = path.join(ROOT, 'src')
const typesDir = path.join(DIST, 'types')
fs.mkdirSync(typesDir, { recursive: true })
for (const f of fs.readdirSync(srcDir)) {
    if (f.endsWith('.ts')) {
        fs.copyFileSync(path.join(srcDir, f), path.join(typesDir, f))
    }
}

// 输出构建结果
console.log('\n✅ 构建完成！输出目录: dist/')
const files = fs.readdirSync(DIST).filter((f) => !fs.statSync(path.join(DIST, f)).isDirectory())
for (const file of files) {
    const size = fs.statSync(path.join(DIST, file)).size
    const sizeKB = (size / 1024).toFixed(1)
    console.log(`  ${file} — ${sizeKB} KB`)
}
