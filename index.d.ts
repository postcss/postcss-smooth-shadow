import type { PluginCreator, AtRule } from 'postcss'

export function renderShadows(
  type: 'linear' | 'sharp' | 'soft',
  inset: boolean,
  x: number,
  y: number,
  blur: number,
  color: string
): string

export function renderLushShadows(
  inset: boolean,
  lightX: number,
  lightY: number,
  oomph: number,
  crispy: number,
  resolution: number,
  color: string
): [string[], string[], string[]]

declare const plugin: PluginCreator<{}>

export default plugin
