import MemoItem from './MemoItem'
import TagFilter from './TagFilter'
import SortControl from './SortControl'

export default function MemoList({
  memos,
  totalCount,
  playingId,
  onTogglePlay,
  onUpdateNote,
  onUpdateTitle,
  onAddTag,
  onRemoveTag,
  onDelete,
  allTags,
  filterTags,
  onToggleFilterTag,
  onClearFilterTags,
  sortBy,
  onSortChange,
}) {
  return (
    <section className="w-full max-w-lg" id="memo-list">
      {/* Header row with title and sort control */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-sm font-medium text-text-muted uppercase tracking-widest">
          録音メモ
        </h2>
        <SortControl sortBy={sortBy} onSortChange={onSortChange} />
      </div>

      {/* Tag Filter */}
      <TagFilter
        allTags={allTags}
        activeFilters={filterTags}
        onToggleFilter={onToggleFilterTag}
        onClearFilters={onClearFilterTags}
      />

      {/* Filter result info */}
      {filterTags.length > 0 && (
        <div className="text-xs text-text-muted mb-3 px-1">
          {memos.length === 0 ? (
            <span>一致するメモがありません</span>
          ) : (
            <span>
              {totalCount}件中 <span className="text-accent-purple font-medium">{memos.length}件</span> を表示
            </span>
          )}
        </div>
      )}

      {/* Empty state when filter has no results */}
      {memos.length === 0 && filterTags.length > 0 ? (
        <div
          className="flex flex-col items-center justify-center py-12 text-text-muted"
          style={{ animation: 'slide-up 0.3s ease-out both' }}
        >
          <div className="w-16 h-16 rounded-2xl bg-surface-200/50 flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
              <path d="M8 11h6" />
            </svg>
          </div>
          <p className="text-sm">選択したタグに一致するメモがありません</p>
          <button
            onClick={onClearFilterTags}
            className="mt-3 text-xs text-accent-purple hover:text-accent-purple/80 transition-colors duration-200 cursor-pointer"
          >
            フィルタをクリア
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {memos.map((memo, index) => (
            <MemoItem
              key={memo.id}
              memo={memo}
              isPlaying={playingId === memo.id}
              onTogglePlay={() => onTogglePlay(memo)}
              onUpdateNote={(note) => onUpdateNote(memo.id, note)}
              onUpdateTitle={(title) => onUpdateTitle(memo.id, title)}
              onAddTag={(tag) => onAddTag(memo.id, tag)}
              onRemoveTag={(tagLabel) => onRemoveTag(memo.id, tagLabel)}
              onDelete={() => onDelete(memo.id)}
              index={index}
            />
          ))}
        </div>
      )}
    </section>
  )
}
