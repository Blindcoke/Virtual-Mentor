'use client';

import { ToolCall } from '@/types';
import { Wrench } from 'lucide-react';

interface ToolCallDisplayProps {
  toolCalls: ToolCall[];
}

export function ToolCallDisplay({ toolCalls }: ToolCallDisplayProps) {
  const formatToolName = (name: string): string => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatKeyName = (key: string): string => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const parseArguments = (argumentsJson: string): Record<string, any> => {
    try {
      return JSON.parse(argumentsJson);
    } catch {
      return {};
    }
  };

  return (
    <div className="mt-3 space-y-2">
      {toolCalls.map((toolCall, index) => {
        const args = parseArguments(toolCall.arguments);

        return (
          <div
            key={index}
            className="border border-yellow-300 dark:border-yellow-600 rounded-lg bg-yellow-50 dark:bg-yellow-950 p-3"
          >
            {/* Tool Title with Wrench Icon */}
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="w-4 h-4 text-yellow-700 dark:text-yellow-400" />
              <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
                {formatToolName(toolCall.name)}
              </h4>
            </div>

            {/* Formatted Description - Key-Value Pairs */}
            <div className="space-y-1">
              {Object.entries(args).map(([key, value]) => {
                if (value !== null && value !== undefined && value !== '') {
                  return (
                    <div key={key} className="text-xs text-yellow-800 dark:text-yellow-200">
                      <span className="font-medium">{formatKeyName(key)}:</span>{' '}
                      <span className="font-normal">{String(value)}</span>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
