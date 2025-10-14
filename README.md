# PostCSS Smooth Shadow

<img align="right" width="135" height="95"
     title="Philosopher’s stone, logo of PostCSS"
     src="https://postcss.org/logo-leftp.svg">

[PostCSS] plugin

```css
.card {
  box-shadow: --smooth-shadow(#000, 10px, 2);
}
```

```css
.card {
  box-shadow:
    0 calc(10px / 2) calc(10px / 2 * 2) oklch(from #000 l c h / 0.25),
    0 calc(10px / 2 * 2) calc(10px / 2 * 3) oklch(from #000 l c h / 0.18),
    0 calc(10px / 2 * 3) calc(10px / 2 * 4) oklch(from #000 l c h / 0.12);
}
```

[postcss-utilities] collection is better for `clearfix` and other popular hacks.
For simple cases you can use [postcss-define-property].

[postcss-define-property]: https://github.com/daleeidd/postcss-define-property
[postcss-utilities]:       https://github.com/ismamz/postcss-utilities
[postcss-simple-vars]:     https://github.com/postcss/postcss-simple-vars
[postcss-nested]:          https://github.com/postcss/postcss-nested
[PostCSS]:                 https://github.com/postcss/postcss

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
