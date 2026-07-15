import express from "express";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const execPromise = promisify(exec);
const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Helper to run ccusage
async function runCCUsage(subcommand: string, extraArgs: string[] = []): Promise<any> {
  // Always output in JSON format
  const cmd = `npx -y ccusage ${subcommand} ${extraArgs.join(" ")} --json`;
  try {
    const { stdout } = await execPromise(cmd, { timeout: 15000 });
    return JSON.parse(stdout);
  } catch (error: any) {
    console.error(`Error executing ccusage ${subcommand}:`, error);
    // Return empty state or propogate error
    return {
      error: error.message,
      [subcommand]: [],
      totals: {
        cacheCreationTokens: 0,
        cacheReadTokens: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalCost: 0,
        totalTokens: 0
      }
    };
  }
}

// Generate realistic mock data for 30 days across multiple agents
function getMockDailyData() {
  const agents = ["Claude Code", "GitHub Copilot", "Gemini CLI", "Goose", "Codex"];
  const daily: any[] = [];
  const now = new Date();
  
  // Pricing parameters (rough estimates in USD per million tokens)
  const pricing: Record<string, { input: number; output: number; cacheRead?: number; cacheWrite?: number }> = {
    "Claude Code": { input: 3.0, output: 15.0, cacheRead: 0.3, cacheWrite: 3.75 },
    "GitHub Copilot": { input: 2.0, output: 10.0 },
    "Gemini CLI": { input: 0.075, output: 0.3 },
    "Goose": { input: 2.5, output: 10.0 },
    "Codex": { input: 1.5, output: 5.0 }
  };

  let totals = {
    cacheCreationTokens: 0,
    cacheReadTokens: 0,
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    totalCost: 0
  };

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split("T")[0];
    
    // Random activity factor based on day of week (lower on weekends)
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const activityMultiplier = isWeekend ? 0.15 : (0.7 + Math.random() * 0.6);
    
    let dayInput = 0;
    let dayOutput = 0;
    let dayCacheRead = 0;
    let dayCacheWrite = 0;
    let dayCost = 0;
    
    const dayAgents: Record<string, any> = {};

    agents.forEach(agent => {
      // Each agent has a chance to be active
      const agentProbability = agent === "Claude Code" ? 0.8 : (agent === "GitHub Copilot" ? 0.75 : 0.4);
      if (Math.random() > agentProbability && !isWeekend) return;
      
      const agentInput = Math.round((20000 + Math.random() * 80000) * activityMultiplier);
      const agentOutput = Math.round((4000 + Math.random() * 16000) * activityMultiplier);
      
      let agentCacheRead = 0;
      let agentCacheWrite = 0;
      
      if (agent === "Claude Code") {
        // Claude 3.5 Sonnet cache heavy
        agentCacheRead = Math.round(agentInput * (1.5 + Math.random() * 2));
        agentCacheWrite = Math.round(agentInput * (0.3 + Math.random() * 0.4));
      }

      const p = pricing[agent];
      const agentCost = (agentInput * p.input + agentOutput * p.output + 
                         (agentCacheRead * (p.cacheRead || 0)) + 
                         (agentCacheWrite * (p.cacheWrite || 0))) / 1000000;
      
      dayInput += agentInput;
      dayOutput += agentOutput;
      dayCacheRead += agentCacheRead;
      dayCacheWrite += agentCacheWrite;
      dayCost += agentCost;

      dayAgents[agent] = {
        inputTokens: agentInput,
        outputTokens: agentOutput,
        cacheReadTokens: agentCacheRead,
        cacheCreationTokens: agentCacheWrite,
        totalTokens: agentInput + agentOutput + agentCacheRead + agentCacheWrite,
        totalCost: Number(agentCost.toFixed(4))
      };
    });

    if (dayInput > 0) {
      const dayTotalTokens = dayInput + dayOutput + dayCacheRead + dayCacheWrite;
      daily.push({
        date: dateStr,
        inputTokens: dayInput,
        outputTokens: dayOutput,
        cacheReadTokens: dayCacheRead,
        cacheCreationTokens: dayCacheWrite,
        totalTokens: dayTotalTokens,
        totalCost: Number(dayCost.toFixed(3)),
        agents: dayAgents
      });

      totals.inputTokens += dayInput;
      totals.outputTokens += dayOutput;
      totals.cacheReadTokens += dayCacheRead;
      totals.cacheCreationTokens += dayCacheWrite;
      totals.totalTokens += dayTotalTokens;
      totals.totalCost += dayCost;
    }
  }

  return {
    daily,
    totals: {
      inputTokens: totals.inputTokens,
      outputTokens: totals.outputTokens,
      cacheReadTokens: totals.cacheReadTokens,
      cacheCreationTokens: totals.cacheCreationTokens,
      totalTokens: totals.totalTokens,
      totalCost: Number(totals.totalCost.toFixed(2))
    }
  };
}

function getMockWeeklyData() {
  const dailyData = getMockDailyData();
  const weekly: any[] = [];
  
  // Group daily by 7-day windows or calendar weeks
  const chunks = [];
  const list = [...dailyData.daily];
  while (list.length > 0) {
    chunks.push(list.splice(0, 7));
  }

  let totals = {
    cacheCreationTokens: 0,
    cacheReadTokens: 0,
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    totalCost: 0
  };

  chunks.forEach((chunk, idx) => {
    const startDate = chunk[0].date;
    const endDate = chunk[chunk.length - 1].date;
    
    let weekInput = 0;
    let weekOutput = 0;
    let weekCacheRead = 0;
    let weekCacheWrite = 0;
    let weekCost = 0;
    const weekAgents: Record<string, any> = {};

    chunk.forEach(day => {
      weekInput += day.inputTokens;
      weekOutput += day.outputTokens;
      weekCacheRead += day.cacheReadTokens;
      weekCacheWrite += day.cacheCreationTokens;
      weekCost += day.totalCost;

      Object.entries(day.agents).forEach(([agent, metrics]: [string, any]) => {
        if (!weekAgents[agent]) {
          weekAgents[agent] = {
            inputTokens: 0,
            outputTokens: 0,
            cacheReadTokens: 0,
            cacheCreationTokens: 0,
            totalTokens: 0,
            totalCost: 0
          };
        }
        weekAgents[agent].inputTokens += metrics.inputTokens;
        weekAgents[agent].outputTokens += metrics.outputTokens;
        weekAgents[agent].cacheReadTokens += metrics.cacheReadTokens;
        weekAgents[agent].cacheCreationTokens += metrics.cacheCreationTokens;
        weekAgents[agent].totalTokens += metrics.totalTokens;
        weekAgents[agent].totalCost += metrics.totalCost;
      });
    });

    weekly.push({
      week: `W${idx + 1} (${startDate} to ${endDate})`,
      inputTokens: weekInput,
      outputTokens: weekOutput,
      cacheReadTokens: weekCacheRead,
      cacheCreationTokens: weekCacheWrite,
      totalTokens: weekInput + weekOutput + weekCacheRead + weekCacheWrite,
      totalCost: Number(weekCost.toFixed(2)),
      agents: weekAgents
    });

    totals.inputTokens += weekInput;
    totals.outputTokens += weekOutput;
    totals.cacheReadTokens += weekCacheRead;
    totals.cacheCreationTokens += weekCacheWrite;
    totals.totalTokens += weekInput + weekOutput + weekCacheRead + weekCacheWrite;
    totals.totalCost += weekCost;
  });

  return {
    weekly,
    totals: {
      inputTokens: totals.inputTokens,
      outputTokens: totals.outputTokens,
      cacheReadTokens: totals.cacheReadTokens,
      cacheCreationTokens: totals.cacheCreationTokens,
      totalTokens: totals.totalTokens,
      totalCost: Number(totals.totalCost.toFixed(2))
    }
  };
}

function getMockMonthlyData() {
  const dailyData = getMockDailyData();
  const monthly: any[] = [];
  
  // Simple month-grouping
  let monthInput = 0;
  let monthOutput = 0;
  let monthCacheRead = 0;
  let monthCacheWrite = 0;
  let monthCost = 0;
  const monthAgents: Record<string, any> = {};

  dailyData.daily.forEach(day => {
    monthInput += day.inputTokens;
    monthOutput += day.outputTokens;
    monthCacheRead += day.cacheReadTokens;
    monthCacheWrite += day.cacheCreationTokens;
    monthCost += day.totalCost;

    Object.entries(day.agents).forEach(([agent, metrics]: [string, any]) => {
      if (!monthAgents[agent]) {
        monthAgents[agent] = {
          inputTokens: 0,
          outputTokens: 0,
          cacheReadTokens: 0,
          cacheCreationTokens: 0,
          totalTokens: 0,
          totalCost: 0
        };
      }
      monthAgents[agent].inputTokens += metrics.inputTokens;
      monthAgents[agent].outputTokens += metrics.outputTokens;
      monthAgents[agent].cacheReadTokens += metrics.cacheReadTokens;
      monthAgents[agent].cacheCreationTokens += metrics.cacheCreationTokens;
      monthAgents[agent].totalTokens += metrics.totalTokens;
      monthAgents[agent].totalCost += metrics.totalCost;
    });
  });

  monthly.push({
    month: "July 2026",
    inputTokens: monthInput,
    outputTokens: monthOutput,
    cacheReadTokens: monthCacheRead,
    cacheCreationTokens: monthCacheWrite,
    totalTokens: monthInput + monthOutput + monthCacheRead + monthCacheWrite,
    totalCost: Number(monthCost.toFixed(2)),
    agents: monthAgents
  });

  return {
    monthly,
    totals: {
      inputTokens: monthInput,
      outputTokens: monthOutput,
      cacheReadTokens: monthCacheRead,
      cacheCreationTokens: monthCacheWrite,
      totalTokens: monthInput + monthOutput + monthCacheRead + monthCacheWrite,
      totalCost: Number(monthCost.toFixed(2))
    }
  };
}

function getMockSessionData() {
  const session: any[] = [];
  const agents = ["Claude Code", "GitHub Copilot", "Gemini CLI"];
  const now = new Date();

  let totals = {
    cacheCreationTokens: 0,
    cacheReadTokens: 0,
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    totalCost: 0
  };

  // Generate 15 sample sessions
  for (let i = 0; i < 15; i++) {
    const agent = agents[i % agents.length];
    const durationMins = Math.round(15 + Math.random() * 120);
    const date = new Date(now.getTime() - i * 4 * 60 * 60 * 1000); // sessions spread out
    
    const input = Math.round(5000 + Math.random() * 30000);
    const output = Math.round(1000 + Math.random() * 6000);
    let cacheRead = 0;
    let cacheWrite = 0;
    let cost = 0;

    if (agent === "Claude Code") {
      cacheRead = Math.round(input * 1.8);
      cacheWrite = Math.round(input * 0.4);
      cost = (input * 3.0 + output * 15.0 + cacheRead * 0.3 + cacheWrite * 3.75) / 1000000;
    } else if (agent === "GitHub Copilot") {
      cost = (input * 2.0 + output * 10.0) / 1000000;
    } else {
      cost = (input * 0.075 + output * 0.3) / 1000000;
    }

    session.push({
      sessionId: `sess-${1000 + i}`,
      agent,
      timestamp: date.toISOString(),
      durationMinutes: durationMins,
      inputTokens: input,
      outputTokens: output,
      cacheReadTokens: cacheRead,
      cacheCreationTokens: cacheWrite,
      totalTokens: input + output + cacheRead + cacheWrite,
      totalCost: Number(cost.toFixed(4))
    });

    totals.inputTokens += input;
    totals.outputTokens += output;
    totals.cacheReadTokens += cacheRead;
    totals.cacheCreationTokens += cacheWrite;
    totals.totalTokens += input + output + cacheRead + cacheWrite;
    totals.totalCost += cost;
  }

  return {
    session,
    totals: {
      inputTokens: totals.inputTokens,
      outputTokens: totals.outputTokens,
      cacheReadTokens: totals.cacheReadTokens,
      cacheCreationTokens: totals.cacheCreationTokens,
      totalTokens: totals.totalTokens,
      totalCost: Number(totals.totalCost.toFixed(2))
    }
  };
}

function getMockBlocksData() {
  // Claude Code specific billing blocks (usually 5-hour windows)
  const blocks: any[] = [];
  const now = new Date();
  
  for (let i = 0; i < 6; i++) {
    const date = new Date(now.getTime() - i * 5 * 60 * 60 * 1000);
    const input = Math.round(40000 + Math.random() * 60000);
    const output = Math.round(8000 + Math.random() * 12000);
    const cacheRead = Math.round(input * 2.2);
    const cacheWrite = Math.round(input * 0.35);
    const cost = (input * 3.0 + output * 15.0 + cacheRead * 0.3 + cacheWrite * 3.75) / 1000000;

    blocks.push({
      blockId: `block-${100 + i}`,
      startTime: date.toISOString(),
      endTime: new Date(date.getTime() + 5 * 60 * 60 * 1000).toISOString(),
      inputTokens: input,
      outputTokens: output,
      cacheReadTokens: cacheRead,
      cacheCreationTokens: cacheWrite,
      totalTokens: input + output + cacheRead + cacheWrite,
      totalCost: Number(cost.toFixed(2))
    });
  }

  return {
    blocks,
    totals: {
      inputTokens: blocks.reduce((acc, b) => acc + b.inputTokens, 0),
      outputTokens: blocks.reduce((acc, b) => acc + b.outputTokens, 0),
      cacheReadTokens: blocks.reduce((acc, b) => acc + b.cacheReadTokens, 0),
      cacheCreationTokens: blocks.reduce((acc, b) => acc + b.cacheCreationTokens, 0),
      totalTokens: blocks.reduce((acc, b) => acc + b.totalTokens, 0),
      totalCost: Number(blocks.reduce((acc, b) => acc + b.totalCost, 0).toFixed(2))
    }
  };
}

// REST API Endpoints
app.get("/api/usage/mock/:type", (req, res) => {
  const { type } = req.params;
  try {
    if (type === "daily") {
      return res.json(getMockDailyData());
    } else if (type === "weekly") {
      return res.json(getMockWeeklyData());
    } else if (type === "monthly") {
      return res.json(getMockMonthlyData());
    } else if (type === "session") {
      return res.json(getMockSessionData());
    } else if (type === "blocks") {
      return res.json(getMockBlocksData());
    } else {
      return res.status(400).json({ error: "Invalid mock type requested" });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/api/usage/local/:type", async (req, res) => {
  const { type } = req.params;
  const since = req.query.since as string;
  const until = req.query.until as string;
  const byAgent = req.query.byAgent === "true" || req.query.byAgent === undefined;

  const extraArgs: string[] = [];
  if (since) extraArgs.push("--since", since);
  if (until) extraArgs.push("--until", until);
  if (byAgent && (type === "daily" || type === "weekly" || type === "monthly" || type === "session")) {
    extraArgs.push("--by-agent");
  }

  try {
    if (["daily", "weekly", "monthly", "session", "blocks"].includes(type)) {
      const result = await runCCUsage(type, extraArgs);
      return res.json(result);
    } else {
      return res.status(400).json({ error: "Invalid usage type requested" });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Endpoint to run any custom check or configuration check
app.get("/api/ccusage/status", async (req, res) => {
  try {
    const { stdout } = await execPromise("npx -y ccusage --version", { timeout: 5000 });
    return res.json({
      installed: true,
      version: stdout.trim(),
      env: {
        platform: process.platform,
        node: process.version
      }
    });
  } catch (error: any) {
    return res.json({
      installed: false,
      error: error.message
    });
  }
});

// Serve UI static files
startServer();

async function startServer() {
  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
