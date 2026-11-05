'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { fetchTicket, updateTicketSuggestions, updateTicketStatus } from '@/lib/tickets'
import { Ticket, TicketStatus, STATUSES } from '@/lib/types'
import StatusBadge from '@/components/StatusBadge'

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id as string

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const t = await fetchTicket(id)
    setTicket(t)
    setLoading(false)
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function changeStatus(status: TicketStatus) {
    if (!ticket) return
    setTicket({ ...ticket, status })
    await updateTicketStatus(String(ticket.id), status)
  }

  async function regenerateSuggestions() {
    if (!ticket) return
    setAiLoading(true)
    setNotice('')
    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceType: ticket.device_type, description: ticket.description })
      })
      const data = await res.json()
      if (Array.isArray(data.suggestions)) {
        setTicket({ ...ticket, suggestions: data.suggestions })
        await updateTicketSuggestions(String(ticket.id), data.suggestions)
        setNotice(data.fallback ? 'AI 服务暂不可用，已返回内置排查建议' : 'AI 建议已更新')
      }
    } catch {
      setNotice('建议生成失败，请稍后重试')
    } finally {
      setAiLoading(false)
    }
  }

  if (loading) {
    return <div className="card px-6 py-12 text-center text-sm text-slate-400">加载中…</div>
  }

  if (!ticket) {
    return (
      <div className="card px-6 py-12 text-center">
        <p className="text-sm text-slate-500">没有找到这条工单</p>
        <Link href="/tickets" className="mt-3 inline-block text-xs font-medium text-brand-600 underline">
          返回工单列表
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/tickets" className="text-xs font-medium text-slate-500 hover:text-brand-600">
          ← 返回工单列表
        </Link>
        <div className="flex items-center gap-2">
          <StatusBadge status={ticket.status} />
          <select
            className="input w-auto py-1.5 text-xs"
            value={ticket.status}
            onChange={(e) => changeStatus(e.target.value as TicketStatus)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <section className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900">工单 #{String(ticket.id)}</h1>
            <p className="mt-1 text-xs text-slate-500">
              提交时间：{new Date(ticket.created_at).toLocaleString('zh-CN')}
            </p>
          </div>
        </div>

        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-slate-400">提交人</dt>
            <dd className="mt-1 text-sm text-slate-800">{ticket.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-400">办公区</dt>
            <dd className="mt-1 text-sm text-slate-800">{ticket.area}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-400">设备类型</dt>
            <dd className="mt-1 text-sm text-slate-800">{ticket.device_type}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-400">当前状态</dt>
            <dd className="mt-1 text-sm text-slate-800">{ticket.status}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium text-slate-400">故障描述</dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-800">
              {ticket.description}
            </dd>
          </div>
        </dl>
      </section>

      <section className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">🤖 AI 自助排查建议</h2>
            <p className="mt-1 text-xs text-slate-500">照着建议先试一试，修不好再等运维上门。</p>
          </div>
          <button onClick={regenerateSuggestions} className="btn-ghost" disabled={aiLoading}>
            {aiLoading ? '生成中…' : '重新生成'}
          </button>
        </div>

        {notice && (
          <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">{notice}</p>
        )}

        {ticket.suggestions.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">暂无建议，点击右上角「重新生成」。</p>
        ) : (
          <ol className="mt-4 space-y-3">
            {ticket.suggestions.map((s, i) => (
              <li key={i} className="flex gap-3 rounded-xl bg-brand-50/60 px-4 py-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
                  {i + 1}
                </span>
                <span className="text-sm leading-6 text-slate-700">{s}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}
