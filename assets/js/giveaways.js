/**
 * GIVEAWAYS API INTEGRATION
 * Fetches live giveaway data from the Heresy Gaming giveaway site
 * and updates the giveaway card dynamically
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        UPDATE_INTERVAL: 120000, // Update every 2 minutes
        TIMEOUT: 5000,
        RETRY_ATTEMPTS: 2
    };

    /**
     * Utility Functions
     */
    const utils = {
        /**
         * Calculate minutes until next draw
         */
        minutesUntil: (isoString) => {
            if (!isoString) return null;
            
            try {
                const target = new Date(isoString);
                const now = new Date();
                const diff = target - now;
                
                if (diff < 0) return 0;
                
                return Math.round(diff / 60000); // Convert to minutes
            } catch (error) {
                console.error('[Giveaways] Error calculating time:', error);
                return null;
            }
        },

        /**
         * Format time remaining
         */
        formatTimeRemaining: (minutes) => {
            if (minutes === null || minutes === undefined) return '—';
            if (minutes === 0) return 'Imminent';
            if (minutes < 60) return `${minutes} min`;
            
            const hours = Math.floor(minutes / 60);
            const remainingMins = minutes % 60;
            
            if (hours < 24) {
                return remainingMins > 0 
                    ? `${hours}h ${remainingMins}m` 
                    : `${hours}h`;
            }
            
            const days = Math.floor(hours / 24);
            return `${days}d`;
        }
    };

    /**
     * Giveaway Card Manager
     */
    class GiveawayCard {
        constructor(element) {
            this.element = element;
            this.apiEndpoint = element.dataset.giveawayApi;
            
            if (!this.apiEndpoint) {
                console.warn('[Giveaways] No API endpoint configured');
                return;
            }

            // Cache DOM elements
            this.badge = element.querySelector('.giveaway-badge');
            this.badgeDot = element.querySelector('.badge-dot');
            this.keysRemaining = element.querySelector('#keys-remaining');
            this.nextDraw = element.querySelector('#next-draw');
            
            this.init();
        }

        /**
         * Initialize card
         */
        init() {
            console.log('[Giveaways] Initializing...');
            this.update();
            
            // Set up periodic updates
            setInterval(() => this.update(), CONFIG.UPDATE_INTERVAL);
        }

        /**
         * Fetch giveaway data
         */
        async fetchData(retryCount = 0) {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

            try {
                const response = await fetch(this.apiEndpoint, {
                    method: 'GET',
                    cache: 'no-store',
                    signal: controller.signal
                });

                clearTimeout(timeout);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                return await response.json();
            } catch (error) {
                clearTimeout(timeout);

                // Retry logic
                if (retryCount < CONFIG.RETRY_ATTEMPTS) {
                    console.warn(`[Giveaways] Retry ${retryCount + 1}/${CONFIG.RETRY_ATTEMPTS}`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return this.fetchData(retryCount + 1);
                }

                throw error;
            }
        }

        /**
         * Update card with data
         */
        async update() {
            try {
                const data = await this.fetchData();
                const giveaways = data.giveaways || [];

                // Calculate totals
                const totalRemaining = giveaways.reduce((sum, g) => 
                    sum + (g.remaining_keys || 0), 0
                );

                const activeGiveaways = giveaways.filter(g => 
                    g.state === 'active' && g.remaining_keys > 0
                );

                // Find next draw time
                const nextDrawTimes = giveaways
                    .filter(g => g.state === 'active' && g.next_draw_at)
                    .map(g => new Date(g.next_draw_at))
                    .filter(date => !isNaN(date.getTime()));

                let nextDrawMinutes = null;
                if (nextDrawTimes.length > 0) {
                    const soonest = new Date(Math.min(...nextDrawTimes));
                    nextDrawMinutes = utils.minutesUntil(soonest);
                }

                // Update UI
                this.updateUI({
                    totalRemaining,
                    hasActive: activeGiveaways.length > 0,
                    nextDrawMinutes
                });

                console.log('[Giveaways] Updated successfully', {
                    total: totalRemaining,
                    active: activeGiveaways.length,
                    nextDraw: nextDrawMinutes
                });

            } catch (error) {
                console.error('[Giveaways] Update failed:', error);
                this.updateUI({
                    totalRemaining: '—',
                    hasActive: false,
                    nextDrawMinutes: null,
                    error: true
                });
            }
        }

        /**
         * Update UI elements
         */
        updateUI({ totalRemaining, hasActive, nextDrawMinutes, error = false }) {
            // Update keys remaining
            if (this.keysRemaining) {
                this.keysRemaining.textContent = error ? '—' : totalRemaining;
            }

            // Update next draw
            if (this.nextDraw) {
                if (error) {
                    this.nextDraw.textContent = '—';
                } else if (nextDrawMinutes !== null) {
                    this.nextDraw.textContent = utils.formatTimeRemaining(nextDrawMinutes);
                } else {
                    this.nextDraw.textContent = hasActive ? 'Scheduled' : '—';
                }
            }

            // Update badge
            if (this.badge) {
                this.badge.classList.remove('checking', 'live', 'queued');
                
                if (error) {
                    this.badge.classList.add('checking');
                    this.badge.querySelector('.status-text')?.textContent = 'Error';
                } else if (hasActive) {
                    this.badge.classList.add('live');
                    this.badge.querySelector('.status-text')?.textContent = 'Live';
                } else {
                    this.badge.classList.add('queued');
                    this.badge.querySelector('.status-text')?.textContent = 'Queued';
                }
            }
        }
    }

    /**
     * Initialize when DOM is ready
     */
    function init() {
        const giveawayCard = document.querySelector('[data-giveaway-api]');
        
        if (giveawayCard) {
            window.giveawayCard = new GiveawayCard(giveawayCard);
        } else {
            console.log('[Giveaways] Card not found on this page');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
