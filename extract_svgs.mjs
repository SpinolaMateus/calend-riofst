import fs from 'fs';

function extractSvg(filename, label) {
  const c = fs.readFileSync(filename, 'utf8');
  const svgs = [...c.matchAll(/<svg[\s\S]*?<\/svg>/gi)];
  console.log(`=== SVGs in ${label}: ${svgs.length} ===`);
  svgs.forEach((s, idx) => {
    console.log(`  SVG ${idx + 1}: length ${s[0].length}, viewBox: ${s[0].match(/viewBox="[^"]*"/)?.[0]}`);
  });
}

extractSvg('temp_page_executiva.html', 'Executiva');
extractSvg('temp_page_absenteismo.html', 'Absenteísmo');
extractSvg('temp_page_indicadores.html', 'Indicadores');

