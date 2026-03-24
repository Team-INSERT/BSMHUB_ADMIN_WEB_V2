import { Mail, Briefcase, Award, Folder, Link as LinkIcon, Code } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import Loader from '@/components/loader'
import { useStudentPortfolio } from '@/features/portfolio/hooks/use-student-portfolio'
import { PortfolioSection } from './portfolio-section'

type PortfolioPanelProps = {
  studentId: string | null
}

export const PortfolioPanel = ({ studentId }: PortfolioPanelProps) => {
  const { data: portfolio, isLoading, error } = useStudentPortfolio(studentId)

  if (!studentId) return null
  if (isLoading) return <Loader />
  if (error) return <div className="p-4 text-sm text-muted-foreground">포트폴리오를 불러올 수 없습니다</div>
  if (!portfolio) return null

  return (
    <div className="space-y-3 p-4">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">{portfolio.name}</h3>
        {portfolio.description && <p className="text-sm text-muted-foreground">{portfolio.description}</p>}
      </div>

      <Separator />

      {portfolio.email && (
        <div className="flex items-center gap-2 text-sm">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="truncate">{portfolio.email}</span>
        </div>
      )}

      <Separator />

      {portfolio.dreamJob && (
        <PortfolioSection title="희망 취업 직무" defaultOpen>
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <span>{portfolio.dreamJob}</span>
          </div>
        </PortfolioSection>
      )}

      {portfolio.skills.length > 0 && (
        <PortfolioSection title="기술 스택" defaultOpen>
          <div className="flex flex-wrap gap-1.5">
            <Code className="h-4 w-4 text-muted-foreground" />
            {portfolio.skills.map((skill, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {skill.skill_name}
              </Badge>
            ))}
          </div>
        </PortfolioSection>
      )}

      {portfolio.projects.length > 0 && (
        <PortfolioSection title="프로젝트">
          <div className="space-y-1.5">
            {portfolio.projects.map((project) => (
              <div key={project.project_id} className="flex items-center gap-2">
                <Folder className="h-4 w-4 text-muted-foreground" />
                <span>{project.project_name}</span>
              </div>
            ))}
          </div>
        </PortfolioSection>
      )}

      {portfolio.awards.length > 0 && (
        <PortfolioSection title="수상 경력">
          <div className="space-y-2">
            {portfolio.awards.map((award, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <Award className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div className="flex-1">
                  <div className="font-medium">{award.competition_name}</div>
                  <div className="text-xs text-muted-foreground">{award.prize}</div>
                </div>
              </div>
            ))}
          </div>
        </PortfolioSection>
      )}

      {portfolio.links.length > 0 && (
        <PortfolioSection title="링크">
          <div className="space-y-1.5">
            {portfolio.links.map((link, idx) => (
              <a
                key={idx}
                href={link.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <LinkIcon className="h-4 w-4" />
                <span className="truncate">{link.alt || link.link}</span>
              </a>
            ))}
          </div>
        </PortfolioSection>
      )}
    </div>
  )
}
