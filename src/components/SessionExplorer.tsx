import React, { useState } from "react";
import { Search, Calendar, Clock, Sparkles, SlidersHorizontal, ChevronRight, ChevronDown, ArrowUpDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SessionRow, BlockRow } from "../types";

interface SessionExplorerProps {
  sessions: SessionRow[];
  blocks: BlockRow[];
}

export default function SessionExplorer({ sessions, blocks }: SessionExplorerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("all");
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  
  // Sorting state: default sort by last active time descending
  const [sortBy, setSortBy] = useState<"sessionId" | "agent" | "timestamp" | "totalTokens" | "totalCost">("timestamp");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Filter sessions
  const filteredSessions = (sessions || []).filter(session => {
    if (!session) return false;
    const sessionId = session.sessionId || session.period || "";
    const agent = session.agent || "";
    const matchesSearch = sessionId.toLowerCase().includes((searchQuery || "").toLowerCase()) || 
                          agent.toLowerCase().includes((searchQuery || "").toLowerCase());
    const matchesAgent = selectedAgent === "all" || agent === selectedAgent;
    
    return matchesSearch && matchesAgent;
  });

  // Sort sessions
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    let valA: any;
    let valB: any;

    if (sortBy === "sessionId") {
      valA = a.sessionId || a.period || "";
      valB = b.sessionId || b.period || "";
    } else if (sortBy === "agent") {
      valA = a.agent || "";
      valB = b.agent || "";
    } else if (sortBy === "timestamp") {
      valA = a.timestamp || (a.metadata && a.metadata.lastActivity) || "";
      valB = b.timestamp || (b.metadata && b.metadata.lastActivity) || "";
    } else if (sortBy === "totalTokens") {
      valA = a.totalTokens || 0;
      valB = b.totalTokens || 0;
    } else if (sortBy === "totalCost") {
      valA = a.totalCost || 0;
      valB = b.totalCost || 0;
    } else {
      return 0;
    }

    if (typeof valA === "string" && typeof valB === "string") {
      return sortOrder === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    } else {
      return sortOrder === "asc" ? valA - valB : valB - valA;
    }
  });

  // Toggle sort handler
  const handleSort = (key: "sessionId" | "agent" | "timestamp" | "totalTokens" | "totalCost") => {
    if (sortBy === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortOrder("desc");
    }
  };

  // Unique list of agents in sessions for dropdown filter
  const uniqueAgents = Array.from(new Set((sessions || []).map(s => s ? s.agent : "").filter(Boolean)));

  const toggleSessionExpand = (id: string) => {
    setExpandedSession(expandedSession === id ? null : id);
  };

  // Formats token counts to Millions (e.g. 1.55M). Very small values show up to 4 decimals (e.g. 0.0004M).
  const formatTokens = (num: number): string => {
    if (!num) return "0.00M";
    const val = num / 1000000;
    if (val < 0.01) {
      return val.toFixed(4) + "M";
    }
    return val.toFixed(2) + "M";
  };

  const formatDate = (isoStr: string): string => {
    if (!isoStr) return "N/A";
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div id="session-explorer-card" className="bg-white border border-slate-200 rounded-2xl m-6 overflow-hidden shadow-sm">
      
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-800">活跃会话数 ({sessions.length})</h3>
        </div>
      </div>

      <div className="p-6">
        {/* Filters Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex-1 flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="按会话 ID 或开发代理搜索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Agent dropdown */}
            <div className="relative">
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 transition-colors cursor-pointer appearance-none pr-8 font-semibold"
              >
                <option value="all">所有开发代理</option>
                {uniqueAgents.map(agent => {
                  const displayAgent = agent === "claude" ? "Claude" : agent === "codex" ? "Codex" : agent;
                  return (
                    <option key={agent} value={agent}>{displayAgent}</option>
                  );
                })}
              </select>
              <div className="absolute right-3 top-3 pointer-events-none text-slate-400">
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Sessions Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-xs font-mono bg-slate-50/75">
                <th className="py-3.5 px-4 w-6"></th>
                <th 
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors select-none group"
                  onClick={() => handleSort("sessionId")}
                >
                  <div className="flex items-center gap-1">
                    <span>会话 / 阶段 ID</span>
                    <ArrowUpDown className={`w-3 h-3 transition-colors ${sortBy === "sessionId" ? "text-indigo-600" : "text-slate-400 opacity-40 group-hover:opacity-100"}`} />
                  </div>
                </th>
                <th 
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors select-none group"
                  onClick={() => handleSort("agent")}
                >
                  <div className="flex items-center gap-1">
                    <span>开发代理</span>
                    <ArrowUpDown className={`w-3 h-3 transition-colors ${sortBy === "agent" ? "text-indigo-600" : "text-slate-400 opacity-40 group-hover:opacity-100"}`} />
                  </div>
                </th>
                <th 
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors select-none group"
                  onClick={() => handleSort("timestamp")}
                >
                  <div className="flex items-center gap-1">
                    <span>最后活跃时间</span>
                    <ArrowUpDown className={`w-3 h-3 transition-colors ${sortBy === "timestamp" ? "text-indigo-600" : "text-slate-400 opacity-40 group-hover:opacity-100"}`} />
                  </div>
                </th>
                <th 
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors select-none group text-right"
                  onClick={() => handleSort("totalTokens")}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>总 Token 数</span>
                    <ArrowUpDown className={`w-3 h-3 transition-colors ${sortBy === "totalTokens" ? "text-indigo-600" : "text-slate-400 opacity-40 group-hover:opacity-100"}`} />
                  </div>
                </th>
                <th 
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors select-none group text-right"
                  onClick={() => handleSort("totalCost")}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>预估开销</span>
                    <ArrowUpDown className={`w-3 h-3 transition-colors ${sortBy === "totalCost" ? "text-indigo-600" : "text-slate-400 opacity-40 group-hover:opacity-100"}`} />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {sortedSessions.map((session) => {
                if (!session) return null;
                const sessionId = session.sessionId || session.period || "";
                const agent = session.agent || "";
                const timestamp = session.timestamp || (session.metadata && session.metadata.lastActivity) || "";
                const totalTokens = session.totalTokens || 0;
                const totalCost = session.totalCost || 0;
                const inputTokens = session.inputTokens || 0;
                const outputTokens = session.outputTokens || 0;
                const cacheReadTokens = session.cacheReadTokens || 0;
                const cacheCreationTokens = session.cacheCreationTokens || 0;

                const isExpanded = expandedSession === sessionId;
                
                // Compute cache ratio for session
                const inputSum = inputTokens + cacheReadTokens;
                const cacheRatio = inputSum > 0 ? (cacheReadTokens / inputSum) * 100 : 0;

                return (
                  <React.Fragment key={sessionId}>
                    <tr
                      onClick={() => toggleSessionExpand(sessionId)}
                      className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                        isExpanded ? "bg-indigo-50/20" : ""
                      }`}
                    >
                      <td className="py-4 px-4 text-slate-400">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </td>
                      <td className="py-4 px-4 font-mono font-bold text-slate-800 max-w-[180px] truncate" title={sessionId}>
                        {sessionId}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${
                          agent.toLowerCase().includes("claude")
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : agent.toLowerCase().includes("copilot") || agent.toLowerCase().includes("codex")
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                            : "bg-violet-50 text-violet-700 border-violet-200"
                        }`}>
                          <Sparkles className="w-3 h-3 animate-pulse" />
                          {agent === "claude" ? "Claude" : agent === "codex" ? "Codex" : agent}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-600 flex items-center gap-1.5 mt-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(timestamp)}</span>
                      </td>
                      <td className="py-4 px-4 text-right font-mono font-bold text-slate-900">
                        {formatTokens(totalTokens)}
                      </td>
                      <td className="py-4 px-4 text-right font-mono font-bold text-emerald-600">
                        ${totalCost.toFixed(4)}
                      </td>
                    </tr>

                    {/* Expanded Details Row */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="p-0 bg-slate-50/30">
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden border-b border-slate-150"
                            >
                              <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
                                {/* Metrics breakdown list */}
                                <div className="bg-white border border-slate-150 p-3.5 rounded-xl space-y-2 shadow-sm">
                                  <div className="text-slate-500 uppercase font-bold tracking-wider mb-2">Token 指标细分</div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">输入 Token:</span>
                                    <span className="text-slate-800 font-bold">{formatTokens(inputTokens)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">输出 Token:</span>
                                    <span className="text-slate-800 font-bold">{formatTokens(outputTokens)}</span>
                                  </div>
                                  {session.metadata && session.metadata.reasoningOutputTokens !== undefined && (
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">推理输出 Token:</span>
                                      <span className="text-indigo-600 font-bold">{formatTokens(session.metadata.reasoningOutputTokens)}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">总计 Token:</span>
                                    <span className="text-slate-900 font-extrabold">{formatTokens(totalTokens)}</span>
                                  </div>
                                </div>

                                {/* Cache metrics */}
                                <div className="bg-white border border-slate-150 p-3.5 rounded-xl space-y-2 shadow-sm">
                                  <div className="text-slate-500 uppercase font-bold tracking-wider mb-2">缓存统计</div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">缓存读取 (命中):</span>
                                    <span className="text-emerald-600 font-bold">{formatTokens(cacheReadTokens)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">缓存创建 (未命中):</span>
                                    <span className="text-amber-600 font-bold">{formatTokens(cacheCreationTokens)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">缓存命中率:</span>
                                    <span className="text-emerald-600 font-extrabold">{cacheRatio.toFixed(1)}%</span>
                                  </div>
                                </div>

                                {/* Visual horizontal stack bar */}
                                <div className="bg-white border border-slate-150 p-3.5 rounded-xl flex flex-col justify-between col-span-1 md:col-span-2 shadow-sm">
                                  <div>
                                    <div className="text-slate-500 uppercase font-bold tracking-wider mb-2">Token 分布占比</div>
                                    <div className="w-full h-2.5 bg-slate-100 rounded-full flex overflow-hidden mt-1.5">
                                      <div style={{ width: `${(inputTokens/Math.max(1, totalTokens))*100}%` }} className="bg-violet-400" title="输入" />
                                      <div style={{ width: `${(outputTokens/Math.max(1, totalTokens))*100}%` }} className="bg-indigo-400" title="输出" />
                                      <div style={{ width: `${(cacheReadTokens/Math.max(1, totalTokens))*100}%` }} className="bg-emerald-400" title="缓存读取" />
                                      <div style={{ width: `${(cacheCreationTokens/Math.max(1, totalTokens))*100}%` }} className="bg-amber-400" title="缓存创建" />
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500 mt-2 font-semibold">
                                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-violet-400" /> <span>标准输入</span></div>
                                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-400" /> <span>生成输出</span></div>
                                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-400" /> <span>缓存命中</span></div>
                                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400" /> <span>缓存未命中</span></div>
                                  </div>
                                </div>

                                {/* Model Breakdown Section */}
                                {session.modelBreakdowns && session.modelBreakdowns.length > 0 && (
                                  <div className="col-span-1 md:col-span-4 bg-slate-50/50 border border-slate-150 p-4 rounded-xl shadow-inner space-y-3 mt-2">
                                    <div className="text-slate-500 uppercase font-bold tracking-wider text-[10px]">模型级明细 (Model Breakdown)</div>
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-left border-collapse text-[11px]">
                                        <thead>
                                          <tr className="border-b border-slate-200 text-slate-400 font-bold pb-2 text-left">
                                            <th className="pb-2">模型名称</th>
                                            <th className="pb-2 text-right">输入 Tokens</th>
                                            <th className="pb-2 text-right">输出 Tokens</th>
                                            <th className="pb-2 text-right">缓存命中 (读取)</th>
                                            <th className="pb-2 text-right">缓存未命中 (创建)</th>
                                            <th className="pb-2 text-right">模型级预估开销</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-150 font-mono">
                                          {session.modelBreakdowns.map((mb: any, idx: number) => (
                                            <tr key={idx} className="text-slate-700 hover:bg-white/80 transition-colors">
                                              <td className="py-2.5 font-bold text-indigo-600">{mb.modelName || "未知模型"}</td>
                                              <td className="py-2.5 text-right">{formatTokens(mb.inputTokens)}</td>
                                              <td className="py-2.5 text-right">{formatTokens(mb.outputTokens)}</td>
                                              <td className="py-2.5 text-right text-emerald-600">{formatTokens(mb.cacheReadTokens)}</td>
                                              <td className="py-2.5 text-right text-amber-600">{formatTokens(mb.cacheCreationTokens)}</td>
                                              <td className="py-2.5 text-right font-bold text-slate-950">${(mb.cost || 0).toFixed(4)}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}
              {sortedSessions.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 text-xs font-semibold">
                    当前筛选条件下未找到任何匹配的会话。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
