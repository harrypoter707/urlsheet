
export interface QueueItem {
  id: string;
  url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  guestbookStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  guestbookCount?: number;
  submittedAt?: string;
  error?: string;
}

export interface AutomatorConfig {
  webhookUrl: string;
  batchSize: number;
  intervalMinutes: number;
  sheetName: string;
  guestbookUrls: string[];
  customName: string;
  customEmail: string;
}

export interface Statistics {
  total: number;
  pending: number;
  completed: number;
  failed: number;
  totalGuestbookSubmissions: number;
  totalGuestbookTargets: number;
  startTime?: string;
}
