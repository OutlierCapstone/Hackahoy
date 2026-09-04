import assert from 'node:assert/strict';
import { problems } from '../prisma/problem-catalog.mjs';

assert.equal(problems.length, 7);
assert.deepEqual(
  problems.map(({ id }) => id),
  [1, 2, 3, 4, 5, 6, 7],
);

const internalLabels = new Set([
  'LLM Data Poisoning',
  'IDOR',
  'Prompt Injection',
  'Command Injection',
  'JWT 권한상승',
]);

for (const problem of problems) {
  assert.ok(problem.description.length >= 25, `problem ${problem.id} copy is too short`);
  assert.ok(
    !internalLabels.has(problem.description),
    `problem ${problem.id} exposes an internal vulnerability label`,
  );
}

assert.match(problems[3].description, /무전기.*저주/);
assert.equal(problems[6].title, '가짜 출항 신고서');

console.log('Problem catalog verification passed.');
