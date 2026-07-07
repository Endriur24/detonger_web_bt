import { useRef, useState, useEffect } from 'react'
import { usePrinter } from 'detonger-web-bt/react'
export default function PrintCanvasPage() {
  const { printCanvas, isConnected } = usePrinter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [threshold, setThreshold] = useState(128)
  const [ditherMethod, setDitherMethod] = useState<'atkinson' | 'threshold'>('threshold')
  const [isPrinting, setIsPrinting] = useState(false)
  const [lastResult, setLastResult] = useState<string | null>(null)
  useEffect(() => {
    drawSample()
  }, [])
  const drawSample = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = 'black'
    ctx.font = 'bold 28px Arial'
    ctx.fillText('Label #123', 30, 50)
    ctx.font = '16px Arial'
    ctx.fillText('Date: 2026-04-20', 30, 80)
    ctx.fillText('Weight: 1.5 kg', 30, 105)
    ctx.strokeStyle = 'black'
    ctx.lineWidth = 2
    ctx.strokeRect(20, 10, canvas.width - 40, canvas.height - 20)
    ctx.beginPath()
    ctx.moveTo(20, 125)
    ctx.lineTo(canvas.width - 20, 125)
    ctx.stroke()
    ctx.font = '12px Arial'
    ctx.fillText('Manufacturer: ABC Ltd.', 30, 145)
  }
  const handlePrint = async () => {
    if (!isConnected) return
    const canvas = canvasRef.current
    if (!canvas) return
    setIsPrinting(true)
    setLastResult(null)
    try {
      const stats = await printCanvas(canvas, {
        threshold,
        ditherMethod,
      })
      setLastResult(`Printed: ${stats.totalBytes} bytes, ${stats.bitmapLines} lines`)
    } catch (err) {
      setLastResult(`Błąd: ${(err as Error).message}`)
    } finally {
      setIsPrinting(false)
    }
  }
  return (
    <div>
      <h1>🎨 Drukowanie canvas</h1>
      <div style={styles.canvasContainer}>
        <canvas
          ref={canvasRef}
          width={380}
          height={170}
          style={styles.canvas}
        />
      </div>
      <div style={styles.row}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Binaryzation threshold: {threshold}</label>
          <input
            type="range"
            min="0"
            max="255"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            style={styles.slider}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Dithering method:</label>
          <select
            value={ditherMethod}
            onChange={(e) => setDitherMethod(e.target.value as 'atkinson' | 'threshold')}
            style={styles.select}
          >
            <option value="threshold">Threshold (fast)</option>
            <option value="atkinson">Atkinson (high quality)</option>
          </select>
        </div>
      </div>
      <div style={styles.buttonRow}>
        <button onClick={drawSample} style={styles.drawButton}>
          🔄 Redraw
        </button>
        <button
          onClick={handlePrint}
          disabled={!isConnected || isPrinting}
          style={{
            ...styles.printButton,
            ...(!isConnected || isPrinting ? styles.disabledButton : {}),
          }}
        >
          {isPrinting ? 'Printing...' : 'Print Canvas'}
        </button>
      </div>
      {lastResult && (
        <div style={styles.resultBox}>
          <p>{lastResult}</p>
        </div>
      )}
      {!isConnected && (
        <p style={styles.warning}>Connect to printer to print.</p>
      )}
    </div>
  )
}
const styles: Record<string, React.CSSProperties> = {
  canvasContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '24px',
    backgroundColor: '#f1f5f9',
    padding: '16px',
    borderRadius: '8px',
  },
  canvas: {
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    backgroundColor: 'white',
  },
  formGroup: {
    marginBottom: '16px',
    flex: 1,
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontWeight: 500,
    fontSize: '14px',
  },
  row: {
    display: 'flex',
    gap: '24px',
  },
  slider: {
    width: '100%',
  },
  select: {
    width: '100%',
    padding: '8px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
  },
  buttonRow: {
    display: 'flex',
    gap: '12px',
  },
  drawButton: {
    padding: '14px 24px',
    fontSize: '14px',
    fontWeight: 600,
    backgroundColor: '#f59e0b',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  printButton: {
    flex: 1,
    padding: '14px',
    fontSize: '16px',
    fontWeight: 600,
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
    cursor: 'not-allowed',
  },
  resultBox: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#e7f3ff',
    border: '1px solid #b3d9ff',
    borderRadius: '6px',
  },
  warning: {
    marginTop: '16px',
    color: '#dc3545',
    fontWeight: 500,
  },
}
