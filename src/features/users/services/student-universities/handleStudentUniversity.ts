import { useMutation } from '@tanstack/react-query'
import supabase from '@/utils/supabase/client'

export type StudentUniversityEditType = {
  action: 'add' | 'delete'
  datas: {
    student_university: {
      student_id: string
      university_name?: string
      university_department?: string
      university_id?: number
    }
  }
}[]

const handleStudentUniversity = async (
  editDataList: StudentUniversityEditType
) => {
  for (const editData of editDataList) {
    const data = editData.datas.student_university

    if (!data || !data.student_id) {
      throw new Error('누락된 대학교 정보가 있습니다.')
    }

    switch (editData.action) {
      case 'add': {
        // 기존 대학교 검색
        let universityId: number

        if (data.university_id) {
          // university_id가 직접 주어진 경우 검색 생략
          universityId = data.university_id
        } else {
          if (!data.university_name || !data.university_department) {
            throw new Error('대학교명과 학과명을 입력해주세요.')
          }
          const { data: existing } = await supabase
            .from('universities')
            .select('university_id')
            .eq('university_name', data.university_name)
            .eq('university_department', data.university_department)
            .maybeSingle()

          if (existing) {
            universityId = existing.university_id
          } else {
            // 없으면 새로 생성
            const { data: inserted, error: insertError } = await supabase
              .from('universities')
              .insert([{
                university_name: data.university_name,
                university_department: data.university_department,
              }])
              .select('university_id')
              .single()
            if (insertError) throw new Error(insertError.message)
            if (!inserted) throw new Error('대학교 정보를 생성할 수 없습니다.')
            universityId = inserted.university_id
          }
        }

        // 이미 등록된 대학교인지 확인
        const { data: existing_link } = await supabase
          .from('student_universities')
          .select('student_id')
          .eq('student_id', data.student_id)
          .eq('university_id', universityId)
          .maybeSingle()

        if (existing_link) {
          throw new Error('이미 등록된 대학교입니다.')
        }

        const { error } = await supabase.from('student_universities').insert([
          {
            student_id: data.student_id,
            university_id: universityId,
            created_at: new Date().toISOString(),
          },
        ])
        if (error) throw new Error(error.message)
        break
      }
      case 'delete': {
        if (!data.university_id) {
          throw new Error('삭제할 대학교 ID가 없습니다.')
        }
        const { error } = await supabase
          .from('student_universities')
          .delete()
          .eq('student_id', data.student_id)
          .eq('university_id', data.university_id)
        if (error) throw new Error(error.message)
        break
      }
    }
  }
}

export const useHandleStudentUniversityMutation = () => {
  const mutation = useMutation({
    mutationFn: handleStudentUniversity,
  })

  return {
    ...mutation,
    isLoading: mutation.isPending,
  }
}
