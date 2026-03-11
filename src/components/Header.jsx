import { Waves } from 'lucide-react'

export default function Header({ memoCount }) {
  return (
    <header className="w-full px-6 py-5 flex items-center justify-between border-b border-surface-200/50">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-purple to-accent-red flex items-center justify-center shadow-lg shadow-accent-purple-glow/30">
          <Waves size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">SoundSketch</h1>
          <p className="text-xs text-text-muted -mt-0.5">Voice Memo for Creators</p>
        </div>
      </div>

      {memoCount > 0 && (
        <div className="text-xs text-text-muted bg-surface-200 px-3 py-1.5 rounded-full">
          {memoCount} メモ
        </div>
      )}
    </header>
  )
}
