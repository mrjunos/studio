
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { PageTitle } from "@/components/shared/page-title";
import { DollarSign, TrendingUp, Coffee, BarChart3, Archive, ExternalLink } from "lucide-react";
import type { MetricCardProps, DailySalesData, LowStockItemForDashboard } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getDashboardMetrics } from "./dashboard/actions";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';


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

const chartConfig = {
  sales: {
    label: "Sales",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<MetricCardProps[]>(initialMetrics);
  const [recentSales, setRecentSales] = useState<DailySalesData[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItemForDashboard[]>([]);
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
        setRecentSales(result.recentSales || []);
        setLowStockItems(result.lowStockItems || []);
      } else if (result.error) {
        toast({
          title: "Error Fetching Dashboard Data",
          description: result.error,
          variant: "destructive",
        });
        setMetrics(initialMetrics.map(im => ({...im}))); 
        setRecentSales([]);
        setLowStockItems([]);
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
            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" />Recent Sales (Last 7 Days)</CardTitle>
            <CardDescription>Total sales amount per day for the past week.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pt-4">
            {loading && recentSales.length === 0 ? ( 
              <Skeleton className="h-full w-full" />
            ) : !loading && recentSales.every(sale => sale.total === 0) ? (
              <div className="flex items-center justify-center h-full">
                 <p className="text-muted-foreground text-center">No sales activity in the last 7 days.</p>
              </div>
            ) : recentSales.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={recentSales} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                            dataKey="date" 
                            tickLine={false} 
                            axisLine={false} 
                            tickMargin={8}
                            fontSize={12}
                        />
                        <YAxis 
                            tickLine={false} 
                            axisLine={false} 
                            tickMargin={8}
                            fontSize={12}
                            tickFormatter={(value) => `$${value / 1000}k`} // Example: format as thousands
                        />
                        <ChartTooltip
                            cursor={false}
                            content={
                                <ChartTooltipContent 
                                    formatter={(value, name) => (
                                        <div className="flex flex-col">
                                            <span className="font-medium">{currencyFormatter.format(Number(value))}</span>
                                            {/* <span className="text-muted-foreground text-xs">
                                                {name === 'total' && `on ${payload && payload[0] && payload[0].payload.dateLong }`}
                                            </span> */}
                                        </div>
                                    )}
                                    indicator="dot" 
                                />
                            }
                        />
                        <Bar dataKey="total" fill="var(--color-sales)" radius={4} />
                    </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
               <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground text-center">Could not load sales data.</p>
               </div>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Archive className="h-5 w-5 text-primary"/>Inventory Status</CardTitle>
            <CardDescription>Products running low on stock (less than 10 units).</CardDescription>
          </CardHeader>
          <CardContent>
             {loading && lowStockItems.length === 0 ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : lowStockItems.length > 0 ? (
              <ul className="space-y-2">
                {lowStockItems.map(item => (
                  <li key={item.id} className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-muted/50 transition-colors">
                    <span className="font-medium">{item.name}</span>
                    <Badge variant={item.stock < 5 ? "destructive" : "secondary"} className="text-xs">
                      Stock: {item.stock}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
               <p className="text-muted-foreground text-center py-4">All products are well stocked or no products match low stock criteria.</p>
            )}
          </CardContent>
            {lowStockItems.length > 0 && !loading && (
             <CardFooter>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href="/inventory">
                    Adjust Inventory <ExternalLink className="ml-2 h-3 w-3"/>
                  </Link>
                </Button>
             </CardFooter>
            )}
        </Card>
      </div>
    </div>
  );
}
