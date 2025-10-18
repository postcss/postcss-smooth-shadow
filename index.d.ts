import type { PluginCreator, AtRule } from 'postcss'

export function renderShadows(
  type: 'linear' | 'sharp' | 'soft',
  inset: boolean,
  x: number,
  y: number,
  blur: number,
  color: string
): string

declare const plugin: PluginCreator<{}>

export default plugin
