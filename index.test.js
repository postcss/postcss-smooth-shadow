let { equal } = require('node:assert')
let { test } = require('node:test')
let postcss = require('postcss')

let plugin = require('./')

function run(input, output, opts) {
  let result = postcss([plugin(opts)]).process(input, { from: undefined })
  equal(result.css, output)
  equal(result.warnings().length, 0)
  return result
}

test('exists', () => {
  run('', '')
})
