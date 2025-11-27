import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Receipt, ChevronLeft, ChevronRight, Coffee } from 'lucide-react';

export default function Layout() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const location = useLocation();

    const navItems = [
        { path: '/', label: 'Tablero', icon: LayoutDashboard },
        { path: '/sales', label: 'Punto de Venta', icon: ShoppingCart },
        { path: '/inventory', label: 'Inventario', icon: Package },
        { path: '/expenses', label: 'Gastos', icon: Receipt },
    ];

    const sidebarWidth = isCollapsed ? '80px' : '260px';
    const mainMargin = isCollapsed ? '110px' : '290px';

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar - Desktop */}
            <aside className="glass-panel" style={{
                width: sidebarWidth,
                margin: '1rem',
                padding: '1.5rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                position: 'fixed',
                top: 0,
                bottom: 0,
                zIndex: 50,
                transition: 'width 0.3s ease',
                overflow: 'hidden'
            }}>
                <div style={{
                    marginBottom: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'space-between',
                    gap: '0.75rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            minWidth: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, hsl(var(--color-primary)), hsl(var(--color-secondary)))',
                            borderRadius: '8px',
                            color: 'white'
                        }}>
                            <Coffee size={20} />
                        </div>
                        {!isCollapsed && (
                            <h1 style={{ fontSize: '1.25rem', margin: 0, whiteSpace: 'nowrap' }}>BrewBooks</h1>
                        )}
                    </div>

                    {!isCollapsed && (
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="btn-icon"
                            style={{ padding: '4px' }}
                        >
                            <ChevronLeft size={20} />
                        </button>
                    )}
                </div>

                {/* Collapsed Toggle (Centered when collapsed) */}
                {isCollapsed && (
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="btn-icon"
                        style={{
                            margin: '0 auto 1rem',
                            display: 'flex',
                            justifyContent: 'center'
                        }}
                    >
                        <ChevronRight size={20} />
                    </button>
                )}

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `
                btn ${isActive ? 'btn-primary' : 'btn-ghost'}
              `}
                            style={({ isActive }) => ({
                                justifyContent: isCollapsed ? 'center' : 'flex-start',
                                background: isActive ? undefined : 'transparent',
                                color: isActive ? 'white' : 'hsl(var(--color-text-muted))',
                                opacity: isActive ? 1 : 0.7,
                                padding: isCollapsed ? '0.75rem' : '0.75rem 1.5rem'
                            })}
                            title={isCollapsed ? item.label : ''}
                        >
                            <item.icon size={20} />
                            {!isCollapsed && <span style={{ marginLeft: '0.5rem' }}>{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                <div style={{
                    marginTop: 'auto',
                    paddingTop: '1rem',
                    borderTop: '1px solid hsl(var(--color-secondary) / 0.1)',
                    textAlign: isCollapsed ? 'center' : 'left'
                }}>
                    <p style={{ fontSize: '0.75rem', opacity: 0.5, whiteSpace: 'nowrap' }}>
                        {isCollapsed ? 'v2' : 'v2.0.0 Moderno'}
                    </p>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{
                flex: 1,
                marginLeft: mainMargin,
                padding: '2rem',
                minHeight: '100vh',
                transition: 'margin-left 0.3s ease'
            }}>
                <Outlet />
            </main>

            {/* Background Ambience */}
            <div style={{
                position: 'fixed',
                top: '-20%',
                left: '-10%',
                width: '50%',
                height: '50%',
                background: 'radial-gradient(circle, hsl(var(--color-primary) / 0.15) 0%, transparent 70%)',
                filter: 'blur(100px)',
                zIndex: -1,
                pointerEvents: 'none'
            }} />
            <div style={{
                position: 'fixed',
                bottom: '-20%',
                right: '-10%',
                width: '60%',
                height: '60%',
                background: 'radial-gradient(circle, hsl(var(--color-secondary) / 0.15) 0%, transparent 70%)',
                filter: 'blur(100px)',
                zIndex: -1,
                pointerEvents: 'none'
            }} />
        </div>
    );
}
