import { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

type PortfolioSectionProps = {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}

export const PortfolioSection = ({ title, children, defaultOpen = false }: PortfolioSectionProps) => (
  <Collapsible defaultOpen={defaultOpen} className="group space-y-2">
    <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent">
      <span>{title}</span>
      <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=closed]:rotate-0 group-data-[state=open]:rotate-180" />
    </CollapsibleTrigger>
    <CollapsibleContent className="space-y-1 px-2 text-sm">{children}</CollapsibleContent>
  </Collapsible>
)
