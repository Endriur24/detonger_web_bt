import { useState } from 'react'
import { SidebarLayout } from './components/SidebarLayout'
import HomePage from './pages/HomePage'
import PrintTextPage from './pages/PrintTextPage'
import PrintImagePage from './pages/PrintImagePage'
import PrintCanvasPage from './pages/PrintCanvasPage'

const pages = {
  home: HomePage,
  'print-text': PrintTextPage,
  'print-image': PrintImagePage,
  'print-canvas': PrintCanvasPage,
} as const

type PageKey = keyof typeof pages

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageKey>('home')
  const CurrentPageComponent = pages[currentPage]

  return (
    <SidebarLayout currentPage={currentPage} onNavigate={setCurrentPage}>
      <CurrentPageComponent />
    </SidebarLayout>
  )
}
