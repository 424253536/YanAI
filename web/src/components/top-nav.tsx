"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
  Sparkles,
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
  { href: "/image", label: "画图", icon: Sparkles },
  { href: "/users", label: "用户管理", icon: Users },
  { href: "/accounts", label: "账号池管理", icon: Boxes },
  { href: "/register", label: "注册机", icon: KeyRound },
  { href: "/prompt-manager", label: "提示词管理", icon: PenLine },
  { href: "/image-manager", label: "图片管理", icon: Images },
  { href: "/channels", label: "渠道管理", icon: Waypoints },
  { href: "/models", label: "模型管理", icon: BadgeDollarSign },
  { href: "/redeem-codes", label: "兑换码", icon: Gift },
  { href: "/logs", label: "日志", icon: FileText },
  { href: "/settings", label: "设置", icon: Settings },
] satisfies NavItem[];

const userNavItems = [
  { href: "/image", label: "画图", icon: Sparkles },
  { href: "/my-images", label: "我的图片", icon: Image },
  { href: "/prompt-manager", label: "我的提示词", icon: PenLine },
  { href: "/profile", label: "个人中心", icon: User },
] satisfies NavItem[];

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<StoredAuthSession | null | undefined>(undefined);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (pathname === "/login" || pathname === "/signup") {
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

  if (pathname === "/login" || pathname === "/signup" || session === undefined || !session) {
    return null;
  }

  const navItems = session.role === "admin" ? adminNavItems : userNavItems;
  const roleLabel = session.role === "admin" ? "管理员" : "个人用户";

  return (
    <header className="border-b border-[rgba(143,93,47,0.14)] bg-[#fbf7ef]/64 backdrop-blur-2xl">
      <div className="flex min-h-17 items-center justify-between gap-3 px-3 sm:px-5">
        <Link href="/image" className="group flex shrink-0 items-center gap-3 whitespace-nowrap">
          <span className="yan-mark-gradient grid size-11 place-items-center rounded-xl text-sm font-black text-white shadow-[0_16px_36px_rgba(33,27,21,0.22)] transition group-hover:brightness-110">
            颜
          </span>
          <span className="hidden leading-tight sm:block">
            <span className="block text-[17px] font-bold tracking-tight text-stone-950">颜AI Studio</span>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">Image atelier</span>
          </span>
        </Link>

        <nav className="hide-scrollbar flex flex-1 justify-start gap-1.5 overflow-x-auto sm:justify-center sm:gap-2">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-xl px-3 text-[13px] font-medium transition sm:text-sm",
                  active
                    ? "bg-[#201814] text-[#fff8ec] shadow-[inset_0_0_0_1px_rgba(255,244,220,0.14),0_10px_30px_rgba(33,27,21,0.16)]"
                    : "text-stone-500 hover:bg-[#fffaf2]/70 hover:text-[#6f4a2b]",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center justify-end gap-2">
          <span className="hidden rounded-xl border border-[rgba(143,93,47,0.16)] bg-[#fffaf2]/72 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8f5d2f] sm:inline-block">
            {roleLabel}
          </span>
          <span className="hidden rounded-xl border border-[rgba(143,93,47,0.16)] bg-[#fffaf2]/72 px-2.5 py-1 text-[11px] font-medium text-stone-500 sm:inline-block">
            v{webConfig.appVersion}
          </span>
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-xl text-stone-500 transition hover:bg-[#fffaf2]/72 hover:text-[#8f5d2f]"
            onClick={() => void handleLogout()}
            aria-label="退出登录"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
