import { useQuery, UseQueryResult } from '@tanstack/react-query'
import supabase from '@/utils/supabase/client'
import { UserDetailType } from '../data/schema'

export const useUserDetailQuery = (
  student_id: string
): UseQueryResult<UserDetailType, Error> => {
  const selectUserDatas = async () => {
    const { data, error } = await supabase
      .from('student')
      .select(
        `*,
        departments(*),
        student_jobs(
          jobs(*)
        ),
        student_after_courses(
          grade,
          after_courses(*)
        ),
        student_certificates(
          certificates(*)
        ),
        field_training!left(
          *,
          companies(*),
          jobs(*)
        ),
        employment_companies!left(
          *,
          companies(*),
          jobs(*)
        ),
        student_universities(
          *,
          universities(*)
        ),
        military_services(
          *,
          military_service_statuses(military_service_status_name)
        ),
        student_middle_schools(
          *,
          middle_schools(*)
        )
      `
      )
      .eq('student_id', student_id)
      .single()

    if (error) {
      console.error('Error : ', error)
      throw new Error(error.message)
    }

    return data
  }

  const selectProfileDatas = async () => {
    const { data, error } = await supabase
      .from('profile_permission')
      .select(
        `
        profile(
          profile_skills(
            skills!fk_profile_skills_skill_id(*)
          ),
          project_contributors (
            project:projects(project_id, project_name)
          ),
          profile_competitions (
            competition:competitions(*),
            prize
          )
        ) 
      `
      )
      .eq('student_id', student_id)
      .eq('profile.is_team', false)
      .limit(1)

    if (error) {
      console.error('Error : ', error)
      throw new Error(error.message)
    }

    return data
  }

  const selectUserDetail = async (): Promise<UserDetailType> => {
    const userDatas = await selectUserDatas()
    const profileDatas = await selectProfileDatas()

    if (!userDatas || !profileDatas) {
      throw new Error('User data or profile data not found')
    }

    const { profile } = profileDatas[0] || {}

    return {
      ...userDatas,
      profile: profile,
    } as UserDetailType
  }

  return useQuery({
    queryKey: [`user-${student_id}`],
    queryFn: selectUserDetail,
    staleTime: 120000,
    retry: 3,
  })
}
