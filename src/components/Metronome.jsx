import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Square, Minus, Plus } from 'lucide-react'

export default function Metronome() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [bpm, setBpm] = useState(120)
  
  const audioContextRef = useRef(null)
  const nextNoteTimeRef = useRef(0)
  const timerIDRef = useRef(null)
  const currentBeatRef = useRef(0)

  // オーディオコンテキストの初期化（ブラウザの自動再生ポリシー対策のため、ユーザー操作時に呼び出し）
  const initAudio = () => {
    if (!audioContextRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      audioContextRef.current = new AudioContext()
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume()
    }
  }

  const scheduleNote = (beatNumber, time) => {
    if (!audioContextRef.current) return
    const osc = audioContextRef.current.createOscillator()
    const envelope = audioContextRef.current.createGain()
    
    // 最初の拍（1拍目）は高い音、それ以外は低い音
    osc.frequency.value = (beatNumber % 4 === 0) ? 1000 : 800
    
    // エンベロープでアタック感のあるクリック音を作る
    envelope.gain.value = 1
    envelope.gain.exponentialRampToValueAtTime(1, time + 0.001)
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.05)
    
    osc.connect(envelope)
    envelope.connect(audioContextRef.current.destination)
    
    osc.start(time)
    osc.stop(time + 0.05)
  }

  // setInterval等ではなく、Web Audio APIの正確な時間軸を使って先読みスケジューリングする
  const scheduler = useCallback(() => {
    if (!audioContextRef.current) return
    
    const scheduleAheadTime = 0.1 // 0.1秒先まで予約する
    
    while (nextNoteTimeRef.current < audioContextRef.current.currentTime + scheduleAheadTime) {
      scheduleNote(currentBeatRef.current, nextNoteTimeRef.current)
      
      const secondsPerBeat = 60.0 / bpm
      nextNoteTimeRef.current += secondsPerBeat
      currentBeatRef.current++
    }
    
    timerIDRef.current = requestAnimationFrame(scheduler)
  }, [bpm])

  useEffect(() => {
    if (isPlaying) {
      initAudio()
      currentBeatRef.current = 0
      nextNoteTimeRef.current = audioContextRef.current.currentTime + 0.05
      timerIDRef.current = requestAnimationFrame(scheduler)
    } else {
      if (timerIDRef.current) {
        cancelAnimationFrame(timerIDRef.current)
      }
    }
    
    return () => {
      if (timerIDRef.current) {
        cancelAnimationFrame(timerIDRef.current)
      }
    }
  }, [isPlaying, scheduler])

  // 値の増減を長押し対応にするのは複雑になるため、今回はシンプルなクリックだけ
  return (
    <div className="flex items-center gap-3 bg-surface-100 border border-surface-200/60 rounded-full px-4 py-2.5 shadow-sm transition-colors hover:border-surface-300">
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 ${
          isPlaying ? 'bg-accent-purple text-white shadow-md shadow-accent-purple-glow/30' : 'bg-surface-200 text-text-secondary hover:bg-surface-300 hover:text-text-primary'
        }`}
        aria-label={isPlaying ? "メトロノーム停止" : "メトロノーム開始"}
      >
        {isPlaying ? <Square size={14} fill="currentColor" /> : <Play size={14} className="ml-0.5" fill="currentColor" />}
      </button>

      <div className="w-px h-6 bg-surface-200 mx-1"></div>

      <div className="flex items-center gap-1.5 min-w-[100px] justify-between">
        <button 
          onClick={() => setBpm(b => Math.max(40, b - 1))}
          className="text-text-muted hover:text-text-primary p-1.5 transition-colors touch-manipulation cursor-pointer hover:bg-surface-200 rounded-md"
          aria-label="BPMを下げる"
        >
          <Minus size={16} />
        </button>
        
        <div className="flex flex-col items-center w-12 cursor-default font-mono">
          <span className="text-base font-semibold text-text-primary leading-none tracking-wider">{bpm}</span>
          <span className="text-[10px] text-text-muted leading-none mt-1 tracking-widest uppercase">BPM</span>
        </div>

        <button 
          onClick={() => setBpm(b => Math.min(240, b + 1))}
          className="text-text-muted hover:text-text-primary p-1.5 transition-colors touch-manipulation cursor-pointer hover:bg-surface-200 rounded-md"
          aria-label="BPMを上げる"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  )
}
