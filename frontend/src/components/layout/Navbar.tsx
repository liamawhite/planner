import { Link, useRouterState } from '@tanstack/react-router'
import { Calendar } from 'lucide-react'

export function Navbar() {
  const router = useRouterState()
  const pathname = router.location.pathname

  const navItems = [
    { label: 'Areas', path: '/areas' },
    { label: 'Projects', path: '/projects' },
    { label: 'Tasks', path: '/tasks' },
  ]

  return (
    <nav className="border-b bg-card">
      <div className="max-w-5xl mx-auto px-6 py-3">
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
      </div>
    </nav>
  )
}
