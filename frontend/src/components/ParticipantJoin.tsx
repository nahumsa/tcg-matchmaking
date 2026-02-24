export default function ParticipantJoin() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <h1 className="text-3xl font-bold text-green-600 mb-6">Join Tournament</h1>
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Enter Tournament Code</h2>
        <input 
          type="text" 
          placeholder="e.g. ABCDEF" 
          className="w-full p-2 border border-gray-300 rounded mb-4 focus:ring-2 focus:ring-green-500 focus:outline-none"
        />
        <button className="w-full py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 transition">
          Join
        </button>
      </div>
    </div>
  );
}
