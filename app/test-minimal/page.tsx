export default function TestMinimalPage() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Minimal Test Page</h1>
      <p>This is a minimal page without any external dependencies.</p>
      <p>Current time: {new Date().toISOString()}</p>
    </div>
  );
}