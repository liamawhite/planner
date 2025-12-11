import { createFileRoute } from '@tanstack/react-router'
import Areas from '@/pages/Areas'

export const Route = createFileRoute('/areas')({
  component: Areas,
})
