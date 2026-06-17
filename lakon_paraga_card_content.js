/* ═══════════════════════════════════════════════════════════════
   LAKON™ — KONTEN KARTU PARAGA (24 Paraga)
   Untuk: Kartu Paraga (shareable) + slot result-illus + hero hasil

   Hero name  = "Kelompok Watak"  (mis. "Karya Reka") — sudah dari data
   Tagline    = tagline Watak       — sudah ada di index.html
   BARU di sini = esensi (1 baris) + 3 kata kunci per Paraga
   archetype_en = nama Inggris (SEKUNDER, dari PARAGA_EN di Code.gs)

   Struktur kata kunci: [trait Kelompok, trait Watak, trait fusi]
═══════════════════════════════════════════════════════════════ */

// Referensi cepat (sudah ada di asetmu) — ditaruh agar modul ini mandiri
const KELOMPOK_COLOR = {
  Yasa:  "#B84A3A",
  Nalar: "#3A6B9E",
  Karya: "#C17A3C",
  Bakti: "#4A7C6B",
  Karsa: "#7B5A9E",
  Tata:  "#6B7A5A",
};

const WATAK_TAGLINE = {
  Reka:   "Penerang Makna",
  Logika: "Pemikir Sistem",
  Jaga:   "Penjaga Keandalan",
  Guna:   "Penggerak Nyata",
};

// ── KONTEN KARTU (24 Paraga) ──────────────────────────────────
const PARAGA_CARD = {

  // ── KARYA · Mencipta, mengekspresikan, membangun estetika ──
  "Karya|Reka":   { esensi: "Mencipta keindahan demi makna yang lebih besar.", kata_kunci: ["Estetis", "Visioner", "Bermakna"],     archetype_en: "The Visionary Storyteller" },
  "Karya|Logika": { esensi: "Mendesain yang indah dengan logika yang rapi.",   kata_kunci: ["Kreatif", "Sistematis", "Terstruktur"], archetype_en: "The Creative Architect" },
  "Karya|Jaga":   { esensi: "Menyempurnakan karya hingga detail terkecil.",    kata_kunci: ["Estetis", "Telaten", "Andal"],         archetype_en: "The Master of Craft" },
  "Karya|Guna":   { esensi: "Mengubah ide jadi karya, saat itu juga.",         kata_kunci: ["Kreatif", "Spontan", "Cekatan"],       archetype_en: "The Spontaneous Creator" },

  // ── BAKTI · Membimbing, melayani, mengembangkan manusia ──
  "Bakti|Reka":   { esensi: "Menumbuhkan orang lain menuju versi terbaiknya.", kata_kunci: ["Empatik", "Visioner", "Pembimbing"],   archetype_en: "The Human Developer" },
  "Bakti|Logika": { esensi: "Mengembangkan manusia dengan cara yang terukur.", kata_kunci: ["Peduli", "Analitis", "Sistematis"],    archetype_en: "The System of People" },
  "Bakti|Jaga":   { esensi: "Hadir untuk orang lain, konsisten tanpa pamrih.", kata_kunci: ["Tulus", "Andal", "Setia"],             archetype_en: "The Reliable Guardian" },
  "Bakti|Guna":   { esensi: "Membantu langsung, tepat saat dibutuhkan.",       kata_kunci: ["Peduli", "Sigap", "Praktis"],          archetype_en: "The Hands-On Helper" },

  // ── KARSA · Memimpin, menggerakkan, mempengaruhi ──
  "Karsa|Reka":   { esensi: "Menggerakkan orang lewat visi yang menyala.",         kata_kunci: ["Inspiratif", "Visioner", "Pemimpin"], archetype_en: "The Vision-Led Entrepreneur" },
  "Karsa|Logika": { esensi: "Memimpin dengan strategi, menang dengan logika.",     kata_kunci: ["Strategis", "Analitis", "Ambisius"],  archetype_en: "The Strategic Operator" },
  "Karsa|Jaga":   { esensi: "Membangun sesuatu yang bertahan, bukan sekadar besar.",kata_kunci: ["Pemimpin", "Andal", "Pembangun"],    archetype_en: "The Institution Builder" },
  "Karsa|Guna":   { esensi: "Menggerakkan peluang lewat koneksi nyata.",           kata_kunci: ["Persuasif", "Luwes", "Penggerak"],    archetype_en: "The Relationship Driver" },

  // ── NALAR · Meneliti, menganalisis, memecahkan masalah ──
  "Nalar|Reka":   { esensi: "Mencari kebenaran yang benar-benar bermakna.",   kata_kunci: ["Penasaran", "Reflektif", "Mendalam"], archetype_en: "The Meaning-Seeker" },
  "Nalar|Logika": { esensi: "Membedah masalah hingga ke akarnya.",            kata_kunci: ["Analitis", "Tajam", "Objektif"],     archetype_en: "The Pure Analyst" },
  "Nalar|Jaga":   { esensi: "Meneliti dengan teliti, menyimpulkan dengan cermat.", kata_kunci: ["Metodis", "Teliti", "Andal"],   archetype_en: "The Methodical Investigator" },
  "Nalar|Guna":   { esensi: "Memecahkan masalah nyata, bukan sekadar teori.",  kata_kunci: ["Analitis", "Praktis", "Adaptif"],    archetype_en: "The Applied Problem-Solver" },

  // ── YASA · Membangun sesuatu yang nyata dan konkret ──
  "Yasa|Reka":    { esensi: "Membangun hari ini untuk masa depan yang dibayangkan.", kata_kunci: ["Tekun", "Visioner", "Pembangun"], archetype_en: "The Visionary Maker" },
  "Yasa|Logika":  { esensi: "Merancang dan membangun sistem yang bekerja.",          kata_kunci: ["Teknis", "Sistematis", "Presisi"], archetype_en: "The Systems Engineer" },
  "Yasa|Jaga":    { esensi: "Mengerjakan dengan tangan, menjaga dengan standar.",    kata_kunci: ["Terampil", "Telaten", "Andal"],   archetype_en: "The Master Craftsperson" },
  "Yasa|Guna":    { esensi: "Turun langsung, menuntaskan di lapangan.",              kata_kunci: ["Cekatan", "Praktis", "Tangguh"],  archetype_en: "The Field Expert" },

  // ── TATA · Menata, menjaga sistem, memastikan ketertiban ──
  "Tata|Reka":    { esensi: "Menata segala hal demi tujuan yang berarti.",    kata_kunci: ["Rapi", "Visioner", "Teratur"],         archetype_en: "The Purpose-Driven Organizer" },
  "Tata|Logika":  { esensi: "Menyempurnakan sistem agar makin masuk akal.",   kata_kunci: ["Sistematis", "Analitis", "Efisien"],   archetype_en: "The Systems Innovator" },
  "Tata|Jaga":    { esensi: "Menjaga semuanya tetap tertib dan tepat.",       kata_kunci: ["Teratur", "Andal", "Konsisten"],       archetype_en: "The Reliable Foundation" },
  "Tata|Guna":    { esensi: "Menuntaskan tugas dengan rapi dan cepat.",       kata_kunci: ["Disiplin", "Praktis", "Cekatan"],      archetype_en: "The Pragmatic Executor" },
};

// Contoh akses:
//   const c = PARAGA_CARD["Karya|Reka"];
//   c.esensi        → "Mencipta keindahan demi makna yang lebih besar."
//   c.kata_kunci    → ["Estetis","Visioner","Bermakna"]
//   WATAK_TAGLINE["Reka"]  → "Penerang Makna"
//   KELOMPOK_COLOR["Karya"]→ "#C17A3C"

if (typeof module !== "undefined") module.exports = { PARAGA_CARD, KELOMPOK_COLOR, WATAK_TAGLINE };
