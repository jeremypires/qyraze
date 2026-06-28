-- Qyraze Phase 1 — core schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Tenants ────────────────────────────────────────────────────────────────

CREATE TABLE organizations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE memberships (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

-- ── Client config ──────────────────────────────────────────────────────────

CREATE TABLE clients (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  status                  TEXT NOT NULL DEFAULT 'paused'
    CHECK (status IN ('active', 'paused', 'churned')),
  telegram_chat_id        TEXT,
  qualification_threshold INT NOT NULL DEFAULT 70 CHECK (qualification_threshold BETWEEN 0 AND 100),
  settings                JSONB NOT NULL DEFAULT '{"emojis": true, "max_reply_length": 500}'::jsonb,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE client_prompts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  system_prompt TEXT NOT NULL,
  version       INT NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, version)
);

CREATE TABLE meta_connections (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        UUID NOT NULL UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
  platform         TEXT NOT NULL DEFAULT 'instagram' CHECK (platform = 'instagram'),
  page_id          TEXT NOT NULL,
  ig_user_id       TEXT,
  access_token     TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  webhook_verified BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE onboarding_responses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  responses   JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Leads & messaging ────────────────────────────────────────────────────────

CREATE TABLE leads (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  platform         TEXT NOT NULL DEFAULT 'instagram',
  external_user_id TEXT NOT NULL,
  name             TEXT,
  username         TEXT,
  status           TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'qualifying', 'hot', 'handed_off', 'lost')),
  score            INT NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  metadata         JSONB NOT NULL DEFAULT '{}'::jsonb,
  notified_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, platform, external_user_id)
);

CREATE TABLE conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  lead_id         UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  platform        TEXT NOT NULL DEFAULT 'instagram',
  state           TEXT NOT NULL DEFAULT 'active'
    CHECK (state IN ('active', 'waiting_owner', 'closed')),
  last_message_at TIMESTAMPTZ,
  message_count   INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  lead_id         UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  platform        TEXT NOT NULL DEFAULT 'instagram',
  direction       TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  role            TEXT NOT NULL CHECK (role IN ('prospect', 'setter', 'owner')),
  content         TEXT NOT NULL,
  external_id     TEXT,
  ai_model        TEXT,
  tokens_used     INT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (platform, external_id)
);

CREATE TABLE qualification_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  lead_id           UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  signal            TEXT NOT NULL,
  value             BOOLEAN NOT NULL,
  source_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  lead_id   UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  type      TEXT NOT NULL,
  channel   TEXT NOT NULL DEFAULT 'telegram',
  payload   JSONB NOT NULL DEFAULT '{}'::jsonb,
  sent_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Billing ──────────────────────────────────────────────────────────────────

CREATE TABLE plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL UNIQUE,
  amount_cents    INT NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'eur',
  interval        TEXT NOT NULL DEFAULT 'month',
  active          BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE subscriptions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id                UUID NOT NULL REFERENCES plans(id),
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT UNIQUE,
  status                 TEXT NOT NULL DEFAULT 'inactive'
    CHECK (status IN ('inactive', 'active', 'past_due', 'canceled')),
  current_period_end     TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Triggers ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER meta_connections_updated_at
  BEFORE UPDATE ON meta_connections
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Only one active prompt per client
CREATE UNIQUE INDEX idx_client_prompts_active
  ON client_prompts (client_id)
  WHERE is_active = true;
