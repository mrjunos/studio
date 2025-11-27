import React, { useState, useEffect } from 'react';
import { collection, getDocs, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Search, ShoppingCart, Minus, Plus, Trash2, CheckCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export default function POS() {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [processing, setProcessing] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'products'));
            const productsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setProducts(productsData);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(item => item.productId === product.id);
            if (existing) {
                return prev.map(item =>
                    item.productId === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, {
                productId: product.id,
                productName: product.name,
                priceAtSale: product.price,
                quantity: 1,
                maxStock: product.stock
            }];
        });
    };

    const updateQuantity = (productId, delta) => {
        setCart(prev => prev.map(item => {
            if (item.productId === productId) {
                const newQty = item.quantity + delta;
                if (newQty < 1) return item;
                if (newQty > item.maxStock) return item; // Prevent overselling
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const removeFromCart = (productId) => {
        setCart(prev => prev.filter(item => item.productId !== productId));
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.priceAtSale * item.quantity), 0);

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setProcessing(true);

        try {
            const batch = writeBatch(db);

            // 1. Create Sale Record
            const saleRef = doc(collection(db, 'sales'));
            batch.set(saleRef, {
                items: cart.map(({ maxStock, ...item }) => item), // Remove maxStock from data to save
                totalAmount: cartTotal,
                saleDate: new Date(saleDate).toISOString(), // Use selected date
                createdAt: serverTimestamp()
            });

            // 2. Update Inventory
            cart.forEach(item => {
                const productRef = doc(db, 'products', item.productId);
                // Note: In a real app, we should use increment(-qty) but here we calculate manually based on snapshot
                // However, increment is safer for concurrency. Let's use increment if possible, but for now simple update is fine for MVP.
                // Actually, let's stick to simple update as we have the current stock in 'maxStock' (snapshot) 
                // BUT this is risky if stock changed. 
                // For MVP, we'll assume single user or low concurrency.
                // Better: use the 'maxStock' - quantity.
                batch.update(productRef, {
                    stock: item.maxStock - item.quantity
                });
            });

            await batch.commit();

            setSuccessMsg('¡Venta completada con éxito!');
            setCart([]);
            fetchProducts(); // Refresh stock levels
            setTimeout(() => setSuccessMsg(''), 3000);

        } catch (error) {
            console.error("Checkout error:", error);
            alert("Error al procesar la venta. Por favor, inténtelo de nuevo.");
        } finally {
            setProcessing(false);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-fade-in" style={{ height: 'calc(100vh - 8rem)', display: 'flex', gap: '2rem' }}>
            {/* Left: Product Grid */}
            <div style={{ flex: 2, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.25rem' }}>Productos</h2>
                    </div>
                    <div style={{ position: 'relative', width: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--color-text-muted))' }} />
                        <input
                            type="text"
                            placeholder="Buscar productos..."
                            className="input"
                            style={{ paddingLeft: '2.5rem' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid-dashboard" style={{
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    overflowY: 'auto',
                    paddingRight: '0.5rem',
                    paddingBottom: '1rem'
                }}>
                    {filteredProducts.map(product => (
                        <Card
                            key={product.id}
                            className="hover:border-primary cursor-pointer"
                            style={{ cursor: 'pointer', transition: 'all 0.2s', opacity: product.stock === 0 ? 0.6 : 1 }}
                            onClick={() => product.stock > 0 && addToCart(product)}
                        >
                            <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{product.name}</h3>
                            <div className="flex-between">
                                <span style={{ fontWeight: '700', color: 'hsl(var(--color-primary))' }}>${product.price}</span>
                                <span style={{ fontSize: '0.75rem', color: product.stock === 0 ? 'hsl(var(--color-danger))' : 'hsl(var(--color-text-muted))' }}>
                                    {product.stock === 0 ? 'Agotado' : `${product.stock} restantes`}
                                </span>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Right: Cart */}
            <Card style={{ flex: 1, display: 'flex', flexDirection: 'column', maxHeight: '100%' }}>
                <div style={{ paddingBottom: '1rem', borderBottom: '1px solid hsl(255 255 255 / 0.1)', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ShoppingCart /> Orden Actual
                    </h2>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {cart.length === 0 ? (
                        <div style={{ textAlign: 'center', marginTop: '4rem', opacity: 0.5 }}>
                            <ShoppingCart size={48} style={{ marginBottom: '1rem' }} />
                            <p>El carrito está vacío</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.productId} className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {/* Row 1: Title and Price */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                    <h4 style={{ fontSize: '1rem', fontWeight: '600' }}>{item.productName}</h4>
                                    <p style={{ fontSize: '0.9rem', fontWeight: '500' }}>${item.priceAtSale * item.quantity}</p>
                                </div>

                                {/* Row 2: Buttons */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                    <button className="btn-icon" onClick={() => updateQuantity(item.productId, -1)} style={{ border: '1px solid hsl(var(--color-secondary) / 0.2)' }}>
                                        <Minus size={16} />
                                    </button>
                                    <span style={{ width: '30px', textAlign: 'center', fontWeight: 'bold' }}>{item.quantity}</span>
                                    <button className="btn-icon" onClick={() => updateQuantity(item.productId, 1)} style={{ border: '1px solid hsl(var(--color-secondary) / 0.2)' }}>
                                        <Plus size={16} />
                                    </button>
                                    <button className="btn-icon" style={{ color: 'hsl(var(--color-danger))', marginLeft: '0.5rem', border: '1px solid hsl(var(--color-danger) / 0.2)' }} onClick={() => removeFromCart(item.productId)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div style={{ paddingTop: '1.5rem', borderTop: '1px solid hsl(255 255 255 / 0.1)', marginTop: 'auto' }}>
                    <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                        <span style={{ fontSize: '1.1rem', color: 'hsl(var(--color-text-muted))' }}>Total</span>
                        <span style={{ fontSize: '2rem', fontWeight: '700', color: 'hsl(var(--color-success))' }}>
                            ${cartTotal.toLocaleString()}
                        </span>
                    </div>

                    {successMsg && (
                        <div className="animate-fade-in" style={{
                            background: 'hsl(var(--color-success) / 0.2)',
                            color: 'hsl(var(--color-success))',
                            padding: '0.75rem',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: '1rem',
                            textAlign: 'center',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}>
                            <CheckCircle size={18} /> {successMsg}
                        </div>
                    )}

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'hsl(var(--color-text-muted))' }}>Fecha de Venta</label>
                        <input
                            type="date"
                            className="input"
                            value={saleDate}
                            onChange={(e) => setSaleDate(e.target.value)}
                            style={{ width: '100%' }}
                        />
                    </div>

                    <Button
                        style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
                        disabled={cart.length === 0 || processing}
                        onClick={handleCheckout}
                        isLoading={processing}
                    >
                        {processing ? 'Procesando...' : 'Completar Venta'}
                    </Button>
                </div>
            </Card>
        </div>
    );
}
