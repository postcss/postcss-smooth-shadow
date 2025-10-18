import { deepEqual, equal, throws } from 'node:assert/strict'
import { readdirSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { test } from 'node:test'
import postcss from 'postcss'

import plugin, { renderShadows } from '../index.js'

const FIXTURES = join(import.meta.dirname, 'fixtures')

function run(input, opts) {
  postcss([plugin(opts)]).process(input, { from: undefined }).css
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
