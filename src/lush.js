import valueParser from 'postcss-value-parser'

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
  let [variant, inset, x, y, oomph, crispy, resolution, color] =
    parseLushShadow(decl)

  let [low, medium, high] = renderLushShadows(
    inset,
    x,
    y,
    oomph,
    crispy,
    resolution,
    color
  )

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

  return decl
}

/**
 * @param {{ value: string }} decl
 * @returns {[string, boolean, number, number, number, number, number, string]}
 */
export function parseLushShadow(decl) {
  let parsed = valueParser(decl.value)

  let args = [
    'variant',
    'inset',
    'light-x',
    'light-y',
    'oomph',
    'crispy',
    'resolution',
    'color'
  ]

  let node = parsed.nodes.find(
    ({ type, value }) => type === 'function' && value === '--lush-shadow'
  )

  if (node === undefined) {
    return
  }

  let nodes = node.nodes.filter(
    fnNode =>
      fnNode.type !== 'space' &&
      fnNode.type !== 'comment' &&
      fnNode.type !== 'div'
  )

  if (nodes.length !== 7 && nodes.length !== 8) {
    throw decl.error(
      `'--lush-shadow(variant inset? light-x light-y oomph crispy resolution color) requires 7-8 params got ${nodes.length}`,
      { index: node.startIndex }
    )
  }

  return nodes.reduce((previous, valueNode, index) => {
    if (index === 0 && valueNode.type === 'word') {
      if (['high', 'low', 'medium'].includes(valueNode.value.toLowerCase())) {
        return [...previous, valueNode.value]
      }

      throw decl.error(
        `'--lush-shadow(variant inset? light-x light-y oomph crispy resolution color) variant to be "low", "medium" or "high" got ${valueNode.value}`,
        { index: valueNode.sourceIndex }
      )
    }

    if (index === 1 && valueNode.type === 'word') {
      if (valueNode.value === 'inset') {
        return [...previous, true]
      } else if (/^-?\d+(\.\d+)?$/.test(valueNode.value)) {
        previous.push(false)
      }
    }

    if (index < nodes.length - 1) {
      if (/^-?\d+(\.\d+)?$/.test(valueNode.value)) {
        return [...previous, Number(valueNode.value)]
      } else {
        let argIndex = previous.length + Math.abs(args.length - nodes.length)

        throw decl.error(
          `'--lush-shadow(variant inset? light-x light-y oomph crispy resolution color) ${args[argIndex]} to be number got ${valueNode.value}`,
          { index: node.sourceIndex + valueNode.sourceIndex }
        )
      }
    }

    if (valueNode.type === 'word' && index === nodes.length - 1) {
      return [...previous, valueNode.value]
    }

    return [
      ...previous,
      decl.value.substring(valueNode.sourceIndex, valueNode.sourceEndIndex)
    ]
  }, [])
}

/**
 * We'll generate a set of 3 shadows: small, medium, large.
 * Each shadow will have multiple layers, depending on the size.
 * A small shadow might only have 2 shadows, a large might have 6.
 * Though, this is affected by the `layers` property
 *
 * @param {boolean} inset
 * @param {number} lightX
 * @param {number} lightY
 * @param {number} oomph
 * @param {number} crispy
 * @param {number} resolution
 * @param {color} color
 * @returns
 */
export function renderLushShadows(
  inset,
  lightX,
  lightY,
  oomph,
  crispy,
  resolution,
  color
) {
  /**
   * @type {[string[], string[], string[]]}
   */
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
        lightSource: {
          x: lightX,
          y: lightY
        },
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
