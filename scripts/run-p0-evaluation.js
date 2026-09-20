'use strict';

const path = require('path');
const { saveEvaluationHistory } = require('../p0-evaluation');

const report = saveEvaluationHistory(path.join(__dirname, '..', 'evaluation', 'history'));
process.stdout.write(`${JSON.stringify({ status: report.status, score: report.score, cases: report.caseCount, file: report.file }, null, 2)}\n`);
if (report.status !== 'PASS') process.exitCode = 1;
