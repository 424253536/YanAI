"use client";

export function SettingsHeader() {
  return (
    <section className="yan-panel-strong mb-6 overflow-hidden rounded-2xl">
      <div className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="text-[11px] font-semibold tracking-[0.24em] text-[#8f5d2f] uppercase">Control room</div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-950">系统设置</h1>
          <p className="max-w-2xl text-sm leading-6 text-stone-500">
            管理基础能力、账号池、外部连接与访问密钥。所有配置保持原有保存逻辑，仅重塑呈现层。
          </p>
        </div>
        <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-[rgba(143,93,47,0.14)] bg-[#fffaf2]/58 text-center">
          {[
            ["Config", "核心配置"],
            ["Keys", "访问密钥"],
            ["Pools", "账号连接"],
          ].map(([label, value]) => (
            <div key={label} className="min-w-24 border-r border-[rgba(143,93,47,0.1)] px-4 py-3 last:border-r-0">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">{label}</div>
              <div className="mt-1 text-sm font-semibold text-stone-800">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
