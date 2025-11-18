import { createLazyFileRoute } from '@tanstack/react-router'
import AnalyticsDataPage from '@/features/analytics'

export const Route = createLazyFileRoute('/_authenticated/analytics-data')({
  component: AnalyticsDataPage,
})
