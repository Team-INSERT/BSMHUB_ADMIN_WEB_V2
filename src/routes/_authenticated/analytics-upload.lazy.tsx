import { createLazyFileRoute } from '@tanstack/react-router'
import AnalyticsUploadPage from '@/features/analytics/upload'

export const Route = createLazyFileRoute('/_authenticated/analytics-upload')({
  component: AnalyticsUploadPage,
})
