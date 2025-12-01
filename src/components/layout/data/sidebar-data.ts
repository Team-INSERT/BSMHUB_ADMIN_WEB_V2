import {
  IconBuildings,
  IconLayoutDashboard,
  IconUsers,
  IconBulb,
  IconBug,
} from '@tabler/icons-react'
import { User } from '@supabase/supabase-js'
import { Command } from 'lucide-react'
import { type SidebarData } from '../types'

export const getSidebarData = ({ user, dashboardOnly }: { user: User | null; dashboardOnly?: boolean }): SidebarData => {
  
  const baseDashboardItem = {
    title: '대시보드',
    url: '/',
    icon: IconLayoutDashboard,
  }

  const studentItem = {
    title: '학생 정보',
    url: '/users',
    icon: IconUsers,
  }

  const companyItem = {
    title: '기업 정보',
    url: '/companies',
    icon: IconBuildings,
  }

  const generalItems = dashboardOnly
    ? [baseDashboardItem]
    : [baseDashboardItem, studentItem, companyItem]

  return {
    user: user
      ? {
          name: user.user_metadata?.name,
          email: user.email as string,
          avatar: '/avatars/shadcn.jpg',
        }
      : {
          name: '로그인되지 않음',
          email: 'guest@example.com',
          avatar: '/avatars/shadcn.jpg',
        },
    teams: [
      {
        name: 'BSMHUB Admin',
        logo: Command,
        plan: 'Vite + ShadcnUI',
      },
      // {
      //   name: 'Acme Inc',
      //   logo: GalleryVerticalEnd,
      //   plan: 'Enterprise',
      // },
      // {
      //   name: 'Acme Corp.',
      //   logo: AudioWaveform,
      //   plan: 'Startup',
      // },
    ],
    navGroups: [
      {
        title: 'General',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        items: generalItems as any,
      },
      {
        title: '학생 포트폴리오',
        items: [
          {
            title: '포트폴리오',
            url: '/portfolio',
            icon: IconUsers,
          },
        ],
      },
      {
        title: '피드백',
        items: [
          {
            title: '버그 신고',
            url: 'https://obtuse-t.atlassian.net/jira/software/form/f2c4b89b-e758-48c8-8507-bb1a3f479b43',
            icon: IconBug,
            isExternal: true,
          },
          {
            title: '기능 요청',
            url: 'https://obtuse-t.atlassian.net/jira/software/form/d34ad520-6025-4d07-8543-85c225b5ac1a',
            icon: IconBulb,
            isExternal: true,
          },
        ],
      },
      // {
      //   title: 'Pages',
      //   items: [
      //     {
      //       title: 'Auth',
      //       icon: IconLockAccess,
      //       items: [
      //         {
      //           title: 'Sign In',
      //           url: '/sign-in',
      //         },
      //         {
      //           title: 'Sign In (2 Col)',
      //           url: '/sign-in-2',
      //         },
      //         {
      //           title: 'Sign Up',
      //           url: '/sign-up',
      //         },
      //         {
      //           title: 'Forgot Password',
      //           url: '/forgot-password',
      //         },
      //         {
      //           title: 'OTP',
      //           url: '/otp',
      //         },
      //       ],
      //     },
      //     {
      //       title: 'Errors',
      //       icon: IconBug,
      //       items: [
      //         {
      //           title: 'Unauthorized',
      //           url: '/401',
      //           icon: IconLock,
      //         },
      //         {
      //           title: 'Forbidden',
      //           url: '/403',
      //           icon: IconUserOff,
      //         },
      //         {
      //           title: 'Not Found',
      //           url: '/404',
      //           icon: IconError404,
      //         },
      //         {
      //           title: 'Internal Server Error',
      //           url: '/500',
      //           icon: IconServerOff,
      //         },
      //         {
      //           title: 'Maintenance Error',
      //           url: '/503',
      //           icon: IconBarrierBlock,
      //         },
      //       ],
      //     },
      //   ],
      // },
      // {
      //   title: 'Other',
      //   items: [
      //     {
      //       title: 'Settings',
      //       icon: IconSettings,
      //       items: [
      //         {
      //           title: 'Profile',
      //           url: '/settings',
      //           icon: IconUserCog,
      //         },
      //         {
      //           title: 'Account',
      //           url: '/settings/account',
      //           icon: IconTool,
      //         },
      //         {
      //           title: 'Appearance',
      //           url: '/settings/appearance',
      //           icon: IconPalette,
      //         },
      //         {
      //           title: 'Notifications',
      //           url: '/settings/notifications',
      //           icon: IconNotification,
      //         },
      //         {
      //           title: 'Display',
      //           url: '/settings/display',
      //           icon: IconBrowserCheck,
      //         },
      //       ],
      //     },
      //     {
      //       title: 'Help Center',
      //       url: '/help-center',
      //       icon: IconHelp,
      //     },
      //   ],
      // },
    ],
  }
}
