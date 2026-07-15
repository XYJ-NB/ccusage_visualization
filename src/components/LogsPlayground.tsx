import React, { useState } from "react";
import { FileCode2, Play, AlertCircle, CheckCircle, Info, Sparkles } from "lucide-react";
import { motion } from "motion/react";

interface LogsPlaygroundProps {
  onImportData: (data: any, type: "daily" | "weekly" | "monthly" | "session" | "blocks") => void;
}

export default function LogsPlayground({ onImportData }: LogsPlaygroundProps) {
  const [jsonInput, setJsonInput] = useState("");
  const [dataType, setDataType] = useState<"daily" | "weekly" | "monthly" | "session" | "blocks">("daily");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const sampleTemplates = {
    daily: `{
  "daily": [
    {
      "date": "2026-07-10",
      "inputTokens": 125000,
      "outputTokens": 24000,
      "cacheReadTokens": 180000,
      "cacheCreationTokens": 45000,
      "totalTokens": 374000,
      "totalCost": 1.25,
      "agents": {
        "Claude Code": { "inputTokens": 125000, "outputTokens": 24000, "cacheReadTokens": 180000, "cacheCreationTokens": 45000, "totalTokens": 374000, "totalCost": 1.25 }
      }
    },
    {
      "date": "2026-07-11",
      "inputTokens": 95000,
      "outputTokens": 18500,
      "cacheReadTokens": 120000,
      "cacheCreationTokens": 32000,
      "totalTokens": 265500,
      "totalCost": 0.88,
      "agents": {
        "Claude Code": { "inputTokens": 95000, "outputTokens": 18500, "cacheReadTokens": 120000, "cacheCreationTokens": 32000, "totalTokens": 265500, "totalCost": 0.88 }
      }
    }
  ],
  "totals": {
    "inputTokens": 220000,
    "outputTokens": 42500,
    "cacheReadTokens": 300000,
    "cacheCreationTokens": 77000,
    "totalTokens": 639500,
    "totalCost": 2.13
  }
}`,
    session: `{
  "session": [
    {
      "sessionId": "custom-sess-01",
      "agent": "Claude Code",
      "timestamp": "2026-07-14T10:00:00.000Z",
      "durationMinutes": 45,
      "inputTokens": 45000,
      "outputTokens": 12000,
      "cacheReadTokens": 80000,
      "cacheCreationTokens": 15000,
      "totalTokens": 152000,
      "totalCost": 0.52
    }
  ],
  "totals": {
    "inputTokens": 45000,
    "outputTokens": 12000,
    "cacheReadTokens": 80000,
    "cacheCreationTokens": 15000,
    "totalTokens": 152000,
    "totalCost": 0.52
  }
}`,
    blocks: `{
  "blocks": [
    {
      "blockId": "custom-block-1",
      "startTime": "2026-07-14T09:00:00.000Z",
      "endTime": "2026-07-14T14:00:00.000Z",
      "inputTokens": 85000,
      "outputTokens": 22000,
      "cacheReadTokens": 190000,
      "cacheCreationTokens": 28000,
      "totalTokens": 325000,
      "totalCost": 1.12
    }
  ],
  "totals": {
    "inputTokens": 85000,
    "outputTokens": 22000,
    "cacheReadTokens": 190000,
    "cacheCreationTokens": 28000,
    "totalTokens": 325000,
    "totalCost": 1.12
  }
}`
  };

  const handleLoadTemplate = () => {
    const template = sampleTemplates[dataType as keyof typeof sampleTemplates] || sampleTemplates.daily;
    setJsonInput(template);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleParse = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!jsonInput.trim()) {
      setErrorMsg("输入内容不能为空。请在本地终端运行 'npx ccusage daily --json' 并在此粘贴输出。");
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      
      // Perform basic schema validation based on selected type
      if (dataType === "daily" && !parsed.daily) {
        throw new Error("JSON 中缺少 'daily' 数组。请确保您粘贴的是来自 ccusage daily 的输出。");
      }
      if (dataType === "weekly" && !parsed.weekly) {
        throw new Error("JSON 中缺少 'weekly' 数组。请确保您粘贴的是来自 ccusage weekly 的输出。");
      }
      if (dataType === "monthly" && !parsed.monthly) {
        throw new Error("JSON 中缺少 'monthly' 数组。请确保您粘贴的是来自 ccusage monthly 的输出。");
      }
      if (dataType === "session" && !parsed.session) {
        throw new Error("JSON 中缺少 'session' 数组。请确保您粘贴的是来自 ccusage session 的输出。");
      }
      if (dataType === "blocks" && !parsed.blocks) {
        throw new Error("JSON 中缺少 'blocks' 数组。请确保您粘贴的是来自 ccusage blocks 的输出。");
      }

      if (!parsed.totals) {
        parsed.totals = {
          inputTokens: 0,
          outputTokens: 0,
          cacheReadTokens: 0,
          cacheCreationTokens: 0,
          totalTokens: 0,
          totalCost: 0
        };
      }

      onImportData(parsed, dataType);
      const dataLabel = dataType === "daily" ? "日消耗" : dataType === "weekly" ? "周消耗" : dataType === "monthly" ? "月消耗" : dataType === "session" ? "活跃会话" : "计费块";
      setSuccessMsg(`成功解析并加载了 ${dataLabel} 数据！图表仪表盘已同步更新！`);
    } catch (err: any) {
      setErrorMsg(`JSON 解析失败: ${err.message}`);
    }
  };

  return (
    <div id="logs-playground" className="bg-white border border-slate-200 rounded-2xl p-6 m-6 grid grid-cols-1 lg:grid-cols-3 gap-6 shadow-sm">
      
      {/* Description Panel */}
      <div className="space-y-4 lg:col-span-1">
        <h3 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
          <FileCode2 className="w-5 h-5 text-indigo-600" />
          <span>导入并可视化 JSON 数据</span>
        </h3>
        
        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          正在本地系统上运行 ccusage？在此直接粘贴其导出的 JSON 终端输出，便可将您真实的编码消耗数据导入并在当前的 UI 仪表盘中进行可视化分析！
        </p>

        <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-2 text-xs shadow-sm">
          <div className="flex items-center gap-1.5 text-indigo-600 font-bold mb-1">
            <Info className="w-4 h-4" />
            <span>如何从本地导出数据：</span>
          </div>
          <p className="text-slate-800 font-mono text-[10px] bg-slate-100 p-2 rounded-lg border border-slate-200 select-all font-semibold">
            npx ccusage daily --by-agent --json
          </p>
          <p className="text-slate-500 text-[10px] font-medium leading-relaxed">
            在项目目录运行此命令，复制终端中输出的完整 JSON 代码块，选择下方的 <strong>日消耗</strong> 按钮，然后点击 <strong>解析并可视化</strong>。
          </p>
        </div>

        {/* Load template buttons */}
        <div className="pt-2">
          <button
            onClick={handleLoadTemplate}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>加载内置 JSON 模板</span>
          </button>
        </div>
      </div>

      {/* Editor & Actions */}
      <div className="lg:col-span-2 space-y-4">
        {/* Type select */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-semibold text-slate-500">数据类型:</span>
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 border border-slate-200 p-1 rounded-xl">
            {(["daily", "weekly", "monthly", "session", "blocks"] as const).map((type) => {
              const labelMap = {
                daily: "日消耗",
                weekly: "周消耗",
                monthly: "月消耗",
                session: "活跃会话",
                blocks: "计费周期块"
              };
              return (
                <button
                  key={type}
                  onClick={() => {
                    setDataType(type);
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    dataType === type
                      ? "bg-white text-indigo-600 border border-slate-200 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {labelMap[type]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Text area */}
        <div className="relative">
          <textarea
            value={jsonInput}
            onChange={(e) => {
              setJsonInput(e.target.value);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            placeholder={`在此粘贴您从 ccusage ${dataType} 导出的 JSON 数据...`}
            rows={8}
            className="w-full bg-white border border-slate-200 focus:border-indigo-500 outline-none rounded-xl p-4 font-mono text-xs text-slate-800 placeholder-slate-400 shadow-sm"
          />
        </div>

        {/* Status indicator messages */}
        {errorMsg && (
          <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-xl text-xs font-mono leading-relaxed font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 p-3.5 rounded-xl text-xs font-mono leading-relaxed font-semibold">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Trigger Button */}
        <div className="flex justify-end">
          <button
            onClick={handleParse}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
          >
            <Play className="w-4 h-4" />
            <span>解析并可视化</span>
          </button>
        </div>
      </div>

    </div>
  );
}
