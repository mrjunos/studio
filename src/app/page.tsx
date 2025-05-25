
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { PageTitle } from "@/components/shared/page-title";
import { DollarSign, TrendingUp, Coffee, BarChart3, Archive, ExternalLink, Scale, CreditCard, ListChecks, BadgeDollarSign, TrendingDown } from "lucide-react";
import type { MetricCardProps, DailySalesData, LowStockItemForDashboard } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getDashboardMetrics } from "./dashboard/actions";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';


const initialMetrics: MetricCardProps[] = [
  { title: "Ventas Totales", value: "$0", icon: DollarSign, description: "Total histórico" },
  { title: "Gastos Totales", value: "$0", icon: TrendingDown, description: "Total histórico" },
  { title: "Balance", value: "$0", icon: Scale, description: "(Ventas + Otros Ingresos) - Gastos (Histórico)" },
  { title: "Ventas 30 Días", value: "$0", icon: TrendingUp, description: "Últimos 30 Días" },
  { title: "Gastos 30 Días", value: "$0", icon: CreditCard, description: "Últimos 30 Días" },
  { title: "Cantidad de Ventas", value: "0", icon: ListChecks, description: "Número de ventas - Últimos 30 Días" },
  { title: "Venta Promedio 30 Días", value: "$0", icon: BadgeDollarSign, description: "Valor promedio por transacción" },
  { title: "Producto Más Vendido", value: "N/A", icon: Coffee, description: "Artículo vendido con más frecuencia" },
  { title: "Productos Activos", value: "0", icon: BarChart3, description: "Número de productos disponibles" },
];

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const chartConfig = {
  sales: {
    label: "Ventas",
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
            if (metric.title === "Ventas Totales" && result.totalSales !== undefined) {
              return { ...metric, value: currencyFormatter.format(result.totalSales) };
            }
            if (metric.title === "Ventas 30 Días" && result.salesLast30Days !== undefined) {
              return { ...metric, value: currencyFormatter.format(result.salesLast30Days) };
            }
            if (metric.title === "Gastos Totales" && result.totalExpenses !== undefined) {
              return { ...metric, value: currencyFormatter.format(result.totalExpenses) };
            }
            if (metric.title === "Gastos 30 Días" && result.expensesLast30Days !== undefined) {
              return { ...metric, value: currencyFormatter.format(result.expensesLast30Days) };
            }
            if (metric.title === "Balance" && result.balance !== undefined) {
              return { ...metric, value: currencyFormatter.format(result.balance) };
            }
            if (metric.title === "Cantidad de Ventas" && result.transactionsLast30Days !== undefined) {
              return { ...metric, value: result.transactionsLast30Days.toString() };
            }
            if (metric.title === "Venta Promedio 30 Días" && result.averageTicketLast30Days !== undefined) {
              return { ...metric, value: currencyFormatter.format(result.averageTicketLast30Days) };
            }
            if (metric.title === "Productos Activos" && result.activeProductsCount !== undefined) {
              return { ...metric, value: result.activeProductsCount.toString() };
            }
            if (metric.title === "Producto Más Vendido") {
              if (result.topSellingProduct) {
                return { 
                  ...metric, 
                  value: result.topSellingProduct.name, 
                  description: `Más vendido: ${result.topSellingProduct.quantity} unidades` 
                };
              } else {
                return { ...metric, value: "N/A", description: "Aún no hay datos de ventas" };
              }
            }
            return metric;
          })
        );
        setRecentSales(result.recentSales || []);
        setLowStockItems(result.lowStockItems || []);
      } else if (result.error) {
        toast({
          title: "Error al Cargar Datos del Dashboard",
          description: result.error,
          variant: "destructive",
        });
        setMetrics(initialMetrics.map(im => ({...im, value: im.title.includes("0") || im.title.includes("N/A") ? im.value : (im.value.toString().startsWith("$") ? "$0" : "0") }))); 
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
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3"> 
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
                  <Skeleton className="h-7 w-24 mt-1" />
                  <Skeleton className="h-4 w-48 mt-2" />
                </>
              ) : (
                <>
                  <div className="text-xl font-bold text-primary">{metric.value}</div>
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
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <BarChart3 className="h-5 w-5 text-primary" />Ventas Recientes (Últimos 30 Días)
            </CardTitle>
            <CardDescription>Total ventas por día en los últimos 30 días.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pt-4">
            {loading && recentSales.length === 0 ? ( 
              <Skeleton className="h-full w-full" />
            ) : !loading && recentSales.every(sale => sale.total === 0) ? (
              <div className="flex items-center justify-center h-full">
                 <p className="text-muted-foreground text-center">Sin actividad de ventas en los últimos 30 días.</p>
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
                            tickFormatter={(value) => `$${value / 1000}k`} 
                        />
                        <ChartTooltip
                            cursor={false}
                            content={
                                <ChartTooltipContent 
                                    formatter={(value, name, props) => (
                                        <div className="flex flex-col">
                                            <span className="font-medium">{currencyFormatter.format(Number(value))}</span>
                                            {props.payload.date && (<span className="text-muted-foreground text-xs">el {props.payload.date}</span>)}
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
                <p className="text-muted-foreground text-center">No se pudieron cargar los datos de ventas.</p>
               </div>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Archive className="h-5 w-5 text-primary"/>Estado del Inventario
            </CardTitle>
            <CardDescription>Productos con bajo inventario (menos de 10 unidades).</CardDescription>
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
               <p className="text-muted-foreground text-center py-4">Todos los productos bien abastecidos o ninguno coincide con el criterio de bajo stock.</p>
            )}
          </CardContent>
            {lowStockItems.length > 0 && !loading && (
             <CardFooter>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href="/inventory">
                    Ajustar Inventario <ExternalLink className="ml-2 h-3 w-3"/>
                  </Link>
                </Button>
             </CardFooter>
            )}
        </Card>
      </div>
    </div>
  );
}
