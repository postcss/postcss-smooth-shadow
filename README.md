# PostCSS Smooth Shadow

<img align="right" width="135" height="95"
     title="Philosopher’s stone, logo of PostCSS"
     src="https://postcss.org/logo-leftp.svg">

[PostCSS](https://github.com/postcss/postcss) plugin to generate [more realistic smooth shadows](https://tobiasahlin.com/blog/layered-smooth-box-shadows/). See [demo](https://postcss.github.io/postcss-smooth-shadow/).

```css
.card {
  box-shadow: --soft-shadow(0 0.5rem 1rem oklch(0 0 0 / 10%));
}
```

```css
.card {
  box-shadow:
    calc(0.111 * 0.5rem) calc(0.111 * 1rem) rgb(from oklch(0 0 0 / 10%) r g b / calc(alpha * 0.333)),
    0 calc(0.444 * 0.5rem) calc(0.444 * 1rem) rgb(from oklch(0 0 0 / 10%) r g b / calc(alpha * 0.667)),
    0 calc(1 * 0.5rem) calc(1 * 1rem) rgb(from oklch(0 0 0 / 10%) r g b / calc(alpha * 1));
}
```

It supports non-px units like `rem`, 3 shadow types, `inset` shadows, and any color format, but we [recommend](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl) `oklch()`.

---

<img src="https://cdn.evilmartians.com/badges/logo-no-label.svg" alt="" width="22" height="16" />  Built by
<b><a href="https://evilmartians.com/devtools?utm_source=postcss-smooth-shadow&utm_campaign=devtools-button&utm_medium=github">Evil Martians</a></b>, go-to agency for <b>developer tools</b>.

---

## Usage

**Step 1:** Install plugin:

```sh
npm install --save-dev postcss postcss-smooth-shadow
```

**Step 2:** Check your project for existed PostCSS config: `postcss.config.js`
in the project root, `"postcss"` section in `package.json`
or `postcss` in bundle config.

If you do not use PostCSS, add it according
to [official docs](https://github.com/postcss/postcss#usage)
and set this plugin in settings.

**Step 3:** Add the plugin to plugins list:

```diff
module.exports = {
  plugins: [
+   require('postcss-smooth-shadow'),
    require('autoprefixer')
  ]
}
```

### CSS API

The plugins supports 3 shadows types from [`smoothshadows.com`](https://smoothshadows.com).

```css
.soft {
  box-shadow: --soft-shadow(0 8px 8px oklch(0 0 0 / 10%));
}
.sharp {
  box-shadow: --sharp-shadow(0 8px 8px oklch(0 0 0 / 10%));
}
.linear {
  box-shadow: --linear-shadow(0 8px 8px oklch(0 0 0 / 10%));
}
```

It also supports `inset` shadows:

```css
.inset {
  box-shadow: --soft-shadow(inset 10px 0 8px oklch(0 0 0 / 10%));
}
```

It supports lush shadows generation from [`joshwcomeau.com/shadow-palette`](https://www.joshwcomeau.com/shadow-palette/)

```css
.low {
  box-shadow: --lush-shadow(low -0.25 -0.5 0.5 0.5 0.75 oklch(0 0 0 / 15%));
}
.medium {
  box-shadow: --lush-shadow(medium -0.25 -0.5 0.5 0.5 0.75 oklch(0 0 0 / 15%));
}
.high {
  box-shadow: --lush-shadow(high -0.25 -0.5 0.5 0.5 0.75 oklch(0 0 0 / 15%));
}
.inset {
  box-shadow: --lush-shadow(
    medium inset -0.25 -0.5 0.5 0.5 0.75 oklch(0 0 0 / 15%)
  );
}
```

### JS API

There is low-level JS API:

```ts
import { renderShadows } from 'postcss-smooth-shadow'

renderShadows('soft', false, '0', '0.5rem', '1rem', 'oklch(0 0 0 / 10%)')
// => ["calc(0.111 * 0.5rem) calc(0.111 * 1rem) …", …]
```

API for lush shadows

```ts
import { renderLushShadows } from 'postcss-smooth-shadow'

const [low, medium, high] = renderLushShadows(
  false, // inset
  -0.25, // light-x
  -0.5, // light-y
  0.5, // oomph
  0.5, // crispy
  0.75, // resolution
  'oklch(0 0 0 / 15%)' // color
)

low = [
  ['0.3px 0.5px 0.7px hsl(from oklch(0 0 0 / 15%) h s l / 0.1)'],
  ['0.4px 0.8px 1px -1.2px hsl(from oklch(0 0 0 / 15%) h s l / 0.1)'],
  ['1px 2px 2.5px -2.5px hsl(from oklch(0 0 0 / 15%) h s l / 0.1)']
]

medium = [
  ['0.3px 0.5px 0.7px hsl(from oklch(0 0 0 / 15%) h s l / 0.11)'],
  ['0.8px 1.6px 2px -0.8px hsl(from oklch(0 0 0 / 15%) h s l / 0.11)'],
  ['2.1px 4.1px 5.2px -1.7px hsl(from oklch(0 0 0 / 15%) h s l / 0.11)'],
  ['5px 10px 12.6px -2.5px hsl(from oklch(0 0 0 / 15%) h s l / 0.11)']
]

high = [
  ['0.3px 0.5px 0.7px hsl(from oklch(0 0 0 / 15%) h s l / 0.1)'],
  ['1.5px 2.9px 3.7px -0.4px hsl(from oklch(0 0 0 / 15%) h s l / 0.1)'],
  ['2.7px 5.4px 6.8px -0.7px hsl(from oklch(0 0 0 / 15%) h s l / 0.1)'],
  ['4.5px 8.9px 11.2px -1.1px hsl(from oklch(0 0 0 / 15%) h s l / 0.1)'],
  ['7.1px 14.3px 18px -1.4px hsl(from oklch(0 0 0 / 15%) h s l / 0.1)'],
  ['11.2px 22.3px 28.1px -1.8px hsl(from oklch(0 0 0 / 15%) h s l / 0.1)'],
  ['17px 33.9px 42.7px -2.1px hsl(from oklch(0 0 0 / 15%) h s l / 0.1)'],
  ['25px 50px 62.9px -2.5px hsl(from oklch(0 0 0 / 15%) h s l / 0.1)']
]
```
