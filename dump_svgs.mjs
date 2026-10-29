import fs from 'fs';

const exec = fs.readFileSync('temp_page_executiva.html', 'utf8');
const execSvg = exec.match(/<svg[\s\S]*?<\/svg>/i);
if (execSvg) fs.writeFileSync('extracted_exec_svg.html', execSvg[0]);

const abs = fs.readFileSync('temp_page_absenteismo.html', 'utf8');
const absSvgs = [...abs.matchAll(/<svg[\s\S]*?<\/svg>/gi)];
absSvgs.forEach((s, i) => fs.writeFileSync(`extracted_abs_svg_${i + 1}.html`, s[0]));

console.log('SVGs saved');

