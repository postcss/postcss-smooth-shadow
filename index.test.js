let { equal, throws } = require('node:assert/strict')
let { test } = require('node:test')
let postcss = require('postcss')

let plugin = require('./')

function run(input, output, opts) {
  let result = postcss([plugin(opts)]).process(input, { from: undefined })
  equal(result.css, output)
  equal(result.warnings().length, 0)
  return result
}

test('replaces --smooth-shadow with layered box shadows', () => {
  run(
    '.card { box-shadow: --smooth-shadow(#000, 10px, 2); }',
    '.card { box-shadow: 0 calc(10px / 2) calc(10px / 2 * 2) rgb(from #000 r g b / 0.25), 0 calc(10px / 2 * 2) calc(10px / 2 * 3) rgb(from #000 r g b / 0.18), 0 calc(10px / 2 * 3) calc(10px / 2 * 4) rgb(from #000 r g b / 0.12); }'
  )
})

test('handles CSS variables as parameters', () => {
  run(
    '.element { box-shadow: --smooth-shadow(var(--shadow-color), var(--shadow-size), var(--shadow-spread)); }',
    '.element { box-shadow: 0 calc(var(--shadow-size) / var(--shadow-spread)) calc(var(--shadow-size) / var(--shadow-spread) * 2) rgb(from var(--shadow-color) r g b / 0.25), 0 calc(var(--shadow-size) / var(--shadow-spread) * 2) calc(var(--shadow-size) / var(--shadow-spread) * 3) rgb(from var(--shadow-color) r g b / 0.18), 0 calc(var(--shadow-size) / var(--shadow-spread) * 3) calc(var(--shadow-size) / var(--shadow-spread) * 4) rgb(from var(--shadow-color) r g b / 0.12); }'
  )
})

test('uses default spread value of 3 when omitted', () => {
  run(
    '.card { box-shadow: --smooth-shadow(#000, 12px); }',
    '.card { box-shadow: 0 calc(12px / 3) calc(12px / 3 * 2) rgb(from #000 r g b / 0.25), 0 calc(12px / 3 * 2) calc(12px / 3 * 3) rgb(from #000 r g b / 0.18), 0 calc(12px / 3 * 3) calc(12px / 3 * 4) rgb(from #000 r g b / 0.12); }'
  )
})

test('handles mix of two and three parameter calls', () => {
  run(
    '.mixed { box-shadow: --smooth-shadow(#000, 6px), --smooth-shadow(#fff, 4px, 2); }',
    '.mixed { box-shadow: 0 calc(6px / 3) calc(6px / 3 * 2) rgb(from #000 r g b / 0.25), 0 calc(6px / 3 * 2) calc(6px / 3 * 3) rgb(from #000 r g b / 0.18), 0 calc(6px / 3 * 3) calc(6px / 3 * 4) rgb(from #000 r g b / 0.12), 0 calc(4px / 2) calc(4px / 2 * 2) rgb(from #fff r g b / 0.25), 0 calc(4px / 2 * 2) calc(4px / 2 * 3) rgb(from #fff r g b / 0.18), 0 calc(4px / 2 * 3) calc(4px / 2 * 4) rgb(from #fff r g b / 0.12); }'
  )
})

test('handles multiple --smooth-shadow calls in same declaration', () => {
  run(
    '.card { box-shadow: --smooth-shadow(#000, 5px, 1), inset --smooth-shadow(#fff, 2px, 1); }',
    '.card { box-shadow: 0 calc(5px / 1) calc(5px / 1 * 2) rgb(from #000 r g b / 0.25), 0 calc(5px / 1 * 2) calc(5px / 1 * 3) rgb(from #000 r g b / 0.18), 0 calc(5px / 1 * 3) calc(5px / 1 * 4) rgb(from #000 r g b / 0.12), inset 0 calc(2px / 1) calc(2px / 1 * 2) rgb(from #fff r g b / 0.25), 0 calc(2px / 1 * 2) calc(2px / 1 * 3) rgb(from #fff r g b / 0.18), 0 calc(2px / 1 * 3) calc(2px / 1 * 4) rgb(from #fff r g b / 0.12); }'
  )
})

test('works with different color formats', () => {
  run(
    '.test { box-shadow: --smooth-shadow(rgb(255, 0, 0), 8px, 2); }',
    '.test { box-shadow: 0 calc(8px / 2) calc(8px / 2 * 2) rgb(from rgb(255, 0, 0) r g b / 0.25), 0 calc(8px / 2 * 2) calc(8px / 2 * 3) rgb(from rgb(255, 0, 0) r g b / 0.18), 0 calc(8px / 2 * 3) calc(8px / 2 * 4) rgb(from rgb(255, 0, 0) r g b / 0.12); }'
  )
})

test('handles decimal values', () => {
  run(
    '.button { box-shadow: --smooth-shadow(#333, 4.5px, 1.5); }',
    '.button { box-shadow: 0 calc(4.5px / 1.5) calc(4.5px / 1.5 * 2) rgb(from #333 r g b / 0.25), 0 calc(4.5px / 1.5 * 2) calc(4.5px / 1.5 * 3) rgb(from #333 r g b / 0.18), 0 calc(4.5px / 1.5 * 3) calc(4.5px / 1.5 * 4) rgb(from #333 r g b / 0.12); }'
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
    '.custom { filter: drop-shadow(0 calc(3px / 1) calc(3px / 1 * 2) rgb(from #000 r g b / 0.25), 0 calc(3px / 1 * 2) calc(3px / 1 * 3) rgb(from #000 r g b / 0.18), 0 calc(3px / 1 * 3) calc(3px / 1 * 4) rgb(from #000 r g b / 0.12)); }'
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
