export type ClientStatus = 'active' | 'paused' | 'churned';
export type LeadStatus = 'new' | 'qualifying' | 'hot' | 'handed_off' | 'lost';
export type ConversationState = 'active' | 'waiting_owner' | 'closed';
export type MessageDirection = 'inbound' | 'outbound';
export type MessageRole = 'prospect' | 'setter' | 'owner';
export type Platform = 'instagram';

export interface QualificationSignals {
  budget_confirmed?: boolean;
  urgency?: boolean;
  wants_call?: boolean;
  interested?: boolean;
}

export interface AIResponse {
  reply: string;
  signals: QualificationSignals;
}

export interface ProcessMessageJob {
  clientId: string;
  conversationId: string;
  leadId: string;
  messageId: string;
  inboundContent: string;
}

export interface NotifyTelegramJob {
  clientId: string;
  leadId: string;
}

export const QUEUE_NAMES = {
  messages: 'messages',
  notifications: 'notifications',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export const SIGNAL_SCORES: Record<keyof QualificationSignals, number> = {
  interested: 15,
  budget_confirmed: 30,
  urgency: 20,
  wants_call: 35,
};

export const DEFAULT_QUALIFICATION_THRESHOLD = 70;
export const MAX_CONVERSATION_HISTORY = 20;

export * from './reply-delay.js';
export * from './demo-personalities.js';
