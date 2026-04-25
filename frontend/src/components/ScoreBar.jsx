import React from 'react';

/**
 * Animated score bar component displaying a score out of 100.
 * @param {Object} props
 * @param {number} props.score - Score value (0-100)
 * @param {string} [props.color='blue'] - Color theme: 'blue', 'green', 'indigo'
 * @param {string} [props.label] - Optional label text
 * @param {boolean} [props.showValue=true] - Whether to show numeric value
 * @param {string} [props.size='md'] - Size: 'sm', 'md', 'lg'
 */
export default function ScoreBar({ score = 0, color = 'blue', label, showValue = true, size = 'md' }) {
  const colorMap = {
    blue: { bg: 'bg-blue-100 dark:bg-blue-950', fill: 'bg-gradient-to-r from-blue-400 to-blue-600', text: 'text-blue-700 dark:text-blue-300' },
    green: { bg: 'bg-emerald-100 dark:bg-emerald-950', fill: 'bg-gradient-to-r from-emerald-400 to-emerald-600', text: 'text-emerald-700 dark:text-emerald-300' },
    indigo: { bg: 'bg-indigo-100 dark:bg-indigo-950', fill: 'bg-gradient-to-r from-indigo-400 to-indigo-600', text: 'text-indigo-700 dark:text-indigo-300' },
  };

  const sizeMap = {
    sm: 'h-2.5',
    md: 'h-3.5',
    lg: 'h-5',
  };

  const colors = colorMap[color] || colorMap.blue;
  const height = sizeMap[size] || sizeMap.md;
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>}
          {showValue && <span className={`text-xs font-bold ${colors.text}`}>{clampedScore}</span>}
        </div>
      )}
      <div className={`w-full ${height} ${colors.bg} rounded-full overflow-hidden`}>
        <div
          className={`${height} ${colors.fill} rounded-full score-bar-fill`}
          style={{ width: `${clampedScore}%` }}
        />
      </div>
    </div>
  );
}
