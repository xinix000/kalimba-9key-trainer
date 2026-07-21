/* ---------------------------------------------------------------------------
 * ผังลิ้นของคาลิมบา + คลังเพลง
 *
 * เครื่อง: NuNu mini 9 คีย์ (C major)
 * เรียงจากซ้ายไปขวาตามเลขที่สลักบนลิ้นจริง:
 *
 *      5    3    1    6·   5·   7·   2    4    6
 *      G4   E4   C4   A3   G3   B3   D4   F4   A4
 *                          ^ ลิ้นกลาง ยาวที่สุด = เสียงต่ำสุด
 *
 * เรียงตามระดับเสียง: 5· 6· 7· 1 2 3 4 5 6  (G A B C D E F G A)
 * ------------------------------------------------------------------------ */

const KALIMBA = {
  name: 'NuNu 9 คีย์ (C major)',
  // ลำดับตามตำแหน่งจริงบนเครื่อง: ซ้าย -> ขวา
  tines: [
    { deg: '5',  label: '5',  midi: 67, note: 'G4' },
    { deg: '3',  label: '3',  midi: 64, note: 'E4' },
    { deg: '1',  label: '1',  midi: 60, note: 'C4' },
    { deg: '6.', label: '6·', midi: 57, note: 'A3' },
    { deg: '5.', label: '5·', midi: 55, note: 'G3' },  // กลาง / ต่ำสุด
    { deg: '7.', label: '7·', midi: 59, note: 'B3' },
    { deg: '2',  label: '2',  midi: 62, note: 'D4' },
    { deg: '4',  label: '4',  midi: 65, note: 'F4' },
    { deg: '6',  label: '6',  midi: 69, note: 'A4' },
  ],
  // เลขที่สลักบนเครื่องเขียน "7" เฉยๆ ทั้งที่เสียงอยู่ต่ำกว่า 1
  aliases: { '7': '7.' },
};

/* ---------------------------------------------------------------------------
 * รูปแบบการเขียนเพลง (แก้ง่าย เพิ่มเพลงเองได้เลย)
 *
 *   โทเคน       ความหมาย
 *   1           โน้ต "1" ยาว 1 จังหวะ
 *   5.          โน้ต "5·" เสียงต่ำ (จุดข้างหลัง = จุดใต้ตัวเลขในหนังสือ)
 *   3:0.5       โน้ต "3" ยาวครึ่งจังหวะ (ในหนังสือคือตัวที่มีขีดใต้ 1 เส้น)
 *   1:1.5       โน้ตประจุด (ในหนังสือเขียน 1·)
 *   -           ลากเสียงตัวก่อนหน้าต่ออีก 1 จังหวะ (เหมือนในหนังสือ)
 *   0           หยุด 1 จังหวะ  (0:2 = หยุด 2 จังหวะ)
 *   |           เส้นกั้นห้อง ใส่ไว้อ่านง่ายเฉยๆ ระบบไม่สนใจ
 *
 * startBeat  = จังหวะเริ่มของโน้ตตัวแรก (ใส่ค่าลบถ้าเพลงมีห้องยก/pickup)
 * ------------------------------------------------------------------------ */

const SONGS = [
  {
    id: 'twinkle',
    title: 'Twinkle Twinkle Little Star',
    subtitle: 'ดาวประดับฟ้า · ง่ายสุด เริ่มเพลงแรกได้เลย',
    bpm: 92,
    beatsPerBar: 4,
    seq: `
      1 1 5 5 | 6 6 5 - | 4 4 3 3 | 2 2 1 - |
      5 5 4 4 | 3 3 2 - | 5 5 4 4 | 3 3 2 - |
      1 1 5 5 | 6 6 5 - | 4 4 3 3 | 2 2 1 -
    `,
  },
  {
    id: 'ode',
    title: 'Ode to Joy',
    subtitle: 'Beethoven · ฝึกเดินนิ้วโซนกลาง',
    bpm: 104,
    beatsPerBar: 4,
    seq: `
      3 3 4 5 | 5 4 3 2 | 1 1 2 3 | 3:1.5 2:0.5 2 - |
      3 3 4 5 | 5 4 3 2 | 1 1 2 3 | 2:1.5 1:0.5 1 -
    `,
  },
  {
    id: 'birthday',
    title: 'Happy Birthday to you',
    subtitle: 'จากหนังสือที่แถมมา · ใช้ลิ้นเสียงต่ำครบ · 3/4',
    bpm: 100,
    beatsPerBar: 3,
    startBeat: -1,           // มีห้องยก 1 จังหวะ
    seq: `
      5.:0.5 5.:0.5 | 6. 5. 1 | 7. - 5.:0.5 5.:0.5 | 6. 5. 2 |
      1 - 5.:0.5 5.:0.5 | 5 3 1 | 7. 6. 4:0.5 4:0.5 | 3 1 2 | 1 - -
    `,
  },
  {
    id: 'jinglebell',
    title: 'Jingle Bell',
    subtitle: 'จากหนังสือที่แถมมา · ใช้แค่ 1 2 3 4 5 มือใหม่เล่นได้',
    bpm: 120,
    beatsPerBar: 4,
    seq: `
      3 3 3 - | 3 3 3 - | 3 5 1:1.5 2:0.5 | 3 - - 0 |
      4 4 4:1.5 4:0.5 | 4 3 3:0.5 3:0.5 3 | 3 2 2 1 | 2 - - 5 |
      3 3 3 - | 3 3 3 - | 3 5 1:1.5 2:0.5 | 3 - - 0 |
      4 4 4:1.5 4:0.5 | 4 3 3:0.5 3:0.5 3 | 5 5 4 2 | 1 - - 0
    `,
  },
  {
    // ตรวจกับ jianpu.space/en/songList/6581b41cd6404321c40a2b4c แล้วตรงกับหนังสือทุกตัว
    id: 'merrychristmas',
    title: 'We wish you a Merry Christmas',
    subtitle: 'จากหนังสือที่แถมมา · 3/4 · ครบทั้งท่อน Good tidings',
    bpm: 140,
    beatsPerBar: 3,
    startBeat: -1,
    seq: `
      5. |
      1 1:0.5 2:0.5 1:0.5 7.:0.5 | 6. 6. 6. |
      2 2:0.5 3:0.5 2:0.5 1:0.5 | 7. 5. 5. |
      3 3:0.5 4:0.5 3:0.5 2:0.5 | 1 6. 5.:0.5 5.:0.5 |
      6. 2 7. | 1 - 5. |
      1 1 1 | 7. - 7. | 1 7. 6. | 5. - 2 |
      3 2:0.5 2:0.5 1:0.5 1:0.5 | 5 5. 5.:0.5 5.:0.5 |
      6. 2 7. | 1 - -
    `,
  },
  {
    id: 'fivehundredmiles',
    title: 'Five Hundred Miles',
    subtitle: 'จากหนังสือที่แถมมา · ช้าๆ ฝึกลิ้นเสียงต่ำ',
    bpm: 76,
    beatsPerBar: 4,
    startBeat: -1,
    seq: `
      5.:0.5 1:0.5 |
      3:1.5 3:0.5 2 1 | 3 - 2 1 |
      2:1.5 3:0.5 2 1 | 6. - - 6.:0.5 1:0.5 |
      2:1.5 3:0.5 2 1 | 6.:0.5 5.:0.5 5.:0.5 5.:0.5 6. 1 |
      1 - - -
    `,
  },
  {
    id: 'salleygardens',
    title: 'Down by the Salley Gardens',
    subtitle: 'จากหนังสือที่แถมมา · เพนทาโทนิก G ไม่มีโน้ตยาก',
    bpm: 72,
    beatsPerBar: 4,
    startBeat: -1,
    seq: `
      5.:0.5 6.:0.5 |
      7. 6.:0.5 5.:0.5 6.:0.5 7.:0.5 2 | 3 - 2 5.:0.5 2:0.5 |
      3 2:0.5 7.:0.5 6. 5.:0.5 6.:0.5 | 7. - - 5.:0.5 6.:0.5 |
      7. 6.:0.5 5.:0.5 6.:0.5 7.:0.5 2 | 3 - 2 5.:0.5 2:0.5 |
      3 2:0.5 7.:0.5 6. 5.:0.5 6.:0.5 | 5. - - -
    `,
  },
  {
    id: 'bigbigworld',
    title: 'Big Big World',
    subtitle: 'จากหนังสือที่แถมมา · Emilia · จังหวะซ้ำๆ จำง่าย',
    bpm: 86,
    beatsPerBar: 4,
    startBeat: -1,
    seq: `
      1:0.5 2:0.5 |
      3 3 3 3:0.5 4:0.5 | 2 2 2:0.5 2:0.5 2:0.5 3:0.5 |
      1 1 1 1:0.5 2:0.5 | 3:1.5 2:0.5 2 1:0.5 2:0.5 |
      3 3 3 3:0.5 4:0.5 | 2 2 2 2:0.5 3:0.5 |
      3:0.5 2:0.5 1:0.5 6.:0.5 0 0 | 0 3 2 2:0.5 3:0.5 |
      1 - - -
    `,
  },
  {
    // เทียบกับ kalimba.live/kalimba-tabs/always-with-me.html (C major)
    // ทำนองใช้โน้ต G A B C D E F G พอดีหนึ่งอ็อกเทฟ ย้ายลงมาหนึ่งอ็อกเทฟแล้ว
    // กลายเป็น 5. 6. 7. 1 2 3 4 5 ซึ่งมีครบบนเครื่อง 9 คีย์ (เหลือลิ้น 6 ที่ไม่ได้ใช้)
    id: 'alwayswithme',
    title: 'Always with me',
    subtitle: 'いつも何度でも · Spirited Away · ย้ายลง 1 อ็อกเทฟให้พอดี 9 คีย์',
    bpm: 76,
    beatsPerBar: 4,
    seq: `
      5. 1 2 3 | 2 1 2 1 | 7. 6. 6. 5. | 6. 1 1 5. |
      1 2 3 2 | 1 2 3 2 | 1 7. 1 2 | 1 3 4 5 |
      5 4 3 5 | 3 2 1 7. | 1 3 4 5 | 5 4 3 5 |
      3 2 1 7. | 1 - - -
    `,
  },
  {
    id: 'jasmine',
    title: 'Jasmine Flower',
    subtitle: 'จากหนังสือที่แถมมา · 茉莉花 · จังหวะ 2/4 ช้าๆ',
    bpm: 66,
    beatsPerBar: 2,
    seq: `
      7. 7.:0.5 2:0.5 | 3:0.5 5:0.5 5:0.5 3:0.5 | 2 2:0.5 3:0.5 | 2 - |
      7. 7.:0.5 2:0.5 | 3:0.5 5:0.5 5:0.5 3:0.5 | 2 2:0.5 3:0.5 | 2 - |
      2 2 | 2 7.:0.5 2:0.5 | 3 3 | 2 - |
      7. 6.:0.5 7.:0.5 | 2 7.:0.5 6.:0.5 | 5. 5.:0.5 6.:0.5 | 5. -
    `,
  },
];

/* ---- ตัวแปลง seq -> รายการโน้ต ------------------------------------------ */

const DEG2TINE = (() => {
  const map = {};
  KALIMBA.tines.forEach((t, i) => { map[t.deg] = i; });
  Object.entries(KALIMBA.aliases).forEach(([a, real]) => { map[a] = map[real]; });
  return map;
})();

/**
 * แปลงข้อความโน้ตเป็นรายการโน้ต พร้อมรายการปัญหาที่เจอ
 * (เอาไว้ให้ตัวแก้ไขเพลงในหน้าเว็บบอกได้ว่าโน้ตไหนเล่นไม่ได้)
 */
function parseSeq(seqText, startBeat = 0) {
  const notes = [];
  const problems = [];
  let beat = startBeat;

  for (const raw of String(seqText).trim().split(/\s+/)) {
    if (raw === '|' || raw === '') continue;

    const [tok, durTxt] = raw.split(':');
    const dur = durTxt === undefined ? 1 : parseFloat(durTxt);
    if (!(dur > 0)) {
      problems.push(`"${raw}" ระบุความยาวไม่ถูกต้อง`);
      continue;
    }

    // "-" ลากเสียงตัวก่อนหน้าให้ยาวขึ้น เหมือนโน้ตตัวเลขในหนังสือ
    if (tok === '-') {
      const last = notes[notes.length - 1];
      if (last && Math.abs(last.beat + last.dur - beat) < 1e-6) last.dur += dur;
      else problems.push('"-" ต้องตามหลังโน้ต ไม่ใช่ขึ้นต้นเพลง');
      beat += dur;
      continue;
    }

    if (tok === '0') { beat += dur; continue; }   // หยุด

    const tine = DEG2TINE[tok];
    if (tine === undefined) {
      problems.push(`"${tok}" ไม่มีบนคาลิมบา 9 คีย์`);
      beat += dur;
      continue;
    }

    notes.push({ tine, beat, dur, midi: KALIMBA.tines[tine].midi });
    beat += dur;
  }

  return { notes, problems };
}

function parseSong(song) {
  const startBeat = song.startBeat || 0;
  const { notes, problems } = parseSeq(song.seq, startBeat);
  if (problems.length) console.warn(`เพลง "${song.title}":`, problems.join(', '));

  const last = notes[notes.length - 1];
  return {
    ...song,
    startBeat,
    notes,
    problems,
    endBeat: last ? last.beat + last.dur : 0,
  };
}

/* ---- เพลงที่ผู้ใช้พิมพ์เอง (เก็บไว้ในเครื่อง) ----------------------------- */

const STORE_KEY = 'kalimba9.mysongs';

function loadUserSongs() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

function saveUserSongs(list) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); return true; }
  catch (_) { return false; }
}

/** เพลงทั้งหมด = ที่ทำมาให้ + ที่ผู้ใช้พิมพ์เอง */
function allSongs() {
  return [
    ...SONGS.map(parseSong),
    ...loadUserSongs().map(s => ({ ...parseSong(s), custom: true })),
  ];
}
