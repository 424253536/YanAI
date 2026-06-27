"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BadgeDollarSign,
  Boxes,
  FileText,
  Gift,
  Image,
  Images,
  KeyRound,
  LogOut,
  PenLine,
  Settings,
  Route,
  User,
  Users,
  Waypoints,
  type LucideIcon,
} from "lucide-react";

import webConfig from "@/constants/common-env";
import { cn } from "@/lib/utils";
import { clearStoredAuthSession, getStoredAuthSession, type StoredAuthSession } from "@/store/auth";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const adminNavItems = [
  { href: "/image", label: "创作台", icon: Route },
  { href: "/users", label: "用户管理", icon: Users },
  { href: "/accounts", label: "账号池", icon: Boxes },
  { href: "/register", label: "注册机", icon: KeyRound },
  { href: "/prompt-manager", label: "创作模板", icon: PenLine },
  { href: "/image-manager", label: "图片资产", icon: Images },
  { href: "/channels", label: "渠道路由", icon: Waypoints },
  { href: "/models", label: "计费规则", icon: BadgeDollarSign },
  { href: "/redeem-codes", label: "兑换码", icon: Gift },
  { href: "/logs", label: "日志", icon: FileText },
  { href: "/settings", label: "设置", icon: Settings },
] satisfies NavItem[];

const userNavItems = [
  { href: "/image", label: "创作台", icon: Route },
  { href: "/my-images", label: "我的图片", icon: Image },
  { href: "/prompt-manager", label: "创作模板", icon: PenLine },
  { href: "/profile", label: "个人中心", icon: User },
] satisfies NavItem[];

const authFreeRoutes = new Set(["/", "/login", "/signup", "/oauth/callback"]);

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<StoredAuthSession | null | undefined>(undefined);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (authFreeRoutes.has(pathname)) {
        if (active) setSession(null);
        return;
      }
      const storedSession = await getStoredAuthSession();
      if (active) setSession(storedSession);
    };

    void load();
    return () => {
      active = false;
    };
  }, [pathname]);

  const handleLogout = async () => {
    await clearStoredAuthSession();
    router.replace("/login");
  };

  const navItems = useMemo(() => {
    if (!session) return [];
    return session.role === "admin" ? adminNavItems : userNavItems;
  }, [session]);

  if (authFreeRoutes.has(pathname) || session === undefined || !session) {
    return null;
  }

  const roleLabel = session.role === "admin" ? "Admin" : "Member";
  const displayName = session.name || session.email || roleLabel;
  const secondaryLabel = session.email || (session.role === "admin" ? "管理员控制台" : "个人工作区");

  return (
    <aside className="app-sidebar flex shrink-0 flex-col border-b border-[#e2e8f0] bg-[#f8fbff]/86 backdrop-blur-2xl lg:h-full lg:w-[276px] lg:border-r lg:border-b-0">
      <div className="flex min-h-17 items-center justify-between gap-3 px-4 lg:min-h-0 lg:px-5 lg:pt-5">
        <Link href="/image" className="group flex min-w-0 items-center gap-3">
          <span className="yan-mark-gradient grid size-11 shrink-0 place-items-center rounded-[18px] text-sm font-black text-white shadow-[0_10px_24px_rgba(37,99,235,0.18)] transition group-hover:bg-[#1d4ed8]">
            IR
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[17px] font-bold tracking-tight text-slate-950">ImageRouter</span>
            <span className="block truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Routing console</span>
          </span>
        </Link>
        <button
          type="button"
          className="inline-flex size-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-[#eaf1ff] hover:text-[#2563eb] lg:hidden"
          onClick={() => void handleLogout()}
          aria-label="退出登录"
        >
          <LogOut className="size-4" />
        </button>
      </div>

      <div className="hidden px-5 pt-5 lg:block">
        <div className="rounded-2xl border border-[#e2e8f0] bg-white/68 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Workspace</div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-slate-800">图像路由中枢</span>
            <span className="rounded-full bg-[#eff6ff] px-2 py-0.5 text-[11px] font-semibold text-[#2563eb]">v{webConfig.appVersion}</span>
          </div>
        </div>
      </div>

      <nav className="hide-scrollbar flex gap-1.5 overflow-x-auto px-3 pb-3 lg:mt-5 lg:flex-1 lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto lg:px-4 lg:pb-4">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative inline-flex h-11 shrink-0 items-center gap-3 whitespace-nowrap rounded-2xl px-3 text-sm font-semibold transition lg:w-full",
                active
                  ? "bg-white text-[#1d4ed8] shadow-[0_10px_30px_rgba(15,23,42,0.08)] ring-1 ring-[#dbeafe]"
                  : "text-slate-500 hover:bg-white/72 hover:text-slate-950",
              )}
            >
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-xl transition",
                  active ? "bg-[#2563eb] text-white shadow-[0_8px_18px_rgba(37,99,235,0.18)]" : "bg-[#eef4ff] text-slate-500 group-hover:text-[#2563eb]",
                )}
              >
                <Icon className="size-4" />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="hidden border-t border-[#e2e8f0] p-4 lg:block">
        <div className="rounded-[22px] border border-[#dbeafe] bg-white/76 p-3 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl bg-[#eff6ff] text-sm font-bold text-[#2563eb]">
              {displayName.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-slate-950">{displayName}</div>
              <div className="truncate text-xs text-slate-500">{secondaryLabel}</div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="rounded-full bg-[#eff6ff] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2563eb]">
              {roleLabel}
            </span>
            <span className="text-[11px] font-medium text-slate-400">v{webConfig.appVersion}</span>
            <button
              type="button"
              className="inline-flex size-8 items-center justify-center rounded-xl text-slate-500 transition hover:bg-[#eff6ff] hover:text-[#2563eb]"
              onClick={() => void handleLogout()}
              aria-label="退出登录"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
