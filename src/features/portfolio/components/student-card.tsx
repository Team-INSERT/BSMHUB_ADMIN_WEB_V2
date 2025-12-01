import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Briefcase, Award, Folder, Link as LinkIcon, Code, Mail } from 'lucide-react'

type StudentCardProps = {
  name: string
  description: string | null
  email: string | null
  department: string
  dreamJob: string | null
  skills: { skill_name: string }[]
  awards: { competition_name: string; prize: string }[]
  projects: { project_id: number; project_name: string }[]
  links: { link: string; alt: string | null }[]
  onClick: () => void
}

export const StudentCard = ({
  name,
  description,
  email,
  department,
  dreamJob,
  skills,
  awards,
  projects,
  links,
  onClick,
}: StudentCardProps) => (
  <Card className="flex h-[380px] cursor-pointer flex-col transition-all hover:shadow-lg hover:border-primary/50" onClick={onClick}>
    <CardHeader className="pb-3">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
          <User className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg truncate">{name}</h3>
          <Badge variant="secondary" className="mt-1">
            {department}
          </Badge>
        </div>
      </div>
    </CardHeader>

    <CardContent className="flex-1 space-y-3 overflow-hidden">
      <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
        {description || '한줄소개가 작성되지 않았습니다.'}
      </p>

      {email && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">{email}</span>
        </div>
      )}

      <div className="flex items-center gap-2 text-sm">
        <Briefcase className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
        <span className="truncate">{dreamJob ? `${dreamJob} 희망` : '희망직무 없음'}</span>
      </div>

      <div className="space-y-2 pt-2">
        <div className="flex items-center gap-2 text-sm">
          <Code className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
          <span className="text-muted-foreground">
            기술 스택 {skills.length}개
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Award className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
          <span className="text-muted-foreground">수상 {awards.length}건</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Folder className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
          <span className="text-muted-foreground">프로젝트 {projects.length}개</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <LinkIcon className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
          <span className="text-muted-foreground">링크 {links.length}개</span>
        </div>
      </div>
    </CardContent>
  </Card>
)
