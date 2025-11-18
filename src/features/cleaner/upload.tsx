import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Skeleton } from '@/components/ui/skeleton'
import { DatasetCleaningPanel } from './components/dataset-cleaning-panel'

export default function CleanerUploadPage() {
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
              데이터 업로드 허브
            </h1>
            <p className='text-sm text-muted-foreground'>
              기수별 원본 데이터를 업로드하고 SANDEUL 파이프라인에 자동 정제·적재를
              요청하세요.
            </p>
          </div>
          <DatasetCleaningPanel />
        </section>
      </Main>
    </>
  )
}
