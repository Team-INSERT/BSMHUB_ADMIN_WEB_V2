import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Skeleton } from '@/components/ui/skeleton'
import { columns } from './components/users-columns'
import { UsersDialogs } from './components/users-dialogs'
// import { UsersPrimaryButtons } from './components/users-primary-buttons'
import { UsersTable } from './components/users-table'
import UsersProvider from './context/users-context'
import { useUserListQuery } from './services/seleteUserList'

export default function Users() {
  const { data, isLoading } = useUserListQuery()

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

        <Main>
          <div className='mb-2'>
            <Skeleton className='h-8 w-48' />
            <Skeleton className='mt-2 h-4 w-96' />
          </div>

          <div className='flex flex-col gap-3 lg:flex-row'>
            <div className='flex-1 space-y-4'>
              <div className='flex items-center justify-between'>
                <Skeleton className='h-10 w-64' />
                <Skeleton className='h-10 w-32' />
              </div>
              <div className='rounded-md border'>
                <div className='p-4'>
                  <Skeleton className='h-10 w-full' />
                </div>
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className='border-t p-4'>
                    <Skeleton className='h-12 w-full' />
                  </div>
                ))}
              </div>
              <Skeleton className='h-10 w-full' />
            </div>
          </div>
        </Main>
      </>
    )
  }

  return (
    <UsersProvider>
      <Header>
        <Search />
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-2'>
          <h2 className='text-2xl font-bold tracking-tight'>학생 목록</h2>
          <p className='text-muted-foreground'>
            부산소프트웨어마이스터고 학생들을 관리할 수 있는 페이지입니다.
          </p>
        </div>

        <div className='flex flex-col gap-3 lg:flex-row'>
          <div className='flex-1'>
            <UsersTable data={data ?? []} columns={columns} />
          </div>

          <UsersDialogs />
        </div>
      </Main>
    </UsersProvider>
  )
}
