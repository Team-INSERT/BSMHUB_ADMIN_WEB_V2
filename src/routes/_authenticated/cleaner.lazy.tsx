import { createLazyFileRoute } from '@tanstack/react-router'
import CleanerPage from '@/features/cleaner'

export const Route = createLazyFileRoute('/_authenticated/cleaner')({
  component: CleanerPage,
})
