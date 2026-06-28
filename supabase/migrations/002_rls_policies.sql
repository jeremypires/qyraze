-- Qyraze Phase 1 — Row Level Security
-- Phase 1: worker + webhooks use service_role (bypass RLS).
-- Policies prepare Phase 2 dashboard client access via memberships.

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE qualification_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Helper: organizations the current user belongs to
CREATE OR REPLACE FUNCTION auth_user_organization_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM memberships
  WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION auth_user_client_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id
  FROM clients c
  WHERE c.organization_id IN (SELECT auth_user_organization_ids());
$$;

-- organizations
CREATE POLICY "members_read_own_orgs" ON organizations
  FOR SELECT USING (id IN (SELECT auth_user_organization_ids()));

CREATE POLICY "members_manage_own_orgs" ON organizations
  FOR ALL USING (id IN (SELECT auth_user_organization_ids()));

-- memberships
CREATE POLICY "members_read_own_memberships" ON memberships
  FOR SELECT USING (organization_id IN (SELECT auth_user_organization_ids()));

-- clients
CREATE POLICY "members_access_own_clients" ON clients
  FOR ALL USING (organization_id IN (SELECT auth_user_organization_ids()));

-- client_prompts
CREATE POLICY "members_access_own_prompts" ON client_prompts
  FOR ALL USING (client_id IN (SELECT auth_user_client_ids()));

-- meta_connections (no direct client UI in phase 1)
CREATE POLICY "members_access_own_meta" ON meta_connections
  FOR ALL USING (client_id IN (SELECT auth_user_client_ids()));

-- onboarding_responses
CREATE POLICY "members_access_own_onboarding" ON onboarding_responses
  FOR ALL USING (client_id IN (SELECT auth_user_client_ids()));

-- leads
CREATE POLICY "members_access_own_leads" ON leads
  FOR ALL USING (client_id IN (SELECT auth_user_client_ids()));

-- conversations
CREATE POLICY "members_access_own_conversations" ON conversations
  FOR ALL USING (client_id IN (SELECT auth_user_client_ids()));

-- messages
CREATE POLICY "members_access_own_messages" ON messages
  FOR ALL USING (client_id IN (SELECT auth_user_client_ids()));

-- qualification_events
CREATE POLICY "members_access_own_qualification" ON qualification_events
  FOR ALL USING (client_id IN (SELECT auth_user_client_ids()));

-- notifications
CREATE POLICY "members_access_own_notifications" ON notifications
  FOR ALL USING (client_id IN (SELECT auth_user_client_ids()));

-- plans (public read for future checkout)
CREATE POLICY "authenticated_read_plans" ON plans
  FOR SELECT TO authenticated USING (active = true);

-- subscriptions
CREATE POLICY "members_access_own_subscriptions" ON subscriptions
  FOR ALL USING (organization_id IN (SELECT auth_user_organization_ids()));
