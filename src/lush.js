import {
  clamp,
  getValuesForBezierCurve,
  normalize,
  range,
  roundTo
} from './utils.js'

/**
 * @param {{ value: string }} decl
 */
export function replaceLushFunctions(decl) {
  let { color, crispy, inset, offsetX, offsetY, oomph, resolution, variant } =
    parseLushShadow(decl.value)

  let [low, medium, high] = generateShadows({
    color,
    crispy,
    inset,
    lightSource: {
      x: offsetX,
      y: offsetY
    },
    oomph,
    resolution
  })

  let before =
    decl.raws.between && decl.raws.before ? `${decl.raws.before}  ` : ''
  let between =
    decl.raws.between && decl.raws.before ? `,${decl.raws.before}  ` : ', '

  switch (variant) {
    case 'high':
      decl.value = before + high.flat().join(between)
      break
    case 'low':
      decl.value = before + low.flat().join(between)
      break
    case 'medium':
      decl.value = before + medium.flat().join(between)
      break
  }
}

/**
 * Parses --lush-shadow(variant, light-x, light-y, oomph, crispy, resolution, color)
 * @param {string} value - e.g. "--lush-shadow(high 0.24 -0.21 0.52 0.76 0.75 oklch(0 0 0 / 40%))"
 * @returns {Object|null}
 */
function parseLushShadow(value) {
  // Strip wrapper
  let content = value
    .replace(/^--lush-shadow\s*\(/, '')
    .replace(/\)\s*$/, '')
    .trim()

  if (!content) return null

  let parts = []
  let current = ''
  let parenDepth = 0
  let inColor = false

  // Tokenize respecting nested color functions/var()
  for (let char of content) {
    if (char === '(') {
      parenDepth++
      current += char
      if (parenDepth === 1 && !/^[a-zA-Z-]+$/.test(current.trim())) {
        inColor = true
      }
    } else if (char === ')') {
      parenDepth--
      current += char
      if (parenDepth === 0) inColor = false
    } else if (char === ' ' && parenDepth === 0 && !inColor) {
      if (current.trim()) parts.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  if (current.trim()) parts.push(current.trim())

  // Result structure – numbers are now actual numbers
  let result = {
    color: null, // string
    crispy: null, // number | null
    inset: false,
    offsetX: null, // number | null
    offsetY: null, // number | null
    oomph: null, // number | null
    resolution: null, // number | null
    variant: null
  }

  let i = 0

  // 1. Variant (required, first token)
  if (parts.length === 0) return null
  result.variant = parts[i++]
  if (!result.variant || /^[0-9.-]/.test(result.variant)) {
    return null // probably missing variant name
  }

  // 2. Optional inset
  if (i < parts.length && parts[i] === 'inset') {
    result.inset = true
    i++
  }

  // 3. Numeric parameters → convert to number
  let numFields = ['offsetX', 'offsetY', 'oomph', 'crispy', 'resolution']
  let numIdx = 0

  while (i < parts.length && numIdx < numFields.length) {
    let token = parts[i]
    // Very permissive number check (including scientific notation)
    let num = Number(token)
    if (!isNaN(num) && token.trim() !== '') {
      result[numFields[numIdx]] = num
      numIdx++
      i++
    } else {
      break
    }
  }

  // 4. Remaining = color (can contain spaces inside functions)
  if (i < parts.length) {
    result.color = parts.slice(i).join(' ')
  }

  return result
}

/**
 * We'll generate a set of 3 shadows: small, medium, large.
 * Each shadow will have multiple layers, depending on the size.
 * A small shadow might only have 2 shadows, a large might have 6.
 * Though, this is affected by the `layers` property
 *
 * @param {{
 *   inset: boolean;
 *   color: string;
 *   crispy: number;
 *   lightSource: {
 *     x: number;
 *     y: number;
 *   };
 *   oomph: number;
 *   resolution: number;
 * }} props
 * @returns
 */
function generateShadows({
  color,
  crispy,
  inset,
  lightSource,
  oomph,
  resolution
}) {
  let output = []

  let SHADOW_LAYER_LIMITS = {
    large: {
      max: 10,
      min: 3
    },
    medium: {
      max: 5,
      min: 2
    },
    small: {
      max: 3,
      min: 2
    }
  }

  for (let size of ['small', 'medium', 'large']) {
    let numOfLayers = Math.round(
      normalize(
        resolution,
        0,
        1,
        SHADOW_LAYER_LIMITS[size].min,
        SHADOW_LAYER_LIMITS[size].max
      )
    )

    let layersForSize = []

    range(numOfLayers).forEach(layerIndex => {
      let opacity = calculateShadowOpacity({
        crispy,
        layerIndex,
        maxLayers: SHADOW_LAYER_LIMITS[size].max,
        minLayers: SHADOW_LAYER_LIMITS[size].min,
        numOfLayers,
        oomph
      })

      let { x, y } = calculateShadowOffsets({
        crispy,
        layerIndex,
        lightSource,
        numOfLayers,
        oomph,
        size
      })

      let blurRadius = calculateBlurRadius({
        crispy,
        layerIndex,
        numOfLayers,
        oomph,
        size,
        x,
        y
      })

      let spread = calculateSpread({
        crispy,
        layerIndex,
        numOfLayers,
        oomph
      })

      let spreadString = spread !== 0 ? `${spread}px ` : ''

      let insetPrefix = inset ? 'inset ' : ''

      layersForSize.push([
        `${x}px ${y}px ${blurRadius}px ${spreadString}${insetPrefix}hsl(from ${color} h s l / ${opacity})`
      ])
    })

    output.push(layersForSize)
  }

  return output
}

/**
 * @param {{
 *   crispy: number;
 *   layerIndex: number;
 *   maxLayers: number;
 *   minLayers: number;
 *   numOfLayers: number;
 *   oomph: number;
 * }} props
 * @returns
 */
function calculateShadowOpacity({
  crispy,
  layerIndex,
  maxLayers,
  minLayers,
  numOfLayers,
  oomph
}) {
  let baseOpacity = normalize(oomph, 0, 1, 0.4, 1.25)

  let initialOpacityMultiplier = normalize(crispy, 0, 1, 0, 1)
  let finalOpacityMultiplier = normalize(crispy, 0, 1, 1, 0)

  // Crispy determines which shadows are more visible, and
  // which shadows are less visible.
  let layerOpacityMultiplier = normalize(
    layerIndex,
    0,
    numOfLayers,
    initialOpacityMultiplier,
    finalOpacityMultiplier
  )

  let opacity = baseOpacity * layerOpacityMultiplier

  // So, here's the problem.
  // The `resolution` param lets us change how many layers are
  // generated. Every additional layer should reduce the opacity
  // of all layers, so that "resolution" doesn't change the
  // perceived opacity.
  let averageLayers = (minLayers + maxLayers) / 2
  let ratio = averageLayers / numOfLayers

  let layerOpacity = opacity * ratio

  layerOpacity *= 0.3

  return clamp(roundTo(layerOpacity, 2), 0, 1)
}

/**
 * @param {{
 *   crispy: number;
 *   layerIndex: number;
 *   lightSource: {
 *     x: number;
 *     y: number;
 *   };
 *   numOfLayers: number;
 *   oomph: number;
 *   size: number;
 * }} param0
 * @returns
 */
function calculateShadowOffsets({
  crispy,
  layerIndex,
  lightSource,
  numOfLayers,
  oomph,
  size
}) {
  let maxOffsetBySize = {
    large: normalize(oomph, 0, 1, 50, 150),
    medium: normalize(oomph, 0, 1, 15, 25),
    small: normalize(oomph, 0, 1, 3, 5)
  }

  // We don't want to use linear interpolation here because we want
  // the shadows to cluster near the front and fall off. Otherwise,
  // the most opaque part of the shadow is in the middle of the
  // group, rather than being near the element.
  // We'll use a bezier curve and pluck points along it.
  let curve = {
    controlPoint1: [
      normalize(crispy, 0, 1, 0.25, 0),
      normalize(crispy, 0, 1, 0.25, 0)
    ],
    controlPoint2: [
      normalize(crispy, 0, 1, 0.25, 0),
      normalize(crispy, 0, 1, 0.25, 0)
    ],
    endPoint: [1, 0],
    startPoint: [0, 1]
  }
  let t = layerIndex / (numOfLayers - 1)
  let [ratio] = getValuesForBezierCurve(curve, t)

  let max = maxOffsetBySize[size]

  // Now, for x/y offset... we have this lightSource value, with
  // X and Y from -1 to 1.
  let xOffsetMin = normalize(lightSource.x, -1, 1, 1, -1)
  let xOffsetMax = normalize(lightSource.x, -1, 1, max, max * -1)
  let yOffsetMin = normalize(lightSource.y, -1, 1, 1, -1)
  let yOffsetMax = normalize(lightSource.y, -1, 1, max, max * -1)

  let x = roundTo(normalize(ratio, 0, 1, xOffsetMin, xOffsetMax), 1)
  let y = roundTo(normalize(ratio, 0, 1, yOffsetMin, yOffsetMax), 1)

  return { x, y }
}

/**
 * @param {{
 *  crispy: number;
 *  layerIndex: number;
 *  numOfLayers: number;
 *  oomph: number;
 *  size: number;
 *  x: number;
 *  y: number;
 * }} props
 * @returns
 */
function calculateBlurRadius({ crispy, x, y }) {
  // The blur radius should depend on the x/y offset.
  // Calculate the hypothenuse length and use it as the blur radius?
  let hypothenuse = (x ** 2 + y ** 2) ** 0.5

  let radius = normalize(crispy, 0, 1, hypothenuse * 1.5, hypothenuse * 0.75)

  return roundTo(radius, 1)
}

/**
 * @param {{
 *  crispy: number;
 *  layerIndex: number;
 *  numOfLayers: number;
 *  oomph: number;
 * }} props
 * @returns
 */
function calculateSpread({ crispy, layerIndex, numOfLayers }) {
  // return 0;

  if (layerIndex === 0) {
    return 0
  }

  let maxReduction = normalize(crispy, 0, 1, 0, -5)

  let actualReduction = normalize(
    layerIndex + 1,
    1,
    numOfLayers,
    0,
    maxReduction
  )

  return roundTo(actualReduction, 1)
}
