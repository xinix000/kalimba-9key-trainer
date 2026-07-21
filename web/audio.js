/* ---------------------------------------------------------------------------
 * เสียงคาลิมบาสังเคราะห์ด้วย Web Audio API (ไม่ต้องโหลดไฟล์เสียง)
 *
 * ลิ้นเหล็กของคาลิมบา = แท่งโลหะสั่น -> ฮาร์โมนิกไม่ลงตัวพอดี (inharmonic)
 * เลยผสม sine หลายตัวที่อัตราส่วนเพี้ยนนิดหน่อย + เสียง "ติ๊ก" ตอนดีด
 * ------------------------------------------------------------------------ */

class KalimbaAudio {
  constructor() {
    this.ctx = null;
    this.octave = 1;      // เลื่อนอ็อกเทฟ (ตัว mini เสียงสูงกว่าตัวเต็มไซซ์)
    this.ready = false;
  }

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();

    this.master = this.ctx.createGain();
    this.master.gain.value = 0.85;

    this.comp = this.ctx.createDynamicsCompressor();
    this.comp.threshold.value = -18;
    this.comp.ratio.value = 4;

    // ห้องเสียงเล็กๆ ให้ฟังไม่แห้ง
    this.reverb = this.ctx.createConvolver();
    this.reverb.buffer = this._impulse(1.4, 3.0);
    this.revGain = this.ctx.createGain();
    this.revGain.gain.value = 0.28;

    this.master.connect(this.comp);
    this.master.connect(this.revGain);
    this.revGain.connect(this.reverb);
    this.reverb.connect(this.comp);
    this.comp.connect(this.ctx.destination);

    this.ready = true;
  }

  async unlock() {
    this.init();
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    // ปลดล็อกเสียงบน iOS ด้วย buffer ว่างๆ
    const b = this.ctx.createBufferSource();
    b.buffer = this.ctx.createBuffer(1, 1, this.ctx.sampleRate);
    b.connect(this.ctx.destination);
    b.start(0);
  }

  now() { return this.ctx ? this.ctx.currentTime : 0; }

  _impulse(seconds, decay) {
    const rate = this.ctx.sampleRate;
    const len = Math.floor(rate * seconds);
    const buf = this.ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  /** ดีดลิ้น 1 ครั้ง */
  pluck(midi, when = null, vel = 1) {
    if (!this.ready) return;
    const t = when === null ? this.ctx.currentTime : when;
    const f = 440 * Math.pow(2, (midi + 12 * this.octave - 69) / 12);

    const bus = this.ctx.createGain();
    bus.gain.value = vel * 0.5;
    bus.connect(this.master);

    // ยิ่งเสียงสูง ยิ่งดังสั้น
    const base = Math.max(0.9, 2.6 - (f - 200) / 900);

    // [อัตราส่วนความถี่, ความดัง, เวลาจาง]
    const partials = [
      [1.000, 1.00, base],
      [2.014, 0.36, base * 0.55],
      [3.032, 0.17, base * 0.34],
      [5.081, 0.07, base * 0.20],
      [8.13,  0.03, base * 0.12],
    ];

    let stopAt = t;
    for (const [ratio, amp, dur] of partials) {
      const freq = f * ratio;
      if (freq > 17000) continue;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(amp, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

      osc.connect(g);
      g.connect(bus);
      osc.start(t);
      osc.stop(t + dur + 0.05);
      stopAt = Math.max(stopAt, t + dur + 0.05);
    }

    // เสียงเล็บกระทบลิ้นตอนดีด
    const nLen = Math.floor(this.ctx.sampleRate * 0.035);
    const nBuf = this.ctx.createBuffer(1, nLen, this.ctx.sampleRate);
    const nData = nBuf.getChannelData(0);
    for (let i = 0; i < nLen; i++) {
      nData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / nLen, 3);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = nBuf;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = Math.min(f * 4, 6000);
    bp.Q.value = 1.2;
    const ng = this.ctx.createGain();
    ng.gain.value = 0.10 * vel;
    noise.connect(bp); bp.connect(ng); ng.connect(bus);
    noise.start(t);

    setTimeout(() => bus.disconnect(), (stopAt - this.ctx.currentTime + 0.3) * 1000);
  }

  /** เสียงเมโทรนอม */
  click(when = null, accent = false) {
    if (!this.ready) return;
    const t = when === null ? this.ctx.currentTime : when;
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = accent ? 1800 : 1150;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(accent ? 0.16 : 0.09, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    osc.connect(g); g.connect(this.comp);
    osc.start(t); osc.stop(t + 0.07);
  }
}

const audio = new KalimbaAudio();
