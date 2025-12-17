import { Skeleton } from "@/components/ui/skeleton";

export default function ChatLoading() {
  return (
    <div className="h-full overflow-hidden">
      <div className="max-w-4xl mx-auto p-6 relative size-full">
        <div className="flex flex-col h-full">
          {/* Chat messages skeleton */}
          <div className="flex-1 space-y-6">
            {/* User message skeleton */}
            <div className="flex justify-end">
              <Skeleton className="h-12 w-64 rounded-2xl" />
            </div>

            {/* Assistant message skeleton */}
            <div className="flex justify-start">
              <div className="space-y-2">
                <Skeleton className="h-4 w-96" />
                <Skeleton className="h-4 w-80" />
                <Skeleton className="h-4 w-72" />
              </div>
            </div>

            {/* Another user message skeleton */}
            <div className="flex justify-end">
              <Skeleton className="h-10 w-48 rounded-2xl" />
            </div>

            {/* Another assistant message skeleton */}
            <div className="flex justify-start">
              <div className="space-y-2">
                <Skeleton className="h-4 w-80" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </div>

          {/* Input skeleton */}
          <div className="mt-4">
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
