export default function AdminHome() {
  return (
    <main style={{ padding: 32, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Qyraze Admin</h1>
      <p>Phase 1 — internal admin for Instagram setter clients.</p>
      <ul>
        <li><a href="/admin/clients">Clients</a></li>
        <li><a href="/admin/leads">Leads</a></li>
      </ul>
    </main>
  );
}
