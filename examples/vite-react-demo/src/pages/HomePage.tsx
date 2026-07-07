import { usePrinter, usePrinterConnection, usePrinterStatus } from 'detonger-web-bt/react'
import { PaperTypeNames } from 'detonger-web-bt/react'

export default function HomePage() {
  const { deviceName, connectionStatus } = usePrinter()
  const { isConnected } = usePrinterConnection()
  const { status: printerStatus, stats: printerStats, refresh } = usePrinterStatus({
    refetchInterval: 10000,
  })

  const handleFullRefresh = async () => {
    await refresh(true)
  }

  return (
    <div>
      <h1>DeTonger Web BT - React Demo</h1>
      
      <div style={styles.statusCard}>
        <div style={styles.headerRow}>
          <h3>Printer Status</h3>
          {isConnected && (
            <button onClick={handleFullRefresh} style={styles.refreshButton}>
              🔄 Full Refresh
            </button>
          )}
        </div>
        <p>
          Status:{' '}
          <span style={{ color: isConnected ? '#28a745' : '#dc3545' }}>
            {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
          </span>
        </p>
        {deviceName && <p>Device: {deviceName}</p>}
        
        {isConnected && printerStatus && (
          <div style={styles.printerInfoSection}>
            <h4>Printer Information</h4>
            {printerStatus.manufacturer && <p>Manufacturer: {printerStatus.manufacturer}</p>}
            {printerStatus.deviceName && <p>Name: {printerStatus.deviceName}</p>}
            {printerStatus.softwareVersion && <p>SW Version: {printerStatus.softwareVersion}</p>}
            {printerStatus.deviceVersion && <p>HW Version: {printerStatus.deviceVersion}</p>}
            {printerStatus.printerDPI && <p>DPI: {printerStatus.printerDPI}</p>}
            {printerStatus.printerWidth && <p>Width: {printerStatus.printerWidth}px</p>}
            {printerStatus.paperWidthMm && <p>Paper: {printerStatus.paperWidthMm}mm</p>}
            {printerStatus.currentDensity !== undefined && (
              <p>Density: {printerStatus.currentDensity}</p>
            )}
            {printerStatus.currentSpeed !== undefined && (
              <p>Speed: {printerStatus.currentSpeed}</p>
            )}
            {printerStatus.currentPaperType !== undefined && (
              <p>Paper Type: {PaperTypeNames[printerStatus.currentPaperType] || 'Unknown'}</p>
            )}
          </div>
        )}
        
        {isConnected && printerStats && (
          <div style={styles.statsSection}>
            <h4>Print Statistics</h4>
            {printerStats.workLines !== undefined && <p>Work lines: {printerStats.workLines}</p>}
            {printerStats.printLines !== undefined && <p>Print lines: {printerStats.printLines}</p>}
            {printerStats.nullLines !== undefined && <p>Null lines: {printerStats.nullLines}</p>}
            {printerStats.printPages !== undefined && <p>Pages: {printerStats.printPages}</p>}
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  statusCard: {
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '24px',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  refreshButton: {
    padding: '8px 16px',
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 500,
  },
  printerInfoSection: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #dee2e6',
  },
  statsSection: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #dee2e6',
  },
}
