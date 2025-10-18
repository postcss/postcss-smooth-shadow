#!/usr/bin/env node

import { readdir, readFile, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import postcss from 'postcss'

import plugin from '../index.js'

const FIXTURES = join(import.meta.dirname, 'fixtures')

export function run(input) {
  return postcss([plugin({})]).process(input, { from: undefined }).css
}

let tests = (await readdir(FIXTURES)).filter(i => !i.endsWith('.out.css'))
await Promise.all(
  tests.map(async input => {
    await writeFile(
      join(FIXTURES, `${basename(input, '.css')}.out.css`),
      run(await readFile(join(FIXTURES, input)))
    )
  })
)
