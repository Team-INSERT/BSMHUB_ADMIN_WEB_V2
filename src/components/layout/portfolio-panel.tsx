import Loader from '@/components/loader'
import { useStudentPortfolio } from '@/features/portfolio/hooks/use-student-portfolio'

type PortfolioPanelProps = {
  studentId: string | null
}

const SectionHeader = ({ title }: { title: string }) => (
  <div className='flex flex-col gap-[10px]'>
    <div className='flex items-center gap-[3px]'>
      <div className='h-[7.7px] w-[7.6px] shrink-0 rounded-[1px] bg-[#0c89cd]' />
      <span className='text-[13.4px] font-bold leading-[16.7px] text-[#0c89cd] whitespace-nowrap'>
        {title}
      </span>
    </div>
    <div className='h-px w-full bg-[#0c89cd] opacity-30' />
  </div>
)

export const PortfolioPanel = ({ studentId }: PortfolioPanelProps) => {
  const { data: portfolio, isLoading, error } = useStudentPortfolio(studentId)

  if (!studentId) return null
  if (isLoading) return <Loader />
  if (error)
    return (
      <div className='p-4 text-sm text-muted-foreground'>
        포트폴리오를 불러올 수 없습니다
      </div>
    )
  if (!portfolio) return null

  return (
    <div className='flex flex-col gap-6 p-4 w-full'>
      {/* 프로필 헤더 */}
      <div className='flex flex-col gap-5'>
        <div className='flex gap-5 items-center'>
          {/* 프로필 이미지 자리 */}
          <div className='h-[140px] w-[110px] shrink-0 rounded bg-muted' />

          <div className='flex flex-col justify-between h-[140px] flex-1'>
            <div className='flex flex-col gap-1.5'>
              <p className='text-xl font-bold text-foreground'>
                {portfolio.name}
              </p>
              {portfolio.email && (
                <p className='text-sm text-muted-foreground'>{portfolio.email}</p>
              )}
              {portfolio.description && (
                <p className='text-xs leading-5 text-[#0c89cd] mt-0.5'>
                  {portfolio.description}
                </p>
              )}
            </div>

            {portfolio.dreamJob && (
              <div className='flex flex-col gap-1'>
                <div className='flex items-center gap-[3px]'>
                  <div className='h-[7.7px] w-[7.6px] shrink-0 rounded-[1px] bg-[#0c89cd]' />
                  <span className='text-[13.4px] font-bold leading-[16.7px] text-[#0c89cd] whitespace-nowrap'>
                    희망 취업 분야
                  </span>
                </div>
                <p className='text-sm text-foreground'>{portfolio.dreamJob}</p>
              </div>
            )}
          </div>
        </div>

        {/* 하단 섹션들 */}
        <div className='flex flex-col gap-10'>
          {portfolio.skills.length > 0 && (
            <div className='flex flex-col gap-3'>
              <SectionHeader title='언어 / 기술 / 스택' />
              <p className='text-sm text-foreground'>
                {portfolio.skills.map((s) => s.skill_name).join(', ')}
              </p>
            </div>
          )}

          {portfolio.awards.length > 0 && (
            <div className='flex flex-col gap-3'>
              <SectionHeader title='수상경력' />
              <div className='flex flex-col text-sm text-foreground'>
                {portfolio.awards.map((award, idx) => (
                  <p key={idx} className={idx === 0 ? 'leading-[16.7px]' : 'leading-6 mt-1'}>
                    ▪ {award.competition_name} {award.prize}
                  </p>
                ))}
              </div>
            </div>
          )}

          {portfolio.projects.length > 0 && (
            <div className='flex flex-col gap-3'>
              <SectionHeader title='프로젝트 및 경험' />
              <div className='flex flex-col text-sm text-foreground'>
                {portfolio.projects.map((project, idx) => (
                  <p key={project.project_id} className={idx === 0 ? 'leading-[16.7px]' : 'leading-6 mt-1'}>
                    ▪ {project.project_name}
                  </p>
                ))}
              </div>
            </div>
          )}

          {portfolio.links.length > 0 && (
            <div className='flex flex-col gap-3'>
              <SectionHeader title='링크' />
              <div className='flex flex-col gap-1.5'>
                {portfolio.links.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.link}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-sm text-[#0c89cd] hover:underline truncate'
                  >
                    ▪ {link.alt || link.link}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
