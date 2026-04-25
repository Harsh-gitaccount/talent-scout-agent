import React from 'react';

/**
 * Weight slider component for adjusting Match/Interest score weighting.
 * @param {Object} props
 * @param {number} props.matchWeight - Current match weight (0-1)
 * @param {Function} props.onChange - Callback when weight changes
 * @param {boolean} [props.disabled=false] - Whether the slider is disabled
 */
export default function WeightSlider({ matchWeight, onChange, disabled = false }) {
  const interestWeight = Math.round((1 - matchWeight) * 100);
  const matchPercent = Math.round(matchWeight * 100);

  return (
    <div className="card-premium p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Score Weighting</h3>
        <span className="text-xs text-gray-400 font-mono">{matchPercent}/{interestWeight}</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-blue-600 dark:text-blue-400 w-16 text-right">
          Match {matchPercent}%
        </span>
        <input
          type="range"
          min="0"
          max="100"
          value={matchPercent}
          onChange={(e) => onChange(Number(e.target.value) / 100)}
          disabled={disabled}
          className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer
            accent-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
          id="weight-slider"
        />
        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 w-20">
          Interest {interestWeight}%
        </span>
      </div>

      <div className="flex justify-between mt-2">
        <div className="h-1.5 rounded-full bg-gradient-to-r from-blue-400 to-blue-600" style={{ width: `${matchPercent * 0.45}%` }} />
        <div className="h-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600" style={{ width: `${interestWeight * 0.45}%` }} />
      </div>
    </div>
  );
}
