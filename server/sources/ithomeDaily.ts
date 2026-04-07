import * as cheerio from "cheerio"
import type { NewsItem } from "@shared/types"

const ithomeDaily = defineSource(async () => {
  const html: string = await myFetch("https://www.ithome.com/")
  const $ = cheerio.load(html)
  const news: NewsItem[] = []

  $("#rank #d-1 li a").each((_, el) => {
    const $a = $(el)
    const title = $a.text().trim()
    const href = $a.attr("href")
    if (!title || !href) return
    const url = new URL(href, "https://www.ithome.com").toString()
    news.push({
      id: url,
      title,
      url,
    })
  })

  if (!news.length) {
    throw new Error("Cannot fetch ithome monthly rank list")
  }

  return news
})

export default {
  "ithome-daily": ithomeDaily,
}
