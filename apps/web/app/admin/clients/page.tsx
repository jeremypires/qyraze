import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

function orgName(value: unknown): string {
  if (Array.isArray(value)) return (value[0] as { name?: string } | undefined)?.name ?? '—';
  if (value && typeof value === 'object' && 'name' in value) {
    return String((value as { name?: string }).name ?? '—');
  }
  return '—';
}

export default async function ClientsPage() {
  const supabase = createAdminClient();
  const { data: clients } = await supabase
    .from('clients')
    .select('id, status, qualification_threshold, organizations(name, slug), created_at')
    .order('created_at', { ascending: false });

  return (
    <main style={{ padding: 32, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Clients</h1>
      <p><a href="/">← Admin home</a></p>
      <table cellPadding={8} style={{ borderCollapse: 'collapse', width: '100%', marginTop: 16 }}>
        <thead>
          <tr>
            <th align="left">Organization</th>
            <th align="left">Status</th>
            <th align="left">Threshold</th>
            <th align="left">Created</th>
          </tr>
        </thead>
        <tbody>
          {(clients ?? []).map((client) => (
            <tr key={client.id} style={{ borderTop: '1px solid #eee' }}>
              <td>{orgName(client.organizations)}</td>
              <td>{client.status}</td>
              <td>{client.qualification_threshold}</td>
              <td>{new Date(client.created_at as string).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!clients?.length && <p>No clients yet.</p>}
    </main>
  );
}
