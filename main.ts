import { readFileSync, writeFileSync } from 'node:fs';
import { run } from './solve.js';
const cases: { id: string; input: { text: string; header: boolean } }[] = JSON.parse(readFileSync('/input/cases.json', 'utf8'));
writeFileSync('/output/answers.json', JSON.stringify(cases.map(({input}) => run(input))));
