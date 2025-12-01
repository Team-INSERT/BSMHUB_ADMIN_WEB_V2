import { useQuery } from '@tanstack/react-query'
import supabase from '@/utils/supabase/client'
import { StudentPortfolio, ProfileData } from '../types/student-portfolio-types'

export const useStudentPortfolio = (studentId: string | null) => {
  const fetchPortfolio = async (): Promise<StudentPortfolio | null> => {
    if (!studentId) return null

    const [studentData, profileData, studentJobsData] = await Promise.all([
      supabase
        .from('student')
        .select('name, email')
        .eq('student_id', studentId)
        .single(),
      supabase
        .from('profile')
        .select(
          `description,
            profile_skills(skills!fk_profile_skills_skill_id(skill_name)),
            profile_competitions(competition:competitions(competition_name), prize),
            project_contributors(project:projects(project_id, project_name)),
            profile_link(link, alt)`
        )
        .eq('owner', studentId)
        .eq('is_team', false)
        .limit(1)
        .single(),
      supabase
        .from('student_jobs')
        .select('jobs(job_name)')
        .eq('student_id', studentId),
    ])

    if (studentData.error) throw studentData.error

    const profile = (profileData.data as ProfileData) || null
    const dreamJobs =
      studentJobsData.data
        ?.map(
          (item: { jobs: { job_name: string } | null }) => item.jobs?.job_name
        )
        .filter(Boolean) || []

    return {
      name: studentData.data.name,
      description: profile?.description ?? null,
      email: studentData.data.email,
      dreamJob: dreamJobs.length > 0 ? dreamJobs.join(', ') : null,
      skills:
        profile?.profile_skills?.map((s) => ({
          skill_name: s.skills.skill_name,
        })) || [],
      awards:
        profile?.profile_competitions?.map((c) => ({
          competition_name: c.competition.competition_name,
          prize: c.prize,
        })) || [],
      projects:
        profile?.project_contributors?.map((p) => ({
          project_id: p.project.project_id,
          project_name: p.project.project_name,
        })) || [],
      links: profile?.profile_link || [],
    }
  }

  return useQuery({
    queryKey: ['student-portfolio', studentId],
    queryFn: fetchPortfolio,
    enabled: !!studentId,
    staleTime: 300000,
  })
}
