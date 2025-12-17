export interface CustomerDraft {
  id: string;
  customerName: string;
  contextSummary: string;
  draftMessage: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  processedAt?: string; // ISO String for history date
  satisfactionScore?: number; // 1-5, optional
}

export interface ProcessDraftPayload {
  id: string;
  action: 'APPROVE' | 'REJECT';
  finalMessage?: string;
}