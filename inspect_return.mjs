import fs from 'fs';

let content = fs.readFileSync('src/components/PeopleAnalyticsView.tsx', 'utf8');

// Find start of return
const returnStart = content.indexOf('return (');
if (returnStart === -1) {
  console.error('return ( not found');
  process.exit(1);
}

// Find where <header is
const headerStart = content.indexOf('<header data-capture-ignore', returnStart);
// Find where the breadcrumb/filter bar ends and tabs start
const tabStart = content.indexOf('{activeTab === \'overview\' && (', headerStart);

console.log('headerStart:', headerStart);
console.log('tabStart:', tabStart);

// Let's inspect the code between returnStart and tabStart
fs.writeFileSync('header_snippet.txt', content.substring(returnStart, tabStart));
console.log('Header snippet written');

