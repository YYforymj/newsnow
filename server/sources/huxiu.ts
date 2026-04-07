interface HuxiuHotArticle {
  aid: number
  title: string
  url: string
}

interface HuxiuHotResponse {
  success: boolean
  data: HuxiuHotArticle[]
}

export default defineSource(async () => {
  async function request(url: string, init?: RequestInit) {
    const res = await fetch(url, {
      method: "POST",
      signal: AbortSignal.timeout(10000),
      ...init,
    })

    return await res.json() as HuxiuHotResponse
  }

  let res = await request("https://api-article.huxiu.com/v1/index/hotArticles?platform=m")

  // Fallback for environments where query handling may differ.
  if (!res?.success || !Array.isArray(res?.data)) {
    res = await request("https://api-article.huxiu.com/v1/index/hotArticles", {
      headers: {
        "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: new URLSearchParams({ platform: "m" }).toString(),
    })
  }

  if (!res.success || !Array.isArray(res.data)) {
    throw new Error("Cannot fetch huxiu hot articles")
  }

  return res.data.map(item => ({
    id: item.aid,
    title: item.title,
    url: item.url,
    mobileUrl: item.url,
  }))
})
