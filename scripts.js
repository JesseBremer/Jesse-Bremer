class OcarinaPlayer {
    constructor() {
        this.audioContext = null;
        this.isPlaying = false;
        this.currentSong = [];
        this.maxNotesOnStaff = 16;
        
        this.keyMapping = {
            'ArrowUp': 'A',
            'ArrowDown': 'F', 
            'ArrowLeft': 'D',
            'ArrowRight': 'B',
            'KeyA': 'G'
        };
        
        this.noteToArrow = {
            'A': '↑',
            'F': '↓',
            'D': '←',
            'B': '→',
            'G': 'A'
        };
        
        this.noteFrequencies = {
            'A': 440.00,
            'F': 349.23,
            'D': 293.66,
            'B': 493.88,
            'G': 392.00
        };
        
        this.notePositions = {
            'A': 5,
            'G': 15,
            'F': 25,
            'E': 35,
            'D': 45,
            'C': 55,
            'B': 65
        };
        
        this.songs = {
            'zelda': ['D', 'F', 'A', 'D', 'F', 'A', 'D'],
            'epona': ['A', 'B', 'A', 'A', 'B', 'A'],
            'saria': ['F', 'A', 'B', 'F', 'A', 'B']
        };
        
        this.init();
    }
    
    init() {
        document.addEventListener('click', () => {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
        }, { once: true });
        
        document.addEventListener('keydown', (e) => {
            if (this.keyMapping[e.code]) {
                e.preventDefault();
                this.handleNotePlay(this.keyMapping[e.code], e.code);
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (this.keyMapping[e.code]) {
                this.handleNoteRelease(e.code);
            }
        });
        
        document.querySelectorAll('.ocarina-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const note = e.target.dataset.note;
                const key = e.target.dataset.key;
                this.handleNotePlay(note, key);
                this.animateButton(e.target);
                
                setTimeout(() => {
                    this.handleNoteRelease(key);
                }, 300);
            });
        });
        
        document.querySelectorAll('.song-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const song = e.target.dataset.song;
                this.playSong(song);
                this.animateSongButton(e.target);
            });
        });
        
        document.querySelector('.clear-staff-btn').addEventListener('click', () => {
            this.clearStaff();
        });
    }
    
    handleNotePlay(note, keyCode) {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        this.playNote(note);
        this.addNoteToStaff(note);
        this.highlightKey(keyCode);
        
        this.currentSong.push(note);
        if (this.currentSong.length > this.maxNotesOnStaff) {
            this.currentSong.shift();
            this.refreshStaff();
        }
    }
    
    handleNoteRelease(keyCode) {
        this.unhighlightKey(keyCode);
    }
    
    playNote(note, duration = 0.5) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(this.noteFrequencies[note], this.audioContext.currentTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    addNoteToStaff(note) {
        const notesContainer = document.querySelector('.notes-container');
        const noteElement = document.createElement('div');
        noteElement.className = 'musical-note';
        noteElement.textContent = this.noteToArrow[note] || note;
        
        const yPosition = this.notePositions[note] || 45;
        const xPosition = notesContainer.children.length * 35 + 10;
        
        noteElement.style.top = yPosition + 'px';
        noteElement.style.left = xPosition + 'px';
        
        notesContainer.appendChild(noteElement);
        
        if (notesContainer.children.length > this.maxNotesOnStaff) {
            notesContainer.removeChild(notesContainer.firstChild);
            this.repositionNotes();
        }
    }
    
    repositionNotes() {
        const notesContainer = document.querySelector('.notes-container');
        Array.from(notesContainer.children).forEach((note, index) => {
            note.style.left = (index * 35 + 10) + 'px';
        });
    }
    
    clearStaff() {
        const notesContainer = document.querySelector('.notes-container');
        notesContainer.innerHTML = '';
        this.currentSong = [];
    }
    
    refreshStaff() {
        this.clearStaff();
        this.currentSong.forEach(note => {
            this.addNoteToStaff(note);
        });
    }
    
    async playSong(songName) {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.clearStaff();
        const notes = this.songs[songName];
        
        for (let i = 0; i < notes.length; i++) {
            this.playNote(notes[i], 0.8);
            this.addNoteToStaff(notes[i]);
            this.highlightNote(notes[i]);
            await this.wait(900);
        }
        
        this.isPlaying = false;
    }
    
    highlightKey(keyCode) {
        const button = document.querySelector(`[data-key="${keyCode}"]`);
        if (button) {
            button.classList.add('active');
        }
        
        const keyDisplays = document.querySelectorAll('.key-display');
        keyDisplays.forEach(display => {
            const keyText = display.textContent.trim();
            if ((keyCode === 'ArrowUp' && keyText === '↑') ||
                (keyCode === 'ArrowDown' && keyText === '↓') ||
                (keyCode === 'ArrowLeft' && keyText === '←') ||
                (keyCode === 'ArrowRight' && keyText === '→') ||
                (keyCode === 'KeyA' && keyText === 'A')) {
                display.style.transform = 'scale(1.1)';
                display.style.boxShadow = '0 0 15px var(--triforce-gold)';
            }
        });
    }
    
    unhighlightKey(keyCode) {
        const button = document.querySelector(`[data-key="${keyCode}"]`);
        if (button) {
            button.classList.remove('active');
        }
        
        const keyDisplays = document.querySelectorAll('.key-display');
        keyDisplays.forEach(display => {
            display.style.transform = 'scale(1)';
            display.style.boxShadow = '0 3px 6px rgba(0,0,0,0.3)';
        });
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
            button.classList.add('active');
            
            setTimeout(() => {
                button.classList.remove('active');
            }, 700);
        }
    }
}

class NaviCursor {
    constructor() {
        this.cursor = null;
        this.trailParticles = [];
        this.lastX = 0;
        this.lastY = 0;
        this.init();
    }
    
    init() {
        this.cursor = document.createElement('div');
        this.cursor.className = 'navi-cursor';
        this.cursor.innerHTML = `
            <div class="navi-body"></div>
            <div class="navi-wing left"></div>
            <div class="navi-wing right"></div>
        `;
        document.body.appendChild(this.cursor);
        
        document.addEventListener('mousemove', (e) => {
            this.updateCursor(e.clientX, e.clientY);
            this.createTrail(e.clientX, e.clientY);
        });
        
        document.addEventListener('mouseleave', () => {
            this.cursor.style.opacity = '0';
        });
        
        document.addEventListener('mouseenter', () => {
            this.cursor.style.opacity = '1';
        });
    }
    
    updateCursor(x, y) {
        this.cursor.style.left = x + 'px';
        this.cursor.style.top = y + 'px';
        this.lastX = x;
        this.lastY = y;
    }
    
    createTrail(x, y) {
        const trail = document.createElement('div');
        trail.className = 'fairy-trail';
        trail.style.left = (x + Math.random() * 10 - 5) + 'px';
        trail.style.top = (y + Math.random() * 10 - 5) + 'px';
        document.body.appendChild(trail);
        
        setTimeout(() => {
            if (trail.parentNode) {
                trail.parentNode.removeChild(trail);
            }
        }, 800);
    }
}

class MagicalEffects {
    constructor() {
        this.particles = [];
        this.canvas = null;
        this.ctx = null;
        this.init();
    }
    
    init() {
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
        
        document.querySelectorAll('.highlight-box').forEach(box => {
            box.addEventListener('mouseenter', () => this.createParticles(box));
        });
        
        document.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyA'].includes(e.code)) {
                this.createMusicParticles();
            }
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
    
    createMusicParticles() {
        const staffContainer = document.querySelector('.music-staff-container');
        if (!staffContainer) return;
        
        const rect = staffContainer.getBoundingClientRect();
        const colors = ['#FFD700', '#F7E98E', '#228B22'];
        
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: rect.left + Math.random() * rect.width,
                y: rect.top + rect.height * 0.5,
                vx: (Math.random() - 0.5) * 4,
                vy: -Math.random() * 3 - 1,
                life: 1,
                decay: 0.015,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 4 + 2
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

document.addEventListener('DOMContentLoaded', () => {
    new OcarinaPlayer();
    new MagicalEffects();
    new NaviCursor();
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes triforce-glow {
            0%, 100% { text-shadow: 2px 2px 4px rgba(0,0,0,0.8); }
            50% { text-shadow: 0 0 20px var(--triforce-gold), 2px 2px 4px rgba(0,0,0,0.8); }
        }
        
        h1, h2, h3 {
            animation: triforce-glow 3s ease-in-out infinite;
        }
        
        .key-display {
            transition: all 0.2s ease;
        }
    `;
    document.head.appendChild(style);
    
    document.addEventListener('keydown', (e) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyA'].includes(e.code)) {
            document.body.classList.add('keyboard-active');
        }
    });
});