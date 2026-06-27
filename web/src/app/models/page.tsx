"use client";

import { useEffect, useMemo, useState } from "react";
import { BadgeDollarSign, LoaderCircle, RefreshCw, Save, Search, ServerCog } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  fetchModelCatalog,
  refreshChannelModels,
  updateModelPricing,
  type ManagedModel,
  type ModelChannelSummary,
  type ModelPricing,
  type ModelPricingPayload,
} from "@/lib/api";
import { useAuthGuard } from "@/lib/use-auth-guard";

type BillingMode = "tokens" | "fixed";

type DraftPricing = {
  enabled: boolean;
  billing_mode: BillingMode;
  currency: string;
  input_price_per_million: string;
  output_price_per_million: string;
  model_ratio: string;
  completion_ratio: string;
  model_price: string;
  note: string;
};

const ALL_CHANNELS = "__all__";

function stringifyNumber(value: number | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? String(parsed) : "0";
}

function pricingToDraft(pricing: ModelPricing): DraftPricing {
  return {
    enabled: Boolean(pricing.enabled),
    billing_mode: pricing.billing_mode,
    currency: pricing.currency || "USD",
    input_price_per_million: stringifyNumber(pricing.input_price_per_million),
    output_price_per_million: stringifyNumber(pricing.output_price_per_million),
    model_ratio: stringifyNumber(pricing.model_ratio),
    completion_ratio: stringifyNumber(pricing.completion_ratio),
    model_price: stringifyNumber(pricing.model_price),
    note: pricing.note || "",
  };
}

function numberValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function draftToPayload(model: string, draft: DraftPricing): ModelPricingPayload {
  return {
    model,
    enabled: draft.enabled,
    billing_mode: draft.billing_mode,
    currency: draft.currency.trim() || "USD",
    input_price_per_million: numberValue(draft.input_price_per_million),
    output_price_per_million: numberValue(draft.output_price_per_million),
    model_ratio: numberValue(draft.model_ratio),
    completion_ratio: numberValue(draft.completion_ratio),
    model_price: numberValue(draft.model_price),
    note: draft.note.trim(),
  };
}

function channelLabel(channel: ModelChannelSummary) {
  if (channel.id === "internal_pool") return "内置账号池";
  return channel.name || channel.id;
}

function ModelsContent() {
  const [models, setModels] = useState<ManagedModel[]>([]);
  const [channels, setChannels] = useState<ModelChannelSummary[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DraftPricing>>({});
  const [query, setQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState(ALL_CHANNELS);
  const [isLoading, setIsLoading] = useState(true);
  const [savingModel, setSavingModel] = useState("");
  const [refreshingChannel, setRefreshingChannel] = useState("");

  const applyCatalog = (items: ManagedModel[], nextChannels: ModelChannelSummary[]) => {
    setModels(items);
    setChannels(nextChannels);
    setDrafts(Object.fromEntries(items.map((item) => [item.model, pricingToDraft(item.pricing)])));
  };

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await fetchModelCatalog();
      applyCatalog(data.items, data.channels);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "加载接口目录失败");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filteredModels = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return models.filter((item) => {
      const matchesQuery =
        !keyword ||
        item.model.toLowerCase().includes(keyword) ||
        item.channels.some((channel) => channelLabel(channel).toLowerCase().includes(keyword));
      const matchesChannel = channelFilter === ALL_CHANNELS || item.channels.some((channel) => channel.id === channelFilter);
      return matchesQuery && matchesChannel;
    });
  }, [channelFilter, models, query]);

  const updateDraft = (model: ManagedModel, patch: Partial<DraftPricing>) => {
    setDrafts((current) => ({
      ...current,
      [model.model]: {
        ...(current[model.model] ?? pricingToDraft(model.pricing)),
        ...patch,
      },
    }));
  };

  const savePricing = async (model: ManagedModel) => {
    const draft = drafts[model.model] ?? pricingToDraft(model.pricing);
    setSavingModel(model.model);
    try {
      const data = await updateModelPricing(draftToPayload(model.model, draft));
      applyCatalog(data.items, data.channels);
      toast.success("计费规则已保存");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存计费规则失败");
    } finally {
      setSavingModel("");
    }
  };

  const refreshModels = async (channel: ModelChannelSummary) => {
    setRefreshingChannel(channel.id);
    try {
      const data = await refreshChannelModels(channel.id);
      applyCatalog(data.items, data.channels);
      toast.success(`已获取 ${data.models.length} 个接口条目`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "获取渠道目录失败");
    } finally {
      setRefreshingChannel("");
    }
  };

  return (
    <section className="h-full min-h-0 space-y-5 overflow-y-auto pr-1 pb-8 [scrollbar-color:rgba(37,99,235,.38)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#60a5fa]/55 [&::-webkit-scrollbar-track]:bg-transparent">
      <div className="yan-panel-strong flex flex-col gap-4 rounded-2xl px-5 py-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="text-[11px] font-semibold tracking-[0.24em] text-[#2563eb] uppercase">Billing rules</div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-950">计费规则</h1>
          <p className="max-w-2xl text-sm leading-6 text-stone-500">
            汇总渠道目录与计费标准，保持原有拉取、筛选和保存逻辑不变。
          </p>
        </div>
        <Button variant="outline" className="h-10 rounded-xl" onClick={() => void load()}>
          {isLoading ? <LoaderCircle className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          刷新
        </Button>
      </div>

      <Card className="rounded-2xl border-[#e2e8f0] bg-white/86 shadow-sm">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-stone-800">
            <ServerCog className="size-4 text-[#2563eb]" />
            渠道目录
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {channels.map((channel) => (
              <div key={channel.id} className="grid gap-3 rounded-2xl border border-[#e2e8f0] bg-white/76 p-4 text-sm shadow-sm">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-stone-900">{channelLabel(channel)}</div>
                    <div className="truncate text-xs text-stone-400">{channel.base_url || channel.type}</div>
                  </div>
                  <Badge variant={channel.enabled ? "success" : "secondary"}>{channel.enabled ? "启用" : "禁用"}</Badge>
                </div>
                <div className="flex items-center justify-between gap-3 text-xs text-stone-500">
                  <span>{channel.model_count ?? channel.models?.length ?? 0} 个条目</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg"
                    onClick={() => void refreshModels(channel)}
                    disabled={Boolean(refreshingChannel)}
                  >
                    {refreshingChannel === channel.id ? <LoaderCircle className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                    获取
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-[#e2e8f0] bg-white/86 shadow-sm">
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-stone-800">
              <BadgeDollarSign className="size-4 text-[#2563eb]" />
              计费标准
            </div>
            <div className="grid gap-2 sm:grid-cols-[minmax(180px,260px)_180px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索接口或渠道"
                  className="h-10 pl-9"
                />
              </div>
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_CHANNELS}>全部渠道</SelectItem>
                  {channels.map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      {channelLabel(channel)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white/76">
            <div className="hidden border-b border-[#e2e8f0] bg-[#f8fbff] px-4 py-3 text-xs font-semibold text-stone-500 xl:grid xl:grid-cols-[minmax(190px,1.3fr)_minmax(150px,1fr)_116px_130px_130px_110px_120px_88px] xl:items-center xl:gap-3">
              <div>接口</div>
              <div>渠道</div>
              <div>模式</div>
              <div>输入价/1M</div>
              <div>输出价/1M</div>
              <div>补全倍率</div>
              <div>固定价/次</div>
              <div>操作</div>
            </div>
            {isLoading ? (
              <div className="flex h-44 items-center justify-center">
                <LoaderCircle className="size-5 animate-spin text-[#2563eb]" />
              </div>
            ) : filteredModels.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
                <div className="grid size-12 place-items-center rounded-2xl bg-[#eff6ff] text-[#2563eb]">
                  <BadgeDollarSign className="size-5" />
                </div>
                <div className="mt-4 text-base font-semibold text-slate-950">没有匹配的接口</div>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">调整搜索关键词或渠道筛选，或者先从渠道目录中拉取条目。</p>
              </div>
            ) : (
              filteredModels.map((model) => {
                const draft = drafts[model.model] ?? pricingToDraft(model.pricing);
                return (
                  <div key={model.model} className="grid gap-3 border-b border-[#e2e8f0] px-4 py-4 text-sm transition hover:bg-[#f8fbff] last:border-0 xl:grid-cols-[minmax(190px,1.3fr)_minmax(150px,1fr)_116px_130px_130px_110px_120px_88px] xl:items-center">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-stone-950">{model.model}</div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-stone-400">
                        <Checkbox
                          checked={draft.enabled}
                          onCheckedChange={(checked) => updateDraft(model, { enabled: Boolean(checked) })}
                          className="size-4"
                        />
                        <span>{draft.enabled ? "参与计费" : "停用计费"}</span>
                        {model.configured ? <Badge variant="secondary">已配置</Badge> : null}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {model.channels.length > 0 ? (
                        model.channels.map((channel) => (
                          <Badge key={channel.id} variant={channel.enabled ? "secondary" : "outline"}>
                            {channelLabel(channel)}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-stone-400">自定义接口</span>
                      )}
                    </div>
                    <Select value={draft.billing_mode} onValueChange={(value) => updateDraft(model, { billing_mode: value as BillingMode })}>
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tokens">按用量</SelectItem>
                        <SelectItem value="fixed">按次</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="0"
                      step="0.000001"
                      value={draft.input_price_per_million}
                      onChange={(event) => updateDraft(model, { input_price_per_million: event.target.value })}
                      className="h-10"
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.000001"
                      value={draft.output_price_per_million}
                      onChange={(event) => updateDraft(model, { output_price_per_million: event.target.value })}
                      className="h-10"
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft.completion_ratio}
                      onChange={(event) => updateDraft(model, { completion_ratio: event.target.value })}
                      className="h-10"
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.000001"
                      value={draft.model_price}
                      onChange={(event) => updateDraft(model, { model_price: event.target.value })}
                      className="h-10"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 rounded-xl"
                      onClick={() => void savePricing(model)}
                      disabled={Boolean(savingModel)}
                    >
                      {savingModel === model.model ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
                      保存
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export default function ModelsPage() {
  const { isCheckingAuth, session } = useAuthGuard(["admin"]);
  if (isCheckingAuth || !session) {
    return (
      <div className="flex h-full min-h-[40vh] items-center justify-center">
        <LoaderCircle className="size-5 animate-spin text-[#2563eb]" />
      </div>
    );
  }
  return <ModelsContent />;
}
