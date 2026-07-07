import { useState } from 'react'
import { usePrinter } from 'detonger-web-bt/react'
export default function PrintTextPage() {
  const { printText, isConnected } = usePrinter()
  const [text, setText] = useState('GROCERY STORE\n123 Example St\n\nBread x2      $6.00\nMilk x1       $3.50\nButter x1     $8.00\n\nTOTAL:       $17.50\n\nThank you!')
  const [fontSize, setFontSize] = useState(24)
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center')
  const [isPrinting, setIsPrinting] = useState(false)
  const [lastResult, setLastResult] = useState<string | null>(null)
  const handlePrint = async () => {
    if (!isConnected) return
    setIsPrinting(true)
    setLastResult(null)
    try {
      const stats = await printText(text, {
        fontSize,
        textAlign,
        autoWrap: true,
        padding: [4, 4, 4, 4],
      })
      setLastResult(`Printed: ${stats.totalBytes} bytes, ${stats.bitmapLines} lines`)
    } catch (err) {
      setLastResult(`Error: ${(err as Error).message}`)
    } finally {
      setIsPrinting(false)
    }
  }
  return (
    <div>
      <h1>📝 Printing text</h1>
      <div style={styles.formGroup}>
        <label style={styles.label}>Text to print:</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={styles.textarea}
          rows={8}
        />
      </div>
      <div style={styles.row}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Font size: {fontSize}px</label>
          <input
            type="range"
            min="12"
            max="72"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            style={styles.slider}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Alignment:</label>
          <select
            value={textAlign}
            onChange={(e) => setTextAlign(e.target.value as 'left' | 'center' | 'right')}
            style={styles.select}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
      </div>
      <button
        onClick={handlePrint}
        disabled={!isConnected || isPrinting || !text.trim()}
        style={{
          ...styles.printButton,
          ...(!isConnected || isPrinting ? styles.disabledButton : {}),
        }}
      >
        {isPrinting ? 'Printing...' : 'Print Text'}
      </button>
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
  textarea: {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    fontFamily: 'monospace',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    resize: 'vertical',
    boxSizing: 'border-box',
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
  printButton: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    fontWeight: 600,
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '8px',
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
