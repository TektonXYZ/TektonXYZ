// Builds the hero, stats and terminal art in assets/. Usage: node scripts/art.mjs scripts/facts.json
import fs from 'node:fs'

const facts = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const PURPLE = '#9945FF'
const PINK = '#FF69B4'
const EMPTY = '#14161f'
const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation Mono',monospace"

const GLYPHS = {
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  N: ['10001', '11001', '10101', '10101', '10011', '10001', '10001'],
}

const channel = (color, i) => parseInt(color.slice(1 + i * 2, 3 + i * 2), 16)
const mix = (a, b, t) => '#' + [0, 1, 2].map((i) => Math.round(channel(a, i) + (channel(b, i) - channel(a, i)) * t).toString(16).padStart(2, '0')).join('')
const random = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

function hero() {
  const [W, H, COLS, ROWS, CELL, PITCH, TOP] = [1200, 376, 40, 7, 25, 29, 36]
  const left = (W - COLS * PITCH + PITCH - CELL) / 2
  const word = 'TEKTON'
  const startCol = Math.floor((COLS - (word.length * 6 - 1)) / 2)
  const lit = new Set()
  ;[...word].forEach((letter, i) => GLYPHS[letter].forEach((line, row) => [...line].forEach((on, col) => {
    if (on === '1') lit.add(`${startCol + i * 6 + col},${row}`)
  })))

  const roll = random(7)
  const cells = []
  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < ROWS; row++) {
      const x = left + col * PITCH
      const y = TOP + row * PITCH
      const box = `x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="3"`
      if (lit.has(`${col},${row}`)) {
        const pop = (0.5 + (col - startCol) * 0.045 + row * 0.02).toFixed(2)
        const shine = (2.2 + col * 0.09).toFixed(2)
        cells.push(`<rect class="l" ${box} fill="${mix(PURPLE, PINK, (col - startCol) / 34)}" style="animation-delay:${pop}s,${shine}s"/>`)
      } else {
        const chance = roll()
        const fill = chance > 0.95 ? '#241338' : EMPTY
        const twinkle = chance > 0.95 ? ` class="t" style="animation-delay:${(roll() * 7).toFixed(2)}s"` : ''
        cells.push(`<rect ${box} fill="${fill}"${twinkle}/>`)
      }
    }
  }
  const legendRight = left + (COLS - 1) * PITCH + CELL
  const legendY = TOP + ROWS * PITCH + 6
  const swatchLeft = legendRight - 113
  const legend = [EMPTY, '#3b1a6e', '#7a35d6', '#c44fd9', PINK].map((fill, i) => `<rect x="${swatchLeft + i * 16}" y="${legendY}" width="12" height="12" rx="2" fill="${fill}"/>`).join('')
  const line = 'solo builder // ship first, sleep later'
  const width = line.length * 15.6

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="TEKTON written in contribution squares">
<style>
.l{animation:pop .45s cubic-bezier(.2,1.7,.4,1) both,shine 6s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
.t{animation:twinkle 7s ease-in-out infinite}
.cover{animation:type 2.1s steps(${line.length}) 1.5s both}
.cursor{animation:slide 2.1s steps(${line.length}) 1.5s both,blink 1s steps(2) infinite}
.sub{animation:fade .8s ease 3.7s both}
@keyframes pop{from{opacity:0;transform:scale(.2)}to{opacity:1;transform:scale(1)}}
@keyframes shine{0%,82%,100%{filter:brightness(1)}90%{filter:brightness(1.55)}}
@keyframes twinkle{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes type{from{transform:translateX(0)}to{transform:translateX(${width}px)}}
@keyframes slide{from{transform:translateX(0)}to{transform:translateX(${width}px)}}
@keyframes blink{50%{opacity:0}}
@keyframes fade{from{opacity:0}to{opacity:1}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}.cover,.cursor{display:none}}
</style>
<rect width="${W}" height="${H}" rx="16" fill="#050308"/>
${cells.join('\n')}
<text x="${swatchLeft - 8}" y="${legendY + 10}" font-family="${MONO}" font-size="12" fill="#6e7681" text-anchor="end">Less</text>${legend}<text x="${legendRight}" y="${legendY + 10}" font-family="${MONO}" font-size="12" fill="#6e7681" text-anchor="end">More</text>
<text x="${W / 2}" y="306" font-family="${MONO}" font-size="26" fill="${PINK}" text-anchor="middle" textLength="${width}">${line}</text>
<rect class="cover" x="${(W - width) / 2}" y="280" width="${width + 4}" height="36" fill="#050308"/>
<rect class="cursor" x="${(W - width) / 2}" y="284" width="13" height="28" fill="${PINK}"/>
<text class="sub" x="${W / 2}" y="348" font-family="${MONO}" font-size="17" fill="#8b8fa3" text-anchor="middle" letter-spacing="1">games · simulations · ai · onchain</text>
</svg>
`
}

function terminal() {
  const lines = [
    ['$ whoami', 'tekton. no team. no funding. just commits.'],
    ['$ ls ~/shipped | wc -l', facts.sites],
    ['$ tree -L 1 ~/shipped', facts.kinds],
    ['$ cat ~/stack', 'typescript  rust  python  c++  go  solana  next.js  three.js'],
    ['$ cat ~/now', 'front ends going open source, one a day'],
  ]
  const [W, GAP, START] = [1200, 38, 86]
  const H = START + lines.length * 2 * GAP - 6
  const row = (text, y, i, command) => `<text class="r" style="animation-delay:${(0.25 + i * 0.32).toFixed(2)}s" x="44" y="${y}" font-family="${MONO}" font-size="21" fill="${command ? PINK : '#d7dae3'}">${text}</text>`
  const rows = lines.flatMap(([command, answer], i) => [
    row(command, START + i * 2 * GAP, i * 2, true),
    row(answer, START + i * 2 * GAP + GAP - 6, i * 2 + 1, false),
  ])
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Terminal showing who Tekton is and what is shipping">
<defs><linearGradient id="edge" x1="0" x2="1"><stop offset="0" stop-color="${PURPLE}"/><stop offset="1" stop-color="${PINK}"/></linearGradient></defs>
<style>
.r{animation:in .3s ease both}
@keyframes in{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
</style>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="14" fill="#0a0810" stroke="url(#edge)" stroke-width="2"/>
<circle cx="32" cy="30" r="7" fill="${PINK}"/><circle cx="56" cy="30" r="7" fill="#c44fd9"/><circle cx="80" cy="30" r="7" fill="${PURPLE}"/>
${rows.join('\n')}
</svg>
`
}

// Each digit is a strip of 0-9 that rolls down and lands on the real number.
function stats() {
  const [W, H, DIGIT, ROW] = [1200, 148, 24, 48]
  const blocks = [[facts.sites, 'live sites'], [facts.projects, 'projects'], [facts.lines, 'lines of code'], [facts.nights, 'overnight builds'], [facts.films, 'films cut']]
  const width = (chars) => [...chars].reduce((sum, c) => sum + (/\d/.test(c) ? DIGIT : 13), 0)
  const body = blocks.map(([value, label], b) => {
    const chars = String(value)
    const center = (W / blocks.length) * (b + 0.5)
    let x = center - width(chars) / 2
    const parts = [...chars].map((char, i) => {
      const at = x
      x += /\d/.test(char) ? DIGIT : 13
      if (!/\d/.test(char)) return `<text x="${at + 1}" y="66" font-family="${MONO}" font-size="30" font-weight="700" fill="${PINK}">${char}</text>`
      const strip = Array.from({ length: 10 }, (_, n) => `<text x="${DIGIT / 2}" y="${n * ROW + 38}" font-family="${MONO}" font-size="40" font-weight="700" fill="${PINK}" text-anchor="middle">${n}</text>`).join('')
      return `<svg x="${at}" y="28" width="${DIGIT}" height="${ROW}"><g class="roll" style="transform:translateY(-${Number(char) * ROW}px);animation-delay:${(0.2 + b * 0.15 + i * 0.05).toFixed(2)}s">${strip}</g></svg>`
    })
    return `${parts.join('')}<text x="${center}" y="112" font-family="${MONO}" font-size="15" fill="#8b8fa3" text-anchor="middle">${label}</text>`
  })
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${blocks.map(([value, label]) => `${value} ${label}`).join(', ')}">
<defs><linearGradient id="edge" x1="0" x2="1"><stop offset="0" stop-color="${PURPLE}"/><stop offset="1" stop-color="${PINK}"/></linearGradient></defs>
<style>
.roll{animation:roll 1.9s cubic-bezier(.16,1,.3,1) backwards}
@keyframes roll{from{transform:translateY(-${9 * ROW}px)}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
</style>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="14" fill="#0a0810" stroke="url(#edge)" stroke-width="2"/>
${body.join('\n')}
</svg>
`
}

fs.mkdirSync('assets', { recursive: true })
fs.writeFileSync('assets/stats.svg', stats())
fs.writeFileSync('assets/hero.svg', hero())
fs.writeFileSync('assets/terminal.svg', terminal())
