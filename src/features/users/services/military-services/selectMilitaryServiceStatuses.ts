import { useQuery } from '@tanstack/react-query'
import supabase from '@/utils/supabase/client'

const selectMilitaryServiceStatuses = async () => {
  const { data, error } = await supabase
    .from('military_service_statuses')
    .select('military_service_status_id, military_service_status_name')

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export const useMilitaryServiceStatusListQuery = () => {
  return useQuery({
    queryKey: ['military-service-statuses'],
    queryFn: selectMilitaryServiceStatuses,
    staleTime: 240000,
    retry: 2,
  })
}
