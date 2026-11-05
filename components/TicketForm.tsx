'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AREAS, DEVICES, Ticket } from '@/lib/types'
import { createTicket, updateTicketSuggestions } from '@/lib/tickets'

export default function TicketForm() {
  const [name, setName] = useState('')
  const [area, setArea] = useState<string>(AREAS[0])
  const [deviceType, setDeviceType] = useState<string>(DEVICES[0])
  const [description, setDescription] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState<Ticket | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [aiLoading, setAiLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) return setError('请填写提交人姓名')
    if (!description.trim()) return setError('请填写故障描述（至少 5 个字）')
    if (description.trim().length < 5) return setError('故障描述太短了，请再补充一些细节')

    setLoading(true)
    try {
      const ticket = await createTicket({
        name: name.trim(),
        area,
        device_type: deviceType,
        description: description.trim()
      })
      setCreated(ticket)
      setSuggestions([])

      // 提交后异步请求 AI 建议，失败也不影响工单已创建
      setAiLoading(true)
      try {
        const res = await fetch('/api/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceType, description: description.trim() })
        })
        const data = await res.json()
        if (Array.isArray(data.suggestions)) {
          setSuggestions(data.suggestions)
          await updateTicketSuggestions(String(ticket.id), data.suggestions)
        }
      } catch (err) {
        console.error('获取 AI 建议失败', err)
      } finally {
        setAiLoading(false)
      }

      setName('')
      setDescription('')
      setArea(AREAS[0])
      setDeviceType(DEVICES[0])
    } catch (err: any) {
      setError(err?.message || '提交失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="card p-6">
      <h2 className="text-base font-semibold text-slate-900">提交报修单</h2>
      <p className="mt-1 text-xs text-slate-500">
        信息越具体，AI 给出的排查建议越准确。
      </p>

      <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="name">提交人</label>
            <input
              id="name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="你的姓名"
            />
          </div>
          <div>
            <label className="label" htmlFor="area">办公区</label>
            <select id="area" className="input" value={area} onChange={(e) => setArea(e.target.value)}>
              {AREAS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="device">设备类型</label>
            <select
              id="device"
              className="input"
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value)}
            >
              {DEVICES.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="description">故障描述</label>
          <textarea
            id="description"
            className="input min-h-[110px] resize-y"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="例如：打印机进纸时卡住，面板提示纸张卡在出纸口，反复重启无效"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '提交中…' : '提交报修并生成建议'}
          </button>
          <span className="text-xs text-slate-400">提交后 AI 会自动生成 3 条自助排查建议</span>
        </div>
      </form>

      {created && (
        <div className="mt-6 rounded-2xl border border-brand-100 bg-brand-50/60 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-brand-700">
              ✅ 报修单已提交（编号 {String(created.id)}）
            </h3>
            <Link href={`/tickets/${created.id}`} className="text-xs font-medium text-brand-600 underline">
              查看工单详情 →
            </Link>
          </div>

          <div className="mt-3">
            <p className="text-xs font-medium text-slate-500">AI 自助排查建议</p>
            {aiLoading ? (
              <p className="mt-2 text-sm text-slate-500">AI 正在分析故障……</p>
            ) : suggestions.length > 0 ? (
              <ol className="mt-2 space-y-2">
                {suggestions.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-700">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[11px] font-semibold text-white">
                      {i + 1}
                    </span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-2 text-sm text-slate-500">建议生成失败，可稍后在详情页重试。</p>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
