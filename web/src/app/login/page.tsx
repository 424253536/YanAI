"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, ImageIcon, KeyRound, LoaderCircle, Mail, Route, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import webConfig from "@/constants/common-env";
import { fetchRegisterOptions, login, type RegisterOptions } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useRedirectIfAuthenticated } from "@/lib/use-auth-guard";
import { getDefaultRouteForRole, setStoredAuthSession } from "@/store/auth";

type LoginMode = "user" | "admin";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authKey, setAuthKey] = useState("");
  const [registerOptions, setRegisterOptions] = useState<RegisterOptions | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isCheckingAuth } = useRedirectIfAuthenticated();

  useEffect(() => {
    void fetchRegisterOptions()
      .then(setRegisterOptions)
      .catch(() => setRegisterOptions(null));
  }, []);

  const startLinuxDoOAuth = () => {
    const startPath = registerOptions?.linuxdo_start_url || "/auth/linuxdo/start";
    const apiBase = webConfig.apiUrl.replace(/\/$/, "");
    window.location.href = `${apiBase}${startPath}`;
  };

  const handleLogin = async () => {
    setIsSubmitting(true);
    try {
      const data =
        mode === "admin"
          ? await login(authKey.trim())
          : await login({ email: email.trim(), password });
      const sessionKey = mode === "admin" ? authKey.trim() : data.token || "";
      if (!sessionKey) {
        throw new Error("登录未返回有效会话");
      }
      await setStoredAuthSession({
        key: sessionKey,
        role: data.role,
        subjectId: data.subject_id,
        name: data.name,
        email: data.email,
        quota: data.quota,
      });
      router.replace(getDefaultRouteForRole(data.role));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "登录失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="auth-page grid h-dvh w-full place-items-center">
        <LoaderCircle className="size-5 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="auth-page grid h-dvh w-full overflow-hidden bg-white lg:grid-cols-[minmax(360px,0.95fr)_minmax(420px,1.05fr)]">
      <section
        className="auth-visual-card relative hidden h-dvh overflow-hidden bg-slate-950 p-8 text-white lg:flex lg:flex-col lg:justify-between"
        style={{
          backgroundImage:
            'linear-gradient(135deg, rgba(15,23,42,0.88), rgba(29,78,216,0.38)), url("https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=85")',
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(56,189,248,0.42),transparent_28rem)]" />
        <div className="auth-pulse absolute right-12 top-20 h-44 w-44 rounded-full bg-blue-400/16 blur-2xl" />
        <div className="auth-float absolute bottom-28 right-12 w-72 rounded-[28px] border border-white/18 bg-white/14 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.24)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-white text-blue-600">
              <Route className="size-5" />
            </div>
            <div>
              <div className="text-sm font-semibold">路由策略已就绪</div>
              <div className="text-xs text-white/70">接口、通道、额度统一调度</div>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {["Generate", "Route", "Archive"].map((item) => (
              <div key={item} className="rounded-xl bg-white/12 px-3 py-2 text-center text-[11px] font-semibold text-white/82">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="yan-mark-gradient grid size-12 place-items-center rounded-2xl text-sm font-black shadow-[0_20px_50px_rgba(37,99,235,0.38)]">
            IR
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight">ImageRouter</div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-100/80">Routing workspace</div>
          </div>
        </div>

        <div className="relative z-10 max-w-[540px] space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/12 px-4 py-2 text-xs font-semibold text-blue-50 backdrop-blur">
            <ShieldCheck className="size-4" />
            安全接入你的图像生成工作流
          </div>
          <h2 className="text-5xl font-bold leading-[1.02] tracking-[-0.06em]">
            把每一次生成请求，
            <span className="block text-blue-100">送到最合适的通道。</span>
          </h2>
          <p className="max-w-md text-base leading-7 text-white/72">
            ImageRouter 让团队在一个控制台里完成创作、通道路由、额度管理和图片归档。
          </p>
        </div>
      </section>

      <section className="auth-form-card flex h-dvh items-center justify-center overflow-y-auto bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] px-5 py-10 sm:px-8">
        <div className="w-full max-w-[460px]">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="yan-mark-gradient grid size-11 place-items-center rounded-2xl text-sm font-black text-white">IR</div>
            <div>
              <div className="text-lg font-bold tracking-tight text-slate-950">ImageRouter</div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Routing workspace</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
              <ImageIcon className="size-4" />
              登录控制台
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-950">欢迎回来</h1>
            <p className="text-sm leading-6 text-slate-500">继续管理你的图像生成、路由通道和资产库。</p>
          </div>

          <div className="mt-8 grid grid-cols-2 rounded-2xl border border-[#dbeafe] bg-[#eff6ff] p-1 text-sm font-semibold">
            {[
              { value: "user" as const, label: "个人账号", icon: Mail },
              { value: "admin" as const, label: "管理员", icon: KeyRound },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.value}
                  type="button"
                  className={cn(
                    "flex h-11 items-center justify-center gap-2 rounded-xl transition",
                    mode === item.value ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-900",
                  )}
                  onClick={() => setMode(item.value)}
                >
                  <Icon className="size-4" />
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="mt-6 space-y-4">
            {mode === "user" ? (
              <>
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="邮箱地址"
                  className="h-12"
                />
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void handleLogin();
                  }}
                  placeholder="登录密码"
                  className="h-12"
                />
              </>
            ) : (
              <Input
                type="password"
                value={authKey}
                onChange={(event) => setAuthKey(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void handleLogin();
                }}
                placeholder="管理员密钥"
                className="h-12"
              />
            )}

            <Button className="h-12 w-full rounded-2xl" onClick={() => void handleLogin()} disabled={isSubmitting}>
              {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
              登录 ImageRouter
              {!isSubmitting ? <ArrowRight className="size-4" /> : null}
            </Button>

            {mode === "user" && registerOptions?.linuxdo_oauth_enabled ? (
              <Button type="button" variant="outline" className="h-12 w-full rounded-2xl" onClick={startLinuxDoOAuth}>
                使用 Linux DO 登录 / 注册
              </Button>
            ) : null}
          </div>

          {mode === "user" ? (
            <div className="mt-8 text-center text-sm text-slate-500">
              还没有账号？
              <Link href="/signup" className="ml-1 font-semibold text-blue-600 hover:text-blue-700">
                创建 ImageRouter 账号
              </Link>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
