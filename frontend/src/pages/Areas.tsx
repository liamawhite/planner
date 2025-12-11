import { useState, useEffect } from 'react'
import { CreateArea, ListAreas, UpdateArea, DeleteArea } from '../../wailsjs/go/main/App'
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
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(area)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(area.id)}
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
