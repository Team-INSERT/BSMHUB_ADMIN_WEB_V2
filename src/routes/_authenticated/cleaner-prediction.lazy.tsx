import { createLazyFileRoute } from '@tanstack/react-router'
import CleanerPredictionPage from '@/features/cleaner/prediction'

export const Route = createLazyFileRoute('/_authenticated/cleaner-prediction')({
  component: CleanerPredictionPage,
})
