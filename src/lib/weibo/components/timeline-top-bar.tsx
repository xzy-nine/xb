import { Check, ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { RefreshCWIcon } from '@/components/ui/refresh-cw'
import { cn } from '@/lib/utils'

export interface TimelineTopBarOption {
  value: string
  label: string
}

interface TimelineTopBarProps {
  title: string
  description?: string
  titleValue?: string
  titleOptions?: TimelineTopBarOption[]
  onTitleChange?: (value: string) => void
  filterLabel?: string
  filterOptions?: TimelineTopBarOption[]
  filterValue?: string
  onFilterChange?: (value: string) => void
  onRefresh?: () => void
  isRefreshing?: boolean
  rightAction?: ReactNode
  children?: ReactNode
}

export function TimelineTopBar({
  title,
  description,
  titleValue,
  titleOptions,
  onTitleChange,
  filterLabel,
  filterOptions,
  filterValue,
  onFilterChange,
  onRefresh,
  isRefreshing = false,
  rightAction,
  children,
}: TimelineTopBarProps) {
  const activeTitleValue =
    titleValue ?? titleOptions?.find((option) => option.label === title)?.value ?? title
  const showTitleMenu = titleOptions && titleOptions.length > 1 && onTitleChange
  const showFilterMenu = filterOptions && filterOptions.length > 0 && filterValue && onFilterChange

  return (
    <div className="bg-background/70 border-border/40 sticky top-0 z-50 border-b backdrop-blur-lg">
      <div className="relative flex min-h-16 items-center justify-between">
        <div className="flex min-w-0 items-center">
          {showTitleMenu ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost">
                  <span className="text-foreground truncate text-lg font-semibold">{title}</span>
                  <ChevronDown className="text-muted-foreground size-4 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                {titleOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onSelect={() => onTitleChange(option.value)}
                    className="justify-between"
                  >
                    {option.label}
                    {option.value === activeTitleValue ? <Check className="size-4" /> : null}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <h1 className="text-foreground truncate px-2 py-1 text-xl font-semibold">{title}</h1>
          )}

          <div className="flex h-full flex-col items-center justify-end gap-1">
            {showFilterMenu ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="opacity-80">
                    <span className="truncate">{filterLabel}</span>
                    <ChevronDown className="size-3 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {filterOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onSelect={() => onFilterChange(option.value)}
                      className="justify-between"
                    >
                      <span className="truncate">{option.label}</span>
                      {option.value === filterValue ? <Check className="size-4" /> : null}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
            {description ? (
              <p className="text-muted-foreground truncate px-2 text-xs leading-4">{description}</p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {rightAction}
          {onRefresh ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="刷新"
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              <RefreshCWIcon className={cn('size-3', isRefreshing && 'animate-spin')} />
            </Button>
          ) : null}
        </div>

        {children}
      </div>
    </div>
  )
}
