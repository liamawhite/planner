import { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { CreateProject, ListProjects, UpdateProject, DeleteProject, ListAreas, ListTasks } from '../../wailsjs/go/main/App'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
  notes: string
  created_at: any
  updated_at: any
}

export default function Projects() {
  const [areas, setAreas] = useState<Area[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [projectName, setProjectName] = useState('')
  const [projectAreaId, setProjectAreaId] = useState('')
  const [projectNotes, setProjectNotes] = useState('')
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
        await UpdateProject(editingProjectId, projectName || null, projectNotes || null)
      } else {
        await CreateProject(projectName, projectAreaId, projectNotes)
      }

      setProjectName('')
      setProjectAreaId('')
      setProjectNotes('')
      setEditingProjectId(null)
      setError('')
      await loadProjects()
    } catch (err) {
      setError(`Project operation failed: ${err}`)
    }
  }

  async function handleDeleteProject(id: string) {
    // Check if project has tasks
    try {
      const tasks = await ListTasks(id)
      if (tasks && tasks.length > 0) {
        setError('Cannot delete project with existing tasks. Please delete all tasks first.')
        return
      }
    } catch (err) {
      setError(`Failed to check project tasks: ${err}`)
      return
    }

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
    setProjectNotes(project.notes)
  }

  function handleCancelProjectEdit() {
    setEditingProjectId(null)
    setProjectName('')
    setProjectAreaId('')
    setProjectNotes('')
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
          <div className="space-y-2">
            <label htmlFor="projectNotes" className="text-sm font-medium leading-none">
              Notes
            </label>
            <Textarea
              id="projectNotes"
              placeholder="Additional notes or details about this project..."
              value={projectNotes}
              onChange={(e) => setProjectNotes(e.target.value)}
              className="min-h-[100px]"
            />
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
                  <div className="flex-1 space-y-0.5">
                    <Link
                      to="/projects/$projectId"
                      params={{ projectId: project.id }}
                    >
                      <h3 className="font-medium leading-none hover:underline cursor-pointer">{project.name}</h3>
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {getAreaName(project.area_id)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditProject(project)}
                      className="h-8 w-8"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                        <path d="m15 5 4 4"/>
                      </svg>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteProject(project.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"/>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                      </svg>
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
