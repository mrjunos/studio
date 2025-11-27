import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { Calendar, DollarSign, ShoppingBag, Package } from 'lucide-react';
import { Card } from '../ui/Card';
import { format } from 'date-fns';

export default function SalesHistory() {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = async () => {
        try {
            // Get recent 50 sales
            const q = query(collection(db, 'sales'), orderBy('saleDate', 'desc'), limit(50));
            const querySnapshot = await getDocs(q);
            const salesData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setSales(salesData);
        } catch (error) {
            console.error("Error fetching sales:", error);
        } finally {
            setLoading(false);
        }
    };

    const totalRevenue = sales.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
    const totalItemsSold = sales.reduce((sum, item) => {
        const itemsCount = item.items ? item.items.reduce((acc, i) => acc + (i.quantity || 0), 0) : 0;
        return sum + itemsCount;
    }, 0);

    return (
        <div className="animate-fade-in">
            {/* Summary Cards */}
            <div className="grid-dashboard" style={{ marginBottom: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <Card className="flex-between">
                    <div>
                        <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Ingresos Totales</p>
                        <h2 style={{ color: 'hsl(var(--color-success))' }}>${totalRevenue.toLocaleString()}</h2>
                    </div>
                    <div style={{ padding: '1rem', background: 'hsl(var(--color-success) / 0.1)', borderRadius: 'var(--radius-full)', color: 'hsl(var(--color-success))' }}>
                        <DollarSign size={24} />
                    </div>
                </Card>
                <Card className="flex-between">
                    <div>
                        <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Ventas Totales</p>
                        <h2>{sales.length}</h2>
                    </div>
                    <div style={{ padding: '1rem', background: 'hsl(var(--color-primary) / 0.1)', borderRadius: 'var(--radius-full)', color: 'hsl(var(--color-primary))' }}>
                        <ShoppingBag size={24} />
                    </div>
                </Card>
                <Card className="flex-between">
                    <div>
                        <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Productos Vendidos</p>
                        <h2>{totalItemsSold}</h2>
                    </div>
                    <div style={{ padding: '1rem', background: 'hsl(var(--color-accent) / 0.1)', borderRadius: 'var(--radius-full)', color: 'hsl(var(--color-accent))' }}>
                        <Package size={24} />
                    </div>
                </Card>
            </div>

            {/* Sales List */}
            <Card>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid hsl(255 255 255 / 0.1)' }}>
                                <th style={{ padding: '1rem', color: 'hsl(var(--color-text-muted))', fontWeight: '500' }}>Fecha</th>
                                <th style={{ padding: '1rem', color: 'hsl(var(--color-text-muted))', fontWeight: '500' }}>Resumen de Items</th>
                                <th style={{ padding: '1rem', color: 'hsl(var(--color-text-muted))', fontWeight: '500', textAlign: 'right' }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="3" style={{ padding: '2rem', textAlign: 'center' }}>Cargando...</td></tr>
                            ) : sales.length === 0 ? (
                                <tr><td colSpan="3" style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>No hay ventas registradas</td></tr>
                            ) : (
                                sales.map(sale => (
                                    <tr key={sale.id} style={{ borderBottom: '1px solid hsl(255 255 255 / 0.05)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Calendar size={14} style={{ opacity: 0.5 }} />
                                                {(() => {
                                                    try {
                                                        let dateValue = sale.saleDate || sale.createdAt;

                                                        // Handle Firestore Timestamp
                                                        if (dateValue && typeof dateValue.toDate === 'function') {
                                                            dateValue = dateValue.toDate();
                                                        }

                                                        const date = dateValue ? new Date(dateValue) : new Date();

                                                        // Check if date is valid
                                                        if (isNaN(date.getTime())) {
                                                            return 'Fecha Inválida';
                                                        }

                                                        return format(date, 'MMM d, yyyy HH:mm');
                                                    } catch (e) {
                                                        console.error("Date parsing error", e);
                                                        return 'Error Fecha';
                                                    }
                                                })()}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                {sale.items && sale.items.slice(0, 2).map((item, idx) => (
                                                    <span key={idx} style={{ fontSize: '0.875rem' }}>
                                                        {item.quantity}x {item.productName}
                                                    </span>
                                                ))}
                                                {sale.items && sale.items.length > 2 && (
                                                    <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                                                        +{sale.items.length - 2} más...
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', color: 'hsl(var(--color-success))', fontWeight: '600' }}>
                                            ${sale.totalAmount?.toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
