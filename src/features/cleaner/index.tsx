import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Skeleton } from '@/components/ui/skeleton'
import { StudentDatasetsPanel } from './components/student-datasets-panel'

export default function CleanerPage() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <>
        <Header>
          <Search />
          <div className='ml-auto flex items-center space-x-4'>
            <ThemeSwitch />
            <ProfileDropdown />
          </div>
        </Header>
        <Main className='space-y-6 pb-10 pr-4'>
          <section>
            <div className='mb-4'>
              <Skeleton className='h-8 w-64' />
              <Skeleton className='mt-2 h-4 w-96' />
            </div>
            <div className='space-y-4'>
              <Skeleton className='h-[600px] w-full rounded-lg' />
            </div>
          </section>
        </Main>
      </>
    )
  }

  return (
    <>
      <Header>
        <Search />
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <Main className='space-y-6 pb-10 pr-4'>
        <section>
          <div className='mb-4'>
            <h1 className='text-2xl font-semibold tracking-tight'>
              학생 데이터 브라우저
            </h1>
            <p className='text-sm text-muted-foreground'>
              기수별 SANDEUL 학생 데이터를 조회하고 복호화 옵션을 적용해
              테이블로 검토하세요.
            </p>
          </div>
          <StudentDatasetsPanel />
        </section>
      </Main>
    </>
  )
}
