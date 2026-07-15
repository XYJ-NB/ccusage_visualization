export interface AgentMetrics {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  totalTokens: number;
  totalCost: number;
}

export interface UsageRow {
  date?: string;
  week?: string;
  month?: string;
  period?: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  totalTokens: number;
  totalCost: number;
  agents?: Record<string, AgentMetrics>;
}

export interface SessionRow {
  sessionId?: string;
  period?: string;
  agent: string;
  timestamp?: string;
  metadata?: {
    lastActivity?: string;
    reasoningOutputTokens?: number;
  };
  durationMinutes?: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  totalTokens: number;
  totalCost: number;
  commands?: string[];
  modelBreakdowns?: Array<{
    modelName: string;
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheCreationTokens: number;
    cost: number;
  }>;
  modelsUsed?: string[];
}

export interface BlockRow {
  blockId: string;
  startTime: string;
  endTime: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  totalTokens: number;
  totalCost: number;
}

export interface Totals {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  totalTokens: number;
  totalCost: number;
}

export interface CCUsageReport {
  daily?: UsageRow[];
  weekly?: UsageRow[];
  monthly?: UsageRow[];
  session?: SessionRow[];
  blocks?: BlockRow[];
  totals: Totals;
  error?: string;
}

export interface CCUsageStatus {
  installed: boolean;
  version?: string;
  error?: string;
  env?: {
    platform: string;
    node: string;
  };
}
