export interface DefaultQACard {
  id: string;
  category: string;
  questionNumber: number;
  question: string;
  principle?: boolean;
}

export const QA_CATEGORIES = [
  'Visi, Agama & Ibadah',
  'Karier & Peran Istri',
  'Keuangan Rumah Tangga',
  'Tempat Tinggal Pascanikah',
  'Pola Asuh & Anak',
  'Keluarga & Batasan dengan Mertua',
  'Komunikasi & Konflik',
  'Kesehatan & Keluarga Sehat',
  'Gaya Hidup, Sosial & Masa Depan',
] as const;

export const DEFAULT_QA_CARDS: DefaultQACard[] = [
  // A. Visi, Agama & Ibadah
  {
    id: 'qa-1',
    category: 'Visi, Agama & Ibadah',
    questionNumber: 1,
    question: 'Apa tujuan utama Anda menikah, dan seperti apa rumah tangga ideal menurut Anda?',
    principle: true,
  },
  {
    id: 'qa-2',
    category: 'Visi, Agama & Ibadah',
    questionNumber: 2,
    question: 'Bagaimana pembagian peran suami dan istri dalam ibadah dan pembinaan keluarga?',
    principle: true,
  },
  {
    id: 'qa-3',
    category: 'Visi, Agama & Ibadah',
    questionNumber: 3,
    question: 'Seberapa penting kajian rutin/komunitas bagi Anda, dan bagaimana jika berbeda pandangan dengan pasangan?',
  },
  {
    id: 'qa-4',
    category: 'Visi, Agama & Ibadah',
    questionNumber: 4,
    question: 'Target ibadah apa yang ingin dicapai bersama (salat berjamaah, tilawah, hafalan, puasa sunnah)?',
  },
  {
    id: 'qa-5',
    category: 'Visi, Agama & Ibadah',
    questionNumber: 5,
    question: 'Bagaimana sikap Anda terhadap perbedaan amalan di keluarga besar?',
  },
  {
    id: 'qa-6',
    category: 'Visi, Agama & Ibadah',
    questionNumber: 6,
    question: 'Apa yang kita lakukan jika salah satu merasa imannya sedang menurun?',
  },

  // B. Karier & Peran Istri
  {
    id: 'qa-7',
    category: 'Karier & Peran Istri',
    questionNumber: 7,
    question: 'Bagaimana pandangan Anda tentang istri bekerja setelah menikah?',
    principle: true,
  },
  {
    id: 'qa-8',
    category: 'Karier & Peran Istri',
    questionNumber: 8,
    question: 'Jika istri bekerja, bagaimana pembagian tugas rumah dan pengasuhan?',
  },
  {
    id: 'qa-9',
    category: 'Karier & Peran Istri',
    questionNumber: 9,
    question: 'Jika suami diminta pindah kota/negara karena pekerjaan, bagaimana sikap Anda?',
  },
  {
    id: 'qa-10',
    category: 'Karier & Peran Istri',
    questionNumber: 10,
    question: 'Bagaimana pandangan tentang istri berbisnis atau berkarya dari rumah?',
  },
  {
    id: 'qa-11',
    category: 'Karier & Peran Istri',
    questionNumber: 11,
    question: 'Apakah istri tetap bekerja setelah punya anak? Sampai kapan?',
  },
  {
    id: 'qa-12',
    category: 'Karier & Peran Istri',
    questionNumber: 12,
    question: 'Bagaimana jika penghasilan istri lebih besar dari suami?',
  },
  {
    id: 'qa-13',
    category: 'Karier & Peran Istri',
    questionNumber: 13,
    question: 'Bagaimana pandangan tentang melanjutkan pendidikan (S2/S3) setelah menikah?',
  },

  // C. Keuangan Rumah Tangga
  {
    id: 'qa-14',
    category: 'Keuangan Rumah Tangga',
    questionNumber: 14,
    question: 'Siapa yang memegang dan mengatur keuangan rumah tangga?',
    principle: true,
  },
  {
    id: 'qa-15',
    category: 'Keuangan Rumah Tangga',
    questionNumber: 15,
    question: 'Berapa persen penghasilan untuk kebutuhan, tabungan, dan sedekah?',
  },
  {
    id: 'qa-16',
    category: 'Keuangan Rumah Tangga',
    questionNumber: 16,
    question: 'Bagaimana pandangan tentang nafkah suami dan penghasilan istri sebagai hak pribadinya?',
    principle: true,
  },
  {
    id: 'qa-17',
    category: 'Keuangan Rumah Tangga',
    questionNumber: 17,
    question: 'Bagaimana sikap Anda terhadap utang, paylater, dan cicilan?',
    principle: true,
  },
  {
    id: 'qa-18',
    category: 'Keuangan Rumah Tangga',
    questionNumber: 18,
    question: 'Apakah ada tanggungan finansial saat ini (orang tua, adik, cicilan) yang perlu saya ketahui?',
    principle: true,
  },
  {
    id: 'qa-19',
    category: 'Keuangan Rumah Tangga',
    questionNumber: 19,
    question: 'Bagaimana rencana dana darurat, asuransi, dan investasi?',
  },
  {
    id: 'qa-20',
    category: 'Keuangan Rumah Tangga',
    questionNumber: 20,
    question: 'Berapa batas pengeluaran yang wajib didiskusikan berdua?',
  },
  {
    id: 'qa-21',
    category: 'Keuangan Rumah Tangga',
    questionNumber: 21,
    question: 'Bagaimana pandangan tentang membantu keuangan orang tua dan saudara?',
  },

  // D. Tempat Tinggal Pascanikah
  {
    id: 'qa-22',
    category: 'Tempat Tinggal Pascanikah',
    questionNumber: 22,
    question: 'Setelah menikah, ingin tinggal mandiri, mengontrak, atau bersama orang tua?',
    principle: true,
  },
  {
    id: 'qa-23',
    category: 'Tempat Tinggal Pascanikah',
    questionNumber: 23,
    question: 'Jika awalnya tinggal bersama orang tua, sampai kapan dan apa batasannya?',
  },
  {
    id: 'qa-24',
    category: 'Tempat Tinggal Pascanikah',
    questionNumber: 24,
    question: 'Kota atau lokasi seperti apa yang diinginkan? Siapkah pindah?',
  },
  {
    id: 'qa-25',
    category: 'Tempat Tinggal Pascanikah',
    questionNumber: 25,
    question: 'Rencana memiliki rumah: KPR, menabung, atau sewa dulu?',
  },
  {
    id: 'qa-26',
    category: 'Tempat Tinggal Pascanikah',
    questionNumber: 26,
    question: 'Bagaimana pembagian tugas rumah tangga dan kebersihan?',
  },

  // E. Pola Asuh & Anak
  {
    id: 'qa-27',
    category: 'Pola Asuh & Anak',
    questionNumber: 27,
    question: 'Berapa jumlah anak yang diharapkan, dan bagaimana pandangan tentang jarak kelahiran?',
  },
  {
    id: 'qa-28',
    category: 'Pola Asuh & Anak',
    questionNumber: 28,
    question: 'Bagaimana sikap kita jika belum dikaruniai anak dalam waktu lama?',
  },
  {
    id: 'qa-29',
    category: 'Pola Asuh & Anak',
    questionNumber: 29,
    question: 'Bagaimana pandangan tentang KB, ASI, dan metode persalinan?',
  },
  {
    id: 'qa-30',
    category: 'Pola Asuh & Anak',
    questionNumber: 30,
    question: 'Pendidikan anak: sekolah umum, Islam terpadu, pesantren, atau homeschooling?',
  },
  {
    id: 'qa-31',
    category: 'Pola Asuh & Anak',
    questionNumber: 31,
    question: 'Gaya disiplin seperti apa yang kita sepakati (apresiasi, konsekuensi, batasan)?',
  },
  {
    id: 'qa-32',
    category: 'Pola Asuh & Anak',
    questionNumber: 32,
    question: 'Siapa yang mengasuh anak sehari-hari: orang tua, ART, daycare, atau salah satu dari kita?',
  },
  {
    id: 'qa-33',
    category: 'Pola Asuh & Anak',
    questionNumber: 33,
    question: 'Bagaimana aturan gadget dan screen time anak?',
  },
  {
    id: 'qa-34',
    category: 'Pola Asuh & Anak',
    questionNumber: 34,
    question: 'Nilai apa yang paling ingin kita wariskan kepada anak?',
  },

  // F. Keluarga & Batasan dengan Mertua
  {
    id: 'qa-35',
    category: 'Keluarga & Batasan dengan Mertua',
    questionNumber: 35,
    question: 'Seberapa sering kita mengunjungi keluarga masing-masing?',
  },
  {
    id: 'qa-36',
    category: 'Keluarga & Batasan dengan Mertua',
    questionNumber: 36,
    question: 'Sejauh mana orang tua/mertua boleh ikut campur dalam keputusan rumah tangga?',
    principle: true,
  },
  {
    id: 'qa-37',
    category: 'Keluarga & Batasan dengan Mertua',
    questionNumber: 37,
    question: 'Bagaimana menyikapi perbedaan pendapat dengan mertua atau ipar?',
  },
  {
    id: 'qa-38',
    category: 'Keluarga & Batasan dengan Mertua',
    questionNumber: 38,
    question: 'Bagaimana rencana jika orang tua membutuhkan perawatan di masa tua?',
  },
  {
    id: 'qa-39',
    category: 'Keluarga & Batasan dengan Mertua',
    questionNumber: 39,
    question: 'Bagaimana kita menjalani adat, tradisi, mudik, dan hajatan keluarga?',
  },
  {
    id: 'qa-40',
    category: 'Keluarga & Batasan dengan Mertua',
    questionNumber: 40,
    question: 'Siapa yang menjadi penengah saat ada konflik dengan keluarga besar?',
  },
  {
    id: 'qa-41',
    category: 'Keluarga & Batasan dengan Mertua',
    questionNumber: 41,
    question: 'Hal apa dalam rumah tangga yang tidak boleh dibagikan ke keluarga besar?',
    principle: true,
  },

  // G. Komunikasi & Konflik
  {
    id: 'qa-42',
    category: 'Komunikasi & Konflik',
    questionNumber: 42,
    question: 'Bagaimana cara Anda menyampaikan kekecewaan, dan cara terbaik pasangan menyikapinya?',
  },
  {
    id: 'qa-43',
    category: 'Komunikasi & Konflik',
    questionNumber: 43,
    question: 'Apa yang Anda lakukan saat marah, dan berapa lama jeda sebelum kita berdiskusi?',
  },
  {
    id: 'qa-44',
    category: 'Komunikasi & Konflik',
    questionNumber: 44,
    question: 'Siapa pihak ketiga (murabbi/konselor) yang kita sepakati bila buntu?',
  },
  {
    id: 'qa-45',
    category: 'Komunikasi & Konflik',
    questionNumber: 45,
    question: 'Bagaimana kesepakatan soal keterbukaan (HP, media sosial, keuangan)?',
    principle: true,
  },
  {
    id: 'qa-46',
    category: 'Komunikasi & Konflik',
    questionNumber: 46,
    question: 'Apa “bahasa kasih” Anda?',
  },
  {
    id: 'qa-47',
    category: 'Komunikasi & Konflik',
    questionNumber: 47,
    question: 'Apa batas yang tidak boleh dilewati dalam berselisih (kekerasan, kata kasar, mengungkit masa lalu)?',
    principle: true,
  },

  // H. Kesehatan & Keluarga Sehat
  {
    id: 'qa-48',
    category: 'Kesehatan & Keluarga Sehat',
    questionNumber: 48,
    question: 'Bersediakah menjalani pemeriksaan kesehatan pranikah lengkap bersama?',
    principle: true,
  },
  {
    id: 'qa-49',
    category: 'Kesehatan & Keluarga Sehat',
    questionNumber: 49,
    question: 'Bagaimana pandangan Anda tentang konseling atau psikolog bila dibutuhkan?',
  },
  {
    id: 'qa-50',
    category: 'Kesehatan & Keluarga Sehat',
    questionNumber: 50,
    question: 'Bagaimana kebiasaan hidup sehat Anda (olahraga, makan, merokok/vape)?',
    principle: true,
  },
  {
    id: 'qa-51',
    category: 'Kesehatan & Keluarga Sehat',
    questionNumber: 51,
    question: 'Bagaimana harapan dan adab dalam hubungan suami istri, dan bagaimana membicarakannya dengan nyaman?',
  },
  {
    id: 'qa-52',
    category: 'Kesehatan & Keluarga Sehat',
    questionNumber: 52,
    question: 'Bagaimana sikap kita bila salah satu sakit dalam jangka panjang?',
  },

  // I. Gaya Hidup, Sosial & Masa Depan
  {
    id: 'qa-53',
    category: 'Gaya Hidup, Sosial & Masa Depan',
    questionNumber: 53,
    question: 'Bagaimana batas pergaulan dengan lawan jenis dan etika bermedia sosial (foto, privasi)?',
    principle: true,
  },
  {
    id: 'qa-54',
    category: 'Gaya Hidup, Sosial & Masa Depan',
    questionNumber: 54,
    question: 'Berapa waktu pribadi atau hobi yang dibutuhkan masing-masing?',
  },
  {
    id: 'qa-55',
    category: 'Gaya Hidup, Sosial & Masa Depan',
    questionNumber: 55,
    question: 'Bagaimana gaya hidup yang diinginkan (liburan, hiburan, belanja, kuliner)?',
  },
  {
    id: 'qa-56',
    category: 'Gaya Hidup, Sosial & Masa Depan',
    questionNumber: 56,
    question: 'Apa impian 5 dan 10 tahun ke depan, dan bagaimana kita saling mendukung?',
  },
  {
    id: 'qa-57',
    category: 'Gaya Hidup, Sosial & Masa Depan',
    questionNumber: 57,
    question: 'Hal apa yang bagi Anda tidak dapat ditawar (dealbreaker)?',
    principle: true,
  },
];
