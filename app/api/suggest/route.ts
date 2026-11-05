import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface SuggestBody {
  deviceType?: string
  description?: string
}

// 规则兜底：即使 AI 服务不可用，也能返回可用建议，保证现场演示不中断
const RULES: Record<string, string[]> = {
  电脑: [
    '先确认电源线和显示器连接是否松动，长按电源键 10 秒强制重启',
    '开机连续蓝屏时，尝试进入安全模式并卸载最近安装的软件或驱动',
    '检查键盘鼠标是否被识别，可换一个 USB 接口重新插拔测试'
  ],
  打印机: [
    '卡纸时先打开后盖，沿出纸方向轻轻拉出纸张，切勿反方向硬拽',
    '打印空白页先检查墨盒/硒鼓是否安装到位，并执行一次打印头清洗',
    '无法连接时确认打印机与电脑处于同一网络，重启打印机和打印服务'
  ],
  投影仪: [
    '无画面先检查 HDMI/VGA 线是否插紧，并切换到正确的信号源',
    '画面偏色或闪烁时，尝试更换线缆或降低分辨率与刷新率',
    '投影仪过热会自动关机，请清理进风口灰尘并静置散热后再开机'
  ]
}

function ruleSuggestions(deviceType: string): string[] {
  return RULES[deviceType] || [
    '先检查设备电源与连接线是否正常',
    '尝试重启设备，观察故障是否复现',
    '记录故障现象并联系运维人员进一步处理'
  ]
}

function parseSuggestions(text: string): string[] {
  const trimmed = text.trim()
  // 优先按 JSON 数组解析
  try {
    const start = trimmed.indexOf('[')
    const end = trimmed.lastIndexOf(']')
    if (start !== -1 && end !== -1) {
      const arr = JSON.parse(trimmed.slice(start, end + 1))
      if (Array.isArray(arr)) {
        return arr
          .map((x) => {
            if (typeof x === 'string') return x
            if (x && typeof x === 'object') {
              const v = Object.values(x).find((val) => typeof val === 'string' && val.trim())
              return (v as string) || ''
            }
            return ''
          })
          .filter(Boolean)
          .slice(0, 3)
      }
    }
  } catch {
    // 继续按行解析
  }
  // 按行解析：去掉序号、项目符号
  return trimmed
    .split('\n')
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.、)])\s*/, '').trim())
    .filter((line) => line.length > 0)
    .slice(0, 3)
}

const SYSTEM_PROMPT =
  '你是一名企业 IT 运维工程师。请根据设备类型和故障描述，给出 3 条简短、可操作的自助排查建议。' +
  '只返回一个 JSON 字符串数组，例如 ["建议1","建议2","建议3"]，不要输出任何其他内容。每条建议不超过 40 个汉字。'

interface Provider {
  name: string
  endpoint: string
  model: string
  headers: Record<string, string>
}

function buildProviders(): Provider[] {
  const list: Provider[] = []
  const deepseekKey = process.env.DEEPSEEK_API_KEY
  if (deepseekKey) {
    list.push({
      name: 'deepseek',
      endpoint: 'https://api.deepseek.com/chat/completions',
      model: 'deepseek-chat',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${deepseekKey}`
      }
    })
  }
  // 免费兜底模型（无需密钥），保证 AI 建议在演示环境始终可用
  list.push({
    name: 'pollinations',
    endpoint: 'https://text.pollinations.ai/openai',
    model: 'openai-fast',
    headers: { 'Content-Type': 'application/json' }
  })
  list.push({
    name: 'blockrun',
    endpoint: 'https://blockrun.ai/api/v1/chat/completions',
    model: 'nvidia/gpt-oss-20b',
    headers: { 'Content-Type': 'application/json' }
  })
  return list
}

async function callProvider(
  provider: Provider,
  deviceType: string,
  description: string
): Promise<string[]> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)

  try {
    const res = await fetch(provider.endpoint, {
      method: 'POST',
      headers: provider.headers,
      signal: controller.signal,
      body: JSON.stringify({
        model: provider.model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `设备类型：${deviceType}\n故障描述：${description}` }
        ],
        stream: false,
        temperature: 0.6
      })
    })

    if (!res.ok) {
      const detail = await res.text()
      throw new Error(`${provider.name} 返回 ${res.status}: ${detail.slice(0, 120)}`)
    }

    const data = await res.json()
    const content = data?.choices?.[0]?.message?.content || ''
    const parsed = parseSuggestions(content)
    if (parsed.length === 0) throw new Error(`${provider.name} 未返回有效建议`)
    return parsed
  } finally {
    clearTimeout(timer)
  }
}

async function callModel(deviceType: string, description: string): Promise<string[]> {
  let lastError: unknown = null
  for (const provider of buildProviders()) {
    try {
      return await callProvider(provider, deviceType, description)
    } catch (err) {
      lastError = err
      console.warn(`[api/suggest] ${provider.name} 调用失败，尝试下一个模型`)
    }
  }
  throw lastError || new Error('所有 AI 模型均不可用')
}

export async function POST(req: Request) {
  let body: SuggestBody = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '请求体不是合法 JSON' }, { status: 400 })
  }

  const deviceType = (body.deviceType || '').trim()
  const description = (body.description || '').trim()

  if (!deviceType || !description) {
    return NextResponse.json(
      { error: '缺少参数 deviceType 或 description' },
      { status: 400 }
    )
  }

  try {
    const suggestions = await callModel(deviceType, description)
    return NextResponse.json({ suggestions })
  } catch (err: any) {
    console.error('[api/suggest] AI 调用失败：', err?.message || err)
    // 兜底返回规则建议，页面不会因为 AI 故障而不可用
    return NextResponse.json(
      { suggestions: ruleSuggestions(deviceType), fallback: true },
      { status: 200 }
    )
  }
}
