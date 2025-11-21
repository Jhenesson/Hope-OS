
import React, { useState, useMemo } from 'react';
import { Product, ProductCategory } from '../types';
import { Modal } from '../components/Modal';
import { useAppContext } from '../context/AppContext';

const categoryColors: { [key in ProductCategory]: string } = {
    [ProductCategory.VideoAcustico]: 'bg-red-100 text-red-800',
    [ProductCategory.VideoBanda]: 'bg-red-100 text-red-800',
    [ProductCategory.HopeSession]: 'bg-orange-100 text-orange-800',
    [ProductCategory.PocketShow]: 'bg-pink-100 text-pink-800',
    [ProductCategory.DrumDay]: 'bg-purple-100 text-purple-800',
    [ProductCategory.ProducaoMusical]: 'bg-purple-100 text-purple-800',
    [ProductCategory.Gravacao]: 'bg-blue-100 text-blue-800',
    [ProductCategory.PosProducaoAudio]: 'bg-yellow-100 text-yellow-800',
};

const ProductCard: React.FC<{ product: Product; onClick: () => void }> = ({ product, onClick }) => (
    <button onClick={onClick} className="bg-white rounded-2xl border border-border-color shadow-sm p-6 flex flex-col justify-between text-left transition-transform transform hover:-translate-y-1 w-full">
        <div>
            <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold text-primary-text">{product.name}</h3>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${categoryColors[product.category]}`}>
                    {product.category}
                </span>
            </div>
            <p className="text-sm text-secondary-text mt-2 h-10 overflow-hidden">{product.description}</p>
        </div>
        <div className="flex justify-between items-end mt-4">
            <p className="text-2xl font-bold text-primary-text">{product.price}</p>
            <p className="text-sm font-medium text-secondary-text">{product.horasEstimadas}h estimadas</p>
        </div>
    </button>
);

const initialProductState: Omit<Product, 'id'> = {
    name: '',
    price: '',
    description: '',
    category: ProductCategory.Gravacao,
    horasEstimadas: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

export const ProductsPage: React.FC = () => {
    const { appState, setAppState } = useAppContext();
    const { products } = appState;
    const [activeFilter, setActiveFilter] = useState<ProductCategory | 'All'>('All');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Omit<Product, 'id'> | Product>(initialProductState);

    const filteredProducts = useMemo(() => {
        if (activeFilter === 'All') {
            return products;
        }
        return products.filter(p => p.category === activeFilter);
    }, [products, activeFilter]);

    const categories = ['All', ...Object.values(ProductCategory)];

    const handleOpenDetailsModal = (product: Product) => {
        setSelectedProduct(product);
    };

    const handleCloseDetailsModal = () => {
        setSelectedProduct(null);
    };

    const handleOpenFormModal = (product: Product | null) => {
        if (product) {
            setCurrentProduct(product);
        } else {
            setCurrentProduct(initialProductState);
        }
        setIsFormModalOpen(true);
    };

    const handleCloseFormModal = () => {
        setIsFormModalOpen(false);
        setCurrentProduct(initialProductState);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setCurrentProduct(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) : value,
        }));
    };

    const handleSaveProduct = (e: React.FormEvent) => {
        e.preventDefault();
        const now = new Date().toISOString();
        if ('id' in currentProduct) { // Editing existing product
            const updatedProduct = { ...currentProduct, updatedAt: now };
            setAppState(prev => ({
                ...prev,
                products: prev.products.map(p => p.id === updatedProduct.id ? updatedProduct : p)
            }));
        } else { // Adding new product
            const newProduct: Product = {
                id: `prod-${Date.now()}`,
                ...currentProduct,
                createdAt: now,
                updatedAt: now
            };
            setAppState(prev => ({ ...prev, products: [newProduct, ...prev.products] }));
        }
        handleCloseFormModal();
    };


    return (
        <div className="h-full flex flex-col">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                <h2 className="text-3xl font-bold text-primary-text">Produtos & Serviços</h2>
                <button 
                    onClick={() => handleOpenFormModal(null)}
                    className="rounded-full px-5 py-2 bg-apple-blue text-white font-medium hover:bg-apple-blue-hover transition-colors">
                    Adicionar Produto
                </button>
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
                {categories.map(category => (
                    <button
                        key={category}
                        onClick={() => setActiveFilter(category as ProductCategory | 'All')}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                            activeFilter === category
                                ? 'bg-primary-text text-white'
                                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        {category === 'All' ? 'Todos' : category}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map(product => (
                    <ProductCard key={product.id} product={product} onClick={() => handleOpenDetailsModal(product)} />
                ))}
            </div>

            {selectedProduct && (
                <Modal isOpen={!!selectedProduct} onClose={handleCloseDetailsModal} title={selectedProduct.name}>
                    <div className="space-y-4">
                        <p className="text-secondary-text">{selectedProduct.description}</p>
                        <div className="flex items-center justify-between pt-4 border-t border-border-color mt-4">
                            <span className={`px-2.5 py-1 text-sm font-semibold rounded-full ${categoryColors[selectedProduct.category]}`}>
                                {selectedProduct.category}
                            </span>
                             <p className="text-sm font-medium text-secondary-text">{selectedProduct.horasEstimadas}h estimadas</p>
                        </div>
                         <div className="flex items-end justify-between">
                            <p className="text-3xl font-bold text-primary-text">{selectedProduct.price}</p>
                            <button
                                onClick={() => {
                                    handleCloseDetailsModal();
                                    handleOpenFormModal(selectedProduct);
                                }}
                                className="rounded-full px-5 py-2 bg-apple-blue text-white font-medium hover:bg-apple-blue-hover transition-colors text-sm"
                            >
                                Editar
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {isFormModalOpen && (
                <Modal isOpen={isFormModalOpen} onClose={handleCloseFormModal} title={'id' in currentProduct ? 'Editar Produto' : 'Adicionar Produto'}>
                    <form onSubmit={handleSaveProduct} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-secondary-text mb-1">Nome do Produto</label>
                            <input type="text" name="name" id="name" value={currentProduct.name} onChange={handleFormChange} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white" required/>
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="price" className="block text-sm font-medium text-secondary-text mb-1">Preço Padrão</label>
                                <input type="text" name="price" id="price" value={currentProduct.price} onChange={handleFormChange} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white" placeholder="R$ 500 ou R$ 150 / hora" required/>
                            </div>
                            <div>
                                <label htmlFor="horasEstimadas" className="block text-sm font-medium text-secondary-text mb-1">Horas Estimadas</label>
                                <input type="number" name="horasEstimadas" id="horasEstimadas" value={currentProduct.horasEstimadas} onChange={handleFormChange} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white" min="0" step="0.5" required/>
                            </div>
                        </div>
                         <div>
                            <label htmlFor="category" className="block text-sm font-medium text-secondary-text mb-1">Categoria</label>
                            <select name="category" id="category" value={currentProduct.category} onChange={handleFormChange} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white">
                                {Object.values(ProductCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="description" className="block text-sm font-medium text-secondary-text mb-1">Descrição</label>
                            <textarea name="description" id="description" value={currentProduct.description} onChange={handleFormChange} rows={3} className="w-full px-3 py-2 border border-border-color rounded-lg bg-white"></textarea>
                        </div>
                        <div className="pt-4 flex justify-end gap-3">
                            <button type="button" onClick={handleCloseFormModal} className="rounded-full px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-100 transition-colors">Cancelar</button>
                            <button type="submit" className="rounded-full px-5 py-2 bg-apple-blue text-white font-medium hover:bg-apple-blue-hover transition-colors">Salvar Produto</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};