import { fetchDiagnostics, fetchAuditLogs } from "./actions";

export default async function DiagnosticsPage() {
  const diagnostics = await fetchDiagnostics();
  const auditData = await fetchAuditLogs();

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">System Diagnostics</h1>
      
      <section className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">API Status</h2>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${diagnostics.status === "up" ? "bg-green-500" : "bg-red-500"}`}></div>
          <span className="text-gray-700 capitalize">{diagnostics.status}</span>
        </div>
        {diagnostics.error && (
          <p className="mt-2 text-sm text-red-600">{diagnostics.error}</p>
        )}
      </section>

      <section className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Recent Audit Logs</h2>
        {auditData.error ? (
          <p className="text-sm text-red-600">{auditData.error}</p>
        ) : auditData.logs.length === 0 ? (
          <p className="text-sm text-gray-500">No recent logs found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">User ID</th>
                  <th className="px-4 py-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {auditData.logs.map((log: any) => (
                  <tr key={log.id} className="border-b">
                    <td className="px-4 py-3">{log.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{log.action}</td>
                    <td className="px-4 py-3 text-gray-500">{log.userId}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
