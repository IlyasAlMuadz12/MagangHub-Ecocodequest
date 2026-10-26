/**
 * Langkah-langkah tutorial: judul dan naskah suara dalam satu tempat, supaya tampilan dan suara selalu sejalan.
 * Naskah ditulis agar enak diucapkan mesin suara: angka dan singkatan dieja ("B tiga", "kolom satu"),
 * "EcoCode Quest" ditulis sesuai bunyinya, dan kalimatnya pendek.
 */
export interface LangkahTutorial {
  judul: string;
  narasi: string;
}

export const LANGKAH_TUTORIAL: LangkahTutorial[] = [
  {
    judul: 'Menyusun blok',
    narasi:
      'Selamat datang di Eko Kode Kwes! Di sini kamu menyusun blok perintah supaya robot bergerak. ' +
      'Blok Maju membuat robot melangkah satu petak. ' +
      'Blok Ambil mengambil sampah di petak yang sedang diinjak robot. Ambil semua sampah dulu ya. ' +
      'Blok Buang dipakai di petak tong. Nanti kamu diminta memilih sampah yang cocok. ' +
      'Blok Ulangi mengulang blok di dalamnya. ' +
      'Robot selalu mulai dari start di kiri atas, dan harus berakhir di finis di kanan bawah. ' +
      'Seret blok dari Kotak Blok ke Programmu, atau ketuk blok untuk menambahkannya.',
  },
  {
    judul: 'Jenis sampah',
    narasi:
      'Ada tiga jenis sampah. ' +
      'Sampah organik berasal dari makhluk hidup dan bisa membusuk. Contohnya kulit pisang, daun, dan sisa makanan. ' +
      'Sampah anorganik tidak mudah membusuk. Contohnya botol plastik, kaleng, kaca, dan kertas. ' +
      'Sampah B tiga berbahaya dan beracun. Contohnya baterai, lampu bekas, dan barang elektronik rusak.',
  },
  {
    judul: 'Warna tong sampah',
    narasi:
      'Setiap jenis sampah punya tong dengan warna sendiri. ' +
      'Tong hijau untuk sampah organik. Tong kuning untuk sampah anorganik. Tong merah untuk sampah B tiga. ' +
      'Saat membuang, kamu akan ditanya, sampah mana yang cocok dengan tong itu. Pilih dengan teliti ya!',
  },
  {
    judul: 'Arah robot',
    narasi:
      'Panah merah menunjukkan arah hadap robot. Maju selalu mengikuti arah panah. ' +
      'Awalnya robot menghadap kanan. Jadi maju berarti bergerak dari kolom satu ke kolom enam. ' +
      'Setelah blok Belok Kanan, robot menghadap ke bawah. Jadi maju berarti bergerak dari baris satu ke baris enam.',
  },
  {
    judul: 'Bintang',
    narasi:
      'Setiap level punya empat bintang nyawa. Kalau robot menabrak, atau salah membuang sampah, satu bintang berkurang. ' +
      'Kamu bisa mendapat sampai empat bintang. ' +
      'Satu bintang kalau misi selesai. Dua bintang kalau kamu memakai blok Ulangi. ' +
      'Tiga bintang kalau tanpa kesalahan. Empat bintang kalau langkahmu paling pendek dan tanpa kesalahan. ' +
      'Selamat bermain!',
  },
];
