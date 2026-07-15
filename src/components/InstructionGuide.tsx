import React, { useState } from "react";
import { Terminal, Shield, Copy, Check, Server, FileText, Settings } from "lucide-react";
import { motion } from "motion/react";

export default function InstructionGuide() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const commands = [
    {
      title: "分析每日消耗",
      desc: "按日期对 Token 使用量和总预估开销进行分组",
      code: "npx ccusage daily"
    },
    {
      title: "查看 Claude Code 计费周期",
      desc: "在滚动 5 小时的计费框架中分析 Claude Code 会话",
      code: "npx ccusage blocks"
    },
    {
      title: "输出为结构化 JSON",
      desc: "导出数据以供自定义脚本或可视化仪表盘使用",
      code: "npx ccusage daily --json"
    },
    {
      title: "精简终端状态行",
      desc: "精简的状态行，可嵌入至您的 Shell 或终端提示符中",
      code: "npx ccusage statusline"
    }
  ];

  const handleCopy = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div id="instruction-guide" className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-6 pb-12">
      
      {/* Terminal Command Playground */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:col-span-3 space-y-4 shadow-sm">
        <h3 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
          <Terminal className="w-5 h-5 text-indigo-600" />
          <span>命令行实用工具速查</span>
        </h3>
        <p className="text-xs text-slate-600 font-medium">
          在您的 AI 编码工具活跃的终端或代码目录中，直接运行以下命令。无需全局安装：
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {commands.map((cmd, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col justify-between hover:border-slate-300 transition-colors shadow-sm">
              <div>
                <h4 className="text-xs font-bold text-slate-800">{cmd.title}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{cmd.desc}</p>
              </div>
              <div className="flex items-center justify-between bg-white border border-slate-200 px-3 py-2 rounded-lg mt-3 font-mono text-[11px] text-indigo-700 font-bold shadow-sm">
                <span className="truncate mr-2">{cmd.code}</span>
                <button
                  onClick={() => handleCopy(cmd.code, idx)}
                  className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded transition-colors"
                  title="复制命令"
                >
                  {copiedIndex === idx ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
