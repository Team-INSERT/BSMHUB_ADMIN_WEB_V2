import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Skeleton } from '@/components/ui/skeleton'
import { PredictionPanel } from './components/prediction-panel'

export default function AnalyticsPredictionPage() {
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
            <Skeleton className='h-[600px] w-full rounded-lg' />
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
        <section className='space-y-4'>
          <div>
            <h1 className='text-2xl font-semibold tracking-tight'>
              학생 단일 예측
            </h1>
            <p className='text-sm text-muted-foreground'>
              학생 해시로 Advanced Analytics 모델을 호출해 단일 예측 결과를 확인합니다.
            </p>
          </div>
          <PredictionPanel />
        </section>
      </Main>
    </>
  )
}
