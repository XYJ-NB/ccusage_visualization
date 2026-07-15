import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import MetricCards from "./components/MetricCards";
import Charts from "./components/Charts";
import SessionExplorer from "./components/SessionExplorer";
import InstructionGuide from "./components/InstructionGuide";
import LogsPlayground from "./components/LogsPlayground";
import { CCUsageStatus, CCUsageReport, UsageRow, SessionRow, BlockRow, Totals } from "./types";
import { AlertCircle, Terminal, HelpCircle } from "lucide-react";

export default function App() {
  const [status, setStatus] = useState<CCUsageStatus | null>(null);
  const [isSimulated, setIsSimulated] = useState<boolean>(true); // Default to simulated demo mode
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "monthly">("daily");
  
  // Date filters
  const [sinceDate, setSinceDate] = useState<string>("");
  const [untilDate, setUntilDate] = useState<string>("");

  // Data states
  const [isLoading, setIsLoading] = useState(false);
  const [trendData, setTrendData] = useState<UsageRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [blocks, setBlocks] = useState<BlockRow[]>([]);
  const [totals, setTotals] = useState<Totals>({
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheCreationTokens: 0,
    totalTokens: 0,
    totalCost: 0
  });

  const [hasCustomPasted, setHasCustomPasted] = useState(false);
  const [customPastedType, setCustomPastedType] = useState<string>("");

  // Check ccusage status in the backend environment
  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch("/api/ccusage/status");
        const data = await res.json();
        setStatus(data);
        // If ccusage is locally detected and we haven't loaded custom data, try pulling real system data
        if (data.installed && !hasCustomPasted) {
          setIsSimulated(false);
        }
      } catch (err) {
        console.error("Failed to check ccusage status:", err);
      }
    }
    checkStatus();
  }, []);

  // Fetch usage report based on activeTab, dates, and simulation mode
  const fetchReport = async () => {
    // If the user has pasted custom data, don't auto-overwrite with backend empty queries unless they refresh
    if (hasCustomPasted) return;

    setIsLoading(true);
    try {
      const mode = isSimulated ? "mock" : "local";
      const queryParams = new URLSearchParams();
      if (sinceDate) queryParams.append("since", sinceDate);
      if (untilDate) queryParams.append("until", untilDate);
      queryParams.append("byAgent", "true");

      // 1. Fetch main trend aggregation (daily/weekly/monthly)
      const trendRes = await fetch(`/api/usage/${mode}/${activeTab}?${queryParams.toString()}`);
      const trendResult = await trendRes.json();

      // Extract trend array based on activeTab key
      let rows: UsageRow[] = [];
      if (activeTab === "daily") rows = trendResult.daily || [];
      else if (activeTab === "weekly") rows = trendResult.weekly || [];
      else if (activeTab === "monthly") rows = trendResult.monthly || [];

      setTrendData(rows);
      setTotals(trendResult.totals || {
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheCreationTokens: 0,
        totalTokens: 0,
        totalCost: 0
      });

      // 2. Fetch Sessions
      const sessionsRes = await fetch(`/api/usage/${mode}/session?${queryParams.toString()}`);
      const sessionsResult = await sessionsRes.json();
      setSessions(sessionsResult.session || []);

      // 3. Fetch Claude 5H Billing Blocks
      const blocksRes = await fetch(`/api/usage/${mode}/blocks?${queryParams.toString()}`);
      const blocksResult = await blocksRes.json();
      setBlocks(blocksResult.blocks || []);

    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Re-fetch when filter params, simulation mode or activeTab aggregates change
  useEffect(() => {
    fetchReport();
  }, [isSimulated, activeTab, sinceDate, untilDate]);

  // Handle manual dashboard refreshes
  const handleRefresh = () => {
    setHasCustomPasted(false);
    setCustomPastedType("");
    fetchReport();
  };

  // Callback to import pasted raw ccusage JSON
  const handleImportData = (pastedData: any, type: "daily" | "weekly" | "monthly" | "session" | "blocks") => {
    setHasCustomPasted(true);
    setCustomPastedType(type);
    setIsSimulated(false); // Disable mock template overlays

    if (type === "daily" || type === "weekly" || type === "monthly") {
      let rows: UsageRow[] = [];
      if (type === "daily") rows = pastedData.daily || [];
      else if (type === "weekly") rows = pastedData.weekly || [];
      else if (type === "monthly") rows = pastedData.monthly || [];

      setTrendData(rows);
      setActiveTab(type);
    } else if (type === "session") {
      setSessions(pastedData.session || []);
    } else if (type === "blocks") {
      setBlocks(pastedData.blocks || []);
    }

    if (pastedData.totals) {
      setTotals(pastedData.totals);
    }
  };

  // Count unique agents in the dataset to pass to metric cards
  const activeAgentNames = new Set<string>();
  trendData.forEach(row => {
    if (row.agents) {
      Object.keys(row.agents).forEach(name => activeAgentNames.add(name));
    }
  });
  const activeAgentCount = activeAgentNames.size || (isSimulated ? 5 : 0);

  return (
    <div id="desktop-app-wrapper" className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans select-none pb-8">
      
      {/* Header Panel */}
      <Header
        status={status}
        isSimulated={isSimulated}
        setIsSimulated={(sim) => {
          setHasCustomPasted(false);
          setIsSimulated(sim);
        }}
        isLoading={isLoading}
        onRefresh={handleRefresh}
        sinceDate={sinceDate}
        setSinceDate={setSinceDate}
        untilDate={untilDate}
        setUntilDate={setUntilDate}
      />

      {/* Main viewport */}
      <main className="flex-1 max-w-7xl mx-auto w-full">
        
        {/* Custom Data active banner */}
        {hasCustomPasted && (
          <div className="mx-6 mt-4 p-3 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs rounded-xl flex items-center justify-between shadow-sm">
            <span className="font-mono font-semibold">
              ⚡ 正在展示手动导入的 <strong>{customPastedType === "daily" ? "日消耗" : customPastedType === "weekly" ? "周消耗" : customPastedType === "monthly" ? "月消耗" : customPastedType === "session" ? "活跃会话" : "计费块"}</strong> 数据集。图表已启用实时交互模式！
            </span>
            <button
              onClick={handleRefresh}
              className="px-2.5 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition-colors cursor-pointer text-[10px] font-bold shadow-sm"
            >
              恢复默认数据源
            </button>
          </div>
        )}

        {/* Local Empty State message if using system and database is empty */}
        {!isSimulated && !hasCustomPasted && trendData.length === 0 && (
          <div className="mx-6 mt-4 p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-start gap-2.5 shadow-sm">
            <AlertCircle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900">当前运行容器中未检测到本地开发代理日志源</p>
              <p className="text-amber-800 mt-1 leading-relaxed font-medium">
                此应用当前正运行在安全的沙盒容器内，默认不包含您本机的实际开发代理日志。为了预览精美的数据分析仪表盘，我们强烈建议开启顶部工具栏中的<strong>“模拟演示数据”</strong>模式，或者直接在下方的<strong>“导入并可视化 JSON 数据”</strong>区域中粘贴您本机 `ccusage` CLI 命令导出的 JSON 终端输出数据！
              </p>
            </div>
          </div>
        )}

        {/* Key KPI Bento Grid Cards */}
        <MetricCards totals={totals} activeAgentCount={activeAgentCount} />

        {/* Aggregation Tab Selector */}
        <div className="px-6 mt-6">
          <div className="flex items-center gap-1 bg-slate-100 p-1 border border-slate-200 rounded-xl w-max shadow-inner">
            {(["daily", "weekly", "monthly"] as const).map((tab) => {
              const labelMap = {
                daily: "日级聚合",
                weekly: "周级聚合",
                monthly: "月级聚合"
              };
              return (
                <button
                  key={tab}
                  onClick={() => {
                    setHasCustomPasted(false);
                    setActiveTab(tab);
                  }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-wide cursor-pointer transition-all ${
                    activeTab === tab
                      ? "bg-white text-indigo-700 shadow-sm border border-slate-200/60"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {labelMap[tab]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Charts & Interactive Graphs */}
        <Charts data={trendData} dataType={activeTab} />

        {/* Sessions, Duration lists & Claude billing blocks */}
        <SessionExplorer sessions={sessions} blocks={blocks} />

        {/* Copy/Paste Playground for Sandbox users */}
        <LogsPlayground onImportData={handleImportData} />

        {/* CLI Reference Sheet & Architecture Info */}
        <InstructionGuide />

      </main>

      {/* Simple, clean page credit */}
      <footer className="mt-8 text-center text-[11px] text-slate-500 font-mono font-semibold">
        <span>基于 ryoppippi/ccusage 本地 CLI 解析器。100% 客户端本地化隐私保障。</span>
      </footer>

    </div>
  );
}
