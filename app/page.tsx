import TicketForm from '@/components/TicketForm'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-500 px-7 py-8 text-white shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">设备坏了？先问问 AI</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/85">
          填写报修单，系统会根据设备类型和故障描述自动生成 3 条自助排查建议；照着建议试一试，
          修不好再等运维上门，工单进度全程可查。
        </p>
      </section>

      <TicketForm />

      <section className="card flex flex-wrap items-center justify-between gap-4 px-6 py-5">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">已经有报修单？</h2>
          <p className="mt-1 text-xs text-slate-500">在工单列表查看处理状态，点开任意一条可看 AI 排查建议。</p>
        </div>
        <Link href="/tickets" className="btn-ghost">
          查看工单列表 →
        </Link>
      </section>
    </div>
  )
}
