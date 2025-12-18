import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div 
    className={`animate-pulse bg-slate-700 rounded ${className}`}
    aria-hidden="true"
  />
);

export const HeroCardSkeleton: React.FC = () => (
  <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
    <div className="relative aspect-[4/3] overflow-hidden bg-slate-800">
      <Skeleton className="w-full h-full" />
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 to-transparent p-4 pt-10">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-12" />
        </div>
      </div>
    </div>

    <div className="p-4 space-y-3">
      <div className="space-y-1.5">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-slate-800">
        <Skeleton className="h-3 w-8" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  </div>
);

export const BattleAreaSkeleton: React.FC = () => (
  <div className="min-h-[300px] sm:min-h-[350px] flex flex-col items-center justify-center p-6 space-y-4">
    <Skeleton className="w-20 h-20 rounded-full" />
    <Skeleton className="h-6 w-32" />
    <Skeleton className="h-4 w-48" />
  </div>
);

export default Skeleton;
