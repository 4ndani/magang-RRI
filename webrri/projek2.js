// =================================
// AUDIO STREAMING RRI - JAVASCRIPT
// =================================

class AudioStreamingApp {
    constructor() {
        this.state = {
            startTime: Date.now(),
            activeStreams: 0,
            players: 3,
            isInitialized: false
        };
        
        this.config = {
            updateInterval: 1000,
            bgCycleInterval: 12000,
            particleCount: {
                desktop: 50,
                mobile: 30
            }
        };
        
        this.bgColors = [
            'linear-gradient(135deg, rgb(173, 216, 230) 0%, rgb(135, 206, 235) 25%, rgb(70, 130, 180) 75%, rgb(25, 25, 112) 100%)',
            'linear-gradient(135deg, rgb(176, 224, 230) 0%, rgb(135, 206, 235) 25%, rgb(100, 149, 237) 75%, rgb(65, 105, 225) 100%)',
            'linear-gradient(135deg, rgb(175, 238, 238) 0%, rgb(135, 206, 235) 25%, rgb(72, 209, 204) 75%, rgb(70, 130, 180) 100%)',
            'linear-gradient(135deg, rgb(173, 216, 230) 0%, rgb(95, 158, 160) 25%, rgb(70, 130, 180) 75%, rgb(25, 25, 112) 100%)',
            'linear-gradient(135deg, rgb(176, 196, 222) 0%, rgb(135, 206, 235) 25%, rgb(100, 149, 237) 75%, rgb(30, 144, 255) 100%)',
            'linear-gradient(135deg, rgb(224, 255, 255) 0%, rgb(175, 238, 238) 25%, rgb(95, 158, 160) 75%, rgb(70, 130, 180) 100%)'
        ];
        
        this.currentBgIndex = 0;
        this.intervals = [];
    }

    // =================================
    // UTILITY FUNCTIONS
    // =================================
    
    getAudioElement(playerNum) {
        return document.querySelector(`[data-player="${playerNum}"] audio`);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    isMobile() {
        return window.innerWidth < 768;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.9);
            color: #333;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // =================================
    // AUDIO CONTROL FUNCTIONS
    // =================================
    
    togglePlay(playerNum) {
        const audio = this.getAudioElement(playerNum);
        if (!audio) return;

        if (audio.paused) {
            // Stop other players first (optional - uncomment if you want only one stream at a time)
            // this.stopAllExcept(playerNum);
            
            audio.play()
                .then(() => {
                    this.showNotification(`Player ${playerNum} started`, 'success');
                    this.updatePlayButton(playerNum, true);
                })
                .catch(e => {
                    console.error('Play failed:', e);
                    this.showNotification(`Failed to start Player ${playerNum}`, 'error');
                    this.handleAudioError(audio, playerNum);
                });
        } else {
            audio.pause();
            this.updatePlayButton(playerNum, false);
            this.showNotification(`Player ${playerNum} paused`, 'info');
        }
        
        this.updateStreamCount();
    }

    pauseAudio(playerNum) {
        const audio = this.getAudioElement(playerNum);
        if (!audio) return;

        audio.pause();
        this.updatePlayButton(playerNum, false);
        this.showNotification(`Player ${playerNum} paused`, 'info');
        this.updateStreamCount();
    }

    stopAudio(playerNum) {
        const audio = this.getAudioElement(playerNum);
        if (!audio) return;

        audio.pause();
        audio.currentTime = 0;
        this.updatePlayButton(playerNum, false);
        this.showNotification(`Player ${playerNum} stopped`, 'info');
        this.updateStreamCount();
    }

    stopAllExcept(exceptPlayerNum) {
        for (let i = 1; i <= this.state.players; i++) {
            if (i !== exceptPlayerNum) {
                this.stopAudio(i);
            }
        }
    }

    stopAllPlayers() {
        for (let i = 1; i <= this.state.players; i++) {
            this.stopAudio(i);
        }
    }

    setVolume(playerNum, volume) {
        const audio = this.getAudioElement(playerNum);
        if (!audio) return;

        audio.volume = volume / 100;
        const displayElement = document.getElementById(`volume-display-${playerNum}`);
        if (displayElement) {
            displayElement.textContent = volume + '%';
        }
        
        // Store volume preference
        localStorage.setItem(`player-${playerNum}-volume`, volume);
    }

    updatePlayButton(playerNum, isPlaying) {
        const button = document.querySelector(`[data-player="${playerNum}"] .play-btn`);
        if (button) {
            button.innerHTML = isPlaying ? '⏸️ Pause' : '▶️ Play';
            button.classList.toggle('playing', isPlaying);
        }
    }

    // =================================
    // STATISTICS FUNCTIONS
    // =================================
    
    updateStreamCount() {
        const audios = document.querySelectorAll('audio');
        let activeStreams = 0;
        
        audios.forEach(audio => {
            if (!audio.paused) activeStreams++;
        });
        
        this.state.activeStreams = activeStreams;
        
        const element = document.getElementById('total-streams');
        if (element) {
            element.textContent = activeStreams;
        }
    }

    updateUptime() {
        const now = Date.now();
        const uptime = Math.floor((now - this.state.startTime) / 1000);
        
        const element = document.getElementById('uptime');
        if (element) {
            element.textContent = this.formatTime(uptime);
        }
    }

    updateActivePlayersDisplay() {
        const element = document.getElementById('active-players');
        if (element) {
            element.textContent = this.state.players;
        }
    }

    // =================================
    // VISUAL EFFECTS
    // =================================
    
    createParticles() {
        const particlesContainer = document.getElementById('particles');
        if (!particlesContainer) return;

        // Clear existing particles
        particlesContainer.innerHTML = '';
        
        const particleCount = this.isMobile() ? 
            this.config.particleCount.mobile : 
            this.config.particleCount.desktop;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 6 + 's';
            particle.style.animationDuration = (Math.random() * 3 + 3) + 's';
            particlesContainer.appendChild(particle);
        }
    }

    addCardEffects() {
        const cards = document.querySelectorAll('.player-card');
        cards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-10px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
            });
        });
    }

    cycleBgColors() {
        this.currentBgIndex = (this.currentBgIndex + 1) % this.bgColors.length;
        document.body.style.background = this.bgColors[this.currentBgIndex];
    }

    addLogoInteraction() {
        const logo = document.querySelector('.logo');
        if (!logo) return;

        logo.addEventListener('click', () => {
            logo.style.transform = 'scale(1.3) rotate(360deg)';
            setTimeout(() => {
                logo.style.transform = 'scale(1) rotate(0deg)';
            }, 500);
        });
    }

    // =================================
    // ERROR HANDLING
    // =================================
    
    handleAudioError(audio, playerNum) {
        console.error(`Audio error for player ${playerNum}:`, audio.error);
        
        const card = document.querySelector(`[data-player="${playerNum}"]`);
        if (card) {
            const statusIndicator = card.querySelector('.status-indicator');
            if (statusIndicator) {
                statusIndicator.style.background = '#ff6b6b';
                statusIndicator.style.animation = 'none';
            }
        }
        
        this.showNotification(`Connection error for Player ${playerNum}`, 'error');
    }

    // =================================
    // INITIALIZATION
    // =================================
    
    setupAudioEventListeners() {
        document.querySelectorAll('audio').forEach((audio, index) => {
            const playerNum = index + 1;
            
            // Event listeners
            audio.addEventListener('play', () => {
                this.updateStreamCount();
                this.updatePlayButton(playerNum, true);
            });
            
            audio.addEventListener('pause', () => {
                this.updateStreamCount();
                this.updatePlayButton(playerNum, false);
            });
            
            audio.addEventListener('ended', () => {
                this.updateStreamCount();
                this.updatePlayButton(playerNum, false);
            });
            
            audio.addEventListener('error', () => {
                this.handleAudioError(audio, playerNum);
            });
            
            audio.addEventListener('loadstart', () => {
                console.log(`Loading started for player ${playerNum}`);
            });
            
            audio.addEventListener('canplay', () => {
                console.log(`Can play player ${playerNum}`);
            });
            
            // Set initial volume from localStorage or default
            const savedVolume = localStorage.getItem(`player-${playerNum}-volume`);
            const initialVolume = savedVolume ? parseInt(savedVolume) : 50;
            audio.volume = initialVolume / 100;
            
            // Update volume display
            const volumeSlider = document.querySelector(`[data-player="${playerNum}"] .volume-slider`);
            if (volumeSlider) {
                volumeSlider.value = initialVolume;
            }
            
            const volumeDisplay = document.getElementById(`volume-display-${playerNum}`);
            if (volumeDisplay) {
                volumeDisplay.textContent = initialVolume + '%';
            }
        });
    }

    startTimers() {
        // Update statistics
        const statsInterval = setInterval(() => {
            this.updateStreamCount();
            this.updateUptime();
        }, this.config.updateInterval);
        
        // Background color cycling
        const bgInterval = setInterval(() => {
            this.cycleBgColors();
        }, this.config.bgCycleInterval);
        
        // Store intervals for cleanup
        this.intervals.push(statsInterval, bgInterval);
    }

    setupGlobalEventListeners() {
        // Handle window resize
        window.addEventListener('resize', () => {
            this.createParticles();
        });
        
        // Handle visibility change (pause when tab is hidden)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Optionally pause all audio when tab is hidden
                // this.stopAllPlayers();
            }
        });
        
        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.stopAllPlayers();
            }
        });
    }

    setupGlobalFunctions() {
        // Make functions available globally for HTML onclick handlers
        window.togglePlay = (playerNum) => this.togglePlay(playerNum);
        window.pauseAudio = (playerNum) => this.pauseAudio(playerNum);
        window.stopAudio = (playerNum) => this.stopAudio(playerNum);
        window.setVolume = (playerNum, volume) => this.setVolume(playerNum, volume);
    }

    init() {
        if (this.state.isInitialized) return;
        
        console.log('Initializing Audio Streaming RRI App...');
        
        // Setup global functions first
        this.setupGlobalFunctions();
        
        // Create visual effects
        this.createParticles();
        this.addCardEffects();
        this.addLogoInteraction();
        
        // Setup audio
        this.setupAudioEventListeners();
        
        // Start timers
        this.startTimers();
        
        // Setup global event listeners
        this.setupGlobalEventListeners();
        
        // Update initial statistics
        this.updateActivePlayersDisplay();
        this.updateStreamCount();
        this.updateUptime();
        
        this.state.isInitialized = true;
        console.log('Audio Streaming RRI App initialized successfully!');
    }

    // =================================
    // CLEANUP
    // =================================
    
    destroy() {
        // Clear all intervals
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals = [];
        
        // Stop all audio
        this.stopAllPlayers();
        
        // Remove event listeners
        document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
        window.removeEventListener('resize', this.resizeHandler);
        
        this.state.isInitialized = false;
        console.log('Audio Streaming RRI App destroyed');
    }
}

// =================================
// INITIALIZE APPLICATION
// =================================

// Create global app instance
const audioStreamingApp = new AudioStreamingApp();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        audioStreamingApp.init();
    });
} else {
    audioStreamingApp.init();
}

// =================================
// ADDITIONAL UTILITY FUNCTIONS
// =================================

// Add some CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .notification.success {
        border-left: 4px solid #4ecdc4;
    }
    
    .notification.error {
        border-left: 4px solid #ff6b6b;
    }
    
    .notification.info {
        border-left: 4px solid #45b7d1;
    }
    
    .btn.playing {
        background: linear-gradient(45deg, #4ecdc4, #45b7d1);
    }
`;
document.head.appendChild(style);

// Export for module systems (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioStreamingApp;
}
       