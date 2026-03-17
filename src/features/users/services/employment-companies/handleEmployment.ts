import { useMutation } from '@tanstack/react-query'
import supabase from '@/utils/supabase/client'
import { Database } from '@/utils/supabase/database.types'
import { UserEditType } from '../../data/schema'

type EmploymentCompaniesInsert =
  Database['public']['Tables']['employment_companies']['Insert']
export type EmploymentCompaniesUpdate =
  Database['public']['Tables']['employment_companies']['Update']

// 실제 취업 데이터 처리 함수 (mutationFn)
const handleEmployment = async (editDataList: UserEditType) => {
  for (const editData of editDataList) {
    if (!('employment_companies' in editData.datas)) continue
    const data = editData.datas.employment_companies
    if (
      !data ||
      !data.company_id ||
      !data.job_id ||
      !data.start_date ||
      !data.student_id
    ) {
      throw new Error('누락된 취업 정보가 있습니다.')
    }

    const insertData: EmploymentCompaniesInsert = {
      student_id: data.student_id,
      company_id: data.company_id,
      job_id: data.job_id,
      start_date: data.start_date,
      end_date: data.end_date,
    }

    const updateData: EmploymentCompaniesUpdate = {
      start_date: data.start_date,
      end_date: data.end_date,
      job_id: data.job_id,
    }

    switch (editData.action) {
      case 'add': {
        const { error } = await supabase
          .from('employment_companies')
          .upsert([{ ...insertData, deleted_at: null }], { ignoreDuplicates: false })
        if (error) throw new Error(error.message)
        break
      }
      case 'update': {
        const filterStartDate = data.original_start_date ?? data.start_date
        const { error } = await supabase
          .from('employment_companies')
          .update(updateData)
          .eq('student_id', data.student_id)
          .eq('company_id', data.company_id)
          .eq('start_date', filterStartDate)
          .is('deleted_at', null)
        if (error) throw new Error(error.message)
        break
      }
      case 'delete': {
        const { error } = await supabase
          .from('employment_companies')
          .update({ deleted_at: new Date().toISOString() })
          .eq('student_id', data.student_id)
          .eq('company_id', data.company_id)
          .eq('job_id', data.job_id)
          .is('deleted_at', null)
        if (error) throw new Error(error.message)
        break
      }
    }
  }
}

// react-query mutation hook
export const useHandleEmploymentMutation = () => {
  const mutation = useMutation({
    mutationFn: handleEmployment,
  })

  return {
    ...mutation,
    isLoading: mutation.isPending,
  }
}
