export type Category = 'Prewedding' | 'Akad' | 'Resepsi' | 'Engagement';

export interface PortfolioItem {
  id: number;
  title: string;
  category: Category;
  imageUrl: string;
  width: number;
  height: number;
}

export interface Package {
  id: number;
  name: string;
  price: string;
  priceNote: string;
  features: string[];
  highlight: boolean;
}

export interface Testimonial {
  id: number;
  name: string;
  eventType: string;
  content: string;
  location: string;
}

export const portfolioItems: PortfolioItem[] = [
  { id: 1, title: 'Momen Tenang di Tepi Sawah', category: 'Prewedding', imageUrl: 'https://picsum.photos/seed/pw1/800/1000', width: 800, height: 1000 },
  { id: 2, title: 'Cahaya Senja yang Hangat', category: 'Prewedding', imageUrl: 'https://picsum.photos/seed/pw2/800/1000', width: 800, height: 1000 },
  { id: 3, title: 'Berdua di Antara Bunga', category: 'Prewedding', imageUrl: 'https://picsum.photos/seed/pw3/1200/800', width: 1200, height: 800 },
  { id: 4, title: 'Sakral dan Khidmat', category: 'Akad', imageUrl: 'https://picsum.photos/seed/akad1/800/1000', width: 800, height: 1000 },
  { id: 5, title: 'Senyum di Hari Ijab Kabul', category: 'Akad', imageUrl: 'https://picsum.photos/seed/akad2/1200/800', width: 1200, height: 800 },
  { id: 6, title: 'Momen Cincin Pernikahan', category: 'Akad', imageUrl: 'https://picsum.photos/seed/akad3/800/1000', width: 800, height: 1000 },
  { id: 7, title: 'Pesta yang Meriah', category: 'Resepsi', imageUrl: 'https://picsum.photos/seed/res1/1200/800', width: 1200, height: 800 },
  { id: 8, title: 'Tawa dan Kebahagiaan', category: 'Resepsi', imageUrl: 'https://picsum.photos/seed/res2/800/1000', width: 800, height: 1000 },
  { id: 9, title: 'Meja Makan Penuh Cinta', category: 'Resepsi', imageUrl: 'https://picsum.photos/seed/res3/1200/800', width: 1200, height: 800 },
  { id: 10, title: 'Cincin Berkilau', category: 'Engagement', imageUrl: 'https://picsum.photos/seed/eng1/800/1000', width: 800, height: 1000 },
  { id: 11, title: 'Lamaran yang Tak Terlupakan', category: 'Engagement', imageUrl: 'https://picsum.photos/seed/eng2/1200/800', width: 1200, height: 800 },
  { id: 12, title: 'Janji di Bawah Bintang', category: 'Engagement', imageUrl: 'https://picsum.photos/seed/eng3/800/1000', width: 800, height: 1000 },
];

export const packages: Package[] = [
  {
    id: 1,
    name: 'Basic',
    price: 'Rp 5.000.000',
    priceNote: 'per sesi',
    highlight: false,
    features: [
      '4 jam dokumentasi',
      '100 foto hasil edit',
      '1 fotografer profesional',
      'Soft file resolusi tinggi',
      'Galeri online private',
    ],
  },
  {
    id: 2,
    name: 'Premium',
    price: 'Rp 8.500.000',
    priceNote: 'per hari',
    highlight: true,
    features: [
      '8 jam dokumentasi',
      '250 foto hasil edit',
      '2 fotografer profesional',
      'Album cetak 20 lembar premium',
      'Soft file resolusi tinggi',
      'Galeri online private',
      'Konsultasi pra-acara',
    ],
  },
  {
    id: 3,
    name: 'Exclusive',
    price: 'Rp 15.000.000',
    priceNote: 'full day',
    highlight: false,
    features: [
      'Full day dokumentasi',
      'Foto tidak terbatas',
      '2 fotografer + 1 asisten',
      'Album premium 40 lembar',
      'Soft file resolusi tinggi',
      'Galeri online private',
      'Same-day-edit highlights',
      'Konsultasi & site visit',
      'Cetak foto pilihan A3',
    ],
  },
];

export const testimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Rina & Bima',
    eventType: 'Prewedding',
    content: 'Fenoma benar-benar menangkap momen kami dengan indah. Setiap foto terasa hidup dan penuh emosi. Kami sangat puas!',
    location: 'Yogyakarta',
  },
  {
    id: 2,
    name: 'Sari & Dani',
    eventType: 'Wedding Akad',
    content: 'Tim Fenoma sangat profesional dan ramah. Mereka tidak terasa mengganggu tapi hasilnya luar biasa. Terima kasih!',
    location: 'Jakarta',
  },
  {
    id: 3,
    name: 'Maya & Rafi',
    eventType: 'Resepsi',
    content: 'Dari dekorasi hingga tawa tamu, semua terabadikan dengan sempurna. Album kami jadi kenangan terindah.',
    location: 'Bandung',
  },
  {
    id: 4,
    name: 'Dita & Aryo',
    eventType: 'Engagement',
    content: 'Sesi lamaran kami jadi sangat berkesan berkat Fenoma. Foto-fotonya natural dan romantis sekali.',
    location: 'Surabaya',
  },
  {
    id: 5,
    name: 'Nisa & Fajar',
    eventType: 'Wedding Full Package',
    content: 'Kami memilih paket Exclusive dan tidak menyesal sama sekali. Same-day-edit highlights-nya membuat keluarga terharu.',
    location: 'Semarang',
  },
  {
    id: 6,
    name: 'Putri & Hendra',
    eventType: 'Prewedding',
    content: 'Fotografer Fenoma sangat sabar dan kreatif. Hasilnya melebihi ekspektasi kami. Wajib coba!',
    location: 'Bali',
  },
];
