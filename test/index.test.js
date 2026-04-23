import { deepEqual, equal, throws } from 'node:assert/strict'
import { readdirSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { test } from 'node:test'
import postcss from 'postcss'

import plugin, { renderShadows } from '../index.js'
import { parseLushShadow } from '../src/lush.js'
import {
  clamp,
  getValuesForBezierCurve,
  normalize,
  range,
  roundTo
} from '../src/utils.js' // adjust path as needed

const FIXTURES = join(import.meta.dirname, 'fixtures')

export function run(input) {
  return postcss([plugin({})]).process(input, { from: undefined }).css
}

let tests = readdirSync(FIXTURES).filter(i => !i.endsWith('.out.css'))
for (let input of tests) {
  let name = input.replace('.css', '').replaceAll('-', ' ')
  test(name, async () => {
    let inputPath = join(FIXTURES, input)
    let outputPath = join(FIXTURES, `${basename(input, '.css')}.out.css`)

    let inputCSS = await readFile(inputPath, 'utf8')
    let outputCSS = await readFile(outputPath, 'utf8')

    let result = postcss([plugin({})]).process(inputCSS, { from: inputPath })
    equal(result.css, outputCSS)
    equal(result.warnings().length, 0)
  })
}

test('has JS API', () => {
  deepEqual(renderShadows('sharp', false, '2px', '4px', '10px', 'red'), [
    'calc(0.25 * 2px) calc(0.25 * 4px) calc(0.25 * 10px) rgb(from red r g b / calc(alpha * 1))',
    'calc(1 * 2px) calc(1 * 4px) calc(1 * 10px) rgb(from red r g b / calc(alpha * 0.5))'
  ])
})

test('throws error for unclosed parenthesis in shadow function', () => {
  throws(() => {
    run('a { box-shadow: "--sharp-shadow(calc(1px"; }')
  }, /Unclosed parenthesis/)
})

test('throws error for wrong parameter count - too few', () => {
  throws(() => {
    run('a { box-shadow: --sharp-shadow(1px 2px 3px); }')
  }, /requires 4 params/)
})

test('throws error for wrong parameter count - too many', () => {
  throws(() => {
    run('a { box-shadow: --soft-shadow(1px 2px 3px red extra); }')
  }, /requires 4 params/)
})

test('throws error for wrong parameter count - no parameters', () => {
  throws(() => {
    run('a { box-shadow: --linear-shadow(); }')
  }, /requires 4 params/)
})

test('throws error for malformed parameters with extra spaces', () => {
  throws(() => {
    run('a { box-shadow: --sharp-shadow(1px 2px 3px red extra); }')
  }, /requires 4 params/)
})

test('throws error for empty parameters', () => {
  throws(() => {
    run('a { box-shadow: --linear-shadow(   ); }')
  }, /requires 4 params/)
})

test('throws error when hex color is used as first argument', () => {
  throws(() => {
    run('a { box-shadow: --sharp-shadow(#ff0000 2px 10px blue); }')
  }, /first parameter must be a length not color #ff0000/)
})

test('throws error when hsl() color is used as first argument', () => {
  throws(() => {
    run('a { box-shadow: --sharp-shadow(hsl(0, 100%, 50%) 2px 10px black); }')
  }, /first parameter must be a length not color hsl/)
})

test('throws error when named color is used as first argument', () => {
  throws(() => {
    run('a { box-shadow: --soft-shadow(red 2px 10px blue); }')
  }, /first parameter must be a length not color red/)
})

test('throws error when currentColor is used as first argument', () => {
  throws(() => {
    run('a { box-shadow: --linear-shadow(currentColor 2px 10px red); }')
  }, /first parameter must be a length not color currentColor/)
})

test('normalize - basic linear mapping from one range to another', () => {
  equal(normalize(50, 0, 100), 0.5)
  equal(normalize(0, 0, 100), 0)
  equal(normalize(100, 0, 100), 1)
  equal(normalize(75, 50, 100), 0.5)
})

test('normalize - custom output range', () => {
  equal(normalize(50, 0, 100, 0, 255), 127.5)
  equal(normalize(0, 0, 100, -1, 1), -1)
  equal(normalize(100, 0, 100, -50, 50), 50)
  equal(normalize(30, 10, 90, 200, 800), 350)
})

test('normalize - same input and output range', () => {
  equal(normalize(42, 0, 100, 0, 100), 42)
})

test('clamp - standard usage (min < max)', () => {
  equal(clamp(5, 0, 10), 5)
  equal(clamp(-3, 0, 10), 0)
  equal(clamp(15, 0, 10), 10)
})

test('clamp - inverted min/max (min > max)', () => {
  equal(clamp(7, 10, 5), 7) // inside → no change
  equal(clamp(3, 10, 5), 5) // below lower bound → becomes actual max (5)
  equal(clamp(12, 10, 5), 10) // above upper bound → becomes actual min (10)
  equal(clamp(5, 10, 5), 5)
  equal(clamp(10, 10, 5), 10)
})

test('clamp - default min=0, max=1', () => {
  equal(clamp(0.6), 0.6)
  equal(clamp(-0.1), 0)
  equal(clamp(1.3), 1)
})

test('range - default step=1, start from 0', () => {
  deepEqual(range(5), [0, 1, 2, 3, 4])
  deepEqual(range(3), [0, 1, 2])
})

test('range - start and end specified', () => {
  deepEqual(range(2, 7), [2, 3, 4, 5, 6])
  deepEqual(range(-2, 3), [-2, -1, 0, 1, 2])
})

test('range - with custom step', () => {
  deepEqual(range(0, 10, 2), [0, 2, 4, 6, 8])
  deepEqual(range(1, 2, 0.25), [1, 1.25, 1.5, 1.75])
  deepEqual(range(10, 0, -2), []) // note: loop doesn't run backwards
})

test('range - empty ranges', () => {
  deepEqual(range(5, 5), [])
  deepEqual(range(10, 5), []) // no backwards iteration
  deepEqual(range(0, 0), [])
})

test('roundTo - default to integer', () => {
  equal(roundTo(3.7), 4)
  equal(roundTo(3.2), 3)
  equal(roundTo(-1.6), -2)
})

test('roundTo - specific decimal places', () => {
  equal(roundTo(3.14159, 2), 3.14)
  equal(roundTo(3.146, 2), 3.15)
  equal(roundTo(1.23456, 4), 1.2346)
  equal(roundTo(9.87654321, 0), 10)
  equal(roundTo(42.5, -1), 40) // tens place
})

test('getValuesForBezierCurve - quadratic (only controlPoint1)', () => {
  let points = {
    controlPoint1: [50, 100],
    controlPoint2: null, // or undefined
    endPoint: [100, 0],
    startPoint: [0, 0]
  }

  deepEqual(getValuesForBezierCurve(points, 0), [0, 0])
  deepEqual(getValuesForBezierCurve(points, 1), [100, 0])
  deepEqual(
    getValuesForBezierCurve(points, 0.5).map(v => Math.round(v)),
    [50, 50]
  )
})

test('getValuesForBezierCurve - cubic (with controlPoint2)', () => {
  let points = {
    controlPoint1: [20, 80],
    controlPoint2: [80, 20],
    endPoint: [100, 100],
    startPoint: [0, 0]
  }

  deepEqual(getValuesForBezierCurve(points, 0), [0, 0])
  deepEqual(getValuesForBezierCurve(points, 1), [100, 100])

  let mid = getValuesForBezierCurve(points, 0.5).map(v => Math.round(v))
  deepEqual(mid, [50, 50]) // approximate for this symmetric-ish curve
})

////////////////////////////////////////
////////////////////////////////////////
////////////////////////////////////////
////////////////////////////////////////

test('correctly parses lush shadow with low variant', () => {
  run(
    'a { box-shadow: --lush-shadow(low -0.25 -0.5 0.5 0.5 0.75 oklch(0 0 0 / 15%)); }'
  )
})

test('correctly parses lush shadow with medium variant', () => {
  run(
    'a { box-shadow: --lush-shadow(medium -0.25 -0.5 0.5 0.5 0.75 oklch(0 0 0 / 15%)); }'
  )
})

test('correctly parses lush shadow with high variant', () => {
  run(
    'a { box-shadow: --lush-shadow(high -0.25 -0.5 0.5 0.5 0.75 oklch(0 0 0 / 15%)); }'
  )
})

test('correctly parses lush shadow with inset', () => {
  run(
    'a { box-shadow: --lush-shadow(low inset -0.25 -0.5 0.5 0.5 0.75 oklch(0 0 0 / 15%)); }'
  )
})

test('correctly parses hash color', () => {
  run(
    'a { box-shadow: --lush-shadow(low inset -0.25 -0.5 0.5 0.5 0.75 #000000); }'
  )
})

test('parseLushShadow - do nothing if no declaration', () => {
  equal(parseLushShadow({ value: '' }), undefined)
})

test('throws error for wrong parameters count if lush shadow', () => {
  throws(() => {
    run(
      'a { box-shadow: --lush-shadow(low inset -0.25 -0.5 oklch(0 0 0 / 15%)); }'
    )
  }, /requires 7-8 params/)
})

test('throws error for wrong variant in lush shadow', () => {
  throws(() => {
    run(
      'a { box-shadow: --lush-shadow(wrong -0.25 -0.5 0.5 0.5 0.75 oklch(0 0 0 / 15%)); }'
    )
  }, /variant to be "low", "medium" or "high"/)
})

test('throws error when wrong value for light-x', () => {
  throws(() => {
    run(
      'a { box-shadow: --lush-shadow(low -0.25px -0.5 0.5 0.5 0.75 oklch(0 0 0 / 15%)); }'
    )
  }, /light-x to be number/)
})

test('throws error when wrong value for light-x', () => {
  throws(() => {
    run(
      'a { box-shadow: --lush-shadow(low inset -0.25px -0.5 0.5 0.5 0.75 oklch(0 0 0 / 15%)); }'
    )
  }, /light-x to be number/)
})
