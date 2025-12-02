export const getGenerationFromJoinAt = (joinAt: string | null | undefined): number | null => {
  if (!joinAt) return null
  const year = new Date(joinAt).getFullYear()
  return year - 2020
}
