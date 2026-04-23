/**
 * @param {number} value
 * @param {number} currentScaleMin
 * @param {number} currentScaleMax
 * @param {number} newScaleMin
 * @param {number} newScaleMax
 * @returns {number}
 */
export function normalize(
  value,
  currentScaleMin,
  currentScaleMax,
  newScaleMin = 0,
  newScaleMax = 1
) {
  // First, normalize the value between 0 and 1.
  let standardNormalization =
    (value - currentScaleMin) / (currentScaleMax - currentScaleMin)

  // Next, transpose that value to our desired scale.
  return (newScaleMax - newScaleMin) * standardNormalization + newScaleMin
}

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min = 0, max = 1) {
  // We might be passing in "inverted" values, eg:
  //    clamp(someVal, 10, 5);
  //
  // This is especially common with `clampedNormalize`.
  // In these cases, we'll flip the min/max so that the function works as expected.
  let actualMin = Math.min(min, max)
  let actualMax = Math.max(min, max)

  return Math.max(actualMin, Math.min(actualMax, value))
}

/**
 * @param {number} start
 * @param {number} end
 * @param {number} step
 * @returns {number}
 */
export function range(start, end, step = 1) {
  let output = []

  if (typeof end === 'undefined') {
    end = start
    start = 0
  }

  for (let i = start; i < end; i += step) {
    output.push(i)
  }

  return output
}

/**
 * @param {number} value
 * @param {number} places
 * @returns {number}
 */
export function roundTo(value, places = 0) {
  return Math.round(value * 10 ** places) / 10 ** places
}

/**
 *
 * @param {{
 *   controlPoint1: number,
 *   controlPoint2: number,
 *   endPoint: number,
 *   startPoint: number }} points
 * @param {number} t
 * @returns {[number, number]}
 */
export function getValuesForBezierCurve(
  { controlPoint1, controlPoint2, endPoint, startPoint },
  t
) {
  let x, y

  if (controlPoint2) {
    // Cubic Bezier curve
    x =
      (1 - t) ** 3 * startPoint[0] +
      3 * (1 - t) ** 2 * t * controlPoint1[0] +
      3 * (1 - t) * t ** 2 * controlPoint2[0] +
      t ** 3 * endPoint[0]

    y =
      (1 - t) ** 3 * startPoint[1] +
      3 * (1 - t) ** 2 * t * controlPoint1[1] +
      3 * (1 - t) * t ** 2 * controlPoint2[1] +
      t ** 3 * endPoint[1]
  } else {
    // Quadratic Bezier curve
    x =
      (1 - t) * (1 - t) * startPoint[0] +
      2 * (1 - t) * t * controlPoint1[0] +
      t * t * endPoint[0]
    y =
      (1 - t) * (1 - t) * startPoint[1] +
      2 * (1 - t) * t * controlPoint1[1] +
      t * t * endPoint[1]
  }

  return [x, y]
}
