import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line
} from "recharts";
import { TrendingUp, BarChart3, PieChart as PieIcon, Coins } from "lucide-react";
import { UsageRow } from "../types";

interface ChartsProps {
  data: UsageRow[];
  dataType: "daily" | "weekly" | "monthly";
}

export default function Charts({ data, dataType }: ChartsProps) {
  const [activeTab, setActiveTab] = useState<"token_trend" | "cost_trend" | "agent_split" | "token_split">("token_trend");

  if (!data || data.length === 0) {
    return (
      <div id="empty-charts" className="flex flex-col items-center justify-center h-96 border border-dashed border-slate-250 rounded-2xl bg-slate-50 m-6 shadow-inner">
        <BarChart3 className="w-12 h-12 text-slate-400 animate-pulse mb-3" />
        <h3 className="text-slate-700 font-bold font-display text-sm">暂无消耗数据</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm text-center font-medium leading-relaxed">
          等待 ccusage 扫描您的本地系统，或者点击上方“模拟演示数据”来探索完整的可视化图表。
        </p>
      </div>
    );
  }

  // Format data for charts
  const chartData = data.map(row => {
    return {
      name: row.date || row.week || row.month || "",
      input: row.inputTokens,
      output: row.outputTokens,
      cacheRead: row.cacheReadTokens,
      cacheWrite: row.cacheCreationTokens,
      total: row.totalTokens,
      cost: Number(row.totalCost.toFixed(3))
    };
  });

  // Calculate agent-by-agent spend splits
  const agentTotals: Record<string, { cost: number; tokens: number }> = {};
  data.forEach(row => {
    if (row.agents) {
      Object.entries(row.agents).forEach(([agent, metrics]) => {
        if (!agentTotals[agent]) {
          agentTotals[agent] = { cost: 0, tokens: 0 };
        }
        agentTotals[agent].cost += metrics.totalCost;
        agentTotals[agent].tokens += metrics.totalTokens;
      });
    }
  });

  const agentSpendData = Object.entries(agentTotals).map(([name, totals]) => ({
    name,
    value: Number(totals.cost.toFixed(2)),
    tokens: totals.tokens
  })).sort((a, b) => b.value - a.value);

  // Calculate total token types across whole set
  let totalInput = 0;
  let totalOutput = 0;
  let totalCacheRead = 0;
  let totalCacheWrite = 0;

  data.forEach(row => {
    totalInput += row.inputTokens;
    totalOutput += row.outputTokens;
    totalCacheRead += row.cacheReadTokens;
    totalCacheWrite += row.cacheCreationTokens;
  });

  const tokenTypeData = [
    { name: "标准输入", value: totalInput },
    { name: "输出生成", value: totalOutput },
    { name: "缓存命中 (读取)", value: totalCacheRead },
    { name: "缓存未命中 (写入)", value: totalCacheWrite }
  ].filter(d => d.value > 0);

  // Color mappings
  const COLORS = ["#8b5cf6", "#6366f1", "#10b981", "#f59e0b", "#ec4899", "#3b82f6"];
  const TOKEN_COLORS = {
    "标准输入": "#a78bfa",
    "输出生成": "#6366f1",
    "缓存命中 (读取)": "#34d399",
    "缓存未命中 (写入)": "#fbbf24"
  };

  // Formatter for tokens to M (Millions)
  const formatTokensToM = (value: number) => {
    return `${(value / 1000000).toFixed(2)}M`;
  };

  // Custom formatted tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xl font-mono text-xs">
          <p className="text-slate-900 border-b border-slate-150 pb-1.5 mb-2 font-display font-bold">
            {label}
          </p>
          <div className="space-y-1.5 font-sans font-semibold">
            {payload.map((item: any, idx: number) => {
              let displayName = item.name;
              if (item.name === "input" || item.name === "Standard Input") displayName = "标准输入";
              else if (item.name === "output" || item.name === "Output Generation") displayName = "输出生成";
              else if (item.name === "cacheRead" || item.name === "Cache Hits (Read)" || item.name === "缓存命中 (读取)") displayName = "缓存命中 (读取)";
              else if (item.name === "cacheWrite" || item.name === "Cache Misses (Write)" || item.name === "缓存未命中 (写入)") displayName = "缓存未命中 (写入)";
              else if (item.name === "cost" || item.name === "Estimated Cost") displayName = "预估开销";

              return (
                <div key={idx} className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color || item.fill }} />
                    <span className="text-slate-600">{displayName}:</span>
                  </div>
                  <span className="font-bold text-slate-900">
                    {item.name === "cost" ? `$${item.value.toFixed(2)}` : formatTokensToM(item.value)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="charts-container" className="bg-white border border-slate-200 rounded-2xl p-6 m-6 shadow-sm">
      
      {/* Chart Headers & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-150 pb-5 mb-6">
        <div>
          <h2 className="text-lg font-bold font-display text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            <span>消耗洞察 ({dataType === "daily" ? "每日数据" : dataType === "weekly" ? "每周数据" : "每月数据"})</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            直观展示 API 调用量、缓存消耗占比以及预算消耗速度。
          </p>
        </div>

        {/* View Selection Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab("token_trend")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "token_trend"
                ? "bg-white text-indigo-600 border border-slate-200 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Token 消耗趋势</span>
          </button>
          
          <button
            onClick={() => setActiveTab("cost_trend")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "cost_trend"
                ? "bg-white text-indigo-600 border border-slate-200 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>消费流向趋势</span>
          </button>

          <button
            onClick={() => setActiveTab("agent_split")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "agent_split"
                ? "bg-white text-indigo-600 border border-slate-200 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>各代理消耗占比</span>
          </button>

          <button
            onClick={() => setActiveTab("token_split")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "token_split"
                ? "bg-white text-indigo-600 border border-slate-200 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>Token 结构分配</span>
          </button>
        </div>
      </div>

      {/* Primary Rendering Arena */}
      <div className="w-full min-h-[380px] flex items-center justify-center">
        {activeTab === "token_trend" && (
          <div className="w-full h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInput" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOutput" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRead" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorWrite" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={formatTokensToM} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#64748b', paddingTop: '15px' }} />
                <Area type="monotone" dataKey="input" name="标准输入" stroke="#a78bfa" strokeWidth={2} fillOpacity={1} fill="url(#colorInput)" stackId="1" />
                <Area type="monotone" dataKey="output" name="输出生成" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorOutput)" stackId="1" />
                <Area type="monotone" dataKey="cacheRead" name="缓存命中 (读取)" stroke="#34d399" strokeWidth={2} fillOpacity={1} fill="url(#colorRead)" stackId="1" />
                <Area type="monotone" dataKey="cacheWrite" name="缓存未命中 (写入)" stroke="#fbbf24" strokeWidth={2} fillOpacity={1} fill="url(#colorWrite)" stackId="1" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === "cost_trend" && (
          <div className="w-full h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit="$" />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#64748b', paddingTop: '15px' }} />
                <Area type="monotone" dataKey="cost" name="预估开销" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorCost)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === "agent_split" && (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 items-center gap-8 px-6">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={agentSpendData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {agentSpendData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, "开销占比"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Agent List Key */}
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              <h4 className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-2 font-semibold">各代理预估消费明细</h4>
              {agentSpendData.map((agent, index) => {
                const totalCost = agentSpendData.reduce((acc, a) => acc + a.value, 0);
                const percent = totalCost > 0 ? (agent.value / totalCost) * 100 : 0;
                return (
                  <div key={agent.name} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-sm font-semibold text-slate-800">{agent.name}</span>
                    </div>
                    <div className="text-right font-mono text-xs">
                      <span className="text-slate-900 font-bold">${agent.value.toFixed(2)}</span>
                      <span className="text-slate-500 ml-2">({percent.toFixed(1)}%)</span>
                    </div>
                  </div>
                );
              })}
              {agentSpendData.length === 0 && (
                <p className="text-xs text-slate-500">未检测到代理特定的消耗细分数据。</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "token_split" && (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 items-center gap-8 px-6">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tokenTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {tokenTypeData.map((entry) => (
                      <Cell key={entry.name} fill={TOKEN_COLORS[entry.name as keyof typeof TOKEN_COLORS] || "#8b5cf6"} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [formatTokensToM(value), "Token 数"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Token Allocation Keys */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-2 font-semibold">Token 类型占比分配</h4>
              {tokenTypeData.map((item) => {
                const totalTokens = tokenTypeData.reduce((acc, t) => acc + t.value, 0);
                const percent = totalTokens > 0 ? (item.value / totalTokens) * 100 : 0;
                return (
                  <div key={item.name} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: TOKEN_COLORS[item.name as keyof typeof TOKEN_COLORS] }} />
                      <span className="text-sm font-semibold text-slate-700">{item.name}</span>
                    </div>
                    <div className="text-right font-mono text-xs">
                      <span className="text-slate-900 font-bold">{item.value.toLocaleString()}</span>
                      <span className="text-slate-500 ml-2">({percent.toFixed(1)}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
