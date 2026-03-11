import { useEffect, useRef } from 'react'

export default function AudioVisualizer({ stream, isRecording }) {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const audioContextRef = useRef(null)

  useEffect(() => {
    if (!isRecording || !stream) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error)
        audioContextRef.current = null
      }
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const AudioContext = window.AudioContext || window.webkitAudioContext
    const audioCtx = new AudioContext()
    audioContextRef.current = audioCtx

    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 128
    analyser.smoothingTimeConstant = 0.7

    const source = audioCtx.createMediaStreamSource(stream)
    source.connect(analyser)

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      if (!isRecording) return

      // Canvasの解像度を表示サイズに合わせる
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
      }

      const width = canvas.width
      const height = canvas.height
      animationRef.current = requestAnimationFrame(draw)

      analyser.getByteFrequencyData(dataArray)
      ctx.clearRect(0, 0, width, height)

      // Use a subset of frequencies for a better look
      const barCount = 40 // 増やす
      const barWidth = width / (barCount * 2)
      const centerX = width / 2

      for (let i = 0; i < barCount; i++) {
        // Skip first few low freq noise and pick a value
        const data = dataArray[i + 2] || 0
        const percent = data / 255
        // Minimum height of 4px for empty, scale max height smoothly
        const barHeight = Math.max(4, height * percent * 0.6)

        // 色はテーマに合わせて透明度を持たせる
        ctx.fillStyle = 'rgba(255, 59, 92, 0.15)' // Tailwind accent-red (#ff3b5c) base
        
        // Center aligned Y
        const yPos = (height - barHeight) / 2

        // Right side
        ctx.fillRect(centerX + (i * barWidth), yPos, barWidth - 4, barHeight)
        // Left side (mirror)
        if (i > 0) {
          ctx.fillRect(centerX - (i * barWidth), yPos, barWidth - 4, barHeight)
        }
      }
    }

    draw()

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error)
        audioContextRef.current = null
      }
    }
  }, [isRecording, stream])

  return (
    <div className={`fixed inset-0 pointer-events-none transition-opacity duration-700 ease-in-out z-0 flex items-center justify-center ${
      isRecording ? 'opacity-100' : 'opacity-0'
    }`}>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}
