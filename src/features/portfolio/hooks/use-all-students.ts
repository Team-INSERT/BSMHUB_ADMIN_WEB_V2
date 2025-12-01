import { useQuery } from '@tanstack/react-query'
import supabase from '@/utils/supabase/client'
import { StudentPortfolio } from '../types/student-portfolio-types'

type ProfileLink = {
  link: string
  alt: string | null
}

type StudentWithDepartment = StudentPortfolio & {
  student_id: string
  department: string
}

export const useAllStudents = () => {
  const fetchAllStudents = async (): Promise<StudentWithDepartment[]> => {
    // Fetch all data in parallel with optimized queries
    const [studentsResult, profilesResult, studentJobsResult] = await Promise.all([
      supabase
        .from('student')
        .select('student_id, name, email, departments(department_name)')
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

    // Create lookup maps for O(1) access
    const profileMap = new Map()
    profilesResult.data?.forEach((profile) => {
      profileMap.set(profile.owner, profile)
    })

    const jobsMap = new Map()
    studentJobsResult.data?.forEach((sj: { student_id: string, jobs: { job_name: string } | null }) => {
      if (!jobsMap.has(sj.student_id)) {
        jobsMap.set(sj.student_id, [])
      }
      if (sj.jobs?.job_name) {
        jobsMap.get(sj.student_id).push(sj.jobs.job_name)
      }
    })

    // Map students with their data
    const studentsWithProfiles = studentsResult.data.map((student) => {
      type ProfileSkill = {
        skills: {
          skill_name: string
        }
      }

      type ProfileCompetition = {
        competition: {
          competition_name: string
        }
        prize: string
      }

      type ProjectContributor = {
        project: {
          project_id: number
          project_name: string
        }
      }

      type RawProfile = {
        description?: string
        profile_skills?: ProfileSkill[]
        profile_competitions?: ProfileCompetition[]
        project_contributors?: ProjectContributor[]
        profile_link?: ProfileLink[]
      }

      type Department = {
        department_name: string
      }

      const rawProfile = (profileMap.get(student.student_id) as RawProfile) || null
      const dreamJobs = jobsMap.get(student.student_id) || []

      return {
        student_id: student.student_id,
        name: student.name,
        description: rawProfile?.description ?? null,
        email: student.email,
        department:
          (student.departments as Department | null)?.department_name ||
          '미지정',
        dreamJob: dreamJobs.length > 0 ? dreamJobs.join(', ') : null,
        skills:
          rawProfile?.profile_skills?.map((s) => ({
            skill_name: s.skills.skill_name,
          })) || [],
        awards:
          rawProfile?.profile_competitions?.map((c) => ({
            competition_name: c.competition.competition_name,
            prize: c.prize,
          })) || [],
        projects:
          rawProfile?.project_contributors?.map((p) => ({
            project_id: p.project.project_id,
            project_name: p.project.project_name,
          })) || [],
        links: rawProfile?.profile_link || [],
      } as StudentWithDepartment
    })

    return studentsWithProfiles
  }

  return useQuery({
    queryKey: ['all-students'],
    queryFn: fetchAllStudents,
    staleTime: 300000,
  })
}
