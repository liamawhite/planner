import { createFileRoute } from '@tanstack/react-router'
import ProjectDetail from '@/pages/ProjectDetail'

export const Route = createFileRoute('/projects/$projectId')({
  component: () => {
    const { projectId } = Route.useParams()
    return <ProjectDetail projectId={projectId} />
  },
})
