import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const css = await readFile(new URL('../app/theme-accessibility.css', import.meta.url), 'utf8');

test('applies semantic theme colors to shared cards and content surfaces', () => {
  for (const selector of ['.reference-panel', '.task-board', '.settings-panel', '.processes-panel', '.efferd-kpi', '.dashboard-chart-card', '.report-filters']) {
    assert.ok(css.includes(selector), 'missing themed surface selector: ' + selector);
  }
  assert.match(css, /background:\s*var\(--ui-surface\)/);
  assert.match(css, /border-color:\s*var\(--ui-border\)/);
});

test('forces readable foreground colors for headings, body text, controls and table content', () => {
  for (const selector of ['h1', 'h2', 'h3', 'p', 'label', 'th', 'td', 'input', 'textarea', 'select']) {
    assert.ok(css.includes(selector), 'missing accessible foreground selector: ' + selector);
  }
  assert.match(css, /color:\s*var\(--ui-ink\)/);
  assert.match(css, /color:\s*var\(--ui-muted\)/);
});

test('preserves semantic contrast on selected tabs, primary actions and status badges', () => {
  assert.match(css, /--ui-accent-ink/);
  assert.match(css, /--ui-success-ink/);
  assert.match(css, /--ui-warning-ink/);
  assert.match(css, /--ui-danger-ink/);
  assert.match(css, /--ui-neutral-ink/);
});
