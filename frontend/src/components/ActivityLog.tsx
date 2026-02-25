export interface ActivityEvent {
  id: string;
  type: string;
  message: string;
  timestamp: string;
}

interface ActivityLogProps {
  events: ActivityEvent[];
}

export default function ActivityLog({ events }: ActivityLogProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-64 overflow-hidden">
      <div className="p-4 border-b border-gray-50 bg-gray-50/50">
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Activity Log</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {events.length === 0 ? (
          <p className="text-gray-400 text-xs italic text-center py-8">No recent activity.</p>
        ) : (
          [...events].reverse().map((event) => (
            <div key={event.id} className="flex flex-col space-y-1 animate-in fade-in slide-in-from-left-2 duration-300">
              <div className="flex justify-between items-center">
                <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${
                  event.type === 'participant_joined' ? 'bg-green-100 text-green-700' : 
                  event.type === 'match_reported' ? 'bg-blue-100 text-blue-700' : 
                  'bg-gray-100 text-gray-700'
                }`}>
                  {event.type.replace('_', ' ')}
                </span>
                <span className="text-[9px] font-bold text-gray-400">
                  {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-gray-700 font-medium">{event.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
