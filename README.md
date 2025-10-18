# PostCSS Smooth Shadow

<img align="right" width="135" height="95"
     title="Philosopher’s stone, logo of PostCSS"
     src="https://postcss.org/logo-leftp.svg">

[PostCSS](https://github.com/postcss/postcss) plugin to generate more realistic [“smooth” shadows](https://tobiasahlin.com/blog/layered-smooth-box-shadows/).

```css
.card {
  box-shadow: --soft-shadow(0 1rem 2rem oklch(0 0 0 / 10%));
}
```

```css
.card {
  box-shadow:
    0 calc(0.0278 * 1rem) calc(0.0278 * 2rem) rgb(from oklch(0 0 0 / 10%) r g b / calc(alpha * 0.167)),
    0 calc(0.1111 * 1rem) calc(0.1111 * 2rem) rgb(from oklch(0 0 0 / 10%) r g b / calc(alpha * 0.333)),
    0 calc(0.25 * 1rem) calc(0.25 * 2rem) rgb(from oklch(0 0 0 / 10%) r g b / calc(alpha * 0.5)),
    0 calc(0.4444 * 1rem) calc(0.4444 * 2rem) rgb(from oklch(0 0 0 / 10%) r g b / calc(alpha * 0.667)),
    0 calc(0.6944 * 1rem) calc(0.6944 * 2rem) rgb(from oklch(0 0 0 / 10%) r g b / calc(alpha * 0.833)),
    0 calc(1 * 1rem) calc(1 * 2rem) rgb(from oklch(0 0 0 / 10%) r g b / calc(alpha * 1));
}
```

It supports non-px units like `rem`, 3 shadow types, inset shadows, and any color format (we recommends [`oklch()`](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl)).

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

The plugins supports 3 shadows types. You can try them on [`smoothshadows.com`](https://smoothshadows.com).

```css
.soft {
  box-shadow: --soft-shadow(10px 0 8px oklch(0 0 0 / 10%));
}
.sharp {
  box-shadow: --sharp-shadow(10px 0 8px oklch(0 0 0 / 10%));
}
.linear {
  box-shadow: --linear-shadow(10px 0 8px oklch(0 0 0 / 10%));
}
```

It also supports `inset` shadows:

```css
.inset {
  box-shadow: --soft-shadow(inset 10px 0 8px oklch(0 0 0 / 10%));
}
```

### JS API

There is low-level JS API:

```ts
import { renderShadows } from 'postcss-smooth-shadow'

renderShadows('soft', false, '10px', '0', '8px', 'oklch(0 0 0 / 10%)')
// => "0 calc(0.0278 * 1rem) calc(0.0278 * 2rem) rgb(from oklch(0 0 0 / 10%)…"
```
