// components/ui/course-info-skeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card"; // Import Card components

export function CourseInfoSkeleton() {
  return (
    // Mimic the main container's spacing from CourseResultDisplay
    <div className="space-y-6 skeleton-container">
      {/* Skeleton for Card 1: Graph */}
      <Card>
        <CardHeader>
          {/* Skeleton for Card Title */}
          <Skeleton className="h-6 w-1/3 rounded-md" />
        </CardHeader>
        <CardContent>
          {/* Skeleton for the Graph Area */}
          <Skeleton className="h-60 md:h-80 w-full rounded-md" />
        </CardContent>
      </Card>

      {/* --- Skeleton for Card 2: "Needed For" Card (md:col-span-1) --- */}
      <Card className="md:col-span-1">
        <CardHeader>
          <Skeleton className="h-6 w-1/2 rounded-md" /> {/* Title */}
          <Skeleton className="h-4 w-3/4 rounded-md mt-1" /> {/* Description */}
        </CardHeader>
        <CardContent>
          {/* Skeleton for Tabs */}
          <div className="flex gap-2 mb-4">
            <Skeleton className="h-8 w-1/2 rounded-md" /> {/* Tab Trigger 1 */}
            <Skeleton className="h-8 w-1/2 rounded-md" /> {/* Tab Trigger 2 */}
          </div>
          {/* Skeleton for List Content */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-5/6 rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
          </div>
        </CardContent>
      </Card>

      {/* Skeleton for Card 3: Required By / Coreq For */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/4 rounded-md" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-1/2 rounded-md" />
        </CardContent>
      </Card>

      {/* Skeleton for Card 4: Extra Info */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/5 rounded-md" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-3/4 rounded-md" />
        </CardContent>
      </Card>
    </div>
  );
}
