import { Link, useRouterState, useRouter } from '@tanstack/react-router'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect, useRef } from 'react'

// Track navigation history outside component to persist across re-renders
let navigationStack: string[] = []
let currentIndex = 0

export function Navbar() {
  const router = useRouter()
  const routerState = useRouterState()
  const pathname = routerState.location.pathname
  const [canGoForward, setCanGoForward] = useState(false)
  const isNavigatingRef = useRef(false)

  const navItems = [
    { label: 'Areas', path: '/areas' },
    { label: 'Projects', path: '/projects' },
  ]

  // Track navigation history
  useEffect(() => {
    // Initialize stack if empty
    if (navigationStack.length === 0) {
      navigationStack = [pathname]
      currentIndex = 0
    } else if (!isNavigatingRef.current) {
      // Normal forward navigation (clicking links)
      // Remove any forward history and add new path
      navigationStack = navigationStack.slice(0, currentIndex + 1)
      navigationStack.push(pathname)
      currentIndex = navigationStack.length - 1
    }

    // Update forward button state
    setCanGoForward(currentIndex < navigationStack.length - 1)
    isNavigatingRef.current = false
  }, [pathname])

  const canGoBack = window.history.length > 1

  const handleBack = () => {
    isNavigatingRef.current = true
    currentIndex = Math.max(0, currentIndex - 1)
    setCanGoForward(currentIndex < navigationStack.length - 1)
    window.history.back()
  }

  const handleForward = () => {
    isNavigatingRef.current = true
    currentIndex = Math.min(navigationStack.length - 1, currentIndex + 1)
    setCanGoForward(currentIndex < navigationStack.length - 1)
    window.history.forward()
  }

  return (
    <nav className="border-b bg-card">
      <div className="max-w-5xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1">
            <Link to="/" className="mr-6 hover:opacity-70 transition-opacity">
              <Calendar className="h-6 w-6" />
            </Link>
            <div className="flex gap-1">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === item.path
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              disabled={!canGoBack}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleForward}
              disabled={!canGoForward}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
