
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
  { title: "Total Sales", value: "$0", icon: DollarSign, description: "Sum of all completed sales" },
  { title: "Other Income", value: "$0", icon: TrendingUp, description: "Sum of other income sources" },
  { title: "Top Selling Product", value: "N/A", icon: Coffee, description: "Most frequently sold item" },
  { title: "Active Products", value: "0", icon: BarChart3, description: "Number of products available" },
];

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<MetricCardProps[]>(initialMetrics);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      const result = await getDashboardMetrics();

      if (result.success) {
        setMetrics(prevMetrics =>
          prevMetrics.map(metric => {
            if (metric.title === "Total Sales" && result.totalSales !== undefined) {
              return { ...metric, value: currencyFormatter.format(result.totalSales) };
            }
            if (metric.title === "Other Income" && result.otherIncomeTotal !== undefined) {
              return { ...metric, value: currencyFormatter.format(result.otherIncomeTotal) };
            }
            if (metric.title === "Active Products" && result.activeProductsCount !== undefined) {
              return { ...metric, value: result.activeProductsCount.toString() };
            }
            if (metric.title === "Top Selling Product") {
              if (result.topSellingProduct) {
                return { 
                  ...metric, 
                  value: result.topSellingProduct.name, 
                  description: `Most sold: ${result.topSellingProduct.quantity} units` 
                };
              } else {
                return { ...metric, value: "N/A", description: "No sales data yet" };
              }
            }
            return metric;
          })
        );
      } else if (result.error) {
        toast({
          title: "Error Fetching Dashboard Data",
          description: result.error,
          variant: "destructive",
        });
         // If there's an error, keep initial placeholder values but stop overall loading
        setMetrics(initialMetrics.map(im => ({...im}))); // Reset to initial values to clear skeletons if partially loaded
      }
      setLoading(false);
    };

    fetchMetrics();
  }, [toast]);

  const isLoadingMetric = (metricTitle: string, currentValue: string | number) => {
    if (!loading) return false; 

    const initialValueForMetric = initialMetrics.find(m => m.title === metricTitle)?.value;
    return currentValue === initialValueForMetric;
  };


  return (
    <div className="p-6">
      <PageTitle title="Dashboard" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title} className="shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              {isLoadingMetric(metric.title, metric.value) ? (
                <Skeleton className="h-6 w-32" />
              ) : (
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
              )}
              {isLoadingMetric(metric.title, metric.value) ? (
                <Skeleton className="h-6 w-6 rounded-full" />
              ) : (
                <metric.icon className="h-5 w-5 text-accent" />
              )}
            </CardHeader>
            <CardContent>
              {isLoadingMetric(metric.title, metric.value) ? (
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
            {loading && !metrics.find(m => m.title === "Total Sales")?.value.startsWith('$') ? ( 
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <p className="text-muted-foreground">Sales chart or recent sales list will be displayed here.</p>
              // Placeholder for future chart implementation
            )}
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Inventory Status</CardTitle>
          </CardHeader>
          <CardContent>
             {loading && metrics.find(m => m.title === "Active Products")?.value === "0" ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <p className="text-muted-foreground">Low stock items or inventory overview will be displayed here.</p>
              // Placeholder for future chart implementation
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
