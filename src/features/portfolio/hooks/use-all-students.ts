import { useQuery } from '@tanstack/react-query'
import supabase from '@/utils/supabase/client'
import { StudentPortfolio } from '../types/student-portfolio-types'
import { getGenerationFromJoinAt } from '../utils/generation'

type StudentWithDepartment = StudentPortfolio & {
  student_id: string
  department: string
  generation: number | null
}

export const useAllStudents = () => {
  const fetchAllStudents = async (): Promise<StudentWithDepartment[]> => {
    const [studentsResult, profilesResult, studentJobsResult] = await Promise.all([
      supabase
        .from('student')
        .select('student_id, name, email, join_at, departments(department_name)')
        .order('name'),
      supabase
        .from('profile')
        .select(
          `owner,
            description,
            profile_skills(skills!fk_profile_skills_skill_id(skill_name)),
            profile_competitions(competition:competitions(competition_name), prize),
            project_contributors(project:projects(project_id, project_name)),
            profile_link(link, alt)`
        )
        .eq('is_team', false),
      supabase
        .from('student_jobs')
        .select('student_id, jobs(job_name)')
    ])

    if (studentsResult.error) throw studentsResult.error
    if (!studentsResult.data) return []

    const profileMap = new Map()
    profilesResult.data?.forEach((profile) => {
      profileMap.set(profile.owner, profile)
    })

    const jobsMap = new Map()
    studentJobsResult.data?.forEach((sj) => {
      if (!jobsMap.has(sj.student_id)) {
        jobsMap.set(sj.student_id, [])
      }
      if (sj.jobs?.job_name) {
        jobsMap.get(sj.student_id).push(sj.jobs.job_name)
      }
    })

    return studentsResult.data.map((student) => {
      const profile = profileMap.get(student.student_id)
      const dreamJobs = jobsMap.get(student.student_id) || []

      return {
        student_id: student.student_id,
        name: student.name,
        description: profile?.description ?? null,
        email: student.email,
        department: student.departments?.department_name || '미지정',
        dreamJob: dreamJobs.length > 0 ? dreamJobs.join(', ') : null,
        generation: getGenerationFromJoinAt(student.join_at),
        skills: profile?.profile_skills?.map((s) => ({
          skill_name: s.skills.skill_name,
        })) || [],
        awards: profile?.profile_competitions?.map((c) => ({
          competition_name: c.competition.competition_name,
          prize: c.prize,
        })) || [],
        projects: profile?.project_contributors?.map((p) => ({
          project_id: p.project.project_id,
          project_name: p.project.project_name,
        })) || [],
        links: profile?.profile_link || [],
      }
    })
  }

  return useQuery({
    queryKey: ['all-students'],
    queryFn: fetchAllStudents,
    staleTime: 300000,
  })
}
