import React from 'react';
import { useNavigate } from 'react-router';
import { useCart } from '../../context/CartContext';
import { slugify } from '../../utils/slugify';
import { getDeterministicRating } from '../../services/productService';
import { ResponsiveImage } from './ResponsiveImage';
import { Heart, Star, ShoppingBag, Plus } from 'lucide-react';

interface ProductGridItemProps {
  product: any;
  key?: React.Key;
  triggerToast: (msg: string) => void;
  onQuickBuy?: (product: any) => void;
}

export function ProductGridItem({ product, triggerToast, onQuickBuy }: ProductGridItemProps) {
  const navigate = useNavigate();
  const { isInWishlist, toggleWishlist, formatPrice, addToCart } = useCart();
  const isWishlisted = isInWishlist(product.id);

  const discountPercent = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  const { rating, count } = getDeterministicRating(product.id || '', product.title || '');
  const displayRating = product.ratingValue || rating;
  const displayCount = product.ratingCount || count;

  return (
    <div 
      className="group bg-white dark:bg-slate-900 border-none overflow-hidden flex flex-col h-full hover:shadow-lg transition-all duration-300 cursor-pointer relative active:scale-[0.99] text-left"
      onClick={() => navigate(`/product/${slugify(product.title)}`)}
    >
      {/* Product Image Container */}
      <div className="relative aspect-[3/4] bg-[#F9F9F9] dark:bg-slate-800/40 flex items-center justify-center overflow-hidden p-2">
        <ResponsiveImage 
          src={product.image} 
          alt={product.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
        />
        
        {/* Discount Badge */}
        {discountPercent ? (
          <div className="absolute top-2 left-2 bg-[#DD8560] text-white text-[9px] font-tenor uppercase tracking-widest px-2 py-0.5 shadow-xs">
            -{discountPercent}%
          </div>
        ) : product.sale ? (
          <div className="absolute top-2 left-2 bg-[#111111] text-white text-[9px] font-tenor uppercase tracking-widest px-2 py-0.5">
            SALE
          </div>
        ) : null}

        {/* Wishlist Heart Button */}
        <button
          className={`absolute top-2 right-2 p-1.5 rounded-full transition-all active:scale-90 ${
            isWishlisted 
              ? 'text-[#DD8560]' 
              : 'text-neutral-400 hover:text-[#DD8560]'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            const success = toggleWishlist(product);
            if (success) {
              triggerToast(isWishlisted ? `Removed "${product.title}"` : `Saved "${product.title}"!`);
            }
          }}
          title="Wishlist"
        >
          <Heart className={`w-4 h-4 stroke-[1.5] ${isWishlisted ? 'fill-[#DD8560] text-[#DD8560]' : ''}`} />
        </button>
      </div>

      {/* Product Content & Details */}
      <div className="pt-2.5 pb-2 px-1 flex flex-col flex-grow text-center items-center">
        
        {/* Rating Star Chip */}
        <div className="flex items-center gap-1 mb-1 justify-center">
          <div className="inline-flex items-center gap-1 text-[#DD8560] text-[10px] font-medium">
            <Star className="w-3 h-3 fill-[#DD8560] text-[#DD8560]" />
            <span>{displayRating.toFixed(1)}</span>
          </div>
          <span className="text-[10px] text-neutral-400">({displayCount})</span>
        </div>

        {/* Product Title */}
        <h3 className="font-tenor text-xs sm:text-sm text-neutral-900 dark:text-white uppercase tracking-wider line-clamp-1 mb-1 group-hover:text-[#DD8560] transition-colors">
          {product.title}
        </h3>

        {/* Color Swatch Preview Dots */}
        {product.colors && product.colors.length > 0 && (
          <div className="flex items-center justify-center gap-1 mb-1.5">
            {product.colors.slice(0, 3).map((col: string, idx: number) => (
              <span
                key={idx}
                className="w-2.5 h-2.5 rounded-full border border-neutral-300 dark:border-slate-700 shadow-2xs"
                style={{ backgroundColor: col.startsWith('#') ? col : '#DDD' }}
                title={col}
              />
            ))}
            {product.colors.length > 3 && (
              <span className="text-[9px] font-mono text-neutral-400 font-medium">
                +{product.colors.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Pricing Area */}
        <div className="mt-auto pt-0.5 mb-2 flex items-baseline gap-2 justify-center">
          <span className="font-tenor text-sm sm:text-base text-[#DD8560] font-normal tracking-wide">
            {formatPrice(product.price)}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-neutral-400 line-through text-xs font-tenor">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>

        {/* Minimalist Open Fashion Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onQuickBuy) {
              onQuickBuy(product);
            } else {
              addToCart({ 
                productId: product.id, 
                title: product.title, 
                price: product.price, 
                image: product.image, 
                quantity: 1, 
                size: product.sizes?.[0], 
                color: product.colors?.[0] 
              });
              triggerToast(`Added "${product.title}" to bag!`);
            }
          }}
          className="w-full bg-[#111111] hover:bg-[#DD8560] dark:bg-slate-800 dark:hover:bg-[#DD8560] text-white text-[10px] md:text-xs font-tenor uppercase tracking-luxury py-2 px-2 transition-colors flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3 h-3" />
          <span>Add To Bag</span>
        </button>

      </div>
    </div>
  );
}
