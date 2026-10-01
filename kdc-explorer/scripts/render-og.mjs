// 오픈그래프 이미지 만들기: npm run og
// design/og-image.html을 브라우저(Edge 또는 Chrome)로 열어 public/og-image.png(1200×630)로 저장한다.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const source = join(root, 'design', 'og-image.html')
const output = join(root, 'public', 'og-image.png')

const candidates = [
  process.env.BROWSER_PATH,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean)
const browser = candidates.find((path) => existsSync(path))
if (!browser) {
  console.error('✖ Edge나 Chrome을 찾지 못했습니다. BROWSER_PATH 환경변수로 경로를 지정해 주세요.')
  process.exit(1)
}

const profile = mkdtempSync(join(tmpdir(), 'kdc-og-'))
try {
  execFileSync(browser, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    `--user-data-dir=${profile}`,
    '--window-size=1200,630',
    '--virtual-time-budget=3000',
    `--screenshot=${output}`,
    pathToFileURL(source).href,
  ])
} finally {
  rmSync(profile, { recursive: true, force: true })
}
console.log(`✔ ${output}`)
