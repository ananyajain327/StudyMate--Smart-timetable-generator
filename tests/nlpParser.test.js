import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NLPParser } from '../js/parser/nlpParser.js';

describe('NLPParser', () => {
  const refDate = new Date('2026-10-05T09:00:00Z'); // A Monday

  it('parses natural language: "Prep presentation 2h tomorrow before 4pm, high focus"', () => {
    const res = NLPParser.parse('Prep presentation 2h tomorrow before 4pm, high focus', refDate);
    assert.equal(res.type, 'TASK');
    assert.match(res.title, /Prep presentation/i);
    assert.equal(res.duration, 120); // 2h = 120m
    assert.equal(res.energyLevel, 'deep'); // high focus -> deep
    assert.equal(res.deadlineMinutes, 16 * 60); // 4pm = 16:00 = 960m
    assert.equal(res.date, '2026-10-06'); // tomorrow
  });

  it('parses: "Calculus problem set 90m today at 10am urgent"', () => {
    const res = NLPParser.parse('Calculus problem set 90m today at 10am urgent', refDate);
    assert.equal(res.type, 'TASK');
    assert.equal(res.duration, 90);
    assert.equal(res.priority, 'urgent');
    assert.equal(res.requestedStartMinutes, 10 * 60); // 10:00 = 600m
    assert.equal(res.date, '2026-10-05'); // today
    assert.equal(res.category, 'Mathematics');
  });

  it('parses domino shift command: "Running 30m late"', () => {
    const res = NLPParser.parse('Running 30m late');
    assert.equal(res.type, 'COMMAND');
    assert.equal(res.command, 'DOMINO_SHIFT');
    assert.equal(res.minutes, 30);
  });

  it('parses cascade command: "delay 15m"', () => {
    const res = NLPParser.parse('delay 15m');
    assert.equal(res.type, 'COMMAND');
    assert.equal(res.command, 'DOMINO_SHIFT');
    assert.equal(res.minutes, 15);
  });

  it('parses large project: "10-hour research project due friday deep work"', () => {
    const res = NLPParser.parse('10-hour research project due friday deep work', refDate);
    assert.equal(res.type, 'TASK');
    assert.equal(res.duration, 600); // 10 hours = 600 mins
    assert.equal(res.energyLevel, 'deep');
    assert.equal(res.category, 'Research');
  });

  it('parses shallow review task: "Read chapter 4 45m tomorrow night shallow"', () => {
    const res = NLPParser.parse('Read chapter 4 45m tomorrow night shallow', refDate);
    assert.equal(res.type, 'TASK');
    assert.equal(res.duration, 45);
    assert.equal(res.energyLevel, 'shallow');
    assert.equal(res.timePreference, 'evening');
    assert.equal(res.date, '2026-10-06');
  });

  it('parses locked meeting: "Team standup 30m at 11am locked"', () => {
    const res = NLPParser.parse('Team standup 30m at 11am locked', refDate);
    assert.equal(res.type, 'TASK');
    assert.equal(res.duration, 30);
    assert.equal(res.isLocked, true);
    assert.equal(res.requestedStartMinutes, 11 * 60);
  });
});
