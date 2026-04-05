# svelte-i18n

[中文文档](./README.zh-CN.md)

Lightweight internationalization (i18n) library for **Svelte 5**, inspired by [vue-i18n](https://vue-i18n.intlify.dev/).

## Features

- **Reactive** — locale and translations are Svelte stores, components update automatically
- **Nested Keys** — `t('nav.home')` resolves deeply nested message objects
- **Interpolation** — `t('hello', { name: 'World' })` → `Hello World`
- **Pluralization** — `t('apple', 3)` with `'no apples | one apple | {count} apples'`
- **Fallback Locale** — missing keys fall back to a secondary language
- **Dynamic Loading** — load or merge language packs at runtime
- **Persistence** — optional localStorage persistence for selected language
- **Browser Detection** — auto-detect user's browser language
- **CDN Ready** — IIFE build with `window.SvelteI18n` global
- **TypeScript** — full type definitions included
- **Tiny** — ~2 KB minified

## Installation

```bash
npm install svelte-i18n
```

## Quick Start

### 1. Create i18n instance

```ts
// src/i18n.ts
import { createI18n } from 'svelte-i18n'

export const i18n = createI18n({
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en: {
      greeting: 'Hello {name}!',
      nav: {
        home: 'Home',
        about: 'About',
      },
      apple: 'no apples | one apple | {count} apples',
    },
    zh: {
      greeting: '你好 {name}！',
      nav: {
        home: '首页',
        about: '关于',
      },
      apple: '没有苹果 | 一个苹果 | {count} 个苹果',
    },
  },
  persist: true,
})
```

### 2. Use in Svelte components

```svelte
<script lang="ts">
  import { i18n } from './i18n'

  const { t, locale } = i18n
</script>

<h1>{$t('greeting', { name: 'World' })}</h1>
<nav>
  <a href="/">{$t('nav.home')}</a>
  <a href="/about">{$t('nav.about')}</a>
</nav>
<p>{$t('apple', 3)}</p>

<button onclick={() => i18n.setLocale('zh')}>中文</button>
<button onclick={() => i18n.setLocale('en')}>English</button>
```

### 3. Simple mode (two-language toggle)

```ts
import { createSimpleI18n } from 'svelte-i18n'

const { t, toggle } = createSimpleI18n('zh', {
  zh: { hello: '你好' },
  en: { hello: 'Hello' },
}, { persist: true })
```

```svelte
<p>{$t('hello')}</p>
<button onclick={toggle}>Switch Language</button>
```

## API

### `createI18n(options): I18nInstance`

| Option | Type | Default | Description |
|---|---|---|---|
| `locale` | `string` | — | **Required.** Initial locale |
| `fallbackLocale` | `string` | — | Fallback locale for missing keys |
| `messages` | `LocaleMessages` | `{}` | Pre-loaded message dictionaries |
| `pluralizationRules` | `PluralizationRules` | `{}` | Custom pluralization per locale |
| `persist` | `boolean` | `false` | Persist locale to localStorage |
| `persistKey` | `string` | `'svelte-i18n-locale'` | localStorage key |
| `detectBrowserLocale` | `boolean` | `false` | Auto-detect browser language |
| `availableLocales` | `string[]` | — | Locale whitelist for detection |

### `I18nInstance`

| Property / Method | Type | Description |
|---|---|---|
| `locale` | `Writable<string>` | Reactive current locale |
| `t` | `Readable<(key, params?) => string>` | Reactive translation function |
| `translate(key, params?)` | `(key, params?) => string` | Imperative (non-reactive) translate |
| `setLocale(locale)` | `(string) => void` | Change current locale |
| `getLocale()` | `() => string` | Get current locale value |
| `loadMessages(locale, msgs)` | — | Replace messages for a locale |
| `mergeMessages(locale, msgs)` | — | Deep-merge messages into a locale |
| `availableLocales()` | `() => string[]` | List registered locales |
| `hasKey(key, locale?)` | `(string, string?) => boolean` | Check if translation exists |

### `createSimpleI18n(defaultLocale, messages, options?)`

Convenience wrapper for two-language setups. Returns `I18nInstance` plus a `toggle()` method.

## Message Format

### Interpolation

```json
{ "welcome": "Welcome, {name}! You have {count} messages." }
```

```ts
$t('welcome', { name: 'Alice', count: 5 })
// => "Welcome, Alice! You have 5 messages."
```

### Nested Keys

```json
{
  "nav": {
    "home": "Home",
    "settings": {
      "profile": "Profile"
    }
  }
}
```

```ts
$t('nav.settings.profile') // => "Profile"
```

### Pluralization

Use `|` to separate plural forms:

```json
{ "item": "no items | one item | {count} items" }
```

```ts
$t('item', 0) // => "no items"
$t('item', 1) // => "one item"
$t('item', 5) // => "5 items"
```

## CDN Usage

```html
<script src="https://unpkg.com/svelte-i18n/dist/svelte-i18n.iife.js"></script>
<script>
  const { createI18n } = SvelteI18n
  const i18n = createI18n({ locale: 'en', messages: { en: { hi: 'Hi!' } } })
</script>
```

## Dynamic Loading

```ts
// Load language pack on demand
const zhMessages = await fetch('/locales/zh.json').then(r => r.json())
i18n.loadMessages('zh', zhMessages)
i18n.setLocale('zh')
```

## License

[MIT](./LICENSE)
