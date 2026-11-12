#!/usr/bin/env node
// Renders the README stats cards straight from the GitHub GraphQL API:
//   assets/stats-overview.svg  — stars, commits (last year), PRs, issues, contributed to
//   assets/stats-langs.svg     — top languages across owned, public, non-fork repos (by bytes)
//
// Run locally:   GH_TOKEN=$(gh auth token) node scripts/stats-cards.mjs
// Run via CI:    .github/workflows/cache-stats.yml

import { writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ASSETS = resolve(__dirname, '..', 'assets')
const USERNAME = 'nathanredblur'
const TOKEN = process.env.GH_TOKEN
const LANGS_LIMIT = 6

const THEME = {
  bg: '#0b0d12',
  title: '#a78bfa',
  icon: '#22d3ee',
  text: '#cbd5e1',
  radius: 16,
}
const WIDTH = 467
const HEIGHT = 195
const FONT = "'Segoe UI', Ubuntu, 'Helvetica Neue', Sans-Serif"

// Octicons (16px), https://primer.style/octicons
const ICONS = {
  star: 'M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z',
  commit:
    'M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z',
  pr: 'M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z',
  issue:
    'M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z',
  repo: 'M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.25.25 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z',
}

// ---------- GitHub API ----------

const graphql = async (query, variables) => {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      authorization: `bearer ${TOKEN}`,
      'content-type': 'application/json',
      'user-agent': 'nathanredblur-readme-bot/1.0',
    },
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) {
    const status = `${res.status} ${res.statusText}`
    throw new Error(`GitHub GraphQL ${status} — check that GH_TOKEN is valid`)
  }
  const { data, errors } = await res.json()
  if (errors?.length) throw new Error(`GitHub GraphQL: ${errors.map((e) => e.message).join('; ')}`)
  return data
}

const STATS_QUERY = `
  query ($login: String!) {
    user(login: $login) {
      name
      login
      contributionsCollection { totalCommitContributions restrictedContributionsCount }
      repositoriesContributedTo(
        first: 1
        contributionTypes: [COMMIT, ISSUE, PULL_REQUEST, REPOSITORY]
      ) { totalCount }
      pullRequests(first: 1) { totalCount }
      issues(first: 1) { totalCount }
    }
  }`

const REPOS_QUERY = `
  query ($login: String!, $after: String) {
    user(login: $login) {
      repositories(
        first: 100
        after: $after
        ownerAffiliations: OWNER
        isFork: false
        privacy: PUBLIC
      ) {
        pageInfo { hasNextPage endCursor }
        nodes {
          stargazerCount
          languages(first: 20, orderBy: { field: SIZE, direction: DESC }) {
            edges { size node { name color } }
          }
        }
      }
    }
  }`

const fetchRepos = async () => {
  const repos = []
  let after = null
  do {
    const { user } = await graphql(REPOS_QUERY, { login: USERNAME, after })
    repos.push(...user.repositories.nodes)
    after = user.repositories.pageInfo.hasNextPage ? user.repositories.pageInfo.endCursor : null
  } while (after)
  return repos
}

const topLanguages = (repos) => {
  const totals = new Map()
  for (const repo of repos) {
    for (const { size, node } of repo.languages.edges) {
      const prev = totals.get(node.name) ?? { name: node.name, color: node.color, size: 0 }
      prev.size += size
      totals.set(node.name, prev)
    }
  }
  const sorted = [...totals.values()].sort((a, b) => b.size - a.size).slice(0, LANGS_LIMIT)
  const sum = sorted.reduce((acc, l) => acc + l.size, 0)
  return sorted.map((l) => ({ ...l, color: l.color ?? '#858585', percent: (l.size / sum) * 100 }))
}

// ---------- SVG ----------

const escapeXml = (str) => String(str).replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`)

const card = ({
  title,
  desc,
  body,
}) => `<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="titleId descId">
  <title id="titleId">${escapeXml(title)}</title>
  <desc id="descId">${escapeXml(desc)}</desc>
  <style>
    .header { font: 600 18px ${FONT}; fill: ${THEME.title}; }
    .stat { font: 600 14px ${FONT}; fill: ${THEME.text}; }
    .lang { font: 400 12px ${FONT}; fill: ${THEME.text}; }
    .bold { font-weight: 700; }
  </style>
  <rect width="${WIDTH}" height="${HEIGHT}" rx="${THEME.radius}" fill="${THEME.bg}"/>
  <text x="25" y="35" class="header">${escapeXml(title)}</text>
  ${body}
</svg>
`

const statsCard = (user, totalStars) => {
  const { contributionsCollection: cc } = user
  const rows = [
    ['star', 'Total Stars Earned', totalStars],
    [
      'commit',
      'Total Commits (last year)',
      cc.totalCommitContributions + cc.restrictedContributionsCount,
    ],
    ['pr', 'Total PRs', user.pullRequests.totalCount],
    ['issue', 'Total Issues', user.issues.totalCount],
    ['repo', 'Contributed to (last year)', user.repositoriesContributedTo.totalCount],
  ]
  const body = rows
    .map(
      ([icon, label, value], i) => `<g transform="translate(25, ${60 + i * 25})">
    <path transform="translate(0, -12)" fill="${THEME.icon}" d="${ICONS[icon]}"/>
    <text x="25" class="stat bold">${label}:</text>
    <text x="260" class="stat bold">${value.toLocaleString('en-US')}</text>
  </g>`,
    )
    .join('\n  ')
  return card({
    title: `${user.name || user.login}'s GitHub Stats`,
    desc: rows.map(([, label, value]) => `${label}: ${value}`).join(', '),
    body,
  })
}

const langsCard = (langs) => {
  const barWidth = WIDTH - 50
  let offset = 0
  const segments = langs
    .map((l) => {
      const width = (l.percent / 100) * barWidth
      const rect = `<rect x="${offset.toFixed(2)}" width="${width.toFixed(2)}" height="8" fill="${l.color}"/>`
      offset += width
      return rect
    })
    .join('')
  const legend = langs
    .map((l, i) => {
      const x = (i % 2) * 210
      const y = Math.floor(i / 2) * 30
      return `<g transform="translate(${x}, ${y})">
      <circle cx="5" cy="-4" r="5" fill="${l.color}"/>
      <text x="16" class="lang">${escapeXml(l.name)} ${l.percent.toFixed(2)}%</text>
    </g>`
    })
    .join('\n    ')
  const body = `<mask id="bar"><rect width="${barWidth}" height="8" rx="4" fill="white"/></mask>
  <g transform="translate(25, 60)" mask="url(#bar)">${segments}</g>
  <g transform="translate(25, 105)">
    ${legend}
  </g>`
  return card({
    title: 'Most Used Languages',
    desc: langs.map((l) => `${l.name} ${l.percent.toFixed(2)}%`).join(', '),
    body,
  })
}

// ---------- main ----------

const main = async () => {
  if (!TOKEN) {
    throw new Error('GH_TOKEN is not set — export a GitHub token (e.g. `gh auth token`).')
  }
  const [{ user }, repos] = await Promise.all([
    graphql(STATS_QUERY, { login: USERNAME }),
    fetchRepos(),
  ])
  if (!user) throw new Error(`GitHub user "${USERNAME}" not found`)
  const totalStars = repos.reduce((acc, r) => acc + r.stargazerCount, 0)
  const langs = topLanguages(repos)
  if (!langs.length) throw new Error(`No languages found for ${USERNAME}'s repositories`)

  await writeFile(resolve(ASSETS, 'stats-overview.svg'), statsCard(user, totalStars))
  await writeFile(resolve(ASSETS, 'stats-langs.svg'), langsCard(langs))
  const langNames = langs.map((l) => l.name).join(', ')
  console.log(`✓ stats-overview.svg (${totalStars} stars) · stats-langs.svg (${langNames})`)
}

main().catch((err) => {
  console.error(`✗ ${err.message}`)
  process.exit(1)
})
