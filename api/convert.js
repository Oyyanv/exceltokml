// Modul express ini untuk jadiin web pake API
const express = require('express');
// Multer ini gunanya buat unggahan file
const multer = require('multer');
// XLSX ini buat baca format xlsx
const xlsx = require('xlsx');
// XMLBuilder buat file XML-nya
const xmlbuilder = require('xmlbuilder');
// fs itu bawaan dari Node.js gunanya itu buat membaca, menulis, dan menghapus sistem file
const fs = require('fs');
// path itu juga bawaan dari Node.js, gunanya itu untuk mendapatkan nama file dari direktori
const path = require('path');

const app = express();

// Middleware untuk parsing request
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Buat folder `uploads` jika belum ada
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Konfigurasi multer untuk upload file
const upload = multer({
  dest: uploadsDir,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.includes('spreadsheetml') && !file.mimetype.includes('excel')) {
      return cb(new Error('Hanya file Excel yang diperbolehkan!'));
    }
    cb(null, true);
  },
});

// Fungsi untuk membuat nama file unik
function generateUniqueFileName(baseName, extension) {
  let counter = 1;
  let fileName = `${baseName}${extension}`;
  while (fs.existsSync(fileName)) {
    fileName = `${baseName}(${counter})${extension}`;
    counter++;
  }
  return fileName;
}

// Fungsi untuk mengonversi Excel ke KML
function convertExcelToKML(inputFile, outputFile) {
  const workbook = xlsx.readFile(inputFile);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet);

  const kml = xmlbuilder
    .create('kml', { version: '1.0', encoding: 'UTF-8' })
    .att('xmlns', 'http://www.opengis.net/kml/2.2')
    .ele('Document');

  const IconMap = {
    155: 'blu-blank',
    160: 'grn-circle',
    165: 'ltblu-blank',
    170: 'pink-blank',
    172: 'grn-blank',
    175: 'ylw-blank',
    177: 'ylw-circle',
    180: 'orange-blank',
    192: 'purple-circle',
    190: 'purple-blank',
  };

  const createdStyles = new Set();

  data.forEach((row) => {
    const latitude = row['Latitude'] || 0;
    const longitude = row['Longitude'] || 0;
    const name = row['Name'] || 'Undefined';
    const description = row['Description'] || 'Undefined';
    const Icon = row['Icon'];
    const icon = IconMap[Icon];

    const styleId = `icon-${icon}`;
    if (!createdStyles.has(styleId)) {
      const style = kml.ele('Style', { id: styleId });
      const iconStyle = style.ele('IconStyle');
      iconStyle
        .ele('Icon')
        .ele('href', {}, `http://maps.google.com/mapfiles/kml/paddle/${icon}.png`);
      createdStyles.add(styleId);
    }

    const placemark = kml.ele('Placemark');
    placemark.ele('name', {}, name);
    placemark.ele('description', {}, description);
    placemark.ele('styleUrl', {}, `#${styleId}`);
    const point = placemark.ele('Point');
    point.ele('coordinates', {}, `${longitude},${latitude}`);
  });

  const kmlString = kml.end({ pretty: true });
  fs.writeFileSync(outputFile, kmlString);
}

// Route untuk upload file dan konversi
app.post('/convert', upload.single('excelFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('File tidak ditemukan. Harap unggah file Excel.');
  }

  const inputFile = req.file.path;
  const fileNameWithoutExt = path.parse(req.file.originalname).name;
  const uniqueOutputFile = generateUniqueFileName(path.join(uploadsDir, fileNameWithoutExt), '.kml');

  try {
    convertExcelToKML(inputFile, uniqueOutputFile);
    res.download(uniqueOutputFile, (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Gagal mengunduh file.');
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Terjadi kesalahan saat mengonversi file.');
  } finally {
    fs.unlinkSync(inputFile); // Hapus file Excel setelah selesai
    if (fs.existsSync(uniqueOutputFile)) {
      fs.unlinkSync(uniqueOutputFile); // Hapus file KML setelah diunduh
    }
  }
});

// Route GET untuk tes server
app.get('/', (req, res) => {
  res.send('Server berjalan! Gunakan POST /convert untuk mengunggah file.');
});

// Middleware untuk logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Middleware untuk menangani error
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Terjadi kesalahan pada server.');
});

module.exports = app;
