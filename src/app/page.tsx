
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTitle } from "@/components/shared/page-title";
import { DollarSign, TrendingUp, Coffee, BarChart3 } from "lucide-react";
import type { MetricCardProps } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

const initialMetrics: MetricCardProps[] = [
  { title: "Total Sales", value: "$0.00", icon: DollarSign, description: "Sum of all completed sales" },
  { title: "Other Income", value: "$0.00", icon: TrendingUp, description: "Sum of other income sources" },
  { title: "Top Selling Product", value: "N/A", icon: Coffee, description: "Most frequently sold item" },
  { title: "Active Products", value: "0", icon: BarChart3, description: "Number of products in stock" },
];

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<MetricCardProps[]>(initialMetrics);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      // In a real app, fetch data here and update metrics
      // For now, just use dummy data after a delay
      setMetrics([
        { title: "Total Sales", value: "$1,234.56", icon: DollarSign, description: "Sum of all completed sales" },
        { title: "Other Income", value: "$250.00", icon: TrendingUp, description: "Sum of other income sources" },
        { title: "Top Selling Product", value: "Espresso", icon: Coffee, description: "Most frequently sold item" },
        { title: "Active Products", value: "15", icon: BarChart3, description: "Number of products in stock" },
      ]);
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="p-6">
      <PageTitle title="Dashboard" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-6 rounded-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-24 mt-1" />
                  <Skeleton className="h-4 w-48 mt-2" />
                </CardContent>
              </Card>
            ))
          : metrics.map((metric) => (
              <Card key={metric.title} className="shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </CardTitle>
                  <metric.icon className="h-5 w-5 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{metric.value}</div>
                  {metric.description && (
                    <p className="text-xs text-muted-foreground pt-1">{metric.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Recent Sales Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <p className="text-muted-foreground">Sales chart or recent sales list will be displayed here.</p>
            )}
            {/* Placeholder for sales chart or list */}
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Inventory Status</CardTitle>
          </CardHeader>
          <CardContent>
             {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <p className="text-muted-foreground">Low stock items or inventory overview will be displayed here.</p>
            )}
            {/* Placeholder for inventory status */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
