import { useState, useEffect } from 'react'
import { CreateArea, ListAreas, UpdateArea, DeleteArea, ListProjects } from '../../wailsjs/go/main/App'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Area {
  id: string
  name: string
  description: string
  created_at: any
  updated_at: any
}

export default function Areas() {
  const [areas, setAreas] = useState<Area[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadAreas()
  }, [])

  async function loadAreas() {
    try {
      const result = await ListAreas()
      setAreas(result || [])
      setError('')
    } catch (err) {
      setError(`Failed to load areas: ${err}`)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      if (editingId) {
        await UpdateArea(editingId, name || null, description || null)
      } else {
        await CreateArea(name, description)
      }

      setName('')
      setDescription('')
      setEditingId(null)
      setError('')
      await loadAreas()
    } catch (err) {
      setError(`Operation failed: ${err}`)
    }
  }

  async function handleDelete(id: string) {
    // Check if area has projects
    try {
      const projects = await ListProjects(id)
      if (projects && projects.length > 0) {
        setError('Cannot delete area with existing projects. Please delete all projects first.')
        return
      }
    } catch (err) {
      setError(`Failed to check area projects: ${err}`)
      return
    }

    if (!confirm('Are you sure you want to delete this area?')) {
      return
    }

    try {
      await DeleteArea(id)
      setError('')
      await loadAreas()
    } catch (err) {
      setError(`Delete failed: ${err}`)
    }
  }

  function handleEdit(area: Area) {
    setEditingId(area.id)
    setName(area.name)
    setDescription(area.description)
  }

  function handleCancelEdit() {
    setEditingId(null)
    setName('')
    setDescription('')
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <header className="space-y-1 pt-6">
        <h1 className="text-3xl font-semibold tracking-tight">Areas</h1>
        <p className="text-sm text-muted-foreground">Manage your areas of focus</p>
      </header>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium leading-none">
                Name
              </label>
              <Input
                id="name"
                placeholder="e.g. Work, Personal, Learning"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium leading-none">
                Description
              </label>
              <Input
                id="description"
                placeholder="Optional description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit">
              {editingId ? 'Update' : 'Add Area'}
            </Button>
            {editingId && (
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelEdit}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>

        <div className="space-y-4">
          {areas.length === 0 ? (
            <div className="flex items-center justify-center rounded-lg border border-dashed p-8">
              <p className="text-sm text-muted-foreground">No areas yet. Add your first area above.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {areas.map((area) => (
                <div
                  key={area.id}
                  className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
                >
                  <div className="space-y-0.5">
                    <h3 className="font-medium leading-none">{area.name}</h3>
                    {area.description && (
                      <p className="text-sm text-muted-foreground">{area.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(area)}
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
                      onClick={() => handleDelete(area.id)}
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
