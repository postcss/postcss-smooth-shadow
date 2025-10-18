function easeInQuad(x) {
  return x * x
}

function toPx(value) {
  let pixels
  if (value.endsWith('px')) {
    pixels = parseInt(value)
  } else if (value.endsWith('rem')) {
    pixels = parseInt(value) * 16
  }
  if (!pixels || isNaN(pixels)) {
    return 5 * 6
  } else {
    return pixels
  }
}

export function renderShadows(type, inset, x, y, blur, color) {
  let layers = Math.ceil(toPx(blur) / 6)
  let layerIncrement = 1 / layers

  let getAlpha = () => 1
  if (type === 'sharp') {
    getAlpha = i => 1 - i * layerIncrement
  } else if (type === 'soft') {
    getAlpha = i => (i + 1) * layerIncrement
  }

  let shadows = []
  for (let i = 0; i < layers; i++) {
    let step = Number(easeInQuad((i + 1) / layers).toFixed(4))
    let iAlpha = parseFloat(getAlpha(i).toFixed(3))
    let insetPrefix = inset ? 'inset ' : ''
    let cssX = x === '0' ? '0' : `calc(${step} * ${x})`
    let cssY = y === '0' ? '0' : `calc(${step} * ${y})`
    let cssBlur = blur === '0' ? '0' : `calc(${step} * ${blur})`
    let cssColor = `rgb(from ${color} r g b / calc(alpha * ${iAlpha}))`
    shadows.push(`${insetPrefix}${cssX} ${cssY} ${cssBlur} ${cssColor}`)
  }
  return shadows
}

function isColorValue(value) {
  value = value.trim()

  if (/^#([0-9a-fA-F]{3}){1,2}([0-9a-fA-F]{2})?$/.test(value)) {
    return true
  }

  if (/^(rgb|rgba|hsl|hsla|oklch|oklab|lch|lab|color)\s*\(/i.test(value)) {
    return true
  }

  if (/^[a-zA-Z]+$/.test(value)) {
    return true
  }

  return false
}

function checkParams(decl, funcName, params, startIndex) {
  if (params.trim() === '') {
    throw decl.error(
      `${funcName} requires exactly 4 parameters (x, y, blur, color), got 0`,
      { index: startIndex }
    )
  }

  let parsedArgs = parseSpaceSeparatedParams(params.trim())
  let hasInset = false
  let processedArgs = []

  for (let arg of parsedArgs) {
    if (arg.toLowerCase() === 'inset') {
      hasInset = true
    } else {
      processedArgs.push(arg)
    }
  }

  let expectedParams = 4
  if (processedArgs.length !== expectedParams) {
    throw decl.error(
      `${funcName} requires exactly ${expectedParams} parameters (x, y, blur, color), got ${processedArgs.length}`,
      { index: startIndex }
    )
  }

  let firstParam = processedArgs[0].trim()
  if (isColorValue(firstParam)) {
    throw decl.error(
      `${funcName} first parameter must be a length value (x-offset), got: ${firstParam}`,
      { index: startIndex }
    )
  }

  return { args: processedArgs, inset: hasInset }
}

function parseSpaceSeparatedParams(params) {
  let args = []
  let current = ''
  let parenCount = 0
  let i = 0

  while (i < params.length) {
    let char = params[i]

    if (char === '(') {
      parenCount++
      current += char
    } else if (char === ')') {
      parenCount--
      current += char
    } else if (char === ' ' && parenCount === 0) {
      if (current.trim()) {
        args.push(current.trim())
        current = ''
      }
    } else {
      current += char
    }
    i++
  }

  if (current.trim()) {
    args.push(current.trim())
  }

  return args
}

function replaceFunctions(decl, func) {
  let searchPattern = `--${func}-shadow(`
  let result = decl.value
  let currentIndex = 0

  if (!result.includes(searchPattern)) {
    return
  }

  let startIndex = result.indexOf(searchPattern, currentIndex)
  while (startIndex !== -1) {
    let openParenIndex = startIndex + searchPattern.length - 1
    let parseResult = findClosingParenAndParseParams(result, openParenIndex)

    if (parseResult.unclosed) {
      throw decl.error(`Unclosed parenthesis in ${searchPattern}`, {
        index: startIndex
      })
    }

    let { endIndex, params } = parseResult
    let paramResult = checkParams(decl, searchPattern, params, startIndex)
    let [x, y, blur, color] = paramResult.args
    let shadows = renderShadows(func, paramResult.inset, x, y, blur, color)
    let replacement = shadows.join(', ')

    result =
      result.substring(0, startIndex) + replacement + result.substring(endIndex)
    currentIndex = startIndex + replacement.length
    startIndex = result.indexOf(searchPattern, currentIndex)
  }

  decl.value = result
}

function findClosingParenAndParseParams(text, openParenIndex) {
  let current = ''
  let parenCount = 1
  let i = openParenIndex + 1

  while (i < text.length && parenCount > 0) {
    let char = text[i]

    if (char === '(') {
      parenCount++
      current += char
    } else if (char === ')') {
      parenCount--
      if (parenCount === 0) {
        i++
        break
      } else {
        current += char
      }
    } else {
      current += char
    }
    i++
  }

  if (parenCount > 0) {
    return { unclosed: true }
  }

  return { endIndex: i, params: current.trim(), unclosed: false }
}

let plugin = () => {
  return {
    Declaration(decl) {
      if (decl.prop.includes('shadow') && decl.value.includes('-shadow(')) {
        replaceFunctions(decl, 'sharp')
        replaceFunctions(decl, 'soft')
        replaceFunctions(decl, 'linear')
      }
    },
    postcssPlugin: 'postcss-smooth-shadow'
  }
}
plugin.postcss = true

export default plugin
