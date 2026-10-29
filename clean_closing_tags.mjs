import fs from 'fs';

let content = fs.readFileSync('src/components/PeopleAnalyticsView.tsx', 'utf8');

// Replace duplicate closing patterns
content = content.replace(
  `        )}\n\n        {/* --------------------------------------------------------------------- */}\n          )}`,
  `        )}`
);

content = content.replace(
  `        {/* --------------------------------------------------------------------- */}\n          )}\n\n          {/* ABA 8: INTELIGÊNCIA ANALÍTICA & PLANOS DE AÇÃO */}`,
  `          {/* ABA 8: INTELIGÊNCIA ANALÍTICA & PLANOS DE AÇÃO */}`
);

content = content.replace(
  `        )}\n\n        {/* --------------------------------------------------------------------- */}\n          )}\n\n          {/* ABA 9: ENTRADA DE DADOS & IMPORTAÇÃO EXCEL */}`,
  `        )}\n\n          {/* ABA 9: ENTRADA DE DADOS & IMPORTAÇÃO EXCEL */}`
);

fs.writeFileSync('src/components/PeopleAnalyticsView.tsx', content);
console.log('Cleaned duplicate closing tags.');

