import React from 'react';

/**
 * Displays the parsed JD as a sidebar with tagged skills and metadata.
 * @param {Object} props
 * @param {Object} props.parsedJD - Parsed job description object
 */
export default function ParsedJDPanel({ parsedJD }) {
  if (!parsedJD) return null;

  const Tag = ({ children, color = 'gray' }) => {
    const colorMap = {
      gray: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
      blue: 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300',
      green: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300',
      purple: 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300',
      amber: 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
    };
    return (
      <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${colorMap[color] || colorMap.gray}`}>
        {children}
      </span>
    );
  };

  const Section = ({ title, children }) => (
    <div className="mb-4">
      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{title}</h4>
      {children}
    </div>
  );

  return (
    <div className="card-premium animate-fade-in">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <span className="text-base">📋</span> Parsed JD
        </h3>
      </div>

      <div className="p-4 space-y-1 max-h-[500px] overflow-y-auto">
        {/* Role Info */}
        <Section title="Role">
          <div className="flex flex-wrap gap-2">
            <Tag color="purple">{parsedJD.roleType}</Tag>
            <Tag color="blue">{parsedJD.seniorityLevel}</Tag>
            {parsedJD.remotePolicy && <Tag color="green">{parsedJD.remotePolicy}</Tag>}
          </div>
          {parsedJD.location && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">📍 {parsedJD.location}</p>
          )}
          {(parsedJD.salaryMin || parsedJD.salaryMax) && (() => {
            const currencySymbol = parsedJD.salaryCurrency === 'INR' ? '₹' : parsedJD.salaryCurrency === 'EUR' ? '€' : '$';
            const locale = parsedJD.salaryCurrency === 'INR' ? 'en-IN' : 'en-US';
            return (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                💰 {currencySymbol}{parsedJD.salaryMin?.toLocaleString(locale) || '?'} — {currencySymbol}{parsedJD.salaryMax?.toLocaleString(locale) || '?'}
              </p>
            );
          })()}
        </Section>

        {/* Required Skills */}
        {parsedJD.requiredSkills?.length > 0 && (
          <Section title="Required Skills">
            <div className="flex flex-wrap gap-1.5">
              {parsedJD.requiredSkills.map((skill, i) => (
                <Tag key={i} color="blue">{skill}</Tag>
              ))}
            </div>
          </Section>
        )}

        {/* Nice to Have */}
        {parsedJD.niceToHaveSkills?.length > 0 && (
          <Section title="Nice to Have">
            <div className="flex flex-wrap gap-1.5">
              {parsedJD.niceToHaveSkills.map((skill, i) => (
                <Tag key={i} color="amber">{skill}</Tag>
              ))}
            </div>
          </Section>
        )}

        {/* Culture & Soft Skills */}
        {parsedJD.cultureTags?.length > 0 && (
          <Section title="Culture">
            <div className="flex flex-wrap gap-1.5">
              {parsedJD.cultureTags.map((tag, i) => (
                <Tag key={i} color="green">{tag}</Tag>
              ))}
            </div>
          </Section>
        )}

        {parsedJD.softSkills?.length > 0 && (
          <Section title="Soft Skills">
            <div className="flex flex-wrap gap-1.5">
              {parsedJD.softSkills.map((skill, i) => (
                <Tag key={i} color="purple">{skill}</Tag>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
