import { supabase } from './supabase'
import { Ticket, TicketStatus, NewTicket } from './types'

const LS_KEY = 'smart-repair-tickets'

function readLocal(): Ticket[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]')
  } catch {
    return []
  }
}

function writeLocal(list: Ticket[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list))
  } catch {
    // 忽略存储失败
  }
}

function normalize(row: any): Ticket {
  return {
    id: row.id,
    name: row.name,
    area: row.area,
    device_type: row.device_type,
    description: row.description,
    status: (row.status || '待处理') as TicketStatus,
    suggestions: Array.isArray(row.suggestions) ? row.suggestions : [],
    created_at: row.created_at || new Date().toISOString()
  }
}

/**
 * 获取全部工单：优先 Supabase，失败自动回退 localStorage
 */
export async function fetchTickets(): Promise<{ tickets: Ticket[]; source: 'supabase' | 'local' }> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false })
      if (!error && data) {
        return { tickets: data.map(normalize), source: 'supabase' }
      }
    } catch {
      // 网络异常时回退
    }
  }
  return { tickets: readLocal(), source: 'local' }
}

/**
 * 获取单条工单
 */
export async function fetchTicket(id: string): Promise<Ticket | null> {
  const numericId = Number(id)
  if (supabase && Number.isFinite(numericId)) {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', numericId)
        .maybeSingle()
      if (!error && data) return normalize(data)
    } catch {
      // 回退
    }
  }
  return readLocal().find((t) => String(t.id) === String(id)) || null
}

/**
 * 创建工单
 */
export async function createTicket(input: NewTicket): Promise<Ticket> {
  const payload = {
    name: input.name,
    area: input.area,
    device_type: input.device_type,
    description: input.description,
    status: '待处理' as TicketStatus,
    suggestions: input.suggestions || []
  }

  if (supabase) {
    try {
      const { data, error } = await supabase.from('tickets').insert([payload]).select()
      if (!error && data && data[0]) return normalize(data[0])
    } catch {
      // 回退
    }
  }

  const localTicket: Ticket = {
    ...payload,
    id: `local-${Date.now()}`,
    created_at: new Date().toISOString()
  }
  const list = readLocal()
  list.unshift(localTicket)
  writeLocal(list)
  return localTicket
}

/**
 * 更新工单状态
 */
export async function updateTicketStatus(id: string, status: TicketStatus): Promise<void> {
  const numericId = Number(id)
  if (supabase && Number.isFinite(numericId)) {
    try {
      const { error } = await supabase.from('tickets').update({ status }).eq('id', numericId)
      if (!error) return
    } catch {
      // 回退
    }
  }
  const list = readLocal().map((t) => (String(t.id) === String(id) ? { ...t, status } : t))
  writeLocal(list)
}

/**
 * 更新工单的 AI 建议
 */
export async function updateTicketSuggestions(id: string, suggestions: string[]): Promise<void> {
  const numericId = Number(id)
  if (supabase && Number.isFinite(numericId)) {
    try {
      const { error } = await supabase.from('tickets').update({ suggestions }).eq('id', numericId)
      if (!error) return
    } catch {
      // 回退
    }
  }
  const list = readLocal().map((t) =>
    String(t.id) === String(id) ? { ...t, suggestions } : t
  )
  writeLocal(list)
}
