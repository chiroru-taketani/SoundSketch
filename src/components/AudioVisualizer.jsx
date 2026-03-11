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

      const barCount = 48
      // 画面幅に対していい感じの幅を計算
      const barWidth = Math.max(4, width / (barCount * 3))
      const gap = barWidth * 0.8
      const centerX = width / 2
      const centerY = height / 2

      ctx.save()
      // 全体的なグロー効果
      ctx.shadowBlur = 24
      ctx.shadowColor = 'rgba(255, 59, 92, 0.6)'

      for (let i = 0; i < barCount; i++) {
        // 低周波成分にノイズが多い場合は少しインデックスをスキップ
        const data = dataArray[i * 2 + 1] || 0
        // 少しカーブをつけてダイナミックに反応させる
        const percent = Math.pow(data / 255, 1.4) 
        
        // 最大で画面の高さの70%くらいまで伸びる
        const maxBarHeight = height * 0.7
        const barHeight = Math.max(12, maxBarHeight * percent)

        // バーごとにグラデーションを作成
        const gradient = ctx.createLinearGradient(0, centerY - barHeight / 2, 0, centerY + barHeight / 2)
        gradient.addColorStop(0, 'rgba(168, 85, 247, 0.2)')    // theme accent-purple
        gradient.addColorStop(0.2, 'rgba(168, 85, 247, 0.6)')  
        gradient.addColorStop(0.5, 'rgba(255, 59, 92, 0.95)')  // theme accent-red (core)
        gradient.addColorStop(0.8, 'rgba(168, 85, 247, 0.6)')
        gradient.addColorStop(1, 'rgba(168, 85, 247, 0.2)')
        
        ctx.fillStyle = gradient

        const yPos = centerY - barHeight / 2
        const xOffset = i * (barWidth + gap)
        
        // 角丸矩形の描画ヘルパー
        const drawRoundedBar = (x, y, w, h) => {
          ctx.beginPath()
          if (ctx.roundRect) {
            ctx.roundRect(x, y, w, h, w / 2)
          } else {
            ctx.rect(x, y, w, h)
          }
          ctx.fill()
        }

        // 中央から右側
        drawRoundedBar(centerX + xOffset, yPos, barWidth, barHeight)
        // 中央から左側（対称）
        if (i > 0) {
           drawRoundedBar(centerX - xOffset, yPos, barWidth, barHeight)
        }
      }
      ctx.restore()
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
