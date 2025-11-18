import {
  IconBuildings,
  IconChartHistogram,
  IconCloudUpload,
  IconLayoutDashboard,
  IconTableShortcut,
  IconUsers,
  IconBulb,
  IconBug,
  IconStars,
} from '@tabler/icons-react'
import { User } from '@supabase/supabase-js'
import { Command } from 'lucide-react'
import { type SidebarData } from '../types'

export const getSidebarData = ({
  user,
  dashboardOnly,
}: {
  user: User | null
  dashboardOnly?: boolean
}): SidebarData => {
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

  const analyticsUploadItem = {
    title: '데이터 업로드',
    url: '/analytics-upload',
    icon: IconCloudUpload,
  }

  const analyticsDataItem = {
    title: '학생 데이터',
    url: '/analytics-data',
    icon: IconTableShortcut,
  }

  const analyticsPredictionItem = {
    title: '학생 예측',
    url: '/analytics-prediction',
    icon: IconStars,
  }

  const analyticsInsightsItem = {
    title: '모델 인사이트',
    url: '/analytics-insights',
    icon: IconChartHistogram,
  }

  const companyItem = {
    title: '기업 정보',
    url: '/companies',
    icon: IconBuildings,
  }

  const generalItems = [baseDashboardItem, studentItem, companyItem]

  const analyticsNavItems = [
    analyticsUploadItem,
    analyticsDataItem,
    analyticsPredictionItem,
    analyticsInsightsItem,
  ]

  const navGroups = dashboardOnly
    ? [
        {
          title: 'General',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          items: [baseDashboardItem] as any,
        },
      ]
    : [
        {
          title: 'General',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          items: generalItems as any,
        },
        {
          title: 'Advanced Analytics',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          items: analyticsNavItems as any,
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
      ]

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
        name: 'SANDEUL Admin',
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
    navGroups,
  }
}
