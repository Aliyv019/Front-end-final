// src/components/MessageBubble.jsx
import React from 'react';

export default function MessageBubble({ message, isOwnMessage, senderName, timestamp }) {
  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[70%] ${isOwnMessage ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded-lg px-4 py-2`}>
        {!isOwnMessage && (
          <div className="text-sm font-semibold text-gray-600 mb-1">
            {senderName}
          </div>
        )}
        <div className="break-words">{message}</div>
        <div className={`text-xs ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'} mt-1`}>
          {new Date(timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}