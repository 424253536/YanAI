"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createChannel, deleteChannel, fetchChannels, updateChannel, type Channel } from "@/lib/api";
import { useAuthGuard } from "@/lib/use-auth-guard";

const DEFAULT_CHANNEL_MODELS =
  "gpt-5,gpt-5-1,gpt-5-2,gpt-5-3,gpt-5-3-mini,gpt-5-5,gpt-5-mini,gpt-image-2,codex-gpt-image-2,auto";

type ChannelForm = {
  name: string;
  base_url: string;
  api_key: string;
  models: string;
  weight: string;
  priority: string;
  timeout: string;
  enabled: boolean;
};

type TextFieldKey = Exclude<keyof ChannelForm, "enabled">;

const EMPTY_FORM: ChannelForm = {
  name: "",
  base_url: "",
  api_key: "",
  models: DEFAULT_CHANNEL_MODELS,
  weight: "1",
  priority: "0",
  timeout: "60",
  enabled: true,
};

const CHANNEL_FIELDS: Array<{
  key: TextFieldKey;
  label: string;
  description: string;
  placeholder: string;
  type?: "number" | "password" | "text";
}> = [
  {
    key: "name",
    label: "名称",
    description: "列表和日志中显示的渠道名称。",
    placeholder: "名称",
  },
  {
    key: "base_url",
    label: "Base URL",
    description: "兼容 OpenAI 的服务根地址。",
    placeholder: "https://api.example.com",
  },
  {
    key: "api_key",
    label: "API Key",
    description: "新增必填，编辑时留空保持原密钥。",
    placeholder: "sk-...",
    type: "password",
  },
  {
    key: "models",
    label: "模型",
    description: "逗号分隔，匹配模型时才会走该渠道。",
    placeholder: "gpt-image-2,codex-gpt-image-2",
  },
  {
    key: "weight",
    label: "权重",
    description: "同优先级下的随机命中权重。",
    placeholder: "1",
    type: "number",
  },
  {
    key: "priority",
    label: "优先级",
    description: "越高越先尝试。",
    placeholder: "0",
    type: "number",
  },
  {
    key: "timeout",
    label: "超时",
    description: "请求超时时间，单位秒。",
    placeholder: "60",
    type: "number",
  },
];

const resetForm = (): ChannelForm => ({ ...EMPTY_FORM });

const channelToForm = (channel: Channel): ChannelForm => ({
  name: channel.name || "",
  base_url: channel.base_url || "",
  api_key: "",
  models: channel.models?.join(",") || "",
  weight: String(channel.weight ?? 1),
  priority: String(channel.priority ?? 0),
  timeout: String(channel.timeout ?? 60),
  enabled: channel.enabled,
});

const toNumber = (value: string, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const channelTypeLabel = (channel: Channel) =>
  channel.type === "internal_pool" ? "内置账号池" : "OpenAI 图片兼容";

function FieldCaption({ field }: { field: (typeof CHANNEL_FIELDS)[number] }) {
  return (
    <label className="block space-y-0.5 text-xs">
      <span className="block font-semibold text-stone-700">{field.label}</span>
      <span className="block leading-4 text-stone-400">{field.description}</span>
    </label>
  );
}

function ChannelsContent() {
  const [items, setItems] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [savingChannelId, setSavingChannelId] = useState<string | null>(null);
  const [form, setForm] = useState<ChannelForm>(resetForm);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [editForm, setEditForm] = useState<ChannelForm>(resetForm);

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await fetchChannels();
      setItems(data.items);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "加载渠道失败");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    fetchChannels()
      .then((data) => {
        if (isMounted) {
          setItems(data.items);
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          toast.error(error instanceof Error ? error.message : "加载渠道失败");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const updateCreateField = (key: TextFieldKey, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateEditField = (key: TextFieldKey, value: string) => {
    setEditForm((current) => ({ ...current, [key]: value }));
  };

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const data = await createChannel({
        name: form.name.trim(),
        base_url: form.base_url.trim(),
        api_key: form.api_key.trim(),
        models: form.models,
        weight: toNumber(form.weight, 1),
        priority: toNumber(form.priority, 0),
        timeout: toNumber(form.timeout, 60),
        enabled: form.enabled,
      });
      setItems(data.items);
      setForm(resetForm());
      toast.success("渠道已创建");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "创建渠道失败");
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggle = async (channel: Channel) => {
    setSavingChannelId(channel.id);
    try {
      const data = await updateChannel(channel.id, { enabled: !channel.enabled });
      setItems(data.items);
      toast.success(channel.enabled ? "渠道已禁用" : "渠道已启用");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "更新渠道失败");
    } finally {
      setSavingChannelId(null);
    }
  };

  const handleDelete = async (channel: Channel) => {
    setSavingChannelId(channel.id);
    try {
      const data = await deleteChannel(channel.id);
      setItems(data.items);
      toast.success("渠道已删除");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "删除渠道失败");
    } finally {
      setSavingChannelId(null);
    }
  };

  const openEditDialog = (channel: Channel) => {
    setEditingChannel(channel);
    setEditForm(channelToForm(channel));
  };

  const handleSaveEdit = async () => {
    if (!editingChannel) return;
    setSavingChannelId(editingChannel.id);
    try {
      const isInternal = editingChannel.id === "internal_pool";
      const payload = isInternal
        ? { enabled: editForm.enabled }
        : {
            name: editForm.name.trim(),
            base_url: editForm.base_url.trim(),
            ...(editForm.api_key.trim() ? { api_key: editForm.api_key.trim() } : {}),
            models: editForm.models,
            weight: toNumber(editForm.weight, 1),
            priority: toNumber(editForm.priority, 0),
            timeout: toNumber(editForm.timeout, 60),
            enabled: editForm.enabled,
          };
      const data = await updateChannel(editingChannel.id, payload);
      setItems(data.items);
      setEditingChannel(null);
      toast.success("渠道配置已保存");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存渠道失败");
    } finally {
      setSavingChannelId(null);
    }
  };

  const isEditingInternal = editingChannel?.id === "internal_pool";

  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-semibold tracking-[0.18em] text-rose-400 uppercase">Channels</div>
          <h1 className="text-2xl font-semibold tracking-tight">渠道管理</h1>
        </div>
        <Button variant="outline" className="h-10 rounded-xl border-rose-100 bg-white" onClick={() => void load()}>
          <RefreshCw className="size-4" />
          刷新
        </Button>
      </div>

      <Card className="rounded-lg border-white/80 bg-white/80 shadow-sm">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-stone-800">
            <Plus className="size-4 text-rose-500" />
            新增 OpenAI 图片兼容渠道
          </div>
          <div className="grid gap-3 lg:grid-cols-[1fr_1.35fr_1.15fr_1.2fr_86px_86px_94px_auto]">
            {CHANNEL_FIELDS.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <FieldCaption field={field} />
                <Input
                  type={field.type || "text"}
                  value={form[field.key]}
                  onChange={(event) => updateCreateField(field.key, event.target.value)}
                  placeholder={field.placeholder}
                  autoComplete={field.key === "api_key" ? "new-password" : undefined}
                  className="h-10 rounded-xl border-rose-100 bg-white"
                />
              </div>
            ))}
            <Button
              className="h-10 self-end rounded-xl bg-rose-500 text-white hover:bg-rose-600"
              disabled={isCreating}
              onClick={() => void handleCreate()}
            >
              {isCreating ? <LoaderCircle className="size-4 animate-spin" /> : null}
              创建
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-lg border-white/80 bg-white/80 shadow-sm">
        <CardContent className="p-0">
          <div className="hidden border-b border-rose-50 px-5 py-3 text-xs font-semibold text-stone-500 lg:grid lg:grid-cols-[1.1fr_1.35fr_1.45fr_78px_78px_78px_96px_160px] lg:items-center">
            <div>名称 / 类型</div>
            <div>Base URL</div>
            <div>模型</div>
            <div>权重</div>
            <div>优先级</div>
            <div>超时</div>
            <div>状态</div>
            <div>操作</div>
          </div>
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <LoaderCircle className="size-5 animate-spin text-rose-400" />
            </div>
          ) : (
            items.map((channel) => (
              <div
                key={channel.id}
                className="grid gap-3 border-b border-rose-50 px-5 py-4 text-sm last:border-0 lg:grid-cols-[1.1fr_1.35fr_1.45fr_78px_78px_78px_96px_160px] lg:items-center"
              >
                <div>
                  <div className="font-medium text-stone-900">{channel.name}</div>
                  <div className="text-xs text-stone-400">{channelTypeLabel(channel)}</div>
                </div>
                <div className="truncate text-stone-600" title={channel.base_url || "内置账号池"}>
                  {channel.base_url || "内置账号池"}
                </div>
                <div className="truncate text-stone-500" title={channel.models?.join(", ")}>
                  {channel.models?.join(", ")}
                </div>
                <div className="text-stone-600">权重 {channel.weight}</div>
                <div className="text-stone-600">{channel.priority}</div>
                <div className="text-stone-600">{channel.timeout ? `${channel.timeout}s` : "-"}</div>
                <Badge variant={channel.enabled ? "success" : "secondary"} className="w-fit">
                  {channel.enabled ? "启用" : "禁用"}
                </Badge>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8 rounded-lg border-rose-100 bg-white"
                    title="编辑"
                    aria-label="编辑渠道"
                    onClick={() => openEditDialog(channel)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg border-rose-100 bg-white"
                    disabled={savingChannelId === channel.id}
                    onClick={() => void handleToggle(channel)}
                  >
                    {savingChannelId === channel.id ? <LoaderCircle className="size-4 animate-spin" /> : null}
                    {channel.enabled ? "禁用" : "启用"}
                  </Button>
                  {channel.id !== "internal_pool" ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-rose-500"
                      title="删除"
                      aria-label="删除渠道"
                      disabled={savingChannelId === channel.id}
                      onClick={() => void handleDelete(channel)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(editingChannel)} onOpenChange={(open) => (!open ? setEditingChannel(null) : null)}>
        <DialogContent showCloseButton={false} className="flex max-h-[88vh] w-[min(94vw,760px)] max-w-none flex-col overflow-hidden rounded-lg p-0">
          <DialogHeader className="border-b border-rose-100 px-5 pt-5 pb-4 sm:px-6">
            <DialogTitle>{isEditingInternal ? "配置内置账号池" : "编辑渠道配置"}</DialogTitle>
            <DialogDescription className="leading-6 text-stone-500">
              {isEditingInternal ? "内置账号池仅控制是否允许回落调用本地账号。" : "修改渠道名称、地址、模型范围和路由参数。"}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
            <label className="flex items-center gap-3 rounded-lg border border-rose-100 bg-white/70 px-4 py-3 text-sm">
              <Checkbox
                checked={editForm.enabled}
                onCheckedChange={(checked) => setEditForm((current) => ({ ...current, enabled: checked === true }))}
              />
              <span className="font-medium text-stone-800">启用该渠道</span>
            </label>

            {isEditingInternal ? (
              <div className="space-y-2 rounded-lg border border-rose-100 bg-white/70 p-4 text-sm">
                <div className="font-semibold text-stone-800">内置模型</div>
                <div className="leading-6 text-stone-500">{editForm.models}</div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {CHANNEL_FIELDS.map((field) => (
                  <div key={field.key} className={field.key === "models" ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"}>
                    <FieldCaption field={field} />
                    {field.key === "models" ? (
                      <Textarea
                        value={editForm.models}
                        onChange={(event) => updateEditField("models", event.target.value)}
                        placeholder={field.placeholder}
                        className="min-h-24 rounded-xl border-rose-100 bg-white"
                      />
                    ) : (
                      <Input
                        type={field.type || "text"}
                        value={editForm[field.key]}
                        onChange={(event) => updateEditField(field.key, event.target.value)}
                        placeholder={field.placeholder}
                        autoComplete={field.key === "api_key" ? "new-password" : undefined}
                        className="h-10 rounded-xl border-rose-100 bg-white"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-rose-100 px-5 py-4 sm:px-6">
            <Button variant="outline" className="h-10 rounded-xl border-rose-100 bg-white" onClick={() => setEditingChannel(null)}>
              取消
            </Button>
            <Button
              className="h-10 rounded-xl bg-rose-500 text-white hover:bg-rose-600"
              disabled={Boolean(editingChannel && savingChannelId === editingChannel.id)}
              onClick={() => void handleSaveEdit()}
            >
              {editingChannel && savingChannelId === editingChannel.id ? <LoaderCircle className="size-4 animate-spin" /> : null}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export default function ChannelsPage() {
  const { isCheckingAuth, session } = useAuthGuard(["admin"]);
  if (isCheckingAuth || !session) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoaderCircle className="size-5 animate-spin text-rose-400" />
      </div>
    );
  }
  return <ChannelsContent />;
}
