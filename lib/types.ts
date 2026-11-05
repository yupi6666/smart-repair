export type TicketStatus = '待处理' | '处理中' | '已完成'

export interface Ticket {
  id: string | number
  name: string
  area: string
  device_type: string
  description: string
  status: TicketStatus
  suggestions: string[]
  created_at: string
}

export interface NewTicket {
  name: string
  area: string
  device_type: string
  description: string
  suggestions?: string[]
}

export const AREAS = ['A区', 'B区', 'C区'] as const
export const DEVICES = ['电脑', '打印机', '投影仪'] as const
export const STATUSES: TicketStatus[] = ['待处理', '处理中', '已完成']
