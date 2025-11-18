import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Skeleton } from '@/components/ui/skeleton'
import { CorrelationPanel } from './components/correlation-panel'

export default function AnalyticsInsightsPage() {
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
            <div className='grid gap-6 lg:grid-cols-2'>
              <Skeleton className='h-[600px] w-full rounded-lg' />
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
              Advanced Analytics 인사이트
            </h1>
            <p className='text-sm text-muted-foreground'>
              상관분석을 통해 모델이 어떤 피처에 민감한지 확인하고 데이터 품질을 개선하세요.
            </p>
          </div>
          <CorrelationPanel />
        </section>
      </Main>
    </>
  )
}
