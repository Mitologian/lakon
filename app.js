/* ═══════════════════════════════════════════════════════════════
   LAKON™ CAREER PROFILE — App JavaScript v2.0
   Changes from v1:
   - Fixed Paraga names (Kelompok|Watak format, no invented names)
   - Added Good Fit (kelompok #2) display
   - Added kekuatan, lingkungan_ideal per Paraga
   - Enhanced showResult: kelompok graph, narrative, strengths, env
   - Admin email notification via Apps Script
   - Email notification to participant on submit
═══════════════════════════════════════════════════════════════ */

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwZ4Yez1bc5K-COQCgCnqZWJGwHm6vx2n9tmyd25kBO9PcjqG6y1orDVxbRh64vysFv/exec";

// ── Batch ID dari URL parameter ?batch=KODE ──
// B2B: share link dengan ?batch=NAMAPERUSAHAAN → peserta tidak perlu isi manual
// Individual tanpa ?batch → default 'General'
const URL_BATCH = new URLSearchParams(window.location.search).get('batch') || 'General';

let lang        = 'id';
let currentPage = 0;
let pages       = [];

const mbtiAns   = {};
const pick2Ans  = {};
const likertAns = {};

// ─────────────────────────────────────────────────────────────
// MBTI QUESTIONS (24 total, 6 per dimension)
// ─────────────────────────────────────────────────────────────
const MBTI_Q = [
  {id:"m1",a:"E",b:"I",id_q:"Kamu biasanya merasa lebih berenergi setelah menghabiskan waktu bersama banyak orang.",id_a:"Setuju — energi saya justru naik",id_b:"Tidak setuju — saya butuh waktu sendiri setelahnya",en_q:"You usually feel more energized after spending time with many people.",en_a:"Agree — my energy actually goes up",en_b:"Disagree — I need alone time afterward"},
  {id:"m2",a:"I",b:"E",id_q:"Kamu lebih suka memproses pikiran dan perasaan secara internal sebelum berbagi dengan orang lain.",id_a:"Setuju — saya perlu merenung sendiri dulu",id_b:"Tidak setuju — saya berpikir lebih jernih saat berbicara",en_q:"You prefer to process thoughts internally before sharing with others.",en_a:"Agree — I need to reflect alone first",en_b:"Disagree — I think more clearly when talking"},
  {id:"m3",a:"E",b:"I",id_q:"Di acara sosial yang ramai, kamu biasanya menjadi salah satu yang paling aktif berinteraksi.",id_a:"Setuju — saya menikmati bertemu banyak orang baru",id_b:"Tidak setuju — saya lebih suka percakapan mendalam dengan sedikit orang",en_q:"At busy social events, you tend to be one of the most actively interacting people.",en_a:"Agree — I enjoy meeting many new people",en_b:"Disagree — I prefer deep conversations with fewer people"},
  {id:"m4",a:"I",b:"E",id_q:"Kamu lebih suka bekerja dalam ketenangan daripada di lingkungan yang ramai.",id_a:"Setuju — saya fokus lebih baik dalam ketenangan",id_b:"Tidak setuju — energi orang sekitar justru memotivasi saya",en_q:"You generally prefer working in quiet rather than busy, noisy environments.",en_a:"Agree — I focus better in quiet",en_b:"Disagree — the energy of others actually motivates me"},
  {id:"m5",a:"E",b:"I",id_q:"Orang yang baru kamu kenal biasanya bisa langsung tahu banyak tentang kamu.",id_a:"Setuju — saya cukup terbuka dari awal",id_b:"Tidak setuju — orang perlu mengenal saya lebih dalam dulu",en_q:"People you've just met can usually quickly learn a lot about you.",en_a:"Agree — I'm fairly open from the start",en_b:"Disagree — people need to know me better first"},
  {id:"m6",a:"I",b:"E",id_q:"Kamu lebih nyaman mengirim pesan atau email daripada berbicara langsung atau telepon.",id_a:"Setuju — saya lebih bisa mengekspresikan diri lewat tulisan",id_b:"Tidak setuju — saya lebih suka interaksi langsung",en_q:"You're more comfortable sending messages or emails than talking directly.",en_a:"Agree — I express myself better in writing",en_b:"Disagree — I prefer direct interaction"},
  {id:"m7",a:"N",b:"S",id_q:"Saat belajar sesuatu, kamu lebih tertarik memahami pola dan teori di baliknya daripada cara penggunaannya.",id_a:"Setuju — saya ingin tahu 'mengapa' sebelum 'bagaimana'",id_b:"Tidak setuju — saya lebih suka langsung tahu cara pakainya",en_q:"When learning, you're more interested in the underlying patterns and theory than the practical application.",en_a:"Agree — I want to know 'why' before 'how'",en_b:"Disagree — I prefer knowing how to use it directly"},
  {id:"m8",a:"S",b:"N",id_q:"Kamu lebih mempercayai informasi yang konkret dan bisa diverifikasi daripada interpretasi atau spekulasi.",id_a:"Setuju — fakta dan bukti lebih bisa diandalkan",id_b:"Tidak setuju — interpretasi dan intuisi juga sangat penting",en_q:"You trust concrete, verifiable information more than interpretation or speculation.",en_a:"Agree — facts and evidence are more reliable",en_b:"Disagree — interpretation and intuition are also very important"},
  {id:"m9",a:"N",b:"S",id_q:"Kamu lebih sering memikirkan kemungkinan masa depan daripada berfokus pada kenyataan yang ada sekarang.",id_a:"Setuju — saya selalu memikirkan apa yang bisa terjadi",id_b:"Tidak setuju — saya lebih fokus pada realita saat ini",en_q:"You more often think about future possibilities than focus on what's in front of you now.",en_a:"Agree — I'm always thinking about what could happen",en_b:"Disagree — I focus more on present reality"},
  {id:"m10",a:"S",b:"N",id_q:"Saat menghadapi masalah, kamu cenderung mencari solusi yang sudah terbukti sebelum mencoba pendekatan baru.",id_a:"Setuju — saya lebih percaya pada yang sudah terbukti",id_b:"Tidak setuju — saya senang mencoba pendekatan baru",en_q:"When facing a problem, you tend to look for proven solutions before trying new approaches.",en_a:"Agree — I trust what's already been proven",en_b:"Disagree — I enjoy trying new approaches"},
  {id:"m11",a:"N",b:"S",id_q:"Kamu lebih mudah mengingat makna dan kesan umum dari sesuatu daripada detail-detail spesifiknya.",id_a:"Setuju — saya lebih ingat esensi daripada detail",id_b:"Tidak setuju — saya sangat perhatian pada detail",en_q:"You more easily remember the meaning and general impression than the specific details.",en_a:"Agree — I remember essence more than details",en_b:"Disagree — I'm very attentive to details"},
  {id:"m12",a:"S",b:"N",id_q:"Kamu lebih menyukai instruksi yang jelas dan terperinci daripada panduan yang bersifat umum.",id_a:"Setuju — instruksi yang jelas membantu saya bekerja lebih baik",id_b:"Tidak setuju — saya lebih suka fleksibilitas dalam menginterpretasi",en_q:"You prefer clear, detailed instructions over general guidelines.",en_a:"Agree — clear instructions help me work better",en_b:"Disagree — I prefer flexibility in interpretation"},
  {id:"m13",a:"T",b:"F",id_q:"Dalam keputusan penting, kamu lebih mengandalkan analisis logis daripada apa yang terasa benar secara personal.",id_a:"Setuju — logika dan data lebih dapat diandalkan",id_b:"Tidak setuju — nilai dan intuisi juga harus diperhitungkan",en_q:"When making important decisions, you rely more on logical analysis than what feels personally right.",en_a:"Agree — logic and data are more reliable",en_b:"Disagree — values and intuition must also be considered"},
  {id:"m14",a:"F",b:"T",id_q:"Saat memberikan masukan, kamu mempertimbangkan perasaan orang tersebut sebelum memutuskan seberapa jujur kamu akan berbicara.",id_a:"Setuju — perasaan mereka penting dalam cara saya menyampaikan",id_b:"Tidak setuju — kejujuran langsung lebih membantu jangka panjang",en_q:"When giving feedback, you consider how the person will feel before deciding how direct to be.",en_a:"Agree — their feelings matter in how I deliver",en_b:"Disagree — direct honesty is more helpful in the long run"},
  {id:"m15",a:"T",b:"F",id_q:"Kamu lebih mudah mengabaikan ketidaknyamanan emosional saat diperlukan untuk mencapai hasil yang lebih baik.",id_a:"Setuju — saya bisa memisahkan emosi dari keputusan",id_b:"Tidak setuju — emosi adalah bagian dari proses yang tidak bisa diabaikan",en_q:"You can more easily set aside emotional discomfort when needed to achieve a better outcome.",en_a:"Agree — I can separate emotion from decisions",en_b:"Disagree — emotions are part of the process and can't be ignored"},
  {id:"m16",a:"F",b:"T",id_q:"Bagi kamu, harmoni dalam hubungan kerja sama pentingnya dengan efisiensi dan produktivitas.",id_a:"Setuju — hubungan yang baik adalah fondasi kerja yang baik",id_b:"Tidak setuju — efisiensi dan hasil yang jelas lebih menentukan",en_q:"For you, harmony in working relationships is as important as efficiency and productivity.",en_a:"Agree — good relationships are the foundation of good work",en_b:"Disagree — efficiency and clear results matter more"},
  {id:"m17",a:"T",b:"F",id_q:"Saat seseorang datang dengan masalah, reaksi pertamamu adalah mencari solusinya, bukan sekadar mendengarkan.",id_a:"Setuju — saya langsung memikirkan cara membantu secara praktis",id_b:"Tidak setuju — mendengarkan dan memahami dulu lebih penting",en_q:"When someone comes to you with a problem, your first reaction is to find a solution, not just listen.",en_a:"Agree — I immediately think about practical ways to help",en_b:"Disagree — listening and understanding first is more important"},
  {id:"m18",a:"F",b:"T",id_q:"Kamu lebih termotivasi oleh pekerjaan yang berdampak nyata pada orang daripada yang memberikan tantangan intelektual semata.",id_a:"Setuju — makna dan dampak pada orang adalah motivasi terbesar saya",id_b:"Tidak setuju — tantangan intelektual lebih memotivasi saya",en_q:"You're more motivated by work with real impact on people than purely intellectual challenges.",en_a:"Agree — meaning and impact on people is my biggest motivator",en_b:"Disagree — intellectual challenge motivates me more"},
  {id:"m19",a:"J",b:"P",id_q:"Kamu lebih nyaman ketika rencana sudah ditetapkan dan tidak banyak berubah di tengah jalan.",id_a:"Setuju — kepastian membuat saya lebih tenang dan produktif",id_b:"Tidak setuju — saya justru nyaman dengan perubahan yang muncul",en_q:"You're more comfortable when plans are set and don't change much along the way.",en_a:"Agree — certainty makes me calmer and more productive",en_b:"Disagree — I'm comfortable with changes that emerge"},
  {id:"m20",a:"P",b:"J",id_q:"Kamu cenderung menunda keputusan untuk menjaga lebih banyak pilihan tetap terbuka.",id_a:"Setuju — saya ingin tetap fleksibel selama mungkin",id_b:"Tidak setuju — saya lebih suka membuat keputusan cepat dan bergerak maju",en_q:"You tend to delay decisions to keep more options open.",en_a:"Agree — I want to stay flexible as long as possible",en_b:"Disagree — I prefer deciding quickly and moving forward"},
  {id:"m21",a:"J",b:"P",id_q:"Kamu merasa lebih puas ketika semua tugas di daftarmu selesai dan tercentang.",id_a:"Setuju — menyelesaikan tugas memberikan kepuasan yang besar",id_b:"Tidak setuju — saya lebih menikmati proses daripada tanda centang",en_q:"You feel more satisfied when your task list is completed and fully checked off.",en_a:"Agree — completing tasks gives me great satisfaction",en_b:"Disagree — I enjoy the process more than the checkmarks"},
  {id:"m22",a:"P",b:"J",id_q:"Saat mengerjakan sesuatu, kamu sering menemukan cara yang lebih baik dan berpindah ke pendekatan baru di tengah jalan.",id_a:"Setuju — saya suka mengeksplorasi cara terbaik sambil berjalan",id_b:"Tidak setuju — saya lebih suka menyelesaikan satu pendekatan sampai tuntas",en_q:"When working on something, you often find a better way and switch approaches midway.",en_a:"Agree — I like exploring the best way as I go",en_b:"Disagree — I prefer completing one approach all the way through"},
  {id:"m23",a:"J",b:"P",id_q:"Kamu biasanya sudah tahu apa yang akan kamu lakukan di akhir pekan jauh sebelum hari itu tiba.",id_a:"Setuju — saya suka punya rencana yang jelas lebih awal",id_b:"Tidak setuju — saya suka memutuskan secara spontan",en_q:"You usually know what you'll be doing on the weekend well before it arrives.",en_a:"Agree — I like having clear plans well in advance",en_b:"Disagree — I prefer deciding spontaneously"},
  {id:"m24",a:"P",b:"J",id_q:"Kamu merasa lebih kreatif dan produktif saat bekerja tanpa jadwal yang terlalu ketat.",id_a:"Setuju — struktur yang terlalu kaku membatasi saya",id_b:"Tidak setuju — struktur yang jelas justru membebaskan energi kreatif saya",en_q:"You feel more creative and productive when working without a very strict schedule.",en_a:"Agree — overly rigid structure limits me",en_b:"Disagree — clear structure actually frees my creative energy"},
  // ── 6 soal tambahan untuk akurasi Watak (N/S, T/F, J/P jadi 8 soal masing-masing) ──
  {id:"m25",a:"N",b:"S",id_q:"Saat dihadapkan pada pilihan, kamu lebih sering mengandalkan intuisi tentang apa yang mungkin terjadi daripada pengalaman yang sudah terbukti.",id_a:"Setuju — saya lebih percaya pada intuisi dan kemungkinan",id_b:"Tidak setuju — pengalaman dan bukti lebih bisa diandalkan",en_q:"When faced with choices, you more often rely on intuition about what might happen than on proven experience.",en_a:"Agree — I trust intuition and possibilities more",en_b:"Disagree — experience and evidence are more reliable"},
  {id:"m26",a:"S",b:"N",id_q:"Kamu lebih mudah mendeskripsikan sesuatu dengan detail konkret daripada analogi atau metafora.",id_a:"Setuju — saya lebih nyaman dengan deskripsi yang spesifik dan faktual",id_b:"Tidak setuju — analogi dan gambaran besar lebih mudah bagi saya",en_q:"You find it easier to describe things with concrete details than with analogies or metaphors.",en_a:"Agree — I'm more comfortable with specific, factual descriptions",en_b:"Disagree — analogies and the big picture come more naturally"},
  {id:"m27",a:"T",b:"F",id_q:"Ketika ada konflik dalam tim, kamu cenderung fokus pada penyelesaian masalahnya daripada memastikan semua orang merasa nyaman terlebih dahulu.",id_a:"Setuju — masalahnya yang harus diselesaikan, perasaan bisa diurus setelahnya",id_b:"Tidak setuju — saya perlu memastikan semua orang oke dulu sebelum melanjutkan",en_q:"When there's team conflict, you tend to focus on solving the problem rather than ensuring everyone feels comfortable first.",en_a:"Agree — the problem needs solving; feelings can be addressed after",en_b:"Disagree — I need to make sure everyone is okay before moving on"},
  {id:"m28",a:"F",b:"T",id_q:"Bagi kamu, keputusan yang baik adalah keputusan yang mempertimbangkan dampaknya pada orang-orang yang terlibat, bukan hanya yang paling logis secara objektif.",id_a:"Setuju — dampak pada manusia adalah bagian inti dari keputusan yang baik",id_b:"Tidak setuju — keputusan terbaik adalah yang paling logis dan objektif",en_q:"For you, a good decision is one that considers its impact on the people involved, not just the most logically sound one.",en_a:"Agree — human impact is a core part of good decision-making",en_b:"Disagree — the best decision is the most logical and objective one"},
  {id:"m29",a:"J",b:"P",id_q:"Kamu merasa tidak nyaman kalau harus mengerjakan sesuatu tanpa batas waktu yang jelas.",id_a:"Setuju — saya lebih produktif ketika ada deadline yang pasti",id_b:"Tidak setuju — tidak ada deadline justru memberi saya kebebasan bereksplorasi",en_q:"You feel uncomfortable having to work on something without a clear deadline.",en_a:"Agree — I'm more productive with a definite deadline",en_b:"Disagree — no deadline actually gives me freedom to explore"},
  {id:"m30",a:"P",b:"J",id_q:"Kamu lebih sering mengubah rencana di tengah jalan daripada mengikutinya sampai selesai.",id_a:"Setuju — saya sering menemukan cara yang lebih baik dan berpindah ke sana",id_b:"Tidak setuju — saya biasanya mengikuti rencana awal sampai selesai",en_q:"You more often change plans midway than follow them through to completion.",en_a:"Agree — I often find a better way and switch to it",en_b:"Disagree — I usually follow the original plan through to the end"},
];

// ─────────────────────────────────────────────────────────────
// PICK-2 QUESTIONS (21 total)
// ─────────────────────────────────────────────────────────────
const PICK2_Q = [
  {id:"r1",id_q:"Pilih 2 aktivitas yang paling menarik bagimu:",en_q:"Pick 2 activities that appeal most to you:",opts:[{t:"Yasa",id:"Merancang dan membangun sesuatu secara fisik",en:"Designing and building something physical"},{t:"Nalar",id:"Menganalisis data untuk menemukan pola tersembunyi",en:"Analyzing data to find hidden patterns"},{t:"Karya",id:"Menciptakan karya seni atau desain visual",en:"Creating artwork or visual design"},{t:"Bakti",id:"Membimbing orang lain melewati tantangan",en:"Guiding others through challenges"},{t:"Karsa",id:"Memimpin tim menuju target yang ambisius",en:"Leading a team toward an ambitious goal"},{t:"Tata",id:"Menyusun sistem dan prosedur yang rapi",en:"Setting up neat systems and procedures"}]},
  {id:"r2",id_q:"Pilih 2 kata yang paling mencerminkan ketertarikanmu:",en_q:"Pick 2 words that best reflect your interests:",opts:[{t:"Yasa",id:"Mekanik",en:"Mechanical"},{t:"Nalar",id:"Ilmiah",en:"Scientific"},{t:"Karya",id:"Kreatif",en:"Creative"},{t:"Bakti",id:"Mengasuh",en:"Nurturing"},{t:"Karsa",id:"Berpengaruh",en:"Influential"},{t:"Tata",id:"Terstruktur",en:"Structured"}]},
  {id:"r3",id_q:"Pilih 2 kegiatan di waktu luang yang paling ingin kamu lakukan:",en_q:"Pick 2 free-time activities you'd most want to do:",opts:[{t:"Yasa",id:"Berkebun atau merawat tanaman",en:"Gardening or tending to plants"},{t:"Nalar",id:"Membaca artikel ilmiah atau penelitian",en:"Reading scientific articles or research"},{t:"Karya",id:"Menulis cerita atau membuat konten kreatif",en:"Writing stories or creating creative content"},{t:"Bakti",id:"Menjadi sukarelawan di komunitas",en:"Volunteering in the community"},{t:"Karsa",id:"Menghadiri seminar bisnis atau networking",en:"Attending business seminars or networking"},{t:"Tata",id:"Merapikan dan mengorganisasi ruang atau file",en:"Tidying up and organizing space or files"}]},
  {id:"r4",id_q:"Pilih 2 peran yang paling mudah kamu bayangkan dirimu di dalamnya:",en_q:"Pick 2 roles you can most easily imagine yourself in:",opts:[{t:"Yasa",id:"Teknisi yang ahli memperbaiki dan merakit",en:"A technician skilled at repairing and assembling"},{t:"Nalar",id:"Peneliti yang mengeksplorasi pertanyaan kompleks",en:"A researcher exploring complex questions"},{t:"Karya",id:"Seniman atau desainer yang mengekspresikan ide",en:"An artist or designer expressing ideas"},{t:"Bakti",id:"Konselor yang mendampingi pertumbuhan orang",en:"A counselor supporting people's growth"},{t:"Karsa",id:"Pemimpin yang menggerakkan tim dan strategi",en:"A leader driving team and strategy"},{t:"Tata",id:"Manajer yang memastikan semua berjalan tertib",en:"A manager ensuring everything runs smoothly"}]},
  {id:"r5",id_q:"Pilih 2 hal yang paling memberikan kepuasan saat bekerja:",en_q:"Pick 2 things that give you the most satisfaction at work:",opts:[{t:"Yasa",id:"Melihat hasil kerja fisik yang nyata dan konkret",en:"Seeing tangible physical results from your work"},{t:"Nalar",id:"Menemukan jawaban atas pertanyaan yang sulit",en:"Finding answers to difficult questions"},{t:"Karya",id:"Menghasilkan sesuatu yang orisinal dan estetis",en:"Producing something original and aesthetic"},{t:"Bakti",id:"Melihat orang yang kamu bantu berkembang",en:"Seeing the people you help grow"},{t:"Karsa",id:"Berhasil memengaruhi dan menggerakkan orang lain",en:"Successfully influencing and moving others"},{t:"Tata",id:"Menyelesaikan tugas dengan rapi dan tepat waktu",en:"Completing tasks neatly and on time"}]},
  {id:"r6",id_q:"Pilih 2 lingkungan kerja yang paling nyaman bagimu:",en_q:"Pick 2 work environments that suit you best:",opts:[{t:"Yasa",id:"Workshop, lapangan, atau studio produksi",en:"Workshop, field, or production studio"},{t:"Nalar",id:"Laboratorium, perpustakaan, atau ruang riset",en:"Laboratory, library, or research space"},{t:"Karya",id:"Studio kreatif dengan kebebasan eksplorasi",en:"Creative studio with freedom to explore"},{t:"Bakti",id:"Ruang konseling, kelas, atau komunitas",en:"Counseling space, classroom, or community"},{t:"Karsa",id:"Ruang meeting, podium, atau kantor eksekutif",en:"Meeting room, stage, or executive office"},{t:"Tata",id:"Kantor terorganisir dengan sistem yang jelas",en:"Organized office with clear systems"}]},
  {id:"r7",id_q:"Pilih 2 kemampuan yang paling ingin kamu kembangkan:",en_q:"Pick 2 abilities you most want to develop:",opts:[{t:"Yasa",id:"Keahlian teknis dan keterampilan tangan",en:"Technical expertise and hands-on skills"},{t:"Nalar",id:"Kemampuan analisis dan penalaran kritis",en:"Analytical ability and critical reasoning"},{t:"Karya",id:"Ekspresi kreatif dan kepekaan estetika",en:"Creative expression and aesthetic sensibility"},{t:"Bakti",id:"Empati mendalam dan kemampuan mendengarkan",en:"Deep empathy and listening ability"},{t:"Karsa",id:"Kepemimpinan dan kemampuan persuasi",en:"Leadership and persuasion ability"},{t:"Tata",id:"Manajemen detail dan kemampuan organisasi",en:"Detail management and organizational ability"}]},
  {id:"r8",id_q:"Pilih 2 topik yang paling ingin kamu pelajari lebih dalam:",en_q:"Pick 2 topics you'd most want to study in depth:",opts:[{t:"Yasa",id:"Teknik, konstruksi, atau rekayasa",en:"Engineering, construction, or technology"},{t:"Nalar",id:"Sains, matematika, atau penelitian",en:"Science, mathematics, or research"},{t:"Karya",id:"Seni, desain, atau komunikasi kreatif",en:"Art, design, or creative communication"},{t:"Bakti",id:"Psikologi, pendidikan, atau kesehatan",en:"Psychology, education, or health"},{t:"Karsa",id:"Bisnis, kepemimpinan, atau kewirausahaan",en:"Business, leadership, or entrepreneurship"},{t:"Tata",id:"Keuangan, hukum, atau administrasi",en:"Finance, law, or administration"}]},
  {id:"r9",id_q:"Pilih 2 profesi yang paling menarik minatmu:",en_q:"Pick 2 professions that interest you most:",opts:[{t:"Yasa",id:"Arsitek atau insinyur",en:"Architect or engineer"},{t:"Nalar",id:"Ilmuwan atau peneliti",en:"Scientist or researcher"},{t:"Karya",id:"Seniman atau desainer kreatif",en:"Artist or creative designer"},{t:"Bakti",id:"Konselor atau pendidik",en:"Counselor or educator"},{t:"Karsa",id:"Pengusaha atau pemimpin organisasi",en:"Entrepreneur or organizational leader"},{t:"Tata",id:"Akuntan atau manajer operasional",en:"Accountant or operations manager"}]},
  {id:"r10",id_q:"Pilih 2 nilai yang paling kamu prioritaskan dalam pekerjaan:",en_q:"Pick 2 values you prioritize most in work:",opts:[{t:"Yasa",id:"Keahlian nyata yang bisa dilihat hasilnya",en:"Real expertise with visible results"},{t:"Nalar",id:"Pemahaman mendalam berbasis bukti",en:"Deep understanding based on evidence"},{t:"Karya",id:"Kebebasan berekspresi dan orisinalitas",en:"Freedom of expression and originality"},{t:"Bakti",id:"Dampak positif pada kehidupan orang lain",en:"Positive impact on others' lives"},{t:"Karsa",id:"Pengaruh, pertumbuhan, dan pencapaian",en:"Influence, growth, and achievement"},{t:"Tata",id:"Keteraturan, ketelitian, dan konsistensi",en:"Order, precision, and consistency"}]},
  {id:"r11",id_q:"Pilih 2 kata yang paling mencerminkan cara kamu bekerja:",en_q:"Pick 2 words that best describe how you work:",opts:[{t:"Yasa",id:"Terampil",en:"Skilled"},{t:"Nalar",id:"Analitis",en:"Analytical"},{t:"Karya",id:"Ekspresif",en:"Expressive"},{t:"Bakti",id:"Empatik",en:"Empathetic"},{t:"Karsa",id:"Ambisius",en:"Ambitious"},{t:"Tata",id:"Sistematis",en:"Systematic"}]},
  {id:"r12",id_q:"Pilih 2 kegiatan yang paling sering kamu lakukan secara sukarela:",en_q:"Pick 2 activities you most often do voluntarily:",opts:[{t:"Yasa",id:"Memperbaiki atau merakit sesuatu",en:"Fixing or assembling something"},{t:"Nalar",id:"Membaca, meneliti, atau mencari tahu sesuatu",en:"Reading, researching, or finding things out"},{t:"Karya",id:"Membuat atau menciptakan sesuatu yang estetis",en:"Making or creating something aesthetic"},{t:"Bakti",id:"Mendengarkan dan membantu orang yang membutuhkan",en:"Listening to and helping people in need"},{t:"Karsa",id:"Mengorganisir orang dan menggerakkan inisiatif",en:"Organizing people and driving initiatives"},{t:"Tata",id:"Membuat catatan, daftar, atau laporan yang rapi",en:"Making neat notes, lists, or reports"}]},
  {id:"r13",id_q:"Pilih 2 hal yang paling sering membuatmu merasa 'ini saya banget':",en_q:"Pick 2 things that most often make you feel 'this is so me':",opts:[{t:"Yasa",id:"Bekerja dengan tangan dan menghasilkan sesuatu nyata",en:"Working with your hands to produce something real"},{t:"Nalar",id:"Memecahkan masalah atau teka-teki yang kompleks",en:"Solving complex problems or puzzles"},{t:"Karya",id:"Mengekspresikan diri melalui medium kreatif apapun",en:"Expressing yourself through any creative medium"},{t:"Bakti",id:"Benar-benar hadir untuk orang lain saat dibutuhkan",en:"Being truly present for others when they need it"},{t:"Karsa",id:"Mengambil inisiatif dan memimpin saat situasi menuntut",en:"Taking initiative and leading when the situation calls"},{t:"Tata",id:"Membawa keteraturan ke dalam situasi yang kacau",en:"Bringing order to chaotic situations"}]},
  {id:"r14",id_q:"Pilih 2 cara yang paling alami untuk memberi nilai dalam tim:",en_q:"Pick 2 ways that come most naturally to you for adding value in a team:",opts:[{t:"Yasa",id:"Mengeksekusi dengan keahlian teknis yang solid",en:"Executing with solid technical skills"},{t:"Nalar",id:"Memberikan analisis mendalam sebelum keputusan",en:"Providing deep analysis before decisions"},{t:"Karya",id:"Membawa perspektif kreatif yang segar",en:"Bringing fresh creative perspectives"},{t:"Bakti",id:"Memastikan setiap anggota tim merasa didengar",en:"Ensuring every team member feels heard"},{t:"Karsa",id:"Menggerakkan tim dan menjaga momentum",en:"Driving the team and maintaining momentum"},{t:"Tata",id:"Memastikan semua proses dan deliverable berjalan tertib",en:"Ensuring all processes and deliverables run smoothly"}]},
  {id:"r15",id_q:"Pilih 2 hal yang paling memotivasi kamu untuk bekerja:",en_q:"Pick 2 things that most motivate you to work:",opts:[{t:"Yasa",id:"Proyek konkret yang bisa langsung dikerjakan",en:"A concrete project you can get into right away"},{t:"Nalar",id:"Pertanyaan menarik yang menunggu untuk dijawab",en:"An interesting question waiting to be answered"},{t:"Karya",id:"Ruang untuk mengekspresikan gagasan secara bebas",en:"Space to express ideas freely"},{t:"Bakti",id:"Mengetahui bahwa pekerjaan saya akan membantu seseorang",en:"Knowing my work will help someone"},{t:"Karsa",id:"Target ambisius yang menantang saya melampaui diri",en:"An ambitious target that challenges me to excel"},{t:"Tata",id:"Daftar tugas yang terorganisir dan siap dieksekusi",en:"An organized task list ready to execute"}]},
  {id:"r16",id_q:"Pilih 2 jenis proyek yang paling menarik untuk dikerjakan:",en_q:"Pick 2 types of projects that would excite you most:",opts:[{t:"Yasa",id:"Membangun infrastruktur atau produk fisik dari awal",en:"Building infrastructure or a physical product from scratch"},{t:"Nalar",id:"Penelitian mendalam untuk memecahkan masalah besar",en:"Deep research to solve a major unsolved problem"},{t:"Karya",id:"Kampanye kreatif yang menyentuh audiens luas",en:"A creative campaign that reaches a wide audience"},{t:"Bakti",id:"Program pengembangan komunitas yang berdampak nyata",en:"A community development program with real impact"},{t:"Karsa",id:"Meluncurkan bisnis atau inisiatif baru dari nol",en:"Launching a new business or initiative from zero"},{t:"Tata",id:"Merestrukturisasi sistem atau proses yang tidak efisien",en:"Restructuring an inefficient system or process"}]},
  {id:"r17",id_q:"Pilih 2 kalimat yang paling menggambarkan pekerjaan yang baik bagimu:",en_q:"Pick 2 statements that best describe what good work means to you:",opts:[{t:"Yasa",id:"Pekerjaan yang terasa dan terlihat nyata hasilnya",en:"Work whose results you can feel and see"},{t:"Nalar",id:"Pekerjaan yang memperluas pemahaman dan pengetahuan",en:"Work that expands understanding and knowledge"},{t:"Karya",id:"Pekerjaan yang menghasilkan sesuatu indah atau bermakna",en:"Work that produces something beautiful or meaningful"},{t:"Bakti",id:"Pekerjaan yang membuat hidup orang lain lebih baik",en:"Work that makes other people's lives better"},{t:"Karsa",id:"Pekerjaan yang membuka jalan dan menggerakkan perubahan",en:"Work that opens paths and drives change"},{t:"Tata",id:"Pekerjaan yang dieksekusi dengan tepat dan konsisten",en:"Work executed accurately and consistently"}]},
  {id:"r18",id_q:"Pilih 2 hal yang paling sering orang lain minta bantuanmu:",en_q:"Pick 2 things people most often ask for your help with:",opts:[{t:"Yasa",id:"Memperbaiki sesuatu yang rusak atau tidak berfungsi",en:"Fixing something broken or not working"},{t:"Nalar",id:"Mencari informasi atau memahami sesuatu yang kompleks",en:"Finding information or understanding something complex"},{t:"Karya",id:"Membuat sesuatu terlihat atau terasa lebih baik",en:"Making something look or feel better"},{t:"Bakti",id:"Mendengarkan atau memberikan dukungan emosional",en:"Listening or providing emotional support"},{t:"Karsa",id:"Mengorganisir atau memimpin suatu kegiatan",en:"Organizing or leading an activity"},{t:"Tata",id:"Menyusun dokumen, laporan, atau anggaran",en:"Preparing documents, reports, or budgets"}]},
  {id:"r19",id_q:"Pilih 2 kekuatan yang paling menonjol dalam dirimu:",en_q:"Pick 2 strengths that stand out most in you:",opts:[{t:"Yasa",id:"Ketekunan dan keahlian teknis",en:"Perseverance and technical skill"},{t:"Nalar",id:"Rasa ingin tahu dan kemampuan berpikir kritis",en:"Curiosity and critical thinking"},{t:"Karya",id:"Imajinasi dan kepekaan terhadap keindahan",en:"Imagination and sensitivity to beauty"},{t:"Bakti",id:"Kepedulian tulus dan kemampuan membangun koneksi",en:"Genuine care and connection-building"},{t:"Karsa",id:"Keberanian mengambil risiko dan mempengaruhi orang",en:"Courage to take risks and influence others"},{t:"Tata",id:"Ketelitian dan kemampuan mengelola detail",en:"Precision and ability to manage details"}]},
  {id:"r20",id_q:"Pilih 2 hal yang paling sering membuatmu masuk ke zona terbaikmu:",en_q:"Pick 2 things that most often put you in your best zone:",opts:[{t:"Yasa",id:"Menggunakan keahlian fisik atau teknis dengan konsentrasi penuh",en:"Using physical or technical skills with full concentration"},{t:"Nalar",id:"Tenggelam dalam masalah yang menantang intelektualmu",en:"Getting absorbed in an intellectually challenging problem"},{t:"Karya",id:"Berekspresi bebas tanpa batasan atau penilaian",en:"Expressing freely without limits or judgment"},{t:"Bakti",id:"Terhubung secara mendalam dengan orang lain",en:"Connecting deeply with others"},{t:"Karsa",id:"Memimpin dan menggerakkan sesuatu yang penting",en:"Leading and moving something that matters"},{t:"Tata",id:"Menyelesaikan tugas kompleks dengan sempurna dan tuntas",en:"Completing complex tasks perfectly and completely"}]},
  {id:"r21",id_q:"Pilih 2 hal yang paling ingin dikatakan orang tentang kontribusimu:",en_q:"Pick 2 things you'd most want people to say about your contribution:",opts:[{t:"Yasa",id:"\"Dia yang paling bisa diandalkan untuk eksekusi yang nyata\"",en:"\"They're the most reliable for real execution\""},{t:"Nalar",id:"\"Dia yang paling dalam memahami dan menganalisis masalah\"",en:"\"They understand and analyze problems most deeply\""},{t:"Karya",id:"\"Dia yang selalu membawa perspektif kreatif yang segar\"",en:"\"They always bring fresh creative perspectives\""},{t:"Bakti",id:"\"Dia yang paling tulus peduli dan mendukung orang sekitarnya\"",en:"\"They're the most genuinely caring and supportive\""},{t:"Karsa",id:"\"Dia yang menggerakkan segalanya menjadi mungkin\"",en:"\"They're the one who makes everything possible\""},{t:"Tata",id:"\"Dia yang membuat semua hal berjalan dengan tertib\"",en:"\"They're the one who keeps everything running smoothly\""}]},
];

// ─────────────────────────────────────────────────────────────
// LIKERT QUESTIONS (21 items)
// ─────────────────────────────────────────────────────────────
const LIKERT_Q = [
  {id:"l1", t:"Yasa", id_s:"Saya senang bekerja dengan alat, mesin, atau peralatan fisik.",en_s:"I enjoy working with tools, machines, or physical equipment."},
  {id:"l2", t:"Yasa", id_s:"Saya lebih suka pekerjaan yang menghasilkan sesuatu yang bisa dilihat dan dipegang.",en_s:"I prefer work that produces something you can see and hold."},
  {id:"l3", t:"Yasa", id_s:"Kegiatan fisik dan outdoor termasuk hal yang saya nikmati.",en_s:"Physical and outdoor activities are things I genuinely enjoy."},
  {id:"l4", t:"Yasa", id_s:"Saya merasa puas ketika berhasil membangun sesuatu dengan tangan saya sendiri.",en_s:"I feel satisfied when I've built something with my own hands."},
  {id:"l5", t:"Nalar",id_s:"Saya menikmati proses menganalisis masalah yang kompleks secara mendalam.",en_s:"I enjoy the process of analyzing complex problems in depth."},
  {id:"l6", t:"Nalar",id_s:"Rasa ingin tahu saya mendorong saya terus mencari tahu bagaimana sesuatu bekerja.",en_s:"My curiosity drives me to keep finding out how things work."},
  {id:"l7", t:"Nalar",id_s:"Saya lebih suka berbasis pada data dan fakta daripada intuisi.",en_s:"I prefer basing decisions on data and facts rather than intuition."},
  {id:"l8", t:"Nalar",id_s:"Memecahkan teka-teki atau tantangan intelektual adalah hal yang saya nikmati.",en_s:"Solving puzzles or intellectual challenges is something I genuinely enjoy."},
  {id:"l9", t:"Karya",id_s:"Saya sering membayangkan cara-cara baru dan kreatif untuk mengekspresikan sesuatu.",en_s:"I often imagine new and creative ways to express something."},
  {id:"l10",t:"Karya",id_s:"Bekerja di lingkungan yang menghargai orisinalitas dan kebebasan kreatif sangat penting bagi saya.",en_s:"Working in an environment that values originality and creative freedom is very important to me."},
  {id:"l11",t:"Karya",id_s:"Saya merasa paling hidup ketika bisa membuat atau menciptakan sesuatu yang bermakna.",en_s:"I feel most alive when I can make or create something meaningful."},
  {id:"l12",t:"Bakti",id_s:"Membantu orang lain berkembang adalah salah satu hal paling memuaskan bagi saya.",en_s:"Helping others grow is one of the most satisfying things for me."},
  {id:"l13",t:"Bakti",id_s:"Saya sering menjadi orang pertama yang diajak bicara ketika seseorang butuh dukungan.",en_s:"I'm often the first person someone comes to when they need support."},
  {id:"l14",t:"Bakti",id_s:"Pekerjaan yang dampaknya langsung dirasakan orang lain jauh lebih bermakna bagi saya.",en_s:"Work whose impact is directly felt by others is far more meaningful to me."},
  {id:"l15",t:"Karsa",id_s:"Saya menikmati memimpin, mengambil keputusan, dan menggerakkan orang menuju tujuan.",en_s:"I enjoy leading, making decisions, and moving people toward a goal."},
  {id:"l16",t:"Karsa",id_s:"Tantangan dan kompetisi justru memotivasi saya untuk bekerja lebih keras.",en_s:"Challenges and competition actually motivate me to work harder."},
  {id:"l17",t:"Karsa",id_s:"Saya sering punya inisiatif untuk memulai sesuatu baru meski belum ada yang mengajak.",en_s:"I often take initiative to start something new even without anyone asking."},
  {id:"l18",t:"Tata", id_s:"Saya merasa lebih nyaman ketika ada sistem dan prosedur yang jelas untuk diikuti.",en_s:"I feel more comfortable when there are clear systems and procedures to follow."},
  {id:"l19",t:"Tata", id_s:"Memastikan detail-detail kecil tertangani dengan benar adalah sesuatu yang saya perhatikan.",en_s:"Making sure small details are handled correctly is something I pay attention to."},
  {id:"l20",t:"Tata", id_s:"Pekerjaan yang berulang dan terstruktur tidak membosankan — justru memberikan kenyamanan.",en_s:"Repetitive and structured work doesn't bore me — it actually provides comfort."},
  {id:"l21",t:"Tata", id_s:"Saya cenderung membuat daftar, jadwal, atau catatan agar tidak ada yang terlewat.",en_s:"I tend to make lists, schedules, or notes to ensure nothing is missed."},
];

const ALL_Q = [
  ...MBTI_Q.map(q=>({...q,sec:1})),
  ...PICK2_Q.map(q=>({...q,sec:2})),
  ...LIKERT_Q.map(q=>({...q,sec:3})),
];
const TOTAL_Q = ALL_Q.length; // 72 (30 MBTI + 21 Pick-2 + 21 Likert)

// ─────────────────────────────────────────────────────────────
// PERAN IDEAL DALAM ORGANISASI — 24 Paraga
// Struktur: { naratif, posisi: [{nama, level, fit, peran}] }
// fit: 'ideal' | 'cocok' | 'bisa'
// ─────────────────────────────────────────────────────────────
const PERAN_IDEAL = {
"Bakti|Reka":{
  naratif:"Di posisi apapun, mereka adalah orang yang membuat lingkungan kerja terasa lebih manusiawi. Kekuatan terbesar mereka bukan pada keahlian teknis tertentu, melainkan pada kemampuan membangun kepercayaan yang tulus dan mendorong pertumbuhan orang lain. Mereka paling efektif ketika diberi ruang untuk benar-benar hadir bagi orang-orang di sekitarnya — dan paling menonjol di peran yang menempatkan pengembangan manusia sebagai inti, bukan sekadar fungsi pendukung.",
  posisi:[
    {nama:"L&D Specialist / OD Manager",level:"Mid–Senior",fit:"ideal",peran:"Merancang program pengembangan yang benar-benar mengubah orang. Mereka membuat proses belajar terasa personal dan bermakna, bukan sekadar materi yang disampaikan."},
    {nama:"HR Business Partner",level:"Mid–Senior",fit:"ideal",peran:"Menjembatani kebutuhan bisnis dengan kepentingan manusia. Kebijakan yang mereka rancang terasa adil karena mereka benar-benar mendengar kedua sisi."},
    {nama:"Counselor / Coach",level:"Entry–Senior",fit:"ideal",peran:"Hadir penuh dalam proses tumbuh orang lain. Mereka tidak hanya memberi solusi — mereka menemani prosesnya dengan kesabaran yang konsisten."},
    {nama:"Team Manager / Team Lead",level:"Mid–Senior",fit:"cocok",peran:"Memimpin dengan memperhatikan pertumbuhan setiap anggota secara individual. Tim merasa dilihat sebagai manusia, bukan sekadar resource."},
    {nama:"Customer Success Manager",level:"Mid",fit:"cocok",peran:"Membangun relasi klien yang dalam dan tahan lama. Klien tidak merasa dilayani secara transaksional — mereka merasa benar-benar dipahami."},
    {nama:"Program Officer — NGO / CSR",level:"Entry–Mid",fit:"cocok",peran:"Mengelola program yang berdampak langsung pada komunitas. Mereka memastikan program benar-benar dirasakan manfaatnya, bukan sekadar terlaksana di atas kertas."},
    {nama:"Trainer / Fasilitator",level:"Mid",fit:"cocok",peran:"Membawakan sesi pelatihan dengan kehadiran emosional yang penuh. Peserta tidak hanya belajar — mereka merasa didukung untuk berkembang."},
    {nama:"Recruiter / Talent Acquisition",level:"Entry–Mid",fit:"bisa",peran:"Membaca orang dengan baik dan membangun rapport cepat. Namun lebih kuat di pengembangan daripada seleksi — bisa terasa terlalu transaksional jika tidak ada dimensi mentoring."},
  ]},
"Bakti|Logika":{
  naratif:"Mereka adalah tipe langka yang bisa berbicara dalam bahasa angka sekaligus bahasa manusia. Pendekatan mereka terhadap pengembangan orang selalu berbasis data dan sistem — bukan sekadar empati. Di peran apapun, mereka adalah orang yang memastikan program people bukan hanya terasa baik, tapi benar-benar terukur dampaknya.",
  posisi:[
    {nama:"People Analytics / HR Data Analyst",level:"Mid",fit:"ideal",peran:"Menganalisis data SDM untuk menemukan pola yang tidak terlihat. Menghubungkan angka dengan keputusan yang berdampak nyata pada orang."},
    {nama:"Talent Management Lead",level:"Mid–Senior",fit:"ideal",peran:"Merancang sistem manajemen talenta yang skalabel. Mereka melihat potensi seseorang bukan dari kesan, tapi dari data yang terstruktur."},
    {nama:"HRBP / HR Manager",level:"Mid–Senior",fit:"ideal",peran:"Menerjemahkan strategi bisnis ke keputusan people yang logis dan adil. Mitra strategis yang dipercaya oleh kedua sisi — manajemen dan karyawan."},
    {nama:"L&D Manager",level:"Mid–Senior",fit:"cocok",peran:"Merancang kurikulum pengembangan berbasis kebutuhan yang terukur. Program mereka punya tujuan yang jelas dan outcome yang bisa dievaluasi."},
    {nama:"Compensation & Benefits Analyst",level:"Mid",fit:"cocok",peran:"Membangun struktur kompensasi yang adil dan berbasis data. Memastikan sistem penggajian tidak hanya kompetitif, tapi juga dirasakan fair."},
    {nama:"Management Consultant — People",level:"Mid–Senior",fit:"cocok",peran:"Mendiagnosis masalah organisasi dan merancang solusi sistemik. Efektif karena tidak terjebak pada solusi generik — mereka mengikuti data."},
    {nama:"Project Manager",level:"Mid",fit:"bisa",peran:"Terorganisir dan konsisten dalam mengelola timeline. Namun lebih optimal jika proyek punya dimensi pengembangan manusia di dalamnya."},
    {nama:"Business Analyst",level:"Mid",fit:"bisa",peran:"Kemampuan analitisnya kuat, tapi motivasi terdalamnya pada orang — bukan proses bisnis. Bisa berhasil, tapi lebih hidup di konteks people."},
  ]},
"Bakti|Jaga":{
  naratif:"Mereka adalah pilar keandalan dalam organisasi yang melayani manusia. Di mana banyak orang bicara tentang kepedulian, mereka hadir dan memastikan setiap orang mendapatkan apa yang mereka butuhkan — secara konsisten, tanpa drama, tanpa kompromi pada standar.",
  posisi:[
    {nama:"Customer Service Manager",level:"Mid–Senior",fit:"ideal",peran:"Memimpin tim layanan dengan standar yang tidak berubah. Mereka memastikan setiap keluhan ditangani dengan benar — bukan hanya ditutup."},
    {nama:"Case Manager / Social Worker",level:"Entry–Mid",fit:"ideal",peran:"Mendampingi individu yang membutuhkan dengan konsistensi yang menjadi fondasi kepercayaan. Tidak membuat janji yang tidak bisa ditepati."},
    {nama:"Nurse / Healthcare Coordinator",level:"Entry–Senior",fit:"ideal",peran:"Memberikan perawatan yang konsisten dan dapat diandalkan. Pasien merasa aman karena mereka tahu standarnya tidak akan berubah."},
    {nama:"HR Generalist / HR Admin",level:"Entry–Mid",fit:"cocok",peran:"Memastikan proses HR berjalan dengan benar dan konsisten. Karyawan merasa diperlakukan adil karena prosedur dijalankan dengan integritas."},
    {nama:"Operations Supervisor — Service",level:"Mid",fit:"cocok",peran:"Memastikan layanan berjalan sesuai standar setiap hari. Alasan mengapa tim frontline bisa bekerja dengan tenang."},
    {nama:"Quality Assurance — Service",level:"Mid",fit:"cocok",peran:"Menjaga standar kualitas layanan dengan teliti. Tidak mudah tergoda untuk mengambil jalan pintas meski ada tekanan waktu."},
    {nama:"Compliance Officer",level:"Mid",fit:"bisa",peran:"Memahami pentingnya prosedur dan menjalankannya dengan disiplin. Namun lebih kuat di layanan langsung daripada di regulasi yang jauh dari manusia."},
    {nama:"Administrative Officer",level:"Entry",fit:"bisa",peran:"Teratur dan dapat diandalkan dalam mengelola dokumen. Lebih optimal jika ada interaksi bermakna dengan orang di dalam perannya."},
  ]},
"Bakti|Guna":{
  naratif:"Mereka tidak menunggu sistem atau instruksi untuk membantu. Begitu melihat kebutuhan, mereka bergerak — hadir secara fisik, emosional, dan praktis. Di lapangan, mereka adalah orang yang paling diingat oleh orang-orang yang mereka layani, karena kehadiran mereka terasa nyata dan tanpa jarak.",
  posisi:[
    {nama:"Community Outreach / Field Officer",level:"Entry–Mid",fit:"ideal",peran:"Terjun langsung ke komunitas dan merespons kebutuhan tanpa birokrasi berlebihan. Membangun kepercayaan komunitas melalui kehadiran nyata."},
    {nama:"Paramedic / Perawat Lapangan",level:"Entry–Mid",fit:"ideal",peran:"Bergerak cepat dan tepat di situasi yang membutuhkan respons segera. Ketenangan mereka di bawah tekanan membuat orang di sekitarnya merasa aman."},
    {nama:"Youth Worker / Pendamping Sosial",level:"Entry–Mid",fit:"ideal",peran:"Membangun koneksi autentik dengan remaja atau komunitas rentan. Mereka tidak memimpin dari jarak jauh — mereka ada di tengah-tengah."},
    {nama:"Customer Service Frontliner",level:"Entry–Mid",fit:"cocok",peran:"Merespons kebutuhan pelanggan dengan cepat dan hangat. Pelanggan merasa dibantu, bukan diproses melalui sistem."},
    {nama:"Field Coordinator",level:"Mid",fit:"cocok",peran:"Memimpin tim lapangan kecil dengan kehadiran langsung. Mereka memimpin dengan hadir, bukan dengan instruksi dari belakang meja."},
    {nama:"Crisis Intervention Specialist",level:"Mid",fit:"cocok",peran:"Membaca situasi kritis dengan cepat dan bertindak tanpa menunggu prosedur lengkap. Kecepatan respons mereka sangat menentukan."},
    {nama:"Sales Lapangan / Territory Sales",level:"Entry–Mid",fit:"bisa",peran:"Energi interpersonalnya kuat dan mudah membangun rapport. Lebih kuat di membantu daripada di closing deal — optimal jika produk genuinely bermanfaat bagi orang."},
    {nama:"Event Coordinator",level:"Entry–Mid",fit:"bisa",peran:"Responsif dan baik dalam membaca kebutuhan orang. Namun lebih optimal di konteks pelayanan langsung daripada koordinasi logistik event."},
  ]},
"Karya|Reka":{
  naratif:"Di posisi apapun, mereka adalah orang yang membawa narasi dan makna ke dalam pekerjaan. Mereka tidak hanya menghasilkan — mereka memastikan apa yang dihasilkan punya dampak emosional yang nyata pada audiens. Kekuatan terbesar mereka adalah kemampuan melihat audiens sebelum melihat kanvas.",
  posisi:[
    {nama:"Brand Strategist / Creative Director",level:"Mid–Senior",fit:"ideal",peran:"Membangun identitas brand yang kohesif dan bermakna. Mereka memimpin dengan visi — setiap keputusan kreatif punya alasan yang bisa dijelaskan kepada stakeholder."},
    {nama:"Content Strategist / Head of Content",level:"Mid–Senior",fit:"ideal",peran:"Merancang narasi konten jangka panjang yang membangun koneksi nyata dengan audiens. Bukan konten viral sesaat — melainkan cerita yang diingat."},
    {nama:"Communications Manager / PR Manager",level:"Mid–Senior",fit:"ideal",peran:"Merancang pesan organisasi yang autentik. Memastikan komunikasi eksternal mencerminkan nilai yang benar-benar dipegang perusahaan, bukan hanya citra."},
    {nama:"UX Writer / Product Copywriter",level:"Mid",fit:"cocok",peran:"Menulis teks produk yang membuat pengguna merasa dipahami. Setiap kata dipilih dengan mempertimbangkan bagaimana rasanya dibaca oleh manusia nyata."},
    {nama:"Social Entrepreneur / Founder",level:"Senior",fit:"cocok",peran:"Membangun organisasi atau gerakan berbasis narasi yang kuat. Menarik orang bukan dengan pitch deck, tapi dengan cerita yang menyentuh."},
    {nama:"Trainer / Fasilitator Kreatif",level:"Mid",fit:"cocok",peran:"Membawakan sesi dengan pendekatan storytelling yang membuat materi terasa relevan dan personal bagi setiap peserta."},
    {nama:"Marketing Manager",level:"Mid–Senior",fit:"bisa",peran:"Kemampuan naratifnya adalah aset besar dalam marketing. Namun perlu partner kuat di sisi eksekusi operasional dan data analytics agar efektif."},
    {nama:"Copywriter / Junior Creative",level:"Entry",fit:"bisa",peran:"Titik masuk yang baik untuk membangun portfolio. Lebih optimal di peran yang memberi ruang untuk merancang strategi narasi, bukan hanya mengeksekusi brief."},
  ]},
"Karya|Logika":{
  naratif:"Mereka adalah jembatan antara dunia kreatif dan dunia sistem. Di mana kreator lain berhenti di estetika, mereka meneruskan ke pertanyaan: bagaimana ini bisa bekerja secara konsisten, skalabel, dan terukur? Inilah yang membuat output mereka tidak hanya indah, tapi juga tahan lama.",
  posisi:[
    {nama:"Design Systems Lead / Head of Design",level:"Senior",fit:"ideal",peran:"Membangun sistem desain yang skalabel dan konsisten di seluruh produk. Mendefinisikan standar kreatif yang bisa diikuti oleh seluruh tim."},
    {nama:"UX Designer / Product Designer",level:"Mid",fit:"ideal",peran:"Menghubungkan keputusan desain dengan tujuan bisnis dan kebutuhan pengguna. Bisa menjelaskan 'mengapa' di balik setiap pilihan visual."},
    {nama:"Creative Technology Lead",level:"Mid–Senior",fit:"ideal",peran:"Menjembatani tim kreatif dan tim engineering. Mereka berbicara dua bahasa — dan itu sangat langka."},
    {nama:"Brand Manager",level:"Mid",fit:"cocok",peran:"Mengelola konsistensi brand dengan pendekatan sistematis. Setiap touchpoint dijaga dengan standar yang tidak berubah."},
    {nama:"MarTech Specialist",level:"Mid",fit:"cocok",peran:"Mengelola stack teknologi marketing dengan pemahaman kreatif. Tahu alat mana yang tepat untuk tujuan apa."},
    {nama:"Product Manager",level:"Mid–Senior",fit:"cocok",peran:"Memimpin pengembangan produk dengan keseimbangan antara intuisi kreatif dan pemikiran sistematis. Menjaga visi produk tetap kohesif di tengah kompleksitas."},
    {nama:"Data Analyst — Marketing",level:"Mid",fit:"bisa",peran:"Kemampuan analitisnya solid. Namun lebih optimal jika analisis tersebut terhubung langsung dengan output kreatif."},
    {nama:"Project Manager — Creative",level:"Mid",fit:"bisa",peran:"Terorganisir dan sistematis dalam mengelola proyek kreatif. Energi terbaiknya ada di merancang, bukan di koordinasi jadwal semata."},
  ]},
"Karya|Jaga":{
  naratif:"Mereka adalah aset produksi kreatif yang paling konsisten. Di industri yang sering bergantung pada mood dan inspirasi, mereka datang setiap hari dan menghasilkan kualitas tinggi tanpa drama. Di posisi apapun, mereka adalah orang yang tim andalkan saat ada proyek yang tidak boleh salah.",
  posisi:[
    {nama:"Senior Graphic Designer / Art Director",level:"Mid–Senior",fit:"ideal",peran:"Menghasilkan karya visual berkualitas tinggi dengan konsistensi yang menjadi standar tim. Orang pertama yang dipanggil saat proyek penting."},
    {nama:"Creative Production Manager",level:"Mid–Senior",fit:"ideal",peran:"Memastikan alur produksi kreatif berjalan tepat waktu tanpa mengorbankan kualitas. Alasan studio bisa menangani volume tinggi dengan standar yang terjaga."},
    {nama:"Brand Executive / MarComm Specialist",level:"Mid",fit:"ideal",peran:"Mengelola konsistensi materi komunikasi brand di semua touchpoint. Tidak ada yang lolos tanpa melewati standar mereka."},
    {nama:"UI Designer / Visual Designer",level:"Entry–Mid",fit:"cocok",peran:"Mengeksekusi brief dengan presisi dan konsistensi yang tinggi. Bukan yang paling eksperimental, tapi yang paling bisa diandalkan untuk kualitas final."},
    {nama:"Video Editor / Content Producer",level:"Entry–Mid",fit:"cocok",peran:"Menghasilkan konten video dengan standar teknis yang konsisten. Deadline bagi mereka bukan ancaman — mereka bekerja terbaik dengan struktur yang jelas."},
    {nama:"Studio Manager / Creative Ops",level:"Mid–Senior",fit:"cocok",peran:"Mengelola operasional studio kreatif dengan keteraturan yang membuat tim kreatif bisa fokus pada pekerjaan mereka."},
    {nama:"Copywriter",level:"Entry–Mid",fit:"bisa",peran:"Konsisten dalam menghasilkan copy yang solid dan sesuai brief. Lebih kuat di eksekusi terstruktur daripada di eksplorasi konsep yang sangat terbuka."},
    {nama:"Social Media Specialist",level:"Entry–Mid",fit:"bisa",peran:"Mampu menjaga konsistensi konten dan jadwal posting. Kurang optimal di platform yang menuntut improvisasi real-time dan respons spontan."},
  ]},
"Karya|Guna":{
  naratif:"Kreativitas mereka paling hidup ketika lahir di momen — responsif, spontan, dan autentik. Di dunia yang penuh dengan konten yang direncanakan berbulan-bulan, mereka adalah tipe yang bisa membaca ruangan dan langsung menciptakan sesuatu yang terasa nyata.",
  posisi:[
    {nama:"Content Creator / Social Media Manager",level:"Entry–Mid",fit:"ideal",peran:"Membuat konten yang terasa segar dan tidak dibuat-buat. Membaca tren lebih cepat dari yang lain dan langsung bereaksi sebelum momentumnya berlalu."},
    {nama:"Brand Activation Specialist",level:"Mid",fit:"ideal",peran:"Membuat event dan aktivasi brand terasa hidup. Tidak hanya mengeksekusi rundown — membaca energi ruangan dan menyesuaikan di tempat."},
    {nama:"Creative Director — Campaign",level:"Senior",fit:"ideal",peran:"Memimpin kampanye dengan naluri kreatif yang tajam. Tahu kapan harus mengikuti rencana dan kapan harus membuang rencana demi momen yang lebih baik."},
    {nama:"Facilitator / MC / Trainer",level:"Mid–Senior",fit:"cocok",peran:"Membawakan sesi dengan energi autentik dan kemampuan membaca peserta secara real-time. Membuat ruangan terasa hidup."},
    {nama:"Digital Marketing Specialist",level:"Mid",fit:"cocok",peran:"Mengelola kampanye digital yang membutuhkan respons cepat terhadap perubahan. Tidak butuh SOP panjang untuk ambil keputusan."},
    {nama:"Videographer / Photographer",level:"Entry–Mid",fit:"cocok",peran:"Menangkap momen dengan naluri yang tajam. Karya terbaik sering lahir dari situasi yang tidak direncanakan."},
    {nama:"Copywriter — Digital",level:"Entry–Mid",fit:"bisa",peran:"Menulis copy yang terasa segar dan relevan. Namun kurang optimal di proyek yang membutuhkan riset mendalam dan revisi berulang yang panjang."},
    {nama:"Account Executive — Agency",level:"Entry–Mid",fit:"bisa",peran:"Energi interpersonalnya bagus untuk membangun relasi klien. Namun perlu partner lebih detail-oriented untuk memastikan deliverable berjalan tepat waktu."},
  ]},
"Karsa|Reka":{
  naratif:"Mereka memimpin dengan cerita dan visi — bukan dengan jabatan atau otoritas formal. Di posisi apapun, mereka adalah orang yang membuat orang lain percaya bahwa ada sesuatu yang lebih besar dari pekerjaan sehari-hari. Kekuatan terbesar mereka adalah kemampuan mengubah pekerjaan menjadi misi.",
  posisi:[
    {nama:"CEO / Founder / Director",level:"Senior",fit:"ideal",peran:"Membangun organisasi atau gerakan dengan visi yang menginspirasi. Menarik talenta terbaik bukan dengan gaji, tapi dengan cerita yang membuat orang ingin jadi bagian dari sesuatu yang berarti."},
    {nama:"Chief Marketing Officer / VP Brand",level:"Senior",fit:"ideal",peran:"Memimpin brand sebagai gerakan, bukan sekadar produk. Marketing bukan tentang awareness — ini tentang membangun komunitas yang percaya."},
    {nama:"Campaign Director / Social Entrepreneur",level:"Mid–Senior",fit:"ideal",peran:"Mengelola kampanye atau inisiatif sosial dengan narasi yang kuat. Tahu bagaimana membuat orang tergerak untuk bertindak."},
    {nama:"Head of Marketing / Brand Manager",level:"Mid–Senior",fit:"cocok",peran:"Memimpin tim kreatif dengan visi yang membuat orang ingin berkontribusi lebih. Menjaga brand tetap punya jiwa di tengah tekanan komersial."},
    {nama:"Public Speaker / Thought Leader",level:"Senior",fit:"cocok",peran:"Menyampaikan ide dengan cara yang menggerakkan orang. Setiap presentasi terasa seperti undangan untuk melihat dunia dengan cara baru."},
    {nama:"Program Director — NGO / Foundation",level:"Senior",fit:"cocok",peran:"Memimpin program dengan misi yang jelas dan tim yang termotivasi oleh tujuan yang lebih besar dari diri mereka sendiri."},
    {nama:"Business Development Manager",level:"Mid",fit:"bisa",peran:"Kemampuan persuasi dan naratifnya kuat untuk membuka peluang baru. Lebih optimal jika ada kebebasan untuk membangun sesuatu, bukan hanya menjual."},
    {nama:"HR / Culture Lead",level:"Mid",fit:"bisa",peran:"Bisa membangun budaya organisasi yang kuat dengan narasi yang tepat. Lebih hidup di peran dengan dampak eksternal dan visibilitas yang lebih luas."},
  ]},
"Karsa|Logika":{
  naratif:"Mereka adalah kombinasi yang paling langka: seseorang yang bisa melihat gambaran besar sekaligus membangun mesin untuk mewujudkannya. Di posisi apapun, mereka adalah orang yang tidak hanya punya jawaban — mereka punya sistem untuk memastikan jawabannya benar-benar terjadi.",
  posisi:[
    {nama:"CEO / COO / Managing Director",level:"Senior",fit:"ideal",peran:"Memimpin organisasi dengan keseimbangan antara visi jangka panjang dan eksekusi yang presisi. Alasan organisasi bisa bergerak cepat tanpa kehilangan arah."},
    {nama:"Strategy Director / Chief of Staff",level:"Senior",fit:"ideal",peran:"Menerjemahkan ambisi besar menjadi rencana yang bisa dieksekusi. Suara yang paling dipercaya dalam ruangan saat keputusan besar harus dibuat."},
    {nama:"Management Consultant",level:"Mid–Senior",fit:"ideal",peran:"Mendiagnosis masalah organisasi dengan tajam dan merancang solusi yang logis. Rekomendasi mereka bisa dipertahankan dengan argumen yang solid."},
    {nama:"Sales Strategy Manager",level:"Mid–Senior",fit:"cocok",peran:"Merancang sistem penjualan yang skalabel. Tidak hanya menetapkan target — membangun proses yang membuat target bisa tercapai secara konsisten."},
    {nama:"Investment Manager / VC Analyst",level:"Mid–Senior",fit:"cocok",peran:"Mengevaluasi peluang dengan kombinasi ketajaman analitis dan intuisi bisnis. Melihat potensi yang tidak terlihat orang lain."},
    {nama:"Product Director",level:"Senior",fit:"cocok",peran:"Memimpin roadmap produk dengan visi yang jelas dan prioritas yang bisa dipertahankan kepada semua stakeholder."},
    {nama:"Business Analyst / Junior Consultant",level:"Entry–Mid",fit:"bisa",peran:"Titik masuk yang baik untuk mengasah kemampuan analitis. Energi terbaiknya ada di kepemimpinan — peran ini idealnya bersifat sementara."},
    {nama:"Operations Manager",level:"Mid",fit:"bisa",peran:"Mampu membangun proses yang efisien. Namun lebih optimal di peran yang memberi ruang untuk keputusan strategis, bukan hanya operasional."},
  ]},
"Karsa|Jaga":{
  naratif:"Mereka memimpin untuk jangka panjang. Setiap keputusan yang mereka buat mempertimbangkan satu pertanyaan: apakah ini akan membuat organisasi lebih kuat lima tahun dari sekarang? Di posisi apapun, mereka adalah orang yang membuat institusi bisa dipercaya — konsisten dalam nilai, konsisten dalam standar.",
  posisi:[
    {nama:"COO / General Manager",level:"Senior",fit:"ideal",peran:"Memastikan organisasi berjalan dengan sistem yang kokoh. Penyeimbang sempurna untuk CEO yang visioner tapi kurang sistematis."},
    {nama:"Branch Manager / Regional Manager",level:"Mid–Senior",fit:"ideal",peran:"Memimpin wilayah atau cabang dengan standar yang konsisten. Tim tahu persis apa yang diharapkan — tidak ada ambiguitas dalam kepemimpinan mereka."},
    {nama:"Operations Director",level:"Senior",fit:"ideal",peran:"Membangun infrastruktur operasional yang tahan lama. Alasan mengapa organisasi bisa tumbuh tanpa kehilangan kualitas."},
    {nama:"Compliance Manager / Internal Audit",level:"Mid–Senior",fit:"cocok",peran:"Menjaga integritas proses dan standar organisasi. Menjalankan fungsi ini bukan karena terpaksa, tapi karena percaya pada nilai sistem yang benar."},
    {nama:"Project Manager / PMO Lead",level:"Mid–Senior",fit:"cocok",peran:"Mengelola proyek dengan disiplin tinggi dari awal hingga selesai. Tidak kehilangan arah meski ada perubahan di tengah jalan."},
    {nama:"Government Administrator / Director",level:"Senior",fit:"cocok",peran:"Membangun kepercayaan publik melalui konsistensi, bukan kampanye. Tipe pemimpin yang dibutuhkan institusi publik."},
    {nama:"Sales Manager",level:"Mid–Senior",fit:"bisa",peran:"Bisa memimpin tim sales dengan standar yang jelas. Lebih kuat di membangun sistem daripada di memotivasi tim melalui energi personal."},
    {nama:"HR Manager",level:"Mid",fit:"bisa",peran:"Mengelola proses HR dengan integritas dan konsistensi. Lebih optimal di fungsi berorientasi sistem daripada di pengembangan budaya yang membutuhkan fleksibilitas."},
  ]},
"Karsa|Guna":{
  naratif:"Mereka memimpin dan mempengaruhi melalui koneksi manusia yang genuine. Di posisi apapun, mereka adalah orang yang membuat orang lain ingin bergerak — bukan karena instruksi, tapi karena mereka percaya pada energi dan kepercayaan yang dibangun melalui setiap interaksi nyata.",
  posisi:[
    {nama:"Sales Director / VP Business Development",level:"Senior",fit:"ideal",peran:"Menggerakkan mesin penjualan melalui jaringan relasi yang kuat dan kepercayaan personal yang dibangun selama bertahun-tahun."},
    {nama:"Key Account Manager",level:"Mid–Senior",fit:"ideal",peran:"Mempertahankan dan mengembangkan akun strategis melalui hubungan yang genuinely personal. Klien besar tidak pergi karena mereka ada."},
    {nama:"Business Development Manager",level:"Mid",fit:"ideal",peran:"Membuka peluang bisnis baru melalui kombinasi energi, intuisi, dan kemampuan membaca orang dengan cepat."},
    {nama:"Sales Manager",level:"Mid–Senior",fit:"cocok",peran:"Memimpin tim sales dengan energi yang menular. Tim bekerja keras untuk mereka karena mereka genuinely peduli pada orang-orangnya."},
    {nama:"Partnership Manager",level:"Mid",fit:"cocok",peran:"Membangun dan menjaga ekosistem kemitraan. Mereka tahu bagaimana membuat semua pihak merasa menang."},
    {nama:"Public Affairs / Government Relations",level:"Senior",fit:"cocok",peran:"Menavigasi hubungan dengan pemangku kepentingan eksternal melalui kepercayaan yang dibangun dari interaksi langsung yang konsisten."},
    {nama:"CEO / Founder",level:"Senior",fit:"bisa",peran:"Energi kepemimpinan dan kemampuan membangun relasi sangat kuat. Namun perlu sistem eksekusi yang solid — jangan hanya mengandalkan energi personal di skala besar."},
    {nama:"Recruiter / Headhunter",level:"Entry–Mid",fit:"bisa",peran:"Kemampuan membaca orang dan membangun rapport sangat relevan. Motivasi terkuatnya pada relasi jangka panjang — bukan pada kecepatan closing kandidat."},
  ]},
"Nalar|Reka":{
  naratif:"Mereka adalah peneliti yang tidak pernah puas dengan data tanpa makna. Di posisi apapun, mereka adalah orang yang mengajukan pertanyaan yang orang lain tidak pikirkan — dan menjawabnya dengan cara yang mengubah bagaimana organisasi melihat sesuatu.",
  posisi:[
    {nama:"UX Researcher / Design Researcher",level:"Mid",fit:"ideal",peran:"Menggali pemahaman mendalam tentang pengguna dan menerjemahkannya menjadi insight yang mengubah arah produk. Memastikan keputusan desain berbasis realita, bukan asumsi."},
    {nama:"Policy Analyst / Social Researcher",level:"Mid–Senior",fit:"ideal",peran:"Menganalisis data dan tren untuk rekomendasi kebijakan yang berdampak nyata. Rigor analitis diimbangi dengan kepekaan pada implikasi manusiawi."},
    {nama:"Impact Researcher / Program Evaluator",level:"Mid–Senior",fit:"ideal",peran:"Mengukur efektivitas program sosial dengan metodologi yang ketat. Mereka memastikan dampak yang diklaim benar-benar terjadi."},
    {nama:"Content Strategist / Insight Manager",level:"Mid",fit:"cocok",peran:"Merancang strategi konten berbasis riset audiens yang mendalam. Setiap keputusan konten punya justifikasi yang bisa dipertahankan."},
    {nama:"Market Research Analyst",level:"Mid",fit:"cocok",peran:"Menganalisis pasar dan konsumen dengan pendekatan yang menggabungkan data kuantitatif dan pemahaman kualitatif."},
    {nama:"Organizational Development Consultant",level:"Senior",fit:"cocok",peran:"Mendiagnosis tantangan organisasi dengan riset yang mendalam dan merancang intervensi berbasis bukti."},
    {nama:"Data Analyst",level:"Mid",fit:"bisa",peran:"Kemampuan analitisnya kuat. Lebih optimal jika analisis tersebut terhubung langsung dengan implikasi pada manusia, bukan sekadar angka di dashboard."},
    {nama:"Academic / Lecturer",level:"Senior",fit:"bisa",peran:"Kedalaman intelektual dan rasa ingin tahu akademisnya sangat kuat. Namun lebih hidup di riset yang punya dampak nyata daripada di pengajaran yang sangat terstruktur."},
  ]},
"Nalar|Logika":{
  naratif:"Mereka adalah arketipe analis sejati: mendedikasikan kemampuan kognitif untuk memahami bagaimana dunia benar-benar bekerja. Di posisi apapun, mereka adalah orang yang kesimpulannya paling tahan terhadap kritik — karena mereka tidak akan menyampaikan sesuatu yang belum bisa mereka pertahankan.",
  posisi:[
    {nama:"Data Scientist / Quantitative Analyst",level:"Mid–Senior",fit:"ideal",peran:"Membangun model dan analisis yang menjadi fondasi keputusan bisnis penting. Tidak tertarik pada cerita yang menarik — mereka tertarik pada kebenaran yang akurat."},
    {nama:"Risk Analyst / Risk Manager",level:"Mid–Senior",fit:"ideal",peran:"Mengidentifikasi dan mengkuantifikasi risiko dengan metodologi yang ketat. Tidak mudah terpengaruh bias optimisme yang sering mewarnai keputusan bisnis."},
    {nama:"Head of Research / Principal Analyst",level:"Senior",fit:"ideal",peran:"Membangun budaya rigor analitis di seluruh tim. Menetapkan standar kualitas yang membuat output tim tahan terhadap audit paling ketat sekalipun."},
    {nama:"Strategy Analyst / Intelligence Analyst",level:"Mid",fit:"cocok",peran:"Menganalisis kompetitor, pasar, atau lingkungan bisnis untuk menghasilkan insight strategis yang actionable."},
    {nama:"Financial Analyst / Investment Analyst",level:"Mid",fit:"cocok",peran:"Mengevaluasi kesehatan finansial dan potensi investasi dengan analisis mendalam. Mengikuti data ke mana pun mengarah, meski hasilnya tidak nyaman."},
    {nama:"Actuarial Analyst",level:"Mid",fit:"cocok",peran:"Memodelkan ketidakpastian dan risiko dengan presisi matematika. Salah satu peran yang paling sesuai dengan cara pikir mereka."},
    {nama:"Compliance Analyst",level:"Mid",fit:"bisa",peran:"Kemampuan analitisnya solid untuk memahami regulasi yang kompleks. Lebih optimal di analisis yang menghasilkan insight baru, bukan di pemantauan kepatuhan yang repetitif."},
    {nama:"Management Consultant",level:"Mid–Senior",fit:"bisa",peran:"Analisis mereka sangat tajam. Namun perlu mengembangkan komunikasi yang lebih persuasif untuk klien yang tidak terbiasa dengan kedalaman teknis."},
  ]},
"Nalar|Jaga":{
  naratif:"Mereka membangun pengetahuan seperti seorang arsitek membangun gedung: dengan fondasi yang kuat, metodologi yang terstruktur, dan tidak ada satu pun langkah yang diambil sembarangan. Di posisi apapun, mereka adalah orang yang menjaga integritas proses — bahkan ketika ada tekanan untuk mempercepat.",
  posisi:[
    {nama:"Clinical Research Associate / CRA",level:"Mid",fit:"ideal",peran:"Memastikan penelitian klinis berjalan sesuai protokol yang ketat. Tidak akan mengambil jalan pintas meski ada tekanan timeline dari sponsor."},
    {nama:"Quality Assurance Manager",level:"Mid–Senior",fit:"ideal",peran:"Menjaga standar kualitas dengan metodologi yang terdokumentasi rapi. Alasan mengapa produk atau layanan bisa dipercaya konsistensinya."},
    {nama:"Regulatory Affairs Specialist",level:"Mid–Senior",fit:"ideal",peran:"Memahami dan menavigasi regulasi yang kompleks dengan presisi. Memastikan organisasi tidak hanya patuh, tapi juga terlindungi dari risiko kepatuhan di masa depan."},
    {nama:"Internal Auditor",level:"Mid",fit:"cocok",peran:"Mengevaluasi proses dan kontrol internal dengan metodologi yang sistematis. Temuan mereka dapat dipercaya karena prosesnya tidak bisa dikompromikan."},
    {nama:"Research Manager / Lab Manager",level:"Mid–Senior",fit:"cocok",peran:"Memimpin tim riset dengan standar metodologi yang konsisten. Memastikan setiap proyek berjalan sesuai protokol yang telah ditetapkan."},
    {nama:"Data Quality Analyst",level:"Mid",fit:"cocok",peran:"Memastikan integritas data yang menjadi dasar seluruh analisis organisasi. Penjaga akurasi yang tidak kenal kompromi."},
    {nama:"Compliance Officer",level:"Mid",fit:"bisa",peran:"Disiplin prosedural sangat kuat untuk fungsi kepatuhan. Lebih optimal di konteks yang masih ada dimensi investigasi dan analisis, bukan sekadar pemantauan rutin."},
    {nama:"Project Coordinator",level:"Entry–Mid",fit:"bisa",peran:"Teratur dan dapat diandalkan dalam mengelola dokumentasi. Namun energi terbaiknya ada di kedalaman analitis, bukan di koordinasi lintas tim."},
  ]},
"Nalar|Guna":{
  naratif:"Mereka tidak menganalisis untuk kesenangan intelektual — mereka menganalisis karena ada masalah yang perlu dipecahkan sekarang. Di posisi apapun, mereka adalah orang yang paling cepat bergerak dari data ke keputusan.",
  posisi:[
    {nama:"Business Analyst / Product Analyst",level:"Mid",fit:"ideal",peran:"Mendiagnosis masalah bisnis atau produk dengan cepat dan menghasilkan rekomendasi yang langsung bisa dieksekusi. Tidak terjebak di analisis yang berlebihan."},
    {nama:"Growth Analyst / Performance Marketer",level:"Mid",fit:"ideal",peran:"Menganalisis funnel dan performa kampanye untuk mengidentifikasi peluang pertumbuhan yang bisa langsung ditindaklanjuti."},
    {nama:"Management Consultant",level:"Mid–Senior",fit:"ideal",peran:"Mendiagnosis masalah klien dengan cepat dan merancang solusi yang practical. Klien menghargai kecepatan dari analisis ke rekomendasi."},
    {nama:"Operations Analyst / Process Improvement",level:"Mid",fit:"cocok",peran:"Mengidentifikasi inefisiensi dalam proses operasional dan langsung merancang perbaikan yang bisa diimplementasikan."},
    {nama:"Product Manager",level:"Mid",fit:"cocok",peran:"Mengelola backlog dan prioritas produk berdasarkan data yang solid. Tidak membiarkan roadmap dikuasai oleh opini."},
    {nama:"Healthcare Quality Improvement",level:"Mid",fit:"cocok",peran:"Menganalisis data klinis untuk mengidentifikasi peluang peningkatan kualitas layanan yang bisa langsung diimplementasikan."},
    {nama:"Data Analyst",level:"Mid",fit:"bisa",peran:"Kemampuan analitisnya solid. Lebih optimal jika hasilnya langsung terhubung ke keputusan yang actionable, bukan hanya laporan yang dibaca sekali."},
    {nama:"Researcher / Academic",level:"Mid–Senior",fit:"bisa",peran:"Kemampuan analitisnya sangat dalam. Ritme penelitian akademis yang lambat bisa terasa frustrasi — mereka lebih hidup di konteks yang menuntut kecepatan."},
  ]},
"Yasa|Reka":{
  naratif:"Mereka membangun dengan visi — setiap proyek teknis yang mereka kerjakan selalu dilandasi pertanyaan: apakah ini benar-benar bermakna? Di posisi apapun, mereka menolak menghasilkan sesuatu yang hanya berfungsi secara teknis tapi kosong dari makna.",
  posisi:[
    {nama:"Architect / Industrial Designer",level:"Mid–Senior",fit:"ideal",peran:"Merancang ruang atau produk fisik yang tidak hanya fungsional tapi juga bermakna. Setiap keputusan desain punya pertimbangan yang melampaui estetika semata."},
    {nama:"Sustainable Design / R&D Specialist",level:"Mid–Senior",fit:"ideal",peran:"Mengembangkan solusi teknis yang berdampak positif pada lingkungan atau masyarakat. Termotivasi oleh pekerjaan yang bisa dirasakan dampaknya jangka panjang."},
    {nama:"Product Designer",level:"Mid",fit:"ideal",peran:"Menghubungkan fungsi teknis dan pengalaman pengguna dalam satu objek yang kohesif. Tidak puas dengan produk yang hanya bekerja — ia harus juga berarti."},
    {nama:"UX / Service Designer",level:"Mid",fit:"cocok",peran:"Merancang pengalaman yang dirasakan manusiawi oleh penggunanya. Keahlian teknis membuat rancangan yang juga bisa diimplementasikan."},
    {nama:"Film / Documentary Maker",level:"Mid",fit:"cocok",peran:"Menggabungkan keahlian teknis produksi dengan narasi yang bermakna. Karya terbaik lahir dari subjek yang benar-benar mereka pedulikan."},
    {nama:"Craftsperson / Artisan",level:"Entry–Senior",fit:"cocok",peran:"Menuangkan keahlian tangan ke dalam karya yang punya nilai estetis dan fungsional sekaligus. Menemukan kepuasan dalam proses pembuatan itu sendiri."},
    {nama:"Site Manager / Technical Lead",level:"Mid–Senior",fit:"bisa",peran:"Kemampuan teknis dan visi proyek solid. Namun lebih optimal di proyek yang punya dimensi makna yang jelas, bukan di proyek konstruksi yang sangat rutin."},
    {nama:"Technical Trainer",level:"Mid",fit:"bisa",peran:"Bisa berbagi keahlian teknis dengan cara yang inspiratif. Namun lebih hidup sebagai praktisi daripada sebagai pengajar penuh waktu."},
  ]},
"Yasa|Logika":{
  naratif:"Mereka melihat dunia sebagai sistem yang bisa dioptimasi. Di posisi apapun, mereka adalah orang yang selalu bertanya: mengapa sistem ini bekerja seperti ini, dan bagaimana cara membuatnya lebih baik? Tidak ada inefisiensi yang lolos dari perhatian mereka.",
  posisi:[
    {nama:"Systems Engineer / Process Engineer",level:"Mid–Senior",fit:"ideal",peran:"Merancang sistem yang skalabel dan andal. Tidak berhenti di solusi yang berfungsi — mereka terus mencari yang lebih efisien."},
    {nama:"Engineering Manager / Head of Engineering",level:"Senior",fit:"ideal",peran:"Memimpin tim teknis dengan kredibilitas yang lahir dari kompetensi nyata. Tim teknis sangat menghormati tipe ini karena mereka tahu pekerjaan tim dari dalam."},
    {nama:"Data Engineer / Platform Engineer",level:"Mid",fit:"ideal",peran:"Membangun infrastruktur data yang solid dan skalabel. Melihat arsitektur yang optimal bahkan sebelum masalah pertama muncul."},
    {nama:"Business Process Analyst",level:"Mid",fit:"cocok",peran:"Menganalisis dan mengoptimasi proses bisnis dengan pendekatan sistematis. Menemukan inefisiensi yang tidak disadari orang lain."},
    {nama:"Procurement / Supply Chain Analyst",level:"Mid",fit:"cocok",peran:"Mengoptimasi rantai pasok dengan analisis yang mendalam. Tidak puas dengan proses yang sudah biasa jika ada cara yang lebih efisien."},
    {nama:"Solution Architect",level:"Senior",fit:"cocok",peran:"Merancang solusi teknis yang menjawab kebutuhan bisnis secara optimal. Penghubung antara dunia bisnis dan dunia teknis."},
    {nama:"Operations Manager",level:"Mid–Senior",fit:"bisa",peran:"Kemampuan sistematis sangat berguna dalam operasional. Lebih optimal di peran yang masih ada dimensi problem-solving teknis, bukan hanya koordinasi."},
    {nama:"IT Project Manager",level:"Mid",fit:"bisa",peran:"Terorganisir dan sistematis dalam mengelola proyek teknis. Energi terbaiknya ada di memecahkan masalah teknis, bukan di koordinasi stakeholder."},
  ]},
"Yasa|Jaga":{
  naratif:"Mereka adalah tulang punggung industri yang membutuhkan keandalan. Di posisi apapun, mereka adalah orang yang bisa dipercaya untuk menghasilkan kualitas yang konsisten — hari demi hari, proyek demi proyek, tanpa perlu diingatkan. Bagi mereka, standar bukan sesuatu yang dinegosiasikan.",
  posisi:[
    {nama:"QA Engineer / Quality Manager",level:"Mid–Senior",fit:"ideal",peran:"Menjaga standar kualitas dengan konsistensi yang tidak tergoyahkan. Tidak akan meloloskan sesuatu yang tidak memenuhi standar, meski ada tekanan deadline."},
    {nama:"Site Manager / Plant Manager",level:"Mid–Senior",fit:"ideal",peran:"Memastikan operasional lapangan berjalan sesuai standar setiap hari. Tim lapangan sangat butuh pemimpin seperti ini — hadir, jelas ekspektasinya, dan bisa diandalkan."},
    {nama:"Maintenance Engineer",level:"Mid",fit:"ideal",peran:"Menjaga mesin dan fasilitas berfungsi optimal dengan jadwal preventif yang disiplin. Tidak menunggu sesuatu rusak untuk bertindak."},
    {nama:"Production Supervisor",level:"Mid",fit:"cocok",peran:"Memimpin tim produksi dengan standar yang konsisten dan ekspektasi yang jelas. Output yang mereka hasilkan bisa diprediksi kualitasnya."},
    {nama:"Safety Officer / HSE Specialist",level:"Mid",fit:"cocok",peran:"Memastikan prosedur keselamatan diikuti dengan ketat. Tidak berkompromi pada keselamatan meski ada tekanan produktivitas."},
    {nama:"Procurement Officer",level:"Mid",fit:"cocok",peran:"Mengelola pengadaan dengan standar dokumentasi dan proses yang tidak berubah-ubah. Vendor tahu apa yang diharapkan dari mereka."},
    {nama:"Technical Trainer",level:"Mid",fit:"bisa",peran:"Bisa menyampaikan keahlian teknis dengan cara yang terstruktur. Namun lebih hidup sebagai praktisi daripada sebagai pengajar."},
    {nama:"General Affairs Supervisor",level:"Mid",fit:"bisa",peran:"Teratur dan bisa diandalkan dalam mengelola fasilitas dan kebutuhan operasional kantor. Lebih optimal jika masih ada dimensi teknis dalam perannya."},
  ]},
"Yasa|Guna":{
  naratif:"Mereka belajar dari lapangan, bukan dari manual. Di posisi apapun, mereka adalah orang yang sudah bergerak saat yang lain masih berdiskusi. Keahlian mereka lahir dari ribuan jam di situasi nyata — dan kemampuan beradaptasi cepat mereka adalah yang paling berharga ketika sesuatu tidak berjalan sesuai rencana.",
  posisi:[
    {nama:"Field Engineer / Field Technician",level:"Entry–Mid",fit:"ideal",peran:"Mendiagnosis dan menyelesaikan masalah teknis di lapangan dengan cepat. Tidak butuh SOP lengkap untuk bertindak — pengalaman dan insting mereka yang bicara."},
    {nama:"Emergency Response / Safety Officer",level:"Mid",fit:"ideal",peran:"Merespons situasi kritis dengan tenang dan cepat. Tidak panik — mengidentifikasi masalah dan bertindak sementara yang lain masih mencari prosedur."},
    {nama:"Technical Operations Manager",level:"Senior",fit:"ideal",peran:"Memimpin operasional teknis yang kompleks dan dinamis. Paling efektif ketika tetap dekat dengan lapangan, bukan duduk di belakang meja."},
    {nama:"Mechanical / Electrical Technician",level:"Entry–Mid",fit:"cocok",peran:"Mengerjakan instalasi, perbaikan, dan pemeliharaan dengan kemampuan problem-solving yang tinggi. Orang yang dipanggil pertama saat ada yang tidak beres."},
    {nama:"Construction Site Supervisor",level:"Mid",fit:"cocok",peran:"Memimpin tim lapangan konstruksi dengan fleksibilitas tinggi. Membuat keputusan cepat saat kondisi berubah tanpa kehilangan arah tujuan."},
    {nama:"Expedition / Outdoor Instructor",level:"Mid",fit:"cocok",peran:"Memimpin kegiatan di alam terbuka dengan ketenangan dan kemampuan membaca situasi yang tajam. Di elemen terbaik mereka di luar ruangan."},
    {nama:"Warehouse Supervisor",level:"Mid",fit:"bisa",peran:"Mampu mengelola operasional gudang dengan responsif terhadap perubahan. Lebih optimal jika ada variasi tantangan teknis, bukan hanya rutinitas logistik."},
    {nama:"Driver / Operator Alat Berat",level:"Entry",fit:"bisa",peran:"Keterampilan teknis dan ketenangan dalam situasi tidak terduga relevan. Potensi terbesar mereka berkembang di peran dengan tantangan yang lebih dinamis."},
  ]},
"Tata|Reka":{
  naratif:"Mereka membangun keteraturan bukan karena itu aturannya — tapi karena mereka tahu sistem yang baik adalah yang membuat hal-hal bermakna bisa terjadi secara konsisten. Di posisi apapun, mereka adalah orang yang memastikan visi bisa dieksekusi dengan andal, tanpa kehilangan nilai yang mendasarinya.",
  posisi:[
    {nama:"Chief of Staff / Head of Operations",level:"Senior",fit:"ideal",peran:"Menerjemahkan visi pemimpin menjadi sistem dan rencana operasional yang konkret. Alasan organisasi bisa bergerak kohesif tanpa micromanagement."},
    {nama:"Knowledge Management Specialist",level:"Mid",fit:"ideal",peran:"Membangun sistem dokumentasi dan berbagi pengetahuan yang benar-benar digunakan orang. Tidak sekadar mengarsip — memastikan pengetahuan hidup dan accessible."},
    {nama:"Organizational Excellence Manager",level:"Mid–Senior",fit:"ideal",peran:"Memastikan nilai-nilai organisasi tidak hanya terpampang di dinding tapi hidup dalam prosedur dan proses sehari-hari."},
    {nama:"Internal Communications Manager",level:"Mid",fit:"cocok",peran:"Merancang komunikasi internal yang memastikan arah dan nilai organisasi tersampaikan dengan konsisten ke seluruh lapisan."},
    {nama:"Program Manager — Social / NGO",level:"Mid–Senior",fit:"cocok",peran:"Mengelola program dengan sistem yang memastikan dampak yang dijanjikan benar-benar terjadi. Tidak puas dengan program yang hanya bagus di laporan."},
    {nama:"HR / Culture & Engagement Manager",level:"Mid",fit:"cocok",peran:"Membangun sistem engagement yang memastikan nilai-nilai organisasi dirasakan, bukan hanya diumumkan."},
    {nama:"Executive Assistant",level:"Mid",fit:"bisa",peran:"Sangat terorganisir dan mampu mengelola kompleksitas jadwal eksekutif. Energi terbaiknya ada di merancang sistem, bukan di mengeksekusi keperluan orang lain."},
    {nama:"Project Coordinator",level:"Entry–Mid",fit:"bisa",peran:"Teratur dan bisa diandalkan dalam mengelola dokumen dan timeline. Lebih optimal di peran yang memberi ruang untuk merancang sistem, bukan hanya mengikutinya."},
  ]},
"Tata|Logika":{
  naratif:"Mereka tidak hanya menjalankan sistem — mereka mendesain ulang yang sudah ada menjadi lebih baik. Di posisi apapun, mereka adalah orang yang paling credible untuk mengusulkan perubahan karena mereka selalu bisa menjelaskan 'mengapa' dengan logika yang tidak bisa dibantah.",
  posisi:[
    {nama:"Head of Process Excellence / Transformation",level:"Senior",fit:"ideal",peran:"Memimpin transformasi sistem dan proses di seluruh organisasi. Credibilitas tinggi karena bisa menjelaskan 'mengapa' dengan logika yang tidak bisa dibantah."},
    {nama:"Management Consultant",level:"Mid–Senior",fit:"ideal",peran:"Mendiagnosis inefisiensi sistemik dan merancang solusi yang akan benar-benar diimplementasikan. Tidak berhenti di rekomendasi — ingin melihatnya berjalan."},
    {nama:"CFO / Financial Controller",level:"Senior",fit:"ideal",peran:"Membangun sistem keuangan yang andal dan tahan terhadap pertumbuhan. Melihat angka bukan hanya sebagai laporan, tapi sebagai sistem yang bisa dioptimasi."},
    {nama:"Digital Transformation Lead",level:"Senior",fit:"cocok",peran:"Memimpin adopsi teknologi baru dengan pendekatan sistematis yang meminimalisir resistansi. Memahami bahwa transformasi bukan tentang teknologi — tapi tentang sistem kerja."},
    {nama:"Purchasing Manager / Procurement Lead",level:"Mid–Senior",fit:"cocok",peran:"Merancang sistem pengadaan yang efisien, transparan, dan scalable. Menemukan celah pemborosan yang tidak disadari orang lain."},
    {nama:"Strategy Manager",level:"Mid–Senior",fit:"cocok",peran:"Merancang inisiatif strategis yang punya jalur eksekusi yang jelas. Visi tanpa sistem bagi mereka terasa tidak lengkap."},
    {nama:"IT Manager / Systems Administrator",level:"Mid",fit:"bisa",peran:"Kemampuan sistematis relevan untuk mengelola infrastruktur IT. Lebih optimal di peran yang ada dimensi desain dan improvement, bukan hanya pemeliharaan."},
    {nama:"Business Analyst",level:"Mid",fit:"bisa",peran:"Analisis prosesnya tajam. Energi terbaiknya ada di merancang ulang sistem secara menyeluruh, bukan hanya mendokumentasikan yang sudah ada."},
  ]},
"Tata|Jaga":{
  naratif:"Mereka adalah arketipe paling murni dari keandalan organisasi. Di posisi apapun, mereka adalah orang yang membuat semua orang bisa tidur nyenyak — karena tidak ada yang akan terlewat, tidak ada yang akan salah hitung, tidak ada standar yang akan dikompromikan.",
  posisi:[
    {nama:"Financial Controller / Senior Accountant",level:"Mid–Senior",fit:"ideal",peran:"Menjaga integritas keuangan dengan presisi yang tidak tergoyahkan. Tidak ada angka yang salah, tidak ada periode yang terlewat."},
    {nama:"Compliance Officer / Internal Auditor",level:"Mid–Senior",fit:"ideal",peran:"Memastikan organisasi beroperasi sesuai regulasi dan standar internal. Melakukan ini bukan karena takut audit, tapi karena percaya pada nilai integritas sistem."},
    {nama:"Head of Finance / CFO",level:"Senior",fit:"ideal",peran:"Membangun sistem keuangan yang andal untuk jangka panjang. Organisasi yang butuh fondasi finansial yang tidak bisa digoyahkan membutuhkan profil ini."},
    {nama:"Risk Manager / Actuary",level:"Mid–Senior",fit:"cocok",peran:"Memodelkan dan mengelola risiko dengan metodologi yang presisi. Tidak panik menghadapi ketidakpastian — mereka mengkuantifikasinya."},
    {nama:"Purchasing Officer / Vendor Manager",level:"Mid",fit:"cocok",peran:"Mengelola pengadaan dengan standar dokumentasi dan proses yang tidak berubah-ubah. Tidak ada celah dalam sistem procurement mereka."},
    {nama:"Operations Manager — Finance/Admin",level:"Mid–Senior",fit:"cocok",peran:"Memastikan operasional berjalan dengan akurasi tinggi. Fondasi yang memungkinkan bagian lain organisasi bergerak dengan tenang."},
    {nama:"Executive Assistant / Office Manager",level:"Mid",fit:"bisa",peran:"Sangat andal dalam mengelola kompleksitas administratif. Lebih optimal jika ada struktur yang jelas dan tidak terlalu banyak variabel yang tidak terduga."},
    {nama:"Data Entry / Administrative Staff",level:"Entry",fit:"bisa",peran:"Akurasi dan konsistensi relevan untuk pekerjaan berbasis data. Potensi terbesar mereka berkembang di peran dengan tanggung jawab analitis yang lebih besar."},
  ]},
"Tata|Guna":{
  naratif:"Mereka menghargai keteraturan sebagai alat, bukan tujuan. Di posisi apapun, mereka adalah orang yang paling efisien dalam mengeksekusi — mereka tahu aturannya, mereka tahu cara tercepat mencapai tujuan, dan mereka tahu kapan perlu fleksibel tanpa kehilangan arah.",
  posisi:[
    {nama:"Project Manager / PMO Lead",level:"Mid–Senior",fit:"ideal",peran:"Mengelola proyek dengan kompleksitas tinggi dan banyak variabel. Tidak kehilangan arah saat ada perubahan — merespons tanpa kehilangan tujuan."},
    {nama:"Operations Manager",level:"Mid–Senior",fit:"ideal",peran:"Menemukan cara paling efisien untuk mencapai target operasional bahkan saat kondisi tidak ideal. Orang pertama yang dihubungi saat ada masalah operasional."},
    {nama:"Executive Assistant to C-Suite",level:"Mid–Senior",fit:"ideal",peran:"Mengelola prioritas dan agenda eksekutif dengan kombinasi keteraturan dan fleksibilitas taktis. Membuat eksekutif bisa fokus pada hal yang paling penting."},
    {nama:"Sales Coordinator / Sales Operations",level:"Mid",fit:"cocok",peran:"Memastikan mesin penjualan berjalan tanpa hambatan administratif. Tim sales bisa fokus menjual karena back-office dikelola dengan efisien."},
    {nama:"Logistics Coordinator / Supply Chain",level:"Mid",fit:"cocok",peran:"Mengelola alur logistik yang kompleks dengan adaptabilitas tinggi terhadap perubahan. Menemukan solusi ketika rencana awal tidak bisa dijalankan."},
    {nama:"Office Manager / Facility Manager",level:"Mid",fit:"cocok",peran:"Memastikan kantor dan fasilitas berjalan lancar. Responsif terhadap kebutuhan yang muncul tanpa kehilangan pengelolaan yang terstruktur."},
    {nama:"Customer Service Supervisor",level:"Mid",fit:"bisa",peran:"Mampu mengelola tim CS dengan efisien dan responsif. Lebih optimal di peran yang ada dimensi koordinasi dan sistem, bukan hanya pelayanan langsung."},
    {nama:"Purchasing / Procurement Staff",level:"Entry–Mid",fit:"bisa",peran:"Teratur dan efisien dalam mengelola proses pengadaan. Lebih optimal jika ada ruang untuk mengoptimasi proses, bukan hanya menjalankan prosedur yang sudah ada."},
  ]},
};

// ─────────────────────────────────────────────────────────────
// PARAGA DATA — v2
// Key: "Kelompok|Watak" — strictly using Kelompok names (no invented labels)
// Each entry has: en, tags, tagClasses, overview, kekuatan, lingkungan_ideal
// overview = naratif orang ketiga, storytelling
// ─────────────────────────────────────────────────────────────
const PARAGA = {
  // ── KARYA ──
  "Karya|Reka":{
    en:"The Visionary Storyteller",
    tags:["Karya","Bakti","Karsa","Watak Reka"],
    tagClasses:["rtag-orange","rtag-teal","rtag-sage","rtag-grey"],
    overview:{
      id:"Ia tidak sekadar membuat sesuatu — ia membuat sesuatu menjadi bermakna. Di ruang manapun ia masuk, ada energi yang berubah: percakapan menjadi lebih dalam, ide-ide yang tadinya terasa abstrak tiba-tiba punya bentuk dan arah. Ia adalah orang yang melihat audiens sebelum melihat kanvas, dan itulah yang membuat karyanya selalu tepat sasaran.",
      en:"They don't just make things — they make things mean something. In any room they enter, something shifts: conversations go deeper, ideas that felt abstract suddenly have shape and direction. They see the audience before they see the canvas, and that's what makes their work always land."},
    kekuatan:{
      id:["Menerjemahkan visi abstrak menjadi cerita yang bisa dirasakan orang","Memimpin proyek kreatif dengan kepekaan dan arah yang jelas","Membangun koneksi antara karya dan audiens yang paling dalam"],
      en:["Translating abstract vision into stories people can feel","Leading creative projects with sensitivity and clear direction","Building the deepest connection between work and audience"]},
    lingkungan_ideal:{
      id:"Lingkungan kolaboratif yang menghargai orisinalitas dan memberi ruang untuk proses kreatif yang mendalam. Audiens atau komunitas nyata yang karyanya bisa berdampak langsung. Tim kecil dengan kepercayaan tinggi.",
      en:"A collaborative environment that values originality and gives space for deep creative process. A real audience or community where their work can have direct impact. A small team with high trust."}
  },
  "Karya|Logika":{
    en:"The Creative Architect",
    tags:["Karya","Nalar","Watak Logika"],
    tagClasses:["rtag-orange","rtag-teal","rtag-grey"],
    overview:{
      id:"Di balik setiap karya yang ia hasilkan, ada sistem yang solid. Ia bukan hanya seniman — ia adalah perancang sistem kreatif. Ketika orang lain melihat sebuah desain yang indah, ia melihat framework yang bisa direplikasi, proses yang bisa dioptimasi, dan potensi yang bisa diskalakan.",
      en:"Behind every work they produce, there's a solid system. They're not just an artist — they're a designer of creative systems. When others see a beautiful design, they see a replicable framework, an optimizable process, and scalable potential."},
    kekuatan:{
      id:["Membangun sistem dan framework kreatif yang bisa direplikasi","Menganalisis tren estetika dan mengantisipasi arah selanjutnya","Mengintegrasikan data dan intuisi kreatif dalam satu keputusan desain"],
      en:["Building replicable creative systems and frameworks","Analyzing aesthetic trends and anticipating the next direction","Integrating data and creative intuition in one design decision"]},
    lingkungan_ideal:{
      id:"Proyek kreatif dengan kompleksitas dan skala yang sesungguhnya. Akses ke data pengguna atau audiens untuk menginformasikan keputusan kreatif. Lingkungan yang menghargai strategi di balik estetika.",
      en:"Creative projects with real complexity and scale. Access to user or audience data to inform creative decisions. An environment that values the strategy behind aesthetics."}
  },
  "Karya|Jaga":{
    en:"The Master of Craft",
    tags:["Karya","Tata","Watak Jaga"],
    tagClasses:["rtag-orange","rtag-sage","rtag-grey"],
    overview:{
      id:"Ia tidak menunggu inspirasi — ia datang tepat waktu, duduk di tempat kerja, dan mulai bekerja. Di industri yang penuh dengan kreator yang mengandalkan mood, ia adalah anomali yang paling berharga: seseorang yang menghasilkan kualitas tinggi secara konsisten, hari demi hari, tanpa drama.",
      en:"They don't wait for inspiration — they show up on time, sit at their workspace, and start working. In an industry full of mood-dependent creators, they're the most valuable anomaly: someone who delivers high quality consistently, day after day, without drama."},
    kekuatan:{
      id:["Menghasilkan karya berkualitas tinggi dengan konsistensi yang jarang dimiliki kreator lain","Menguasai teknik dan tools kreatif sampai ke tingkat yang paling dalam","Memenuhi deadline kreatif tanpa mengorbankan kualitas"],
      en:["Delivering high-quality work with consistency rare among other creators","Mastering creative techniques and tools to the deepest level","Meeting creative deadlines without sacrificing quality"]},
    lingkungan_ideal:{
      id:"Standar kualitas yang tinggi dan dihargai. Brief yang jelas sehingga energi kreatif bisa dicurahkan sepenuhnya ke eksekusi. Tim yang menghargai keandalan dan presisi.",
      en:"High quality standards that are respected. Clear briefs so creative energy can be fully channeled into execution. A team that values reliability and precision."}
  },
  "Karya|Guna":{
    en:"The Spontaneous Creator",
    tags:["Karya","Karsa","Watak Guna"],
    tagClasses:["rtag-orange","rtag-teal","rtag-grey"],
    overview:{
      id:"Karyanya paling hidup ketika lahir di momen. Ia adalah improviser sejati — responsif, adaptif, dan paling autentik ketika tidak ada skrip. Di saat kreator lain sedang merencanakan, ia sudah berkarya. Hasilnya tidak selalu sempurna secara teknis, tapi selalu terasa nyata.",
      en:"Their work comes most alive when born in the moment. They're a true improviser — responsive, adaptive, and most authentic when there's no script. While other creators are still planning, they're already making. The result isn't always technically perfect, but it always feels real."},
    kekuatan:{
      id:["Menghasilkan karya yang terasa spontan, segar, dan tidak dibuat-buat","Merespons feedback dan kondisi real-time dengan cepat dan natural","Membawa energi dan kehadiran yang nyata ke dalam performa atau presentasi kreatif"],
      en:["Producing work that feels spontaneous, fresh, and genuine","Responding to feedback and real-time conditions quickly and naturally","Bringing real energy and presence to creative performance or presentation"]},
    lingkungan_ideal:{
      id:"Proyek dengan ruang improvisasi yang nyata. Audiens atau klien yang responsif dan bisa diajak berinteraksi langsung. Deadline yang memberikan urgensi tanpa mencekik kreativitas.",
      en:"Projects with real room for improvisation. A responsive audience or client that can be interacted with directly. Deadlines that create urgency without strangling creativity."}
  },

  // ── BAKTI ──
  "Bakti|Reka":{
    en:"The Human Developer",
    tags:["Bakti","Karya","Watak Reka"],
    tagClasses:["rtag-sage","rtag-orange","rtag-grey"],
    overview:{
      id:"Ia melihat potensi di setiap orang bahkan sebelum mereka melihatnya sendiri. Bagi ia, setiap percakapan adalah kesempatan untuk menemukan apa yang tersembunyi di balik ketidakpastian seseorang. Ia tidak hanya membantu — ia melihat, memahami, dan menemani. Dan itulah yang membuat orang-orang kembali padanya.",
      en:"They see potential in every person even before those people see it themselves. For them, every conversation is a chance to find what's hidden behind someone's uncertainty. They don't just help — they see, understand, and accompany. And that's what makes people come back to them."},
    kekuatan:{
      id:["Membangun kepercayaan yang mendalam dengan individu yang mereka dampingi","Mendesain program dan intervensi yang menyentuh akar, bukan hanya gejala","Menjaga kehadiran emosional yang penuh bahkan di situasi yang paling berat"],
      en:["Building deep trust with the individuals they accompany","Designing programs and interventions that address roots, not just symptoms","Maintaining full emotional presence even in the most difficult situations"]},
    lingkungan_ideal:{
      id:"Hubungan jangka panjang yang memungkinkan dampak transformatif yang nyata. Organisasi yang genuinely peduli pada manusia, bukan hanya performa. Ruang refleksi untuk diri sendiri di tengah pekerjaan yang emosionally demanding.",
      en:"Long-term relationships that enable real transformative impact. An organization that genuinely cares about people, not just performance. Space for self-reflection amid emotionally demanding work."}
  },
  "Bakti|Logika":{
    en:"The System of People",
    tags:["Bakti","Nalar","Watak Logika"],
    tagClasses:["rtag-sage","rtag-teal","rtag-grey"],
    overview:{
      id:"Ia peduli pada orang — tapi cara ia menunjukkan kepedulian adalah dengan merancang sistem yang membuat pertumbuhan manusia terjadi secara konsisten. Ia adalah seseorang yang mendekati pengembangan manusia dengan presisi yang sama seperti seorang insinyur mendekati masalah teknis.",
      en:"They care about people — but the way they show that care is by designing systems that make human growth happen consistently. They're someone who approaches human development with the same precision an engineer brings to a technical problem."},
    kekuatan:{
      id:["Merancang sistem people development yang bisa bekerja di skala besar","Menganalisis data SDM untuk menemukan pola dan peluang peningkatan","Membangun framework coaching atau training yang rigorous dan terukur"],
      en:["Designing people development systems that work at scale","Analyzing HR data to find patterns and improvement opportunities","Building rigorous and measurable coaching or training frameworks"]},
    lingkungan_ideal:{
      id:"Organisasi yang serius tentang talent development. Akses ke data dan wewenang untuk membuat keputusan sistemik. Posisi yang memungkinkan pengaruh strategis, bukan hanya operasional.",
      en:"An organization serious about talent development. Access to data and authority to make systemic decisions. A position that allows strategic influence, not just operational."}
  },
  "Bakti|Jaga":{
    en:"The Reliable Guardian",
    tags:["Bakti","Tata","Watak Jaga"],
    tagClasses:["rtag-sage","rtag-plum","rtag-grey"],
    overview:{
      id:"Ia tidak glamor dan tidak mencari pengakuan — ia memastikan sistem berjalan, orang mendapat apa yang mereka butuhkan, dan tidak ada yang terlewat. Di institusi manapun yang melayani manusia, ia adalah alasan kenapa janji-janji yang dibuat di atas bisa sampai ke bawah.",
      en:"They're not glamorous and don't seek recognition — they make sure systems run, people get what they need, and nothing falls through the cracks. In any institution serving people, they're the reason why promises made at the top actually reach the bottom."},
    kekuatan:{
      id:["Membangun proses layanan yang konsisten dan bisa diandalkan","Memastikan kebutuhan individu terpenuhi di tengah sistem yang besar","Menjaga standar etika dan kualitas layanan di bawah tekanan apapun"],
      en:["Building consistent and reliable service processes","Ensuring individual needs are met within large systems","Maintaining ethical standards and service quality under any pressure"]},
    lingkungan_ideal:{
      id:"Institusi dengan mandat sosial yang jelas dan serius. Peran dengan scope yang terdefinisi dan wewenang yang cukup. Tim yang berbagi nilai tentang pelayanan.",
      en:"An institution with a clear and serious social mandate. A role with defined scope and sufficient authority. A team that shares service values."}
  },
  "Bakti|Guna":{
    en:"The Hands-On Helper",
    tags:["Bakti","Karsa","Watak Guna"],
    tagClasses:["rtag-sage","rtag-orange","rtag-grey"],
    overview:{
      id:"Ia tidak menunggu sistem atau prosedur. Ia melihat kebutuhan dan langsung bergerak. Di momen krisis, saat yang lain masih mencari formulir, ia sudah ada di sana — hadir secara fisik, emosional, dan praktis. Kekuatannya bukan di planning jangka panjang, tapi di kehadiran nyata.",
      en:"They don't wait for systems or procedures. They see a need and move. In moments of crisis, while others are still looking for forms, they're already there — physically, emotionally, and practically present. Their strength isn't in long-term planning, but in real presence."},
    kekuatan:{
      id:["Merespons kebutuhan manusia secara langsung dan cepat tanpa birokrasi","Membangun kepercayaan melalui tindakan nyata, bukan kata-kata","Beradaptasi dengan kebutuhan yang berubah-ubah di lapangan"],
      en:["Responding to human needs directly and quickly without bureaucracy","Building trust through real actions, not words","Adapting to constantly changing needs in the field"]},
    lingkungan_ideal:{
      id:"Pekerjaan lapangan yang berinteraksi langsung dengan orang yang dilayani. Lingkungan yang memberikan otonomi untuk bertindak berdasarkan penilaian sendiri. Hasil yang terlihat langsung.",
      en:"Field work that directly interacts with the people being served. An environment that gives autonomy to act based on one's own judgment. Results that are immediately visible."}
  },

  // ── KARSA ──
  "Karsa|Reka":{
    en:"The Vision-Led Entrepreneur",
    tags:["Karsa","Karya","Watak Reka"],
    tagClasses:["rtag-plum","rtag-orange","rtag-grey"],
    overview:{
      id:"Ia memimpin dengan cerita dan visi, bukan dengan jabatan. Orang mengikutinya bukan karena harus, tapi karena mereka merasakan bahwa ada sesuatu yang lebih besar dari diri mereka sendiri di balik apa yang ia bangun. Ia tidak membuat organisasi — ia membuat gerakan.",
      en:"They lead through story and vision, not title. People follow them not because they have to, but because they sense there's something larger than themselves behind what's being built. They don't make organizations — they make movements."},
    kekuatan:{
      id:["Membangun narasi dan visi yang menginspirasi dan menggerakkan orang","Melihat peluang di tempat yang belum dilihat orang lain","Memimpin transformasi budaya organisasi atau komunitas"],
      en:["Building narratives and visions that inspire and move people","Seeing opportunities where others haven't looked","Leading organizational or community culture transformation"]},
    lingkungan_ideal:{
      id:"Zero-to-one energy — membangun dari awal. Tim yang percaya pada misi. Kebebasan untuk menentukan arah, bukan hanya menjalankan instruksi.",
      en:"Zero-to-one energy — building from scratch. A team that believes in the mission. Freedom to determine direction, not just execute instructions."}
  },
  "Karsa|Logika":{
    en:"The Strategic Operator",
    tags:["Karsa","Nalar","Watak Logika"],
    tagClasses:["rtag-plum","rtag-teal","rtag-grey"],
    overview:{
      id:"Ia adalah kombinasi yang paling langka dan paling dicari: seseorang yang bisa melihat gambaran besar sekaligus membangun mesin yang mewujudkannya. Ketika pemimpin lain berhenti di visi, ia sudah merancang sistem eksekusinya. Ketika analis lain berhenti di data, ia sudah bergerak.",
      en:"They're the rarest and most sought-after combination: someone who can see the big picture and simultaneously build the machine that realizes it. When other leaders stop at vision, they're already designing the execution system. When other analysts stop at data, they're already moving."},
    kekuatan:{
      id:["Mengintegrasikan visi jangka panjang dengan eksekusi jangka pendek","Membangun organisasi yang skalabel dan berprestasi tinggi","Mengambil keputusan sulit dengan kepala dingin di bawah tekanan"],
      en:["Integrating long-term vision with short-term execution","Building scalable and high-performing organizations","Making difficult decisions with a cool head under pressure"]},
    lingkungan_ideal:{
      id:"Akuntabilitas tinggi dan otoritas yang setara. Industri yang kompetitif dengan stakes yang nyata. Tim yang bisa ditantang dan tumbuh.",
      en:"High accountability and equal authority. A competitive industry with real stakes. A team that can be challenged and will grow."}
  },
  "Karsa|Jaga":{
    en:"The Institution Builder",
    tags:["Karsa","Tata","Watak Jaga"],
    tagClasses:["rtag-plum","rtag-sage","rtag-grey"],
    overview:{
      id:"Ia memimpin untuk jangka panjang. Bukan spotlight yang ia kejar, tapi warisan. Setiap keputusan yang ia buat mempertimbangkan satu pertanyaan: apakah ini akan membuat institusi ini lebih kuat lima tahun dari sekarang? Ia adalah alasan organisasi bisa bertahan dekade demi dekade.",
      en:"They lead for the long term. Not the spotlight they're after, but the legacy. Every decision they make considers one question: will this make the institution stronger five years from now? They're the reason organizations can survive decade after decade."},
    kekuatan:{
      id:["Membangun sistem tata kelola dan akuntabilitas yang kokoh","Menjaga konsistensi nilai dan standar organisasi di tengah tekanan perubahan","Mengembangkan pemimpin generasi berikutnya secara sistematis"],
      en:["Building solid governance and accountability systems","Maintaining consistency of organizational values and standards amid change pressure","Systematically developing the next generation of leaders"]},
    lingkungan_ideal:{
      id:"Institusi dengan sejarah dan mandat yang jelas. Ekspektasi jangka panjang, bukan hanya quarterly results. Tim yang menghargai stabilitas dan keandalan.",
      en:"An institution with a clear history and mandate. Long-term expectations, not just quarterly results. A team that values stability and reliability."}
  },
  "Karsa|Guna":{
    en:"The Relationship Driver",
    tags:["Karsa","Bakti","Watak Guna"],
    tagClasses:["rtag-plum","rtag-sage","rtag-grey"],
    overview:{
      id:"Ia memimpin dan mempengaruhi melalui koneksi manusia yang genuine. Ia tidak menggunakan teknik persuasi yang dipelajari — ia menggunakan kehadiran nyata, energi yang tulus, dan kemampuan membaca orang yang hampir instingtif. Deal terbaik tidak terjadi di meja — ia yang membuatnya terjadi sebelum itu.",
      en:"They lead and influence through genuine human connection. They don't use learned persuasion techniques — they use real presence, genuine energy, and an almost instinctive ability to read people. The best deals don't happen at the table — they're the one who makes them happen before that."},
    kekuatan:{
      id:["Membangun jaringan dan relasi bisnis yang kuat dan tahan lama","Membaca situasi dan orang dengan cepat dan akurat","Menggerakkan deal atau keputusan melalui kepercayaan personal"],
      en:["Building strong and lasting business networks and relationships","Reading situations and people quickly and accurately","Moving deals or decisions through personal trust"]},
    lingkungan_ideal:{
      id:"High-external interaction — pertemuan, events, negosiasi. Insentif yang terkait langsung dengan hasil. Otonomi dalam mengelola hubungan dan pendekatan.",
      en:"High external interaction — meetings, events, negotiations. Incentives directly tied to results. Autonomy in managing relationships and approaches."}
  },

  // ── NALAR ──
  "Nalar|Reka":{
    en:"The Meaning-Seeker",
    tags:["Nalar","Bakti","Watak Reka"],
    tagClasses:["rtag-teal","rtag-sage","rtag-grey"],
    overview:{
      id:"Ia adalah peneliti yang tidak pernah puas dengan jawaban yang hanya menjawab 'bagaimana'. Ia menggali lebih dalam — mencari makna, implikasi, dan dampak pada manusia di balik setiap data. Temuan ia bukan sekadar angka: ini adalah cerita yang menunggu untuk diceritakan kepada dunia.",
      en:"They're a researcher never satisfied with answers that only address 'how'. They dig deeper — seeking the meaning, implications, and human impact behind every piece of data. Their findings aren't just numbers: they're stories waiting to be told to the world."},
    kekuatan:{
      id:["Menemukan makna yang tersembunyi di balik data dan pola","Mengkomunikasikan insight kompleks dengan cara yang menyentuh orang","Menghubungkan riset dengan dampak manusia yang nyata"],
      en:["Finding hidden meaning behind data and patterns","Communicating complex insights in ways that touch people","Connecting research to real human impact"]},
    lingkungan_ideal:{
      id:"Kebebasan intelektual untuk mengikuti pertanyaan ke mana saja. Kolaborasi dengan orang-orang yang peduli pada dampak, bukan hanya publikasi. Waktu untuk refleksi mendalam.",
      en:"Intellectual freedom to follow questions wherever they lead. Collaboration with people who care about impact, not just publication. Time for deep reflection."}
  },
  "Nalar|Logika":{
    en:"The Pure Analyst",
    tags:["Nalar","Tata","Watak Logika"],
    tagClasses:["rtag-teal","rtag-plum","rtag-grey"],
    overview:{
      id:"Ia adalah arketipe peneliti klasik: seseorang yang mendedikasikan kemampuan kognitifnya untuk memahami bagaimana dunia benar-benar bekerja. Ia tidak tertarik pada kebenaran yang nyaman — ia tertarik pada kebenaran yang akurat. Di tangannya, data bukan angka: ini adalah argumen.",
      en:"They're the classic researcher archetype: someone who dedicates their cognitive abilities to understanding how the world actually works. They're not interested in comfortable truths — they're interested in accurate truths. In their hands, data isn't just numbers: it's an argument."},
    kekuatan:{
      id:["Membangun kerangka analisis yang rigorous dan defensible","Menemukan pola tersembunyi dalam dataset yang kompleks","Menghasilkan kesimpulan yang tahan terhadap kritik paling tajam sekalipun"],
      en:["Building rigorous and defensible analytical frameworks","Finding hidden patterns in complex datasets","Producing conclusions that withstand even the sharpest criticism"]},
    lingkungan_ideal:{
      id:"Akses ke data berkualitas tinggi. Waktu untuk berpikir mendalam tanpa gangguan. Lingkungan yang menghargai akurasi di atas kecepatan.",
      en:"Access to high-quality data. Time to think deeply without interruption. An environment that values accuracy over speed."}
  },
  "Nalar|Jaga":{
    en:"The Methodical Investigator",
    tags:["Nalar","Tata","Watak Jaga"],
    tagClasses:["rtag-teal","rtag-plum","rtag-grey"],
    overview:{
      id:"Ia membangun pengetahuan seperti seorang arsitek membangun gedung: dengan fondasi yang kuat, metodologi yang terstruktur, dan tidak ada satu pun bata yang diletakkan sembarangan. Datanya bersih, prosesnya terdokumentasi, hasilnya dapat direproduksi. Ia adalah penjaga kredibilitas institusi penelitian.",
      en:"They build knowledge like an architect builds a building: with a strong foundation, structured methodology, and not a single brick laid carelessly. Their data is clean, their process documented, their results reproducible. They're the guardian of research institution credibility."},
    kekuatan:{
      id:["Menjalankan penelitian dengan standar metodologi yang ketat","Memastikan data collection dan analisis bebas dari bias prosedural","Mendokumentasikan proses riset dengan presisi yang memungkinkan replikasi"],
      en:["Conducting research with rigorous methodological standards","Ensuring data collection and analysis is free from procedural bias","Documenting research processes with precision that enables replication"]},
    lingkungan_ideal:{
      id:"Protokol penelitian yang jelas. Institusi yang menghargai integritas data. Waktu yang cukup untuk melakukan pekerjaan dengan benar.",
      en:"Clear research protocols. An institution that values data integrity. Enough time to do the work properly."}
  },
  "Nalar|Guna":{
    en:"The Applied Problem-Solver",
    tags:["Nalar","Karsa","Watak Guna"],
    tagClasses:["rtag-teal","rtag-orange","rtag-grey"],
    overview:{
      id:"Ia tidak menganalisis untuk kesenangan intelektual — ia menganalisis karena ada masalah yang perlu dipecahkan. Pendekatannya selalu praktis: apa yang bisa digunakan dari informasi ini? Bagaimana kita menggerakkan ini menjadi sesuatu yang nyata? Insight tanpa aksi baginya terasa seperti pemborosan.",
      en:"They don't analyze for intellectual pleasure — they analyze because there's a problem that needs solving. Their approach is always practical: what can be used from this information? How do we turn this into something real? Insight without action feels like waste to them."},
    kekuatan:{
      id:["Mendiagnosis masalah kompleks secara cepat dan tepat","Mengimplementasikan solusi berbasis data tanpa terjebak di analisis yang berlebihan","Bergerak fleksibel antara investigasi dan eksekusi sesuai kebutuhan"],
      en:["Diagnosing complex problems quickly and accurately","Implementing data-based solutions without getting trapped in over-analysis","Moving flexibly between investigation and execution as needed"]},
    lingkungan_ideal:{
      id:"Masalah nyata yang butuh solusi nyata. Otonomi untuk bergerak dari analisis ke implementasi. Lingkungan yang menghargai hasil lebih dari proses.",
      en:"Real problems that need real solutions. Autonomy to move from analysis to implementation. An environment that values results over process."}
  },

  // ── YASA ──
  "Yasa|Reka":{
    en:"The Visionary Maker",
    tags:["Yasa","Karya","Watak Reka"],
    tagClasses:["rtag-orange","rtag-teal","rtag-grey"],
    overview:{
      id:"Ia adalah perpaduan yang tidak biasa: tertarik pada dunia yang konkret dan terampil, namun memandang setiap proyek melalui lensa makna yang lebih dalam. Ia bukan sekadar membangun — ia membangun dengan visi. Setiap hasil kerjanya mengandung pertanyaan: apakah ini benar-benar berarti sesuatu?",
      en:"They're an unusual combination: drawn to the concrete and skillful world, yet viewing every project through a lens of deeper meaning. They don't just build — they build with vision. Every piece of work they produce carries the question: does this actually mean something?"},
    kekuatan:{
      id:["Menerjemahkan visi abstrak menjadi sesuatu yang nyata dan bisa dipegang","Memberi makna pada pekerjaan teknis yang sering dianggap transaksional","Bekerja dengan penuh dedikasi pada proyek yang mereka percayai"],
      en:["Translating abstract vision into something real and tangible","Giving meaning to technical work often considered transactional","Working with full dedication on projects they believe in"]},
    lingkungan_ideal:{
      id:"Ruang kreatif dengan kebebasan interpretasi. Proyek yang punya dampak nyata pada kehidupan orang. Tim kecil dengan kepercayaan tinggi.",
      en:"A creative space with freedom of interpretation. Projects with real impact on people's lives. A small team with high trust."}
  },
  "Yasa|Logika":{
    en:"The Systems Engineer",
    tags:["Yasa","Nalar","Watak Logika"],
    tagClasses:["rtag-orange","rtag-teal","rtag-grey"],
    overview:{
      id:"Ia adalah insinyur dalam arti paling luas: seseorang yang melihat dunia sebagai sistem yang bisa dioptimasi. Ketika orang lain melihat sebuah mesin, ia melihat apa yang bisa diperbaiki. Ketika orang lain melihat sebuah proses, ia melihat di mana efisiensi bisa ditingkatkan.",
      en:"They're an engineer in the broadest sense: someone who sees the world as a system that can be optimized. When others see a machine, they see what can be improved. When others see a process, they see where efficiency can be increased."},
    kekuatan:{
      id:["Merancang sistem dan proses yang skalabel dan andal","Menemukan inefisiensi yang tidak terlihat orang lain","Mengintegrasikan pemikiran jangka panjang ke dalam keputusan teknis hari ini"],
      en:["Designing scalable and reliable systems and processes","Finding inefficiencies others can't see","Integrating long-term thinking into today's technical decisions"]},
    lingkungan_ideal:{
      id:"Masalah yang kompleks dan belum terpecahkan. Otonomi penuh dalam merancang solusi. Lingkungan yang menghargai kompetensi lebih dari senioritas.",
      en:"Complex and unsolved problems. Full autonomy in designing solutions. An environment that values competence over seniority."}
  },
  "Yasa|Jaga":{
    en:"The Master Craftsperson",
    tags:["Yasa","Tata","Watak Jaga"],
    tagClasses:["rtag-orange","rtag-plum","rtag-grey"],
    overview:{
      id:"Ia adalah tulang punggung setiap industri yang membutuhkan keandalan. Ia membangun dengan standar tinggi, konsisten, dan tidak mudah tergoda oleh shortcut. Bagi ia, kualitas bukan pilihan — ini identitas. Ketika proyek harus benar-benar berfungsi, ia adalah orang yang paling dicari.",
      en:"They're the backbone of every industry that requires reliability. They build to high standards, consistently, and aren't easily tempted by shortcuts. For them, quality isn't a choice — it's an identity. When a project absolutely must work, they're the most sought-after person."},
    kekuatan:{
      id:["Mengeksekusi dengan presisi dan konsistensi yang jarang ditemukan","Membangun standar operasi yang bisa diandalkan orang lain","Menjaga kualitas di bawah tekanan waktu sekalipun"],
      en:["Executing with precision and consistency rarely found in others","Building operational standards others can rely on","Maintaining quality even under time pressure"]},
    lingkungan_ideal:{
      id:"Standar yang jelas dan dihormati. Pekerjaan yang menghasilkan output nyata dan terukur. Tim yang menghargai keandalan di atas segalanya.",
      en:"Clear and respected standards. Work that produces real and measurable output. A team that values reliability above all."}
  },
  "Yasa|Guna":{
    en:"The Field Expert",
    tags:["Yasa","Karsa","Watak Guna"],
    tagClasses:["rtag-orange","rtag-plum","rtag-grey"],
    overview:{
      id:"Ia adalah praktisi sejati. Ia belajar dengan melakukan, bukan dengan membaca manual. Ketika ada masalah di lapangan, ia sudah bergerak sementara yang lain masih berdiskusi. Keahliannya bukan dari teori — tapi dari ribuan jam di tempat kerja yang nyata.",
      en:"They're a true practitioner. They learn by doing, not by reading manuals. When there's a problem in the field, they're already moving while others are still discussing. Their expertise doesn't come from theory — it comes from thousands of hours in real workplaces."},
    kekuatan:{
      id:["Diagnosa dan solusi masalah teknis secara cepat dan tepat","Beradaptasi dengan kondisi lapangan yang tidak terduga","Membangun kepercayaan tim melalui kompetensi langsung yang terlihat"],
      en:["Diagnosing and solving technical problems quickly and accurately","Adapting to unexpected field conditions","Building team trust through visible direct competence"]},
    lingkungan_ideal:{
      id:"Pekerjaan lapangan dengan tantangan yang bervariasi. Otonomi dalam menentukan cara terbaik menyelesaikan masalah. Lingkungan yang menghargai skill lebih dari gelar.",
      en:"Field work with varied challenges. Autonomy in determining the best way to solve problems. An environment that values skill over credentials."}
  },

  // ── TATA ──
  "Tata|Reka":{
    en:"The Purpose-Driven Organizer",
    tags:["Tata","Bakti","Watak Reka"],
    tagClasses:["rtag-plum","rtag-sage","rtag-grey"],
    overview:{
      id:"Ia membangun keteraturan bukan karena itu aturannya — tapi karena ia tahu bahwa tanpa struktur yang baik, hal-hal yang bermakna tidak bisa terjadi secara konsisten. Ia adalah orang yang memastikan visi orang lain bisa dieksekusi dengan andal, sambil menjaga nilai yang mendasarinya.",
      en:"They build order not because it's the rule — but because they know that without good structure, the things that matter can't happen consistently. They're the person who ensures others' visions can be executed reliably, while maintaining the underlying values."},
    kekuatan:{
      id:["Membangun sistem yang melayani manusia, bukan sebaliknya","Menghubungkan proses operasional dengan tujuan yang lebih besar","Menjaga integritas nilai organisasi dalam desain sistem dan prosedur"],
      en:["Building systems that serve people, not the other way around","Connecting operational processes to bigger purposes","Maintaining organizational value integrity in system and procedure design"]},
    lingkungan_ideal:{
      id:"Organisasi dengan misi yang jelas dan genuine. Kepercayaan untuk mendesain sistem secara mandiri. Tim yang menghargai keteraturan yang bermakna.",
      en:"An organization with a clear and genuine mission. Trust to design systems independently. A team that values meaningful order."}
  },
  "Tata|Logika":{
    en:"The Systems Innovator",
    tags:["Tata","Nalar","Watak Logika"],
    tagClasses:["rtag-plum","rtag-teal","rtag-grey"],
    overview:{
      id:"Ia tidak hanya menjalankan sistem — ia mendesain ulang yang sudah ada menjadi lebih baik. Ketidakefisienan bukan hanya mengganggu ia secara estetika — ini adalah masalah yang harus dipecahkan. Ia adalah konsultan yang dibutuhkan organisasi sebelum mereka tahu mereka membutuhkannya.",
      en:"They don't just run systems — they redesign existing ones to make them better. Inefficiency doesn't just bother them aesthetically — it's a problem that must be solved. They're the consultant organizations need before they know they need one."},
    kekuatan:{
      id:["Mendiagnosis inefisiensi sistemik dengan cepat dan akurat","Merancang ulang proses yang lebih efisien, skalabel, dan andal","Mengimplementasikan transformasi sistem dengan resistansi perubahan minimal"],
      en:["Diagnosing systemic inefficiencies quickly and accurately","Redesigning more efficient, scalable, and reliable processes","Implementing system transformations with minimal change resistance"]},
    lingkungan_ideal:{
      id:"Organisasi dengan masalah nyata yang butuh solusi sistemik. Wewenang untuk mengubah, bukan hanya merekomendasikan. Lingkungan yang menghargai perbaikan lebih dari kepatuhan.",
      en:"An organization with real problems needing systemic solutions. Authority to change, not just recommend. An environment that values improvement over compliance."}
  },
  "Tata|Jaga":{
    en:"The Reliable Foundation",
    tags:["Tata","Yasa","Watak Jaga"],
    tagClasses:["rtag-plum","rtag-orange","rtag-grey"],
    overview:{
      id:"Ia adalah arketipe paling murni dari keandalan. Ia membuat organisasi bisa berfungsi hari demi hari, tanpa drama, tanpa kesalahan, tanpa kejutan. Kekuatannya tidak terlihat saat digunakan dengan baik — baru terlihat saat tidak ada. Dan ketika tidak ada, semuanya mulai goyah.",
      en:"They're the purest archetype of reliability. They make organizations function day after day, without drama, without mistakes, without surprises. Their strength isn't visible when it's working well — it only becomes visible when it's absent. And when it's absent, everything starts to wobble."},
    kekuatan:{
      id:["Menjaga sistem berjalan dengan presisi dan konsistensi yang tidak tertandingi","Membangun dan mendokumentasikan proses yang bisa diikuti siapapun","Menjadi titik kepercayaan organisasi untuk urusan compliance dan akurasi"],
      en:["Keeping systems running with unmatched precision and consistency","Building and documenting processes anyone can follow","Becoming the organization's trust point for compliance and accuracy matters"]},
    lingkungan_ideal:{
      id:"Peran yang jelas dengan ekspektasi yang konsisten. Pekerjaan yang menghasilkan output yang terukur. Lingkungan yang menghargai akurasi dan keandalan.",
      en:"A clear role with consistent expectations. Work that produces measurable output. An environment that values accuracy and reliability."}
  },
  "Tata|Guna":{
    en:"The Pragmatic Executor",
    tags:["Tata","Karsa","Watak Guna"],
    tagClasses:["rtag-plum","rtag-orange","rtag-grey"],
    overview:{
      id:"Ia menghargai keteraturan bukan sebagai tujuan, tapi sebagai alat. Ia adalah implementer yang paling efisien: ia tahu aturannya, ia tahu shortcut-nya, dan ia tahu mana yang perlu dijaga dan mana yang bisa difleksibel. Hasilnya selalu tepat sasaran — dengan cara paling efisien yang bisa ditemukan.",
      en:"They value order not as a goal, but as a tool. They're the most efficient implementer: they know the rules, they know the shortcuts, and they know what needs to be maintained and what can be flexible. The result is always on target — by the most efficient means they can find."},
    kekuatan:{
      id:["Mengeksekusi tugas administratif dan operasional dengan cepat dan akurat","Menemukan cara paling efisien untuk menyelesaikan proses yang kompleks","Beradaptasi dengan perubahan prosedur tanpa kehilangan akurasi"],
      en:["Executing administrative and operational tasks quickly and accurately","Finding the most efficient way to complete complex processes","Adapting to procedural changes without losing accuracy"]},
    lingkungan_ideal:{
      id:"Lingkungan dengan struktur yang jelas tapi cukup fleksibel untuk improvisasi taktis. Output yang terlihat dan terukur. Otonomi dalam menentukan cara terbaik mencapai target.",
      en:"An environment with clear structure but flexible enough for tactical improvisation. Visible and measurable output. Autonomy in determining the best way to reach targets."}
  },
};

// Kelompok color mapping for graph
const KELOMPOK_COLORS = {
  Yasa:  { bar:"#D4875A", bg:"#FEF0E8" },
  Nalar: { bar:"#5A8DB0", bg:"#E8F0FE" },
  Karya: { bar:"#E07A3A", bg:"#FEF2EA" },
  Bakti: { bar:"#5FAE82", bg:"#EAF5EE" },
  Karsa: { bar:"#8B7EC8", bg:"#F0EDF9" },
  Tata:  { bar:"#8A8A6A", bg:"#F5F5E8" },
};

const KELOMPOK_LABELS = {
  Yasa:  { id:"Yasa · Membangun",    en:"Yasa · Building" },
  Nalar: { id:"Nalar · Meneliti",    en:"Nalar · Investigating" },
  Karya: { id:"Karya · Mencipta",    en:"Karya · Creating" },
  Bakti: { id:"Bakti · Melayani",    en:"Bakti · Serving" },
  Karsa: { id:"Karsa · Memimpin",    en:"Karsa · Leading" },
  Tata:  { id:"Tata · Menata",       en:"Tata · Organizing" },
};

// ─────────────────────────────────────────────────────────────
// PAGE BUILDER
// ─────────────────────────────────────────────────────────────
function buildPages() {
  pages = [];
  for (let i=0;i<MBTI_Q.length;i+=4)
    pages.push({sec:1,qs:MBTI_Q.slice(i,i+4).map(q=>q.id)});
  for (let i=0;i<PICK2_Q.length;i+=3)
    pages.push({sec:2,qs:PICK2_Q.slice(i,i+3).map(q=>q.id)});
  for (let i=0;i<LIKERT_Q.length;i+=3)
    pages.push({sec:3,qs:LIKERT_Q.slice(i,i+3).map(q=>q.id)});
  pages.push({sec:'info',qs:[]});
}

function qsBefore(pageIdx) {
  let n=0;
  for (let i=0;i<pageIdx;i++) n+=pages[i].qs.length;
  return n;
}

// ─────────────────────────────────────────────────────────────
// RENDER
// ─────────────────────────────────────────────────────────────
const SEC_LABELS = {
  1:{id:'Bagian 1 · Cara Kamu Bergerak',en:'Part 1 · How You Operate'},
  2:{id:'Bagian 2 · Apa yang Menarik Bagimu',en:'Part 2 · What Draws You'},
  3:{id:'Bagian 3 · Seberapa Kuat Ketertarikanmu',en:'Part 3 · Strength of Interest'},
};

function renderPage(idx) {
  const mount=document.getElementById('q-mount');
  mount.innerHTML='';
  const pg=pages[idx];
  if (pg.sec==='info') { renderUserInfo(mount); return; }

  const wrap=document.createElement('div');
  wrap.className='q-container';
  const qsBef=qsBefore(idx);

  document.getElementById('prog-section-label').textContent=
    lang==='id'?SEC_LABELS[pg.sec].id:SEC_LABELS[pg.sec].en;

  pg.qs.forEach((qid,qi)=>{
    const q=ALL_Q.find(x=>x.id===qid);
    const qnum=qsBef+qi+1;
    const block=document.createElement('div');
    block.className='q-block';
    if      (q.sec===1) block.innerHTML=buildMBTI(q,qnum);
    else if (q.sec===2) block.innerHTML=buildPick2(q,qnum);
    else                block.innerHTML=buildLikert(q,qnum);
    wrap.appendChild(block);
  });

  mount.appendChild(wrap);
  attachListeners(pg);
  restoreAnswers(pg);
  window.scrollTo(0,0);
  updateProgress(idx);
  updateNavBtns(idx);
}

function buildMBTI(q,num) {
  const qt=lang==='id'?q.id_q:q.en_q;
  const at=lang==='id'?q.id_a:q.en_a;
  const bt=lang==='id'?q.id_b:q.en_b;
  return `<span class="q-num-label">${num}</span>
<p class="q-text">${qt}</p>
<div class="mbti-opts">
  <div class="mbti-opt">
    <input type="radio" name="${q.id}" id="${q.id}_a" value="${q.a}">
    <label for="${q.id}_a"><span class="opt-letter">A</span>${at}</label>
  </div>
  <div class="mbti-opt">
    <input type="radio" name="${q.id}" id="${q.id}_b" value="${q.b}">
    <label for="${q.id}_b"><span class="opt-letter">B</span>${bt}</label>
  </div>
</div>`;
}

function buildPick2(q,num) {
  const qt=lang==='id'?q.id_q:q.en_q;
  const cnt=pick2Ans[q.id]?pick2Ans[q.id].size:0;
  const cntTxt=lang==='id'?`${cnt} / 2 dipilih`:`${cnt} / 2 selected`;
  const opts=q.opts.map(o=>{
    const lbl=lang==='id'?o.id:o.en;
    const chk=(pick2Ans[q.id]&&pick2Ans[q.id].has(o.t))?'checked':'';
    return `<div class="pick2-opt">
  <input type="checkbox" id="${q.id}_${o.t}" data-qid="${q.id}" data-type="${o.t}" ${chk}>
  <label for="${q.id}_${o.t}"><span class="p2-check"></span>${lbl}</label>
</div>`;
  }).join('');
  return `<span class="q-num-label">${num}</span>
<div class="pick2-header">
  <p class="q-text">${qt}</p>
  <span class="pick2-counter${cnt===2?' done':''}" id="p2c_${q.id}">${cntTxt}</span>
</div>
<div class="pick2-opts">${opts}</div>`;
}

function buildLikert(q,num) {
  const st=lang==='id'?q.id_s:q.en_s;
  const cur=likertAns[q.id]?.raw;
  const btns=[1,2,3,4,5].map(v=>{
    const mid=v===3;
    const sel=cur===v?'sel':'';
    const click=mid?'':` onclick="recordLikert('${q.id}','${q.t}',${v},this)"`;
    const tab=mid?' tabindex="-1"':'';
    return `<button class="lk-btn ${sel}" data-qid="${q.id}" data-val="${v}"${click}${tab}></button>`;
  }).join('');
  const ag=lang==='id'?'Setuju':'Agree';
  const dg=lang==='id'?'Tidak Setuju':'Disagree';
  return `<span class="q-num-label">${num}</span>
<p class="q-text">${st}</p>
<div class="likert-scale">
  <div class="likert-circles">${btns}</div>
  <div class="likert-labels">
    <span class="ag">${ag}</span><span>·</span><span class="dg">${dg}</span>
  </div>
</div>`;
}

function renderUserInfo(mount) {
  document.getElementById('prog-section-label').textContent='';
  document.getElementById('prog-pct').textContent='100%';
  document.getElementById('prog-fill').style.width='100%';
  document.getElementById('btn-back').disabled=false;
  document.getElementById('btn-fwd-lbl').textContent=lang==='id'?'Kirim':'Submit';
  const L=lang==='id';
  mount.innerHTML=`<div class="userinfo-wrap">
  <h2 class="userinfo-h">${L?'Hampir selesai.':'Almost done.'}</h2>
  <p class="userinfo-sub">${L?'Isi data berikut untuk menyimpan hasil assessment-mu.':'Fill in the details below to save your results.'}</p>
  <div class="field-group">
    <label class="field-label">${L?'Nama Lengkap':'Full Name'}</label>
    <input class="field-input" type="text" id="f-name" placeholder="${L?'Nama lengkap kamu':'Your full name'}" autocomplete="name">
  </div>
  <div class="field-group">
    <label class="field-label">Email</label>
    <input class="field-input" type="email" id="f-email" placeholder="email@kamu.com" autocomplete="email">
  </div>
  <div class="field-group">
    <label class="field-label">${L?'Perusahaan / Institusi (opsional)':'Company / Institution (optional)'}</label>
    <input class="field-input" type="text" id="f-company" placeholder="—">
  </div>
  <button class="btn-submit" id="btn-submit-form" onclick="submitAssessment()">${L?'Kirim Hasil Assessment':'Submit Assessment'}</button>
  <p class="submit-note">${L?'Hasil akan dikirim ke email kamu oleh konsultan kami.':'Results will be sent to your email by our consultant.'}</p>
</div>`;
}

// ─────────────────────────────────────────────────────────────
// LISTENERS
// ─────────────────────────────────────────────────────────────
function attachListeners(pg) {
  if (pg.sec===1) {
    document.querySelectorAll('.mbti-opt input[type="radio"]').forEach(inp=>{
      inp.addEventListener('change',()=>{ mbtiAns[inp.name]=inp.value; });
    });
  }
  if (pg.sec===2) {
    document.querySelectorAll('.pick2-opt input[type="checkbox"]').forEach(cb=>{
      cb.addEventListener('change',function(){
        const qid=this.dataset.qid,type=this.dataset.type;
        if (!pick2Ans[qid]) pick2Ans[qid]=new Set();
        if (this.checked){
          if (pick2Ans[qid].size>=2){this.checked=false;showToast(lang==='id'?'Pilih maksimal 2':'Choose a maximum of 2');return;}
          pick2Ans[qid].add(type);
        } else pick2Ans[qid].delete(type);
        updateP2Counter(qid);
      });
    });
  }
}

function updateP2Counter(qid) {
  const cnt=pick2Ans[qid]?pick2Ans[qid].size:0;
  const el=document.getElementById('p2c_'+qid);
  if (!el) return;
  el.textContent=lang==='id'?`${cnt} / 2 dipilih`:`${cnt} / 2 selected`;
  el.className='pick2-counter'+(cnt===2?' done':'');
}

function recordLikert(qid,type,val,btn) {
  likertAns[qid]={type,raw:val};
  btn.closest('.likert-circles').querySelectorAll('.lk-btn').forEach(b=>b.classList.remove('sel'));
  btn.classList.add('sel');
}

function restoreAnswers(pg) {
  if (pg.sec===1) {
    pg.qs.forEach(qid=>{
      if (!mbtiAns[qid]) return;
      const q=ALL_Q.find(x=>x.id===qid);
      const inp=document.getElementById(qid+'_'+(mbtiAns[qid]===q.a?'a':'b'));
      if (inp) inp.checked=true;
    });
  }
  if (pg.sec===3) {
    pg.qs.forEach(qid=>{
      if (!likertAns[qid]) return;
      const btn=document.querySelector(`.lk-btn[data-qid="${qid}"][data-val="${likertAns[qid].raw}"]`);
      if (btn) btn.classList.add('sel');
    });
  }
}

// ─────────────────────────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────────────────────────
function updateProgress(idx) {
  const qEnd=qsBefore(idx)+pages[idx].qs.length;
  const pct=Math.round((qEnd/TOTAL_Q)*100);
  document.getElementById('prog-fill').style.width=pct+'%';
  document.getElementById('prog-pct').textContent=pct+'%';
}

function updateNavBtns(idx) {
  document.getElementById('btn-back').disabled=(idx===0);
  const isLast=idx===pages.length-1;
  document.getElementById('btn-fwd-lbl').textContent=
    lang==='id'?(isLast?'Kirim':'Lanjut'):(isLast?'Submit':'Next');
}

function nextPage() {
  if (!validatePage()) return;
  if (currentPage<pages.length-1){currentPage++;renderPage(currentPage);}
}

function prevPage() {
  if (currentPage>0){currentPage--;renderPage(currentPage);}
}

function validatePage() {
  const pg=pages[currentPage];
  if (pg.sec==='info') return true;
  if (pg.sec===1) {
    for (const qid of pg.qs) {
      if (!mbtiAns[qid]){showToast(lang==='id'?'Jawab semua pertanyaan terlebih dahulu':'Please answer all questions first');return false;}
    }
  }
  if (pg.sec===2) {
    for (const qid of pg.qs) {
      if (!pick2Ans[qid]||pick2Ans[qid].size!==2){showToast(lang==='id'?'Pilih tepat 2 untuk setiap soal':'Pick exactly 2 for each question');return false;}
    }
  }
  if (pg.sec===3) {
    for (const qid of pg.qs) {
      if (!likertAns[qid]){showToast(lang==='id'?'Nilai semua pernyataan terlebih dahulu':'Please rate all statements first');return false;}
    }
  }
  return true;
}

// ─────────────────────────────────────────────────────────────
// SCORING
// ─────────────────────────────────────────────────────────────
function computeScore() {
  // MBTI
  const sc={E:0,I:0,N:0,S:0,T:0,F:0,J:0,P:0};
  Object.values(mbtiAns).forEach(v=>sc[v]++);
  const dimPct=(a,b)=>Math.round((Math.max(a,b)/((a+b)||1))*100);
  const dimDir=(a,b)=>a>=b?'left':'right';
  const mbtiType=(sc.E>=sc.I?'E':'I')+(sc.N>=sc.S?'N':'S')+(sc.T>=sc.F?'T':'F')+(sc.J>=sc.P?'J':'P');
  const WATAK_MAP={INFJ:'Reka',INFP:'Reka',ENFJ:'Reka',ENFP:'Reka',INTJ:'Logika',INTP:'Logika',ENTJ:'Logika',ENTP:'Logika',ISTJ:'Jaga',ISFJ:'Jaga',ESTJ:'Jaga',ESFJ:'Jaga',ISTP:'Guna',ISFP:'Guna',ESTP:'Guna',ESFP:'Guna'};
  const watak=WATAK_MAP[mbtiType]||'Reka';
  const dims={
    arus:   {left:'Arus Luar',  right:'Arus Dalam',    dir:dimDir(sc.E,sc.I), pct:dimPct(sc.E,sc.I)},
    pandang:{left:'Pandang Luas',right:'Pandang Nyata',dir:dimDir(sc.N,sc.S), pct:dimPct(sc.N,sc.S)},
    timbang:{left:'Timbang Logika',right:'Timbang Rasa',dir:dimDir(sc.T,sc.F), pct:dimPct(sc.T,sc.F)},
    irama:  {left:'Irama Pasti',right:'Irama Bebas',   dir:dimDir(sc.J,sc.P), pct:dimPct(sc.J,sc.P)},
  };

  // Pick-2
  const p2={Yasa:0,Nalar:0,Karya:0,Bakti:0,Karsa:0,Tata:0};
  Object.values(pick2Ans).forEach(s=>[...s].forEach(t=>p2[t]++));
  const p2tot=Object.values(p2).reduce((a,b)=>a+b,0)||1;
  const p2pct={};Object.keys(p2).forEach(k=>p2pct[k]=(p2[k]/p2tot)*100);

  // Likert: interest = ((5-raw)/4)*100
  const lkSum={Yasa:0,Nalar:0,Karya:0,Bakti:0,Karsa:0,Tata:0};
  const lkCnt={Yasa:0,Nalar:0,Karya:0,Bakti:0,Karsa:0,Tata:0};
  Object.values(likertAns).forEach(({type,raw})=>{lkSum[type]+=((5-raw)/4)*100;lkCnt[type]++;});
  const lkPct={};Object.keys(lkSum).forEach(k=>lkPct[k]=lkCnt[k]?lkSum[k]/lkCnt[k]:0);

  // Combine: Pick-2 × 60% + Likert × 40%
  const combined={};Object.keys(p2pct).forEach(k=>combined[k]=p2pct[k]*0.6+lkPct[k]*0.4);
  const ctot=Object.values(combined).reduce((a,b)=>a+b,0)||1;
  const normPct={};Object.keys(combined).forEach(k=>normPct[k]=Math.round((combined[k]/ctot)*100*10)/10);
  const sorted=Object.entries(normPct).sort((a,b)=>b[1]-a[1]);

  return {mbtiType,watak,dims,normPct,sorted};
}

// ─────────────────────────────────────────────────────────────
// SUBMIT
// ─────────────────────────────────────────────────────────────
async function submitAssessment() {
  const name   =document.getElementById('f-name')?.value.trim();
  const email  =document.getElementById('f-email')?.value.trim();
  const company=document.getElementById('f-company')?.value.trim()||'';
  const batch  = URL_BATCH; // dari URL parameter ?batch=

  if (!name||!email){showToast(lang==='id'?'Nama dan email wajib diisi':'Name and email are required');return;}

  const btn=document.getElementById('btn-submit-form');
  if (btn){btn.disabled=true;btn.textContent=lang==='id'?'Mengirim...':'Submitting...';}

  const score=computeScore();
  const payload={
    participant_name:name, participant_email:email,
    participant_company:company, batch_id:batch,
    mbti_answers:  Object.entries(mbtiAns).map(([q_id,score_type])=>({q_id,score_type})),
    riasec_pick2:  Object.entries(pick2Ans).map(([q_id,s])=>({q_id,chosen_types:[...s]})),
    riasec_likert: Object.entries(likertAns).map(([q_id,{type,raw}])=>({q_id,type,score:raw})),
  };

  let serverResult=null;
  try {
    const res=await fetch(APPS_SCRIPT_URL,{method:'POST',body:JSON.stringify(payload)});
    const data=await res.json();
    if (data.status==='ok') serverResult=data.data;
  } catch(e){console.warn('Server unavailable, showing local result');}

  showResult(score,serverResult);
}

// ─────────────────────────────────────────────────────────────
// SHOW RESULT — v2
// Renders: best fit paraga, good fit kelompok, kelompok graph,
//          narrative overview, kekuatan, lingkungan ideal,
//          MBTI dimension bars, blurred sections
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// DIM ZONE HELPERS
// Threshold berbeda untuk dimensi 8-soal vs 6-soal:
// 8 soal (N/S, T/F, J/P — pembentuk Watak):
//   4/8=50% Samar | 5/8=63% Ringan | 6/8=75% Moderat | 7/8=88% Kuat | 8/8=100% Kuat
// 6 soal (E/I — Arus, tidak menentukan Watak):
//   3/6=50% Samar | 4/6=67% Moderat | 5/6=83% Moderat | 6/6=100% Kuat
// ─────────────────────────────────────────────────────────────
function getDimZone(pct, L, is8) {
  if (is8) {
    if (pct >= 88) return L ? 'Kuat'    : 'Strong';
    if (pct >= 75) return L ? 'Moderat' : 'Moderate';
    if (pct >= 63) return L ? 'Ringan'  : 'Slight';
    return L ? 'Samar' : 'Unclear';
  } else {
    if (pct >= 84) return L ? 'Kuat'    : 'Strong';
    if (pct >= 67) return L ? 'Moderat' : 'Moderate';
    if (pct >  50) return L ? 'Ringan'  : 'Slight';
    return L ? 'Samar' : 'Unclear';
  }
}

function getDimBadgeCls(pct, is8) {
  if (is8) {
    if (pct >= 88) return 'strong';
    if (pct >= 75) return 'moderate';
    if (pct >= 63) return 'slight';
    return 'unclear';
  } else {
    if (pct >= 84) return 'strong';
    if (pct >= 67) return 'moderate';
    if (pct >  50) return 'slight';
    return 'unclear';
  }
}

function buildDim2HTML(d, color, title, L, is8) {
  var halfFill = (d.pct - 50) * 2;
  var zone     = getDimZone(d.pct, L, is8);
  var domLabel = d.dir === 'left' ? d.left : d.right;
  var badge    = d.pct === 50 ? zone : zone + ' · ' + domLabel;
  var cls      = getDimBadgeCls(d.pct, is8);
  return '<div class="dim2-wrap">'
    + '<div class="dim2-title">' + title + '</div>'
    + '<div class="dim2-bar-row">'
    +   '<div class="dim2-side dim2-left" style="font-weight:' + (d.dir==='left'?'600':'400') + ';color:' + (d.dir==='left'?'var(--ink)':'var(--mid)') + '">' + d.left + '</div>'
    +   '<div class="dim2-track">'
    +     '<div class="dim2-center"></div>'
    +     '<div class="dim2-fill-left"  style="width:' + (d.dir==='left' ?halfFill/2:0) + '%;background:' + color + '"></div>'
    +     '<div class="dim2-fill-right" style="width:' + (d.dir==='right'?halfFill/2:0) + '%;background:' + color + '"></div>'
    +   '</div>'
    +   '<div class="dim2-side dim2-right" style="font-weight:' + (d.dir==='right'?'600':'400') + ';color:' + (d.dir==='right'?'var(--ink)':'var(--mid)') + '">' + d.right + '</div>'
    + '</div>'
    + '<div class="dim2-badge-row">'
    +   '<span class="dim2-badge dim2-badge-' + cls + '">' + badge + '</span>'
    + '</div>'
    + '</div>';
}

function renderDimBars(dims, L, containerId) {
  var el = document.getElementById(containerId);
  if (!el) return;
  var COLORS    = {arus:'#C17A3C',pandang:'#3A6B9E',timbang:'#4A7C6B',irama:'#7B5A9E'};
  var TITLES_ID = {arus:'Arus',pandang:'Pandang',timbang:'Timbang',irama:'Irama'};
  var TITLES_EN = {arus:'Energy',pandang:'Perception',timbang:'Judgment',irama:'Lifestyle'};
  var IS8_MAP   = {arus:false, pandang:true, timbang:true, irama:true};
  var keys      = ['arus','pandang','timbang','irama'];
  el.innerHTML  = keys.map(function(k) {
    return buildDim2HTML(dims[k], COLORS[k], L?TITLES_ID[k]:TITLES_EN[k], L, IS8_MAP[k]);
  }).join('');
}

function showResult(score,serverResult) {
  const kelompok1 = score.sorted[0][0]; // Best Fit kelompok
  const kelompok2 = score.sorted[1][0]; // Good Fit kelompok
  const pct1      = score.sorted[0][1];
  const pct2      = score.sorted[1][1];
  const watak     = score.watak;
  const key       = `${kelompok1}|${watak}`;

  const p = PARAGA[key] || {
    en: kelompok1+' '+watak,
    tags:[kelompok1,watak],
    tagClasses:['rtag-orange','rtag-grey'],
    overview:{id:'Profil dalam pengembangan.',en:'Profile under development.'},
    kekuatan:{id:['—','—','—'],en:['—','—','—']},
    lingkungan_ideal:{id:'—',en:'—'},
  };

  const L = lang==='id';

  // ── Paraga name & sub: nama Lakon besar, EN subtitle kecil ──
  document.getElementById('r-name').textContent = `${kelompok1} ${watak}`;
  document.getElementById('r-sub').textContent  = p.en;

  // ── Tags: [Kelompok warna] [Watak abu] [Nuansa outline] ──
  const KEL_TAG_CLASS = {
    Yasa:'rtag-yasa', Nalar:'rtag-nalar', Karya:'rtag-amber',
    Bakti:'rtag-sage', Karsa:'rtag-karsa', Tata:'rtag-tata'
  };
  const tagsEl = document.getElementById('r-tags');
  tagsEl.innerHTML = [
    `<span class="rtag ${KEL_TAG_CLASS[kelompok1]||'rtag-grey'}">${kelompok1}</span>`,
    `<span class="rtag rtag-grey">Watak ${watak}</span>`,
    `<span class="rtag rtag-nuance">${L?'Nuansa':'Nuance'} ${kelompok2}</span>`,
  ].join('');

  // ── Warning kalau dimensi Watak Samar ──
  const watakDims = (watak==='Reka'||watak==='Logika')
    ? [score.dims.pandang, score.dims.timbang]
    : [score.dims.pandang, score.dims.irama];
  const samarWatak = watakDims.filter(function(d){return d.pct <= 50;});
  const warningEl = document.getElementById('r-watak-warning');
  if (warningEl) {
    if (samarWatak.length > 0) {
      var samarNames = samarWatak.map(function(d){
        return d.left.split(' ')[0];
      }).join(' dan ');
      warningEl.innerHTML = L
        ? '<div class="watak-warning"><span class="watak-warning-icon">⚡</span>'
          + '<span>Dimensi <strong>' + samarNames + '</strong> berada di titik tengah. '
          + 'Watak yang ditampilkan adalah perkiraan terbaik — '
          + '<a href="https://wa.me/6282126373601" target="_blank" class="watak-warning-link">sesi konsultasi via WhatsApp</a> dapat membantu mengklarifikasi.</span></div>'
        : '<div class="watak-warning"><span class="watak-warning-icon">⚡</span>'
          + '<span>Your <strong>' + samarNames + '</strong> dimension is at the midpoint. '
          + 'The Watak shown is our best estimate — '
          + '<a href="https://wa.me/6282126373601" target="_blank" class="watak-warning-link">a consultation session via WhatsApp</a> can help clarify.</span></div>';
      warningEl.style.display = 'block';
    } else {
      warningEl.style.display = 'none';
    }
  }

  // ── Good Fit badge ──
  const goodFitEl = document.getElementById('r-good-fit');
  if (goodFitEl) {
    const gfLbl = L ? 'Nuansa Kelompok' : 'Group Nuance';
    const gfDesc = L
      ? `${kelompok2} (${pct2}%) memberikan nuansa tambahan pada profil ini`
      : `${kelompok2} (${pct2}%) adds an additional nuance to this profile`;
    goodFitEl.innerHTML = `
      <div class="good-fit-badge">
        <span class="good-fit-label">${gfLbl}</span>
        <span class="good-fit-kelompok">${kelompok2}</span>
      </div>
      <p class="good-fit-desc">${gfDesc}</p>`;
  }

  // ── Kelompok graph ──
  const graphEl = document.getElementById('r-kelompok-graph');
  if (graphEl) {
    const graphTitle = L ? 'Profil Minat Kelompok' : 'Group Interest Profile';
    const sortedAll  = score.sorted; // already sorted desc
    graphEl.innerHTML = `
      <div class="graph-title">${graphTitle}</div>
      <div class="graph-bars">
        ${sortedAll.map(([k,pct],i)=>{
          const col = KELOMPOK_COLORS[k] || {bar:'#888',bg:'#f5f5f5'};
          const lbl = KELOMPOK_LABELS[k] ? (L?KELOMPOK_LABELS[k].id:KELOMPOK_LABELS[k].en) : k;
          const badge = i===0 ? `<span class="graph-badge best">${L?'Best Fit':'Best Fit'}</span>`
                      : i===1 ? `<span class="graph-badge good">${L?'Good Fit':'Good Fit'}</span>` : '';
          return `
          <div class="graph-row">
            <div class="graph-label">${lbl} ${badge}</div>
            <div class="graph-track">
              <div class="graph-fill" style="width:${pct}%;background:${col.bar}"></div>
            </div>
            <div class="graph-pct" style="color:${col.bar}">${pct}%</div>
          </div>`;
        }).join('')}
      </div>`;
  }

  // ── Narrative overview ──
  const overviewEl = document.getElementById('r-overview');
  if (overviewEl) overviewEl.textContent = L ? p.overview.id : p.overview.en;

  // ── Kekuatan ──
  const kekEl = document.getElementById('r-kekuatan');
  if (kekEl) {
    const kekList = L ? p.kekuatan.id : p.kekuatan.en;
    kekEl.innerHTML = kekList.map(k=>`<li class="strength-item">${k}</li>`).join('');
  }

  // ── Lingkungan ideal ──
  const lingkEl = document.getElementById('r-lingkungan');
  if (lingkEl) lingkEl.textContent = L ? p.lingkungan_ideal.id : p.lingkungan_ideal.en;

  // ── Nuansa Watak: 2 dimensi MBTI di luar pembentuk Watak ──
  // Reka/Logika (NF/NT) → Watak dari Pandang+Timbang → Nuansa = Arus+Irama
  // Jaga/Guna   (SJ/SP) → Watak dari Pandang+Irama   → Nuansa = Arus+Timbang
  // ── Contoh Peran Ideal dalam Organisasi ──
  const peranEl = document.getElementById('r-peran-ideal');
  if (peranEl) {
    const pd = PERAN_IDEAL[key];
    if (pd) {
      var FIT_LABEL = {ideal:{id:'Ideal',cls:'peran-ideal'},cocok:{id:'Cocok',cls:'peran-cocok'},bisa:{id:'Bisa',cls:'peran-bisa'}};
      var rows = pd.posisi.map(function(p) {
        var f = FIT_LABEL[p.fit] || FIT_LABEL.bisa;
        return '<tr class="peran-row">'
          + '<td class="peran-td-fit"><span class="peran-dot ' + f.cls + '"></span><span class="peran-fit-lbl ' + f.cls + '">' + f.id + '</span></td>'
          + '<td class="peran-td-posisi"><div class="peran-nama">' + p.nama + '</div><span class="peran-level">' + p.level + '</span></td>'
          + '<td class="peran-td-desc">' + p.peran + '</td>'
          + '</tr>';
      }).join('');
      peranEl.innerHTML = '<p class="result-text peran-naratif">' + pd.naratif + '</p>'
        + '<div class="peran-legend">'
        +   '<span class="legend-item"><span class="peran-dot peran-ideal"></span>Ideal</span>'
        +   '<span class="legend-item"><span class="peran-dot peran-cocok"></span>Cocok</span>'
        +   '<span class="legend-item"><span class="peran-dot peran-bisa"></span>Bisa</span>'
        + '</div>'
        + '<div class="peran-sub-label">' + (L ? 'Contoh Posisi dan Peran' : 'Example Positions & Roles') + '</div>'
        + '<div class="peran-table-wrap"><table class="peran-table"><thead><tr>'
        +   '<th class="peran-th-fit"></th>'
        +   '<th class="peran-th-posisi">' + (L ? 'Posisi' : 'Position') + '</th>'
        +   '<th class="peran-th-desc">' + (L ? 'Perannya di sini' : 'Their role here') + '</th>'
        + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
    }
  }

  // ── Nuansa Watak — 2 dimensi di luar Watak, pakai bar dua arah ──
  const nwEl = document.getElementById('r-nuansa-watak');
  if (nwEl) {
    const NW_KEYS = (watak==='Reka'||watak==='Logika') ? ['arus','irama'] : ['arus','timbang'];
    const NW_COLORS  = {arus:'#C17A3C',timbang:'#4A7C6B',irama:'#7B5A9E'};
    const NW_TITLE_ID = {arus:'Arus Energi',timbang:'Cara Menimbang',irama:'Irama Kerja'};
    const NW_TITLE_EN = {arus:'Energy Direction',timbang:'Decision Style',irama:'Work Rhythm'};
    const NW_DESC_ID  = {arus:'Dari mana energimu bertumbuh — keramaian atau kesendirian.',timbang:'Bagaimana keputusanmu dibuat — lewat logika atau perasaan.',irama:'Bagaimana kamu menjalani hari — dengan rencana atau spontanitas.'};
    const NW_DESC_EN  = {arus:'Where your energy comes from — people or solitude.',timbang:'How you make decisions — through logic or feeling.',irama:'How you approach your day — with plans or spontaneity.'};
    nwEl.innerHTML = NW_KEYS.map(function(k) {
      var d = score.dims[k];
      var title = L ? NW_TITLE_ID[k] : NW_TITLE_EN[k];
      var desc  = L ? NW_DESC_ID[k]  : NW_DESC_EN[k];
      var nwIs8 = (k !== 'arus');
      return buildDim2HTML(d, NW_COLORS[k], title, L, nwIs8)
        + '<div class="dim2-desc">' + desc + '</div>';
    }).join('');
  }

  // ── MBTI dimension bars — dua arah ──
  renderDimBars(score.dims, L, 'dim-bars');

  showScreen('screen-result');
}

// ─────────────────────────────────────────────────────────────
// LANGUAGE
// ─────────────────────────────────────────────────────────────
function setLang(l) {
  lang=l;
  document.querySelectorAll('.lang-btn').forEach(b=>{
    b.classList.toggle('on',b.textContent.trim().toLowerCase()===l);
  });
  document.querySelectorAll(`[data-${l}]`).forEach(el=>{
    if (el.tagName==='INPUT') return;
    const v=el.getAttribute(`data-${l}`);
    if (v!==null) el.textContent=v;
  });
  const qScreen=document.getElementById('screen-assessment');
  if (qScreen&&qScreen.classList.contains('active')&&pages.length&&pages[currentPage].sec!=='info')
    renderPage(currentPage);
}

// ─────────────────────────────────────────────────────────────
// SCREEN NAV + UTILS
// ─────────────────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0,0);
}

function goToAssessment() {
  buildPages();
  currentPage=0;
  showScreen('screen-assessment');
  renderPage(0);
}

function showToast(msg) {
  const t=document.getElementById('toast');
  t.textContent=msg;t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2500);
}

document.addEventListener('keydown',e=>{
  const qs=document.getElementById('screen-assessment');
  if (!qs||!qs.classList.contains('active')) return;
  if (!pages.length||currentPage>=pages.length) return;
  if (pages[currentPage].sec==='info') return;
  if (e.key==='ArrowRight') nextPage();
  if (e.key==='ArrowLeft')  prevPage();
});
