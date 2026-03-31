import * as cheerio from "cheerio"
import type { NewsItem } from "@shared/types"

function pickPublishedTime(text: string) {
  const m = text.match(/\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/)
  return m?.[0]
}

function normalizeUrl(url?: string) {
  if (!url) return undefined
  if (url.startsWith("//")) return `https:${url}`
  if (url.startsWith("/")) return `https://www.huxiu.com${url}`
  return url
}

export default defineSource(async () => {
  const html: string = await myFetch("https://www.huxiu.com/")
  const $ = cheerio.load(html)
  const items: NewsItem[] = []
  const seen = new Set<string>()

  // 优先提取正文列表链接（https://www.huxiu.com/article/{id}.html）
  $("a[href*='/article/']").each((_, el) => {
    const a = $(el)
    const url = normalizeUrl(a.attr("href"))
    const title = a.attr("title")?.trim() || a.text().trim()

    if (!url || !title) return
    if (!/\/article\/\d+/.test(url)) return
    if (seen.has(url)) return
    seen.add(url)

    const container = a.closest("article, li, div")
    const timeText = pickPublishedTime(container.text().replace(/\s+/g, " "))

    items.push({
      id: url,
      title,
      url,
      pubDate: timeText ? parseRelativeDate(timeText, "Asia/Shanghai").valueOf() : undefined,
    })
  })

  return items.slice(0, 30)
})
