import { createLazyFileRoute } from '@tanstack/react-router'
import CleanerInsightsPage from '@/features/cleaner/insights'

export const Route = createLazyFileRoute('/_authenticated/cleaner-insights')({
  component: CleanerInsightsPage,
})
