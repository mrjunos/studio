import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import {
    DollarSign, TrendingUp, TrendingDown, AlertTriangle, Package,
    CreditCard, Scale, ListChecks, BadgeDollarSign, Coffee, BarChart3
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeRange, setTimeRange] = useState('30d'); // '30d', '6m', '1y'
    const [allSales, setAllSales] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [metrics, setMetrics] = useState({
        totalSales: 0,
        totalExpenses: 0,
        balance: 0,
        salesLast30Days: 0,
        expensesLast30Days: 0,
        transactionsLast30Days: 0,
        averageTicketLast30Days: 0,
        bestSellingProduct: { name: 'N/A', quantity: 0 },
        activeProductsCount: 0,
        lowStockItems: [],
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    useEffect(() => {
        updateChartData();
    }, [timeRange, allSales]);

    const fetchDashboardData = async () => {
        try {
            setError(null);
            const today = new Date();
            const thirtyDaysAgo = subDays(today, 30);

            // 1. Fetch All Sales
            const salesSnapshot = await getDocs(collection(db, 'sales'));
            const sales = salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log("Fetched Sales:", sales); // Debug log
            setAllSales(sales);

            let totalSales = 0;
            let salesLast30Days = 0;
            let transactionsLast30Days = 0;
            const productSalesMap = {};

            sales.forEach(data => {
                const amount = data.totalAmount || 0;
                totalSales += amount;

                let saleDate = new Date();
                // Prioritize saleDate as it seems to be the main field in the sample data
                const dateField = data.saleDate || data.createdAt;

                if (dateField) {
                    if (typeof dateField.toDate === 'function') {
                        saleDate = dateField.toDate();
                    } else {
                        saleDate = new Date(dateField);
                    }
                }

                // Best Seller Logic (All Time)
                if (data.items && Array.isArray(data.items)) {
                    data.items.forEach(item => {
                        const qty = item.quantity || 0;
                        const name = item.productName || item.name || 'Desconocido';
                        productSalesMap[name] = (productSalesMap[name] || 0) + qty;
                    });
                }

                if (!isNaN(saleDate.getTime()) && saleDate >= thirtyDaysAgo) {
                    salesLast30Days += amount;
                    transactionsLast30Days++;
                }
            });

            // 2. Fetch All Expenses
            const expensesSnapshot = await getDocs(collection(db, 'expenses'));
            let totalExpenses = 0;
            let expensesLast30Days = 0;

            expensesSnapshot.docs.forEach(doc => {
                const data = doc.data();
                const amount = data.amount || 0;
                totalExpenses += amount;

                if (data.date && data.date.toDate() >= thirtyDaysAgo) {
                    expensesLast30Days += amount;
                }
            });

            // 3. Products
            const productsSnapshot = await getDocs(collection(db, 'products'));
            const activeProductsCount = productsSnapshot.size;
            const lowStockItems = [];

            productsSnapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.stock < 10) {
                    lowStockItems.push({ id: doc.id, ...data });
                }
            });

            // Calculate Derived Metrics
            const balance = totalSales - totalExpenses;
            const averageTicketLast30Days = transactionsLast30Days > 0 ? salesLast30Days / transactionsLast30Days : 0;

            let bestSellingProduct = { name: 'N/A', quantity: 0 };
            Object.entries(productSalesMap).forEach(([name, qty]) => {
                if (qty > bestSellingProduct.quantity) {
                    bestSellingProduct = { name, quantity: qty };
                }
            });

            setMetrics({
                totalSales,
                totalExpenses,
                balance,
                salesLast30Days,
                expensesLast30Days,
                transactionsLast30Days,
                averageTicketLast30Days,
                bestSellingProduct,
                activeProductsCount,
                lowStockItems,
            });

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const updateChartData = () => {
        const today = new Date();
        let startDate;
        let dateFormat;
        let map = {};

        if (timeRange === '30d') {
            startDate = subDays(today, 30);
            dateFormat = 'yyyy-MM-dd';
            // Initialize map
            for (let i = 29; i >= 0; i--) {
                map[format(subDays(today, i), dateFormat)] = 0;
            }
        } else if (timeRange === '6m') {
            startDate = subDays(today, 180); // Approx 6 months
            dateFormat = 'yyyy-MM';
            // Initialize map (simple approach: last 6 months)
            for (let i = 5; i >= 0; i--) {
                // We need to be careful with month subtraction logic to match keys
                // Let's just rely on the data keys for now or build a proper month list if needed for empty months
                // For MVP, let's just populate from data and fill gaps if we want to be fancy, 
                // but iterating data is safer.
                // Actually, to show empty months, we should init.
                // Let's skip init for 6m/1y for simplicity or do it properly:
                // ... skipping complex init for brevity, will just map data
            }
        } else { // 1y
            startDate = subDays(today, 365);
            dateFormat = 'yyyy-MM';
        }

        // Re-initialize map to ensure full range coverage
        if (timeRange === '30d') {
            // Already done above
        } else {
            // For months, let's just let the data drive it or use a helper if we had one.
            // To keep it simple and robust:
            // We will filter data first, then group.
        }

        // Better approach for all:
        const dataMap = {};

        if (timeRange === '30d') {
            for (let i = 29; i >= 0; i--) {
                dataMap[format(subDays(today, i), 'yyyy-MM-dd')] = 0;
            }
        } else if (timeRange === '6m') {
            for (let i = 5; i >= 0; i--) {
                // subMonths is better than subDays for months
                const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                dataMap[format(d, 'yyyy-MM')] = 0;
            }
        } else if (timeRange === '1y') {
            for (let i = 11; i >= 0; i--) {
                const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                dataMap[format(d, 'yyyy-MM')] = 0;
            }
        }

        allSales.forEach(sale => {
            let saleDate = null;
            const dateField = sale.saleDate || sale.createdAt;

            if (dateField) {
                if (typeof dateField.toDate === 'function') {
                    saleDate = dateField.toDate();
                } else {
                    saleDate = new Date(dateField);
                }
            }

            if (saleDate && !isNaN(saleDate.getTime())) {
                try {
                    if (saleDate >= startDate) {
                        const key = format(saleDate, timeRange === '30d' ? 'yyyy-MM-dd' : 'yyyy-MM');
                        if (dataMap[key] !== undefined) {
                            dataMap[key] += (sale.totalAmount || 0);
                        }
                    }
                } catch (e) {
                    console.warn("Error processing sale for chart:", sale);
                }
            }
        });

        const formattedData = Object.entries(dataMap).map(([date, total]) => ({
            date,
            total
        })).sort((a, b) => a.date.localeCompare(b.date));

        setChartData(formattedData);
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Cargando tablero...</p>
                </div>
            </div>
        );
    }

    const metricCards = [
        { title: "Ventas Totales", value: formatCurrency(metrics.totalSales), icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-100" },
        { title: "Gastos Totales", value: formatCurrency(metrics.totalExpenses), icon: TrendingDown, color: "text-rose-600", bg: "bg-rose-100" },
        { title: "Balance", value: formatCurrency(metrics.balance), icon: Scale, color: "text-blue-600", bg: "bg-blue-100" },
        { title: "Ventas 30 Días", value: formatCurrency(metrics.salesLast30Days), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-100" },
        { title: "Gastos 30 Días", value: formatCurrency(metrics.expensesLast30Days), icon: CreditCard, color: "text-rose-600", bg: "bg-rose-100" },
        { title: "Transacciones", value: metrics.transactionsLast30Days, icon: ListChecks, color: "text-violet-600", bg: "bg-violet-100" },
        { title: "Ticket Promedio", value: formatCurrency(metrics.averageTicketLast30Days), icon: BadgeDollarSign, color: "text-amber-600", bg: "bg-amber-100" },
        { title: "Más Vendido", value: metrics.bestSellingProduct.name, sub: `${metrics.bestSellingProduct.quantity} un.`, icon: Coffee, color: "text-orange-600", bg: "bg-orange-100" },
        { title: "Productos Activos", value: metrics.activeProductsCount, icon: Package, color: "text-indigo-600", bg: "bg-indigo-100" },
    ];

    return (
        <div className="animate-fade-in">
            <div className="mb-6">
                <h1 className="text-gradient mb-2">Tablero</h1>
                <p className="text-muted-foreground">Resumen de actividad y métricas clave.</p>
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}
            </div>

            {/* Metrics Grid */}
            <div className="grid-dashboard mb-6">
                {metricCards.map((metric, index) => (
                    <Card key={index} className="hover:shadow-lg transition-shadow duration-200 border-none">
                        <div className="flex-start-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">{metric.title}</p>
                                <h3 className="text-2xl font-bold text-gray-900">{metric.value}</h3>
                                {metric.sub && <p className="text-sm text-muted-foreground mt-1">{metric.sub}</p>}
                            </div>
                            <div className={`p-3 rounded-xl ${metric.bg} ${metric.color}`}>
                                <metric.icon size={24} />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Charts & Lists */}
            <div className="grid-split">
                {/* Sales Chart */}
                <Card className="border-none">
                    <div className="flex-between mb-6">
                        <div className="flex-center gap-2">
                            <BarChart3 className="text-primary" size={24} />
                            <h3 className="text-lg font-bold text-gray-900">
                                Ventas {timeRange === '30d' ? '(30 Días)' : timeRange === '6m' ? '(6 Meses)' : '(1 Año)'}
                            </h3>
                        </div>
                        <div className="segment-control">
                            {['30d', '6m', '1y'].map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    className={`segment-btn ${timeRange === range ? 'active' : ''}`}
                                >
                                    {range === '30d' ? '30 Días' : range === '6m' ? '6 Meses' : '1 Año'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={{ width: '100%', height: 300, minWidth: 0 }}>
                        {!chartData.some(item => item.total > 0) ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                                <BarChart3 size={48} className="mb-4 opacity-20" />
                                <p>Sin actividad de ventas en {timeRange === '30d' ? 'los últimos 30 días' : timeRange === '6m' ? 'los últimos 6 meses' : 'el último año'}.</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6b7280', fontSize: 12 }}
                                        tickFormatter={(str) => {
                                            if (timeRange === '30d') return format(new Date(str), 'dd/MM');
                                            const [y, m] = str.split('-');
                                            return format(new Date(parseInt(y), parseInt(m) - 1), 'MMM');
                                        }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6b7280', fontSize: 12 }}
                                        tickFormatter={(val) => `$${val / 1000}k`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f3f4f6' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        labelFormatter={(label) => {
                                            if (timeRange === '30d') return format(new Date(label), 'dd MMM yyyy');
                                            const [y, m] = label.split('-');
                                            return format(new Date(parseInt(y), parseInt(m) - 1), 'MMMM yyyy');
                                        }}
                                        formatter={(value) => [formatCurrency(value), 'Ventas']}
                                    />
                                    <Bar dataKey="total" fill="#e68a2e" radius={[4, 4, 0, 0]} minPointSize={2} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </Card >

                {/* Low Stock List */}
                <Card className="border-none h-fit">
                    <div className="flex-center gap-2 mb-6">
                        <AlertTriangle className="text-orange-600" size={24} />
                        <h3 className="text-lg font-bold text-gray-900">Alerta de Stock Bajo</h3>
                    </div>
                    <div className="space-y-4">
                        {metrics.lowStockItems.length > 0 ? (
                            metrics.lowStockItems.map(item => (
                                <div key={item.id} className="flex-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors mb-2">
                                    <div className="flex-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                        <span className="font-medium text-gray-700">{item.name}</span>
                                    </div>
                                    <span className="px-3 py-1 rounded-full text-sm font-bold bg-amber-100 text-amber-700">
                                        {item.stock} Unidades
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Package size={48} className="mx-auto mb-3 opacity-20" />
                                <p>Todo el inventario está en orden.</p>
                            </div>
                        )}
                    </div>
                </Card >
            </div >
        </div >
    );
}
