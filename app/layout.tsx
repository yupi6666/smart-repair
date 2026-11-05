import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: '智能报修小助手',
  description: '设备报修、AI 自助排查建议与工单进度管理'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-lg text-white">
                🔧
              </span>
              <span>
                <span className="block text-base font-semibold leading-5 text-slate-900">
                  智能报修小助手
                </span>
                <span className="block text-[11px] text-slate-400">AI 自助排查 · 工单全程跟踪</span>
              </span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link
                href="/"
                className="rounded-lg px-3 py-2 font-medium text-slate-600 transition hover:bg-brand-50 hover:text-brand-600"
              >
                提交报修
              </Link>
              <Link
                href="/tickets"
                className="rounded-lg px-3 py-2 font-medium text-slate-600 transition hover:bg-brand-50 hover:text-brand-600"
              >
                工单列表
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
        <footer className="mx-auto max-w-5xl px-5 pb-10 pt-4 text-center text-xs text-slate-400">
          智能报修小助手 · Next.js + Tailwind CSS + Supabase + AI
        </footer>
      </body>
    </html>
  )
}
