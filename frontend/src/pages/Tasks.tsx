import { useState, useEffect } from 'react'
import { CreateTask, ListTasks, UpdateTask, DeleteTask, ListProjects } from '../../wailsjs/go/main/App'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Project {
  id: string
  name: string
  area_id: string
  created_at: any
  updated_at: any
}

interface Task {
  id: string
  name: string
  description: string
  project_id: string
  created_at: any
  updated_at: any
}

export default function Tasks() {
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [taskName, setTaskName] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [taskProjectId, setTaskProjectId] = useState('')
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [filterProjectId, setFilterProjectId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadProjects()
    loadTasks()
  }, [])

  useEffect(() => {
    loadTasks()
  }, [filterProjectId])

  async function loadProjects() {
    try {
      const result = await ListProjects(null)
      setProjects(result || [])
      setError('')
    } catch (err) {
      setError(`Failed to load projects: ${err}`)
    }
  }

  async function loadTasks() {
    try {
      const result = await ListTasks(filterProjectId)
      setTasks(result || [])
      setError('')
    } catch (err) {
      setError(`Failed to load tasks: ${err}`)
    }
  }

  async function handleTaskSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!taskProjectId && !editingTaskId) {
      setError('Please select a project for the task')
      return
    }

    try {
      if (editingTaskId) {
        await UpdateTask(editingTaskId, taskName || null, taskDescription || null)
      } else {
        await CreateTask(taskName, taskDescription, taskProjectId)
      }

      setTaskName('')
      setTaskDescription('')
      setTaskProjectId('')
      setEditingTaskId(null)
      setError('')
      await loadTasks()
    } catch (err) {
      setError(`Task operation failed: ${err}`)
    }
  }

  async function handleDeleteTask(id: string) {
    if (!confirm('Are you sure you want to delete this task?')) {
      return
    }

    try {
      await DeleteTask(id)
      setError('')
      await loadTasks()
    } catch (err) {
      setError(`Delete failed: ${err}`)
    }
  }

  function handleEditTask(task: Task) {
    setEditingTaskId(task.id)
    setTaskName(task.name)
    setTaskDescription(task.description)
    setTaskProjectId(task.project_id)
  }

  function handleCancelTaskEdit() {
    setEditingTaskId(null)
    setTaskName('')
    setTaskDescription('')
    setTaskProjectId('')
  }

  function getProjectName(projectId: string): string {
    const project = projects.find(p => p.id === projectId)
    return project?.name || 'Unknown Project'
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <header className="space-y-1 pt-6">
        <h1 className="text-3xl font-semibold tracking-tight">Tasks</h1>
        <p className="text-sm text-muted-foreground">Track and manage your work items</p>
      </header>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        <form onSubmit={handleTaskSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="taskName" className="text-sm font-medium leading-none">
                Task Name
              </label>
              <Input
                id="taskName"
                placeholder="e.g. Implement login feature, Write documentation"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="taskDescription" className="text-sm font-medium leading-none">
                Description
              </label>
              <Textarea
                id="taskDescription"
                placeholder="What needs to be done?"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="taskProject" className="text-sm font-medium leading-none">
                Project
              </label>
              <Select
                value={taskProjectId}
                onValueChange={setTaskProjectId}
                disabled={editingTaskId !== null}
                required
              >
                <SelectTrigger id="taskProject">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit">
              {editingTaskId ? 'Update' : 'Add Task'}
            </Button>
            {editingTaskId && (
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelTaskEdit}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>

        <div className="flex items-center gap-2">
          <label htmlFor="filterProject" className="text-sm font-medium">
            Filter by project:
          </label>
          <Select
            value={filterProjectId || "all"}
            onValueChange={(value) => setFilterProjectId(value === "all" ? null : value)}
          >
            <SelectTrigger id="filterProject" className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          {tasks.length === 0 ? (
            <div className="flex items-center justify-center rounded-lg border border-dashed p-8">
              <p className="text-sm text-muted-foreground">
                {filterProjectId
                  ? 'No tasks in this project yet. Add one above.'
                  : 'No tasks yet. Add your first task above.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
                >
                  <div className="space-y-1 flex-1">
                    <h3 className="font-medium leading-none">{task.name}</h3>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {getProjectName(task.project_id)}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditTask(task)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTask(task.id)}
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
