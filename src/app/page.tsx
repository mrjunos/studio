
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTitle } from "@/components/shared/page-title";
import { DollarSign, TrendingUp, Coffee, BarChart3 } from "lucide-react";
import type { MetricCardProps } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getDashboardMetrics } from "./dashboard/actions";

const initialMetrics: MetricCardProps[] = [
  { title: "Total Sales", value: "$0.00", icon: DollarSign, description: "Sum of all completed sales" },
  { title: "Other Income", value: "$0.00", icon: TrendingUp, description: "Sum of other income sources" },
  { title: "Top Selling Product", value: "N/A", icon: Coffee, description: "Most frequently sold item" },
  { title: "Active Products", value: "0", icon: BarChart3, description: "Number of products in stock" },
];

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<MetricCardProps[]>(initialMetrics);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      const result = await getDashboardMetrics();

      if (result.success && result.totalSales !== undefined) {
        setMetrics(prevMetrics =>
          prevMetrics.map(metric => {
            if (metric.title === "Total Sales") {
              return { ...metric, value: currencyFormatter.format(result.totalSales!) };
            }
            // TODO: Update other metrics here when they are implemented in the action
            // e.g., Other Income, Top Selling Product, Active Products
            return metric;
          })
        );
      } else if (result.error) {
        toast({
          title: "Error Fetching Dashboard Data",
          description: result.error,
          variant: "destructive",
        });
        // On error, we can keep showing initial/placeholder values or clear them.
        // For now, we stop loading but retain the initial values if fetch fails.
      }
      // Simulate other metrics loading for a bit longer for demo purposes
      // In a real app, each metric might have its own fetch or all come from getDashboardMetrics
      setTimeout(() => {
         setMetrics(prevMetrics =>
          prevMetrics.map(metric => {
            if (metric.title === "Other Income" && metric.value === "$0.00") { // Only update if not already set
              return { ...metric, value: "$250.00" }; // Placeholder until implemented
            }
            if (metric.title === "Top Selling Product" && metric.value === "N/A") {
              return { ...metric, value: "Espresso" }; // Placeholder
            }
            if (metric.title === "Active Products" && metric.value === "0") {
              return { ...metric, value: "15" }; // Placeholder
            }
            return metric;
          })
        );
        setLoading(false);
      }, 500); // Short delay after fetching main metric
    };

    fetchMetrics();
  }, [toast]); // Added toast to dependency array

  return (
    <div className="p-6">
      <PageTitle title="Dashboard" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <Card key={metric.title} className="shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              {loading && (metric.title === "Total Sales" || metric.value === initialMetrics.find(m => m.title === metric.title)?.value) ? (
                <Skeleton className="h-6 w-32" />
              ) : (
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
              )}
              {loading && (metric.title === "Total Sales" || metric.value === initialMetrics.find(m => m.title === metric.title)?.value) ? (
                <Skeleton className="h-6 w-6 rounded-full" />
              ) : (
                <metric.icon className="h-5 w-5 text-accent" />
              )}
            </CardHeader>
            <CardContent>
              {loading && (metric.title === "Total Sales" || metric.value === initialMetrics.find(m => m.title === metric.title)?.value) ? (
                <>
                  <Skeleton className="h-8 w-24 mt-1" />
                  <Skeleton className="h-4 w-48 mt-2" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-primary">{metric.value}</div>
                  {metric.description && (
                    <p className="text-xs text-muted-foreground pt-1">{metric.description}</p>
                  )}
                </>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
