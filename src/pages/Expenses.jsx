import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Plus, Receipt, Calendar, DollarSign } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { expenseCategories } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Expenses() {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        category: expenseCategories[0],
        expenseDate: new Date().toISOString().split('T')[0] // Default to today YYYY-MM-DD
    });

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        try {
            // Get recent 50 expenses
            const q = query(collection(db, 'expenses'), orderBy('expenseDate', 'desc'), limit(50));
            const querySnapshot = await getDocs(q);
            const expensesData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setExpenses(expensesData);
        } catch (error) {
            console.error("Error fetching expenses:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await addDoc(collection(db, 'expenses'), {
                ...formData,
                amount: Number(formData.amount),
                // Ensure date is ISO string if needed, but YYYY-MM-DD is fine for sorting usually, 
                // but let's stick to the input value which is YYYY-MM-DD.
            });
            await fetchExpenses();
            setIsModalOpen(false);
            setFormData({
                description: '',
                amount: '',
                category: expenseCategories[0],
                expenseDate: new Date().toISOString().split('T')[0]
            });
        } catch (error) {
            console.error("Error adding expense:", error);
        } finally {
            setLoading(false);
        }
    };

    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);

    return (
        <div className="animate-fade-in">
            <div className="flex-between" style={{ marginBottom: '2rem' }}>
                <div>
                    <h1 className="text-gradient">Gastos</h1>
                    <p>Rastrea y gestiona los gastos del negocio.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} icon={Plus}>Registrar Gasto</Button>
            </div>

            {/* Summary Cards */}
            <div className="grid-dashboard" style={{ marginBottom: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <Card className="flex-between">
                    <div>
                        <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Registrado</p>
                        <h2 style={{ color: 'hsl(var(--color-danger))' }}>${totalExpenses.toLocaleString()}</h2>
                    </div>
                    <div style={{ padding: '1rem', background: 'hsl(var(--color-danger) / 0.1)', borderRadius: 'var(--radius-full)', color: 'hsl(var(--color-danger))' }}>
                        <DollarSign size={24} />
                    </div>
                </Card>
                <Card className="flex-between">
                    <div>
                        <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Transacciones Recientes</p>
                        <h2>{expenses.length}</h2>
                    </div>
                    <div style={{ padding: '1rem', background: 'hsl(var(--color-primary) / 0.1)', borderRadius: 'var(--radius-full)', color: 'hsl(var(--color-primary))' }}>
                        <Receipt size={24} />
                    </div>
                </Card>
            </div>

            {/* Expenses List */}
            <Card>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid hsl(255 255 255 / 0.1)' }}>
                                <th style={{ padding: '1rem', color: 'hsl(var(--color-text-muted))', fontWeight: '500' }}>Fecha</th>
                                <th style={{ padding: '1rem', color: 'hsl(var(--color-text-muted))', fontWeight: '500' }}>Descripción</th>
                                <th style={{ padding: '1rem', color: 'hsl(var(--color-text-muted))', fontWeight: '500' }}>Categoría</th>
                                <th style={{ padding: '1rem', color: 'hsl(var(--color-text-muted))', fontWeight: '500', textAlign: 'right' }}>Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center' }}>Cargando...</td></tr>
                            ) : expenses.length === 0 ? (
                                <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>No hay gastos registrados</td></tr>
                            ) : (
                                expenses.map(expense => (
                                    <tr key={expense.id} style={{ borderBottom: '1px solid hsl(255 255 255 / 0.05)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Calendar size={14} style={{ opacity: 0.5 }} />
                                                {(() => {
                                                    try {
                                                        let dateValue = expense.expenseDate;

                                                        if (!dateValue) return 'Fecha Inválida';

                                                        // Handle Firestore Timestamp
                                                        if (typeof dateValue.toDate === 'function') {
                                                            dateValue = dateValue.toDate();
                                                        }

                                                        let date;
                                                        // Handle YYYY-MM-DD string specifically to avoid timezone issues
                                                        if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
                                                            const [year, month, day] = dateValue.split('-').map(Number);
                                                            date = new Date(year, month - 1, day);
                                                        } else {
                                                            date = new Date(dateValue);
                                                        }

                                                        if (isNaN(date.getTime())) {
                                                            return 'Fecha Inválida';
                                                        }

                                                        return format(date, 'MMM d, yyyy', { locale: es });
                                                    } catch (e) {
                                                        console.error("Date parsing error", e);
                                                        return 'Fecha Inválida';
                                                    }
                                                })()}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', fontWeight: '500' }}>{expense.description}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span className="badge" style={{ background: 'hsl(var(--color-surface))', border: '1px solid hsl(255 255 255 / 0.1)' }}>
                                                {expense.category}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', color: 'hsl(var(--color-danger))', fontWeight: '600' }}>
                                            -${expense.amount.toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Add Expense Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Registrar Nuevo Gasto"
            >
                <form onSubmit={handleSubmit}>
                    <Input
                        label="Descripción"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        required
                        placeholder="ej., Suministros de Oficina"
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <Input
                            label="Monto"
                            type="number"
                            min="0"
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                            required
                        />
                        <Input
                            label="Fecha"
                            type="date"
                            value={formData.expenseDate}
                            onChange={e => setFormData({ ...formData, expenseDate: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'hsl(var(--color-text-muted))' }}>Categoría</label>
                        <select
                            className="input"
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                        >
                            {expenseCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} style={{ flex: 1 }}>Cancelar</Button>
                        <Button type="submit" style={{ flex: 1 }}>Guardar Gasto</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
