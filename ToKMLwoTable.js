const xlsx = require('xlsx');
const xmlbuilder = require('xmlbuilder');
const fs = require('fs');

// Fungsi ini untuk membaca Excel dan mengonversi ke KML
function convertExcelToKML(inputFile, outputFile) {
  // kode ini utk Baca workbook dari file Excel
  const workbook = xlsx.readFile(inputFile);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Konversi data Excel ke JSON
  const data = xlsx.utils.sheet_to_json(sheet);

  // ini tu Buat struktur XML untuk KML
  const kml = xmlbuilder.create('kml', {
      version: '1.0',
      encoding: 'UTF-8'
    })
    .att('xmlns', 'http://www.opengis.net/kml/2.2')
    .ele('Document');

  //kumpulan icon
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
  }

  // Tambahkan elemen untuk setiap baris dalam data
  // ini disesuaikan dari file excel
  data.forEach((row) => {
    const latitude = row['Latitude'] || 0;
    const longitude = row['Longitude'] || 0;
    const name = row['Name'] || 'Undefined';
    const description = row['Description'] || 'Undefined';
    const Icon = row['Icon'];
    const icon = IconMap[Icon];

    //ada 2 cara sih
    //1 description klo sudah ada tablenya berarti di kodenya cuman manggilin aja
    //2 buat manual langsung disini jadi di excel ga perlu tambahin row description
    const createdStyles = new Set();
    // Buat Style unik untuk ikon
    const styleId = `icon-${icon}`;
    if (!createdStyles.has(styleId)) {
      const style = kml.ele('Style', { id: styleId });
      const iconStyle = style.ele('IconStyle');
      iconStyle.ele('Icon').ele('href', {}, `http://maps.google.com/mapfiles/kml/paddle/${icon}.png`);
      createdStyles.add(styleId);
    }

    
    //tandain titik koordinat
    const placemark = kml.ele('Placemark');
    //buat nama
    placemark.ele('name', {}, name);
    //buat nampilin deskripsi
    placemark.ele('description', {}, description);
    //ngubahin icon berdasarkan tinggi towernya
    placemark.ele('styleUrl', {}, `#${styleId}`);

    //ini menitik koordinat
    const point = placemark.ele('Point');
    point.ele('coordinates', {}, `${longitude},${latitude}`, 0);
  });

  // Tulis KML ke file
  const kmlString = kml.end({
    pretty: true
  });
  fs.writeFileSync(outputFile, kmlString);

  console.log(`KML file berhasil dibuat: ${outputFile}`);
}

// Jalankan fungsi konversi
convertExcelToKML('data.xlsx', 'output.kml');