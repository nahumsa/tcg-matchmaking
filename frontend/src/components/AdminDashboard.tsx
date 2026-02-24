export default function AdminDashboard() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <h1 className="text-3xl font-bold text-blue-600 mb-6">Admin Dashboard</h1>
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Create Tournament</h2>
        <button className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
          Create New Tournament
        </button>
      </div>
    </div>
  );
}
