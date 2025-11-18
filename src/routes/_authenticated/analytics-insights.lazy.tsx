import { createLazyFileRoute } from '@tanstack/react-router'
import AnalyticsInsightsPage from '@/features/analytics/insights'

export const Route = createLazyFileRoute('/_authenticated/analytics-insights')({
  component: AnalyticsInsightsPage,
})
