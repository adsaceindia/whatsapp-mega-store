const fs = require('fs');

let css = fs.readFileSync('src/index.css', 'utf8');

const themeUpdates = `
  /* Responsive Typography (Fluid Sizing) */
  --font-size-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
  --font-size-sm: clamp(0.875rem, 0.8rem + 0.375vw, 1rem);
  --font-size-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
  --font-size-lg: clamp(1.125rem, 1rem + 0.625vw, 1.25rem);
  --font-size-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem);
  --font-size-2xl: clamp(1.5rem, 1.3rem + 1vw, 1.875rem);
  --font-size-3xl: clamp(1.875rem, 1.6rem + 1.375vw, 2.25rem);
  --font-size-4xl: clamp(2.25rem, 1.9rem + 1.75vw, 3rem);
  --font-size-5xl: clamp(3rem, 2.5rem + 2.5vw, 4rem);
  --font-size-6xl: clamp(3.75rem, 3.2rem + 2.75vw, 4.5rem);
  --font-size-7xl: clamp(4.5rem, 3.8rem + 3.5vw, 6rem);
  
  /* Fluid Spacing tokens */
  --spacing-1: clamp(0.25rem, 0.2rem + 0.2vw, 0.375rem);
  --spacing-2: clamp(0.5rem, 0.4rem + 0.4vw, 0.75rem);
  --spacing-3: clamp(0.75rem, 0.6rem + 0.6vw, 1rem);
  --spacing-4: clamp(1rem, 0.8rem + 0.8vw, 1.25rem);
  --spacing-5: clamp(1.25rem, 1rem + 1vw, 1.5rem);
  --spacing-6: clamp(1.5rem, 1.2rem + 1.2vw, 1.875rem);
  --spacing-8: clamp(2rem, 1.6rem + 1.6vw, 2.5rem);
  --spacing-10: clamp(2.5rem, 2rem + 2vw, 3rem);
  --spacing-12: clamp(3rem, 2.4rem + 2.4vw, 3.5rem);
  --spacing-16: clamp(4rem, 3.2rem + 3.2vw, 5rem);
`;

if (css.includes('@theme {') && !css.includes('--font-size-xs')) {
  css = css.replace('@theme {', '@theme {' + themeUpdates);
}

// Add standard button classes
const buttonStyles = `
@layer components {
  /* Standardized buttons */
  .btn {
    @apply inline-flex items-center justify-center font-bold tracking-wide transition-all duration-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 active:scale-[0.98] gap-2 border border-transparent cursor-pointer;
  }
  .btn-primary {
    @apply bg-primary text-white hover:bg-primary/90 shadow-sm;
  }
  .btn-secondary {
    @apply bg-surface-container text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface border-outline-variant shadow-sm;
  }
  .btn-sm {
    @apply px-4 py-2 text-xs md:text-sm;
  }
  .btn-md {
    @apply px-6 py-2.5 text-sm md:text-base;
  }
  .btn-lg {
    @apply px-8 py-3.5 text-base md:text-lg;
  }
  
  /* Standardized images */
  .img-standard {
    @apply object-cover w-full h-full;
  }
  .img-contain {
    @apply object-contain w-full h-full;
  }
}
`;

if (!css.includes('.btn-primary')) {
  css += '\n' + buttonStyles;
}

fs.writeFileSync('src/index.css', css);
console.log("Updated index.css");
