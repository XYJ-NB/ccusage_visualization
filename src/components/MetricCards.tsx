import React from "react";
import { DollarSign, Cpu, Zap, Target, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { Totals } from "../types";

interface MetricCardsProps {
  totals: Totals;
  activeAgentCount: number;
}

export default function MetricCards({ totals, activeAgentCount }: MetricCardsProps) {
  // Format token counts to human-readable strings (e.g. 1.2M, 450K)
  const formatTokens = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  // Cache stats calculations
  const totalInputContext = totals.inputTokens + totals.cacheReadTokens;
  const cacheHitRatio = totalInputContext > 0 ? (totals.cacheReadTokens / totalInputContext) * 100 : 0;
  
  // Calculate Cache Cost Savings:
  // Standard input Sonnet is $3.00 / M, cache read is $0.30 / M. 
  // Cache savings = cacheReadTokens * (3.00 - 0.30) / 1,000,000 = cacheReadTokens * 2.70 / 1,000,000
  const usdSaved = (totals.cacheReadTokens * 2.7) / 1000000;

  // Percentage shares
  const inputShare = totals.totalTokens > 0 ? (totals.inputTokens / totals.totalTokens) * 100 : 0;
  const outputShare = totals.totalTokens > 0 ? (totals.outputTokens / totals.totalTokens) * 100 : 0;
  const cacheReadShare = totals.totalTokens > 0 ? (totals.cacheReadTokens / totals.totalTokens) * 100 : 0;
  const cacheCreateShare = totals.totalTokens > 0 ? (totals.cacheCreationTokens / totals.totalTokens) * 100 : 0;

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div id="metrics-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-6 mt-6">
      
      {/* Spend Card */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-5 group hover:border-indigo-500/60 hover:shadow-md transition-all duration-300 shadow-sm"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full filter blur-xl group-hover:bg-indigo-100 transition-all" />
        <div className="flex items-center justify-between relative z-10">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">预估消费金额</span>
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 border border-indigo-100">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-4 relative z-10">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-display font-bold text-slate-950">${totals.totalCost.toFixed(2)}</span>
            <span className="text-xs font-semibold text-slate-500">USD</span>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md w-max border border-emerald-100">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>本地费率解析</span>
          </div>
        </div>
      </motion.div>

      {/* Total Tokens Card */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-5 group hover:border-indigo-500/60 hover:shadow-md transition-all duration-300 shadow-sm"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full filter blur-xl group-hover:bg-indigo-100 transition-all" />
        <div className="flex items-center justify-between relative z-10">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">总 Token 消耗量</span>
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 border border-indigo-100">
            <Cpu className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-4 relative z-10">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-display font-bold text-slate-950">
              {formatTokens(totals.totalTokens)}
            </span>
            <span className="text-xs font-semibold text-slate-500">Token</span>
          </div>
          
          {/* Micro Stacked Bar Chart */}
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-3.5 flex">
            <div style={{ width: `${inputShare}%` }} className="h-full bg-violet-400" title={`输入: ${inputShare.toFixed(1)}%`} />
            <div style={{ width: `${outputShare}%` }} className="h-full bg-indigo-400" title={`输出: ${outputShare.toFixed(1)}%`} />
            <div style={{ width: `${cacheReadShare}%` }} className="h-full bg-emerald-400" title={`缓存读取: ${cacheReadShare.toFixed(1)}%`} />
            <div style={{ width: `${cacheCreateShare}%` }} className="h-full bg-amber-400" title={`缓存写入: ${cacheCreateShare.toFixed(1)}%`} />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>输入: {formatTokens(totals.inputTokens)}</span>
            <span>输出: {formatTokens(totals.outputTokens)}</span>
          </div>
        </div>
      </motion.div>

      {/* Cache Hit Efficiency Card */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-5 group hover:border-indigo-500/60 hover:shadow-md transition-all duration-300 shadow-sm"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full filter blur-xl group-hover:bg-emerald-100 transition-all" />
        <div className="flex items-center justify-between relative z-10">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Claude 缓存效率</span>
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-100">
            <Zap className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-4 relative z-10">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-display font-bold text-slate-950">
              {cacheHitRatio.toFixed(1)}%
            </span>
            <span className="text-xs font-semibold text-slate-500">命中率</span>
          </div>
          <p className="text-xs text-slate-600 mt-2 line-clamp-1 font-medium">
            在 {formatTokens(totalInputContext)} 输入上下文中，命中了 {formatTokens(totals.cacheReadTokens)}
          </p>
        </div>
      </motion.div>

      {/* Spend Savings Card */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-5 group hover:border-indigo-500/60 hover:shadow-md transition-all duration-300 shadow-sm"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full filter blur-xl group-hover:bg-amber-100 transition-all" />
        <div className="flex items-center justify-between relative z-10">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">提示词缓存节省金额</span>
          <div className="p-2 bg-amber-50 rounded-lg text-amber-600 border border-amber-100">
            <Target className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-4 relative z-10">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-display font-bold text-slate-950">
              +${usdSaved.toFixed(2)}
            </span>
            <span className="text-xs font-semibold text-slate-500">已节省</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-2 font-mono flex items-center justify-between">
            <span>检测到 {activeAgentCount} 个代理</span>
            <span>写入: {formatTokens(totals.cacheCreationTokens)}</span>
          </div>
        </div>
      </motion.div>

    </div>
  );
}
