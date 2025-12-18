export interface CustomerDraft {
  ID: string;
  Cliente: string;
  Contexto: string;
  DraftMessage: string;
  FinalMessage?: string;
  Status: 'PENDING' | 'APPROVED' | 'REJECTED';
  ProcessedAt?: string; // ISO String for history date
  Data?: string;
  SatisfactionScore?: number; // 1-5, optional
  TelegramChatID?: string;
  CSAT?: number;
}

export interface ProcessDraftPayload {
  id: string;
  action: 'APPROVE' | 'REJECT';
  finalMessage?: string;
}