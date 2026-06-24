import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import { TopNav } from "@/components/top-nav";

export const metadata: Metadata = {
  title: "颜AI Studio",
  description: "Image creation and asset management studio",
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
              "border-[rgba(143,93,47,0.16)] bg-[#fbf7ef]/95 text-stone-900 shadow-[0_18px_60px_rgba(33,27,21,0.18)]",
          }}
        />
        <main className="yan-soft-grid h-screen overflow-hidden px-2 py-2 text-stone-900 sm:px-4 sm:py-4 lg:px-5">
          <div className="yan-app-surface mx-auto flex h-[calc(100dvh-1rem)] max-w-[1840px] flex-col overflow-hidden rounded-2xl sm:h-[calc(100dvh-2rem)]">
            <TopNav />
            <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-4 sm:px-5 lg:px-6">
              {children}
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
