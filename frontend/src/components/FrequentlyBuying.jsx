import React, { useEffect, useState } from 'react';
import { ProductCardScrollable } from './ProductCard';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


const FrequentlyBuying = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/product?frequently_bought=true`)
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch(() => setProducts([]));
  }, []);

  return (
    <div className="mt-2">
      <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-4">Frequently Bought from Customers</h1>
      <div className="flex overflow-x-auto gap-3 sm:gap-4 px-1">
        {products.map((product) => (
          <ProductCardScrollable
            key={product.id}
            id={product.id}
            image={Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : undefined}
            name={product.name}
            actualPrice={product.actual_price}
            sellingPrice={product.selling_price}
          />
        ))}
      </div>
    </div>
  );
};

export default FrequentlyBuying;