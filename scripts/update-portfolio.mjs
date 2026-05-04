#!/usr/bin/env node
// Refreshes the README.md sections marked with
//   <!--START_SECTION:projects--> ... <!--END_SECTION:projects-->
//   <!--START_SECTION:posts-->    ... <!--END_SECTION:posts-->
// using content scraped from https://nathanredblur.dev.
//
// Run locally:   node scripts/update-portfolio.mjs
// Run via CI:    .github/workflows/update-portfolio.yml

import { readFile, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const README_PATH = resolve(__dirname, '..', 'README.md')
const SITE = 'https://nathanredblur.dev'
const POSTS_LIMIT = 5

// ---------- helpers ----------

const decodeEntities = (str = '') =>
  str
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')

const normalizeWhitespace = (str = '') => str.replace(/\s+/g, ' ').trim()

const stripTags = (html = '') =>
  decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()

const fetchHtml = async (url) => {
  const res = await fetch(url, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (compatible; nathanredblur-readme-bot/1.0; +https://github.com/nathanredblur/nathanredblur)',
    },
  })
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`)
  return res.text()
}

const replaceSection = (markdown, name, body) => {
  const start = `<!--START_SECTION:${name}-->`
  const end = `<!--END_SECTION:${name}-->`
  const pattern = new RegExp(`${start}[\\s\\S]*?${end}`, 'm')
  if (!pattern.test(markdown)) {
    console.warn(`! Section "${name}" not found in README.md — skipping.`)
    return markdown
  }
  return markdown.replace(pattern, `${start}\n${body.trim()}\n${end}`)
}

// ---------- posts (via RSS feed — much more stable than HTML scraping) ----------

const parsePosts = (xml) => {
  const items = []
  const itemRe = /<item>([\s\S]*?)<\/item>/g
  const pick = (block, tag) => {
    const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
    return m ? decodeEntities(m[1].trim()) : ''
  }

  let match
  while ((match = itemRe.exec(xml)) !== null) {
    const block = match[1]
    const pubDate = pick(block, 'pubDate')
    items.push({
      title: pick(block, 'title'),
      url: pick(block, 'link'),
      description: pick(block, 'description'),
      date: pubDate ? toIsoDate(pubDate) : '',
    })
  }
  return items
}

const toIsoDate = (rfc822) => {
  const d = new Date(rfc822)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

const renderPosts = (posts) => {
  if (!posts.length) return '_No posts found._'
  return posts
    .slice(0, POSTS_LIMIT)
    .map((p) => {
      const date = p.date ? ` <sub>· ${p.date}</sub>` : ''
      const desc = p.description ? ` — ${p.description}` : ''
      return `- **[${p.title}](${p.url})**${desc}${date}`
    })
    .join('\n')
}

// ---------- projects ----------

const parseProjects = (html) => {
  // Each project is `<article class="glow-card glow-card-project-{slug} ...">...</article>`
  const articleRe =
    /<article class="glow-card glow-card-project-[a-z0-9-]+[^"]*"[^>]*>([\s\S]*?)<\/article>/g
  const projects = []
  let match
  while ((match = articleRe.exec(html)) !== null) {
    const body = match[1]

    const titleMatch = body.match(/<h3[^>]*>\s*([^<]+?)\s*<\/h3>/)
    const descMatch = body.match(
      /<p class="text-sm text-gray-400 leading-relaxed m-0"[^>]*>\s*([\s\S]*?)\s*<\/p>/
    )

    const toolMatches = [
      ...body.matchAll(
        /<span class="text-\[0\.65rem\] font-medium px-2 py-0\.5 rounded bg-\[#1a1443\][^"]*"[^>]*>\s*([^<]+?)\s*<\/span>/g
      ),
    ]

    const linkMatches = [
      ...body.matchAll(
        /<a\s+href="(https?:\/\/[^"]+)"[^>]*>[\s\S]*?<span[^>]*>\s*(Source|Live)\s*<\/span>\s*<\/a>/g
      ),
    ]

    const status = body.match(
      /<span class="shrink-0[^"]*"[^>]*>\s*([^<]+?)\s*<\/span>/
    )

    const links = {}
    for (const link of linkMatches) {
      links[link[2].toLowerCase()] = link[1]
    }

    if (!titleMatch) continue
    projects.push({
      title: normalizeWhitespace(titleMatch[1]),
      status: status ? normalizeWhitespace(status[1]) : '',
      description: descMatch ? stripTags(descMatch[1]) : '',
      tools: toolMatches.map((m) => normalizeWhitespace(m[1])),
      source: links.source ?? '',
      live: links.live ?? '',
    })
  }
  return projects
}

const renderProjects = (projects) => {
  if (!projects.length) return '_No projects found._'

  const rows = projects.map((p) => {
    // Title links to live demo when available, else source, else plain text.
    const titleHref = p.live || p.source || ''
    const heading = titleHref ? `[${p.title}](${titleHref})` : p.title
    // Show source link separately (live is already on the title).
    const extras = []
    if (p.live && p.source) extras.push(`[Source](${p.source})`)
    else if (p.source && !p.live) extras.push(`[Source](${p.source})`)
    const extrasStr = extras.length ? ` · ${extras.join(' · ')}` : ''

    const tools = p.tools.length
      ? ` <br/> \`${p.tools.join('\` · \`')}\``
      : ''
    const desc = p.description || ''
    return `| **${heading}** | ${desc}${extrasStr}${tools} |`
  })

  return ['| Project | What it is |', '|---|---|', ...rows].join('\n')
}

// ---------- main ----------

const main = async () => {
  console.log('Fetching projects + posts from nathanredblur.dev …')
  const [rssXml, projectsHtml] = await Promise.all([
    fetchHtml(`${SITE}/rss.xml`),
    fetchHtml(`${SITE}/projects`),
  ])

  const posts = parsePosts(rssXml)
  const projects = parseProjects(projectsHtml)

  console.log(`  → ${posts.length} posts (RSS), ${projects.length} projects`)

  let readme = await readFile(README_PATH, 'utf8')
  readme = replaceSection(readme, 'projects', renderProjects(projects))
  readme = replaceSection(readme, 'posts', renderPosts(posts))

  await writeFile(README_PATH, readme, 'utf8')
  console.log('README.md updated.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
