import React from "react";
import { Cpu, RefreshCw, Layers, ShieldCheck, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";
import { CCUsageStatus } from "../types";

interface HeaderProps {
  status: CCUsageStatus | null;
  isSimulated: boolean;
  setIsSimulated: (sim: boolean) => void;
  isLoading: boolean;
  onRefresh: () => void;
  sinceDate: string;
  setSinceDate: (date: string) => void;
  untilDate: string;
  setUntilDate: (date: string) => void;
}

export default function Header({
  status,
  isSimulated,
  setIsSimulated,
  isLoading,
  onRefresh,
  sinceDate,
  setSinceDate,
  untilDate,
  setUntilDate
}: HeaderProps) {
  return (
    <header id="desktop-header" className="relative z-10 border-b border-slate-200 bg-white/90 backdrop-blur-md px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm">
      
      {/* Title & Brand */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-indigo-600 rounded-xl shadow-md shadow-indigo-500/10 text-white">
          <Cpu className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-lg font-bold tracking-tight text-slate-900">
              CCUsage Token 消费分析
            </h1>
            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 rounded-md text-slate-600 border border-slate-200">
              桌面端 v1.0
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            实时 API Token 消耗与开销分析
          </p>
        </div>
      </div>

      {/* Control Actions & Status */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Date Filters */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-1.5 rounded-lg text-xs">
          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-mono font-medium">起始日期:</span>
            <input
              type="date"
              value={sinceDate}
              onChange={(e) => setSinceDate(e.target.value)}
              className="bg-white text-slate-800 outline-none px-1.5 py-0.5 rounded border border-slate-200 focus:border-indigo-500 transition-colors"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-mono font-medium">截止日期:</span>
            <input
              type="date"
              value={untilDate}
              onChange={(e) => setUntilDate(e.target.value)}
              className="bg-white text-slate-800 outline-none px-1.5 py-0.5 rounded border border-slate-200 focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Source Switcher */}
        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1 rounded-xl">
          <button
            onClick={() => setIsSimulated(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              !isSimulated
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>实时系统数据</span>
          </button>
          <button
            onClick={() => setIsSimulated(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isSimulated
                ? "bg-indigo-50/80 text-indigo-700 border border-indigo-100"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>模拟演示数据</span>
          </button>
        </div>

        {/* CLI status message */}
        <div className="flex items-center gap-2">
          {status?.installed ? (
            <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg text-xs font-mono">
              <ShieldCheck className="w-4 h-4" />
              <span>检测到 ccusage CLI</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg text-xs font-mono">
              <AlertTriangle className="w-4 h-4" />
              <span>ccusage 离线 (沙盒环境)</span>
            </div>
          )}
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          title="同步 ccusage CLI 数据"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-500" : ""}`} />
        </button>
      </div>
    </header>
  );
}
