import { useQuery } from '@tanstack/react-query'
import supabase from '@/utils/supabase/client'

const selectUniversityList = async () => {
  const { data, error } = await supabase.from('universities').select('*')

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export const useUniversityListQuery = () => {
  return useQuery({
    queryKey: ['universities'],
    queryFn: selectUniversityList,
    staleTime: 240000,
    retry: 2,
  })
}
