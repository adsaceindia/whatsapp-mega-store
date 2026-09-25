import React from 'react';
import { useNavigate } from 'react-router';
import { useCart } from '../../context/CartContext';
import { slugify } from '../../utils/slugify';
import { getDeterministicRating } from '../../services/productService';
import { ResponsiveImage } from './ResponsiveImage';
import { Heart, Star, ShoppingBag, Plus, Sparkles } from 'lucide-react';

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
      className="group bg-white dark:bg-slate-900 border border-neutral-200/70 dark:border-slate-800/80 rounded-2xl md:rounded-3xl overflow-hidden flex flex-col h-full shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer relative active:scale-[0.98]"
      onClick={() => navigate(`/product/${slugify(product.title)}`)}
    >
      {/* Product Image Container */}
      <div className="relative aspect-square bg-neutral-50 dark:bg-slate-800/50 flex items-center justify-center overflow-hidden p-3 md:p-4">
        <ResponsiveImage 
          src={product.image} 
          alt={product.title} 
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" 
        />
        
        {/* Discount Badge */}
        {discountPercent ? (
          <div className="absolute top-2.5 left-2.5 bg-gradient-to-r from-rose-600 to-red-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs tracking-wider">
            -{discountPercent}% OFF
          </div>
        ) : product.sale ? (
          <div className="absolute top-2.5 left-2.5 bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs uppercase">
            SALE
          </div>
        ) : null}

        {/* Floating Wishlist Heart Button */}
        <button
          className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md transition-all active:scale-90 shadow-sm ${
            isWishlisted 
              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400' 
              : 'bg-white/80 text-neutral-400 hover:text-rose-500 dark:bg-slate-900/80 dark:text-slate-400'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            const success = toggleWishlist(product);
            if (success) {
              triggerToast(isWishlisted ? `Removed "${product.title}" from saved` : `Saved "${product.title}" to wishlist!`);
            }
          }}
          title="Wishlist"
        >
          <Heart className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>

        {/* Quick Add Floating Action Button (FAB for Mobile & Desktop) */}
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
              triggerToast(`Added "${product.title}" to cart!`);
            }
          }}
          className="absolute bottom-2.5 right-2.5 w-8 h-8 md:w-9 md:h-9 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-600/30 active:scale-90 transition-all"
          title="Quick Buy / Add to Cart"
        >
          <Plus className="w-4 h-4 md:w-5 md:h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* Product Content & Typography */}
      <div className="p-3 md:p-4 flex flex-col flex-grow text-left">
        
        {/* Rating Badge Chip */}
        <div className="flex items-center gap-1 mb-1.5">
          <div className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-md text-[10px] md:text-xs font-bold">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{displayRating.toFixed(1)}</span>
          </div>
          <span className="text-[10px] md:text-xs text-neutral-400 font-medium">({displayCount})</span>
        </div>

        {/* Product Title */}
        <h3 className="text-xs md:text-sm font-semibold text-neutral-900 dark:text-white line-clamp-2 mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
          {product.title}
        </h3>

        {/* Pricing Area */}
        <div className="mt-auto pt-1 flex items-center justify-between gap-1">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-sm md:text-base font-extrabold text-neutral-900 dark:text-white tracking-tight">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-neutral-400 line-through text-[10px] md:text-xs font-medium">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Desktop Add to Cart Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              addToCart({ 
                productId: product.id, 
                title: product.title, 
                price: product.price, 
                image: product.image, 
                quantity: 1, 
                size: product.sizes?.[0], 
                color: product.colors?.[0] 
              });
              triggerToast(`Added "${product.title}" to cart!`);
            }}
            className="hidden md:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>

      </div>
    </div>
  );
}
