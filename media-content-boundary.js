'use strict';

// Deliberately narrow local boundary. Creative style, nudity, clothing, genre,
// politics, and aesthetics are not classified or rewritten here.
const SEXUAL = /\b(nude|nudity|topless|explicit sex(?:ual)?|sexual act|porn(?:ographic)?|genitals?|vagina|penis|breasts?|intercourse|oral sex)\b/i;
const MINOR = /\b(child|minor|underage|preteen|teenager|young girl|young boy|schoolgirl|schoolboy)\b/i;
const NONCONSENSUAL = /\b(rape|raped|non[- ]?consensual|without (?:her|his|their) consent|sexually assault(?:ed|ing)?|forced sex|unconscious sex)\b/i;
const REAL_PERSON_IMPERSONATION = /\b(deepfake|celebrity|real person|actual person|public figure)\b/i;

function assertPermittedMediaPrompt(value) {
  const prompt = String(value || '');
  if (!SEXUAL.test(prompt)) return prompt;
  if (MINOR.test(prompt)) throw new Error('Sexual content involving a minor or underage subject is not supported.');
  if (NONCONSENSUAL.test(prompt)) throw new Error('Explicit non-consensual sexual content is not supported.');
  if (REAL_PERSON_IMPERSONATION.test(prompt)) throw new Error('Sexual deepfakes or sexual impersonations of real people are not supported.');
  return prompt;
}

module.exports = { assertPermittedMediaPrompt };
