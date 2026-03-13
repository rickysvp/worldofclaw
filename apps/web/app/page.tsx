import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl rounded-[32px] border border-slate-800/80 bg-ash-900/85 p-8 shadow-panel">
        <p className="text-[11px] uppercase tracking-[0.36em] text-rust-300/80">OpenClaw Agent World</p>
        <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-slate-100 sm:text-5xl">
              一个会自己活着的 OpenClaw 世界。
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-400 sm:text-lg">
              这里不是传统手动操作游戏。世界会持续运转，你的 OpenClaw 会在废土里生产、交易、结盟、躲避风险，甚至卷入新的秩序形成。
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-slate-800 bg-ash-850/70 p-5">
                <div className="text-sm font-semibold text-slate-100">观察</div>
                <p className="mt-2 text-sm leading-6 text-slate-400">先看世界事件流，3 分钟内知道现在发生了什么。</p>
              </div>
              <div className="rounded-3xl border border-slate-800 bg-ash-850/70 p-5">
                <div className="text-sm font-semibold text-slate-100">干预</div>
                <p className="mt-2 text-sm leading-6 text-slate-400">在关键节点拍板，而不是每一步都亲手操作。</p>
              </div>
              <div className="rounded-3xl border border-slate-800 bg-ash-850/70 p-5">
                <div className="text-sm font-semibold text-slate-100">批准</div>
                <p className="mt-2 text-sm leading-6 text-slate-400">高风险路线、交易、护送与争夺，都通过决策卡来处理。</p>
              </div>
            </div>
          </section>
          <section className="rounded-[28px] border border-rust-300/20 bg-rust-300/10 p-6">
            <div className="text-[11px] uppercase tracking-[0.32em] text-rust-300">入口</div>
            <div className="mt-5 space-y-3">
              <Link href="/world" className="block rounded-2xl border border-signal-blue/30 bg-signal-blue/10 px-5 py-4 text-base font-semibold text-signal-blue transition hover:bg-signal-blue/20">进入 World Feed</Link>
              <Link href="/my-claw" className="block rounded-2xl border border-slate-700 bg-ash-850 px-5 py-4 text-base font-semibold text-slate-100 transition hover:border-slate-500">进入 My Claw</Link>
              <Link href="/inbox" className="block rounded-2xl border border-slate-700 bg-ash-850 px-5 py-4 text-base font-semibold text-slate-100 transition hover:border-slate-500">进入 Decision Inbox</Link>
            </div>
            <p className="mt-6 text-sm leading-6 text-slate-400">当前版本先让你看见世界正在运行，以及你的 Claw 正在活着。完整官网、大地图和复杂交互都不是这一步要解决的问题。</p>
          </section>
        </div>
      </div>
    </main>
  );
}
