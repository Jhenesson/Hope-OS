import React, { useState, useMemo } from 'react';
import { MOCK_PRODUCTS } from '../constants';
import { Product, ProductCategory } from '../types';
import { Modal } from '../components/Modal';

const categoryColors: { [key in ProductCategory]: string } = {
    [ProductCategory.Vídeo]: 'bg-red-100 text-red-800',
    [ProductCategory.ProduçãoMusical]: 'bg-purple-100 text-purple-800',
    [ProductCategory.GravaçãoDeÁudio]: 'bg-blue-100 text-blue-800',
    [ProductCategory.PósProduçãoDeÁudio]: 'bg-yellow-100 text-yellow-800',
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
            <p className="text-sm text-secondary-text mt-2">{product.description}</p>
        </div>
        <p className="text-2xl font-bold text-primary-text mt-4">{product.price}</p>
    </button>
);

export const ProductsPage: React.FC = () => {
    const [products] = useState<Product[]>(MOCK_PRODUCTS);
    const [activeFilter, setActiveFilter] = useState<ProductCategory | 'All'>('All');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    const filteredProducts = useMemo(() => {
        if (activeFilter === 'All') {
            return products;
        }
        return products.filter(p => p.category === activeFilter);
    }, [products, activeFilter]);

    const categories = ['All', ...Object.values(ProductCategory)];

    const handleOpenModal = (product: Product) => {
        setSelectedProduct(product);
    };

    const handleCloseModal = () => {
        setSelectedProduct(null);
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                <h2 className="text-3xl font-bold text-primary-text">Produtos & Serviços</h2>
                <button className="rounded-full px-5 py-2 bg-apple-blue text-white font-medium hover:bg-apple-blue-hover transition-colors">
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
                    <ProductCard key={product.id} product={product} onClick={() => handleOpenModal(product)} />
                ))}
            </div>

            {selectedProduct && (
                <Modal isOpen={!!selectedProduct} onClose={handleCloseModal} title={selectedProduct.name}>
                    <div className="space-y-4">
                        <p className="text-secondary-text">{selectedProduct.description}</p>
                        <div className="flex items-center justify-between pt-4 border-t border-border-color mt-4">
                            <span className={`px-2.5 py-1 text-sm font-semibold rounded-full ${categoryColors[selectedProduct.category]}`}>
                                {selectedProduct.category}
                            </span>
                            <p className="text-3xl font-bold text-primary-text">{selectedProduct.price}</p>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};
