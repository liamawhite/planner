import { useState, useEffect } from 'react'
import { CreateProject, ListProjects, UpdateProject, DeleteProject, ListAreas } from '../../wailsjs/go/main/App'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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

export default function Projects() {
  const [areas, setAreas] = useState<Area[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [projectName, setProjectName] = useState('')
  const [projectAreaId, setProjectAreaId] = useState('')
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [filterAreaId, setFilterAreaId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadAreas()
    loadProjects()
  }, [])

  useEffect(() => {
    loadProjects()
  }, [filterAreaId])

  async function loadAreas() {
    try {
      const result = await ListAreas()
      setAreas(result || [])
      setError('')
    } catch (err) {
      setError(`Failed to load areas: ${err}`)
    }
  }

  async function loadProjects() {
    try {
      const result = await ListProjects(filterAreaId)
      setProjects(result || [])
      setError('')
    } catch (err) {
      setError(`Failed to load projects: ${err}`)
    }
  }

  async function handleProjectSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!projectAreaId && !editingProjectId) {
      setError('Please select an area for the project')
      return
    }

    try {
      if (editingProjectId) {
        await UpdateProject(editingProjectId, projectName || null)
      } else {
        await CreateProject(projectName, projectAreaId)
      }

      setProjectName('')
      setProjectAreaId('')
      setEditingProjectId(null)
      setError('')
      await loadProjects()
    } catch (err) {
      setError(`Project operation failed: ${err}`)
    }
  }

  async function handleDeleteProject(id: string) {
    if (!confirm('Are you sure you want to delete this project?')) {
      return
    }

    try {
      await DeleteProject(id)
      setError('')
      await loadProjects()
    } catch (err) {
      setError(`Delete failed: ${err}`)
    }
  }

  function handleEditProject(project: Project) {
    setEditingProjectId(project.id)
    setProjectName(project.name)
    setProjectAreaId(project.area_id)
  }

  function handleCancelProjectEdit() {
    setEditingProjectId(null)
    setProjectName('')
    setProjectAreaId('')
  }

  function getAreaName(areaId: string): string {
    const area = areas.find(a => a.id === areaId)
    return area?.name || 'Unknown Area'
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <header className="space-y-1 pt-6">
        <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
        <p className="text-sm text-muted-foreground">Organize your work within areas</p>
      </header>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        <form onSubmit={handleProjectSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="projectName" className="text-sm font-medium leading-none">
                Project Name
              </label>
              <Input
                id="projectName"
                placeholder="e.g. Build new feature, Learn TypeScript"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="projectArea" className="text-sm font-medium leading-none">
                Area
              </label>
              <Select
                value={projectAreaId}
                onValueChange={setProjectAreaId}
                disabled={editingProjectId !== null}
                required
              >
                <SelectTrigger id="projectArea">
                  <SelectValue placeholder="Select an area" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit">
              {editingProjectId ? 'Update' : 'Add Project'}
            </Button>
            {editingProjectId && (
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelProjectEdit}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>

        <div className="flex items-center gap-2">
          <label htmlFor="filterArea" className="text-sm font-medium">
            Filter by area:
          </label>
          <Select
            value={filterAreaId || "all"}
            onValueChange={(value) => setFilterAreaId(value === "all" ? null : value)}
          >
            <SelectTrigger id="filterArea" className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Areas</SelectItem>
              {areas.map((area) => (
                <SelectItem key={area.id} value={area.id}>
                  {area.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          {projects.length === 0 ? (
            <div className="flex items-center justify-center rounded-lg border border-dashed p-8">
              <p className="text-sm text-muted-foreground">
                {filterAreaId
                  ? 'No projects in this area yet. Add one above.'
                  : 'No projects yet. Add your first project above.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
                >
                  <div className="space-y-0.5">
                    <h3 className="font-medium leading-none">{project.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {getAreaName(project.area_id)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditProject(project)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteProject(project.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
