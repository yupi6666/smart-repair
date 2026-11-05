'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchTickets, updateTicketStatus } from '@/lib/tickets'
import { Ticket, TicketStatus, STATUSES } from '@/lib/types'
import StatusBadge from '@/components/StatusBadge'

const FILTERS = ['全部', ...STATUSES] as const

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('全部')
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState<'supabase' | 'local'>('local')

  const load = useCallback(async () => {
    setLoading(true)
    const { tickets, source } = await fetchTickets()
    setTickets(tickets)
    setSource(source)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function changeStatus(id: string | number, status: TicketStatus) {
    setTickets((list) => list.map((t) => (String(t.id) === String(id) ? { ...t, status } : t)))
    await updateTicketStatus(String(id), status)
  }

  const visible = filter === '全部' ? tickets : tickets.filter((t) => t.status === filter)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">工单列表</h1>
          <p className="mt-1 text-xs text-slate-500">
            共 {tickets.length} 条 · 数据源：{source === 'supabase' ? 'Supabase 云端' : '浏览器本地存储'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-ghost" disabled={loading}>
            {loading ? '刷新中…' : '↻ 刷新'}
          </button>
          <Link href="/" className="btn-primary">+ 新建报修</Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count = f === '全部' ? tickets.length : tickets.filter((t) => t.status === f).length
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                filter === f
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:text-brand-600'
              }`}
            >
              {f} ({count})
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="card px-6 py-12 text-center text-sm text-slate-400">加载中…</div>
      ) : visible.length === 0 ? (
        <div className="card px-6 py-12 text-center">
          <p className="text-sm text-slate-500">暂无工单</p>
          <Link href="/" className="mt-3 inline-block text-xs font-medium text-brand-600 underline">
            去提交第一条报修 →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((t) => (
            <div key={String(t.id)} className="card flex flex-wrap items-center gap-4 px-5 py-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/tickets/${t.id}`}
                    className="truncate text-sm font-semibold text-slate-900 hover:text-brand-600"
                  >
                    {t.device_type} · {t.description.slice(0, 28)}
                    {t.description.length > 28 ? '…' : ''}
                  </Link>
                  <StatusBadge status={t.status} />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {t.name} · {t.area} · {new Date(t.created_at).toLocaleString('zh-CN')}
                </p>
              </div>
              <select
                className="input w-auto min-w-[100px] py-1.5 text-xs"
                value={t.status}
                onChange={(e) => changeStatus(t.id, e.target.value as TicketStatus)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <Link href={`/tickets/${t.id}`} className="text-xs font-medium text-brand-600 underline">
                详情
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
