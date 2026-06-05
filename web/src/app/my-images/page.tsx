"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CloudUpload,
  Copy,
  ImageIcon,
  LoaderCircle,
  Maximize2,
  RefreshCw,
  Settings,
} from "lucide-react";
import { toast } from "sonner";

import { DateRangeFilter } from "@/components/date-range-filter";
import { ImageLightbox } from "@/components/image-lightbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WebDAVSettingsDialog } from "@/components/webdav-settings-dialog";
import {
  fetchMyImages,
  fetchMyImagesWebDAVConfig,
  syncMyImagesToWebDAV,
  updateMyImagesWebDAVConfig,
  type ImageWebDAVConfig,
  type ImageWebDAVConfigPayload,
  type ManagedImage,
} from "@/lib/api";
import { useAuthGuard } from "@/lib/use-auth-guard";

function formatSize(size: number) {
  if (!size) return "-";
  return size > 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(2)} MB` : `${Math.ceil(size / 1024)} KB`;
}

function MyImagesContent() {
  const [items, setItems] = useState<ManagedImage[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [webdavConfig, setWebdavConfig] = useState<ImageWebDAVConfig | null>(null);
  const [webdavOpen, setWebdavOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingWebDAV, setIsSavingWebDAV] = useState(false);
  const [isSyncingWebDAV, setIsSyncingWebDAV] = useState(false);
  const pageSize = 12;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);

  const lightboxImages = items.map((item) => ({
    id: item.name,
    src: item.url,
    sizeLabel: formatSize(item.size),
  }));

  const loadImages = async () => {
    setIsLoading(true);
    try {
      const data = await fetchMyImages({ start_date: startDate, end_date: endDate, page, page_size: pageSize });
      setItems(data.items);
      setTotal(data.pagination.total);
      if (data.pagination.page !== page) {
        setPage(data.pagination.page);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "加载图片失败");
    } finally {
      setIsLoading(false);
    }
  };

  const loadWebDAVConfig = async () => {
    try {
      const data = await fetchMyImagesWebDAVConfig();
      setWebdavConfig(data.webdav);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "加载 WebDAV 配置失败");
    }
  };

  const saveWebDAVConfig = async (payload: ImageWebDAVConfigPayload) => {
    setIsSavingWebDAV(true);
    try {
      const data = await updateMyImagesWebDAVConfig(payload);
      setWebdavConfig(data.webdav);
      setWebdavOpen(false);
      toast.success("WebDAV 配置已保存");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存 WebDAV 配置失败");
    } finally {
      setIsSavingWebDAV(false);
    }
  };

  const syncToWebDAV = async () => {
    if (!webdavConfig?.enabled) {
      setWebdavOpen(true);
      toast.error("请先启用 WebDAV 配置");
      return;
    }
    setIsSyncingWebDAV(true);
    try {
      const data = await syncMyImagesToWebDAV({ start_date: startDate, end_date: endDate });
      const result = data.result;
      toast.success(`已同步 ${result.uploaded} 张，跳过 ${result.skipped} 张，失败 ${result.failed} 张`);
      await loadImages();
      await loadWebDAVConfig();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "同步到 WebDAV 失败");
    } finally {
      setIsSyncingWebDAV(false);
    }
  };

  useEffect(() => {
    void loadImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, page]);

  useEffect(() => {
    void loadWebDAVConfig();
  }, []);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <div className="text-xs font-semibold tracking-[0.18em] text-rose-400 uppercase">My Images</div>
          <h1 className="text-2xl font-semibold tracking-tight">我的图片</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
              setPage(1);
            }}
          />
          <Button variant="outline" onClick={() => setWebdavOpen(true)} className="h-10 rounded-xl border-rose-100 bg-white px-4 text-stone-700">
            <Settings className="size-4" />
            WebDAV
          </Button>
          <Button variant="outline" onClick={() => void syncToWebDAV()} disabled={isSyncingWebDAV} className="h-10 rounded-xl border-rose-100 bg-white px-4 text-stone-700">
            {isSyncingWebDAV ? <LoaderCircle className="size-4 animate-spin" /> : <CloudUpload className="size-4" />}
            同步
          </Button>
          <Button variant="outline" onClick={() => { setStartDate(""); setEndDate(""); setPage(1); }} className="h-10 rounded-xl border-rose-100 bg-white px-4 text-stone-700">
            清除筛选
          </Button>
          <Button onClick={() => void loadImages()} disabled={isLoading} className="h-10 rounded-xl bg-rose-500 px-4 text-white hover:bg-rose-600">
            <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
            刷新
          </Button>
        </div>
      </div>

      <Card className="rounded-lg border-white/80 bg-white/80 shadow-sm">
        <CardContent className="p-0">
          <div className="flex items-center gap-2 border-b border-rose-50 px-5 py-4 text-sm text-stone-600">
            <ImageIcon className="size-4 text-rose-500" />
            共 {total} 张
          </div>
          {isLoading ? (
            <div className="flex h-56 items-center justify-center">
              <LoaderCircle className="size-5 animate-spin text-rose-400" />
            </div>
          ) : items.length === 0 ? (
            <div className="px-6 py-14 text-center text-sm text-stone-500">还没有生成过图片</div>
          ) : (
            <div className="grid gap-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((item, index) => (
                <div key={`${item.url}-${index}`} className="group border-r border-b border-rose-50 p-4 transition hover:bg-rose-50/40">
                  <button
                    type="button"
                    className="relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-xl bg-rose-50 text-left"
                    onClick={() => {
                      setLightboxIndex(index);
                      setLightboxOpen(true);
                    }}
                  >
                    <img src={item.url} alt={item.name} className="h-full w-full object-cover transition group-hover:scale-[1.02]" />
                    <span className="absolute right-2 bottom-2 rounded-full bg-black/50 p-2 text-white opacity-0 transition group-hover:opacity-100">
                      <Maximize2 className="size-4" />
                    </span>
                  </button>
                  <div className="mt-3 space-y-1 text-xs text-stone-500">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 font-medium text-stone-700">
                        <CalendarDays className="size-3.5" />
                        {item.created_at}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-lg text-stone-400 hover:bg-rose-50 hover:text-rose-600"
                        onClick={() => {
                          void navigator.clipboard.writeText(item.url);
                          toast.success("图片地址已复制");
                        }}
                        aria-label="复制图片地址"
                        title="复制图片地址"
                      >
                        <Copy className="size-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span>{formatSize(item.size)}</span>
                      <span>{item.webdav_status === "synced" ? "WebDAV 已同步" : ""}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!isLoading && total > 0 ? (
            <div className="flex items-center justify-end gap-2 border-t border-rose-50 px-4 py-3 text-sm text-stone-500">
              <span>第 {safePage} / {pageCount} 页，共 {total} 张</span>
              <Button variant="outline" size="icon" className="size-9 rounded-lg border-rose-100 bg-white" disabled={safePage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="outline" size="icon" className="size-9 rounded-lg border-rose-100 bg-white" disabled={safePage >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
      <ImageLightbox
        images={lightboxImages}
        currentIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        onIndexChange={setLightboxIndex}
      />
      <WebDAVSettingsDialog
        open={webdavOpen}
        onOpenChange={setWebdavOpen}
        config={webdavConfig}
        isSaving={isSavingWebDAV}
        title="WebDAV 设置"
        description="保存我的图片到远程目录"
        onSave={saveWebDAVConfig}
      />
    </section>
  );
}

export default function MyImagesPage() {
  const { isCheckingAuth, session } = useAuthGuard(["user"]);
  if (isCheckingAuth || !session) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoaderCircle className="size-5 animate-spin text-rose-400" />
      </div>
    );
  }
  return <MyImagesContent />;
}
