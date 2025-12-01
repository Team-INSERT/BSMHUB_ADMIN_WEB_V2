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
    // Fetch all students with their basic info and department
    const { data: studentsData, error: studentsError } = await supabase
      .from('student')
      .select('student_id, name, email, departments(department_name)')
      .order('name')

    if (studentsError) throw studentsError
    if (!studentsData) return []

    // For each student, fetch their profile data
    const studentsWithProfiles = await Promise.all(
      studentsData.map(async (student) => {
        const [profileData, studentJobsData] = await Promise.all([
          supabase
            .from('profile_permission')
            .select(
              `profile(
                description,
                profile_skills(skills!fk_profile_skills_skill_id(skill_name)),
                profile_competitions(competition:competitions(competition_name), prize),
                project_contributors(project:projects(project_id, project_name)),
                profile_link(link, alt)
              )`
            )
            .eq('student_id', student.student_id)
            .eq('profile.is_team', false)
            .limit(1)
            .single(),
          supabase
            .from('student_jobs')
            .select('jobs(job_name)')
            .eq('student_id', student.student_id),
        ])

        // Extract profile data
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

        const rawProfile = (profileData.data?.profile as RawProfile) || null

        const dreamJobs =
          studentJobsData.data
            ?.map(
              (item: { jobs: { job_name: string } | null }) =>
                item.jobs?.job_name
            )
            .filter(Boolean) || []

        type Department = {
          department_name: string
        }

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
    )

    return studentsWithProfiles
  }

  return useQuery({
    queryKey: ['all-students'],
    queryFn: fetchAllStudents,
    staleTime: 300000,
  })
}
