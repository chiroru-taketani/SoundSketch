import { Mic, Square } from 'lucide-react'

export default function RecordButton({ isRecording, onStart, onStop }) {
  return (
    <button
      id="record-button"
      onClick={isRecording ? onStop : onStart}
      className="relative group cursor-pointer outline-none"
      aria-label={isRecording ? '録音停止' : '録音開始'}
    >
      {/* Outer glow rings (visible when recording) */}
      {isRecording && (
        <>
          <span
            className="absolute inset-0 rounded-full bg-accent-red/20 -m-4"
            style={{ animation: 'pulse-ring 2s ease-in-out infinite' }}
          />
          <span
            className="absolute inset-0 rounded-full bg-accent-red/10 -m-8"
            style={{ animation: 'pulse-ring 2s ease-in-out infinite 0.4s' }}
          />
          <span
            className="absolute inset-0 rounded-full bg-accent-red/5 -m-12"
            style={{ animation: 'pulse-ring 2s ease-in-out infinite 0.8s' }}
          />
        </>
      )}

      {/* Main button */}
      <div
        className={`
          relative w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center
          transition-all duration-300 ease-out
          ${
            isRecording
              ? 'bg-accent-red shadow-[0_0_60px_rgba(255,59,92,0.4)] scale-95'
              : 'bg-gradient-to-br from-surface-300 to-surface-200 shadow-[0_0_40px_rgba(168,85,247,0.15)] hover:shadow-[0_0_60px_rgba(168,85,247,0.25)] hover:scale-105 active:scale-95'
          }
        `}
      >
        {/* Inner ring */}
        <div
          className={`
            absolute inset-2 rounded-full border-2 transition-colors duration-300
            ${isRecording ? 'border-white/20' : 'border-accent-purple/30 group-hover:border-accent-purple/50'}
          `}
        />

        {isRecording ? (
          <Square
            size={24}
            className="text-white fill-white relative z-10"
            strokeWidth={0}
          />
        ) : (
          <Mic
            size={28}
            className="text-text-primary group-hover:text-accent-purple transition-colors duration-300 relative z-10"
          />
        )}
      </div>

      {/* Waveform visualization (recording) */}
      {isRecording && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-end gap-1">
          {[0, 0.15, 0.3, 0.15, 0.35, 0.1, 0.25].map((delay, i) => (
            <span
              key={i}
              className="w-1 bg-accent-red rounded-full"
              style={{
                animation: `waveform 0.8s ease-in-out infinite`,
                animationDelay: `${delay}s`,
                height: '8px',
              }}
            />
          ))}
        </div>
      )}
    </button>
  )
}
