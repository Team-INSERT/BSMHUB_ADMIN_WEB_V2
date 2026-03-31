import { useMutation } from '@tanstack/react-query'
import supabase from '@/utils/supabase/client'
import { Database } from '@/utils/supabase/database.types'

type MilitaryServiceInsert =
  Database['public']['Tables']['military_services']['Insert']
type MilitaryServiceUpdate =
  Database['public']['Tables']['military_services']['Update']

export type MilitaryServiceEditType = {
  action: 'add' | 'update' | 'delete'
  datas: {
    military_service: {
      student_id: string
      start_date: string
      end_date?: string | null
      military_service_status_id: number
      original_start_date?: string
    }
  }
}[]

const handleMilitaryService = async (editDataList: MilitaryServiceEditType) => {
  for (const editData of editDataList) {
    const data = editData.datas.military_service

    if (
      !data ||
      !data.student_id ||
      !data.start_date ||
      !data.military_service_status_id
    ) {
      throw new Error('누락된 군 복무 정보가 있습니다.')
    }

    const insertData: MilitaryServiceInsert = {
      student_id: data.student_id,
      start_date: data.start_date,
      end_date: data.end_date ?? null,
      military_service_status_id: data.military_service_status_id,
    }

    const updateData: MilitaryServiceUpdate = {
      start_date: data.start_date,
      end_date: data.end_date ?? null,
      military_service_status_id: data.military_service_status_id,
    }

    switch (editData.action) {
      case 'add': {
        const { error } = await supabase
          .from('military_services')
          .insert([insertData])
        if (error) throw new Error(error.message)
        break
      }
      case 'update': {
        const filterStartDate = data.original_start_date ?? data.start_date
        const { error } = await supabase
          .from('military_services')
          .update(updateData)
          .eq('student_id', data.student_id)
          .eq('start_date', filterStartDate)
        if (error) throw new Error(error.message)
        break
      }
      case 'delete': {
        const { error } = await supabase
          .from('military_services')
          .delete()
          .eq('student_id', data.student_id)
          .eq('start_date', data.start_date)
        if (error) throw new Error(error.message)
        break
      }
    }
  }
}

export const useHandleMilitaryServiceMutation = () => {
  const mutation = useMutation({
    mutationFn: handleMilitaryService,
  })

  return {
    ...mutation,
    isLoading: mutation.isPending,
  }
}
