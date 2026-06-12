import { useState, useEffect } from "react";
import { rulesApi } from "../utils/api";
import { contributionTypeNames } from "../utils/format";
import toast from "react-hot-toast";

interface RuleWeight {
  type: string;
  weight: number;
  description: string;
}

interface Rule {
  id: string;
  name: string;
  description: string;
  weights: RuleWeight[];
  baseReward: string;
  maxRewardPerContributor: string;
  createdAt: number;
  updatedAt: number;
  active: boolean;
}

const defaultWeights: RuleWeight[] = [
  { type: "pull_request", weight: 8, description: "Pull Request - 代码贡献" },
  { type: "code_review", weight: 7, description: "Code Review - 代码审查" },
  { type: "commit", weight: 5, description: "Commit - 代码提交" },
  { type: "issue", weight: 4, description: "Issue - 问题反馈" },
  { type: "discord_message", weight: 2, description: "Discord 消息" },
  { type: "discord_help", weight: 6, description: "Discord 帮助" },
  { type: "forum_post", weight: 5, description: "论坛帖子" },
  { type: "forum_reply", weight: 3, description: "论坛回复" },
];

export default function Rules() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    baseReward: "1000000000000000000", // 1 token
    maxRewardPerContributor: "100000000000000000000", // 100 tokens
    weights: [...defaultWeights],
  });

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const res = await rulesApi.getAll();
      if (res.success) {
        setRules(res.data as Rule[]);
      }
    } catch (error) {
      console.error("Failed to load rules:", error);
      toast.error("加载规则失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name) {
      toast.error("请填写规则名称");
      return;
    }

    try {
      if (editingRule) {
        const res = await rulesApi.update(editingRule.id, form);
        if (res.success) {
          toast.success("规则更新成功");
          await loadRules();
          resetForm();
        }
      } else {
        const res = await rulesApi.create(form);
        if (res.success) {
          toast.success("规则创建成功");
          await loadRules();
          resetForm();
        }
      }
    } catch (error: any) {
      toast.error(error.message || "操作失败");
    }
  };

  const handleEdit = (rule: Rule) => {
    setEditingRule(rule);
    setForm({
      name: rule.name,
      description: rule.description,
      baseReward: rule.baseReward,
      maxRewardPerContributor: rule.maxRewardPerContributor,
      weights: [...rule.weights],
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要禁用此规则吗？")) return;

    try {
      const res = await rulesApi.delete(id);
      if (res.success) {
        toast.success("规则已禁用");
        await loadRules();
      }
    } catch (error: any) {
      toast.error(error.message || "操作失败");
    }
  };

  const handleActivate = async (id: string) => {
    try {
      const res = await rulesApi.activate(id);
      if (res.success) {
        toast.success("规则已激活");
        await loadRules();
      }
    } catch (error: any) {
      toast.error(error.message || "操作失败");
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingRule(null);
    setForm({
      name: "",
      description: "",
      baseReward: "1000000000000000000",
      maxRewardPerContributor: "100000000000000000000",
      weights: [...defaultWeights],
    });
  };

  const updateWeight = (type: string, weight: number) => {
    setForm({
      ...form,
      weights: form.weights.map((w) =>
        w.type === type ? { ...w, weight: Math.min(10, Math.max(1, weight)) } : w
      ),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="ios-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header - iOS 26 Style */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="ios-gradient-text">Rules</span>
          </h1>
          <p className="text-ios-gray mt-1">管理贡献评估和结算规则</p>
        </div>
        <button onClick={() => setShowForm(true)} className="ios-btn ios-btn-primary">
          ➕ 新建规则
        </button>
      </div>

      {/* Form Modal - iOS 26 Style */}
      {showForm && (
        <div className="ios-modal-overlay" onClick={resetForm}>
          <div className="ios-modal max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-ios-purple to-ios-pink flex items-center justify-center text-2xl">
                ⚙️
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {editingRule ? "编辑规则" : "新建规则"}
                </h2>
                <p className="text-ios-gray text-sm">配置贡献评估权重</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ios-gray mb-2">规则名称 *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="ios-input"
                  placeholder="例如: 标准贡献规则"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ios-gray mb-2">描述</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="ios-input"
                  rows={2}
                  placeholder="规则描述"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ios-gray mb-2">
                    基础奖励 (wei)
                  </label>
                  <input
                    type="text"
                    value={form.baseReward}
                    onChange={(e) => setForm({ ...form, baseReward: e.target.value })}
                    className="ios-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ios-gray mb-2">
                    最大奖励/人 (wei)
                  </label>
                  <input
                    type="text"
                    value={form.maxRewardPerContributor}
                    onChange={(e) =>
                      setForm({ ...form, maxRewardPerContributor: e.target.value })
                    }
                    className="ios-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ios-gray mb-3">
                  贡献类型权重 (1-10)
                </label>
                <div className="space-y-2">
                  {form.weights.map((w) => (
                    <div
                      key={w.type}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/5"
                    >
                      <div>
                        <p className="font-medium text-sm">
                          {contributionTypeNames[w.type] || w.type}
                        </p>
                        <p className="text-xs text-ios-gray">{w.description}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateWeight(w.type, w.weight - 1)}
                          className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-semibold text-ios-blue">
                          {w.weight}
                        </span>
                        <button
                          onClick={() => updateWeight(w.type, w.weight + 1)}
                          className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={resetForm} className="ios-btn ios-btn-secondary flex-1">
                取消
              </button>
              <button onClick={handleSubmit} className="ios-btn ios-btn-primary flex-1">
                {editingRule ? "更新" : "创建"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rules List - iOS 26 Style */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {rules.length === 0 ? (
          <div className="ios-card col-span-2 text-center py-16">
            <span className="text-5xl block mb-4">📋</span>
            <p className="text-ios-gray text-lg">暂无规则</p>
            <p className="text-ios-gray/60 text-sm mt-1">请创建新规则</p>
          </div>
        ) : (
          rules.map((rule) => (
            <div key={rule.id} className={`ios-card ${!rule.active ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ios-purple to-ios-pink flex items-center justify-center text-xl">
                    ⚙️
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{rule.name}</h3>
                    <p className="text-ios-gray text-sm">{rule.description}</p>
                  </div>
                </div>
                <span
                  className={`ios-badge ${
                    rule.active ? "ios-badge-green" : "ios-badge-orange"
                  }`}
                >
                  {rule.active ? "活跃" : "已禁用"}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-ios-gray">基础奖励</span>
                  <span className="font-mono">{rule.baseReward} wei</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ios-gray">最大奖励/人</span>
                  <span className="font-mono">{rule.maxRewardPerContributor} wei</span>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs text-ios-gray mb-2">权重配置</p>
                <div className="flex flex-wrap gap-2">
                  {rule.weights.map((w) => (
                    <span
                      key={w.type}
                      className="ios-badge ios-badge-blue"
                    >
                      {contributionTypeNames[w.type] || w.type}: {w.weight}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-glass-border">
                <button onClick={() => handleEdit(rule)} className="ios-btn ios-btn-secondary text-sm flex-1">
                  编辑
                </button>
                {rule.active ? (
                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="ios-btn ios-btn-danger text-sm flex-1"
                  >
                    禁用
                  </button>
                ) : (
                  <button
                    onClick={() => handleActivate(rule.id)}
                    className="ios-btn ios-btn-primary text-sm flex-1"
                  >
                    激活
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
