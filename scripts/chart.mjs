// Builds chart.svg from the real contribution calendar. Needs GITHUB_TOKEN.
import fs from 'node:fs'

const LOGIN = 'TektonXYZ'
const PINK = '#FF69B4'
const LEVELS = { NONE: '#14161f', FIRST_QUARTILE: '#3b1a6e', SECOND_QUARTILE: '#7a35d6', THIRD_QUARTILE: '#c44fd9', FOURTH_QUARTILE: PINK }
const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation Mono',monospace"
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const query = `query($login: String!) {
  user(login: $login) {
    repositories(ownerAffiliations: OWNER, privacy: PUBLIC) { totalCount }
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount contributionLevel } }
      }
    }
  }
}`

const response = await fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: { Authorization: `bearer ${process.env.GITHUB_TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': LOGIN },
  body: JSON.stringify({ query, variables: { login: LOGIN } }),
})
const { data, errors } = await response.json()
if (errors || !data?.user) throw new Error(`GitHub said no: ${JSON.stringify(errors)}`)

const { totalContributions, weeks } = data.user.contributionsCollection.contributionCalendar
const days = weeks.flatMap((week) => week.contributionDays)

function streaks() {
  let longest = 0
  let run = 0
  for (const day of days) {
    run = day.contributionCount ? run + 1 : 0
    longest = Math.max(longest, run)
  }
  // Today not being filled yet doesn't break the streak.
  const counts = days.map((day) => day.contributionCount)
  if (!counts.at(-1)) counts.pop()
  const firstGap = counts.reverse().findIndex((count) => !count)
  return { current: firstGap === -1 ? counts.length : firstGap, longest }
}

const { current, longest } = streaks()
const stats = [['contributions, last year', totalContributions], ['day streak', current], ['longest streak', longest], ['public repos', data.user.repositories.totalCount]]

const [W, H, PITCH, CELL, LEFT, TOP] = [1200, 268, 21, 17, (1200 - weeks.length * 21 + 4) / 2, 136]
const cells = weeks.flatMap((week, col) => week.contributionDays.map((day) => {
  const row = new Date(`${day.date}T00:00:00Z`).getUTCDay()
  const active = day.contributionLevel !== 'NONE'
  const anim = active ? ` class="d" style="animation-delay:${(col * 0.02).toFixed(2)}s"` : ''
  return `<rect x="${LEFT + col * PITCH}" y="${TOP + row * PITCH}" width="${CELL}" height="${CELL}" rx="3" fill="${LEVELS[day.contributionLevel]}"${anim}/>`
}))

let lastMonth = -1
let lastCol = -3
const months = weeks.flatMap((week, col) => {
  const month = new Date(`${week.contributionDays[0].date}T00:00:00Z`).getUTCMonth()
  if (month === lastMonth || col > weeks.length - 3) return []
  lastMonth = month
  if (col - lastCol < 3) return []
  lastCol = col
  return `<text x="${LEFT + col * PITCH}" y="${TOP - 10}" font-family="${MONO}" font-size="13" fill="#6e7681">${MONTHS[month]}</text>`
})

const blocks = stats.map(([label, value], i) => {
  const x = LEFT + i * ((W - LEFT * 2) / 4)
  return `<text x="${x}" y="62" font-family="${MONO}" font-size="40" font-weight="700" fill="${PINK}">${value}</text><text x="${x}" y="88" font-family="${MONO}" font-size="15" fill="#8b8fa3">${label}</text>`
})

fs.writeFileSync('chart.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H + 22}" role="img" aria-label="${totalContributions} contributions in the last year">
<defs><linearGradient id="sweep" x1="0" x2="1"><stop offset="0" stop-color="${PINK}" stop-opacity="0"/><stop offset=".5" stop-color="${PINK}" stop-opacity=".2"/><stop offset="1" stop-color="${PINK}" stop-opacity="0"/></linearGradient></defs>
<style>
.d{animation:glow 6s ease-in-out infinite}
.s{animation:sweep 6s linear infinite}
@keyframes glow{0%,88%,100%{filter:brightness(1)}94%{filter:brightness(1.6)}}
@keyframes sweep{from{transform:translateX(-160px)}to{transform:translateX(${W}px)}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}.s{display:none}}
</style>
<rect width="${W}" height="${H + 22}" rx="16" fill="#050308"/>
${blocks.join('\n')}
${months.join('\n')}
${cells.join('\n')}
<rect class="s" x="0" y="${TOP - 4}" width="160" height="${7 * PITCH + 4}" fill="url(#sweep)"/>
</svg>
`)
