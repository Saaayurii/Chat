"use client";

import { Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/UI/Card";

interface RatingDistribution {
  rating: number;
  count: number;
}

interface RatingDistributionProps {
  ratingDistribution: RatingDistribution[] | undefined;
  totalRatings: number | undefined;
}

var RatingDistribution = ({ ratingDistribution, totalRatings }: RatingDistributionProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Распределение оценок</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-5 gap-4">
        {ratingDistribution?.map((rating) => (
          <div key={rating.rating} className="text-center">
            <div className="flex items-center justify-center mb-2">
              <span className="text-lg font-bold">{rating.rating}</span>
              <Star className="h-4 w-4 text-yellow-500 ml-1" fill="currentColor" />
            </div>
            <div className="text-2xl font-bold text-foreground">{rating.count}</div>
            <div className="text-xs text-muted-foreground">
              {Math.round((rating.count / (totalRatings || 1)) * 100)}%
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default RatingDistribution;