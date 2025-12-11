import { useState, useEffect } from 'react'
import { ListAreas, ListProjects } from '../../wailsjs/go/main/App'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'

interface Area {
  id: string
  name: string
  description: string
  created_at: any
  updated_at: any
}

interface Project {
  id: string
  name: string
  area_id: string
  created_at: any
  updated_at: any
}

export default function Dashboard() {
  const [areas, setAreas] = useState<Area[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [areasData, projectsData] = await Promise.all([
          ListAreas(),
          ListProjects(null)
        ])
        setAreas(areasData || [])
        setProjects(projectsData || [])
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <header className="space-y-1 pt-6">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your planning system
        </p>
      </header>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Total Areas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{areas.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{projects.length}</p>
              </CardContent>
            </Card>
          </div>

          {areas.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground mb-4">
                  Get started by creating your first area
                </p>
                <div className="flex justify-center">
                  <Link to="/areas">
                    <Button>Create Area</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex gap-4">
              <Link to="/areas">
                <Button variant="outline">Manage Areas</Button>
              </Link>
              <Link to="/projects">
                <Button variant="outline">Manage Projects</Button>
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  )
}
