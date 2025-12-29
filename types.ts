
export interface QueueItem {
  id: string;
  url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  submittedAt?: string;
  error?: string;
}

export interface AutomatorConfig {
  webhookUrl: string;
  batchSize: number;
  intervalMinutes: number;
  sheetName: string;
}

export interface Statistics {
  total: number;
  pending: number;
  completed: number;
  failed: number;
  startTime?: string;
}
