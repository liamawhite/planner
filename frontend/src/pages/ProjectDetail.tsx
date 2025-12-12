import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  CreateTask,
  ListTasks,
  UpdateTask,
  DeleteTask,
  GetProject,
  UpdateProject,
  DeleteProject
} from '../../wailsjs/go/main/App'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface Project {
  id: string
  name: string
  area_id: string
  notes: string
  created_at: any
  updated_at: any
}

interface Task {
  id: string
  name: string
  notes: string
  project_id: string
  created_at: any
  updated_at: any
}

interface ProjectDetailProps {
  projectId: string
}

export default function ProjectDetail({ projectId }: ProjectDetailProps) {
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [taskName, setTaskName] = useState('')
  const [taskNotes, setTaskNotes] = useState('')
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingProjectName, setEditingProjectName] = useState<string | null>(null)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadProject()
    loadTasks()
  }, [projectId])

  async function loadProject() {
    try {
      const result = await GetProject(projectId)
      setProject(result)
      setError('')
    } catch (err) {
      setError(`Failed to load project: ${err}`)
    }
  }

  async function loadTasks() {
    try {
      const result = await ListTasks(projectId)
      setTasks(result || [])
      setError('')
    } catch (err) {
      setError(`Failed to load tasks: ${err}`)
    }
  }

  async function handleTaskSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      if (editingTaskId) {
        await UpdateTask(editingTaskId, taskName || null, taskNotes || null)
      } else {
        await CreateTask(taskName, taskNotes, projectId)
      }

      setTaskName('')
      setTaskNotes('')
      setEditingTaskId(null)
      setShowTaskForm(false)
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
    setTaskNotes(task.notes)
    setShowTaskForm(true)
  }

  function handleCancelTaskEdit() {
    setEditingTaskId(null)
    setTaskName('')
    setTaskNotes('')
    setShowTaskForm(false)
  }

  async function handleUpdateProjectName() {
    if (!project || !editingProjectName) return

    try {
      await UpdateProject(project.id, editingProjectName, null)
      setEditingProjectName(null)
      setError('')
      await loadProject()
    } catch (err) {
      setError(`Failed to update project: ${err}`)
    }
  }

  async function handleDeleteProject() {
    if (!project) return

    // Check if project has tasks
    if (tasks.length > 0) {
      setError('Cannot delete project with existing tasks. Please delete all tasks first.')
      return
    }

    if (!confirm('Are you sure you want to delete this project?')) {
      return
    }

    try {
      await DeleteProject(project.id)
      navigate({ to: '/projects' })
    } catch (err) {
      setError(`Delete failed: ${err}`)
    }
  }

  if (!project) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <p className="text-muted-foreground">Loading project...</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <header className="space-y-4 pt-6">
        <div className="flex items-center justify-between">
          {editingProjectName !== null ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={editingProjectName}
                onChange={(e) => setEditingProjectName(e.target.value)}
                className="text-3xl font-semibold tracking-tight"
                placeholder="Project name"
                autoFocus
              />
              <Button onClick={handleUpdateProjectName}>Save</Button>
              <Button
                variant="outline"
                onClick={() => setEditingProjectName(null)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight">{project.name}</h1>
                <p className="text-sm text-muted-foreground">Manage tasks for this project</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingProjectName(project.name)}
                >
                  Rename
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteProject}
                  className="text-destructive hover:text-destructive"
                >
                  Delete Project
                </Button>
              </div>
            </>
          )}
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Tasks</h2>
          {tasks.length === 0 ? (
            <div className="flex items-center justify-center rounded-lg border border-dashed p-8">
              <p className="text-sm text-muted-foreground">
                No tasks yet. Click "Add task" below to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
                >
                  <div className="space-y-1 flex-1">
                    <h3 className="font-medium leading-none">{task.name}</h3>
                    {task.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{task.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-1 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditTask(task)}
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
                      onClick={() => handleDeleteTask(task.id)}
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

          {showTaskForm ? (
            <form onSubmit={handleTaskSubmit} className="rounded-lg border bg-card">
              <div className="p-4 space-y-3">
                <Input
                  id="taskName"
                  placeholder="Task name"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  required
                  autoFocus
                  className="border-0 px-0 text-base focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <Textarea
                  id="taskNotes"
                  placeholder="Description"
                  value={taskNotes}
                  onChange={(e) => setTaskNotes(e.target.value)}
                  className="border-0 px-0 text-sm resize-none focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[60px]"
                />
              </div>
              <div className="flex items-center justify-between border-t px-4 py-3 bg-muted/30">
                <div className="text-sm text-muted-foreground">
                  {editingTaskId ? 'Editing task' : 'New task'}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelTaskEdit}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    {editingTaskId ? 'Save' : 'Add task'}
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowTaskForm(true)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              <span className="text-lg">+</span>
              <span>Add task</span>
            </button>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Notes</h2>
          <Textarea
            value={project.notes}
            onChange={(e) => {
              setProject({ ...project, notes: e.target.value })
            }}
            onBlur={async () => {
              try {
                await UpdateProject(project.id, null, project.notes)
                setError('')
              } catch (err) {
                setError(`Failed to update notes: ${err}`)
              }
            }}
            placeholder="Add notes about this project..."
            className="min-h-[150px]"
          />
        </div>
      </div>
    </div>
  )
}
