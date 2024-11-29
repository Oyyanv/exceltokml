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
  const kml = xmlbuilder.create('kml', { version: '1.0', encoding: 'UTF-8' })
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
    const Siteid = row['SITEID CORRECTION'] || 'Undefined';
    const Sitename = row['SITE NAME'] || 'Undefined';
    const SiteClass = row['SITE CLASS'] || 'Undefined';
    const KabKota = row['Kota/Kab']  || 'Undefined';
    const Kecamatan = row['Kecamatan'] || 'Undefined';
    const Kelurahan = row['Kelurahan'] || 'Undefined';
    const Address = row['ADDRESS'] || 'Undefined';
    const Colo = row['COLO'] || 'Undefined';
    const TowerPosition = row['TWR POSITION'] || 'Undefined';
    const TowerHeight = row['TWR HEIGHT'] || 'Undefined';
    const TowerType = row['TWR TYPE'] || 'Undefined';
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

    //table html
    const Descriptiontable = `
        <table style='border: 2px red solid; border-collapse: collapse;' width='300'>  
     <tr style='text-align: center; justify-self: center;'>   
         <td style='border: 2px red solid; font-weight: bold;'>
            <h3>${name}</h3>
        </td>   
     </tr>   
     <tr>   
         <td style='border: 2px red solid; padding: 5px 10px;'>
              Site Name : ${Sitename}    
        </td>   
     </tr>   
     <tr>   
         <td style='border: 2px red solid; padding: 5px 10px;'>
            Site ID : ${Siteid}    
        </td>   
     </tr>   
     <tr>   
         <td style='border: 2px red solid; padding: 5px 10px;'>
            Site Class : ${SiteClass}     
        </td>   
     </tr>   
     <tr>   
        <td style='border: 2px red solid; padding: 5px 10px;'>
            Kab/Kota : ${KabKota}    
        </td>   
     </tr>   
     <tr>   
         <td style='border: 2px red solid; padding: 5px 10px;'>
            Kecamatan : ${Kecamatan}     
        </td>   
     </tr>   
     <tr>   
         <td style='border: 2px red solid; padding: 5px 10px;'>
            Kelurahan : ${Kelurahan}   
        </td>   
     </tr>   
     <tr>   
         <td style='border: 2px red solid; padding: 5px 10px;'>
            Alamat : ${Address}   
        </td>   
     </tr>   
     <tr>   
         <td style='border: 2px red solid; padding: 5px 10px;'>
            COLO : ${Colo}   
        </td>   
     </tr>   
     <tr>   
         <td style='border: 2px red solid; padding: 5px 10px;'>
            Tower Position : ${TowerPosition}    
        </td>   
     </tr>   
     <tr>   
         <td style='border: 2px red solid; padding: 5px 10px;'>
            Tower Height : ${TowerHeight}   
        </td>   
     </tr>   
     <tr>   
         <td style='border: 2px red solid; padding: 5px 10px;'>
            Tower Type : ${TowerType}     
        </td>   
     </tr>   
     <tr>   
         <td style='border: 2px red solid; padding: 5px 10px;'>
            Longitude : ${longitude}   
        </td>   
     </tr>   
     <tr>   
         <td style='border: 2px red solid; padding: 5px 10px;'>
            Latitude : ${latitude}   
        </td>   
     </tr>   
 </table> 
    `;

    const placemark = kml.ele('Placemark');
    placemark.ele('name', {}, name);
    placemark.ele('description', {}, Descriptiontable);
    placemark.ele('styleUrl', {}, `#${styleId}`);
    const point = placemark.ele('Point');
    point.ele('coordinates', {}, `${longitude},${latitude}`,0);
  });

  // Tulis KML ke file
  const kmlString = kml.end({ pretty: true });
  fs.writeFileSync(outputFile, kmlString);

  console.log(`KML file berhasil dibuat: ${outputFile}`);
}

// Jalankan fungsi konversi
convertExcelToKML('data.xlsx', 'output.kml');