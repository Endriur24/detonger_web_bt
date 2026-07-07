import { useState, useRef, useCallback } from 'react'
import { usePrinter } from 'detonger-web-bt/react'
export default function PrintImagePage() {
  const { printImage, isConnected } = usePrinter()
  const [imageUrl, setImageUrl] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [threshold, setThreshold] = useState(192)
  const [ditherMethod, setDitherMethod] = useState<'atkinson' | 'threshold'>('atkinson')
  const [invertColors, setInvertColors] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const [lastResult, setLastResult] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file)
    setFilePreview(previewUrl)
    setImageUrl('') // Clear URL input when file is selected
    setLastResult(null)
  }, [])
  const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value)
    // Clear file selection when URL is entered
    if (e.target.value.trim()) {
      setSelectedFile(null)
      if (filePreview) {
        URL.revokeObjectURL(filePreview)
        setFilePreview(null)
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [filePreview])
  const handlePrint = async () => {
    if (!isConnected) return
    
    const sourceToPrint = filePreview || imageUrl.trim()
    if (!sourceToPrint) return
    setIsPrinting(true)
    setLastResult(null)
    try {
      const stats = await printImage(sourceToPrint, {
        threshold,
        ditherMethod,
        invertColors,
      })
      setLastResult(`Printed: ${stats.totalBytes} bytes, ${stats.bitmapLines} lines`)
    } catch (err) {
      setLastResult(`Błąd: ${(err as Error).message}`)
    } finally {
      setIsPrinting(false)
    }
  }
  // Cleanup preview URL on unmount
  useState(() => {
    return () => {
      if (filePreview) {
        URL.revokeObjectURL(filePreview)
      }
    }
  })
  return (
    <div>
      <h1>🖼️ Drukowanie obrazu</h1>
      <div style={styles.formGroup}>
        <label style={styles.label}>Image URL:</label>
        <input
          type="url"
          value={imageUrl}
          onChange={handleUrlChange}
          placeholder="https://example.com/logo.png"
          style={styles.input}
          disabled={!!filePreview}
        />
      </div>
      <div style={styles.divider}>
        <span style={styles.dividerText}>or</span>
      </div>
      <div style={styles.formGroup}>
        <label style={styles.label}>Select file from disk:</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={styles.fileInput}
          disabled={!!imageUrl.trim()}
        />
        {selectedFile && (
          <p style={styles.fileName}>Selected: {selectedFile.name}</p>
        )}
      </div>
      {(filePreview || imageUrl.trim()) && (
        <div style={styles.previewContainer}>
          <label style={styles.label}>Preview:</label>
          <img 
            src={filePreview || imageUrl} 
            alt="Preview" 
            style={styles.previewImage}
          />
        </div>
      )}
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
            <option value="atkinson">Atkinson (high quality)</option>
            <option value="threshold">Threshold (fast)</option>
          </select>
        </div>
      </div>
      <div style={styles.formGroup}>
        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={invertColors}
            onChange={(e) => setInvertColors(e.target.checked)}
          />
          Invert colors
        </label>
      </div>
      <button
        onClick={handlePrint}
        disabled={!isConnected || isPrinting || (!filePreview && !imageUrl.trim())}
        style={{
          ...styles.printButton,
          ...(!isConnected || isPrinting ? styles.disabledButton : {}),
        }}
      >
        {isPrinting ? 'Printing...' : 'Print Image'}
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
  input: {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    boxSizing: 'border-box',
  },
  fileInput: {
    width: '100%',
    padding: '8px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    boxSizing: 'border-box',
  },
  fileName: {
    marginTop: '8px',
    fontSize: '13px',
    color: '#64748b',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '20px 0',
  },
  dividerText: {
    fontSize: '14px',
    color: '#94a3b8',
    fontWeight: 500,
  },
  previewContainer: {
    marginBottom: '16px',
  },
  previewImage: {
    maxWidth: '100%',
    maxHeight: '200px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    marginTop: '8px',
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
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
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
