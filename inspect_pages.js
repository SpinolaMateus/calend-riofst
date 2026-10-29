const fs = require('fs');

function analyzeFile(filename, label) {
  const content = fs.readFileSync(filename, 'utf8');
  console.log(`\n=================== ${label} (${content.length} bytes) ===================`);
  
  // Find all comments
  const comments = content.match(/<!--[\s\S]*?-->/g);
  console.log('Top comments:');
  if (comments) {
    comments.slice(0, 20).forEach(c => {
      const clean = c.replace(/<!--|-->/g, '').trim();
      if (clean.length > 0 && clean.length < 120) {
        console.log('  - ' + clean);
      }
    });
  }

  // Find structure elements inside <main>
  const mainMatch = content.match(/<main[\s\S]*?<\/main>/);
  if (mainMatch) {
    console.log('Main tag present with length:', mainMatch[0].length);
  }
}

analyzeFile('temp_page_executiva.html', 'VISAO EXECUTIVA');
analyzeFile('temp_page_indicadores.html', 'INDICADORES G&G');
analyzeFile('temp_page_absenteismo.html', 'ABSENTEISMO & MOVIMENTACOES');
analyzeFile('temp_page_setores.html', 'SETORES & TURNOS');

