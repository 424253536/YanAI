"use client";

import { Cookie, LoaderCircle, PlugZap, Save, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  testProxy,
  testProxyClearance,
  type ClearanceTestResult,
  type ProxyRuntimeClearanceMode,
  type ProxyRuntimeEgressMode,
  type ProxyTestResult,
} from "@/lib/api";

import { useSettingsStore } from "../store";

export function ProxyRuntimeCard() {
  const [isTestingProxy, setIsTestingProxy] = useState(false);
  const [isTestingClearance, setIsTestingClearance] = useState(false);
  const [proxyResult, setProxyResult] = useState<ProxyTestResult | null>(null);
  const [clearanceResult, setClearanceResult] = useState<ClearanceTestResult | null>(null);
  const [targetUrl, setTargetUrl] = useState("https://chatgpt.com");
  const config = useSettingsStore((state) => state.config);
  const isLoadingConfig = useSettingsStore((state) => state.isLoadingConfig);
  const isSavingConfig = useSettingsStore((state) => state.isSavingConfig);
  const saveConfig = useSettingsStore((state) => state.saveConfig);
  const setProxyRuntimeField = useSettingsStore((state) => state.setProxyRuntimeField);
  const setProxyRuntimeClearanceField = useSettingsStore((state) => state.setProxyRuntimeClearanceField);
  const setProxyRuntimeStatusCodesText = useSettingsStore((state) => state.setProxyRuntimeStatusCodesText);

  if (isLoadingConfig || !config?.proxy_runtime) {
    return (
      <Card className="rounded-2xl border-[#e2e8f0] bg-white/86 shadow-sm">
        <CardContent className="flex items-center justify-center p-10">
          <LoaderCircle className="size-5 animate-spin text-stone-400" />
        </CardContent>
      </Card>
    );
  }

  const runtime = config.proxy_runtime;
  const clearance = runtime.clearance;
  const runtimeEnabled = Boolean(runtime.enabled);
  const clearanceMode = clearance.mode;

  const handleTestProxy = async () => {
    setIsTestingProxy(true);
    setProxyResult(null);
    try {
      await saveConfig();
      const data = await testProxy();
      setProxyResult(data.result);
      if (data.result.ok) {
        toast.success(`代理可用：${data.result.latency_ms} ms`);
      } else {
        toast.error(`代理不可用：${data.result.error ?? "unknown"}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "测试代理失败");
    } finally {
      setIsTestingProxy(false);
    }
  };

  const handleTestClearance = async () => {
    setIsTestingClearance(true);
    setClearanceResult(null);
    try {
      await saveConfig();
      const data = await testProxyClearance(targetUrl.trim() || "https://chatgpt.com");
      setClearanceResult(data.result);
      if (data.result.ok) {
        toast.success(`Clearance 获取成功：${data.result.latency_ms} ms`);
      } else {
        toast.error(`Clearance 获取失败：${data.result.error ?? data.result.status}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "测试 Clearance 失败");
    } finally {
      setIsTestingClearance(false);
    }
  };

  return (
    <Card className="rounded-2xl border-[#e2e8f0] bg-white/86 shadow-sm">
      <CardContent className="space-y-5 p-6">
        <div>
          <div className="flex items-center gap-2 text-lg font-semibold text-stone-900">
            <PlugZap className="size-5 text-stone-500" />
            WARP / FlareSolverr 代理运行时
          </div>
          <p className="mt-1 text-sm leading-6 text-stone-500">
            用于 ChatGPT 上游请求的稳定出口代理，以及 Cloudflare clearance 获取。WARP compose 通常配合 single_proxy 使用。
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 md:col-span-2">
            <Checkbox checked={runtimeEnabled} onCheckedChange={(checked) => setProxyRuntimeField("enabled", Boolean(checked))} />
            启用代理运行时
          </label>

          <div className="space-y-2">
            <label className="text-sm text-stone-700">出口模式</label>
            <Select
              value={runtime.egress_mode}
              onValueChange={(value) => setProxyRuntimeField("egress_mode", value as ProxyRuntimeEgressMode)}
              disabled={!runtimeEnabled}
            >
              <SelectTrigger className="h-10 rounded-xl border-stone-200 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="direct">直连</SelectItem>
                <SelectItem value="single_proxy">单代理 / WARP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-stone-700">代理 URL</label>
            <Input
              value={runtime.proxy_url}
              onChange={(event) => setProxyRuntimeField("proxy_url", event.target.value)}
              placeholder="http://privoxy:8118"
              className="h-10 rounded-xl border-stone-200 bg-white"
              disabled={!runtimeEnabled || runtime.egress_mode !== "single_proxy"}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-stone-700">资源代理 URL</label>
            <Input
              value={runtime.resource_proxy_url}
              onChange={(event) => setProxyRuntimeField("resource_proxy_url", event.target.value)}
              placeholder="留空则复用代理 URL"
              className="h-10 rounded-xl border-stone-200 bg-white"
              disabled={!runtimeEnabled || runtime.egress_mode !== "single_proxy"}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-stone-700">重置会话状态码</label>
            <Input
              value={runtime.reset_session_status_codes.join(",")}
              onChange={(event) => setProxyRuntimeStatusCodesText(event.target.value)}
              placeholder="403"
              className="h-10 rounded-xl border-stone-200 bg-white"
              disabled={!runtimeEnabled}
            />
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
            <Checkbox
              checked={Boolean(runtime.skip_ssl_verify)}
              onCheckedChange={(checked) => setProxyRuntimeField("skip_ssl_verify", Boolean(checked))}
              disabled={!runtimeEnabled}
            />
            跳过 SSL 校验
          </label>

          <div className="flex items-end justify-end">
            <Button variant="outline" className="h-10 rounded-xl border-stone-200 bg-white" onClick={() => void handleTestProxy()} disabled={isTestingProxy || !runtimeEnabled}>
              {isTestingProxy ? <LoaderCircle className="size-4 animate-spin" /> : <PlugZap className="size-4" />}
              测试代理
            </Button>
          </div>

          {proxyResult ? (
            <div className={`rounded-xl border px-3 py-2 text-sm md:col-span-2 ${proxyResult.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>
              {proxyResult.ok ? `HTTP ${proxyResult.status}，${proxyResult.latency_ms} ms，来源 ${proxyResult.proxy_source ?? "unknown"}` : proxyResult.error}
            </div>
          ) : null}
        </div>

        <div className="space-y-4 rounded-xl border border-stone-200 bg-white px-4 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-stone-900">
            <Cookie className="size-4 text-stone-500" />
            Cloudflare Clearance
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-stone-700">模式</label>
              <Select
                value={clearanceMode}
                onValueChange={(value) => {
                  const mode = value as ProxyRuntimeClearanceMode;
                  setProxyRuntimeClearanceField("mode", mode);
                  setProxyRuntimeClearanceField("enabled", mode !== "none");
                }}
                disabled={!runtimeEnabled}
              >
                <SelectTrigger className="h-10 rounded-xl border-stone-200 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">不启用</SelectItem>
                  <SelectItem value="manual">手动 Cookie</SelectItem>
                  <SelectItem value="flaresolverr">FlareSolverr</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-stone-700">FlareSolverr URL</label>
              <Input
                value={clearance.flaresolverr_url}
                onChange={(event) => setProxyRuntimeClearanceField("flaresolverr_url", event.target.value)}
                placeholder="http://flaresolverr:8191"
                className="h-10 rounded-xl border-stone-200 bg-white"
                disabled={!runtimeEnabled || clearanceMode !== "flaresolverr"}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm text-stone-700">User-Agent</label>
              <Input
                value={clearance.user_agent}
                onChange={(event) => setProxyRuntimeClearanceField("user_agent", event.target.value)}
                className="h-10 rounded-xl border-stone-200 bg-white font-mono text-xs"
                disabled={!runtimeEnabled || clearanceMode === "none"}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-stone-700">超时秒数</label>
              <Input
                value={String(clearance.timeout_sec)}
                onChange={(event) => setProxyRuntimeClearanceField("timeout_sec", event.target.value)}
                className="h-10 rounded-xl border-stone-200 bg-white"
                disabled={!runtimeEnabled || clearanceMode === "none"}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-stone-700">刷新间隔秒数</label>
              <Input
                value={String(clearance.refresh_interval)}
                onChange={(event) => setProxyRuntimeClearanceField("refresh_interval", event.target.value)}
                className="h-10 rounded-xl border-stone-200 bg-white"
                disabled={!runtimeEnabled || clearanceMode === "none"}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm text-stone-700">手动 Cookie</label>
              <Textarea
                value={clearance.cf_cookies}
                onChange={(event) => setProxyRuntimeClearanceField("cf_cookies", event.target.value)}
                placeholder="foo=bar; cf_clearance=..."
                className="min-h-24 rounded-xl border-stone-200 bg-white font-mono text-xs"
                disabled={!runtimeEnabled || clearanceMode !== "manual"}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm text-stone-700">单独 cf_clearance</label>
              <Input
                value={clearance.cf_clearance}
                onChange={(event) => setProxyRuntimeClearanceField("cf_clearance", event.target.value)}
                className="h-10 rounded-xl border-stone-200 bg-white font-mono text-xs"
                disabled={!runtimeEnabled || clearanceMode !== "manual"}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-stone-700">测试目标 URL</label>
              <Input
                value={targetUrl}
                onChange={(event) => setTargetUrl(event.target.value)}
                className="h-10 rounded-xl border-stone-200 bg-white"
                disabled={!runtimeEnabled || clearanceMode === "none"}
              />
            </div>

            <div className="flex items-end justify-end">
              <Button variant="outline" className="h-10 rounded-xl border-stone-200 bg-white" onClick={() => void handleTestClearance()} disabled={isTestingClearance || !runtimeEnabled || clearanceMode === "none"}>
                {isTestingClearance ? <LoaderCircle className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                测试 Clearance
              </Button>
            </div>

            {clearanceResult ? (
              <div className={`rounded-xl border px-3 py-2 text-sm md:col-span-2 ${clearanceResult.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>
                {clearanceResult.ok ? `可用，${clearanceResult.latency_ms} ms，Cookie=${clearanceResult.has_cookies ? "yes" : "no"}` : clearanceResult.error}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex justify-end">
          <Button className="h-10 rounded-xl px-5" onClick={() => void saveConfig()} disabled={isSavingConfig}>
            {isSavingConfig ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
            保存配置
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
