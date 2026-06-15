const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Membuka Google Form...');
  await page.goto('https://docs.google.com/forms/d/e/1FAIpQLSfhRG7z4jJ0hCrbZ8TockXg6NnLiqkmVW-uEHjBtyU8BrhIcw/viewform');
  await page.waitForTimeout(3000);

  // Halaman 1 - Data Diri
  console.log('Halaman 1: Data diri...');
  const inputs = await page.locator('input[type="text"], input[type="email"]').all();
  for (const input of inputs) {
    const label = await input.getAttribute('aria-label') || '';
    if (label.toLowerCase().includes('email')) await input.fill('collectionammar9@gmail.com');
    else if (label.toLowerCase().includes('nama')) await input.fill('AMMAAR AL FAUZAN');
    else if (label.toLowerCase().includes('nim')) await input.fill('240290343028');
  }
  await page.locator('text=Ikhwan').click();
  await page.waitForTimeout(500);
  await page.click('text=Berikutnya');
  await page.waitForTimeout(2000);

  // Halaman 2 - Materi + konfirmasi
  console.log('Halaman 2: Pilih Ya...');
  await page.locator('text=Ya').click();
  await page.waitForTimeout(500);
  await page.click('text=Berikutnya');
  await page.waitForTimeout(2000);

  // Halaman 3 - Soal
  console.log('Halaman 3: Mengisi jawaban...');
  const jawaban = [
    'Cost-Based Pricing',
    'Integrated Marketing Communication (IMC)',
    'Analisis terhadap kekuatan dan kelemahan internal perusahaan, serta peluang dan ancaman eksternal yang dihadapi perusahaan',
    'Riset Sekunder',
    'Memaksimalkan keuntungan',
    'Menyelaraskan nilai (value) produk dengan kebutuhan spesifik target pasar',
    'Riset Primer',
    'Memastikan sistem unduhan otomatis berjalan instan, aman, dan tanpa kendala setelah pembayaran berhasil',
    'Value-Based Pricing',
    'Perantara atau Saluran Distribusi Tidak Langsung',
    'Mengubah model harga menjadi Value-Based Pricing (menaikkan harga secara signifikan untuk mengubah persepsi kualitas), mereposisi User Persona ke segmen korporat (B2B enterprise), dan menerapkan strategi Integrated Marketing Communication (IMC) yang berfokus pada efisiensi waktu kerja (ROI & case studies) melalui LinkedIn.',
    'Pemrosesan',
    'Proses menunjukkan keunikan produk dibandingkan dengan pesaing',
    'Proposisi Nilai Unik (Unique Value Proposition)',
    'User Persona',
    'Pemasaran terpadu (Integrated Marketing)',
    'Saluran Distribusi Langsung (Direct Channel)',
    'Agar pesan promosi ditayangkan langsung di media yang paling sering diakses oleh target konsumen ideal.',
    'Menargetkan konsumen yang memiliki gaya hidup minimalis dan sangat menghargai nilai estetika modern.',
    'Banyaknya kompetitor baru yang meluncurkan produk sejenis dengan kualitas setara namun harga lebih murah.',
    'Menentukan harga yang sebanding dengan kualitas produk',
    'Adanya fokus tajam pada validasi Masalah (Problem) dan Solusi (Solution) yang ditawarkan.',
    'Mengidentifikasi kebutuhan dan preferensi konsumen',
    'Serangkaian aktivitas promosi yang terencana untuk mencapai tujuan pemasaran tertentu',
    'Segmentasi pasar',
    'Karena produk tersebut tidak dikomunikasikan melalui strategi pemasaran yang tepat kepada audiens sasaran.',
    'Membangun citra dan kesan yang diinginkan kepada konsumen',
    'Rekomendasi Rencana Aksi Eksekusi (Action Plan)',
    'Proses memperkenalkan produk kepada konsumen',
    'Proses mengidentifikasi segmen konsumen yang homogen',
  ];

  // Ambil semua radio button group
  const radioGroups = await page.locator('div[role="radiogroup"]').all();
  console.log(`Ditemukan ${radioGroups.length} soal`);

  for (let i = 0; i < radioGroups.length; i++) {
    console.log(`Soal ${i + 1}: ${jawaban[i]?.substring(0, 40)}...`);
    try {
      await radioGroups[i].locator(`text=${jawaban[i]}`).click();
      await page.waitForTimeout(400);
    } catch (e) {
      console.log(`  ⚠️ Soal ${i + 1} gagal: ${e.message}`);
    }
  }

  await page.screenshot({ path: 'marketing_sebelum_submit.png', fullPage: true });
  console.log('✅ Selesai! Bos yang klik Submit ya.');
})();
