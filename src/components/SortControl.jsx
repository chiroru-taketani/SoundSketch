import { ArrowUpDown, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

const SORT_OPTIONS = [
  { value: 'newest', label: '新しい順' },
  { value: 'oldest', label: '古い順' },
  { value: 'longest', label: '長い順' },
  { value: 'shortest', label: '短い順' },
  { value: 'most-tags', label: 'タグ数が多い順' },
]

export default function SortControl({ sortBy, onSortChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  const currentLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label || '新しい順'

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={containerRef}>
      <button
        id="sort-control"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
          transition-all duration-200 cursor-pointer
          ${isOpen
            ? 'bg-accent-purple/20 text-accent-purple border border-accent-purple/30'
            : 'bg-surface-200/60 text-text-muted border border-surface-300/40 hover:bg-surface-300/60 hover:text-text-secondary hover:border-surface-300'
          }
        `}
        aria-label="並び替え"
        aria-expanded={isOpen}
      >
        <ArrowUpDown size={12} />
        {currentLabel}
        <ChevronDown
          size={12}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      <div
        className={`
          absolute right-0 top-full mt-1.5 z-50
          bg-surface-100 border border-surface-200 rounded-xl shadow-xl shadow-black/30
          overflow-hidden
          transition-all duration-200 origin-top-right
          ${isOpen
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none'
          }
        `}
        style={{ minWidth: '160px' }}
      >
        {SORT_OPTIONS.map((option) => {
          const isActive = sortBy === option.value
          return (
            <button
              key={option.value}
              id={`sort-option-${option.value}`}
              onClick={() => {
                onSortChange(option.value)
                setIsOpen(false)
              }}
              className={`
                w-full text-left px-4 py-2.5 text-xs font-medium
                transition-all duration-150 cursor-pointer
                ${isActive
                  ? 'bg-accent-purple/15 text-accent-purple'
                  : 'text-text-secondary hover:bg-surface-200/60 hover:text-text-primary'
                }
              `}
            >
              <span className="flex items-center gap-2">
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-purple flex-shrink-0" />
                )}
                <span className={isActive ? '' : 'ml-3.5'}>{option.label}</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
