import { createLazyFileRoute } from '@tanstack/react-router'
import CleanerUploadPage from '@/features/cleaner/upload'

export const Route = createLazyFileRoute('/_authenticated/cleaner-upload')({
  component: CleanerUploadPage,
})
