"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";

import { getDefaultRouteForRole, getStoredAuthSession } from "@/store/auth";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    let active = true;

    const redirect = async () => {
      const session = await getStoredAuthSession();
      if (!active) {
        return;
      }
      router.replace(session ? getDefaultRouteForRole(session.role) : "/login");
    };

    void redirect();
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <main className="auth-page relative grid h-dvh w-full overflow-hidden bg-[linear-gradient(135deg,#f8fbff_0%,#eff6ff_48%,#dbeafe_100%)]">
      <div className="auth-pulse absolute left-[8%] top-[12%] h-72 w-72 rounded-full bg-blue-300/26 blur-3xl" />
      <div className="auth-float absolute bottom-[12%] right-[10%] h-80 w-80 rounded-full bg-cyan-200/28 blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(37,99,235,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.06)_1px,transparent_1px)] bg-[size:56px_56px]" />

      <section className="relative z-10 flex h-full w-full items-center justify-center px-6">
        <div className="auth-form-card flex w-full max-w-[520px] flex-col items-center rounded-[32px] border border-white/80 bg-white/82 px-8 py-12 text-center shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur-2xl">
          <div className="yan-mark-gradient grid size-16 place-items-center rounded-[24px] text-white shadow-[0_20px_48px_rgba(37,99,235,0.24)]">
            <LoaderCircle className="size-6 animate-spin" />
          </div>
          <div className="mt-6 text-[11px] font-semibold uppercase tracking-[0.26em] text-[#2563eb]">
            ImageRouter
          </div>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">正在进入工作区</h1>
          <p className="mt-3 max-w-sm text-sm leading-6 text-slate-500">
            正在确认会话状态，并切换到你的图像路由控制台。
          </p>
        </div>
      </section>
    </main>
  );
}
