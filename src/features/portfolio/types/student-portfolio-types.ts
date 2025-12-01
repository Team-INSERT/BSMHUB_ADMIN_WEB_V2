import { Tables } from '@/utils/supabase/database.types'

export type StudentPortfolio = {
  name: string
  description: string | null
  email: string | null
  dreamJob: string | null
  skills: { skill_name: string }[]
  awards: { competition_name: string; prize: string }[]
  projects: { project_id: number; project_name: string }[]
  links: { link: string; alt: string | null }[]
}

export type ProfileData = Tables<'profile'> & {
  profile_skills: { skills: Tables<'skills'> }[]
  profile_competitions: { competition: Tables<'competitions'>; prize: string }[]
  project_contributors: {
    project: Pick<Tables<'projects'>, 'project_id' | 'project_name'>
  }[]
  profile_link: { link: string; alt: string | null }[]
}
