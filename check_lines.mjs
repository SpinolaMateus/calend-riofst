import fs from 'fs';

const content = fs.readFileSync('src/components/PeopleAnalyticsView.tsx', 'utf8');
const lines = content.split('\n');

console.log('Line 854:', lines[853]);
console.log('Line 1279:', lines[1278]);
console.log('Line 1280:', lines[1279]);
console.log('Line 1370:', lines[1369]);
console.log('Line 1371:', lines[1370]);
console.log('Line 1426:', lines[1425]);
console.log('Line 1427:', lines[1426]);
console.log('Line 1516:', lines[1515]);
console.log('Line 1517:', lines[1516]);
console.log('Line 1564:', lines[1563]);
console.log('Line 1565:', lines[1564]);

