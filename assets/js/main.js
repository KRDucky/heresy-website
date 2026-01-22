/**
 * HERESY GAMING NETWORK - MAIN JAVASCRIPT
 * General site functionality and utilities
 */

(function() {
    'use strict';

    /**
     * Navbar Scroll Effect
     */
    class NavbarManager {
        constructor() {
            this.navbar = document.querySelector('.heresy-navbar');
            this.scrollThreshold = 50;
            
            if (this.navbar) {
                this.init();
            }
        }

        init() {
            window.addEventListener('scroll', () => this.handleScroll());
            this.handleScroll(); // Initial check
        }

        handleScroll() {
            if (window.scrollY > this.scrollThreshold) {
                this.navbar.classList.add('scrolled');
            } else {
                this.navbar.classList.remove('scrolled');
            }
        }
    }

    /**
     * Smooth Scroll for Anchor Links
     */
    class SmoothScroll {
        constructor() {
            this.init();
        }

        init() {
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', (e) => {
                    const href = anchor.getAttribute('href');
                    
                    // Skip empty anchors or those that just close modals
                    if (!href || href === '#' || href.startsWith('#modal')) {
                        return;
                    }

                    const target = document.querySelector(href);
                    
                    if (target) {
                        e.preventDefault();
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                });
            });
        }
    }

    /**
     * Active Navigation Link Highlighter
     */
    class NavLinkHighlighter {
        constructor() {
            this.init();
        }

        init() {
            const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
            
            document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
                const linkPath = new URL(link.href, window.location.origin).pathname.replace(/\/$/, '') || '/';
                
                if (linkPath === currentPath) {
                    link.classList.add('active');
                    link.setAttribute('aria-current', 'page');
                } else {
                    link.classList.remove('active');
                    link.removeAttribute('aria-current');
                }
            });
        }
    }

    /**
     * Footer Year Auto-Update
     */
    class FooterYearUpdater {
        constructor() {
            this.init();
        }

        init() {
            const yearElements = document.querySelectorAll('#currentYear, #year');
            const currentYear = new Date().getFullYear();
            
            yearElements.forEach(element => {
                element.textContent = currentYear;
            });
        }
    }

    /**
     * Lazy Loading for Images
     */
    class LazyLoader {
        constructor() {
            this.init();
        }

        init() {
            if ('IntersectionObserver' in window) {
                const imageObserver = new IntersectionObserver((entries, observer) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const img = entry.target;
                            if (img.dataset.src) {
                                img.src = img.dataset.src;
                                img.removeAttribute('data-src');
                                observer.unobserve(img);
                            }
                        }
                    });
                });

                document.querySelectorAll('img[data-src]').forEach(img => {
                    imageObserver.observe(img);
                });
            } else {
                // Fallback for older browsers
                document.querySelectorAll('img[data-src]').forEach(img => {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                });
            }
        }
    }

    /**
     * External Link Handler
     * Adds security attributes to external links
     */
    class ExternalLinkHandler {
        constructor() {
            this.init();
        }

        init() {
            document.querySelectorAll('a[href^="http"]').forEach(link => {
                const url = new URL(link.href);
                
                // Check if it's an external link
                if (url.hostname !== window.location.hostname) {
                    // Add security attributes if not already present
                    if (!link.hasAttribute('rel')) {
                        link.setAttribute('rel', 'noopener noreferrer');
                    }
                    
                    // Add target blank if not already set
                    if (!link.hasAttribute('target')) {
                        link.setAttribute('target', '_blank');
                    }
                }
            });
        }
    }

    /**
     * Console Art
     */
    class ConsoleArt {
        constructor() {
            this.init();
        }

        init() {
            const art = `
╔═══════════════════════════════════════════════╗
║                                               ║
║     HERESY GAMING NETWORK                     ║
║     Warhammer 40K Gaming Community            ║
║                                               ║
║     "In the grim darkness of the far future,  ║
║      there is only gaming."                   ║
║                                               ║
╚═══════════════════════════════════════════════╝

Interested in joining our community?
Visit: https://discord.gg/g3uuQFgahv

Looking for technical details?
This site is built with:
- Bootstrap 5.3.3
- Custom Warhammer 40K theming
- BattleMetrics API integration
- Self-hosted infrastructure

For the Emperor!
`;
            
            console.log(art);
            
            // Add some styling if browser supports it
            console.log(
                '%c⚙️ Heresy Gaming Network %c- Built with dedication',
                'background: #d4af37; color: #000; font-weight: bold; padding: 5px 10px;',
                'background: #141826; color: #d4af37; padding: 5px 10px;'
            );
        }
    }

    /**
     * Performance Monitor (Development Only)
     */
    class PerformanceMonitor {
        constructor() {
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                this.init();
            }
        }

        init() {
            window.addEventListener('load', () => {
                if (window.performance && window.performance.timing) {
                    const timing = window.performance.timing;
                    const loadTime = timing.loadEventEnd - timing.navigationStart;
                    const domReadyTime = timing.domContentLoadedEventEnd - timing.navigationStart;
                    
                    console.log(`⚡ Performance Metrics:
  - Page Load: ${loadTime}ms
  - DOM Ready: ${domReadyTime}ms
  - DNS Lookup: ${timing.domainLookupEnd - timing.domainLookupStart}ms
  - Server Response: ${timing.responseEnd - timing.requestStart}ms
                    `);
                }
            });
        }
    }

    /**
     * Accessibility Helpers
     */
    class AccessibilityHelpers {
        constructor() {
            this.init();
        }

        init() {
            // Ensure skip links work properly
            document.querySelectorAll('a[href^="#"]').forEach(link => {
                link.addEventListener('click', (e) => {
                    const target = document.querySelector(link.getAttribute('href'));
                    if (target) {
                        target.setAttribute('tabindex', '-1');
                        target.focus();
                    }
                });
            });

            // Add keyboard navigation for cards
            document.querySelectorAll('.server-card, .game-card, .giveaway-card').forEach(card => {
                const link = card.querySelector('a');
                if (link && !card.hasAttribute('tabindex')) {
                    card.setAttribute('tabindex', '0');
                    card.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            link.click();
                        }
                    });
                }
            });
        }
    }

    /**
     * Notification System (for future use)
     */
    class NotificationSystem {
        constructor() {
            this.container = null;
            this.init();
        }

        init() {
            // Create notification container
            this.container = document.createElement('div');
            this.container.className = 'notification-container';
            this.container.style.cssText = `
                position: fixed;
                top: 100px;
                right: 20px;
                z-index: 9999;
                max-width: 400px;
            `;
            document.body.appendChild(this.container);
        }

        show(message, type = 'info', duration = 5000) {
            const notification = document.createElement('div');
            notification.className = `alert alert-${type} alert-dismissible fade show`;
            notification.setAttribute('role', 'alert');
            notification.innerHTML = `
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            `;

            this.container.appendChild(notification);

            // Auto dismiss
            if (duration > 0) {
                setTimeout(() => {
                    notification.classList.remove('show');
                    setTimeout(() => notification.remove(), 300);
                }, duration);
            }
        }
    }

    /**
     * Initialize All Modules
     */
    function initializeApp() {
        console.log('[HGN] Initializing application...');

        // Core functionality
        new NavbarManager();
        new SmoothScroll();
        new NavLinkHighlighter();
        new FooterYearUpdater();
        new LazyLoader();
        new ExternalLinkHandler();
        new AccessibilityHelpers();
        
        // Development tools
        new ConsoleArt();
        new PerformanceMonitor();

        // Make notification system globally available
        window.HGN = window.HGN || {};
        window.HGN.notify = new NotificationSystem();

        console.log('[HGN] Application initialized successfully');

        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('hgn:ready'));
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeApp);
    } else {
        initializeApp();
    }

    /**
     * Service Worker Registration (for future PWA features)
     */
    if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
        window.addEventListener('load', () => {
            // Uncomment when service worker is ready
            // navigator.serviceWorker.register('/sw.js')
            //     .then(reg => console.log('[SW] Registered:', reg))
            //     .catch(err => console.error('[SW] Registration failed:', err));
        });
    }

})();
