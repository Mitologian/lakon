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
const TOTAL_Q = ALL_Q.length; // 90

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
      en:"A collaborative environment that values originality and gives space for deep creative process. A real audience or community where their work can have direct impact. A small team with high trust."},
    dalam_memimpin:{
      id:['Karya Reka memimpin dengan visi kreatif dan kemampuan membuat orang merasakan bahwa pekerjaan mereka punya makna yang lebih besar. Tim kreatif di bawah mereka tidak hanya mengeksekusi — mereka merasa menjadi bagian dari sesuatu yang penting. Sebagai pemimpin, keputusan mereka hampir selalu berakar pada nilai dan apa yang terasa benar secara moral — bukan hanya apa yang paling efisien. Mereka menghargai tim yang mau saling mendukung dan percaya bahwa bekerja bersama dalam harmoni adalah fondasi dari hasil yang bermakna. Atasan yang mereka hormati adalah yang memimpin dengan integritas, bukan sekadar dengan otoritas.','Tantangan: mengelola ekspektasi klien atau stakeholder yang lebih berorientasi pada output konkret dan KPI daripada nilai dan makna.'],
      en:['Karya Reka memimpin dengan visi kreatif dan kemampuan membuat orang merasakan bahwa pekerjaan mereka punya makna yang lebih besar. Tim kreatif di bawah mereka tidak hanya mengeksekusi — mereka merasa menjadi bagian dari sesuatu yang penting. Sebagai pemimpin, keputusan mereka hampir selalu berakar pada nilai dan apa yang terasa benar secara moral — bukan hanya apa yang paling efisien. Mereka menghargai tim yang mau saling mendukung dan percaya bahwa bekerja bersama dalam harmoni adalah fondasi dari hasil yang bermakna. Atasan yang mereka hormati adalah yang memimpin dengan integritas, bukan sekadar dengan otoritas.','Tantangan: mengelola ekspektasi klien atau stakeholder yang lebih berorientasi pada output konkret dan KPI daripada nilai dan makna.']},
    dalam_bersosialisasi:{
      id:'Paling nyaman dalam lingkungan yang menghargai ekspresi autentik dan percakapan yang punya kedalaman. Mereka bukan yang hadir di setiap acara — tapi ketika hadir, kehadiran mereka terasa. Membangun koneksi yang bermakna dengan orang-orang yang berbagi nilai, bukan sekadar minat atau industri.',
      en:'Paling nyaman dalam lingkungan yang menghargai ekspresi autentik dan percakapan yang punya kedalaman. Mereka bukan yang hadir di setiap acara — tapi ketika hadir, kehadiran mereka terasa. Membangun koneksi yang bermakna dengan orang-orang yang berbagi nilai, bukan sekadar minat atau industri.'},
    saran_perkembangan:{
      pembuka:{id:'Karya Reka berkarya untuk menggerakkan — dan pengembangan terbaik adalah yang memperkuat kemampuan menjaga visi itu tetap hidup, dari brief pertama sampai karya final yang dilihat dunia.',en:'Karya Reka berkarya untuk menggerakkan — dan pengembangan terbaik adalah yang memperkuat kemampuan menjaga visi itu tetap hidup, dari brief pertama sampai karya final yang dilihat dunia.'},
      skills:{id:['Brand storytelling dan content strategy untuk profesi Brand Storyteller atau Creative Director','Creative direction: memimpin tim kreatif multidisiplin dengan brief yang menginspirasi','Arts education methodology untuk profesi Arts Educator — pedagogik yang berbasis ekspresi','Project dan client management dalam konteks industri kreatif: menjaga visi tanpa kehilangan klien','Cultural production dan curation untuk profesi Cultural Producer','Personal branding dan portfolio yang mengkomunikasikan perspektif kreatif yang unik'],en:['Brand storytelling and content strategy for Brand Storyteller or Creative Director roles','Creative direction: leading multidisciplinary creative teams with inspiring briefs','Arts education methodology for Arts Educator — expression-based pedagogy','Project and client management in the creative industry: preserving vision without losing clients','Cultural production and curation for Cultural Producer roles','Personal branding and portfolio that communicates a unique creative perspective']}},
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
      en:"Creative projects with real complexity and scale. Access to user or audience data to inform creative decisions. An environment that values the strategy behind aesthetics."},
    dalam_memimpin:{
      id:['Karya Logika memimpin dengan sistem dan kejelasan arah kreatif. Dalam tim desain, mereka membangun design system, menentukan prinsip, dan memastikan konsistensi tanpa mengorbankan inovasi. Gaya kepemimpinan mereka cenderung directive dalam hal standar tapi terbuka dalam hal eksekusi. Sebagai pemimpin, mereka mengutamakan efektivitas dan kompetensi di atas segalanya — dan mengharapkan hal yang sama dari tim mereka. Yang membuat mereka paling hidup dalam kepemimpinan adalah ketika ada tantangan nyata yang belum ada jawabannya: tim yang bisa diajak berpikir keras, masalah yang membutuhkan solusi baru, dan lingkungan yang menghargai kapasitas lebih dari jabatan.','Tantangan: memberi ruang untuk anggota tim yang lebih intuitif dan kurang sistematis.'],
      en:['Karya Logika memimpin dengan sistem dan kejelasan arah kreatif. Dalam tim desain, mereka membangun design system, menentukan prinsip, dan memastikan konsistensi tanpa mengorbankan inovasi. Gaya kepemimpinan mereka cenderung directive dalam hal standar tapi terbuka dalam hal eksekusi. Sebagai pemimpin, mereka mengutamakan efektivitas dan kompetensi di atas segalanya — dan mengharapkan hal yang sama dari tim mereka. Yang membuat mereka paling hidup dalam kepemimpinan adalah ketika ada tantangan nyata yang belum ada jawabannya: tim yang bisa diajak berpikir keras, masalah yang membutuhkan solusi baru, dan lingkungan yang menghargai kapasitas lebih dari jabatan.','Tantangan: memberi ruang untuk anggota tim yang lebih intuitif dan kurang sistematis.']},
    dalam_bersosialisasi:{
      id:'Mereka membangun jaringan yang strategis — orang-orang yang bisa saling memberi nilai intelektual atau profesional. Percakapan yang mereka nikmati adalah yang menantang cara berpikir atau membuka perspektif baru tentang industri. Tidak mudah membuka diri, tapi sangat loyal kepada orang-orang yang sudah mendapatkan kepercayaan mereka.',
      en:'Mereka membangun jaringan yang strategis — orang-orang yang bisa saling memberi nilai intelektual atau profesional. Percakapan yang mereka nikmati adalah yang menantang cara berpikir atau membuka perspektif baru tentang industri. Tidak mudah membuka diri, tapi sangat loyal kepada orang-orang yang sudah mendapatkan kepercayaan mereka.'},
    saran_perkembangan:{
      pembuka:{id:'Karya Logika adalah perancang sistem kreatif — dan pengembangan terbaik adalah yang membangun jembatan antara visi desain dan dampak yang bisa diukur.',en:'Karya Logika adalah perancang sistem kreatif — dan pengembangan terbaik adalah yang membangun jembatan antara visi desain dan dampak yang bisa diukur.'},
      skills:{id:['Design systems dan component libraries (Figma, Storybook) untuk profesi Design Systems Lead','UX strategy dan product design — menghubungkan keputusan desain dengan tujuan bisnis','Creative technology: prototyping dengan kode untuk profesi Creative Technologist','Design research dan usability testing untuk menginformasikan keputusan desain dengan data','Creative strategy dan brand architecture untuk profesi Head of Design tingkat strategis','Kepemimpinan kreatif: membangun tim desain yang mandiri dan memiliki standar yang konsisten'],en:['Design systems and component libraries (Figma, Storybook) for Design Systems Lead','UX strategy and product design — connecting design decisions to business goals','Creative technology: code prototyping for Creative Technologist roles','Design research and usability testing to inform design decisions with data','Creative strategy and brand architecture for strategic Head of Design roles','Creative leadership: building independent design teams with consistent standards']}},
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
      en:"High quality standards that are respected. Clear briefs so creative energy can be fully channeled into execution. A team that values reliability and precision."},
    dalam_memimpin:{
      id:['Karya Jaga memimpin dengan standar dan konsistensi yang sangat tinggi. Di studio atau tim produksi, mereka menetapkan ukuran \'cukup bagus\' — dan biasanya ukuran itu lebih tinggi dari rata-rata industri. Mereka menginspirasi melalui teladan, bukan retorika. Sebagai pemimpin, sebagian dari mereka memimpin dengan nilai dan norma yang jelas — membangun tim yang saling menghargai dan berkomitmen pada standar bersama. Sebagian lagi memimpin dengan efisiensi dan ekspektasi kinerja yang terukur, menghargai tim yang kompeten dan produktif. Keduanya berbagi keyakinan yang sama: bahwa kepemimpinan yang baik adalah kepemimpinan yang bisa diandalkan.','Tantangan: mendelegasikan tanpa micromanaging, dan memberi kepercayaan kepada anggota tim yang bekerja dengan pendekatan berbeda.'],
      en:['Karya Jaga memimpin dengan standar dan konsistensi yang sangat tinggi. Di studio atau tim produksi, mereka menetapkan ukuran \'cukup bagus\' — dan biasanya ukuran itu lebih tinggi dari rata-rata industri. Mereka menginspirasi melalui teladan, bukan retorika. Sebagai pemimpin, sebagian dari mereka memimpin dengan nilai dan norma yang jelas — membangun tim yang saling menghargai dan berkomitmen pada standar bersama. Sebagian lagi memimpin dengan efisiensi dan ekspektasi kinerja yang terukur, menghargai tim yang kompeten dan produktif. Keduanya berbagi keyakinan yang sama: bahwa kepemimpinan yang baik adalah kepemimpinan yang bisa diandalkan.','Tantangan: mendelegasikan tanpa micromanaging, dan memberi kepercayaan kepada anggota tim yang bekerja dengan pendekatan berbeda.']},
    dalam_bersosialisasi:{
      id:'Mereka adalah teman yang sangat andal dan sangat dihargai — seseorang yang jarang berjanji tapi selalu menepati apa yang dijanjikan. Lebih memilih lingkaran kecil yang intim daripada jaringan yang luas. Dalam komunitas profesional, mereka dikenal karena kualitas kerja mereka, bukan karena kepribadian yang mencolok.',
      en:'Mereka adalah teman yang sangat andal dan sangat dihargai — seseorang yang jarang berjanji tapi selalu menepati apa yang dijanjikan. Lebih memilih lingkaran kecil yang intim daripada jaringan yang luas. Dalam komunitas profesional, mereka dikenal karena kualitas kerja mereka, bukan karena kepribadian yang mencolok.'},
    saran_perkembangan:{
      pembuka:{id:'Karya Jaga adalah maestro keahlian — dan pengembangan terbaik adalah yang mempertajam spesialisasi sampai ke titik di mana tidak banyak yang bisa menandingi, sekaligus membuka kemampuan untuk mewariskan standar itu.',en:'Karya Jaga adalah maestro keahlian — dan pengembangan terbaik adalah yang mempertajam spesialisasi sampai ke titik di mana tidak banyak yang bisa menandingi, sekaligus membuka kemampuan untuk mewariskan standar itu.'},
      skills:{id:['Advanced craft mastery: typography, color theory, atau motion design tingkat tinggi sesuai spesialisasi','Art direction dan visual identity system untuk jalur ke Senior Art Director','Audio engineering dan mixing untuk profesi Audio Engineer atau Music Producer','Production pipeline management untuk mengkoordinasikan proyek kreatif yang kompleks','Mentoring dan portfolio review: mengajarkan standar kualitas kepada generasi berikutnya','Client communication dan creative brief decoding: memastikan ekspektasi klien terjawab tanpa kompromi kualitas'],en:['Advanced craft mastery: typography, color theory, or motion design at a high level','Art direction and visual identity systems for Senior Art Director track','Audio engineering and mixing for Audio Engineer or Music Producer roles','Production pipeline management for complex creative projects','Mentoring and portfolio review: teaching quality standards to the next generation','Client communication and brief decoding: meeting expectations without quality compromise']}},
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
      en:"Projects with real room for improvisation. A responsive audience or client that can be interacted with directly. Deadlines that create urgency without strangling creativity."},
    dalam_memimpin:{
      id:['Karya Guna memimpin dengan energi dan kehadiran yang menular. Di set, studio, atau panggung, mereka adalah yang membuat semua orang merasa hidup dan engaged. Gaya kepemimpinan mereka sangat situasional — mereka membaca momen dan bergerak sesuai dengan apa yang dibutuhkan. Sebagai pemimpin, sebagian dari mereka memimpin dengan semangat dan kehangatan — mendorong kebersamaan dan memastikan tidak ada yang merasa tertinggal. Sebagian lagi memimpin dengan fokus pada tantangan yang menarik — mendorong tim untuk menemukan solusi paling efektif di lapangan. Keduanya berbagi pendekatan yang sama: memimpin dengan hadir sepenuhnya, bukan dengan instruksi dari balik meja.','Tantangan: konsistensi jangka panjang dan perencanaan yang lebih terstruktur.'],
      en:['Karya Guna memimpin dengan energi dan kehadiran yang menular. Di set, studio, atau panggung, mereka adalah yang membuat semua orang merasa hidup dan engaged. Gaya kepemimpinan mereka sangat situasional — mereka membaca momen dan bergerak sesuai dengan apa yang dibutuhkan. Sebagai pemimpin, sebagian dari mereka memimpin dengan semangat dan kehangatan — mendorong kebersamaan dan memastikan tidak ada yang merasa tertinggal. Sebagian lagi memimpin dengan fokus pada tantangan yang menarik — mendorong tim untuk menemukan solusi paling efektif di lapangan. Keduanya berbagi pendekatan yang sama: memimpin dengan hadir sepenuhnya, bukan dengan instruksi dari balik meja.','Tantangan: konsistensi jangka panjang dan perencanaan yang lebih terstruktur.']},
    dalam_bersosialisasi:{
      id:'Mereka sangat mudah didekati dan sangat menyenangkan dalam konteks sosial. Energi mereka menarik orang, dan mereka sangat baik dalam membuat orang baru merasa nyaman dengan cepat. Membangun banyak koneksi yang relatif luas — dan kedalaman beberapa di antaranya patut lebih diinvestasikan.',
      en:'Mereka sangat mudah didekati dan sangat menyenangkan dalam konteks sosial. Energi mereka menarik orang, dan mereka sangat baik dalam membuat orang baru merasa nyaman dengan cepat. Membangun banyak koneksi yang relatif luas — dan kedalaman beberapa di antaranya patut lebih diinvestasikan.'},
    saran_perkembangan:{
      pembuka:{id:'Karya Guna paling hidup ketika bekerja di momen — dan pengembangan terbaik adalah yang memberi sedikit struktur pada kekuatan spontan itu, tanpa memadamkannya.',en:'Karya Guna paling hidup ketika bekerja di momen — dan pengembangan terbaik adalah yang memberi sedikit struktur pada kekuatan spontan itu, tanpa memadamkannya.'},
      skills:{id:['Performance dan stage presence: mengembangkan kemampuan untuk berbagai format dan audiens','Live content creation dan real-time video production untuk profesi Social Media Content Creator','Event production dan brand activation management untuk profesi Brand Activation Specialist','Improvisational facilitation dan experiential learning design','Personal brand monetization: mengubah talenta kreatif spontan menjadi income stream yang berkelanjutan','Basic project planning: memberi struktur minimal pada proses kreatif agar momentum tidak hilang'],en:['Performance and stage presence: building capability across formats and audiences','Live content creation and real-time video production for Social Media Content Creator','Event production and brand activation management','Improvisational facilitation and experiential learning design','Personal brand monetization: turning spontaneous creative talent into sustainable income','Basic project planning: adding minimal structure to keep creative momentum intact']}},
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
      en:"Long-term relationships that enable real transformative impact. An organization that genuinely cares about people, not just performance. Space for self-reflection amid emotionally demanding work."},
    dalam_memimpin:{
      id:['Bakti Reka memimpin dengan empati yang sangat dalam dan kemampuan melihat potensi terbaik dalam setiap orang. Tim di bawah mereka merasa benar-benar dilihat dan didukung — bukan hanya sebagai resource. Gaya kepemimpinan mereka transformatif: bukan tentang mengontrol, tapi tentang memberdayakan. Sebagai pemimpin, keputusan mereka hampir selalu berakar pada nilai dan apa yang terasa benar secara moral — bukan hanya apa yang paling efisien. Mereka menghargai tim yang mau saling mendukung dan percaya bahwa bekerja bersama dalam harmoni adalah fondasi dari hasil yang bermakna. Atasan yang mereka hormati adalah yang memimpin dengan integritas, bukan sekadar dengan otoritas.','Tantangan: menjaga batasan emosional dan tidak mengambil terlalu banyak beban orang lain sebagai tanggung jawab pribadi.'],
      en:['Bakti Reka memimpin dengan empati yang sangat dalam dan kemampuan melihat potensi terbaik dalam setiap orang. Tim di bawah mereka merasa benar-benar dilihat dan didukung — bukan hanya sebagai resource. Gaya kepemimpinan mereka transformatif: bukan tentang mengontrol, tapi tentang memberdayakan. Sebagai pemimpin, keputusan mereka hampir selalu berakar pada nilai dan apa yang terasa benar secara moral — bukan hanya apa yang paling efisien. Mereka menghargai tim yang mau saling mendukung dan percaya bahwa bekerja bersama dalam harmoni adalah fondasi dari hasil yang bermakna. Atasan yang mereka hormati adalah yang memimpin dengan integritas, bukan sekadar dengan otoritas.','Tantangan: menjaga batasan emosional dan tidak mengambil terlalu banyak beban orang lain sebagai tanggung jawab pribadi.']},
    dalam_bersosialisasi:{
      id:'Mereka adalah magnet emosional yang natural — orang-orang tertarik untuk bercerita kepada mereka karena mereka merasa didengar tanpa dihakimi. Dalam lingkaran sosial, mereka sering menjadi tempat berlabuh bagi orang-orang yang sedang menghadapi sesuatu. Kebutuhan mereka sendiri untuk didengar sering kali kurang terekspresikan.',
      en:'Mereka adalah magnet emosional yang natural — orang-orang tertarik untuk bercerita kepada mereka karena mereka merasa didengar tanpa dihakimi. Dalam lingkaran sosial, mereka sering menjadi tempat berlabuh bagi orang-orang yang sedang menghadapi sesuatu. Kebutuhan mereka sendiri untuk didengar sering kali kurang terekspresikan.'},
    saran_perkembangan:{
      pembuka:{id:'Bakti Reka adalah pengembang manusia yang paling genuine — dan pengembangan terbaik adalah yang memperdalami kapasitas itu sekaligus membangun fondasi untuk menjaganya tetap berkelanjutan.',en:'Bakti Reka adalah pengembang manusia yang paling genuine — dan pengembangan terbaik adalah yang memperdalami kapasitas itu sekaligus membangun fondasi untuk menjaganya tetap berkelanjutan.'},
      skills:{id:['Coaching certification (ICF) untuk memprofesionalkan kemampuan mendampingi yang sudah natural','Counseling atau psychotherapy fundamentals untuk profesi Counselor atau Psychotherapist','Curriculum dan learning experience design untuk profesi Learning & Development Specialist','Trauma-informed care dan active listening tingkat lanjut','Group facilitation dan community building untuk profesi Community Development Manager','Self-care dan sustainability practices: mempertahankan kapasitas membantu dalam jangka panjang'],en:['Coaching certification (ICF) to professionalise a naturally strong ability to accompany others','Counseling or psychotherapy fundamentals for Counselor or Psychotherapist roles','Curriculum and learning experience design for L&D Specialist roles','Trauma-informed care and advanced active listening','Group facilitation and community building for Community Development Manager','Self-care and sustainability practices: maintaining helping capacity long-term']}},
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
      en:"An organization serious about talent development. Access to data and authority to make systemic decisions. A position that allows strategic influence, not just operational."},
    dalam_memimpin:{
      id:['Bakti Logika memimpin dengan sistem dan data, tapi selalu dengan manusia sebagai tujuan akhir. Mereka adalah pemimpin HR atau L&D yang bisa berbicara dengan bahasa bisnis sekaligus bahasa manusia. Sebagai pemimpin, mereka mengutamakan efektivitas dan kompetensi di atas segalanya — dan mengharapkan hal yang sama dari tim mereka. Yang membuat mereka paling hidup dalam kepemimpinan adalah ketika ada tantangan nyata yang belum ada jawabannya: tim yang bisa diajak berpikir keras, masalah yang membutuhkan solusi baru, dan lingkungan yang menghargai kapasitas lebih dari jabatan.','Tantangan: memastikan sistem yang dibangun tidak kehilangan sentuhan manusiawi saat diimplementasikan dalam skala besar.'],
      en:['Bakti Logika memimpin dengan sistem dan data, tapi selalu dengan manusia sebagai tujuan akhir. Mereka adalah pemimpin HR atau L&D yang bisa berbicara dengan bahasa bisnis sekaligus bahasa manusia. Sebagai pemimpin, mereka mengutamakan efektivitas dan kompetensi di atas segalanya — dan mengharapkan hal yang sama dari tim mereka. Yang membuat mereka paling hidup dalam kepemimpinan adalah ketika ada tantangan nyata yang belum ada jawabannya: tim yang bisa diajak berpikir keras, masalah yang membutuhkan solusi baru, dan lingkungan yang menghargai kapasitas lebih dari jabatan.','Tantangan: memastikan sistem yang dibangun tidak kehilangan sentuhan manusiawi saat diimplementasikan dalam skala besar.']},
    dalam_bersosialisasi:{
      id:'Cukup selektif dalam relasi — tidak semua orang mendapat akses ke inner circle mereka. Tapi bagi yang masuk, mereka adalah teman yang sangat reliable dan sangat tulus. Dalam konteks profesional, jaringan mereka dibangun berbasis mutual value, bukan sekadar mutual familiarity.',
      en:'Cukup selektif dalam relasi — tidak semua orang mendapat akses ke inner circle mereka. Tapi bagi yang masuk, mereka adalah teman yang sangat reliable dan sangat tulus. Dalam konteks profesional, jaringan mereka dibangun berbasis mutual value, bukan sekadar mutual familiarity.'},
    saran_perkembangan:{
      pembuka:{id:'Bakti Logika membuktikan bahwa kepedulian pada manusia dan ketajaman analitis bukan dua hal yang berlawanan — dan pengembangan terbaik adalah yang memperkuat keduanya sekaligus.',en:'Bakti Logika membuktikan bahwa kepedulian pada manusia dan ketajaman analitis bukan dua hal yang berlawanan — dan pengembangan terbaik adalah yang memperkuat keduanya sekaligus.'},
      skills:{id:['People analytics dan HR data science: menggunakan data untuk membuktikan dampak program SDM','Organizational design dan workforce planning untuk profesi CPO atau Head of HR','Industrial-Organizational Psychology frameworks untuk memahami perilaku organisasi secara sistemik','Learning management systems (LMS) dan instructional design technology','Change management methodology (ADKAR, Kotter) untuk mengimplementasikan transformasi SDM','Storytelling dengan data: mengkomunikasikan dampak manusiawi dari program dengan angka yang meyakinkan'],en:['People analytics and HR data science: using data to prove the impact of people programmes','Organizational design and workforce planning for CPO or Head of HR roles','Industrial-Organizational Psychology frameworks for systemic understanding of organisational behaviour','Learning management systems (LMS) and instructional design technology','Change management methodology (ADKAR, Kotter) for implementing HR transformation','Data storytelling: communicating the human impact of programmes through compelling numbers']}},
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
      en:"An institution with a clear and serious social mandate. A role with defined scope and sufficient authority. A team that shares service values."},
    dalam_memimpin:{
      id:['Bakti Jaga memimpin dengan konsistensi dan rasa aman yang diberikan kepada tim dan orang yang dilayani. Di institusi layanan sosial, mereka memastikan tidak ada prosedur yang dilanggar demi kepentingan jangka pendek yang merugikan penerima layanan. Cara memimpin mereka adalah dengan menjadi teladan etika dan keandalan. Sebagai pemimpin, sebagian dari mereka memimpin dengan nilai dan norma yang jelas — membangun tim yang saling menghargai dan berkomitmen pada standar bersama. Sebagian lagi memimpin dengan efisiensi dan ekspektasi kinerja yang terukur, menghargai tim yang kompeten dan produktif. Keduanya berbagi keyakinan yang sama: bahwa kepemimpinan yang baik adalah kepemimpinan yang bisa diandalkan.','Tantangan: mengadvokasi perubahan ketika sistem yang ada sudah tidak lagi melayani dengan baik.'],
      en:['Bakti Jaga memimpin dengan konsistensi dan rasa aman yang diberikan kepada tim dan orang yang dilayani. Di institusi layanan sosial, mereka memastikan tidak ada prosedur yang dilanggar demi kepentingan jangka pendek yang merugikan penerima layanan. Cara memimpin mereka adalah dengan menjadi teladan etika dan keandalan. Sebagai pemimpin, sebagian dari mereka memimpin dengan nilai dan norma yang jelas — membangun tim yang saling menghargai dan berkomitmen pada standar bersama. Sebagian lagi memimpin dengan efisiensi dan ekspektasi kinerja yang terukur, menghargai tim yang kompeten dan produktif. Keduanya berbagi keyakinan yang sama: bahwa kepemimpinan yang baik adalah kepemimpinan yang bisa diandalkan.','Tantangan: mengadvokasi perubahan ketika sistem yang ada sudah tidak lagi melayani dengan baik.']},
    dalam_bersosialisasi:{
      id:'Mereka adalah orang yang paling dapat diandalkan dalam lingkaran sosial — yang pertama hadir saat ada yang membutuhkan bantuan nyata. Tidak banyak bicara tentang diri sendiri, tapi perhatian mereka kepada orang lain sangat konsisten dan sangat tulus.',
      en:'Mereka adalah orang yang paling dapat diandalkan dalam lingkaran sosial — yang pertama hadir saat ada yang membutuhkan bantuan nyata. Tidak banyak bicara tentang diri sendiri, tapi perhatian mereka kepada orang lain sangat konsisten dan sangat tulus.'},
    saran_perkembangan:{
      pembuka:{id:'Bakti Jaga adalah tulang punggung institusi yang melayani manusia — dan pengembangan terbaik adalah yang membuka kemampuan untuk membawa standar pelayanan mereka ke skala dan pengaruh yang lebih besar.',en:'Bakti Jaga adalah tulang punggung institusi yang melayani manusia — dan pengembangan terbaik adalah yang membuka kemampuan untuk membawa standar pelayanan mereka ke skala dan pengaruh yang lebih besar.'},
      skills:{id:['Healthcare atau social services administration untuk profesi Hospital Administrator atau Social Services Manager','Public policy dan advocacy: membawa perubahan tidak hanya di level operasional tapi juga di level sistem','Program evaluation dan impact measurement untuk membuktikan efektivitas layanan','Crisis management dan safeguarding protocols untuk memimpin layanan di situasi darurat','Grant writing dan fundraising untuk profesi di sektor NGO atau layanan publik','Leadership di institusi layanan: mengelola tim yang beragam sambil mempertahankan standar etika'],en:['Healthcare or social services administration for Hospital Administrator or Social Services Manager','Public policy and advocacy: driving change at the systems level, not just operational','Programme evaluation and impact measurement to prove service effectiveness','Crisis management and safeguarding protocols for leading services in emergency situations','Grant writing and fundraising for NGO or public service roles','Leadership in service institutions: managing diverse teams while maintaining ethical standards']}},
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
      en:"Field work that directly interacts with the people being served. An environment that gives autonomy to act based on one's own judgment. Results that are immediately visible."},
    dalam_memimpin:{
      id:['Bakti Guna memimpin dari garis terdepan — dengan tindakan, bukan pidato. Tim mereka mengikuti karena melihat langsung bagaimana mereka bekerja dan betapa genuinely mereka peduli. Gaya kepemimpinan mereka sangat situasional dan responsif. Sebagai pemimpin, sebagian dari mereka memimpin dengan semangat dan kehangatan — mendorong kebersamaan dan memastikan tidak ada yang merasa tertinggal. Sebagian lagi memimpin dengan fokus pada tantangan yang menarik — mendorong tim untuk menemukan solusi paling efektif di lapangan. Keduanya berbagi pendekatan yang sama: memimpin dengan hadir sepenuhnya, bukan dengan instruksi dari balik meja.','Tantangan: dokumentasi, perencanaan jangka panjang, dan delegasi yang efektif kepada orang yang bekerja dengan cara berbeda.'],
      en:['Bakti Guna memimpin dari garis terdepan — dengan tindakan, bukan pidato. Tim mereka mengikuti karena melihat langsung bagaimana mereka bekerja dan betapa genuinely mereka peduli. Gaya kepemimpinan mereka sangat situasional dan responsif. Sebagai pemimpin, sebagian dari mereka memimpin dengan semangat dan kehangatan — mendorong kebersamaan dan memastikan tidak ada yang merasa tertinggal. Sebagian lagi memimpin dengan fokus pada tantangan yang menarik — mendorong tim untuk menemukan solusi paling efektif di lapangan. Keduanya berbagi pendekatan yang sama: memimpin dengan hadir sepenuhnya, bukan dengan instruksi dari balik meja.','Tantangan: dokumentasi, perencanaan jangka panjang, dan delegasi yang efektif kepada orang yang bekerja dengan cara berbeda.']},
    dalam_bersosialisasi:{
      id:'Mereka hangat, mudah didekati, dan sangat baik dalam membuat orang merasa nyaman dengan cepat. Koneksi mereka biasanya lahir dari pengalaman bersama di lapangan — menolong seseorang, melewati situasi sulit bersama. Relasi yang lahir dari cara ini biasanya sangat tahan lama.',
      en:'Mereka hangat, mudah didekati, dan sangat baik dalam membuat orang merasa nyaman dengan cepat. Koneksi mereka biasanya lahir dari pengalaman bersama di lapangan — menolong seseorang, melewati situasi sulit bersama. Relasi yang lahir dari cara ini biasanya sangat tahan lama.'},
    saran_perkembangan:{
      pembuka:{id:'Bakti Guna adalah kehadiran yang paling dirasakan saat dibutuhkan — dan pengembangan terbaik adalah yang memperdalami kapasitas responsif itu sekaligus membangun kemampuan mendokumentasikan dampaknya.',en:'Bakti Guna adalah kehadiran yang paling dirasakan saat dibutuhkan — dan pengembangan terbaik adalah yang memperdalami kapasitas responsif itu sekaligus membangun kemampuan mendokumentasikan dampaknya.'},
      skills:{id:['Crisis intervention dan de-escalation techniques untuk profesi Crisis Intervention Specialist','Trauma-informed care untuk bekerja dengan populasi rentan','Community health worker certification untuk profesi Community Outreach Worker','First aid dan emergency response lanjutan untuk profesi Paramedic atau Perawat','Motivational interviewing untuk profesi Youth Worker atau Occupational Therapist','Impact documentation: mencatat dan mengkomunikasikan dampak kerja lapangan kepada funder dan organisasi'],en:['Crisis intervention and de-escalation techniques for Crisis Intervention Specialist roles','Trauma-informed care for working with vulnerable populations','Community health worker certification for Community Outreach Worker roles','Advanced first aid and emergency response for Paramedic or Nurse roles','Motivational interviewing for Youth Worker or Occupational Therapist roles','Impact documentation: recording and communicating field work impact to funders and organisations']}},
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
      en:"Zero-to-one energy — building from scratch. A team that believes in the mission. Freedom to determine direction, not just execute instructions."},
    dalam_memimpin:{
      id:['Karsa Reka memimpin dengan cerita dan visi yang membuat orang merasa menjadi bagian dari sesuatu yang lebih besar. Di boardroom atau town hall, mereka adalah yang paling mampu membuat semua orang merasa bahwa pekerjaan mereka punya makna. Sebagai pemimpin, keputusan mereka hampir selalu berakar pada nilai dan apa yang terasa benar secara moral — bukan hanya apa yang paling efisien. Mereka menghargai tim yang mau saling mendukung dan percaya bahwa bekerja bersama dalam harmoni adalah fondasi dari hasil yang bermakna. Atasan yang mereka hormati adalah yang memimpin dengan integritas, bukan sekadar dengan otoritas.','Tantangan terbesar: fase scaling yang membutuhkan lebih banyak sistem dan proses — mereka sangat membutuhkan partner operasional yang kuat untuk mengisi kekosongan ini.'],
      en:['Karsa Reka memimpin dengan cerita dan visi yang membuat orang merasa menjadi bagian dari sesuatu yang lebih besar. Di boardroom atau town hall, mereka adalah yang paling mampu membuat semua orang merasa bahwa pekerjaan mereka punya makna. Sebagai pemimpin, keputusan mereka hampir selalu berakar pada nilai dan apa yang terasa benar secara moral — bukan hanya apa yang paling efisien. Mereka menghargai tim yang mau saling mendukung dan percaya bahwa bekerja bersama dalam harmoni adalah fondasi dari hasil yang bermakna. Atasan yang mereka hormati adalah yang memimpin dengan integritas, bukan sekadar dengan otoritas.','Tantangan terbesar: fase scaling yang membutuhkan lebih banyak sistem dan proses — mereka sangat membutuhkan partner operasional yang kuat untuk mengisi kekosongan ini.']},
    dalam_bersosialisasi:{
      id:'Karsa Reka adalah pembicara yang sangat natural dan sangat menginspirasi. Mereka membangun jaringan yang didasari oleh nilai bersama, bukan kepentingan transaksional. Orang-orang tertarik kepada mereka karena mereka membuat orang merasa bahwa masa depan yang lebih baik itu mungkin.',
      en:'Karsa Reka adalah pembicara yang sangat natural dan sangat menginspirasi. Mereka membangun jaringan yang didasari oleh nilai bersama, bukan kepentingan transaksional. Orang-orang tertarik kepada mereka karena mereka membuat orang merasa bahwa masa depan yang lebih baik itu mungkin.'},
    saran_perkembangan:{
      pembuka:{id:'Karsa Reka memimpin gerakan — dan pengembangan terbaik adalah yang memastikan gerakan itu bisa berdiri bahkan saat mereka tidak ada di ruangan.',en:'Karsa Reka memimpin gerakan — dan pengembangan terbaik adalah yang memastikan gerakan itu bisa berdiri bahkan saat mereka tidak ada di ruangan.'},
      skills:{id:['Social entrepreneurship dan impact business model design untuk profesi Founder atau Nonprofit Director','Public speaking dan thought leadership: membangun reputasi sebagai suara yang dipercaya di industri','Fundraising dan investor relations untuk mendanai visi yang besar','Organizational culture design: membangun nilai yang hidup di dalam sistem, bukan hanya di dinding kantor','Strategic partnership dan coalition building untuk profil Brand Builder atau CMO','Basic operational management: memastikan visi bisa dieksekusi tanpa kehadiran mereka setiap saat'],en:['Social entrepreneurship and impact business model design for Founder or Nonprofit Director roles','Public speaking and thought leadership: building reputation as a trusted voice in the industry','Fundraising and investor relations to fund a large vision','Organisational culture design: embedding values into systems, not just wall posters','Strategic partnership and coalition building for Brand Builder or CMO roles','Basic operational management: ensuring vision can be executed without their constant presence']}},
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
      en:"High accountability and equal authority. A competitive industry with real stakes. A team that can be challenged and will grow."},
    dalam_memimpin:{
      id:['Karsa Logika adalah pemimpin yang paling lengkap: visioner sekaligus eksekutif, strategis sekaligus taktis. Mereka memimpin dengan kejelasan arah dan kecepatan keputusan yang membuat tim merasa dipimpin oleh seseorang yang tahu ke mana pergi. Sebagai pemimpin, mereka mengutamakan efektivitas dan kompetensi di atas segalanya — dan mengharapkan hal yang sama dari tim mereka. Yang membuat mereka paling hidup dalam kepemimpinan adalah ketika ada tantangan nyata yang belum ada jawabannya: tim yang bisa diajak berpikir keras, masalah yang membutuhkan solusi baru, dan lingkungan yang menghargai kapasitas lebih dari jabatan.','Tantangan: kesabaran dengan orang yang berpikir lebih lambat, dan kemampuan merayakan pencapaian kecil di perjalanan menuju target besar.'],
      en:['Karsa Logika adalah pemimpin yang paling lengkap: visioner sekaligus eksekutif, strategis sekaligus taktis. Mereka memimpin dengan kejelasan arah dan kecepatan keputusan yang membuat tim merasa dipimpin oleh seseorang yang tahu ke mana pergi. Sebagai pemimpin, mereka mengutamakan efektivitas dan kompetensi di atas segalanya — dan mengharapkan hal yang sama dari tim mereka. Yang membuat mereka paling hidup dalam kepemimpinan adalah ketika ada tantangan nyata yang belum ada jawabannya: tim yang bisa diajak berpikir keras, masalah yang membutuhkan solusi baru, dan lingkungan yang menghargai kapasitas lebih dari jabatan.','Tantangan: kesabaran dengan orang yang berpikir lebih lambat, dan kemampuan merayakan pencapaian kecil di perjalanan menuju target besar.']},
    dalam_bersosialisasi:{
      id:'Selektif dalam memilih lingkaran — tidak punya banyak waktu untuk relasi yang tidak saling memberi nilai. Tapi dalam relasi yang diinvestasikan, mereka sangat loyal dan sangat terpercaya. Jaringan mereka biasanya kecil tapi sangat powerful.',
      en:'Selektif dalam memilih lingkaran — tidak punya banyak waktu untuk relasi yang tidak saling memberi nilai. Tapi dalam relasi yang diinvestasikan, mereka sangat loyal dan sangat terpercaya. Jaringan mereka biasanya kecil tapi sangat powerful.'},
    saran_perkembangan:{
      pembuka:{id:'Karsa Logika sudah di jalur kepemimpinan tertinggi — pengembangan terbaik bukan menambah kompetensi baru, tapi mempertajam kematangan kepemimpinan yang akan menentukan seberapa jauh dampaknya.',en:'Karsa Logika sudah di jalur kepemimpinan tertinggi — pengembangan terbaik bukan menambah kompetensi baru, tapi mempertajam kematangan kepemimpinan yang akan menentukan seberapa jauh dampaknya.'},
      skills:{id:['Executive leadership dan board governance untuk profesi CEO atau Managing Director','Advanced negotiation dan deal structuring untuk profesi Investment Banker atau Private Equity','Strategy frameworks (Blue Ocean, Porter, OKR) untuk Chief Strategy Officer','Financial modeling dan business valuation untuk pengambilan keputusan strategis berbasis angka','Executive presence dan C-suite communication untuk memimpin di level tertinggi','Emotional intelligence dalam kepemimpinan: membuat orang merasa didengar tanpa mengorbankan kecepatan keputusan'],en:['Executive leadership and board governance for CEO or Managing Director roles','Advanced negotiation and deal structuring for Investment Banking or Private Equity','Strategy frameworks (Blue Ocean, Porter, OKR) for Chief Strategy Officer','Financial modelling and business valuation for data-driven strategic decisions','Executive presence and C-suite communication','Emotional intelligence in leadership: making people feel heard without sacrificing decision speed']}},
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
      en:"An institution with a clear history and mandate. Long-term expectations, not just quarterly results. A team that values stability and reliability."},
    dalam_memimpin:{
      id:['Karsa Jaga memimpin dengan konsistensi nilai dan kemampuan membangun kepercayaan yang butuh waktu tapi sangat kokoh. Tim mereka tahu persis apa yang diharapkan dan mengapa — karena standar tidak pernah berubah berdasarkan angin. Ini adalah salah satu aset kepemimpinan yang paling langka. Sebagai pemimpin, sebagian dari mereka memimpin dengan nilai dan norma yang jelas — membangun tim yang saling menghargai dan berkomitmen pada standar bersama. Sebagian lagi memimpin dengan efisiensi dan ekspektasi kinerja yang terukur, menghargai tim yang kompeten dan produktif. Keduanya berbagi keyakinan yang sama: bahwa kepemimpinan yang baik adalah kepemimpinan yang bisa diandalkan.','Tantangan: merespons peluang disrupsi yang membutuhkan keberanian mengubah cara yang sudah terbukti.'],
      en:['Karsa Jaga memimpin dengan konsistensi nilai dan kemampuan membangun kepercayaan yang butuh waktu tapi sangat kokoh. Tim mereka tahu persis apa yang diharapkan dan mengapa — karena standar tidak pernah berubah berdasarkan angin. Ini adalah salah satu aset kepemimpinan yang paling langka. Sebagai pemimpin, sebagian dari mereka memimpin dengan nilai dan norma yang jelas — membangun tim yang saling menghargai dan berkomitmen pada standar bersama. Sebagian lagi memimpin dengan efisiensi dan ekspektasi kinerja yang terukur, menghargai tim yang kompeten dan produktif. Keduanya berbagi keyakinan yang sama: bahwa kepemimpinan yang baik adalah kepemimpinan yang bisa diandalkan.','Tantangan: merespons peluang disrupsi yang membutuhkan keberanian mengubah cara yang sudah terbukti.']},
    dalam_bersosialisasi:{
      id:'Mereka adalah orang yang diingat karena integritas dan keandalan, bukan karena kegembiraan sosial. Dalam lingkaran profesional, mereka adalah yang paling dipercaya untuk peran-peran penting. Hubungan sosial mereka cenderung jangka panjang dan mendalam.',
      en:'Mereka adalah orang yang diingat karena integritas dan keandalan, bukan karena kegembiraan sosial. Dalam lingkaran profesional, mereka adalah yang paling dipercaya untuk peran-peran penting. Hubungan sosial mereka cenderung jangka panjang dan mendalam.'},
    saran_perkembangan:{
      pembuka:{id:'Karsa Jaga membangun untuk bertahan — dan pengembangan terbaik adalah yang mempersiapkan mereka untuk memimpin tidak hanya di masa stabilitas, tapi juga di masa transisi yang tak terelakkan.',en:'Karsa Jaga membangun untuk bertahan — dan pengembangan terbaik adalah yang mempersiapkan mereka untuk memimpin tidak hanya di masa stabilitas, tapi juga di masa transisi yang tak terelakkan.'},
      skills:{id:['Change management dan adaptive leadership untuk memimpin transformasi tanpa kehilangan stabilitas','Governance dan risk management untuk profesi Operations Director atau COO','Public administration dan policy implementation untuk profesi Government Administrator','Succession planning dan leadership development untuk memastikan organisasi tidak bergantung pada individu','Institutional communication: menjaga kepercayaan publik dan stakeholder di tengah perubahan','Strategic planning jangka panjang (5–10 tahun) yang mempertimbangkan keberlanjutan institusional'],en:['Change management and adaptive leadership for transformation without losing stability','Governance and risk management for Operations Director or COO roles','Public administration and policy implementation for Government Administrator','Succession planning and leadership development to reduce individual dependency','Institutional communication: maintaining public and stakeholder trust through change','Long-term strategic planning (5–10 years) considering institutional sustainability']}},
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
      en:"High external interaction — meetings, events, negotiations. Incentives directly tied to results. Autonomy in managing relationships and approaches."},
    dalam_memimpin:{
      id:['Karsa Guna memimpin dengan energi dan kepercayaan personal yang sangat kuat. Di ruang negosiasi atau kampanye, mereka adalah yang paling efektif memotivasi tim untuk bergerak dan menutup deal. Gaya kepemimpinan mereka sangat relationship-based — orang bekerja keras untuk mereka karena mereka genuinely peduli pada orang-orangnya. Sebagai pemimpin, sebagian dari mereka memimpin dengan semangat dan kehangatan — mendorong kebersamaan dan memastikan tidak ada yang merasa tertinggal. Sebagian lagi memimpin dengan fokus pada tantangan yang menarik — mendorong tim untuk menemukan solusi paling efektif di lapangan. Keduanya berbagi pendekatan yang sama: memimpin dengan hadir sepenuhnya, bukan dengan instruksi dari balik meja.','Tantangan: sistem, dokumentasi, dan konsistensi proses.'],
      en:['Karsa Guna memimpin dengan energi dan kepercayaan personal yang sangat kuat. Di ruang negosiasi atau kampanye, mereka adalah yang paling efektif memotivasi tim untuk bergerak dan menutup deal. Gaya kepemimpinan mereka sangat relationship-based — orang bekerja keras untuk mereka karena mereka genuinely peduli pada orang-orangnya. Sebagai pemimpin, sebagian dari mereka memimpin dengan semangat dan kehangatan — mendorong kebersamaan dan memastikan tidak ada yang merasa tertinggal. Sebagian lagi memimpin dengan fokus pada tantangan yang menarik — mendorong tim untuk menemukan solusi paling efektif di lapangan. Keduanya berbagi pendekatan yang sama: memimpin dengan hadir sepenuhnya, bukan dengan instruksi dari balik meja.','Tantangan: sistem, dokumentasi, dan konsistensi proses.']},
    dalam_bersosialisasi:{
      id:'Mereka adalah orang yang paling nyaman di hampir semua situasi sosial. Kemampuan mereka untuk membuat orang merasa nyaman dan dilihat dalam hitungan menit adalah hadiah yang luar biasa. Jaringan mereka sangat luas, dan yang penting: sebagian besar koneksinya genuine.',
      en:'Mereka adalah orang yang paling nyaman di hampir semua situasi sosial. Kemampuan mereka untuk membuat orang merasa nyaman dan dilihat dalam hitungan menit adalah hadiah yang luar biasa. Jaringan mereka sangat luas, dan yang penting: sebagian besar koneksinya genuine.'},
    saran_perkembangan:{
      pembuka:{id:'Karsa Guna adalah mesin penggerak relasi — dan pengembangan terbaik adalah yang memastikan energi relasional itu bisa dikonversi menjadi dampak yang konsisten dan terorganisir.',en:'Karsa Guna adalah mesin penggerak relasi — dan pengembangan terbaik adalah yang memastikan energi relasional itu bisa dikonversi menjadi dampak yang konsisten dan terorganisir.'},
      skills:{id:['Sales leadership dan business development strategy untuk profesi Sales Director','Negotiation dan deal structuring tingkat lanjut untuk profesi Partnership Manager','Relationship management (CRM) dan pipeline management untuk mengorganisir jaringan yang luas','Political campaigning dan constituency management untuk profesi Political Campaigner','Personal brand dan executive presence untuk membuka level kepemimpinan berikutnya','Team building dan delegation: membangun sistem eksekusi yang bisa berjalan tanpa harus digerakkan sendiri setiap saat'],en:['Sales leadership and business development strategy for Sales Director roles','Advanced negotiation and deal structuring for Partnership Manager','CRM and pipeline management to organise a wide network','Political campaigning and constituency management','Personal brand and executive presence to unlock the next leadership level','Team building and delegation: building execution systems that don\'t require constant personal activation']}},
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
      en:"Intellectual freedom to follow questions wherever they lead. Collaboration with people who care about impact, not just publication. Time for deep reflection."},
    dalam_memimpin:{
      id:['Nalar Reka memimpin dengan visi intelektual dan kemampuan menginspirasi orang untuk peduli pada pertanyaan yang mungkin belum mereka sadari pentingnya. Mereka adalah pemimpin riset yang bisa membuat agenda penelitian terasa seperti misi yang bermakna. Sebagai pemimpin, keputusan mereka hampir selalu berakar pada nilai dan apa yang terasa benar secara moral — bukan hanya apa yang paling efisien. Mereka menghargai tim yang mau saling mendukung dan percaya bahwa bekerja bersama dalam harmoni adalah fondasi dari hasil yang bermakna. Atasan yang mereka hormati adalah yang memimpin dengan integritas, bukan sekadar dengan otoritas.','Tantangan: terkadang terlalu idealistis tentang apa yang bisa dicapai dalam keterbatasan sumber daya dan waktu.'],
      en:['Nalar Reka memimpin dengan visi intelektual dan kemampuan menginspirasi orang untuk peduli pada pertanyaan yang mungkin belum mereka sadari pentingnya. Mereka adalah pemimpin riset yang bisa membuat agenda penelitian terasa seperti misi yang bermakna. Sebagai pemimpin, keputusan mereka hampir selalu berakar pada nilai dan apa yang terasa benar secara moral — bukan hanya apa yang paling efisien. Mereka menghargai tim yang mau saling mendukung dan percaya bahwa bekerja bersama dalam harmoni adalah fondasi dari hasil yang bermakna. Atasan yang mereka hormati adalah yang memimpin dengan integritas, bukan sekadar dengan otoritas.','Tantangan: terkadang terlalu idealistis tentang apa yang bisa dicapai dalam keterbatasan sumber daya dan waktu.']},
    dalam_bersosialisasi:{
      id:'Percakapan terbaik mereka adalah yang mendalam, filosofis, atau yang membahas implikasi sesuatu jauh ke depan. Mereka bukan yang paling nyaman di keramaian, tapi di meja kecil dengan dua-tiga orang yang bisa diajak bicara tentang hal-hal yang benar-benar penting. Mereka diingat sebagai orang yang membuat orang lain berpikir.',
      en:'Percakapan terbaik mereka adalah yang mendalam, filosofis, atau yang membahas implikasi sesuatu jauh ke depan. Mereka bukan yang paling nyaman di keramaian, tapi di meja kecil dengan dua-tiga orang yang bisa diajak bicara tentang hal-hal yang benar-benar penting. Mereka diingat sebagai orang yang membuat orang lain berpikir.'},
    saran_perkembangan:{
      pembuka:{id:'Nalar Reka punya kemampuan langka: membuat data terasa seperti cerita yang penting. Pengembangan terbaik adalah yang membangun jembatan antara rigor intelektual dan dampak nyata pada manusia.',en:'Nalar Reka punya kemampuan langka: membuat data terasa seperti cerita yang penting. Pengembangan terbaik adalah yang membangun jembatan antara rigor intelektual dan dampak nyata pada manusia.'},
      skills:{id:['Science communication dan academic writing untuk audiens non-akademis','Mixed-methods research: menggabungkan data kuantitatif dengan pendekatan kualitatif yang dalam','UX research methods — wawancara mendalam, ethnographic study, participatory design','Policy brief writing dan evidence-to-policy translation untuk profesi Policy Research Analyst','Public speaking dan storytelling berbasis data untuk menyampaikan insight kepada pengambil keputusan','Research project management: mengelola timeline riset sambil mempertahankan kedalaman temuan'],en:['Science communication and academic writing for non-academic audiences','Mixed-methods research: combining quantitative data with deep qualitative approaches','UX research methods — in-depth interviews, ethnographic study, participatory design','Policy brief writing and evidence-to-policy translation for Policy Research Analyst','Public speaking and data-driven storytelling for decision-makers','Research project management: managing timelines while preserving depth of findings']}},
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
      en:"Access to high-quality data. Time to think deeply without interruption. An environment that values accuracy over speed."},
    dalam_memimpin:{
      id:['Nalar Logika memimpin dengan standar intelektual yang tidak bisa dikompromikan. Tim riset di bawah mereka tahu bahwa klaim harus didukung bukti, metodologi harus defensible, dan kesimpulan harus proporsional dengan data. Sebagai pemimpin, mereka mengutamakan efektivitas dan kompetensi di atas segalanya — dan mengharapkan hal yang sama dari tim mereka. Yang membuat mereka paling hidup dalam kepemimpinan adalah ketika ada tantangan nyata yang belum ada jawabannya: tim yang bisa diajak berpikir keras, masalah yang membutuhkan solusi baru, dan lingkungan yang menghargai kapasitas lebih dari jabatan.','Tantangan: membangun motivasi dan kepercayaan emosional dalam tim — gaya mereka bisa terasa demanding bahkan bagi anggota tim yang kompeten.'],
      en:['Nalar Logika memimpin dengan standar intelektual yang tidak bisa dikompromikan. Tim riset di bawah mereka tahu bahwa klaim harus didukung bukti, metodologi harus defensible, dan kesimpulan harus proporsional dengan data. Sebagai pemimpin, mereka mengutamakan efektivitas dan kompetensi di atas segalanya — dan mengharapkan hal yang sama dari tim mereka. Yang membuat mereka paling hidup dalam kepemimpinan adalah ketika ada tantangan nyata yang belum ada jawabannya: tim yang bisa diajak berpikir keras, masalah yang membutuhkan solusi baru, dan lingkungan yang menghargai kapasitas lebih dari jabatan.','Tantangan: membangun motivasi dan kepercayaan emosional dalam tim — gaya mereka bisa terasa demanding bahkan bagi anggota tim yang kompeten.']},
    dalam_bersosialisasi:{
      id:'Mereka lebih memilih satu percakapan intelektual yang substantif daripada sepuluh percakapan sosial yang dangkal. Dalam lingkaran akademis atau profesional, mereka dikenal sebagai suara yang paling kritis — yang bisa menganggu, tapi juga yang paling bisa diandalkan untuk menunjukkan kelemahan yang tidak terlihat orang lain.',
      en:'Mereka lebih memilih satu percakapan intelektual yang substantif daripada sepuluh percakapan sosial yang dangkal. Dalam lingkaran akademis atau profesional, mereka dikenal sebagai suara yang paling kritis — yang bisa menganggu, tapi juga yang paling bisa diandalkan untuk menunjukkan kelemahan yang tidak terlihat orang lain.'},
    saran_perkembangan:{
      pembuka:{id:'Nalar Logika adalah penjaga standar kebenaran di organisasi — dan pengembangan terbaik adalah yang memperluas jangkauan standar itu, bukan hanya mempertahankannya.',en:'Nalar Logika adalah penjaga standar kebenaran di organisasi — dan pengembangan terbaik adalah yang memperluas jangkauan standar itu, bukan hanya mempertahankannya.'},
      skills:{id:['Advanced statistical modeling dan machine learning untuk profesi Data Scientist atau Econometrician','Data visualization dan storytelling: membuat argumen berbasis data yang bisa dibaca siapapun','Research leadership dan peer mentoring untuk mengembangkan tim analis yang standarnya setara','Intelligence analysis frameworks untuk profesi Intelligence Analyst','Causal inference dan experimental design tingkat lanjut','Kepemimpinan riset: membangun budaya tim yang menghargai akurasi tanpa menciptakan ketakutan akan kesalahan'],en:['Advanced statistical modelling and machine learning for Data Scientist or Econometrician roles','Data visualisation and storytelling: making data-based arguments readable by anyone','Research leadership and peer mentoring to develop analyst teams to an equivalent standard','Intelligence analysis frameworks for Intelligence Analyst roles','Advanced causal inference and experimental design','Research leadership: building a team culture that values accuracy without fear of mistakes']}},
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
      en:"Clear research protocols. An institution that values data integrity. Enough time to do the work properly."},
    dalam_memimpin:{
      id:['Nalar Jaga memimpin dengan integritas proses yang tidak bisa ditawar. Dalam tim riset, mereka memastikan setiap langkah terdokumentasi, setiap protokol diikuti, dan setiap keputusan metodologis bisa dipertanggungjawabkan. Bukan pemimpin yang paling visioner, tapi yang paling bisa diandalkan untuk menjaga kredibilitas jangka panjang. Sebagai pemimpin, sebagian dari mereka memimpin dengan nilai dan norma yang jelas — membangun tim yang saling menghargai dan berkomitmen pada standar bersama. Sebagian lagi memimpin dengan efisiensi dan ekspektasi kinerja yang terukur, menghargai tim yang kompeten dan produktif. Keduanya berbagi keyakinan yang sama: bahwa kepemimpinan yang baik adalah kepemimpinan yang bisa diandalkan.','Tantangan: mendorong perubahan atau inovasi metodologis yang dibutuhkan ketika protokol yang ada sudah tidak lagi memadai.'],
      en:['Nalar Jaga memimpin dengan integritas proses yang tidak bisa ditawar. Dalam tim riset, mereka memastikan setiap langkah terdokumentasi, setiap protokol diikuti, dan setiap keputusan metodologis bisa dipertanggungjawabkan. Bukan pemimpin yang paling visioner, tapi yang paling bisa diandalkan untuk menjaga kredibilitas jangka panjang. Sebagai pemimpin, sebagian dari mereka memimpin dengan nilai dan norma yang jelas — membangun tim yang saling menghargai dan berkomitmen pada standar bersama. Sebagian lagi memimpin dengan efisiensi dan ekspektasi kinerja yang terukur, menghargai tim yang kompeten dan produktif. Keduanya berbagi keyakinan yang sama: bahwa kepemimpinan yang baik adalah kepemimpinan yang bisa diandalkan.','Tantangan: mendorong perubahan atau inovasi metodologis yang dibutuhkan ketika protokol yang ada sudah tidak lagi memadai.']},
    dalam_bersosialisasi:{
      id:'Mereka adalah pendengar yang sangat baik dan teman yang sangat konsisten. Tidak banyak berjanji, tapi apa yang dijanjikan selalu ditepati. Dalam lingkungan kerja, mereka adalah orang yang diingat karena selalu ada saat dibutuhkan — bukan karena penampilan atau karisma.',
      en:'Mereka adalah pendengar yang sangat baik dan teman yang sangat konsisten. Tidak banyak berjanji, tapi apa yang dijanjikan selalu ditepati. Dalam lingkungan kerja, mereka adalah orang yang diingat karena selalu ada saat dibutuhkan — bukan karena penampilan atau karisma.'},
    saran_perkembangan:{
      pembuka:{id:'Integritas metodologis Nalar Jaga adalah aset yang sangat langka di industri yang sering terburu-buru. Pengembangan terbaik adalah spesialisasi yang mempertajam keunggulan ini sampai menjadi standar rujukan.',en:'Integritas metodologis Nalar Jaga adalah aset yang sangat langka di industri yang sering terburu-buru. Pengembangan terbaik adalah spesialisasi yang mempertajam keunggulan ini sampai menjadi standar rujukan.'},
      skills:{id:['Clinical research methodology (GCP certification) untuk profesi Clinical Research Coordinator','Quality systems (ISO, GMP, atau ICH guidelines) — memperdalam standar di bidang spesialisasi','Statistical software lanjutan (R, SAS, SPSS) untuk analisis data riset yang lebih kompleks','Regulatory affairs dan compliance — relevan untuk profesi di industri farmasi atau kesehatan','Research documentation dan data management systems (REDCap, CDMS)','Persuasive communication: memperjuangkan integritas data di hadapan stakeholder yang ingin hasil cepat'],en:['Clinical research methodology (GCP certification) for Clinical Research Coordinator','Quality systems (ISO, GMP, or ICH guidelines) — deepening standards in the specialisation','Advanced statistical software (R, SAS, SPSS) for more complex research data analysis','Regulatory affairs and compliance for pharmaceutical or healthcare industry roles','Research documentation and data management systems (REDCap, CDMS)','Persuasive communication: advocating for data integrity in front of stakeholders who want fast results']}},
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
      en:"Real problems that need real solutions. Autonomy to move from analysis to implementation. An environment that values results over process."},
    dalam_memimpin:{
      id:['Nalar Guna memimpin dengan kecepatan diagnosis dan kejelasan langkah berikutnya. Mereka bukan yang menghabiskan banyak waktu untuk membangun konsensus — mereka melihat masalah, memahaminya cepat, dan bergerak. Tim yang mereka pimpin biasanya sangat produktif dan fokus pada hasil. Sebagai pemimpin, sebagian dari mereka memimpin dengan semangat dan kehangatan — mendorong kebersamaan dan memastikan tidak ada yang merasa tertinggal. Sebagian lagi memimpin dengan fokus pada tantangan yang menarik — mendorong tim untuk menemukan solusi paling efektif di lapangan. Keduanya berbagi pendekatan yang sama: memimpin dengan hadir sepenuhnya, bukan dengan instruksi dari balik meja.','Tantangan: memastikan tim tidak bergerak terlalu cepat melewati analisis yang benar-benar diperlukan.'],
      en:['Nalar Guna memimpin dengan kecepatan diagnosis dan kejelasan langkah berikutnya. Mereka bukan yang menghabiskan banyak waktu untuk membangun konsensus — mereka melihat masalah, memahaminya cepat, dan bergerak. Tim yang mereka pimpin biasanya sangat produktif dan fokus pada hasil. Sebagai pemimpin, sebagian dari mereka memimpin dengan semangat dan kehangatan — mendorong kebersamaan dan memastikan tidak ada yang merasa tertinggal. Sebagian lagi memimpin dengan fokus pada tantangan yang menarik — mendorong tim untuk menemukan solusi paling efektif di lapangan. Keduanya berbagi pendekatan yang sama: memimpin dengan hadir sepenuhnya, bukan dengan instruksi dari balik meja.','Tantangan: memastikan tim tidak bergerak terlalu cepat melewati analisis yang benar-benar diperlukan.']},
    dalam_bersosialisasi:{
      id:'Mereka lebih nyaman dalam konteks profesional yang ada tugasnya daripada situasi sosial murni. Networking terasa lebih natural bagi mereka ketika ada problem atau proyek nyata sebagai topik. Relasi yang lahir dari pekerjaan bersama biasanya sangat kuat.',
      en:'Mereka lebih nyaman dalam konteks profesional yang ada tugasnya daripada situasi sosial murni. Networking terasa lebih natural bagi mereka ketika ada problem atau proyek nyata sebagai topik. Relasi yang lahir dari pekerjaan bersama biasanya sangat kuat.'},
    saran_perkembangan:{
      pembuka:{id:'Nalar Guna adalah analis yang paling actionable — dan pengembangan terbaik adalah yang mempertajam kecepatan diagnosis sekaligus memperkuat kepercayaan tim terhadap proses berpikir di baliknya.',en:'Nalar Guna adalah analis yang paling actionable — dan pengembangan terbaik adalah yang mempertajam kecepatan diagnosis sekaligus memperkuat kepercayaan tim terhadap proses berpikir di baliknya.'},
      skills:{id:['Rapid prototyping dan lean experimentation — dari hipotesis ke validasi secepat mungkin','Business analysis (CBAP atau IIBA certification) untuk profesi Business Analyst','Product management frameworks (Jobs-to-be-Done, OKR, Agile) untuk jalur Product Manager','Healthcare quality improvement methodology (PDSA, DMAIC) untuk profesi di sektor kesehatan','Consulting communication: menyampaikan temuan dan rekomendasi secara singkat dan impactful','Decision-making under uncertainty: teknik analisis yang cukup rigorous tanpa jatuh ke analysis paralysis'],en:['Rapid prototyping and lean experimentation — from hypothesis to validation as fast as possible','Business analysis (CBAP or IIBA certification) for Business Analyst roles','Product management frameworks (Jobs-to-be-Done, OKR, Agile) for Product Manager track','Healthcare quality improvement methodology (PDSA, DMAIC) for health sector roles','Consulting communication: delivering findings and recommendations concisely and impactfully','Decision-making under uncertainty: analysis rigorous enough without falling into paralysis']}},
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
      en:"A creative space with freedom of interpretation. Projects with real impact on people's lives. A small team with high trust."},
    dalam_memimpin:{
      id:['Yasa Reka memimpin dengan contoh konkret, bukan instruksi. Mereka tidak akan meminta tim mengerjakan sesuatu yang tidak bisa mereka lakukan sendiri. Gaya kepemimpinan mereka adalah \'ikuti kalau kamu mau tahu caranya\' — dan orang-orang yang menghargai integritas biasanya memilih untuk ikut. Sebagai pemimpin, keputusan mereka hampir selalu berakar pada nilai dan apa yang terasa benar secara moral — bukan hanya apa yang paling efisien. Mereka menghargai tim yang mau saling mendukung dan percaya bahwa bekerja bersama dalam harmoni adalah fondasi dari hasil yang bermakna. Atasan yang mereka hormati adalah yang memimpin dengan integritas, bukan sekadar dengan otoritas.','Tantangan: belajar mendelegasikan tanpa merasa kualitas akan dikompromikan.'],
      en:['Yasa Reka memimpin dengan contoh konkret, bukan instruksi. Mereka tidak akan meminta tim mengerjakan sesuatu yang tidak bisa mereka lakukan sendiri. Gaya kepemimpinan mereka adalah \'ikuti kalau kamu mau tahu caranya\' — dan orang-orang yang menghargai integritas biasanya memilih untuk ikut. Sebagai pemimpin, keputusan mereka hampir selalu berakar pada nilai dan apa yang terasa benar secara moral — bukan hanya apa yang paling efisien. Mereka menghargai tim yang mau saling mendukung dan percaya bahwa bekerja bersama dalam harmoni adalah fondasi dari hasil yang bermakna. Atasan yang mereka hormati adalah yang memimpin dengan integritas, bukan sekadar dengan otoritas.','Tantangan: belajar mendelegasikan tanpa merasa kualitas akan dikompromikan.']},
    dalam_bersosialisasi:{
      id:'Mereka lebih nyaman dalam percakapan yang punya kedalaman — membahas proyek, ide, atau proses yang sedang dikerjakan. Small talk terasa seperti energi yang terbuang. Dalam lingkaran sosial, mereka dikenal sebagai orang yang bisa diandalkan untuk pekerjaan serius, bukan yang pertama mengorganisir pesta.',
      en:'Mereka lebih nyaman dalam percakapan yang punya kedalaman — membahas proyek, ide, atau proses yang sedang dikerjakan. Small talk terasa seperti energi yang terbuang. Dalam lingkaran sosial, mereka dikenal sebagai orang yang bisa diandalkan untuk pekerjaan serius, bukan yang pertama mengorganisir pesta.'},
    saran_perkembangan:{
      pembuka:{id:'Kekuatan terbesar Yasa Reka ada di persimpangan antara keahlian teknis dan makna yang dibawanya — dan pengembangan terbaik adalah yang memperdalami persimpangan itu, bukan meratakan salah satu sisinya.',en:'Kekuatan terbesar Yasa Reka ada di persimpangan antara keahlian teknis dan makna yang dibawanya — dan pengembangan terbaik adalah yang memperdalami persimpangan itu, bukan meratakan salah satu sisinya.'},
      skills:{id:['Design thinking dan human-centered engineering untuk memperkuat dimensi makna dalam setiap proyek','Sustainable design atau circular economy principles untuk profesi Sustainable Design Specialist','Facilitation dan workshop design untuk memimpin proses kreatif bersama tim','Storytelling visual dan portfolio yang mengkomunikasikan \'mengapa\' di balik \'apa\'','Delegasi terstruktur: project handoff frameworks agar kualitas terjaga tanpa kehadiran penuh','Basic business literacy (costing, client management) untuk mempertahankan kebebasan berkarya jangka panjang'],en:['Design thinking and human-centered engineering to strengthen the meaning dimension in every project','Sustainable design or circular economy principles for Sustainable Design Specialist','Facilitation and workshop design for leading creative processes with a team','Visual storytelling and portfolio that communicates \'why\' behind \'what\'','Structured delegation: project handoff frameworks to maintain quality without constant presence','Basic business literacy (costing, client management) to sustain creative freedom long-term']}},
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
      en:"Complex and unsolved problems. Full autonomy in designing solutions. An environment that values competence over seniority."},
    dalam_memimpin:{
      id:['Yasa Logika memimpin dengan argumen dan sistem yang tak terbantahkan. Mereka tidak membutuhkan banyak otoritas formal — orang mengikuti mereka karena logika mereka jelas dan solusi mereka bekerja. Sebagai pemimpin, mereka mengutamakan efektivitas dan kompetensi di atas segalanya — dan mengharapkan hal yang sama dari tim mereka. Yang membuat mereka paling hidup dalam kepemimpinan adalah ketika ada tantangan nyata yang belum ada jawabannya: tim yang bisa diajak berpikir keras, masalah yang membutuhkan solusi baru, dan lingkungan yang menghargai kapasitas lebih dari jabatan.','Tantangan: komunikasi emosional — mereka tahu jawaban yang benar, tapi tidak selalu tahu cara menyampaikannya agar orang merasa didengar terlebih dulu.'],
      en:['Yasa Logika memimpin dengan argumen dan sistem yang tak terbantahkan. Mereka tidak membutuhkan banyak otoritas formal — orang mengikuti mereka karena logika mereka jelas dan solusi mereka bekerja. Sebagai pemimpin, mereka mengutamakan efektivitas dan kompetensi di atas segalanya — dan mengharapkan hal yang sama dari tim mereka. Yang membuat mereka paling hidup dalam kepemimpinan adalah ketika ada tantangan nyata yang belum ada jawabannya: tim yang bisa diajak berpikir keras, masalah yang membutuhkan solusi baru, dan lingkungan yang menghargai kapasitas lebih dari jabatan.','Tantangan: komunikasi emosional — mereka tahu jawaban yang benar, tapi tidak selalu tahu cara menyampaikannya agar orang merasa didengar terlebih dulu.']},
    dalam_bersosialisasi:{
      id:'Koneksi terbaik mereka lahir dari problem yang dipecahkan bersama. Mereka bukan tipe yang membangun relasi melalui small talk — tapi sekali seseorang bekerja dalam proyek kompleks bersama mereka, hubungan itu menjadi sangat solid. Di lingkungan sosial baru, mereka butuh waktu lebih untuk hangat.',
      en:'Koneksi terbaik mereka lahir dari problem yang dipecahkan bersama. Mereka bukan tipe yang membangun relasi melalui small talk — tapi sekali seseorang bekerja dalam proyek kompleks bersama mereka, hubungan itu menjadi sangat solid. Di lingkungan sosial baru, mereka butuh waktu lebih untuk hangat.'},
    saran_perkembangan:{
      pembuka:{id:'Kapasitas analitis Yasa Logika sudah di level tertinggi. Area pertumbuhan yang paling berdampak bukan menambah kompetensi teknis baru, tapi memperluas kemampuan menerjemahkan kompetensi itu ke dalam pengaruh nyata.',en:'Kapasitas analitis Yasa Logika sudah di level tertinggi. Area pertumbuhan yang paling berdampak bukan menambah kompetensi teknis baru, tapi memperluas kemampuan menerjemahkan kompetensi itu ke dalam pengaruh nyata.'},
      skills:{id:['Systems thinking lanjutan: arsitektur sistem yang skalabel dan fault-tolerant','Technical leadership dan engineering management untuk jalur ke Lead Engineer atau Head of Engineering','Storytelling teknis: menyampaikan keputusan arsitektural kepada stakeholder non-teknis','Agile atau systems engineering methodology untuk memimpin tim teknis multidisiplin','First-principles problem solving dan root cause analysis tingkat lanjut','Komunikasi interpersonal dalam konteks kepemimpinan — membuat orang merasa didengar sebelum dikoreksi'],en:['Advanced systems thinking: scalable and fault-tolerant system architecture','Technical leadership and engineering management for Lead Engineer or Head of Engineering track','Technical storytelling: communicating architectural decisions to non-technical stakeholders','Agile or systems engineering methodology for leading multidisciplinary technical teams','First-principles problem solving and advanced root cause analysis','Interpersonal communication in leadership — making people feel heard before being corrected']}},
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
      en:"Clear and respected standards. Work that produces real and measurable output. A team that values reliability above all."},
    dalam_memimpin:{
      id:['Yasa Jaga memimpin dengan konsistensi dan kepercayaan yang dibangun dari waktu ke waktu. Mereka bukan pemimpin yang hadir saat momen besar — mereka hadir setiap hari, memastikan standar terjaga. Tim mereka tahu persis apa yang diharapkan dan bagaimana mencapainya. Sebagai pemimpin, sebagian dari mereka memimpin dengan nilai dan norma yang jelas — membangun tim yang saling menghargai dan berkomitmen pada standar bersama. Sebagian lagi memimpin dengan efisiensi dan ekspektasi kinerja yang terukur, menghargai tim yang kompeten dan produktif. Keduanya berbagi keyakinan yang sama: bahwa kepemimpinan yang baik adalah kepemimpinan yang bisa diandalkan.','Tantangan: adaptasi cepat saat situasi berubah tiba-tiba, dan memberi ruang untuk tim mencoba cara baru.'],
      en:['Yasa Jaga memimpin dengan konsistensi dan kepercayaan yang dibangun dari waktu ke waktu. Mereka bukan pemimpin yang hadir saat momen besar — mereka hadir setiap hari, memastikan standar terjaga. Tim mereka tahu persis apa yang diharapkan dan bagaimana mencapainya. Sebagai pemimpin, sebagian dari mereka memimpin dengan nilai dan norma yang jelas — membangun tim yang saling menghargai dan berkomitmen pada standar bersama. Sebagian lagi memimpin dengan efisiensi dan ekspektasi kinerja yang terukur, menghargai tim yang kompeten dan produktif. Keduanya berbagi keyakinan yang sama: bahwa kepemimpinan yang baik adalah kepemimpinan yang bisa diandalkan.','Tantangan: adaptasi cepat saat situasi berubah tiba-tiba, dan memberi ruang untuk tim mencoba cara baru.']},
    dalam_bersosialisasi:{
      id:'Mereka adalah teman yang sangat bisa diandalkan — seseorang yang berkata ya dan benar-benar menepatinya. Dalam lingkaran sosial, mereka dikenal sebagai orang yang hadir saat dibutuhkan. Mereka tidak banyak berbicara tentang diri sendiri, tapi perhatian mereka kepada orang lain sangat terasa dan sangat dihargai.',
      en:'Mereka adalah teman yang sangat bisa diandalkan — seseorang yang berkata ya dan benar-benar menepatinya. Dalam lingkaran sosial, mereka dikenal sebagai orang yang hadir saat dibutuhkan. Mereka tidak banyak berbicara tentang diri sendiri, tapi perhatian mereka kepada orang lain sangat terasa dan sangat dihargai.'},
    saran_perkembangan:{
      pembuka:{id:'Yasa Jaga adalah tipe yang paling mampu membangun keunggulan jangka panjang — karena keunggulan mereka lahir dari disiplin harian, bukan dari momen inspirasi. Investasi terbaik adalah yang memperdalami dan memformalkan keahlian yang sudah berjalan.',en:'Yasa Jaga adalah tipe yang paling mampu membangun keunggulan jangka panjang — karena keunggulan mereka lahir dari disiplin harian, bukan dari momen inspirasi. Investasi terbaik adalah yang memperdalami dan memformalkan keahlian yang sudah berjalan.'},
      skills:{id:['Project management certification (PMP atau PRINCE2) untuk memformalkan dan meningkatkan keahlian yang sudah ada','Quality management systems (ISO 9001, Six Sigma) untuk profesi QA Engineer dan Operations Manager','Technical training dan instructional design untuk mengajarkan standar kepada orang lain','Risk management dan contingency planning untuk memimpin lebih baik saat situasi berubah','Lean manufacturing atau operational excellence untuk memperdalami domain spesialisasi','Adaptive leadership: teknik mempertahankan standar sambil merespons perubahan eksternal'],en:['Project management certification (PMP or PRINCE2) to formalise and enhance existing skills','Quality management systems (ISO 9001, Six Sigma) for QA Engineer and Operations Manager','Technical training and instructional design for teaching standards to others','Risk management and contingency planning for leading better when situations change','Lean manufacturing or operational excellence for deepening the specialisation','Adaptive leadership: techniques for maintaining standards while responding to external change']}},
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
      en:"Field work with varied challenges. Autonomy in determining the best way to solve problems. An environment that values skill over credentials."},
    dalam_memimpin:{
      id:['Yasa Guna memimpin dari lapangan, bukan dari rapat. Mereka adalah pemimpin yang paling dihormati oleh tim teknis karena mereka tahu apa yang dikerjakan tim dari dalam. Cara mereka memotivasi bukan lewat kata-kata inspiratif, tapi lewat tindakan nyata. Sebagai pemimpin, sebagian dari mereka memimpin dengan semangat dan kehangatan — mendorong kebersamaan dan memastikan tidak ada yang merasa tertinggal. Sebagian lagi memimpin dengan fokus pada tantangan yang menarik — mendorong tim untuk menemukan solusi paling efektif di lapangan. Keduanya berbagi pendekatan yang sama: memimpin dengan hadir sepenuhnya, bukan dengan instruksi dari balik meja.','Tantangan: komunikasi ke atas dan manajemen ekspektasi dengan stakeholder non-teknis.'],
      en:['Yasa Guna memimpin dari lapangan, bukan dari rapat. Mereka adalah pemimpin yang paling dihormati oleh tim teknis karena mereka tahu apa yang dikerjakan tim dari dalam. Cara mereka memotivasi bukan lewat kata-kata inspiratif, tapi lewat tindakan nyata. Sebagai pemimpin, sebagian dari mereka memimpin dengan semangat dan kehangatan — mendorong kebersamaan dan memastikan tidak ada yang merasa tertinggal. Sebagian lagi memimpin dengan fokus pada tantangan yang menarik — mendorong tim untuk menemukan solusi paling efektif di lapangan. Keduanya berbagi pendekatan yang sama: memimpin dengan hadir sepenuhnya, bukan dengan instruksi dari balik meja.','Tantangan: komunikasi ke atas dan manajemen ekspektasi dengan stakeholder non-teknis.']},
    dalam_bersosialisasi:{
      id:'Paling nyaman dalam konteks yang ada aktivitas konkret — bekerja bersama, mengerjakan sesuatu, atau mengeksplorasi lingkungan baru. Percakapan yang paling natural bagi mereka adalah yang bisa langsung dipraktikkan. Mereka tidak banyak bicara tentang rencana atau ide — mereka lebih suka menunjukkannya.',
      en:'Paling nyaman dalam konteks yang ada aktivitas konkret — bekerja bersama, mengerjakan sesuatu, atau mengeksplorasi lingkungan baru. Percakapan yang paling natural bagi mereka adalah yang bisa langsung dipraktikkan. Mereka tidak banyak bicara tentang rencana atau ide — mereka lebih suka menunjukkannya.'},
    saran_perkembangan:{
      pembuka:{id:'Yasa Guna belajar dengan melakukan — dan pengembangan terbaik mereka adalah yang tetap dekat dengan lapangan, bukan yang menjauhkan mereka ke ruang kelas atau rapat.',en:'Yasa Guna belajar dengan melakukan — dan pengembangan terbaik mereka adalah yang tetap dekat dengan lapangan, bukan yang menjauhkan mereka ke ruang kelas atau rapat.'},
      skills:{id:['Technical troubleshooting lanjutan dan diagnostic methodology di bidang spesialisasi','Field operations management untuk jalur ke Field Engineer atau Senior Technician','Technical communication: mendokumentasikan solusi lapangan agar bisa direplikasi tim lain','Emergency response atau crisis management untuk profesi Emergency Response Specialist','Mentoring dan on-the-job training untuk mengajarkan keahlian kepada junior tanpa harus keluar dari lapangan','Basic project management untuk mengelola pekerjaan lapangan yang lebih kompleks secara mandiri'],en:['Advanced technical troubleshooting and diagnostic methodology in the specialisation','Field operations management for Field Engineer or Senior Technician track','Technical communication: documenting field solutions so others can replicate them','Emergency response or crisis management for Emergency Response Specialist roles','Mentoring and on-the-job training to pass skills to juniors without leaving the field','Basic project management for independently managing more complex field work']}},
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
      en:"An organization with a clear and genuine mission. Trust to design systems independently. A team that values meaningful order."},
    dalam_memimpin:{
      id:['Tata Reka memimpin dengan keyakinan bahwa sistem yang baik adalah cara paling konsisten untuk mewujudkan nilai. Mereka adalah pemimpin yang tidak terpisahkan antara \'apa yang kita percaya\' dan \'bagaimana kita bekerja setiap hari.\' Gaya kepemimpinan mereka cohesive dan purpose-driven. Sebagai pemimpin, keputusan mereka hampir selalu berakar pada nilai dan apa yang terasa benar secara moral — bukan hanya apa yang paling efisien. Mereka menghargai tim yang mau saling mendukung dan percaya bahwa bekerja bersama dalam harmoni adalah fondasi dari hasil yang bermakna. Atasan yang mereka hormati adalah yang memimpin dengan integritas, bukan sekadar dengan otoritas.','Tantangan: memimpin di organisasi yang sistemnya korup atau tidak sejalan dengan nilai — mereka perlu kemampuan untuk bergerak dalam keterbatasan sambil tetap menjaga integritas.'],
      en:['Tata Reka memimpin dengan keyakinan bahwa sistem yang baik adalah cara paling konsisten untuk mewujudkan nilai. Mereka adalah pemimpin yang tidak terpisahkan antara \'apa yang kita percaya\' dan \'bagaimana kita bekerja setiap hari.\' Gaya kepemimpinan mereka cohesive dan purpose-driven. Sebagai pemimpin, keputusan mereka hampir selalu berakar pada nilai dan apa yang terasa benar secara moral — bukan hanya apa yang paling efisien. Mereka menghargai tim yang mau saling mendukung dan percaya bahwa bekerja bersama dalam harmoni adalah fondasi dari hasil yang bermakna. Atasan yang mereka hormati adalah yang memimpin dengan integritas, bukan sekadar dengan otoritas.','Tantangan: memimpin di organisasi yang sistemnya korup atau tidak sejalan dengan nilai — mereka perlu kemampuan untuk bergerak dalam keterbatasan sambil tetap menjaga integritas.']},
    dalam_bersosialisasi:{
      id:'Mereka membangun relasi yang didasari oleh nilai yang sama. Tidak mudah membuka diri, tapi dalam lingkaran yang dipercaya mereka sangat tulus dan konsisten. Dalam komunitas yang mereka yakini, mereka adalah kontributor yang sangat bisa diandalkan.',
      en:'Mereka membangun relasi yang didasari oleh nilai yang sama. Tidak mudah membuka diri, tapi dalam lingkaran yang dipercaya mereka sangat tulus dan konsisten. Dalam komunitas yang mereka yakini, mereka adalah kontributor yang sangat bisa diandalkan.'},
    saran_perkembangan:{
      pembuka:{id:'Tata Reka memastikan yang penting tidak terlewat — dan pengembangan terbaik adalah yang membuka kapasitas untuk melakukan itu di skala yang lebih besar dan dengan pengaruh yang lebih strategis.',en:'Tata Reka memastikan yang penting tidak terlewat — dan pengembangan terbaik adalah yang membuka kapasitas untuk melakukan itu di skala yang lebih besar dan dengan pengaruh yang lebih strategis.'},
      skills:{id:['Knowledge management systems (KM, SharePoint, Confluence) untuk profesi Knowledge Management Specialist','Information architecture dan content strategy untuk profesi Information Architect','Chief of Staff competencies: mengelola agenda eksekutif dan menerjemahkan visi menjadi rencana operasional','Process design dan standard operating procedure (SOP) development','Organizational values integration: memastikan nilai-nilai hidup dalam sistem dan prosedur sehari-hari','Facilitation dan workshop design untuk mengimplementasikan perubahan sistem bersama tim'],en:['Knowledge management systems (KM, SharePoint, Confluence) for Knowledge Management Specialist','Information architecture and content strategy for Information Architect','Chief of Staff competencies: managing executive agenda and translating vision into operational plans','Process design and standard operating procedure (SOP) development','Organisational values integration: ensuring values live in daily systems and procedures','Facilitation and workshop design for implementing system changes with a team']}},
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
      en:"An organization with real problems needing systemic solutions. Authority to change, not just recommend. An environment that values improvement over compliance."},
    dalam_memimpin:{
      id:['Tata Logika memimpin dengan diagnosis yang tajam dan solusi yang tidak bisa dibantah logikanya. Dalam proyek transformasi, mereka adalah yang paling cepat melihat di mana energi organisasi bocor dan paling credible dalam menawarkan solusi alternatif. Sebagai pemimpin, mereka mengutamakan efektivitas dan kompetensi di atas segalanya — dan mengharapkan hal yang sama dari tim mereka. Yang membuat mereka paling hidup dalam kepemimpinan adalah ketika ada tantangan nyata yang belum ada jawabannya: tim yang bisa diajak berpikir keras, masalah yang membutuhkan solusi baru, dan lingkungan yang menghargai kapasitas lebih dari jabatan.','Tantangan: resistance to change dari orang-orang yang merasa terancam oleh perbaikan yang mereka usulkan — dan kemampuan mengelola dinamika ini dengan empati.'],
      en:['Tata Logika memimpin dengan diagnosis yang tajam dan solusi yang tidak bisa dibantah logikanya. Dalam proyek transformasi, mereka adalah yang paling cepat melihat di mana energi organisasi bocor dan paling credible dalam menawarkan solusi alternatif. Sebagai pemimpin, mereka mengutamakan efektivitas dan kompetensi di atas segalanya — dan mengharapkan hal yang sama dari tim mereka. Yang membuat mereka paling hidup dalam kepemimpinan adalah ketika ada tantangan nyata yang belum ada jawabannya: tim yang bisa diajak berpikir keras, masalah yang membutuhkan solusi baru, dan lingkungan yang menghargai kapasitas lebih dari jabatan.','Tantangan: resistance to change dari orang-orang yang merasa terancam oleh perbaikan yang mereka usulkan — dan kemampuan mengelola dinamika ini dengan empati.']},
    dalam_bersosialisasi:{
      id:'Mereka adalah orang yang sangat dihargai dalam percakapan profesional karena diagnosis mereka selalu tajam dan relevan. Dalam lingkaran sosial, perspektif mereka sangat ditunggu oleh orang yang sudah mengenal cara berpikir mereka. Membangun kepercayaan butuh waktu, tapi sangat solid sekali terbentuk.',
      en:'Mereka adalah orang yang sangat dihargai dalam percakapan profesional karena diagnosis mereka selalu tajam dan relevan. Dalam lingkaran sosial, perspektif mereka sangat ditunggu oleh orang yang sudah mengenal cara berpikir mereka. Membangun kepercayaan butuh waktu, tapi sangat solid sekali terbentuk.'},
    saran_perkembangan:{
      pembuka:{id:'Tata Logika melihat apa yang tidak terlihat orang lain — dan pengembangan terbaik adalah yang memastikan solusi yang mereka temukan benar-benar diimplementasikan, bukan hanya diapresiasi di atas kertas.',en:'Tata Logika melihat apa yang tidak terlihat orang lain — dan pengembangan terbaik adalah yang memastikan solusi yang mereka temukan benar-benar diimplementasikan, bukan hanya diapresiasi di atas kertas.'},
      skills:{id:['Business process management certification (CBAP, Lean Six Sigma Green/Black Belt)','Digital transformation strategy dan change management untuk profesi Digital Transformation Lead','ERP systems dan enterprise architecture untuk profesi Business Process Manager','Management consulting frameworks: structured problem solving, hypothesis-driven analysis','Organizational change management (Prosci, Kotter) untuk mengimplementasikan transformasi dengan resistansi minimal','Executive communication: menyampaikan diagnosis sistemik kepada pemimpin senior dengan cara yang menggerakkan tindakan'],en:['Business process management certification (CBAP, Lean Six Sigma Green/Black Belt)','Digital transformation strategy and change management for Digital Transformation Lead','ERP systems and enterprise architecture for Business Process Manager','Management consulting frameworks: structured problem solving, hypothesis-driven analysis','Organisational change management (Prosci, Kotter) for transformation with minimal resistance','Executive communication: presenting systemic diagnosis to senior leaders in a way that drives action']}},
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
      en:"A clear role with consistent expectations. Work that produces measurable output. An environment that values accuracy and reliability."},
    dalam_memimpin:{
      id:['Tata Jaga memimpin dengan keandalan yang tidak tertandingi dan kemampuan membuat semua orang tahu persis apa yang diharapkan. Tim mereka beroperasi dengan kepastian dan kejelasan yang sangat menenangkan — terutama di lingkungan yang penuh perubahan eksternal. Sebagai pemimpin, sebagian dari mereka memimpin dengan nilai dan norma yang jelas — membangun tim yang saling menghargai dan berkomitmen pada standar bersama. Sebagian lagi memimpin dengan efisiensi dan ekspektasi kinerja yang terukur, menghargai tim yang kompeten dan produktif. Keduanya berbagi keyakinan yang sama: bahwa kepemimpinan yang baik adalah kepemimpinan yang bisa diandalkan.','Tantangan: merespons inovasi atau peluang baru yang membutuhkan fleksibilitas yang tidak natural bagi mereka.'],
      en:['Tata Jaga memimpin dengan keandalan yang tidak tertandingi dan kemampuan membuat semua orang tahu persis apa yang diharapkan. Tim mereka beroperasi dengan kepastian dan kejelasan yang sangat menenangkan — terutama di lingkungan yang penuh perubahan eksternal. Sebagai pemimpin, sebagian dari mereka memimpin dengan nilai dan norma yang jelas — membangun tim yang saling menghargai dan berkomitmen pada standar bersama. Sebagian lagi memimpin dengan efisiensi dan ekspektasi kinerja yang terukur, menghargai tim yang kompeten dan produktif. Keduanya berbagi keyakinan yang sama: bahwa kepemimpinan yang baik adalah kepemimpinan yang bisa diandalkan.','Tantangan: merespons inovasi atau peluang baru yang membutuhkan fleksibilitas yang tidak natural bagi mereka.']},
    dalam_bersosialisasi:{
      id:'Mereka adalah anggota komunitas yang paling dapat diandalkan — selalu hadir, selalu menepati komitmen, selalu menjaga kepercayaan. Kehadiran mereka memberikan stabilitas yang sangat berharga bagi lingkaran sosialnya.',
      en:'Mereka adalah anggota komunitas yang paling dapat diandalkan — selalu hadir, selalu menepati komitmen, selalu menjaga kepercayaan. Kehadiran mereka memberikan stabilitas yang sangat berharga bagi lingkaran sosialnya.'},
    saran_perkembangan:{
      pembuka:{id:'Tata Jaga adalah penjaga kepastian di dunia yang penuh ketidakpastian — dan pengembangan terbaik adalah yang mempertajam spesialisasi itu sampai menjadi aset yang tidak tergantikan.',en:'Tata Jaga adalah penjaga kepastian di dunia yang penuh ketidakpastian — dan pengembangan terbaik adalah yang mempertajam spesialisasi itu sampai menjadi aset yang tidak tergantikan.'},
      skills:{id:['CPA, CFA, atau actuarial certification untuk profesi Financial Controller, CFO, atau Actuary','Compliance management dan regulatory frameworks untuk profesi Compliance Officer atau Auditor','Database administration dan data governance untuk profesi Database Administrator','Risk assessment dan internal control design untuk profesi Operations Analyst','Financial reporting dan IFRS/GAAP compliance untuk profesi di industri keuangan','Communicating reliability: mengkomunikasikan nilai dari keandalan kepada pemimpin yang berorientasi inovasi'],en:['CPA, CFA, or actuarial certification for Financial Controller, CFO, or Actuary roles','Compliance management and regulatory frameworks for Compliance Officer or Auditor','Database administration and data governance for Database Administrator','Risk assessment and internal control design for Operations Analyst','Financial reporting and IFRS/GAAP compliance for finance industry roles','Communicating reliability: articulating the value of dependability to innovation-oriented leaders']}},
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
      en:"An environment with clear structure but flexible enough for tactical improvisation. Visible and measurable output. Autonomy in determining the best way to reach targets."},
    dalam_memimpin:{
      id:['Tata Guna memimpin dengan efisiensi yang adaptif — mereka tahu cara mencapai target melalui jalan yang paling efektif, dan cukup fleksibel untuk menyesuaikan rute tanpa kehilangan tujuan. Di tim operasional, mereka adalah yang paling efektif menyelesaikan masalah yang tidak sepenuhnya sesuai prosedur standar. Sebagai pemimpin, sebagian dari mereka memimpin dengan semangat dan kehangatan — mendorong kebersamaan dan memastikan tidak ada yang merasa tertinggal. Sebagian lagi memimpin dengan fokus pada tantangan yang menarik — mendorong tim untuk menemukan solusi paling efektif di lapangan. Keduanya berbagi pendekatan yang sama: memimpin dengan hadir sepenuhnya, bukan dengan instruksi dari balik meja.','Tantangan: mendokumentasikan proses yang mereka kembangkan agar bisa direplikasi oleh orang lain.'],
      en:['Tata Guna memimpin dengan efisiensi yang adaptif — mereka tahu cara mencapai target melalui jalan yang paling efektif, dan cukup fleksibel untuk menyesuaikan rute tanpa kehilangan tujuan. Di tim operasional, mereka adalah yang paling efektif menyelesaikan masalah yang tidak sepenuhnya sesuai prosedur standar. Sebagai pemimpin, sebagian dari mereka memimpin dengan semangat dan kehangatan — mendorong kebersamaan dan memastikan tidak ada yang merasa tertinggal. Sebagian lagi memimpin dengan fokus pada tantangan yang menarik — mendorong tim untuk menemukan solusi paling efektif di lapangan. Keduanya berbagi pendekatan yang sama: memimpin dengan hadir sepenuhnya, bukan dengan instruksi dari balik meja.','Tantangan: mendokumentasikan proses yang mereka kembangkan agar bisa direplikasi oleh orang lain.']},
    dalam_bersosialisasi:{
      id:'Mereka mudah bergaul dan sangat praktis dalam bantuan yang diberikan — bukan tipe yang banyak memberi kata-kata dukungan, tapi langsung membantu menyelesaikan masalah yang ada. Dalam lingkaran sosial, mereka diingat karena selalu ada ketika ada sesuatu yang perlu diselesaikan.',
      en:'Mereka mudah bergaul dan sangat praktis dalam bantuan yang diberikan — bukan tipe yang banyak memberi kata-kata dukungan, tapi langsung membantu menyelesaikan masalah yang ada. Dalam lingkaran sosial, mereka diingat karena selalu ada ketika ada sesuatu yang perlu diselesaikan.'},
    saran_perkembangan:{
      pembuka:{id:'Tata Guna adalah eksekutor terbaik di kondisi apapun — dan pengembangan terbaik adalah yang memformalkan keahlian praktis itu menjadi kompetensi yang diakui dan bisa diajarkan.',en:'Tata Guna adalah eksekutor terbaik di kondisi apapun — dan pengembangan terbaik adalah yang memformalkan keahlian praktis itu menjadi kompetensi yang diakui dan bisa diajarkan.'},
      skills:{id:['Project management certification (PMP, PRINCE2, atau Agile/Scrum) untuk profesi Project Coordinator atau PMO Staff','Logistics dan supply chain management untuk profesi Logistics Coordinator','Financial analysis dan Excel modeling tingkat lanjut untuk profesi Financial Analyst','Operations research dan process optimization untuk mempercepat eksekusi yang sudah efisien','Executive assistant competencies: manajemen prioritas, komunikasi eksekutif, dan koordinasi multi-stakeholder','Documentation dan SOP writing: mengubah intuisi operasional menjadi sistem yang bisa diajarkan'],en:['Project management certification (PMP, PRINCE2, or Agile/Scrum) for Project Coordinator or PMO Staff','Logistics and supply chain management for Logistics Coordinator','Advanced financial analysis and Excel modelling for Financial Analyst','Operations research and process optimisation to accelerate already efficient execution','Executive assistant competencies: priority management, executive communication, multi-stakeholder coordination','Documentation and SOP writing: turning operational intuition into teachable systems']}},
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
  <div class="field-group">
    <label class="field-label">${L?'Kode Batch (opsional)':'Batch Code (optional)'}</label>
    <input class="field-input" type="text" id="f-batch" placeholder="—">
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
  const mbtiType=(sc.E>=sc.I?'E':'I')+(sc.N>=sc.S?'N':'S')+(sc.T>=sc.F?'T':'F')+(sc.J>=sc.P?'J':'P');
  const WATAK_MAP={INFJ:'Reka',INFP:'Reka',ENFJ:'Reka',ENFP:'Reka',INTJ:'Logika',INTP:'Logika',ENTJ:'Logika',ENTP:'Logika',ISTJ:'Jaga',ISFJ:'Jaga',ESTJ:'Jaga',ESFJ:'Jaga',ISTP:'Guna',ISFP:'Guna',ESTP:'Guna',ESFP:'Guna'};
  const watak=WATAK_MAP[mbtiType]||'Reka';
  const dims={
    arus:   {label:sc.E>=sc.I?'Arus Luar':'Arus Dalam',    pct:dimPct(sc.E,sc.I)},
    pandang:{label:sc.N>=sc.S?'Pandang Luas':'Pandang Nyata',pct:dimPct(sc.N,sc.S)},
    timbang:{label:sc.T>=sc.F?'Timbang Logika':'Timbang Rasa',pct:dimPct(sc.T,sc.F)},
    irama:  {label:sc.J>=sc.P?'Irama Pasti':'Irama Bebas',  pct:dimPct(sc.J,sc.P)},
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
  const batch  =document.getElementById('f-batch')?.value.trim()||'general';

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

  // ── Paraga name & sub ──
  document.getElementById('r-name').textContent = p.en;
  document.getElementById('r-sub').textContent  =
    `${kelompok1} ${watak} · ${L?'dengan nuansa':'with a touch of'} ${kelompok2}`;

  // ── Tags ──
  const tagsEl = document.getElementById('r-tags');
  tagsEl.innerHTML = p.tags.map((t,i)=>
    `<span class="rtag ${p.tagClasses[i]||'rtag-grey'}">${t}</span>`
  ).join('');

  // ── Good Fit badge ──
  const goodFitEl = document.getElementById('r-good-fit');
  if (goodFitEl) {
    const gfLbl = L ? 'Good Fit' : 'Good Fit';
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

  // ── Dalam Memimpin — 2 paragraf ──
  const memEl = document.getElementById('r-dalam-memimpin');
  if (memEl && p.dalam_memimpin) {
    const parts = L ? p.dalam_memimpin.id : p.dalam_memimpin.en;
    memEl.innerHTML = parts.map(t=>`<p class="result-text" style="margin-bottom:.75rem">${t}</p>`).join('');
  }

  // ── Dalam Bersosialisasi ──
  const sosEl = document.getElementById('r-dalam-bersosialisasi');
  if (sosEl && p.dalam_bersosialisasi) {
    sosEl.textContent = L ? p.dalam_bersosialisasi.id : p.dalam_bersosialisasi.en;
  }

  // ── Saran Perkembangan ──
  const saranEl = document.getElementById('r-saran-perkembangan');
  if (saranEl && p.saran_perkembangan) {
    const pembuka = L ? p.saran_perkembangan.pembuka.id : p.saran_perkembangan.pembuka.en;
    const skills  = L ? p.saran_perkembangan.skills.id  : p.saran_perkembangan.skills.en;
    const skillLabel = L ? 'Skill yang perlu dikembangkan:' : 'Skills to develop:';
    saranEl.innerHTML = `
      <p class="result-text" style="margin-bottom:1rem">${pembuka}</p>
      <p class="result-section-sub">${skillLabel}</p>
      <ul class="strength-list">
        ${skills.map(s=>`<li class="strength-item">${s}</li>`).join('')}
      </ul>`;
  }

  // ── MBTI dimension bars ──
  const barsEl = document.getElementById('dim-bars');
  if (barsEl) {
    barsEl.innerHTML = [
      ['Arus',score.dims.arus],
      ['Pandang',score.dims.pandang],
      ['Timbang',score.dims.timbang],
      ['Irama',score.dims.irama],
    ].map(([,d])=>`
      <div class="dim-row">
        <div class="dim-label">${d.label}</div>
        <div class="dim-track"><div class="dim-fill" style="width:${d.pct}%"></div></div>
        <div class="dim-pct">${d.pct}%</div>
      </div>`).join('');
  }

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
