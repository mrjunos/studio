import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Plus, Search, Edit2, Trash2, Package } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { productCategories } from '../types';

export default function Inventory() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        category: productCategories[0],
        price: '',
        stock: '',
        imageUrl: ''
    });

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const productData = {
            ...formData,
            price: Number(formData.price),
            stock: Number(formData.stock)
        };

        try {
            if (editingProduct) {
                await updateDoc(doc(db, 'products', editingProduct.id), productData);
            } else {
                await addDoc(collection(db, 'products'), productData);
            }
            await fetchProducts();
            closeModal();
        } catch (error) {
            console.error("Error saving product:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
            try {
                await deleteDoc(doc(db, 'products', id));
                fetchProducts();
            } catch (error) {
                console.error("Error deleting product:", error);
            }
        }
    };

    const openModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                category: product.category,
                price: product.price,
                stock: product.stock,
                imageUrl: product.imageUrl || ''
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                category: productCategories[0],
                price: '',
                stock: '',
                imageUrl: ''
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-fade-in">
            <div className="flex-between" style={{ marginBottom: '2rem' }}>
                <div>
                    <h1 className="text-gradient">Inventario</h1>
                    <p>Gestiona tu catálogo de productos y niveles de stock.</p>
                </div>
                <Button onClick={() => openModal()} icon={Plus}>Agregar Producto</Button>
            </div>

            {/* Search and Filter */}
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ position: 'relative', maxWidth: '400px' }}>
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

            {/* Products Grid */}
            {loading && products.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem' }}>Cargando inventario...</div>
            ) : (
                <div className="grid-dashboard" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
                    {filteredProducts.map(product => (
                        <Card key={product.id} style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.75rem', color: 'hsl(var(--color-primary))', fontWeight: '600', marginBottom: '0.25rem', display: 'block' }}>
                                {product.category}
                            </span>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{product.name}</h3>
                            <div className="flex-between" style={{ marginBottom: '1rem' }}>
                                <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'hsl(var(--color-primary))' }}>
                                    ${product.price.toLocaleString()}
                                </span>
                                <span className={`badge ${product.stock < 10 ? 'badge-danger' : 'badge-success'}`}>
                                    {product.stock} en stock
                                </span>
                            </div>

                            <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
                                <Button variant="secondary" className="btn-icon" style={{ flex: 1 }} onClick={() => openModal(product)}>
                                    <Edit2 size={16} /> Editar
                                </Button>
                                <Button variant="secondary" className="btn-icon" style={{ flex: 1, color: 'hsl(var(--color-danger))' }} onClick={() => handleDelete(product.id)}>
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingProduct ? 'Editar Producto' : 'Agregar Nuevo Producto'}
            >
                <form onSubmit={handleSubmit}>
                    <Input
                        label="Nombre del Producto"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                    />

                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'hsl(var(--color-text-muted))' }}>Categoría</label>
                        <select
                            className="input"
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                        >
                            {productCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <Input
                            label="Precio"
                            type="number"
                            min="0"
                            value={formData.price}
                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                            required
                        />
                        <Input
                            label="Stock"
                            type="number"
                            min="0"
                            value={formData.stock}
                            onChange={e => setFormData({ ...formData, stock: e.target.value })}
                            required
                        />
                    </div>

                    <Input
                        label="URL de Imagen (Opcional)"
                        value={formData.imageUrl}
                        onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                        placeholder="https://..."
                    />

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <Button type="button" variant="secondary" onClick={closeModal} style={{ flex: 1 }}>Cancelar</Button>
                        <Button type="submit" style={{ flex: 1 }}>{editingProduct ? 'Guardar Cambios' : 'Crear Producto'}</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
