import { useQuery } from '@tanstack/react-query'
import supabase from '@/utils/supabase/client'
import { getCohort } from '@/utils/users/getCohort'
import { getFieldTrainingStatus } from '@/utils/users/getNowStatus'
import { User } from '../data/schema'

const toArray = <T>(value: T | T[] | null | undefined): T[] => {
  if (Array.isArray(value)) return value
  if (!value) return []
  return [value]
}

const seleteUserList = async () => {
  const { data, error } = await supabase.from('student')
    .select(`student_id, name, join_at, email, phone,
      field_training(*),
      employment_companies(*),
      military_services(*),
      student_universities(*)`)

  if (error) {
    throw new Error(error.message)
  }

  const returnData: User[] = data.map((student) => {
    const fieldTraining = toArray(student.field_training)
    const employmentCompanies = toArray(student.employment_companies)
    const militaryServices = toArray(student.military_services)
    const studentUniversities = toArray(student.student_universities)

    return {
      student_id: student.student_id,
      name: student.name,
      join_at: getCohort(student.join_at),
      email: student.email ?? '',
      phone: student.phone ?? '',
      user_status: getFieldTrainingStatus(
        fieldTraining,
        employmentCompanies,
        militaryServices,
        studentUniversities
      ),
    }
  })

  return returnData
}

export const useUserListQuery = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: seleteUserList,
    staleTime: 120000,
    retry: 3,
  })
}
