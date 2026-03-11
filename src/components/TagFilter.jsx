import { Search, X } from 'lucide-react'

const TAG_COLORS = [
  { bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.3)', activeBg: 'rgba(168, 85, 247, 0.35)' },
  { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)', activeBg: 'rgba(59, 130, 246, 0.35)' },
  { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)', activeBg: 'rgba(16, 185, 129, 0.35)' },
  { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)', activeBg: 'rgba(245, 158, 11, 0.35)' },
  { bg: 'rgba(236, 72, 153, 0.15)', text: '#f472b6', border: 'rgba(236, 72, 153, 0.3)', activeBg: 'rgba(236, 72, 153, 0.35)' },
  { bg: 'rgba(6, 182, 212, 0.15)', text: '#22d3ee', border: 'rgba(6, 182, 212, 0.3)', activeBg: 'rgba(6, 182, 212, 0.35)' },
  { bg: 'rgba(249, 115, 22, 0.15)', text: '#fb923c', border: 'rgba(249, 115, 22, 0.3)', activeBg: 'rgba(249, 115, 22, 0.35)' },
  { bg: 'rgba(132, 204, 22, 0.15)', text: '#a3e635', border: 'rgba(132, 204, 22, 0.3)', activeBg: 'rgba(132, 204, 22, 0.35)' },
]

export default function TagFilter({ allTags, activeFilters, onToggleFilter, onClearFilters }) {
  if (allTags.length === 0) return null

  return (
    <div
      className="w-full mb-4"
      style={{ animation: 'slide-up 0.3s ease-out both' }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-2.5 px-1">
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <Search size={12} />
          <span className="uppercase tracking-widest font-medium">タグで絞り込み</span>
        </div>
        {activeFilters.length > 0 && (
          <button
            id="clear-tag-filter"
            onClick={onClearFilters}
            className="flex items-center gap-1 text-xs text-accent-purple hover:text-accent-purple/80 transition-colors duration-200 cursor-pointer"
          >
            <X size={12} />
            クリア
          </button>
        )}
      </div>

      {/* Tag chips */}
      <div className="flex flex-wrap gap-1.5">
        {allTags.map((tag) => {
          const isActive = activeFilters.includes(tag.label)
          const color = TAG_COLORS[tag.colorIndex % TAG_COLORS.length]
          return (
            <button
              key={tag.label}
              onClick={() => onToggleFilter(tag.label)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer"
              style={{
                backgroundColor: isActive ? color.activeBg : color.bg,
                color: color.text,
                border: `1px solid ${color.border}`,
                opacity: isActive ? 1 : 0.65,
                transform: isActive ? 'scale(1.05)' : 'scale(1)',
                boxShadow: isActive ? `0 0 12px ${color.border}` : 'none',
              }}
              aria-label={`${tag.label}でフィルタ`}
              aria-pressed={isActive}
            >
              {isActive && (
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color.text }}
                />
              )}
              {tag.label}
              {tag.count > 1 && (
                <span
                  className="text-[10px] opacity-60 ml-0.5"
                >
                  {tag.count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
