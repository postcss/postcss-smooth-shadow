let { equal, throws } = require('node:assert/strict')
let { test } = require('node:test')
let postcss = require('postcss')

let plugin = require('../')

function run(input, output, opts) {
  let result = postcss([plugin(opts)]).process(input, { from: undefined })
  equal(result.css, output)
  equal(result.warnings().length, 0)
  return result
}

test('replaces --smooth-shadow with layered box shadows', () => {
  run(
    '.card { box-shadow: --smooth-shadow(#000, 10px, 2); }',
    '.card { box-shadow: 0 calc(10px / 2) calc(10px / 2 * 2) oklch(from #000 l c h / 0.25), 0 calc(10px / 2 * 2) calc(10px / 2 * 3) oklch(from #000 l c h / 0.18), 0 calc(10px / 2 * 3) calc(10px / 2 * 4) oklch(from #000 l c h / 0.12); }'
  )
})

test('handles CSS variables as parameters', () => {
  run(
    '.element { box-shadow: --smooth-shadow(var(--shadow-color), var(--shadow-size), var(--shadow-spread)); }',
    '.element { box-shadow: 0 calc(var(--shadow-size) / var(--shadow-spread)) calc(var(--shadow-size) / var(--shadow-spread) * 2) oklch(from var(--shadow-color) l c h / 0.25), 0 calc(var(--shadow-size) / var(--shadow-spread) * 2) calc(var(--shadow-size) / var(--shadow-spread) * 3) oklch(from var(--shadow-color) l c h / 0.18), 0 calc(var(--shadow-size) / var(--shadow-spread) * 3) calc(var(--shadow-size) / var(--shadow-spread) * 4) oklch(from var(--shadow-color) l c h / 0.12); }'
  )
})

test('uses default spread value of 3 when omitted', () => {
  run(
    '.card { box-shadow: --smooth-shadow(#000, 12px); }',
    '.card { box-shadow: 0 calc(12px / 3) calc(12px / 3 * 2) oklch(from #000 l c h / 0.25), 0 calc(12px / 3 * 2) calc(12px / 3 * 3) oklch(from #000 l c h / 0.18), 0 calc(12px / 3 * 3) calc(12px / 3 * 4) oklch(from #000 l c h / 0.12); }'
  )
})

test('handles mix of two and three parameter calls', () => {
  run(
    '.mixed { box-shadow: --smooth-shadow(#000, 6px), --smooth-shadow(#fff, 4px, 2); }',
    '.mixed { box-shadow: 0 calc(6px / 3) calc(6px / 3 * 2) oklch(from #000 l c h / 0.25), 0 calc(6px / 3 * 2) calc(6px / 3 * 3) oklch(from #000 l c h / 0.18), 0 calc(6px / 3 * 3) calc(6px / 3 * 4) oklch(from #000 l c h / 0.12), 0 calc(4px / 2) calc(4px / 2 * 2) oklch(from #fff l c h / 0.25), 0 calc(4px / 2 * 2) calc(4px / 2 * 3) oklch(from #fff l c h / 0.18), 0 calc(4px / 2 * 3) calc(4px / 2 * 4) oklch(from #fff l c h / 0.12); }'
  )
})

test('handles multiple --smooth-shadow calls in same declaration', () => {
  run(
    '.card { box-shadow: --smooth-shadow(#000, 5px, 1), inset --smooth-shadow(#fff, 2px, 1); }',
    '.card { box-shadow: 0 calc(5px / 1) calc(5px / 1 * 2) oklch(from #000 l c h / 0.25), 0 calc(5px / 1 * 2) calc(5px / 1 * 3) oklch(from #000 l c h / 0.18), 0 calc(5px / 1 * 3) calc(5px / 1 * 4) oklch(from #000 l c h / 0.12), inset 0 calc(2px / 1) calc(2px / 1 * 2) oklch(from #fff l c h / 0.25), 0 calc(2px / 1 * 2) calc(2px / 1 * 3) oklch(from #fff l c h / 0.18), 0 calc(2px / 1 * 3) calc(2px / 1 * 4) oklch(from #fff l c h / 0.12); }'
  )
})

test('works with different color formats', () => {
  run(
    '.test { box-shadow: --smooth-shadow(rgb(255, 0, 0), 8px, 2); }',
    '.test { box-shadow: 0 calc(8px / 2) calc(8px / 2 * 2) oklch(from rgb(255, 0, 0) l c h / 0.25), 0 calc(8px / 2 * 2) calc(8px / 2 * 3) oklch(from rgb(255, 0, 0) l c h / 0.18), 0 calc(8px / 2 * 3) calc(8px / 2 * 4) oklch(from rgb(255, 0, 0) l c h / 0.12); }'
  )
})

test('handles decimal values', () => {
  run(
    '.button { box-shadow: --smooth-shadow(#333, 4.5px, 1.5); }',
    '.button { box-shadow: 0 calc(4.5px / 1.5) calc(4.5px / 1.5 * 2) oklch(from #333 l c h / 0.25), 0 calc(4.5px / 1.5 * 2) calc(4.5px / 1.5 * 3) oklch(from #333 l c h / 0.18), 0 calc(4.5px / 1.5 * 3) calc(4.5px / 1.5 * 4) oklch(from #333 l c h / 0.12); }'
  )
})

test('leaves other declarations unchanged', () => {
  run(
    '.normal { color: red; background: blue; }',
    '.normal { color: red; background: blue; }'
  )
})

test('works in other properties besides box-shadow', () => {
  run(
    '.custom { filter: drop-shadow(--smooth-shadow(#000, 3px, 1)); }',
    '.custom { filter: drop-shadow(0 calc(3px / 1) calc(3px / 1 * 2) oklch(from #000 l c h / 0.25), 0 calc(3px / 1 * 2) calc(3px / 1 * 3) oklch(from #000 l c h / 0.18), 0 calc(3px / 1 * 3) calc(3px / 1 * 4) oklch(from #000 l c h / 0.12)); }'
  )
})

test('throws error for insufficient parameters', () => {
  let input = '.error { box-shadow: --smooth-shadow(#000); }'
  throws(() => {
    postcss([plugin]).process(input, { from: undefined }).css
  }, '--smooth-shadow() requires 2 or 3 parameters')
})

test('throws error for too many parameters', () => {
  let input = '.error { box-shadow: --smooth-shadow(#000, 10px, 2, extra); }'
  throws(() => {
    postcss([plugin]).process(input, { from: undefined }).css
  }, '--smooth-shadow() requires 2 or 3 parameters')
})

test('handles quoted parameters with single quotes', () => {
  run(
    `.card { box-shadow: --smooth-shadow('rgba(255, 0, 0, 0.5)', 10px); }`,
    `.card { box-shadow: 0 calc(10px / 3) calc(10px / 3 * 2) oklch(from 'rgba(255, 0, 0, 0.5)' l c h / 0.25), 0 calc(10px / 3 * 2) calc(10px / 3 * 3) oklch(from 'rgba(255, 0, 0, 0.5)' l c h / 0.18), 0 calc(10px / 3 * 3) calc(10px / 3 * 4) oklch(from 'rgba(255, 0, 0, 0.5)' l c h / 0.12); }`
  )
})

test('handles quoted parameters with double quotes', () => {
  run(
    `.card { box-shadow: --smooth-shadow("rgba(0, 255, 0, 0.8)", 8px, 2); }`,
    `.card { box-shadow: 0 calc(8px / 2) calc(8px / 2 * 2) oklch(from "rgba(0, 255, 0, 0.8)" l c h / 0.25), 0 calc(8px / 2 * 2) calc(8px / 2 * 3) oklch(from "rgba(0, 255, 0, 0.8)" l c h / 0.18), 0 calc(8px / 2 * 3) calc(8px / 2 * 4) oklch(from "rgba(0, 255, 0, 0.8)" l c h / 0.12); }`
  )
})

test('handles complex nested functions in parameters', () => {
  run(
    '.card { box-shadow: --smooth-shadow(calc(10px + 5px), min(20px, 30px), 2); }',
    '.card { box-shadow: 0 calc(min(20px, 30px) / 2) calc(min(20px, 30px) / 2 * 2) oklch(from calc(10px + 5px) l c h / 0.25), 0 calc(min(20px, 30px) / 2 * 2) calc(min(20px, 30px) / 2 * 3) oklch(from calc(10px + 5px) l c h / 0.18), 0 calc(min(20px, 30px) / 2 * 3) calc(min(20px, 30px) / 2 * 4) oklch(from calc(10px + 5px) l c h / 0.12); }'
  )
})

test('handles quoted strings with commas inside', () => {
  run(
    `.card { box-shadow: --smooth-shadow("rgb(255, 0, 0)", 10px); }`,
    `.card { box-shadow: 0 calc(10px / 3) calc(10px / 3 * 2) oklch(from "rgb(255, 0, 0)" l c h / 0.25), 0 calc(10px / 3 * 2) calc(10px / 3 * 3) oklch(from "rgb(255, 0, 0)" l c h / 0.18), 0 calc(10px / 3 * 3) calc(10px / 3 * 4) oklch(from "rgb(255, 0, 0)" l c h / 0.12); }`
  )
})

test('handles declarations without --smooth-shadow', () => {
  run(
    '.card { box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); }',
    '.card { box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); }'
  )
})

test('handles deeply nested parentheses in parameters', () => {
  run(
    '.card { box-shadow: --smooth-shadow(hsl(calc(180deg + 45deg), calc(50% + 10%), calc(25% + 5%)), max(10px, min(20px, 15px)), 2); }',
    '.card { box-shadow: 0 calc(max(10px, min(20px, 15px)) / 2) calc(max(10px, min(20px, 15px)) / 2 * 2) oklch(from hsl(calc(180deg + 45deg), calc(50% + 10%), calc(25% + 5%)) l c h / 0.25), 0 calc(max(10px, min(20px, 15px)) / 2 * 2) calc(max(10px, min(20px, 15px)) / 2 * 3) oklch(from hsl(calc(180deg + 45deg), calc(50% + 10%), calc(25% + 5%)) l c h / 0.18), 0 calc(max(10px, min(20px, 15px)) / 2 * 3) calc(max(10px, min(20px, 15px)) / 2 * 4) oklch(from hsl(calc(180deg + 45deg), calc(50% + 10%), calc(25% + 5%)) l c h / 0.12); }'
  )
})
