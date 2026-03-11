import { useState } from 'react'
import { Play, Pause, Trash2, FileText, Tag, X, Plus, Download, Loader2 } from 'lucide-react'
import { convertBlobToWav } from '../utils/audio'

const TAG_COLORS = [
  { bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.3)' },   // purple
  { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' },    // blue
  { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)' },    // emerald
  { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' },    // amber
  { bg: 'rgba(236, 72, 153, 0.15)', text: '#f472b6', border: 'rgba(236, 72, 153, 0.3)' },    // pink
  { bg: 'rgba(6, 182, 212, 0.15)', text: '#22d3ee', border: 'rgba(6, 182, 212, 0.3)' },      // cyan
  { bg: 'rgba(249, 115, 22, 0.15)', text: '#fb923c', border: 'rgba(249, 115, 22, 0.3)' },    // orange
  { bg: 'rgba(132, 204, 22, 0.15)', text: '#a3e635', border: 'rgba(132, 204, 22, 0.3)' },    // lime
]

const SUGGESTED_TAGS = ['メロディ', 'ビート', 'コード', 'ベース', 'ボーカル', 'アイデア', 'サンプル', 'リフ']

export default function MemoItem({ memo, isPlaying, onTogglePlay, onUpdateNote, onUpdateTitle, onAddTag, onRemoveTag, onDelete, index }) {
  const [showNote, setShowNote] = useState(false)
  const [showTagInput, setShowTagInput] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState(memo.title)

  const handleAddTag = (tagText) => {
    const trimmed = tagText.trim()
    if (trimmed) {
      onAddTag(trimmed)
      setTagInput('')
    }
  }

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag(tagInput)
    } else if (e.key === 'Escape') {
      setShowTagInput(false)
      setTagInput('')
    }
  }

  // フィルタ：既に付いているタグを除外した候補を表示
  const availableSuggestions = SUGGESTED_TAGS.filter(
    (s) => !memo.tags.some((t) => t.label === s)
  )

  const handleTitleSave = () => {
    const trimmed = editTitle.trim()
    if (trimmed && trimmed !== memo.title) {
      onUpdateTitle(trimmed)
    } else {
      setEditTitle(memo.title)
    }
    setIsEditingTitle(false)
  }

  const handleShare = async () => {
    if (isExporting) return
    setIsExporting(true)
    try {
      let filename = `${memo.title || 'SoundSketch'}.wav`
      
      // Blobを取得
      const response = await fetch(memo.url || memo.audioDataUrl)
      const sourceBlob = await response.blob()

      // Wavに変換（MediaRecorderのwebmはブラウザによってはパースエラーになる場合があるため、失敗時は元の形式でフォールバック）
      let exportBlob = sourceBlob
      let exportType = 'audio/webm' // デフォルト
      
      try {
        exportBlob = await convertBlobToWav(sourceBlob)
        filename = `${memo.title || 'SoundSketch'}.wav`
        exportType = 'audio/wav'
      } catch (decodeErr) {
        console.warn('WAV変換に失敗したため、元の形式で書き出します:', decodeErr)
        const ext = memo.type?.includes('mp4') || memo.type?.includes('m4a') ? 'm4a' : 'webm'
        filename = `${memo.title || 'SoundSketch'}.${ext}`
        exportType = memo.type || 'audio/webm'
      }

      const file = new File([exportBlob], filename, { type: exportType })

      // ファイルを直接ダウンロードさせる（PC / スマホ共通）
      const a = document.createElement('a')
      a.href = URL.createObjectURL(exportBlob)
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(a.href)
    } catch (error) {
      if (error.name === 'AbortError' || error.message.includes('cancellation of share')) {
        // ユーザーがシェア画面を閉じただけなので何もしない
        console.log('シェアがキャンセルされました。')
      } else {
        alert(`ファイルの書き出しに失敗しました。\n詳細: ${error.message || error}`)
      }
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div
      className="bg-surface-100 border border-surface-200/60 rounded-2xl p-4 transition-all duration-300 hover:border-surface-300"
      style={{
        animation: 'slide-up 0.4s ease-out both',
        animationDelay: `${index * 0.05}s`,
      }}
    >
      <div className="flex items-center gap-3">
        {/* Play / Pause Button */}
        <button
          id={`play-btn-${memo.id}`}
          onClick={onTogglePlay}
          className={`
            w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0
            transition-all duration-200 cursor-pointer
            ${
              isPlaying
                ? 'bg-accent-purple text-white shadow-lg shadow-accent-purple-glow/30'
                : 'bg-surface-200 text-text-secondary hover:bg-surface-300 hover:text-text-primary'
            }
          `}
          aria-label={isPlaying ? '一時停止' : '再生'}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
        </button>

        {/* Title & Info */}
        <div className="flex-1 min-w-0">
          {isEditingTitle ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSave()
                if (e.key === 'Escape') {
                  setEditTitle(memo.title)
                  setIsEditingTitle(false)
                }
              }}
              autoFocus
              className="w-full text-sm font-medium text-text-primary bg-surface-50 border border-accent-purple/50 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-accent-purple/20 transition-all"
            />
          ) : (
            <p
              className="text-sm font-medium text-text-primary truncate cursor-pointer hover:text-accent-purple transition-colors"
              onClick={() => {
                setEditTitle(memo.title)
                setIsEditingTitle(true)
              }}
              title="クリックしてタイトルを編集"
            >
              {memo.title}
            </p>
          )}
          {memo.note && (
            <p className="text-xs text-text-muted truncate mt-0.5">{memo.note}</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <button
            id={`tag-btn-${memo.id}`}
            onClick={() => setShowTagInput(!showTagInput)}
            className={`
              w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer
              transition-all duration-200
              ${showTagInput ? 'bg-accent-purple/20 text-accent-purple' : 'text-text-muted hover:bg-surface-200 hover:text-text-secondary'}
            `}
            aria-label="タグを追加"
          >
            <Tag size={16} />
          </button>
          <button
            id={`note-btn-${memo.id}`}
            onClick={() => setShowNote(!showNote)}
            className={`
              w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer
              transition-all duration-200
              ${showNote ? 'bg-accent-purple/20 text-accent-purple' : 'text-text-muted hover:bg-surface-200 hover:text-text-secondary'}
            `}
            aria-label="メモを編集"
          >
            <FileText size={16} />
          </button>
          <button
            id={`share-btn-${memo.id}`}
            onClick={handleShare}
            disabled={isExporting}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-text-muted hover:bg-surface-200 hover:text-text-secondary transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-wait"
            aria-label="WAVでエクスポート"
          >
            {isExporting ? <Loader2 size={16} className="animate-spin text-accent-purple" /> : <Download size={16} />}
          </button>
          <button
            id={`delete-btn-${memo.id}`}
            onClick={onDelete}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-text-muted hover:bg-accent-red/10 hover:text-accent-red transition-all duration-200 cursor-pointer"
            aria-label="削除"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Tags display */}
      {memo.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {memo.tags.map((tag) => {
            const color = TAG_COLORS[tag.colorIndex % TAG_COLORS.length]
            return (
              <span
                key={tag.label}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 group/tag"
                style={{
                  backgroundColor: color.bg,
                  color: color.text,
                  border: `1px solid ${color.border}`,
                }}
              >
                {tag.label}
                <button
                  onClick={() => onRemoveTag(tag.label)}
                  className="opacity-0 group-hover/tag:opacity-100 transition-opacity duration-150 hover:scale-110 cursor-pointer ml-0.5"
                  aria-label={`${tag.label}タグを削除`}
                >
                  <X size={12} />
                </button>
              </span>
            )
          })}
        </div>
      )}

      {/* Tag Input (expandable) */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          showTagInput ? 'max-h-40 opacity-100 mt-3' : 'max-h-0 opacity-0 mt-0'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              id={`tag-input-${memo.id}`}
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="タグを入力して Enter…"
              className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-2 text-sm text-text-primary placeholder:text-text-muted/60 outline-none focus:border-accent-purple/50 focus:ring-1 focus:ring-accent-purple/20 transition-all duration-200"
            />
          </div>
          <button
            onClick={() => handleAddTag(tagInput)}
            disabled={!tagInput.trim()}
            className="w-9 h-9 rounded-xl bg-accent-purple/20 text-accent-purple flex items-center justify-center flex-shrink-0 transition-all duration-200 hover:bg-accent-purple/30 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            aria-label="タグを追加"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Suggested tags */}
        {availableSuggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {availableSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleAddTag(suggestion)}
                className="px-2.5 py-1 rounded-lg text-xs text-text-muted bg-surface-200/60 border border-surface-300/40 hover:bg-surface-300/60 hover:text-text-secondary hover:border-surface-300 transition-all duration-200 cursor-pointer"
              >
                + {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Note Input (expandable) */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          showNote ? 'max-h-24 opacity-100 mt-3' : 'max-h-0 opacity-0 mt-0'
        }`}
      >
        <input
          id={`note-input-${memo.id}`}
          type="text"
          value={memo.note}
          onChange={(e) => onUpdateNote(e.target.value)}
          placeholder="キー, BPM, コード進行など…"
          className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted/60 outline-none focus:border-accent-purple/50 focus:ring-1 focus:ring-accent-purple/20 transition-all duration-200"
        />
      </div>
    </div>
  )
}
