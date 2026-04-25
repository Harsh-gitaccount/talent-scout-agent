import React, { useState, useMemo } from 'react';
import ScoreBar from './ScoreBar.jsx';

/**
 * Results table component showing ranked candidates with scores.
 * Supports sorting and CSV/PDF export.
 * @param {Object} props
 * @param {Array<Object>} props.results - Ranked candidate results
 * @param {Function} props.onViewDetails - Callback when "View Details" is clicked
 */
export default function ResultsTable({ results = [], onViewDetails }) {
  const [sortKey, setSortKey] = useState('rank');
  const [sortAsc, setSortAsc] = useState(true);

  const sorted = useMemo(() => {
    return [...results].sort((a, b) => {
      const aVal = a[sortKey] ?? 0;
      const bVal = b[sortKey] ?? 0;
      if (typeof aVal === 'string') return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return sortAsc ? aVal - bVal : bVal - aVal;
    });
  }, [results, sortKey, sortAsc]);

  const handleSort = (key) => {
    if (sortKey === key) { setSortAsc(!sortAsc); } else { setSortKey(key); setSortAsc(key === 'rank'); }
  };

  const exportCSV = () => {
    const headers = ['Rank', 'Name', 'Role', 'Match Score', 'Interest Score', 'Combined Score', 'Summary'];
    const rows = sorted.map(r => [r.rank, r.name, r.currentRole, r.matchScore, r.interestScore || '-', r.combinedScore, `"${(r.recruiterSummary || '').replace(/"/g, '""')}"`]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'talent-scout-shortlist.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    await import('jspdf-autotable');
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('TalentScout AI — Candidate Shortlist', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

    doc.autoTable({
      startY: 38,
      head: [['#', 'Name', 'Role', 'Match', 'Interest', 'Combined', 'Summary']],
      body: sorted.map(r => [r.rank, r.name, r.currentRole, r.matchScore, r.interestScore || '-', r.combinedScore, (r.recruiterSummary || '').substring(0, 60) + '...']),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 70, 229] },
    });

    doc.save('talent-scout-shortlist.pdf');
  };

  if (results.length === 0) return null;

  const SortHeader = ({ label, keyName, className = '' }) => (
    <th
      className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors select-none ${className}`}
      onClick={() => handleSort(keyName)}
    >
      <span className="flex items-center gap-1">
        {label}
        {sortKey === keyName && <span className="text-indigo-500">{sortAsc ? '↑' : '↓'}</span>}
      </span>
    </th>
  );

  return (
    <div className="card-premium animate-fade-in">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">🏆 Ranked Shortlist</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{results.length} candidates evaluated</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" id="export-csv">
            📄 CSV
          </button>
          <button onClick={exportPDF} className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" id="export-pdf">
            📑 PDF
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full" id="results-table">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <SortHeader label="#" keyName="rank" className="w-12" />
              <SortHeader label="Name" keyName="name" />
              <SortHeader label="Role" keyName="currentRole" />
              <SortHeader label="Match Score" keyName="matchScore" className="w-36" />
              <SortHeader label="Interest Score" keyName="interestScore" className="w-36" />
              <SortHeader label="Combined" keyName="combinedScore" className="w-24" />
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {sorted.map((candidate, i) => (
              <tr key={candidate.id || candidate.candidateId || i}
                className="table-row-premium"
                style={{ animationDelay: `${i * 0.1}s` }}>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold
                    ${candidate.rank === 1 ? 'rank-badge-1' :
                      candidate.rank === 2 ? 'rank-badge-2' :
                      candidate.rank === 3 ? 'rank-badge-3' :
                      'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                    {candidate.rank}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <div className="font-semibold text-sm text-gray-800 dark:text-gray-100">{candidate.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{candidate.location} · {candidate.yearsExperience} YOE</div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{candidate.currentRole}</td>
                <td className="px-4 py-3">
                  <ScoreBar score={candidate.matchScore || 0} color="blue" size="sm" />
                </td>
                <td className="px-4 py-3">
                  <ScoreBar score={candidate.interestScore || 0} color="green" size="sm" />
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xl font-extrabold tracking-tight ${
                    candidate.combinedScore >= 70 ? 'text-emerald-600 dark:text-emerald-400 score-glow-high' :
                    candidate.combinedScore >= 50 ? 'text-blue-600 dark:text-blue-400 score-glow-mid' :
                    'text-gray-400 dark:text-gray-500'
                  }`}>
                    {candidate.combinedScore}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onViewDetails(candidate)}
                    className="btn-view"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
