import { useEffect, useRef } from 'react';

/**
 * Custom hook to detect horizontal swipe gestures.
 * @param {Object} options
 * @param {Function} options.onSwipeLeft - Callback when swiping left (next page)
 * @param {Function} options.onSwipeRight - Callback when swiping right (previous page)
 * @param {number} options.threshold - Minimum distance in pixels to trigger swipe (default: 50)
 */
export default function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 70 }) {
    const touchStart = useRef(null);
    const touchEnd = useRef(null);

    useEffect(() => {
        const handleTouchStart = (e) => {
            // Ignore if multiple touches
            if (e.touches.length > 1) return;

            // Ignore if swiping on an element that should handle its own horizontal scroll
            const target = e.target;
            const isScrollable = (el) => {
                const style = window.getComputedStyle(el);
                return (
                    (el.scrollWidth > el.clientWidth) &&
                    (style.overflowX === 'auto' || style.overflowX === 'scroll')
                );
            };

            let current = target;
            while (current && current !== document.body) {
                if (isScrollable(current)) return;
                current = current.parentElement;
            }

            touchStart.current = e.targetTouches[0].clientX;
            touchEnd.current = null;
        };

        const handleTouchMove = (e) => {
            if (touchStart.current === null) return;
            touchEnd.current = e.targetTouches[0].clientX;
        };

        const handleTouchEnd = () => {
            if (!touchStart.current || !touchEnd.current) return;

            const distance = touchStart.current - touchEnd.current;
            const isLeftSwipe = distance > threshold;
            const isRightSwipe = distance < -threshold;

            if (isLeftSwipe && onSwipeLeft) {
                onSwipeLeft();
            } else if (isRightSwipe && onSwipeRight) {
                onSwipeRight();
            }

            touchStart.current = null;
            touchEnd.current = null;
        };

        window.addEventListener('touchstart', handleTouchStart);
        window.addEventListener('touchmove', handleTouchMove);
        window.addEventListener('touchend', handleTouchEnd);

        return () => {
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [onSwipeLeft, onSwipeRight, threshold]);
}
