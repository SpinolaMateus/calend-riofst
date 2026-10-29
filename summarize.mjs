import fs from 'fs';

function summarizeHtml(filename) {
  const html = fs.readFileSync(filename, 'utf8');
  console.log(`\n=================== ${filename} ===================`);
  
  const main = html.match(/<main[\s\S]*?<\/main>/i);
  if (!main) {
    console.log('No <main> tag found!');
    return;
  }
  
  const mainContent = main[0];
  console.log('Main length:', mainContent.length);

  // Extract all h1, h2, h3, h4
  const headers = [...mainContent.matchAll(/<(h[1-4]|span|div)[^>]*class="[^"]*headline[^"]*"[^>]*>(.*?)<\/\1>/gi)];
  console.log('Key headlines:');
  headers.slice(0, 15).forEach(h => console.log('  -', h[2].replace(/<[^>]+>/g, '').trim()));

  // Extract all modals in entire document
  const modalMatches = [...html.matchAll(/id="([^"]*modal[^"]*)"/gi)];
  console.log('Modals found:', modalMatches.map(m => m[1]));

  // Extract tables
  const tableMatches = [...mainContent.matchAll(/<table[\s\S]*?<\/table>/gi)];
  console.log('Tables found:', tableMatches.length);
  tableMatches.forEach((tm, idx) => {
    const tableStr = tm[0];
    const ths = [...tableStr.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' '));
    console.log(`  Table ${idx + 1} columns:`, ths);
  });
}

summarizeHtml('temp_page_executiva.html');
summarizeHtml('temp_page_indicadores.html');
summarizeHtml('temp_page_absenteismo.html');
