// DIHASILKAN oleh scripts/bangun_data_ts.py dari solver. Harus sama dengan tabel `levels` di Supabase.
import type { Level } from './types.ts';

export const LEVELS: Level[] = [
  {
    "id": 1,
    "dunia": "rumah",
    "judul": "Dapur Mungil",
    "ukuranGrid": 6,
    "jumlahRintangan": 1,
    "langkahOptimal": 24,
    "waktuTargetDetik": 180,
    "config": {
      "robot": {
        "x": 1,
        "y": 1,
        "hadap": "kanan"
      },
      "sampah": [
        {
          "item": "kulit-pisang",
          "x": 2,
          "y": 3
        },
        {
          "item": "botol-plastik",
          "x": 2,
          "y": 2
        },
        {
          "item": "baterai-bekas",
          "x": 2,
          "y": 4
        }
      ],
      "tong": [
        {
          "x": 4,
          "y": 3,
          "jenis": "b3"
        },
        {
          "x": 2,
          "y": 5,
          "jenis": "organik"
        },
        {
          "x": 4,
          "y": 6,
          "jenis": "anorganik"
        }
      ],
      "rintangan": [
        {
          "x": 4,
          "y": 2
        }
      ],
      "finish": {
        "x": 6,
        "y": 6
      }
    }
  },
  {
    "id": 2,
    "dunia": "rumah",
    "judul": "Ruang Makan",
    "ukuranGrid": 6,
    "jumlahRintangan": 3,
    "langkahOptimal": 27,
    "waktuTargetDetik": 195,
    "config": {
      "robot": {
        "x": 1,
        "y": 1,
        "hadap": "kanan"
      },
      "sampah": [
        {
          "item": "sisa-nasi",
          "x": 3,
          "y": 1
        },
        {
          "item": "kaleng-minuman",
          "x": 4,
          "y": 2
        },
        {
          "item": "lampu-bekas",
          "x": 1,
          "y": 2
        }
      ],
      "tong": [
        {
          "x": 4,
          "y": 4,
          "jenis": "anorganik"
        },
        {
          "x": 6,
          "y": 4,
          "jenis": "organik"
        },
        {
          "x": 4,
          "y": 5,
          "jenis": "b3"
        }
      ],
      "rintangan": [
        {
          "x": 3,
          "y": 5
        },
        {
          "x": 2,
          "y": 4
        },
        {
          "x": 2,
          "y": 1
        }
      ],
      "finish": {
        "x": 6,
        "y": 6
      }
    }
  },
  {
    "id": 3,
    "dunia": "rumah",
    "judul": "Ruang Keluarga",
    "ukuranGrid": 6,
    "jumlahRintangan": 3,
    "langkahOptimal": 30,
    "waktuTargetDetik": 210,
    "config": {
      "robot": {
        "x": 1,
        "y": 1,
        "hadap": "kanan"
      },
      "sampah": [
        {
          "item": "kulit-telur",
          "x": 2,
          "y": 2
        },
        {
          "item": "kantong-plastik",
          "x": 4,
          "y": 2
        },
        {
          "item": "obat-kedaluwarsa",
          "x": 3,
          "y": 1
        }
      ],
      "tong": [
        {
          "x": 2,
          "y": 3,
          "jenis": "b3"
        },
        {
          "x": 1,
          "y": 6,
          "jenis": "organik"
        },
        {
          "x": 1,
          "y": 3,
          "jenis": "anorganik"
        }
      ],
      "rintangan": [
        {
          "x": 5,
          "y": 5
        },
        {
          "x": 5,
          "y": 3
        },
        {
          "x": 1,
          "y": 5
        }
      ],
      "finish": {
        "x": 6,
        "y": 6
      }
    }
  },
  {
    "id": 4,
    "dunia": "rumah",
    "judul": "Halaman Rumah",
    "ukuranGrid": 6,
    "jumlahRintangan": 4,
    "langkahOptimal": 31,
    "waktuTargetDetik": 215,
    "config": {
      "robot": {
        "x": 1,
        "y": 1,
        "hadap": "kanan"
      },
      "sampah": [
        {
          "item": "sayur-busuk",
          "x": 2,
          "y": 1
        },
        {
          "item": "gelas-plastik",
          "x": 5,
          "y": 1
        },
        {
          "item": "obat-nyamuk-semprot",
          "x": 6,
          "y": 2
        }
      ],
      "tong": [
        {
          "x": 4,
          "y": 3,
          "jenis": "organik"
        },
        {
          "x": 4,
          "y": 2,
          "jenis": "b3"
        },
        {
          "x": 4,
          "y": 6,
          "jenis": "anorganik"
        }
      ],
      "rintangan": [
        {
          "x": 3,
          "y": 1
        },
        {
          "x": 5,
          "y": 6
        },
        {
          "x": 6,
          "y": 4
        },
        {
          "x": 1,
          "y": 4
        }
      ],
      "finish": {
        "x": 6,
        "y": 6
      }
    }
  },
  {
    "id": 5,
    "dunia": "rumah",
    "judul": "Gudang Kecil",
    "ukuranGrid": 6,
    "jumlahRintangan": 5,
    "langkahOptimal": 33,
    "waktuTargetDetik": 225,
    "config": {
      "robot": {
        "x": 1,
        "y": 1,
        "hadap": "kanan"
      },
      "sampah": [
        {
          "item": "ampas-teh",
          "x": 4,
          "y": 3
        },
        {
          "item": "botol-kaca",
          "x": 2,
          "y": 3
        },
        {
          "item": "charger-rusak",
          "x": 5,
          "y": 3
        }
      ],
      "tong": [
        {
          "x": 6,
          "y": 5,
          "jenis": "anorganik"
        },
        {
          "x": 3,
          "y": 5,
          "jenis": "b3"
        },
        {
          "x": 2,
          "y": 4,
          "jenis": "organik"
        }
      ],
      "rintangan": [
        {
          "x": 3,
          "y": 4
        },
        {
          "x": 6,
          "y": 3
        },
        {
          "x": 2,
          "y": 5
        },
        {
          "x": 6,
          "y": 2
        },
        {
          "x": 1,
          "y": 3
        }
      ],
      "finish": {
        "x": 6,
        "y": 6
      }
    }
  },
  {
    "id": 6,
    "dunia": "sekolah",
    "judul": "Halaman Sekolah",
    "ukuranGrid": 6,
    "jumlahRintangan": 5,
    "langkahOptimal": 38,
    "waktuTargetDetik": 250,
    "config": {
      "robot": {
        "x": 1,
        "y": 1,
        "hadap": "kanan"
      },
      "sampah": [
        {
          "item": "daun-kering",
          "x": 3,
          "y": 4
        },
        {
          "item": "botol-minum-plastik",
          "x": 2,
          "y": 5
        },
        {
          "item": "baterai-jam-dinding",
          "x": 5,
          "y": 3
        }
      ],
      "tong": [
        {
          "x": 4,
          "y": 1,
          "jenis": "b3"
        },
        {
          "x": 4,
          "y": 4,
          "jenis": "anorganik"
        },
        {
          "x": 3,
          "y": 3,
          "jenis": "organik"
        }
      ],
      "rintangan": [
        {
          "x": 2,
          "y": 2
        },
        {
          "x": 2,
          "y": 3
        },
        {
          "x": 4,
          "y": 6
        },
        {
          "x": 6,
          "y": 5
        },
        {
          "x": 4,
          "y": 2
        }
      ],
      "finish": {
        "x": 6,
        "y": 6
      }
    }
  },
  {
    "id": 7,
    "dunia": "sekolah",
    "judul": "Kantin",
    "ukuranGrid": 6,
    "jumlahRintangan": 6,
    "langkahOptimal": 40,
    "waktuTargetDetik": 260,
    "config": {
      "robot": {
        "x": 1,
        "y": 1,
        "hadap": "kanan"
      },
      "sampah": [
        {
          "item": "sisa-bekal",
          "x": 5,
          "y": 4
        },
        {
          "item": "bungkus-jajan",
          "x": 4,
          "y": 2
        },
        {
          "item": "tinta-printer-bekas",
          "x": 4,
          "y": 3
        }
      ],
      "tong": [
        {
          "x": 1,
          "y": 3,
          "jenis": "b3"
        },
        {
          "x": 3,
          "y": 1,
          "jenis": "organik"
        },
        {
          "x": 5,
          "y": 3,
          "jenis": "anorganik"
        }
      ],
      "rintangan": [
        {
          "x": 4,
          "y": 4
        },
        {
          "x": 6,
          "y": 4
        },
        {
          "x": 1,
          "y": 4
        },
        {
          "x": 3,
          "y": 2
        },
        {
          "x": 6,
          "y": 2
        },
        {
          "x": 5,
          "y": 2
        }
      ],
      "finish": {
        "x": 6,
        "y": 6
      }
    }
  },
  {
    "id": 8,
    "dunia": "sekolah",
    "judul": "Ruang Kelas",
    "ukuranGrid": 6,
    "jumlahRintangan": 6,
    "langkahOptimal": 43,
    "waktuTargetDetik": 275,
    "config": {
      "robot": {
        "x": 1,
        "y": 1,
        "hadap": "kanan"
      },
      "sampah": [
        {
          "item": "kulit-jeruk",
          "x": 6,
          "y": 5
        },
        {
          "item": "kertas-bekas",
          "x": 6,
          "y": 3
        },
        {
          "item": "lampu-neon-bekas",
          "x": 5,
          "y": 3
        }
      ],
      "tong": [
        {
          "x": 5,
          "y": 5,
          "jenis": "organik"
        },
        {
          "x": 1,
          "y": 3,
          "jenis": "b3"
        },
        {
          "x": 4,
          "y": 5,
          "jenis": "anorganik"
        }
      ],
      "rintangan": [
        {
          "x": 4,
          "y": 3
        },
        {
          "x": 1,
          "y": 4
        },
        {
          "x": 2,
          "y": 3
        },
        {
          "x": 1,
          "y": 5
        },
        {
          "x": 3,
          "y": 6
        },
        {
          "x": 2,
          "y": 4
        }
      ],
      "finish": {
        "x": 6,
        "y": 6
      }
    }
  },
  {
    "id": 9,
    "dunia": "sekolah",
    "judul": "Taman Sekolah",
    "ukuranGrid": 6,
    "jumlahRintangan": 7,
    "langkahOptimal": 46,
    "waktuTargetDetik": 290,
    "config": {
      "robot": {
        "x": 1,
        "y": 1,
        "hadap": "kanan"
      },
      "sampah": [
        {
          "item": "rumput-potong",
          "x": 4,
          "y": 5
        },
        {
          "item": "penggaris-plastik",
          "x": 5,
          "y": 1
        },
        {
          "item": "kaleng-cat-bekas",
          "x": 4,
          "y": 6
        }
      ],
      "tong": [
        {
          "x": 1,
          "y": 6,
          "jenis": "b3"
        },
        {
          "x": 4,
          "y": 1,
          "jenis": "anorganik"
        },
        {
          "x": 2,
          "y": 3,
          "jenis": "organik"
        }
      ],
      "rintangan": [
        {
          "x": 1,
          "y": 2
        },
        {
          "x": 4,
          "y": 2
        },
        {
          "x": 6,
          "y": 2
        },
        {
          "x": 6,
          "y": 1
        },
        {
          "x": 3,
          "y": 6
        },
        {
          "x": 3,
          "y": 2
        },
        {
          "x": 1,
          "y": 4
        }
      ],
      "finish": {
        "x": 6,
        "y": 6
      }
    }
  },
  {
    "id": 10,
    "dunia": "sekolah",
    "judul": "Lab Komputer",
    "ukuranGrid": 6,
    "jumlahRintangan": 7,
    "langkahOptimal": 46,
    "waktuTargetDetik": 290,
    "config": {
      "robot": {
        "x": 1,
        "y": 1,
        "hadap": "kanan"
      },
      "sampah": [
        {
          "item": "sisa-sayur-kantin",
          "x": 3,
          "y": 5
        },
        {
          "item": "kotak-bekal-plastik",
          "x": 1,
          "y": 2
        },
        {
          "item": "mouse-komputer-rusak",
          "x": 6,
          "y": 2
        }
      ],
      "tong": [
        {
          "x": 4,
          "y": 2,
          "jenis": "organik"
        },
        {
          "x": 3,
          "y": 2,
          "jenis": "anorganik"
        },
        {
          "x": 6,
          "y": 4,
          "jenis": "b3"
        }
      ],
      "rintangan": [
        {
          "x": 5,
          "y": 2
        },
        {
          "x": 2,
          "y": 1
        },
        {
          "x": 3,
          "y": 4
        },
        {
          "x": 6,
          "y": 5
        },
        {
          "x": 4,
          "y": 5
        },
        {
          "x": 4,
          "y": 6
        },
        {
          "x": 5,
          "y": 1
        }
      ],
      "finish": {
        "x": 6,
        "y": 6
      }
    }
  },
  {
    "id": 11,
    "dunia": "hutan",
    "judul": "Jalan Setapak",
    "ukuranGrid": 6,
    "jumlahRintangan": 8,
    "langkahOptimal": 48,
    "waktuTargetDetik": 300,
    "config": {
      "robot": {
        "x": 1,
        "y": 1,
        "hadap": "kanan"
      },
      "sampah": [
        {
          "item": "daun-gugur",
          "x": 1,
          "y": 6
        },
        {
          "item": "botol-plastik",
          "x": 6,
          "y": 1
        },
        {
          "item": "baterai-senter-bekas",
          "x": 3,
          "y": 1
        }
      ],
      "tong": [
        {
          "x": 4,
          "y": 1,
          "jenis": "organik"
        },
        {
          "x": 4,
          "y": 6,
          "jenis": "b3"
        },
        {
          "x": 3,
          "y": 3,
          "jenis": "anorganik"
        }
      ],
      "rintangan": [
        {
          "x": 2,
          "y": 2
        },
        {
          "x": 3,
          "y": 5
        },
        {
          "x": 3,
          "y": 6
        },
        {
          "x": 6,
          "y": 5
        },
        {
          "x": 5,
          "y": 2
        },
        {
          "x": 2,
          "y": 6
        },
        {
          "x": 4,
          "y": 4
        },
        {
          "x": 1,
          "y": 3
        }
      ],
      "finish": {
        "x": 6,
        "y": 6
      }
    }
  },
  {
    "id": 12,
    "dunia": "hutan",
    "judul": "Tempat Berkemah",
    "ukuranGrid": 6,
    "jumlahRintangan": 8,
    "langkahOptimal": 51,
    "waktuTargetDetik": 315,
    "config": {
      "robot": {
        "x": 1,
        "y": 1,
        "hadap": "kanan"
      },
      "sampah": [
        {
          "item": "ranting-patah",
          "x": 3,
          "y": 5
        },
        {
          "item": "bungkus-camilan",
          "x": 2,
          "y": 2
        },
        {
          "item": "korek-gas-bekas",
          "x": 4,
          "y": 1
        }
      ],
      "tong": [
        {
          "x": 2,
          "y": 3,
          "jenis": "anorganik"
        },
        {
          "x": 6,
          "y": 1,
          "jenis": "b3"
        },
        {
          "x": 1,
          "y": 6,
          "jenis": "organik"
        }
      ],
      "rintangan": [
        {
          "x": 1,
          "y": 4
        },
        {
          "x": 4,
          "y": 6
        },
        {
          "x": 2,
          "y": 5
        },
        {
          "x": 4,
          "y": 5
        },
        {
          "x": 5,
          "y": 5
        },
        {
          "x": 6,
          "y": 3
        },
        {
          "x": 2,
          "y": 4
        },
        {
          "x": 3,
          "y": 1
        }
      ],
      "finish": {
        "x": 6,
        "y": 6
      }
    }
  },
  {
    "id": 13,
    "dunia": "hutan",
    "judul": "Tepi Sungai",
    "ukuranGrid": 6,
    "jumlahRintangan": 9,
    "langkahOptimal": 54,
    "waktuTargetDetik": 330,
    "config": {
      "robot": {
        "x": 1,
        "y": 1,
        "hadap": "kanan"
      },
      "sampah": [
        {
          "item": "buah-jatuh",
          "x": 3,
          "y": 2
        },
        {
          "item": "kaleng-sarden",
          "x": 6,
          "y": 2
        },
        {
          "item": "semprotan-serangga",
          "x": 6,
          "y": 5
        }
      ],
      "tong": [
        {
          "x": 4,
          "y": 1,
          "jenis": "b3"
        },
        {
          "x": 5,
          "y": 1,
          "jenis": "organik"
        },
        {
          "x": 3,
          "y": 3,
          "jenis": "anorganik"
        }
      ],
      "rintangan": [
        {
          "x": 1,
          "y": 5
        },
        {
          "x": 4,
          "y": 2
        },
        {
          "x": 6,
          "y": 1
        },
        {
          "x": 1,
          "y": 6
        },
        {
          "x": 5,
          "y": 5
        },
        {
          "x": 1,
          "y": 3
        },
        {
          "x": 2,
          "y": 4
        },
        {
          "x": 3,
          "y": 4
        },
        {
          "x": 6,
          "y": 4
        }
      ],
      "finish": {
        "x": 6,
        "y": 6
      }
    }
  },
  {
    "id": 14,
    "dunia": "hutan",
    "judul": "Hutan Lebat",
    "ukuranGrid": 6,
    "jumlahRintangan": 9,
    "langkahOptimal": 56,
    "waktuTargetDetik": 340,
    "config": {
      "robot": {
        "x": 1,
        "y": 1,
        "hadap": "kanan"
      },
      "sampah": [
        {
          "item": "kayu-lapuk",
          "x": 5,
          "y": 2
        },
        {
          "item": "tali-rafia",
          "x": 3,
          "y": 1
        },
        {
          "item": "oli-bekas",
          "x": 2,
          "y": 6
        }
      ],
      "tong": [
        {
          "x": 5,
          "y": 6,
          "jenis": "anorganik"
        },
        {
          "x": 2,
          "y": 3,
          "jenis": "organik"
        },
        {
          "x": 1,
          "y": 2,
          "jenis": "b3"
        }
      ],
      "rintangan": [
        {
          "x": 4,
          "y": 2
        },
        {
          "x": 5,
          "y": 1
        },
        {
          "x": 1,
          "y": 3
        },
        {
          "x": 6,
          "y": 5
        },
        {
          "x": 6,
          "y": 1
        },
        {
          "x": 3,
          "y": 3
        },
        {
          "x": 2,
          "y": 1
        },
        {
          "x": 4,
          "y": 5
        },
        {
          "x": 5,
          "y": 4
        }
      ],
      "finish": {
        "x": 6,
        "y": 6
      }
    }
  },
  {
    "id": 15,
    "dunia": "hutan",
    "judul": "Puncak Hutan",
    "ukuranGrid": 6,
    "jumlahRintangan": 10,
    "langkahOptimal": 60,
    "waktuTargetDetik": 360,
    "config": {
      "robot": {
        "x": 1,
        "y": 1,
        "hadap": "kanan"
      },
      "sampah": [
        {
          "item": "bunga-layu",
          "x": 4,
          "y": 1
        },
        {
          "item": "sedotan-plastik",
          "x": 1,
          "y": 3
        },
        {
          "item": "power-bank-rusak",
          "x": 5,
          "y": 4
        }
      ],
      "tong": [
        {
          "x": 2,
          "y": 1,
          "jenis": "b3"
        },
        {
          "x": 4,
          "y": 5,
          "jenis": "anorganik"
        },
        {
          "x": 2,
          "y": 3,
          "jenis": "organik"
        }
      ],
      "rintangan": [
        {
          "x": 5,
          "y": 5
        },
        {
          "x": 6,
          "y": 1
        },
        {
          "x": 4,
          "y": 2
        },
        {
          "x": 1,
          "y": 2
        },
        {
          "x": 5,
          "y": 3
        },
        {
          "x": 2,
          "y": 4
        },
        {
          "x": 2,
          "y": 5
        },
        {
          "x": 1,
          "y": 5
        },
        {
          "x": 6,
          "y": 5
        },
        {
          "x": 3,
          "y": 3
        }
      ],
      "finish": {
        "x": 6,
        "y": 6
      }
    }
  }
];

export function ambilLevel(id: number): Level | undefined {
  return LEVELS.find((l) => l.id === id);
}
