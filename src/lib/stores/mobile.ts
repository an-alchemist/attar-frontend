import { browser } from '$app/environment';
import { readable, derived } from 'svelte/store';

// Breakpoint for mobile (matches Tailwind's md breakpoint)
const MOBILE_BREAKPOINT = 768;

// Create a reactive store for window width
function createWindowWidth() {
    if (!browser) {
        return readable(1024); // Default to desktop for SSR
    }
    
    return readable(window.innerWidth, (set) => {
        const handleResize = () => set(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    });
}

export const windowWidth = createWindowWidth();

// Derived store for mobile detection
export const isMobile = derived(windowWidth, ($width) => $width < MOBILE_BREAKPOINT);

// Derived store for tablet detection (768-1024)
export const isTablet = derived(windowWidth, ($width) => $width >= MOBILE_BREAKPOINT && $width < 1024);

// Derived store for desktop detection
export const isDesktop = derived(windowWidth, ($width) => $width >= 1024);

// Touch device detection
export const isTouchDevice = readable(false, (set) => {
    if (!browser) return;
    
    const checkTouch = () => {
        set('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    
    checkTouch();
});

