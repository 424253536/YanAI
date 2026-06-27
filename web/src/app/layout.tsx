import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import { TopNav } from "@/components/top-nav";

export const metadata: Metadata = {
  title: "ImageRouter",
  description: "Image routing, generation, and asset management console",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className="antialiased"
        style={{
          fontFamily:
            '"Inter Tight","SF Pro Display","SF Pro Text","PingFang SC","Microsoft YaHei","Helvetica Neue",sans-serif',
        }}
      >
        <Toaster
          position="top-center"
          richColors
          offset={48}
          toastOptions={{
            className:
              "border-[#dbeafe] bg-white/95 text-slate-900 shadow-[0_18px_60px_rgba(15,23,42,0.12)]",
          }}
        />
        <main className="yan-soft-grid h-dvh w-dvw overflow-hidden text-slate-900">
          <div className="yan-app-surface flex h-dvh w-dvw max-w-none flex-col overflow-hidden rounded-none border-0 lg:flex-row">
            <TopNav />
            <div className="app-scroll h-full min-h-0 w-full flex-1 overflow-x-hidden overflow-y-auto px-3 py-4 sm:px-5 lg:px-6">
              {children}
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
