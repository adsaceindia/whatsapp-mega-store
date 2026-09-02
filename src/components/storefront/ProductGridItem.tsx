import React from 'react';
import { useNavigate } from 'react-router';
import { useCart } from '../../context/CartContext';
import { slugify } from '../../utils/slugify';
import { getDeterministicRating } from '../../services/productService';
import { ResponsiveImage } from './ResponsiveImage';

interface ProductGridItemProps {
  product: any;
  key?: React.Key;
  triggerToast: (msg: string) => void;
}

export function ProductGridItem({ product, triggerToast }: ProductGridItemProps) {
  const navigate = useNavigate();
  const { isInWishlist, toggleWishlist, formatPrice, addToCart } = useCart();

  return (
    <div 
      className="bg-white border border-neutral-200 rounded-lg overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow cursor-pointer relative"
      onClick={() => navigate(`/product/${slugify(product.title)}`)}
    >
      <div className="relative aspect-square bg-neutral-50 flex items-center justify-center overflow-hidden p-1.5 md:p-2">
        <ResponsiveImage 
          src={product.image} 
          alt={product.title} 
          className="w-full h-full object-contain hover:scale-105 transition-transform duration-500" 
        />
        {/* Wishlist Button */}
        <button
          className={`absolute top-2 right-2 p-1.5 md:p-2 rounded-full bg-transparent transition-all ${isInWishlist(product.id) ? 'text-primary' : 'text-neutral-400 hover:text-primary'}`}
          onClick={(e) => {
            e.stopPropagation();
            const success = toggleWishlist(product);
            if (success) {
              triggerToast(isInWishlist(product.id) ? `Removed "${product.title}" from wishlist.` : `Saved "${product.title}" to wishlist!`);
            }
          }}
        >
          <span className="material-symbols-outlined text-[16px] md:text-[20px] block" style={{ fontVariationSettings: isInWishlist(product.id) ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
        </button>
        
        {product.sale && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] md:text-[12px] font-bold px-2 py-0.5 rounded uppercase">
            SALE
          </div>
        )}
      </div>
      
      <div className="p-2 md:p-3 flex flex-col flex-grow">
        <h3 className="text-xs md:text-sm font-medium text-neutral-800 line-clamp-2 mb-1 group-hover:text-primary transition-colors leading-tight" title={product.title}>
          {product.title}
        </h3>
        
        {(() => {
          const { rating, count } = getDeterministicRating(product.id || '', product.title || '');
          const displayRating = product.ratingValue || rating;
          const displayCount = product.ratingCount || count;
          return (
            <div className="flex items-center gap-1 mb-1 md:mb-2">
              <div className="flex text-amber-500">
                <span className="material-symbols-outlined text-[12px] md:text-[14px] font-bold select-none" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
              </div>
              <span className="text-[10px] md:text-xs font-medium text-neutral-700">{displayRating.toFixed(1)}</span>
              <span className="text-[10px] md:text-xs text-neutral-500">({displayCount})</span>
            </div>
          );
        })()}
        
        <div className="mt-auto pt-2">
          <div className="flex items-baseline gap-1 md:gap-2 flex-wrap">
            <span className="text-sm md:text-lg font-bold text-neutral-900 leading-none">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-neutral-500 line-through text-[10px] md:text-xs">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
          
          <div className="flex gap-1 md:gap-2 mt-2 md:mt-3">
            <button 
              className="btn btn-primary btn-sm flex-1 text-[10px] sm:text-xs md:text-sm px-2 md:px-4"
              onClick={(e) => {
                e.stopPropagation();
                addToCart({ productId: product.id, title: product.title, price: product.price, image: product.image, quantity: 1, size: product.sizes?.[0], color: product.colors?.[0] });
                triggerToast(`Added "${product.title}" to cart!`);
              }}
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
