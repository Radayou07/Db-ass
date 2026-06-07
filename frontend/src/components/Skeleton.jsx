import React from 'react'

export const Skeleton = ({ className = "", variant = "rect" }) => {
  const baseClasses = "animate-pulse bg-slate-200 dark:bg-slate-800"
  
  const variants = {
    rect: "rounded-xl",
    circle: "rounded-full",
    text: "rounded h-4 w-full"
  }

  return (
    <div className={`${baseClasses} ${variants[variant]} ${className}`} />
  )
}

export const ProductSkeleton = ({ isInternal = true }) => {
  if (isInternal) {
    return (
      <div className="bg-box-bg dark:bg-box-dark-bg rounded-xl border border-box-border dark:border-box-dark-border p-3 flex flex-col h-full opacity-60">
        <div className="flex gap-3 flex-1">
          <Skeleton className="w-20 h-20 rounded-lg shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-4 w-3/4" variant="text" />
            <Skeleton className="h-3 w-1/2" variant="text" />
            <div className="flex justify-between items-center mt-4">
              <Skeleton className="h-3 w-16" variant="text" />
              <Skeleton className="h-4 w-12" variant="text" />
            </div>
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-50 dark:border-slate-800">
           <Skeleton className="h-3 w-full" variant="text" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden flex flex-col h-full opacity-60">
      <Skeleton className="aspect-[4/5] w-full" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-3 w-16" variant="text" />
        <Skeleton className="h-4 w-3/4" variant="text" />
        <Skeleton className="h-5 w-20 mt-2" variant="text" />
      </div>
    </div>
  )
}
