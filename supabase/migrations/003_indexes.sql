-- Qyraze Phase 1 — performance indexes

CREATE INDEX idx_messages_conversation_created
  ON messages (conversation_id, created_at DESC);

CREATE INDEX idx_messages_client_created
  ON messages (client_id, created_at DESC);

CREATE INDEX idx_leads_client_status
  ON leads (client_id, status);

CREATE INDEX idx_leads_client_score
  ON leads (client_id, score DESC);

CREATE INDEX idx_conversations_client
  ON conversations (client_id, last_message_at DESC);

CREATE INDEX idx_meta_connections_page
  ON meta_connections (page_id);

CREATE INDEX idx_meta_connections_ig_user
  ON meta_connections (ig_user_id)
  WHERE ig_user_id IS NOT NULL;

CREATE INDEX idx_qualification_events_lead
  ON qualification_events (lead_id, created_at DESC);

CREATE INDEX idx_notifications_client_sent
  ON notifications (client_id, sent_at DESC);

CREATE INDEX idx_subscriptions_org
  ON subscriptions (organization_id, status);
