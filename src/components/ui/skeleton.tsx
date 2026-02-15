import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'enhanced';
}

function Skeleton({
  className,
  variant = 'default',
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted",
        variant === 'enhanced' 
          ? "skeleton-enhanced" 
          : "animate-pulse",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }