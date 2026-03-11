import { useEffect, useRef } from 'react'

export default function PlaybackVisualizer({ audioElement }) {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const sourceNodeRef = useRef(null)

  useEffect(() => {
    if (!audioElement) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    // 既存のAudioContextがあるか確認するか、新しく作る（MediaElementSourceは1要素につき1回しか作れないため注意）
    // NOTE: HTMLAudioElement の拡張として context を持たせるシンプルな共有手法
    let audioCtx = audioElement.__audioCtx
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      audioCtx = new AudioContext()
      audioElement.__audioCtx = audioCtx
    }

    let analyser = audioElement.__analyser
    if (!analyser) {
      analyser = audioCtx.createAnalyser()
      analyser.fftSize = 128
      analyser.smoothingTimeConstant = 0.7
      audioElement.__analyser = analyser
    }

    if (!audioElement.__sourceNode) {
      const source = audioCtx.createMediaElementSource(audioElement)
      source.connect(analyser)
      analyser.connect(audioCtx.destination)
      audioElement.__sourceNode = source
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume()
    }

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      if (!audioElement || audioElement.paused || audioElement.ended) {
        // パーズ中や終了時は描画を停止してリセット
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        if (animationRef.current) cancelAnimationFrame(animationRef.current)
        return
      }

      const width = canvas.width
      const height = canvas.height
      animationRef.current = requestAnimationFrame(draw)

      analyser.getByteFrequencyData(dataArray)
      ctx.clearRect(0, 0, width, height)

      const barCount = 16
      const barWidth = width / (barCount * 2)
      const centerX = width / 2

      for (let i = 0; i < barCount; i++) {
        const data = dataArray[i + 2] || 0
        const percent = data / 255
        const barHeight = Math.max(2, height * percent * 0.8)

        ctx.fillStyle = '#c084fc' // Tailwind accent-purple

        const yPos = (height - barHeight) / 2
        ctx.fillRect(centerX + (i * barWidth), yPos, barWidth - 1, barHeight)
        if (i > 0) {
          ctx.fillRect(centerX - (i * barWidth), yPos, barWidth - 1, barHeight)
        }
      }
    }

    // 再生中なら描画開始
    if (!audioElement.paused) {
      draw()
    }

    // イベントリスナーで再生・停止に同期
    const handlePlay = () => {
      audioCtx.resume()
      draw()
    }
    const handlePause = () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }

    audioElement.addEventListener('play', handlePlay)
    audioElement.addEventListener('pause', handlePause)
    audioElement.addEventListener('ended', handlePause)

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      audioElement.removeEventListener('play', handlePlay)
      audioElement.removeEventListener('pause', handlePause)
      audioElement.removeEventListener('ended', handlePause)
    }
  }, [audioElement])

  return (
    <div className={`transition-all duration-300 ease-in-out flex justify-center ${
      audioElement ? 'opacity-100 w-32 ml-3' : 'opacity-0 w-0 overflow-hidden'
    }`}>
      <canvas ref={canvasRef} width="128" height="32" className="w-full h-[32px]" />
    </div>
  )
}
