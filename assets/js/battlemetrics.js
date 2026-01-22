/**
 * BATTLEMETRICS API INTEGRATION
 * Fetches live server status from BattleMetrics API
 * and updates the server status cards dynamically
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        API_BASE_URL: 'https://api.battlemetrics.com/servers',
        UPDATE_INTERVAL: 60000, // Update every 60 seconds
        TIMEOUT: 8000, // 8 second timeout for API calls
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 2000
    };

    // Utility Functions
    const utils = {
        /**
         * Safely escape HTML to prevent XSS
         */
        escapeHtml: (str) => {
            const div = document.createElement('div');
            div.textContent = str || '';
            return div.innerHTML;
        },

        /**
         * Calculate time ago from ISO timestamp
         */
        timeAgo: (isoString) => {
            if (!isoString) return 'Unknown';
            
            const now = Date.now();
            const then = new Date(isoString).getTime();
            const seconds = Math.max(0, Math.floor((now - then) / 1000));

            if (seconds < 60) return `${seconds}s ago`;
            const minutes = Math.floor(seconds / 60);
            if (minutes < 60) return `${minutes}m ago`;
            const hours = Math.floor(minutes / 60);
            if (hours < 24) return `${hours}h ago`;
            const days = Math.floor(hours / 24);
            return `${days}d ago`;
        },

        /**
         * Format player count with color coding
         */
        formatPlayerCount: (current, max) => {
            const players = parseInt(current) || 0;
            const maxPlayers = parseInt(max) || 0;
            
            return {
                text: `${players}/${maxPlayers}`,
                percentage: maxPlayers > 0 ? (players / maxPlayers) * 100 : 0
            };
        }
    };

    /**
     * Server Card Manager
     */
    class ServerCard {
        constructor(element) {
            this.element = element;
            this.serverId = element.dataset.serverId;
            this.retryCount = 0;
            
            // Cache DOM elements
            this.statusBadge = element.querySelector('.server-status-badge');
            this.statusDot = element.querySelector('.status-dot');
            this.statusText = element.querySelector('.status-text');
            this.statsGrid = element.querySelector('.server-stats-grid');
        }

        /**
         * Update card with server data
         */
        update(data) {
            try {
                const attributes = data?.data?.attributes || {};
                const status = (attributes.status || 'unknown').toLowerCase();
                
                // Update status badge
                this.updateStatus(status);
                
                // Update stats
                this.updateStats(attributes);
                
                // Reset retry count on success
                this.retryCount = 0;
                
                console.log(`[BattleMetrics] Updated server ${this.serverId}: ${status}`);
            } catch (error) {
                console.error(`[BattleMetrics] Error updating card ${this.serverId}:`, error);
                this.showError('Update failed');
            }
        }

        /**
         * Update status badge
         */
        updateStatus(status) {
            // Remove all status classes
            this.statusBadge.classList.remove('loading', 'online', 'offline');
            
            // Add appropriate status class
            this.statusBadge.classList.add(status);
            
            // Update text
            if (this.statusText) {
                this.statusText.textContent = status.charAt(0).toUpperCase() + status.slice(1);
            }
        }

        /**
         * Update server statistics
         */
        updateStats(attributes) {
            const players = attributes.players ?? '?';
            const maxPlayers = attributes.maxPlayers ?? '?';
            const ip = attributes.ip || attributes.address || '';
            const port = attributes.port || '';
            const name = attributes.name || 'Unknown';
            const updatedAt = attributes.updatedAt || attributes.time || null;

            const playerInfo = utils.formatPlayerCount(players, maxPlayers);

            this.statsGrid.innerHTML = `
                <div class="stat-item">
                    <i class="fas fa-users"></i>
                    <span class="stat-label">Players</span>
                    <span class="stat-value">${utils.escapeHtml(playerInfo.text)}</span>
                </div>
                <div class="stat-item">
                    <i class="fas fa-network-wired"></i>
                    <span class="stat-label">IP</span>
                    <span class="stat-value">${utils.escapeHtml(`${ip}:${port}`)}</span>
                </div>
                <div class="stat-item">
                    <i class="fas fa-clock"></i>
                    <span class="stat-label">Updated</span>
                    <span class="stat-value">${utils.escapeHtml(utils.timeAgo(updatedAt))}</span>
                </div>
                <div class="stat-item" style="grid-column: 1 / -1;">
                    <i class="fas fa-server"></i>
                    <span class="stat-label">Name</span>
                    <span class="stat-value">${utils.escapeHtml(name)}</span>
                </div>
            `;
        }

        /**
         * Show error state
         */
        showError(message) {
            this.updateStatus('offline');
            
            this.statsGrid.innerHTML = `
                <div class="stat-item" style="grid-column: 1 / -1;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span class="stat-label">Error</span>
                    <span class="stat-value">${utils.escapeHtml(message)}</span>
                </div>
            `;
        }

        /**
         * Show loading state
         */
        showLoading() {
            this.updateStatus('loading');
            
            this.statsGrid.innerHTML = `
                <div class="stat-item skeleton">
                    <i class="fas fa-users"></i>
                    <span class="stat-label">Players</span>
                    <span class="stat-value">--/--</span>
                </div>
                <div class="stat-item skeleton">
                    <i class="fas fa-network-wired"></i>
                    <span class="stat-label">IP</span>
                    <span class="stat-value">--</span>
                </div>
                <div class="stat-item skeleton">
                    <i class="fas fa-clock"></i>
                    <span class="stat-label">Updated</span>
                    <span class="stat-value">--</span>
                </div>
            `;
        }
    }

    /**
     * BattleMetrics API Manager
     */
    class BattleMetricsManager {
        constructor() {
            this.cards = [];
            this.updateInterval = null;
            this.init();
        }

        /**
         * Initialize manager
         */
        init() {
            console.log('[BattleMetrics] Initializing...');
            
            // Find all server cards
            const cardElements = document.querySelectorAll('.battlemetrics-card[data-server-id]');
            
            if (cardElements.length === 0) {
                console.log('[BattleMetrics] No server cards found');
                return;
            }

            // Create card instances
            cardElements.forEach(element => {
                this.cards.push(new ServerCard(element));
            });

            console.log(`[BattleMetrics] Found ${this.cards.length} server card(s)`);

            // Start updating
            this.startUpdates();
        }

        /**
         * Fetch server data from API
         */
        async fetchServerData(serverId, retryCount = 0) {
            const url = `${CONFIG.API_BASE_URL}/${serverId}`;
            
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/vnd.api+json'
                    },
                    cache: 'no-store',
                    mode: 'cors',
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
                    console.warn(`[BattleMetrics] Retry ${retryCount + 1}/${CONFIG.RETRY_ATTEMPTS} for server ${serverId}`);
                    await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
                    return this.fetchServerData(serverId, retryCount + 1);
                }

                throw error;
            }
        }

        /**
         * Update all server cards
         */
        async updateAll() {
            console.log('[BattleMetrics] Updating all servers...');

            const updatePromises = this.cards.map(async (card) => {
                try {
                    card.showLoading();
                    const data = await this.fetchServerData(card.serverId);
                    card.update(data);
                } catch (error) {
                    console.error(`[BattleMetrics] Failed to update server ${card.serverId}:`, error);
                    card.showError(error.message || 'Connection failed');
                }
            });

            await Promise.allSettled(updatePromises);
            console.log('[BattleMetrics] Update complete');
        }

        /**
         * Start periodic updates
         */
        startUpdates() {
            // Initial update
            this.updateAll();

            // Set up periodic updates
            this.updateInterval = setInterval(() => {
                this.updateAll();
            }, CONFIG.UPDATE_INTERVAL);

            console.log(`[BattleMetrics] Updates scheduled every ${CONFIG.UPDATE_INTERVAL / 1000}s`);
        }

        /**
         * Stop periodic updates
         */
        stopUpdates() {
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
                console.log('[BattleMetrics] Updates stopped');
            }
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.battleMetricsManager = new BattleMetricsManager();
        });
    } else {
        window.battleMetricsManager = new BattleMetricsManager();
    }

    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
        if (window.battleMetricsManager) {
            window.battleMetricsManager.stopUpdates();
        }
    });

})();
