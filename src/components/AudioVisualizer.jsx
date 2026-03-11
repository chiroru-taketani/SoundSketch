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

      const width = canvas.width
      const height = canvas.height
      animationRef.current = requestAnimationFrame(draw)

      analyser.getByteFrequencyData(dataArray)
      ctx.clearRect(0, 0, width, height)

      // Use a subset of frequencies for a better look
      const barCount = 20
      const barWidth = width / (barCount * 2)
      const centerX = width / 2

      for (let i = 0; i < barCount; i++) {
        // Skip first few low freq noise and pick a value
        const data = dataArray[i + 2] || 0
        const percent = data / 255
        // Minimum height of 4px for empty, scale max height smoothly
        const barHeight = Math.max(4, height * percent * 0.8)

        ctx.fillStyle = '#ef4444' // Tailwind accent-red
        
        // Ensure bars have rounded caps-like look by drawing a simple styled rect or just clean rects
        // Center aligned Y
        const yPos = (height - barHeight) / 2

        // Right side
        ctx.fillRect(centerX + (i * barWidth), yPos, barWidth - 2, barHeight)
        // Left side (mirror)
        if (i > 0) {
          ctx.fillRect(centerX - (i * barWidth), yPos, barWidth - 2, barHeight)
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
    <div className={`w-full max-w-xs mt-6 transition-all duration-300 ease-in-out flex justify-center ${
      isRecording ? 'opacity-100 h-16' : 'opacity-0 h-0 overflow-hidden'
    }`}>
      <canvas ref={canvasRef} width="320" height="64" className="w-full h-full" />
    </div>
  )
}
