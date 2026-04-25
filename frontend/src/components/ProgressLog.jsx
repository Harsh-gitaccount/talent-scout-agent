import React, { useEffect, useRef } from 'react';

/**
 * Live progress log component that displays SSE status messages.
 * Styled like a terminal for the "AI agent working" effect.
 * @param {Object} props
 * @param {Array<{message: string, timestamp: number}>} props.logs - Log entries
 * @param {boolean} props.isActive - Whether analysis is in progress
 */
export default function ProgressLog({ logs = [], isActive = false }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  if (logs.length === 0 && !isActive) return null;

  return (
    <div className="bg-gray-950 border border-gray-800 rounded-xl shadow-lg overflow-hidden animate-fade-in">
      <div className="px-4 py-2.5 border-b border-gray-800 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <span className="text-xs text-gray-400 font-mono ml-2">agent-pipeline</span>
        {isActive && (
          <span className="ml-auto flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-subtle" />
            <span className="text-xs text-green-400 font-mono">running</span>
          </span>
        )}
      </div>

      <div
        ref={scrollRef}
        className="p-4 max-h-80 overflow-y-auto progress-log"
      >
        {logs.map((log, i) => (
          <div key={i} className="flex items-start gap-2 mb-1 animate-fade-in">
            <span className="text-gray-600 text-xs shrink-0 font-mono w-20">
              {new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false })}
            </span>
            <span className="text-gray-300 text-sm">{log.message}</span>
          </div>
        ))}
        {isActive && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-gray-600 text-xs font-mono w-20">
              {new Date().toLocaleTimeString('en-US', { hour12: false })}
            </span>
            <span className="text-indigo-400 text-sm animate-pulse-subtle">Processing...</span>
          </div>
        )}
      </div>
    </div>
  );
}
