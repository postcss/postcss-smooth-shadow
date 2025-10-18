import { deepEqual, equal, throws } from 'node:assert/strict'
import { test } from 'node:test'
import postcss from 'postcss'

import plugin, { renderShadows } from '../index.js'

function run(input, output, opts) {
  let result = postcss([plugin(opts)]).process(input, { from: undefined })
  equal(result.css, output)
  equal(result.warnings().length, 0)
  return result
}

test('replaces sharp-shadow function', () => {
  run(
    'a { box-shadow: --sharp-shadow(2px 4px 10px red); }',
    'a { box-shadow: calc(0.25 * 2px) calc(0.25 * 4px) calc(0.25 * 10px) rgb(from red r g b / calc(alpha * 1)), calc(1 * 2px) calc(1 * 4px) calc(1 * 10px) rgb(from red r g b / calc(alpha * 0.5)); }'
  )
})

test('has JS API', () => {
  deepEqual(renderShadows('sharp', false, '2px', '4px', '10px', 'red'), [
    'calc(0.25 * 2px) calc(0.25 * 4px) calc(0.25 * 10px) rgb(from red r g b / calc(alpha * 1))',
    'calc(1 * 2px) calc(1 * 4px) calc(1 * 10px) rgb(from red r g b / calc(alpha * 0.5))'
  ])
})

test('replaces soft-shadow function', () => {
  run(
    'a { box-shadow: --soft-shadow(1px 2px 12px blue); }',
    'a { box-shadow: calc(0.25 * 1px) calc(0.25 * 2px) calc(0.25 * 12px) rgb(from blue r g b / calc(alpha * 0.5)), calc(1 * 1px) calc(1 * 2px) calc(1 * 12px) rgb(from blue r g b / calc(alpha * 1)); }'
  )
})

test('replaces linear-shadow function', () => {
  run(
    'a { box-shadow: --linear-shadow(3px 6px 18px green); }',
    'a { box-shadow: calc(0.1111 * 3px) calc(0.1111 * 6px) calc(0.1111 * 18px) rgb(from green r g b / calc(alpha * 1)), calc(0.4444 * 3px) calc(0.4444 * 6px) calc(0.4444 * 18px) rgb(from green r g b / calc(alpha * 1)), calc(1 * 3px) calc(1 * 6px) calc(1 * 18px) rgb(from green r g b / calc(alpha * 1)); }'
  )
})

test('handles multiple shadow functions', () => {
  run(
    'a { box-shadow: --sharp-shadow(1px 1px 6px black), 0px 2px 4px red; }',
    'a { box-shadow: calc(1 * 1px) calc(1 * 1px) calc(1 * 6px) rgb(from black r g b / calc(alpha * 1)), 0px 2px 4px red; }'
  )
})

test('handles nested parentheses in calc() functions', () => {
  run(
    'a { box-shadow: --sharp-shadow(calc(1% + 1px) 2px 10rem red); }',
    'a { box-shadow: calc(0.0014 * calc(1% + 1px)) calc(0.0014 * 2px) calc(0.0014 * 10rem) rgb(from red r g b / calc(alpha * 1)), calc(0.0055 * calc(1% + 1px)) calc(0.0055 * 2px) calc(0.0055 * 10rem) rgb(from red r g b / calc(alpha * 0.963)), calc(0.0123 * calc(1% + 1px)) calc(0.0123 * 2px) calc(0.0123 * 10rem) rgb(from red r g b / calc(alpha * 0.926)), calc(0.0219 * calc(1% + 1px)) calc(0.0219 * 2px) calc(0.0219 * 10rem) rgb(from red r g b / calc(alpha * 0.889)), calc(0.0343 * calc(1% + 1px)) calc(0.0343 * 2px) calc(0.0343 * 10rem) rgb(from red r g b / calc(alpha * 0.852)), calc(0.0494 * calc(1% + 1px)) calc(0.0494 * 2px) calc(0.0494 * 10rem) rgb(from red r g b / calc(alpha * 0.815)), calc(0.0672 * calc(1% + 1px)) calc(0.0672 * 2px) calc(0.0672 * 10rem) rgb(from red r g b / calc(alpha * 0.778)), calc(0.0878 * calc(1% + 1px)) calc(0.0878 * 2px) calc(0.0878 * 10rem) rgb(from red r g b / calc(alpha * 0.741)), calc(0.1111 * calc(1% + 1px)) calc(0.1111 * 2px) calc(0.1111 * 10rem) rgb(from red r g b / calc(alpha * 0.704)), calc(0.1372 * calc(1% + 1px)) calc(0.1372 * 2px) calc(0.1372 * 10rem) rgb(from red r g b / calc(alpha * 0.667)), calc(0.166 * calc(1% + 1px)) calc(0.166 * 2px) calc(0.166 * 10rem) rgb(from red r g b / calc(alpha * 0.63)), calc(0.1975 * calc(1% + 1px)) calc(0.1975 * 2px) calc(0.1975 * 10rem) rgb(from red r g b / calc(alpha * 0.593)), calc(0.2318 * calc(1% + 1px)) calc(0.2318 * 2px) calc(0.2318 * 10rem) rgb(from red r g b / calc(alpha * 0.556)), calc(0.2689 * calc(1% + 1px)) calc(0.2689 * 2px) calc(0.2689 * 10rem) rgb(from red r g b / calc(alpha * 0.519)), calc(0.3086 * calc(1% + 1px)) calc(0.3086 * 2px) calc(0.3086 * 10rem) rgb(from red r g b / calc(alpha * 0.481)), calc(0.3512 * calc(1% + 1px)) calc(0.3512 * 2px) calc(0.3512 * 10rem) rgb(from red r g b / calc(alpha * 0.444)), calc(0.3964 * calc(1% + 1px)) calc(0.3964 * 2px) calc(0.3964 * 10rem) rgb(from red r g b / calc(alpha * 0.407)), calc(0.4444 * calc(1% + 1px)) calc(0.4444 * 2px) calc(0.4444 * 10rem) rgb(from red r g b / calc(alpha * 0.37)), calc(0.4952 * calc(1% + 1px)) calc(0.4952 * 2px) calc(0.4952 * 10rem) rgb(from red r g b / calc(alpha * 0.333)), calc(0.5487 * calc(1% + 1px)) calc(0.5487 * 2px) calc(0.5487 * 10rem) rgb(from red r g b / calc(alpha * 0.296)), calc(0.6049 * calc(1% + 1px)) calc(0.6049 * 2px) calc(0.6049 * 10rem) rgb(from red r g b / calc(alpha * 0.259)), calc(0.6639 * calc(1% + 1px)) calc(0.6639 * 2px) calc(0.6639 * 10rem) rgb(from red r g b / calc(alpha * 0.222)), calc(0.7257 * calc(1% + 1px)) calc(0.7257 * 2px) calc(0.7257 * 10rem) rgb(from red r g b / calc(alpha * 0.185)), calc(0.7901 * calc(1% + 1px)) calc(0.7901 * 2px) calc(0.7901 * 10rem) rgb(from red r g b / calc(alpha * 0.148)), calc(0.8573 * calc(1% + 1px)) calc(0.8573 * 2px) calc(0.8573 * 10rem) rgb(from red r g b / calc(alpha * 0.111)), calc(0.9273 * calc(1% + 1px)) calc(0.9273 * 2px) calc(0.9273 * 10rem) rgb(from red r g b / calc(alpha * 0.074)), calc(1 * calc(1% + 1px)) calc(1 * 2px) calc(1 * 10rem) rgb(from red r g b / calc(alpha * 0.037)); }'
  )
})

test('handles nested parentheses in oklch() colors', () => {
  run(
    'a { box-shadow: --soft-shadow(2px 4px 12px oklch(0.5 0.2 180 / var(--alpha))); }',
    'a { box-shadow: calc(0.25 * 2px) calc(0.25 * 4px) calc(0.25 * 12px) rgb(from oklch(0.5 0.2 180 / var(--alpha)) r g b / calc(alpha * 0.5)), calc(1 * 2px) calc(1 * 4px) calc(1 * 12px) rgb(from oklch(0.5 0.2 180 / var(--alpha)) r g b / calc(alpha * 1)); }'
  )
})

test('handles complex nested functions', () => {
  run(
    'a { box-shadow: --linear-shadow(calc(1% + 1px) 2px 10rem oklch(0 0 0 / var(--test))); }',
    'a { box-shadow: calc(0.0014 * calc(1% + 1px)) calc(0.0014 * 2px) calc(0.0014 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 1)), calc(0.0055 * calc(1% + 1px)) calc(0.0055 * 2px) calc(0.0055 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 1)), calc(0.0123 * calc(1% + 1px)) calc(0.0123 * 2px) calc(0.0123 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 1)), calc(0.0219 * calc(1% + 1px)) calc(0.0219 * 2px) calc(0.0219 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 1)), calc(0.0343 * calc(1% + 1px)) calc(0.0343 * 2px) calc(0.0343 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 1)), calc(0.0494 * calc(1% + 1px)) calc(0.0494 * 2px) calc(0.0494 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 1)), calc(0.0672 * calc(1% + 1px)) calc(0.0672 * 2px) calc(0.0672 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 1)), calc(0.0878 * calc(1% + 1px)) calc(0.0878 * 2px) calc(0.0878 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 1)), calc(0.1111 * calc(1% + 1px)) calc(0.1111 * 2px) calc(0.1111 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 1)), calc(0.1372 * calc(1% + 1px)) calc(0.1372 * 2px) calc(0.1372 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 1)), calc(0.166 * calc(1% + 1px)) calc(0.166 * 2px) calc(0.166 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 1)), calc(0.1975 * calc(1% + 1px)) calc(0.1975 * 2px) calc(0.1975 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 1)), calc(0.2318 * calc(1% + 1px)) calc(0.2318 * 2px) calc(0.2318 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 1)), calc(0.2689 * calc(1% + 1px)) calc(0.2689 * 2px) calc(0.2689 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 1)), calc(0.3086 * calc(1% + 1px)) calc(0.3086 * 2px) calc(0.3086 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 1)), calc(0.3512 * calc(1% + 1px)) calc(0.3512 * 2px) calc(0.3512 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 1)), calc(0.3964 * calc(1% + 1px)) calc(0.3964 * 2px) calc(0.3964 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 1)), calc(0.4444 * calc(1% + 1px)) calc(0.4444 * 2px) calc(0.4444 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 1)), calc(0.4952 * calc(1% + 1px)) calc(0.4952 * 2px) calc(0.4952 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 1)), calc(0.5487 * calc(1% + 1px)) calc(0.5487 * 2px) calc(0.5487 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 1)), calc(0.6049 * calc(1% + 1px)) calc(0.6049 * 2px) calc(0.6049 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 1)), calc(0.6639 * calc(1% + 1px)) calc(0.6639 * 2px) calc(0.6639 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 1)), calc(0.7257 * calc(1% + 1px)) calc(0.7257 * 2px) calc(0.7257 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 1)), calc(0.7901 * calc(1% + 1px)) calc(0.7901 * 2px) calc(0.7901 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 1)), calc(0.8573 * calc(1% + 1px)) calc(0.8573 * 2px) calc(0.8573 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 1)), calc(0.9273 * calc(1% + 1px)) calc(0.9273 * 2px) calc(0.9273 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 1)), calc(1 * calc(1% + 1px)) calc(1 * 2px) calc(1 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 1)); }'
  )
})

test('handles user example with complex nested functions', () => {
  run(
    'a { box-shadow: --sharp-shadow(calc(1% + 1px) 2px 10rem oklch(0 0 0 / var(--test))); }',
    'a { box-shadow: calc(0.0014 * calc(1% + 1px)) calc(0.0014 * 2px) calc(0.0014 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 1)), calc(0.0055 * calc(1% + 1px)) calc(0.0055 * 2px) calc(0.0055 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 0.963)), calc(0.0123 * calc(1% + 1px)) calc(0.0123 * 2px) calc(0.0123 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 0.926)), calc(0.0219 * calc(1% + 1px)) calc(0.0219 * 2px) calc(0.0219 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 0.889)), calc(0.0343 * calc(1% + 1px)) calc(0.0343 * 2px) calc(0.0343 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 0.852)), calc(0.0494 * calc(1% + 1px)) calc(0.0494 * 2px) calc(0.0494 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 0.815)), calc(0.0672 * calc(1% + 1px)) calc(0.0672 * 2px) calc(0.0672 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 0.778)), calc(0.0878 * calc(1% + 1px)) calc(0.0878 * 2px) calc(0.0878 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 0.741)), calc(0.1111 * calc(1% + 1px)) calc(0.1111 * 2px) calc(0.1111 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 0.704)), calc(0.1372 * calc(1% + 1px)) calc(0.1372 * 2px) calc(0.1372 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 0.667)), calc(0.166 * calc(1% + 1px)) calc(0.166 * 2px) calc(0.166 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 0.63)), calc(0.1975 * calc(1% + 1px)) calc(0.1975 * 2px) calc(0.1975 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 0.593)), calc(0.2318 * calc(1% + 1px)) calc(0.2318 * 2px) calc(0.2318 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 0.556)), calc(0.2689 * calc(1% + 1px)) calc(0.2689 * 2px) calc(0.2689 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 0.519)), calc(0.3086 * calc(1% + 1px)) calc(0.3086 * 2px) calc(0.3086 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 0.481)), calc(0.3512 * calc(1% + 1px)) calc(0.3512 * 2px) calc(0.3512 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 0.444)), calc(0.3964 * calc(1% + 1px)) calc(0.3964 * 2px) calc(0.3964 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 0.407)), calc(0.4444 * calc(1% + 1px)) calc(0.4444 * 2px) calc(0.4444 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 0.37)), calc(0.4952 * calc(1% + 1px)) calc(0.4952 * 2px) calc(0.4952 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 0.333)), calc(0.5487 * calc(1% + 1px)) calc(0.5487 * 2px) calc(0.5487 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 0.296)), calc(0.6049 * calc(1% + 1px)) calc(0.6049 * 2px) calc(0.6049 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 0.259)), calc(0.6639 * calc(1% + 1px)) calc(0.6639 * 2px) calc(0.6639 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 0.222)), calc(0.7257 * calc(1% + 1px)) calc(0.7257 * 2px) calc(0.7257 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 0.185)), calc(0.7901 * calc(1% + 1px)) calc(0.7901 * 2px) calc(0.7901 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 0.148)), calc(0.8573 * calc(1% + 1px)) calc(0.8573 * 2px) calc(0.8573 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 0.111)), calc(0.9273 * calc(1% + 1px)) calc(0.9273 * 2px) calc(0.9273 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 0.074)), calc(1 * calc(1% + 1px)) calc(1 * 2px) calc(1 * 10rem) rgb(from oklch(0 0 0 / var(--test)) r g b / calc(alpha * 0.037)); }'
  )
})

test('throws error for unclosed parenthesis in shadow function', () => {
  throws(() => {
    run('a { box-shadow: "--sharp-shadow(calc(1px"; }', '')
  }, /Unclosed parenthesis/)
})

test('ignores declarations without shadow functions', () => {
  run(
    'a { color: red; background: blue; }',
    'a { color: red; background: blue; }'
  )
})

test('throws error for wrong parameter count - too few', () => {
  throws(() => {
    run('a { box-shadow: --sharp-shadow(1px 2px 3px); }', '')
  }, /requires exactly 4 parameters/)
})

test('throws error for wrong parameter count - too many', () => {
  throws(() => {
    run('a { box-shadow: --soft-shadow(1px 2px 3px red extra); }', '')
  }, /requires exactly 4 parameters/)
})

test('throws error for wrong parameter count - no parameters', () => {
  throws(() => {
    run('a { box-shadow: --linear-shadow(); }', '')
  }, /requires exactly 4 parameters/)
})

test('handles different blur values for layer calculation', () => {
  run(
    'a { box-shadow: --sharp-shadow(1px 1px 6px red); }',
    'a { box-shadow: calc(1 * 1px) calc(1 * 1px) calc(1 * 6px) rgb(from red r g b / calc(alpha * 1)); }'
  )
})

test('handles large blur values creating many layers', () => {
  run(
    'a { box-shadow: --sharp-shadow(2px 2px 36px black); }',
    'a { box-shadow: calc(0.0278 * 2px) calc(0.0278 * 2px) calc(0.0278 * 36px) rgb(from black r g b / calc(alpha * 1)), calc(0.1111 * 2px) calc(0.1111 * 2px) calc(0.1111 * 36px) rgb(from black r g b / calc(alpha * 0.833)), calc(0.25 * 2px) calc(0.25 * 2px) calc(0.25 * 36px) rgb(from black r g b / calc(alpha * 0.667)), calc(0.4444 * 2px) calc(0.4444 * 2px) calc(0.4444 * 36px) rgb(from black r g b / calc(alpha * 0.5)), calc(0.6944 * 2px) calc(0.6944 * 2px) calc(0.6944 * 36px) rgb(from black r g b / calc(alpha * 0.333)), calc(1 * 2px) calc(1 * 2px) calc(1 * 36px) rgb(from black r g b / calc(alpha * 0.167)); }'
  )
})

test('handles CSS variables in parameters', () => {
  run(
    'a { box-shadow: --soft-shadow(var(--x) var(--y) var(--blur) var(--color)); }',
    'a { box-shadow: calc(0.04 * var(--x)) calc(0.04 * var(--y)) calc(0.04 * var(--blur)) rgb(from var(--color) r g b / calc(alpha * 0.2)), calc(0.16 * var(--x)) calc(0.16 * var(--y)) calc(0.16 * var(--blur)) rgb(from var(--color) r g b / calc(alpha * 0.4)), calc(0.36 * var(--x)) calc(0.36 * var(--y)) calc(0.36 * var(--blur)) rgb(from var(--color) r g b / calc(alpha * 0.6)), calc(0.64 * var(--x)) calc(0.64 * var(--y)) calc(0.64 * var(--blur)) rgb(from var(--color) r g b / calc(alpha * 0.8)), calc(1 * var(--x)) calc(1 * var(--y)) calc(1 * var(--blur)) rgb(from var(--color) r g b / calc(alpha * 1)); }'
  )
})

test('handles complex calc() expressions with nested functions', () => {
  run(
    'a { box-shadow: --linear-shadow(calc(min(1px, 2px) + max(3px, 4px)) calc(clamp(1px, 50%, 10px)) 12px red); }',
    'a { box-shadow: calc(0.25 * calc(min(1px, 2px) + max(3px, 4px))) calc(0.25 * calc(clamp(1px, 50%, 10px))) calc(0.25 * 12px) rgb(from red r g b / calc(alpha * 1)), calc(1 * calc(min(1px, 2px) + max(3px, 4px))) calc(1 * calc(clamp(1px, 50%, 10px))) calc(1 * 12px) rgb(from red r g b / calc(alpha * 1)); }'
  )
})

test('handles rgba() with calc() alpha values', () => {
  run(
    'a { box-shadow: --sharp-shadow(1px 2px 12px rgba(255, 0, 0, calc(var(--alpha) * 0.8))); }',
    'a { box-shadow: calc(0.25 * 1px) calc(0.25 * 2px) calc(0.25 * 12px) rgb(from rgba(255, 0, 0, calc(var(--alpha) * 0.8)) r g b / calc(alpha * 1)), calc(1 * 1px) calc(1 * 2px) calc(1 * 12px) rgb(from rgba(255, 0, 0, calc(var(--alpha) * 0.8)) r g b / calc(alpha * 0.5)); }'
  )
})

test('handles hsl() colors with complex expressions', () => {
  run(
    'a { box-shadow: --soft-shadow(2px 4px 18px hsl(calc(var(--hue) + 30), 100%, 50%)); }',
    'a { box-shadow: calc(0.1111 * 2px) calc(0.1111 * 4px) calc(0.1111 * 18px) rgb(from hsl(calc(var(--hue) + 30), 100%, 50%) r g b / calc(alpha * 0.333)), calc(0.4444 * 2px) calc(0.4444 * 4px) calc(0.4444 * 18px) rgb(from hsl(calc(var(--hue) + 30), 100%, 50%) r g b / calc(alpha * 0.667)), calc(1 * 2px) calc(1 * 4px) calc(1 * 18px) rgb(from hsl(calc(var(--hue) + 30), 100%, 50%) r g b / calc(alpha * 1)); }'
  )
})

test('handles multiple shadow functions of different types', () => {
  run(
    'a { box-shadow: --sharp-shadow(1px 2px 6px red), --soft-shadow(2px 4px 12px blue), --linear-shadow(3px 6px 18px green); }',
    'a { box-shadow: calc(1 * 1px) calc(1 * 2px) calc(1 * 6px) rgb(from red r g b / calc(alpha * 1)), calc(0.25 * 2px) calc(0.25 * 4px) calc(0.25 * 12px) rgb(from blue r g b / calc(alpha * 0.5)), calc(1 * 2px) calc(1 * 4px) calc(1 * 12px) rgb(from blue r g b / calc(alpha * 1)), calc(0.1111 * 3px) calc(0.1111 * 6px) calc(0.1111 * 18px) rgb(from green r g b / calc(alpha * 1)), calc(0.4444 * 3px) calc(0.4444 * 6px) calc(0.4444 * 18px) rgb(from green r g b / calc(alpha * 1)), calc(1 * 3px) calc(1 * 6px) calc(1 * 18px) rgb(from green r g b / calc(alpha * 1)); }'
  )
})

test('handles negative values', () => {
  run(
    'a { box-shadow: --sharp-shadow(-2px -4px 10px rgba(0,0,0,0.5)); }',
    'a { box-shadow: calc(0.25 * -2px) calc(0.25 * -4px) calc(0.25 * 10px) rgb(from rgba(0,0,0,0.5) r g b / calc(alpha * 1)), calc(1 * -2px) calc(1 * -4px) calc(1 * 10px) rgb(from rgba(0,0,0,0.5) r g b / calc(alpha * 0.5)); }'
  )
})

test('handles zero values', () => {
  run(
    'a { box-shadow: --linear-shadow(0px 0px 12px black); }',
    'a { box-shadow: calc(0.25 * 0px) calc(0.25 * 0px) calc(0.25 * 12px) rgb(from black r g b / calc(alpha * 1)), calc(1 * 0px) calc(1 * 0px) calc(1 * 12px) rgb(from black r g b / calc(alpha * 1)); }'
  )
})

test('handles different CSS units', () => {
  run(
    'a { box-shadow: --soft-shadow(1rem 2em 24px currentColor); }',
    'a { box-shadow: calc(0.0625 * 1rem) calc(0.0625 * 2em) calc(0.0625 * 24px) rgb(from currentColor r g b / calc(alpha * 0.25)), calc(0.25 * 1rem) calc(0.25 * 2em) calc(0.25 * 24px) rgb(from currentColor r g b / calc(alpha * 0.5)), calc(0.5625 * 1rem) calc(0.5625 * 2em) calc(0.5625 * 24px) rgb(from currentColor r g b / calc(alpha * 0.75)), calc(1 * 1rem) calc(1 * 2em) calc(1 * 24px) rgb(from currentColor r g b / calc(alpha * 1)); }'
  )
})

test('handles whitespace variations in parameters', () => {
  run(
    'a { box-shadow: --sharp-shadow( 1px   2px   6px   red ); }',
    'a { box-shadow: calc(1 * 1px) calc(1 * 2px) calc(1 * 6px) rgb(from red r g b / calc(alpha * 1)); }'
  )
})

test('preserves other box-shadow values when mixed', () => {
  run(
    'a { box-shadow: inset 0 1px 0 white, --sharp-shadow(2px 2px 4px black), 0 0 0 1px blue; }',
    'a { box-shadow: inset 0 1px 0 white, calc(1 * 2px) calc(1 * 2px) calc(1 * 4px) rgb(from black r g b / calc(alpha * 1)), 0 0 0 1px blue; }'
  )
})

test('ignores shadow functions in non-shadow properties', () => {
  run(
    'a { content: "--sharp-shadow(1px 2px 3px red)"; background: url("test--soft-shadow(1px 2px 3px blue)"); }',
    'a { content: "--sharp-shadow(1px 2px 3px red)"; background: url("test--soft-shadow(1px 2px 3px blue)"); }'
  )
})

test('handles deeply nested parentheses', () => {
  run(
    'a { box-shadow: --linear-shadow(calc((1px + 2px) * (3 + 4)) calc(min(max(1px, 2px), 10px)) 12px hsl(calc(var(--base-hue, 0) + (var(--offset, 30) * 2)), 50%, 50%)); }',
    'a { box-shadow: calc(0.25 * calc((1px + 2px) * (3 + 4))) calc(0.25 * calc(min(max(1px, 2px), 10px))) calc(0.25 * 12px) rgb(from hsl(calc(var(--base-hue, 0) + (var(--offset, 30) * 2)), 50%, 50%) r g b / calc(alpha * 1)), calc(1 * calc((1px + 2px) * (3 + 4))) calc(1 * calc(min(max(1px, 2px), 10px))) calc(1 * 12px) rgb(from hsl(calc(var(--base-hue, 0) + (var(--offset, 30) * 2)), 50%, 50%) r g b / calc(alpha * 1)); }'
  )
})

test('handles same shadow function multiple times in one declaration', () => {
  run(
    'a { box-shadow: --sharp-shadow(1px 1px 6px red), --sharp-shadow(3px 3px 12px blue); }',
    'a { box-shadow: calc(1 * 1px) calc(1 * 1px) calc(1 * 6px) rgb(from red r g b / calc(alpha * 1)), calc(0.25 * 3px) calc(0.25 * 3px) calc(0.25 * 12px) rgb(from blue r g b / calc(alpha * 1)), calc(1 * 3px) calc(1 * 3px) calc(1 * 12px) rgb(from blue r g b / calc(alpha * 0.5)); }'
  )
})

test('throws error for malformed parameters with extra spaces', () => {
  throws(() => {
    run('a { box-shadow: --sharp-shadow(1px 2px 3px red extra); }', '')
  }, /requires exactly 4 parameters.*got 5/)
})

test('throws error for empty parameters', () => {
  throws(() => {
    run('a { box-shadow: --linear-shadow(   ); }', '')
  }, /requires exactly 4 parameters/)
})

test('throws error when hex color is used as first argument', () => {
  throws(() => {
    run('a { box-shadow: --sharp-shadow(#ff0000 2px 10px blue); }', '')
  }, /first parameter must be a length value.*got.*#ff0000/)
})

test('throws error when oklch() color is used as first argument', () => {
  throws(() => {
    run('a { box-shadow: --soft-shadow(oklch(0.5 0.2 180) 2px 10px red); }', '')
  }, /first parameter must be a length value.*got.*oklch\(0\.5 0\.2 180\)/)
})

test('throws error when rgba() color is used as first argument', () => {
  throws(() => {
    run(
      'a { box-shadow: --linear-shadow(rgba(255, 0, 0, 0.5) 2px 10px green); }',
      ''
    )
  }, /first parameter must be a length value.*got.*rgba\(255, 0, 0, 0\.5\)/)
})

test('throws error when hsl() color is used as first argument', () => {
  throws(() => {
    run(
      'a { box-shadow: --sharp-shadow(hsl(0, 100%, 50%) 2px 10px black); }',
      ''
    )
  }, /first parameter must be a length value.*got.*hsl\(0, 100%, 50%\)/)
})

test('throws error when named color is used as first argument', () => {
  throws(() => {
    run('a { box-shadow: --soft-shadow(red 2px 10px blue); }', '')
  }, /first parameter must be a length value.*got.*red/)
})

test('throws error when currentColor is used as first argument', () => {
  throws(() => {
    run('a { box-shadow: --linear-shadow(currentColor 2px 10px red); }', '')
  }, /first parameter must be a length value.*got.*currentColor/)
})

test('handles multiple --soft-shadow in same declaration', () => {
  run(
    'a { box-shadow: --soft-shadow(1px 2px 12px red), --soft-shadow(3px 4px 18px blue); }',
    'a { box-shadow: calc(0.25 * 1px) calc(0.25 * 2px) calc(0.25 * 12px) rgb(from red r g b / calc(alpha * 0.5)), calc(1 * 1px) calc(1 * 2px) calc(1 * 12px) rgb(from red r g b / calc(alpha * 1)), calc(0.1111 * 3px) calc(0.1111 * 4px) calc(0.1111 * 18px) rgb(from blue r g b / calc(alpha * 0.333)), calc(0.4444 * 3px) calc(0.4444 * 4px) calc(0.4444 * 18px) rgb(from blue r g b / calc(alpha * 0.667)), calc(1 * 3px) calc(1 * 4px) calc(1 * 18px) rgb(from blue r g b / calc(alpha * 1)); }'
  )
})

test('handles inset keyword in shadow functions', () => {
  run(
    'a { box-shadow: --sharp-shadow(inset 2px 4px 10px red); }',
    'a { box-shadow: inset calc(0.25 * 2px) calc(0.25 * 4px) calc(0.25 * 10px) rgb(from red r g b / calc(alpha * 1)), inset calc(1 * 2px) calc(1 * 4px) calc(1 * 10px) rgb(from red r g b / calc(alpha * 0.5)); }'
  )
})

test('handles inset keyword at end of parameters', () => {
  run(
    'a { box-shadow: --soft-shadow(2px 4px 12px blue inset); }',
    'a { box-shadow: inset calc(0.25 * 2px) calc(0.25 * 4px) calc(0.25 * 12px) rgb(from blue r g b / calc(alpha * 0.5)), inset calc(1 * 2px) calc(1 * 4px) calc(1 * 12px) rgb(from blue r g b / calc(alpha * 1)); }'
  )
})

test('handles inset with multiple shadow functions', () => {
  run(
    'a { box-shadow: --linear-shadow(inset 1px 2px 6px red), --sharp-shadow(3px 4px 12px blue); }',
    'a { box-shadow: inset calc(1 * 1px) calc(1 * 2px) calc(1 * 6px) rgb(from red r g b / calc(alpha * 1)), calc(0.25 * 3px) calc(0.25 * 4px) calc(0.25 * 12px) rgb(from blue r g b / calc(alpha * 1)), calc(1 * 3px) calc(1 * 4px) calc(1 * 12px) rgb(from blue r g b / calc(alpha * 0.5)); }'
  )
})

test('handles parameters with internal commas in functions', () => {
  run(
    'a { box-shadow: --soft-shadow(1px 2px 12px rgba(255, 128, 64, 0.8)); }',
    'a { box-shadow: calc(0.25 * 1px) calc(0.25 * 2px) calc(0.25 * 12px) rgb(from rgba(255, 128, 64, 0.8) r g b / calc(alpha * 0.5)), calc(1 * 1px) calc(1 * 2px) calc(1 * 12px) rgb(from rgba(255, 128, 64, 0.8) r g b / calc(alpha * 1)); }'
  )
})
