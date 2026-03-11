import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { get, set } from 'idb-keyval'
import Header from './components/Header'
import RecordButton from './components/RecordButton'
import MemoList from './components/MemoList'
import AudioVisualizer from './components/AudioVisualizer'
import Metronome from './components/Metronome'

export default function App() {
  const [isRecording, setIsRecording] = useState(false)
  const [activeStream, setActiveStream] = useState(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [memos, setMemos] = useState([])
  const [playingId, setPlayingId] = useState(null)
  const [playingAudio, setPlayingAudio] = useState(null)
  const [filterTags, setFilterTags] = useState([])
  const [sortBy, setSortBy] = useState('newest')

  // Collect all unique tags across memos (with count)
  const allTags = useMemo(() => {
    const tagMap = new Map()
    memos.forEach((m) => {
      m.tags.forEach((t) => {
        if (tagMap.has(t.label)) {
          tagMap.get(t.label).count += 1
        } else {
          tagMap.set(t.label, { label: t.label, colorIndex: t.colorIndex, count: 1 })
        }
      })
    })
    return Array.from(tagMap.values())
  }, [memos])

  // Filtered + sorted memos
  const filteredMemos = useMemo(() => {
    let result = memos

    // Filter by tags (AND condition)
    if (filterTags.length > 0) {
      result = result.filter((m) =>
        filterTags.every((ft) => m.tags.some((t) => t.label === ft))
      )
    }

    // Sort
    const sorted = [...result]
    switch (sortBy) {
      case 'oldest':
        sorted.sort((a, b) => Number(a.id) - Number(b.id))
        break
      case 'newest':
        sorted.sort((a, b) => Number(b.id) - Number(a.id))
        break
      case 'longest':
        sorted.sort((a, b) => (b.duration || 0) - (a.duration || 0))
        break
      case 'shortest':
        sorted.sort((a, b) => (a.duration || 0) - (b.duration || 0))
        break
      case 'most-tags':
        sorted.sort((a, b) => b.tags.length - a.tags.length)
        break
      default:
        break
    }

    return sorted
  }, [memos, filterTags, sortBy])

  // Toggle a filter tag
  const toggleFilterTag = useCallback((tagLabel) => {
    setFilterTags((prev) =>
      prev.includes(tagLabel)
        ? prev.filter((t) => t !== tagLabel)
        : [...prev, tagLabel]
    )
  }, [])

  // Clear all filter tags
  const clearFilterTags = useCallback(() => {
    setFilterTags([])
  }, [])

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const audioRef = useRef(null)

  // Format seconds to mm:ss
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  // Generate title from current date/time
  const generateTitle = () => {
    const now = new Date()
    const y = now.getFullYear()
    const mo = (now.getMonth() + 1).toString().padStart(2, '0')
    const d = now.getDate().toString().padStart(2, '0')
    const h = now.getHours().toString().padStart(2, '0')
    const mi = now.getMinutes().toString().padStart(2, '0')
    return `${y}-${mo}-${d} ${h}:${mi}`
  }

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      setActiveStream(stream)
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || chunksRef.current[0]?.type || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type: mimeType })
        const url = URL.createObjectURL(blob)
        const title = generateTitle()
        const id = Date.now().toString()
        const durationSnapshot = recordingTime

        // iPhone (Safari) のIndexedDBはBlobの保存に失敗しやすいため、Base64文字列に変換してから保存する
        const reader = new FileReader()
        reader.readAsDataURL(blob)
        reader.onloadend = () => {
          const base64data = reader.result
          const newMemo = { id, title, audioDataUrl: base64data, type: mimeType, url, note: '', tags: [], duration: durationSnapshot }

          setMemos((prev) => {
            const newMemos = [newMemo, ...prev]
            // urlは都度生成されるので保存しない
            set('soundsketch-memos', newMemos.map(m => ({ ...m, url: '' }))).catch(console.error)
            return newMemos
          })
        }

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop())
        setActiveStream(null)
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      alert('マイクへのアクセスが拒否されました。ブラウザの設定を確認してください。')
      console.error('マイクアクセスエラー:', err)
    }
  }, [recordingTime])

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
    clearInterval(timerRef.current)
  }, [])

  // Play / Pause
  const togglePlay = useCallback(
    (memo) => {
      // If same memo is playing, pause it
      if (playingId === memo.id) {
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current = null
        }
        setPlayingId(null)
        setPlayingAudio(null)
        return
      }

      // Stop current audio if any
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }

      const audio = new Audio(memo.url)
      // 音声要素へのCORS制限対策
      audio.crossOrigin = 'anonymous'
      audio.play()
      audioRef.current = audio
      setPlayingId(memo.id)
      setPlayingAudio(audio)

      audio.onended = () => {
        setPlayingId(null)
        setPlayingAudio(null)
        audioRef.current = null
      }
    },
    [playingId]
  )

  // Update note
  const updateNote = useCallback((id, note) => {
    setMemos((prev) => {
      const newMemos = prev.map((m) => (m.id === id ? { ...m, note } : m))
      set('soundsketch-memos', newMemos.map(m => ({ ...m, url: '' }))).catch(console.error)
      return newMemos
    })
  }, [])

  // Update title
  const updateTitle = useCallback((id, title) => {
    setMemos((prev) => {
      const newMemos = prev.map((m) => (m.id === id ? { ...m, title } : m))
      set('soundsketch-memos', newMemos.map(m => ({ ...m, url: '' }))).catch(console.error)
      return newMemos
    })
  }, [])

  // Add tag
  const addTag = useCallback((id, tag) => {
    setMemos((prev) => {
      const newMemos = prev.map((m) => {
        if (m.id !== id) return m
        if (m.tags.some((t) => t.label === tag)) return m // 重複防止
        const colorIndex = (m.tags.length) % 8
        return { ...m, tags: [...m.tags, { label: tag, colorIndex }] }
      })
      set('soundsketch-memos', newMemos.map(m => ({ ...m, url: '' }))).catch(console.error)
      return newMemos
    })
  }, [])

  // Remove tag
  const removeTag = useCallback((id, tagLabel) => {
    setMemos((prev) => {
      const newMemos = prev.map((m) =>
        m.id === id
          ? { ...m, tags: m.tags.filter((t) => t.label !== tagLabel) }
          : m
      )
      set('soundsketch-memos', newMemos.map(m => ({ ...m, url: '' }))).catch(console.error)
      return newMemos
    })
  }, [])

  // Delete memo
  const deleteMemo = useCallback(
    (id) => {
      if (playingId === id && audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
        setPlayingId(null)
        setPlayingAudio(null)
      }
      setMemos((prev) => {
        const memo = prev.find((m) => m.id === id)
        if (memo && memo.url && memo.url.startsWith('blob:')) {
          URL.revokeObjectURL(memo.url)
        }
        const newMemos = prev.filter((m) => m.id !== id)
        set('soundsketch-memos', newMemos.map(m => ({ ...m, url: '' }))).catch(console.error)
        return newMemos
      })
    },
    [playingId]
  )

  // Cleanup on unmount & initial load
  useEffect(() => {
    const loadMemos = async () => {
      try {
        const storedMemos = await get('soundsketch-memos')
        if (storedMemos) {
          setMemos(storedMemos.map(m => {
            let loadedUrl = m.url
            if (m.audioDataUrl) {
              loadedUrl = m.audioDataUrl
            } else if (m.blob) {
              loadedUrl = URL.createObjectURL(m.blob)
            }
            return {
              ...m,
              url: loadedUrl
            }
          }))
        }
      } catch (e) {
        console.error('Failed to load memos:', e)
      }
    }
    loadMemos()

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      clearInterval(timerRef.current)
    }
  }, [])

  return (
    <div className="min-h-screen bg-surface-50 text-text-primary font-sans flex flex-col pb-[300px]">
      <Header memoCount={memos.length} />

      <main className="flex-1 flex flex-col items-center px-4 w-full">
        {!isRecording && memos.length === 0 && (
          <div className="flex-1 flex items-center justify-center min-h-[40vh]">
            <p className="text-sm text-text-muted text-center max-w-xs leading-relaxed mt-10">
              Don't stop the music!
            </p>
          </div>
        )}

        {/* Memo List */}
        {memos.length > 0 && (
          <div className="w-full max-w-lg mt-6 mb-8">
            <MemoList
              memos={filteredMemos}
              totalCount={memos.length}
              playingId={playingId}
              playingAudio={playingAudio}
              onTogglePlay={togglePlay}
              onUpdateNote={updateNote}
              onUpdateTitle={updateTitle}
              onAddTag={addTag}
              onRemoveTag={removeTag}
              onDelete={deleteMemo}
              allTags={allTags}
              filterTags={filterTags}
              onToggleFilterTag={toggleFilterTag}
              onClearFilterTags={clearFilterTags}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
          </div>
        )}
      </main>

      {/* Fixed Recording Section */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface-50/40 backdrop-blur-xl border-t border-surface-200/30 z-50 pt-5 pb-8 md:pb-12 shadow-[0_-20px_40px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col items-center justify-center max-w-lg mx-auto px-4">
          <div className="flex flex-row items-center justify-center gap-4 sm:gap-8 w-full">
            <RecordButton
              isRecording={isRecording}
              onStart={startRecording}
              onStop={stopRecording}
            />
            <Metronome />
          </div>

          <AudioVisualizer stream={activeStream} isRecording={isRecording} />

          {/* Recording Timer */}
          <div
            className={`mt-4 text-2xl font-mono tracking-wider transition-opacity duration-300 ${
              isRecording ? 'opacity-100 text-accent-red' : 'opacity-40 text-text-secondary'
            }`}
            style={isRecording ? { animation: 'blink 1.5s ease-in-out infinite' } : {}}
          >
            {formatTime(recordingTime)}
          </div>

          {isRecording && (
            <p className="mt-2 text-sm text-text-secondary animate-pulse">
               録音中… タップして停止
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
