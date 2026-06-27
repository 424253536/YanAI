"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, BadgeCheck, LoaderCircle, MailCheck, Route } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import webConfig from "@/constants/common-env";
import { fetchRegisterOptions, registerPersonalUser, sendRegisterVerificationCode, type RegisterOptions } from "@/lib/api";
import { useRedirectIfAuthenticated } from "@/lib/use-auth-guard";
import { setStoredAuthSession } from "@/store/auth";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [registerOptions, setRegisterOptions] = useState<RegisterOptions | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
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

  const handleSendCode = async () => {
    setIsSendingCode(true);
    try {
      const data = await sendRegisterVerificationCode(email.trim());
      toast.success(data.required ? "验证码已发送，请检查邮箱" : "当前未启用邮箱验证");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "发送验证码失败");
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleSignup = async () => {
    setIsSubmitting(true);
    try {
      const data = await registerPersonalUser({
        email: email.trim(),
        password,
        name: name.trim(),
        verification_code: verificationCode.trim(),
      });
      await setStoredAuthSession({
        key: data.token,
        role: data.user.role,
        subjectId: data.user.id,
        name: data.user.name,
        email: data.user.email,
        quota: data.user.quota,
      });
      router.replace("/image");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "注册失败");
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
            'linear-gradient(135deg, rgba(15,23,42,0.88), rgba(14,165,233,0.34)), url("https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=85")',
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_16%,rgba(96,165,250,0.45),transparent_26rem)]" />
        <div className="auth-pulse absolute left-12 top-24 h-48 w-48 rounded-full bg-cyan-300/14 blur-2xl" />
        <div className="auth-float absolute bottom-28 right-12 w-72 rounded-[28px] border border-white/18 bg-white/14 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.24)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-white text-blue-600">
              <MailCheck className="size-5" />
            </div>
            <div>
              <div className="text-sm font-semibold">新成员接入</div>
              <div className="text-xs text-white/70">邮箱验证后自动进入创作空间</div>
            </div>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/16">
            <div className="h-full w-3/4 rounded-full bg-blue-200" />
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="yan-mark-gradient grid size-12 place-items-center rounded-2xl text-sm font-black shadow-[0_20px_50px_rgba(37,99,235,0.38)]">
            IR
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight">ImageRouter</div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-100/80">Team image workspace</div>
          </div>
        </div>

        <div className="relative z-10 max-w-[540px] space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/12 px-4 py-2 text-xs font-semibold text-blue-50 backdrop-blur">
            <BadgeCheck className="size-4" />
            为新的创作者准备好路由和额度
          </div>
          <h2 className="text-5xl font-bold leading-[1.02] tracking-[-0.06em]">
            创建账号，
            <span className="block text-blue-100">马上进入图像工作流。</span>
          </h2>
          <p className="max-w-md text-base leading-7 text-white/72">
            注册后可使用兑换码补充额度，保存创作模板，并把生成结果归档到个人资产库。
          </p>
        </div>
      </section>

      <section className="auth-form-card flex h-dvh items-center justify-center overflow-y-auto bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] px-5 py-10 sm:px-8">
        <div className="w-full max-w-[460px]">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="yan-mark-gradient grid size-11 place-items-center rounded-2xl text-sm font-black text-white">IR</div>
            <div>
              <div className="text-lg font-bold tracking-tight text-slate-950">ImageRouter</div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Team image workspace</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
              <Route className="size-4" />
              创建工作空间账号
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-950">加入 ImageRouter</h1>
            <p className="text-sm leading-6 text-slate-500">注册个人账号，开始生成、整理和复用你的图片资产。</p>
          </div>

          <div className="mt-8 space-y-4">
            <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="昵称" className="h-12" />
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="邮箱地址" className="h-12" />
            {registerOptions?.email_verification_enabled ? (
              <div className="flex gap-2">
                <Input
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value)}
                  placeholder="邮箱验证码"
                  className="h-12 min-w-0 flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 shrink-0 rounded-2xl px-4 text-blue-600"
                  onClick={() => void handleSendCode()}
                  disabled={isSendingCode}
                >
                  {isSendingCode ? <LoaderCircle className="size-4 animate-spin" /> : null}
                  发送验证码
                </Button>
              </div>
            ) : null}
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void handleSignup();
              }}
              placeholder="密码，至少 6 位"
              className="h-12"
            />

            <Button className="h-12 w-full rounded-2xl" onClick={() => void handleSignup()} disabled={isSubmitting}>
              {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
              创建并进入
              {!isSubmitting ? <ArrowRight className="size-4" /> : null}
            </Button>

            {registerOptions?.linuxdo_oauth_enabled ? (
              <Button type="button" variant="outline" className="h-12 w-full rounded-2xl" onClick={startLinuxDoOAuth}>
                使用 Linux DO 注册 / 登录
              </Button>
            ) : null}
          </div>

          <div className="mt-8 text-center text-sm text-slate-500">
            已有账号？
            <Link href="/login" className="ml-1 font-semibold text-blue-600 hover:text-blue-700">
              返回登录
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
