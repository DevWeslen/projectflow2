'use client'

import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface UserAvatarProps {
  name: string
  role?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
  showTooltip?: boolean
}

export function UserAvatar({ name, role, size = 'sm', className, showTooltip = true }: UserAvatarProps) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)

  const sizeClasses = {
    xs: 'h-5 w-5 text-[8px]',
    sm: 'h-7 w-7 text-[10px]',
    md: 'h-9 w-9 text-xs',
    lg: 'h-12 w-12 text-sm',
  }

  const avatar = (
    <div
      className={cn(
        "flex items-center justify-center rounded-full font-black tracking-tighter shadow-sm border border-white/20 select-none transition-transform hover:scale-110",
        "bg-gradient-to-br from-primary/80 to-primary text-primary-foreground",
        sizeClasses[size],
        className
      )}
    >
      {initials}
    </div>
  )

  if (!showTooltip) return avatar

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {avatar}
        </TooltipTrigger>
        <TooltipContent side="top" className="glass border-none py-1.5 px-3">
          <p className="text-xs font-bold text-foreground">{name}</p>
          {role && <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{role}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface UserAvatarGroupProps {
  users: Array<{ name: string; role?: string }>
  limit?: number
  size?: 'xs' | 'sm' | 'md'
}

export function UserAvatarGroup({ users, limit = 3, size = 'sm' }: UserAvatarGroupProps) {
  const displayUsers = users.slice(0, limit)
  const remaining = users.length - limit

  return (
    <div className="flex -space-x-2">
      {displayUsers.map((user, i) => (
        <UserAvatar 
          key={i} 
          name={user.name} 
          role={user.role} 
          size={size} 
          className="ring-2 ring-background"
        />
      ))}
      {remaining > 0 && (
        <div 
          className={cn(
            "flex items-center justify-center rounded-full bg-secondary border border-border text-muted-foreground font-bold ring-2 ring-background",
            size === 'xs' ? 'h-5 w-5 text-[8px]' : size === 'sm' ? 'h-7 w-7 text-[10px]' : 'h-9 w-9 text-xs'
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  )
}
