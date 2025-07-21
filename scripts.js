class OcarinaPlayer {
    constructor() {
        this.audioContext = null;
        this.isPlaying = false;
        this.currentSong = [];
        this.maxNotesOnStaff = 16;
        this.lastPlayedKey = null;
        this.activeOscillators = new Map();
        this.isRecording = false;
        this.recordedSong = [];
        this.recordingStartTime = null;
        
        this.keyMapping = {
            'ArrowUp': 'B5',
            'ArrowDown': 'D5', 
            'ArrowLeft': 'A5',
            'ArrowRight': 'E5',
            'KeyA': 'F5'
        };
        
        this.noteToArrow = {
            'B5': '↑',
            'F5': 'A',
            'D5': '↓',
            'A5': '←',
            'E5': '→'
        };
        
        this.noteFrequencies = {
            'D5': 587.33,
            'E5': 659.25,
            'F5': 698.46,
            'A5': 880.00,
            'B5': 987.77
        };
        
        this.notePositions = {
            'B5': 5,
            'A5': 15,
            'G5': 25,
            'F5': 35,
            'E5': 45,
            'D5': 55,
            'C5': 65
        };
        
        this.songs = {
            'zelda': ['A5', 'B5', 'E5', 'A5', 'B5', 'E5'],
            'epona': ['B5', 'A5', 'E5', 'B5', 'A5', 'E5'],
            'saria': ['D5', 'E5', 'A5', 'D5', 'E5', 'A5'],
            'sun': ['E5', 'D5', 'B5', 'E5', 'D5', 'B5'],
            'song_of_time': ['E5', 'F5', 'D5', 'E5', 'F5', 'D5'],
            'song_of_storms': ['F5', 'D5', 'B5', 'F5', 'D5', 'B5'],
            'minuet': ['F5', 'B5', 'A5', 'E5', 'A5', 'E5'],
            'bolero': ['D5', 'F5', 'D5', 'F5', 'E5', 'D5', 'E5', 'D5'],
            'serenade': ['F5', 'D5', 'E5', 'E5', 'A5'],
            'requiem': ['F5', 'D5', 'F5', 'E5', 'D5', 'F5'],
            'nocturne': ['A5', 'E5', 'E5', 'F5', 'A5', 'E5', 'D5'],
            'prelude': ['B5', 'E5', 'B5', 'E5', 'A5', 'B5']
        };
        
        this.songNames = {
            'zelda': "Zelda's Lullaby",
            'epona': "Epona's Song", 
            'saria': "Saria's Song (Lost Woods)",
            'sun': "Sun's Song",
            'song_of_time': "Song of Time",
            'song_of_storms': "Song of Storms", 
            'minuet': "Minuet of Forest",
            'bolero': "Bolero of Fire",
            'serenade': "Serenade of Water",
            'requiem': "Requiem of Spirit", 
            'nocturne': "Nocturne of Shadow",
            'prelude': "Prelude of Light"
        };
        
        this.currentSongName = "Your Song";
        this.lastRecognizedSong = null;
        
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
                if (!e.repeat) {
                    this.handleNotePlay(this.keyMapping[e.code], e.code);
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (this.keyMapping[e.code]) {
                this.handleNoteRelease(e.code);
            }
        });
        
        document.querySelectorAll('.ocarina-btn').forEach(btn => {
            // Mouse/touch events for buttons
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                const note = e.target.dataset.note;
                const key = e.target.dataset.key;
                this.handleNotePlay(note, key);
                this.animateButton(e.target);
            });
            
            btn.addEventListener('mouseup', (e) => {
                const key = e.target.dataset.key;
                this.handleNoteRelease(key);
            });
            
            btn.addEventListener('mouseleave', (e) => {
                const key = e.target.dataset.key;
                this.handleNoteRelease(key);
            });
            
            // Touch events for mobile devices
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const note = e.target.dataset.note;
                const key = e.target.dataset.key;
                this.handleNotePlay(note, key);
                this.animateButton(e.target);
            });
            
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                const key = e.target.dataset.key;
                this.handleNoteRelease(key);
            });
            
            btn.addEventListener('touchcancel', (e) => {
                const key = e.target.dataset.key;
                this.handleNoteRelease(key);
            });
            
            // Keep the original click for fallback
            btn.addEventListener('click', (e) => {
                e.preventDefault();
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
        
        document.querySelector('.record-btn').addEventListener('click', () => {
            this.toggleRecording();
        });
        
        document.querySelector('.play-custom-btn').addEventListener('click', () => {
            this.playCustomSong();
        });
        
        // Handle window resize to reposition notes
        window.addEventListener('resize', () => {
            this.repositionNotes();
        });
        
        // Initialize the staff title
        this.updateStaffTitle();
    }
    
    handleNotePlay(note, keyCode) {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        if (this.activeOscillators.has(keyCode)) {
            return;
        }
        
        this.lastPlayedKey = keyCode;
        this.startSustainedNote(note, keyCode);
        this.addNoteToStaff(note);
        this.highlightKey(keyCode);
        
        if (this.isRecording) {
            this.recordNote(note);
        }
        
        this.currentSong.push(note);
        if (this.currentSong.length > this.maxNotesOnStaff) {
            this.currentSong.shift();
            this.refreshStaff();
        }
        
        // Check for song recognition
        this.checkSongRecognition();
    }
    
    handleNoteRelease(keyCode) {
        this.stopSustainedNote(keyCode);
        this.unhighlightKey(keyCode);
    }
    
    startSustainedNote(note, keyCode) {
        if (!this.audioContext || !this.noteFrequencies[note]) return;
        
        if (this.activeOscillators.has(keyCode)) {
            return;
        }

        const now = this.audioContext.currentTime;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        const noise = this.audioContext.createBufferSource();
        const noiseGain = this.audioContext.createGain();

        oscillator.type = 'triangle'; 
        oscillator.frequency.setValueAtTime(this.noteFrequencies[note], now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, now); 

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.35, now + 0.05);
        gainNode.gain.linearRampToValueAtTime(0.25, now + 0.15);

        const bufferSize = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.25; 
        }

        noise.buffer = buffer;
        noise.loop = true;
        noiseGain.gain.setValueAtTime(0.02, now);

        const vibrato = this.audioContext.createOscillator();
        const vibratoGain = this.audioContext.createGain();
        vibrato.frequency.setValueAtTime(5.8, now); 
        vibratoGain.gain.setValueAtTime(4.5, now); 

        vibrato.connect(vibratoGain);
        vibratoGain.connect(oscillator.frequency);

        oscillator.connect(filter);
        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        vibrato.start(now);
        noise.start(now);
        oscillator.start(now);

        this.activeOscillators.set(keyCode, {
            oscillator,
            gainNode,
            filter,
            noise,
            noiseGain,
            vibrato,
            vibratoGain
        });
    }

    stopSustainedNote(keyCode) {
        const audioNodes = this.activeOscillators.get(keyCode);
        if (!audioNodes) return;

        const now = this.audioContext.currentTime;
        const fadeOutTime = 0.1;

        audioNodes.gainNode.gain.exponentialRampToValueAtTime(0.001, now + fadeOutTime);

        setTimeout(() => {
            try {
                audioNodes.oscillator.stop();
                audioNodes.vibrato.stop();
                audioNodes.noise.stop();
            } catch (e) {
                // Nodes may have already been stopped
            }
            this.activeOscillators.delete(keyCode);
        }, fadeOutTime * 1000 + 50);
    }

    playOcarinaNote(note, duration = 0.5) {
        if (!this.audioContext || !this.noteFrequencies[note]) return;

        const now = this.audioContext.currentTime;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        const noise = this.audioContext.createBufferSource();
        const noiseGain = this.audioContext.createGain();

        oscillator.type = 'triangle'; 
        oscillator.frequency.setValueAtTime(this.noteFrequencies[note], now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, now); 

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.35, now + 0.05);
        gainNode.gain.linearRampToValueAtTime(0.25, now + 0.15);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

        const bufferSize = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.25; 
        }

        noise.buffer = buffer;
        noise.loop = true;
        noiseGain.gain.setValueAtTime(0.02, now);

        const vibrato = this.audioContext.createOscillator();
        const vibratoGain = this.audioContext.createGain();
        vibrato.frequency.setValueAtTime(5.8, now); 
        vibratoGain.gain.setValueAtTime(4.5, now); 

        vibrato.connect(vibratoGain);
        vibratoGain.connect(oscillator.frequency);

        oscillator.connect(filter);
        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        vibrato.start(now);
        vibrato.stop(now + duration);

        noise.start(now);
        noise.stop(now + duration);

        oscillator.start(now);
        oscillator.stop(now + duration);
    }
    
    addNoteToStaff(note) {
        const notesContainer = document.querySelector('.notes-container');
        const noteElement = document.createElement('div');
        noteElement.className = 'musical-note';
        noteElement.textContent = this.noteToArrow[note] || note;
        
        const yPosition = this.notePositions[note] || 45;
        const { noteSpacing, startOffset } = this.getResponsiveNoteSpacing();
        const xPosition = notesContainer.children.length * noteSpacing + startOffset;
        
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
        const { noteSpacing, startOffset } = this.getResponsiveNoteSpacing();
        Array.from(notesContainer.children).forEach((note, index) => {
            note.style.left = (index * noteSpacing + startOffset) + 'px';
        });
    }

    getResponsiveNoteSpacing() {
        const notesContainer = document.querySelector('.notes-container');
        const containerWidth = notesContainer.offsetWidth;
        
        // Calculate responsive spacing based on container width and max notes
        const availableWidth = containerWidth - 20; // Leave some margin
        const maxSpacing = 35;
        const minSpacing = 18;
        
        // Calculate ideal spacing to fit max notes
        let noteSpacing = Math.max(minSpacing, Math.min(maxSpacing, availableWidth / this.maxNotesOnStaff));
        
        // Adjust spacing for smaller screens
        if (window.innerWidth <= 480) {
            noteSpacing = Math.min(noteSpacing, 25);
        } else if (window.innerWidth <= 768) {
            noteSpacing = Math.min(noteSpacing, 30);
        }
        
        const startOffset = 5;
        
        return { noteSpacing, startOffset };
    }
    
    clearStaff() {
        const notesContainer = document.querySelector('.notes-container');
        notesContainer.innerHTML = '';
        this.currentSong = [];
        this.currentSongName = "Your Song";
        this.updateStaffTitle();
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
        
        // Set the song name
        this.currentSongName = this.songNames[songName];
        this.updateStaffTitle();
        
        const notes = this.songs[songName];
        
        for (let i = 0; i < notes.length; i++) {
            this.playOcarinaNote(notes[i], 0.8);
            this.addNoteToStaff(notes[i]);
            this.highlightNote(notes[i]);
            await this.wait(900);
        }
        
        // Clear the staff after song completes
        await this.wait(500); // Brief pause before clearing
        this.clearStaff();
        
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
    
    toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }
    
    startRecording() {
        this.isRecording = true;
        this.recordedSong = [];
        this.recordingStartTime = Date.now();
        
        const recordBtn = document.querySelector('.record-btn');
        recordBtn.textContent = '🛑 Stop Recording';
        recordBtn.classList.add('recording');
        
        this.clearStaff();
    }
    
    stopRecording() {
        this.isRecording = false;
        
        const recordBtn = document.querySelector('.record-btn');
        const playCustomBtn = document.querySelector('.play-custom-btn');
        
        recordBtn.textContent = '🎙️ Record';
        recordBtn.classList.remove('recording');
        
        if (this.recordedSong.length > 0) {
            playCustomBtn.disabled = false;
            playCustomBtn.title = `Play your recorded song (${this.recordedSong.length} notes)`;
        }
    }
    
    recordNote(note) {
        if (!this.isRecording) return;
        
        const timestamp = Date.now() - this.recordingStartTime;
        this.recordedSong.push({
            note: note,
            timestamp: timestamp
        });
    }
    
    async playCustomSong() {
        if (this.isPlaying || this.recordedSong.length === 0) return;
        
        this.isPlaying = true;
        this.clearStaff();
        
        // Set custom song name
        this.currentSongName = "Your Custom Song";
        this.updateStaffTitle();
        
        const playCustomBtn = document.querySelector('.play-custom-btn');
        playCustomBtn.disabled = true;
        
        let lastTimestamp = 0;
        
        for (let i = 0; i < this.recordedSong.length; i++) {
            const recordedNote = this.recordedSong[i];
            const waitTime = recordedNote.timestamp - lastTimestamp;
            
            if (waitTime > 0) {
                await this.wait(waitTime);
            }
            
            this.playOcarinaNote(recordedNote.note, 0.8);
            this.addNoteToStaff(recordedNote.note);
            this.highlightNote(recordedNote.note);
            
            lastTimestamp = recordedNote.timestamp;
        }
        
        // Clear the staff after custom song completes
        await this.wait(500); // Brief pause before clearing
        this.clearStaff();
        
        this.isPlaying = false;
        playCustomBtn.disabled = false;
    }
    
    updateStaffTitle() {
        const staffTitle = document.querySelector('.staff-title');
        if (staffTitle) {
            staffTitle.textContent = this.currentSongName + ':';
        }
    }
    
    checkSongRecognition() {
        // Don't recognize songs while recording or during playback
        if (this.isRecording || this.isPlaying) return;
        
        const recognizedSong = this.recognizeSong(this.currentSong);
        if (recognizedSong && recognizedSong !== this.lastRecognizedSong) {
            this.currentSongName = this.songNames[recognizedSong];
            this.updateStaffTitle();
            this.lastRecognizedSong = recognizedSong;
            
            // Trigger the recognition effects immediately
            this.triggerSongRecognitionEffect();
            
            // Then start the song playback after the effect completes
            setTimeout(() => {
                if (!this.isPlaying && !this.isRecording) {
                    this.playSong(recognizedSong);
                }
            }, 2000); // Increased delay to let the effect complete
        } else if (!recognizedSong && this.currentSongName !== "Your Song") {
            this.currentSongName = "Your Song";
            this.updateStaffTitle();
            this.lastRecognizedSong = null;
        }
    }
    
    recognizeSong(currentNotes) {
        if (currentNotes.length === 0) return null;
        
        for (const [songKey, songPattern] of Object.entries(this.songs)) {
            if (this.matchesSongPattern(currentNotes, songPattern)) {
                return songKey;
            }
        }
        return null;
    }
    
    matchesSongPattern(currentNotes, songPattern) {
        const songLength = songPattern.length;
        
        // Check if we have enough notes to match the song
        if (currentNotes.length < songLength) return false;
        
        // Check exact match at the end of current notes
        const endSlice = currentNotes.slice(-songLength);
        if (this.arraysEqual(endSlice, songPattern)) {
            return true;
        }
        
        // Check if the pattern exists anywhere in the current sequence
        for (let i = 0; i <= currentNotes.length - songLength; i++) {
            const slice = currentNotes.slice(i, i + songLength);
            if (this.arraysEqual(slice, songPattern)) {
                return true;
            }
        }
        
        return false;
    }
    
    arraysEqual(arr1, arr2) {
        if (arr1.length !== arr2.length) return false;
        return arr1.every((val, index) => val === arr2[index]);
    }
    
    playZeldaSuccessTone() {
        if (!this.audioContext) return;

        const now = this.audioContext.currentTime;
        const notes = [
            { freq: 659.25, time: 0.0, duration: 0.2 },     // E5
            { freq: 740.00, time: 0.2, duration: 0.2 },     // F#5  
            { freq: 830.61, time: 0.4, duration: 0.2 },     // G#5
            { freq: 987.77, time: 0.6, duration: 0.4 }      // B5 (longer)
        ];

        notes.forEach(noteInfo => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(noteInfo.freq, now + noteInfo.time);
            
            gainNode.gain.setValueAtTime(0, now + noteInfo.time);
            gainNode.gain.linearRampToValueAtTime(0.3, now + noteInfo.time + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + noteInfo.time + noteInfo.duration);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.start(now + noteInfo.time);
            oscillator.stop(now + noteInfo.time + noteInfo.duration);
        });
    }
    
    triggerSongRecognitionEffect() {
        // Play the success tone
        this.playZeldaSuccessTone();
        
        // Add glow animation to all current notes
        const notes = document.querySelectorAll('.musical-note');
        notes.forEach(note => {
            note.classList.add('song-recognized');
        });
        
        // Remove animation class after animation completes
        setTimeout(() => {
            notes.forEach(note => {
                note.classList.remove('song-recognized');
            });
        }, 1500);
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