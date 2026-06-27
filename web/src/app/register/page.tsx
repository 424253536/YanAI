"use client";

import { useEffect, useRef } from "react";
import { LoaderCircle } from "lucide-react";

import webConfig from "@/constants/common-env";
import { useAuthGuard } from "@/lib/use-auth-guard";
import type { RegisterConfig } from "@/lib/api";
import { getStoredAuthKey } from "@/store/auth";

import { useSettingsStore } from "../settings/store";
import { RegisterCard } from "./components/register-card";

function RegisterDataController() {
  const didLoadRef = useRef(false);
  const loadRegister = useSettingsStore((state) => state.loadRegister);
  const setRegisterConfig = useSettingsStore((state) => state.setRegisterConfig);

  useEffect(() => {
    if (didLoadRef.current) return;
    didLoadRef.current = true;
    void loadRegister();
  }, [loadRegister]);

  useEffect(() => {
    let source: EventSource | null = null;
    let closed = false;
    void getStoredAuthKey().then((token) => {
      if (closed || !token) return;
      const baseUrl = webConfig.apiUrl.replace(/\/$/, "");
      source = new EventSource(`${baseUrl}/api/register/events?token=${encodeURIComponent(token)}`);
      source.onmessage = (event) => {
        setRegisterConfig(JSON.parse(event.data) as RegisterConfig);
      };
    });
    return () => {
      closed = true;
      source?.close();
    };
  }, [setRegisterConfig]);

  return null;
}

function RegisterPageContent() {
  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4">
      <RegisterDataController />
      <section className="yan-panel-strong shrink-0 rounded-2xl px-5 py-5">
        <div className="space-y-2">
          <div className="text-[11px] font-semibold tracking-[0.24em] text-[#2563eb] uppercase">Registration engine</div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-950">账号接入引擎</h1>
          <p className="max-w-2xl text-sm leading-6 text-stone-500">
            配置批量注册、邮箱 provider 和运行状态，保留原有保存、启动与实时日志流程。
          </p>
        </div>
      </section>
      <section className="min-h-0 flex-1">
        <RegisterCard />
      </section>
    </div>
  );
}

export default function RegisterPage() {
  const { isCheckingAuth, session } = useAuthGuard(["admin"]);

  if (isCheckingAuth || !session || session.role !== "admin") {
    return (
      <div className="flex h-full min-h-[40vh] items-center justify-center">
        <LoaderCircle className="size-5 animate-spin text-[#2563eb]" />
      </div>
    );
  }

  return <RegisterPageContent />;
}
