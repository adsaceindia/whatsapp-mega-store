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
      className="group bg-white dark:bg-slate-900 border border-neutral-200/80 dark:border-slate-800 rounded-2xl md:rounded-3xl overflow-hidden flex flex-col h-full shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer relative active:scale-[0.98]"
      onClick={() => navigate(`/product/${slugify(product.title)}`)}
    >
      {/* Product Image Container */}
      <div className="relative aspect-square bg-neutral-50 dark:bg-slate-800/40 flex items-center justify-center overflow-hidden p-2.5 md:p-4">
        <ResponsiveImage 
          src={product.image} 
          alt={product.title} 
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" 
        />
        
        {/* Discount Badge */}
        {discountPercent ? (
          <div className="absolute top-2 left-2 bg-gradient-to-r from-rose-600 to-red-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs tracking-wider">
            -{discountPercent}%
          </div>
        ) : product.sale ? (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs uppercase">
            SALE
          </div>
        ) : null}

        {/* Wishlist Heart Button */}
        <button
          className={`absolute top-2 right-2 p-1.5 md:p-2 rounded-full backdrop-blur-md transition-all active:scale-90 shadow-sm ${
            isWishlisted 
              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400' 
              : 'bg-white/80 text-neutral-400 hover:text-rose-500 dark:bg-slate-900/80 dark:text-slate-400'
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
          <Heart className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>
      </div>

      {/* Product Content & Details */}
      <div className="p-3 md:p-4 flex flex-col flex-grow text-left">
        
        {/* Rating Badge Chip */}
        <div className="flex items-center gap-1 mb-1">
          <div className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 text-[10px] md:text-xs font-bold">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{displayRating.toFixed(1)}</span>
          </div>
          <span className="text-[10px] md:text-xs text-neutral-400 font-medium">({displayCount})</span>
        </div>

        {/* Product Title */}
        <h3 className="text-xs md:text-sm font-bold text-neutral-900 dark:text-white line-clamp-2 mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
          {product.title}
        </h3>

        {/* Pricing Area */}
        <div className="mt-auto pt-1 mb-2.5 flex items-baseline gap-1.5 flex-wrap">
          <span className="text-sm md:text-base font-extrabold text-neutral-900 dark:text-white tracking-tight">
            {formatPrice(product.price)}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-neutral-400 line-through text-[10px] md:text-xs font-medium">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>

        {/* Full-width Add to Cart / Quick Buy Button */}
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
          className="w-full bg-emerald-700 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-[11px] md:text-xs font-extrabold py-2 px-3 rounded-xl active:scale-95 transition-all shadow-xs flex items-center justify-center gap-1.5 mt-1"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Add to Cart</span>
        </button>

      </div>
    </div>
  );
}
