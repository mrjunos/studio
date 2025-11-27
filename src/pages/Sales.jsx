import React, { useState } from 'react';
import { Store, History } from 'lucide-react';
import { Button } from '../components/ui/Button';
import POS from '../components/sales/POS';
import SalesHistory from '../components/sales/SalesHistory';

export default function Sales() {
    const [view, setView] = useState('pos'); // 'pos' | 'history'

    return (
        <div className="animate-fade-in">
            <div className="flex-between" style={{ marginBottom: '2rem' }}>
                <div>
                    <h1 className="text-gradient">Ventas</h1>
                    <p>Gestiona ventas y visualiza el historial de transacciones.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', background: 'hsl(var(--color-surface))', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid hsl(255 255 255 / 0.1)' }}>
                    <Button
                        variant={view === 'pos' ? 'primary' : 'ghost'}
                        onClick={() => setView('pos')}
                        size="sm"
                        icon={Store}
                    >
                        Punto de Venta
                    </Button>
                    <Button
                        variant={view === 'history' ? 'primary' : 'ghost'}
                        onClick={() => setView('history')}
                        size="sm"
                        icon={History}
                    >
                        Historial
                    </Button>
                </div>
            </div>

            {view === 'pos' ? <POS /> : <SalesHistory />}
        </div>
    );
}
