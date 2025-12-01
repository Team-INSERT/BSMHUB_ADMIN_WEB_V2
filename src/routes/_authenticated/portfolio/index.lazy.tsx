import { createLazyFileRoute } from '@tanstack/react-router'
import Portfolio from '@/features/portfolio'

export const Route = createLazyFileRoute('/_authenticated/portfolio/')({
  component: Portfolio,
})
