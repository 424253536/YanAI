"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { getDefaultRouteForRole, setStoredAuthSession, type AuthRole } from "@/store/auth";

function readFragmentParams() {
  if (typeof window === "undefined") {
    return new URLSearchParams();
  }
  const raw = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  return new URLSearchParams(raw);
}

export default function OAuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const params = readFragmentParams();
    const error = params.get("error");
    if (error) {
      toast.error(error);
      router.replace("/login");
      return;
    }

    const token = params.get("token") || "";
    const role = params.get("role") === "admin" ? "admin" : "user";
    if (!token) {
      toast.error("OAuth 登录未返回有效会话");
      router.replace("/login");
      return;
    }

    void setStoredAuthSession({
      key: token,
      role: role as AuthRole,
      subjectId: params.get("subject_id") || "",
      name: params.get("name") || "Linux DO",
      email: params.get("email") || undefined,
      quota: Number(params.get("quota") || 0),
    }).then(() => {
      router.replace(getDefaultRouteForRole(role as AuthRole));
    });
  }, [router]);

  return (
    <div className="grid min-h-[calc(100vh-1rem)] w-full place-items-center px-4 py-6">
      <div className="yan-panel-strong flex w-full max-w-sm flex-col items-center rounded-2xl px-8 py-10 text-center">
        <div className="yan-mark-gradient grid size-14 place-items-center rounded-[22px] text-white shadow-[0_18px_42px_rgba(33,27,21,0.18)]">
          <LoaderCircle className="size-5 animate-spin" />
        </div>
        <div className="mt-5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8f5d2f]">OAuth callback</div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-stone-950">正在完成登录</h1>
        <p className="mt-2 text-sm leading-6 text-stone-500">正在写入会话并跳转到你的工作台。</p>
      </div>
    </div>
  );
}
