export class AudioManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3; // Lower volume
        this.masterGain.connect(this.ctx.destination);

        this.enabled = true;

        // Pre-generate bomb noise buffer
        this.bombBuffer = this.createBombBuffer();
    }

    createBombBuffer() {
        const duration = 0.3;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    playShoot(type) {
        if (!this.enabled) return;
        this.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        const now = this.ctx.currentTime;

        if (type === 'Pistol') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
            gain.gain.setValueAtTime(0.5, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'Rifle') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'Katana') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.linearRampToValueAtTime(1000, now + 0.1); // Swoosh up
            gain.gain.setValueAtTime(0.5, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        }
    }

    playBombSound() {
        if (!this.ctx) return;
        this.resume();

        const now = this.ctx.currentTime;
        const duration = 0.3;

        const noise = this.ctx.createBufferSource();
        noise.buffer = this.bombBuffer;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noise.connect(gain);
        gain.connect(this.masterGain);
        noise.start(now);
        noise.stop(now + duration + 0.1);
    }

    playAmbience() {
        if (!this.ctx || this.ambienceOsc) return;
        this.resume();

        // Dark drone
        this.ambienceOsc = this.ctx.createOscillator();
        this.ambienceOsc.type = 'sine';
        this.ambienceOsc.frequency.setValueAtTime(50, this.ctx.currentTime);

        const gain = this.ctx.createGain();
        gain.gain.value = 0.1;

        this.ambienceOsc.connect(gain);
        gain.connect(this.masterGain);
        this.ambienceOsc.start();

        // Modulate pitch slightly for creepiness
        setInterval(() => {
            if (this.ctx.state === 'running') {
                this.ambienceOsc.frequency.rampTo(50 + Math.random() * 20, 2);
            }
        }, 2000);
    }

    resume() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }
}
