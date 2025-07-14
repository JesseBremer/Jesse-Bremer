// Zelda Ocarina of Time Music System
class OcarinaPlayer {
    constructor() {
        this.audioContext = null;
        this.isPlaying = false;
        this.noteFrequencies = {
            'C': 261.63,
            'D': 293.66,
            'E': 329.63,
            'F': 349.23,
            'G': 392.00,
            'A': 440.00,
            'B': 493.88
        };
        
        this.songs = {
            'zelda': ['E', 'F', 'E', 'F', 'E', 'F', 'A', 'G'], // Zelda's Lullaby
            'epona': ['D', 'A', 'B', 'D', 'A', 'B'], // Epona's Song
            'saria': ['F', 'A', 'B', 'F', 'A', 'B'] // Saria's Song
        };
        
        this.init();
    }
    
    init() {
        // Initialize audio context on first user interaction
        document.addEventListener('click', () => {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
        }, { once: true });
        
        // Add event listeners for ocarina buttons
        document.querySelectorAll('.ocarina-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const note = e.target.dataset.note;
                this.playNote(note);
                this.animateButton(e.target);
            });
        });
        
        // Add event listeners for song buttons
        document.querySelectorAll('.song-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const song = e.target.dataset.song;
                this.playSong(song);
                this.animateSongButton(e.target);
            });
        });
    }
    
    playNote(note, duration = 0.5) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(this.noteFrequencies[note], this.audioContext.currentTime);
        oscillator.type = 'sine';
        
        // Create envelope for more musical sound
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    async playSong(songName) {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        const notes = this.songs[songName];
        
        for (let i = 0; i < notes.length; i++) {
            this.playNote(notes[i], 0.6);
            this.highlightNote(notes[i]);
            await this.wait(700);
        }
        
        this.isPlaying = false;
    }
    
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    animateButton(button) {
        button.style.transform = 'scale(0.95)';
        button.style.boxShadow = '0 0 20px var(--triforce-gold)';
        
        setTimeout(() => {
            button.style.transform = 'scale(1)';
            button.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
        }, 150);
    }
    
    animateSongButton(button) {
        button.style.transform = 'translateY(-2px) scale(0.95)';
        button.style.boxShadow = '0 0 25px var(--triforce-gold)';
        
        setTimeout(() => {
            button.style.transform = 'translateY(0) scale(1)';
            button.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
        }, 300);
    }
    
    highlightNote(note) {
        const button = document.querySelector(`[data-note="${note}"]`);
        if (button) {
            button.style.background = 'linear-gradient(145deg, var(--triforce-gold), var(--hyrule-gold))';
            button.style.transform = 'scale(1.1)';
            button.style.boxShadow = '0 0 25px var(--triforce-gold)';
            
            setTimeout(() => {
                button.style.background = 'linear-gradient(145deg, var(--hyrule-light-green), var(--kokiri-green))';
                button.style.transform = 'scale(1)';
                button.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
            }, 500);
        }
    }
}

// Magical particle effects
class MagicalEffects {
    constructor() {
        this.particles = [];
        this.canvas = null;
        this.ctx = null;
        this.init();
    }
    
    init() {
        // Create canvas for particle effects
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '1000';
        document.body.appendChild(this.canvas);
        
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        
        window.addEventListener('resize', () => this.resize());
        
        // Create particles when hovering over highlight boxes
        document.querySelectorAll('.highlight-box').forEach(box => {
            box.addEventListener('mouseenter', () => this.createParticles(box));
        });
        
        this.animate();
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    createParticles(element) {
        const rect = element.getBoundingClientRect();
        const colors = ['#FFD700', '#D4AF37', '#F7E98E', '#228B22'];
        
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: rect.left + Math.random() * rect.width,
                y: rect.top + Math.random() * rect.height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                life: 1,
                decay: 0.02,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 3 + 1
            });
        }
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= particle.decay;
            
            if (particle.life > 0) {
                this.ctx.save();
                this.ctx.globalAlpha = particle.life;
                this.ctx.fillStyle = particle.color;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
                return true;
            }
            return false;
        });
        
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new OcarinaPlayer();
    new MagicalEffects();
    
    // Add triforce symbol animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes triforce-glow {
            0%, 100% { text-shadow: 2px 2px 4px rgba(0,0,0,0.8); }
            50% { text-shadow: 0 0 20px var(--triforce-gold), 2px 2px 4px rgba(0,0,0,0.8); }
        }
        
        h1, h2, h3 {
            animation: triforce-glow 3s ease-in-out infinite;
        }
    `;
    document.head.appendChild(style);
});