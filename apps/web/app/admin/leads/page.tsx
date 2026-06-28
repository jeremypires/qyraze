import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

function nestedOrgName(value: unknown): string {
  if (Array.isArray(value)) {
    const org = (value[0] as { organizations?: unknown } | undefined)?.organizations;
    return orgName(org);
  }
  if (value && typeof value === 'object' && 'organizations' in value) {
    return orgName((value as { organizations?: unknown }).organizations);
  }
  return '—';
}

function orgName(value: unknown): string {
  if (Array.isArray(value)) return (value[0] as { name?: string } | undefined)?.name ?? '—';
  if (value && typeof value === 'object' && 'name' in value) {
    return String((value as { name?: string }).name ?? '—');
  }
  return '—';
}

export default async function LeadsPage() {
  const supabase = createAdminClient();
  const { data: leads } = await supabase
    .from('leads')
    .select('id, name, username, status, score, platform, created_at, clients(organizations(name))')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <main style={{ padding: 32, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Leads</h1>
      <p><a href="/">← Admin home</a></p>
      <table cellPadding={8} style={{ borderCollapse: 'collapse', width: '100%', marginTop: 16 }}>
        <thead>
          <tr>
            <th align="left">Name</th>
            <th align="left">Username</th>
            <th align="left">Client</th>
            <th align="left">Status</th>
            <th align="left">Score</th>
          </tr>
        </thead>
        <tbody>
          {(leads ?? []).map((lead) => (
            <tr key={lead.id} style={{ borderTop: '1px solid #eee' }}>
              <td>{lead.name ?? '—'}</td>
              <td>{lead.username ? `@${lead.username}` : '—'}</td>
              <td>{nestedOrgName(lead.clients)}</td>
              <td>{lead.status}</td>
              <td>{lead.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!leads?.length && <p>No leads yet.</p>}
    </main>
  );
}
