import { createLazyFileRoute } from '@tanstack/react-router'
import AnalyticsPredictionPage from '@/features/analytics/prediction'

export const Route = createLazyFileRoute('/_authenticated/analytics-prediction')({
  component: AnalyticsPredictionPage,
})
