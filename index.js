function parseParameters(paramString) {
  let params = []
  let current = ''
  let depth = 0
  let inQuotes = false
  let quoteChar = ''

  for (let i = 0; i < paramString.length; i++) {
    let char = paramString[i]

    if (!inQuotes && (char === '"' || char === "'")) {
      inQuotes = true
      quoteChar = char
      current += char
    } else if (inQuotes && char === quoteChar) {
      inQuotes = false
      quoteChar = ''
      current += char
    } else if (!inQuotes && char === '(') {
      depth++
      current += char
    } else if (!inQuotes && char === ')') {
      depth--
      current += char
    } else if (!inQuotes && char === ',' && depth === 0) {
      params.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  if (current.trim()) {
    params.push(current.trim())
  }

  return params
}

function findMatchingParen(str, startIndex) {
  let depth = 1
  for (let i = startIndex + 1; i < str.length; i++) {
    if (str[i] === '(') depth++
    else if (str[i] === ')') depth--
    if (depth === 0) return i
  }
  /* c8 ignore next */
  return -1
}

module.exports = () => {
  return {
    Declaration(decl) {
      if (decl.value.includes('--smooth-shadow(')) {
        let result = decl.value
        let index = 0

        let funcStart = result.indexOf('--smooth-shadow(', index)
        while (funcStart !== -1) {
          let parenStart = funcStart + '--smooth-shadow('.length - 1
          let parenEnd = findMatchingParen(result, parenStart)
          if (parenEnd === -1) break

          let paramString = result.substring(parenStart + 1, parenEnd)
          let params = parseParameters(paramString)

          if (params.length < 2 || params.length > 3) {
            throw decl.error(
              '--smooth-shadow() requires 2 or 3 parameters: color, size, and optional spread (defaults to 3)'
            )
          }

          let [color, size, spread = '3'] = params

          let replacement =
            `0 calc(${size} / ${spread}) calc(${size} / ${spread} * 2) oklch(from ${color} l c h / 0.25), ` +
            `0 calc(${size} / ${spread} * 2) calc(${size} / ${spread} * 3) oklch(from ${color} l c h / 0.18), ` +
            `0 calc(${size} / ${spread} * 3) calc(${size} / ${spread} * 4) oklch(from ${color} l c h / 0.12)`

          result =
            result.substring(0, funcStart) +
            replacement +
            result.substring(parenEnd + 1)
          index = funcStart + replacement.length
          funcStart = result.indexOf('--smooth-shadow(', index)
        }

        decl.value = result
      }
    },
    postcssPlugin: 'postcss-smooth-shadow'
  }
}
module.exports.postcss = true
