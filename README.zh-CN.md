# svelte-i18n

[English](./README.md)

轻量级 Svelte 5 国际化库，参考 [vue-i18n](https://vue-i18n.intlify.dev/) 设计。

## 特性

- **响应式** — locale 和翻译函数均为 Svelte store，组件自动更新
- **嵌套键** — `t('nav.home')` 支持深层嵌套的消息对象
- **插值** — `t('hello', { name: 'World' })` → `你好 World`
- **复数** — `t('apple', 3)` 配合 `'没有苹果 | 一个苹果 | {count} 个苹果'`
- **回退语言** — 当前语言缺失的键自动回退到备选语言
- **动态加载** — 运行时动态加载或合并语言包
- **持久化** — 可选 localStorage 持久化，记住用户选择的语言
- **浏览器检测** — 自动检测用户浏览器语言
- **CDN 支持** — 提供 IIFE 构建，通过 `window.SvelteI18n` 直接使用
- **TypeScript** — 完整的类型定义
- **极小体积** — 压缩后约 2 KB

## 安装

```bash
npm install svelte-i18n
```

## 快速开始

### 1. 创建 i18n 实例

```ts
// src/i18n.ts
import { createI18n } from 'svelte-i18n'

export const i18n = createI18n({
  locale: 'zh',
  fallbackLocale: 'en',
  messages: {
    zh: {
      greeting: '你好 {name}！',
      nav: {
        home: '首页',
        about: '关于',
      },
      apple: '没有苹果 | 一个苹果 | {count} 个苹果',
    },
    en: {
      greeting: 'Hello {name}!',
      nav: {
        home: 'Home',
        about: 'About',
      },
      apple: 'no apples | one apple | {count} apples',
    },
  },
  persist: true,
})
```

### 2. 在 Svelte 组件中使用

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

<button onclick={() => i18n.setLocale('en')}>English</button>
<button onclick={() => i18n.setLocale('zh')}>中文</button>
```

### 3. 简易模式（双语切换）

```ts
import { createSimpleI18n } from 'svelte-i18n'

const { t, toggle } = createSimpleI18n('zh', {
  zh: { hello: '你好' },
  en: { hello: 'Hello' },
}, { persist: true })
```

```svelte
<p>{$t('hello')}</p>
<button onclick={toggle}>切换语言</button>
```

## API

### `createI18n(options): I18nInstance`

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `locale` | `string` | — | **必填。** 初始语言 |
| `fallbackLocale` | `string` | — | 回退语言（当前语言缺少翻译时使用） |
| `messages` | `LocaleMessages` | `{}` | 预加载的语言消息 |
| `pluralizationRules` | `PluralizationRules` | `{}` | 自定义复数规则 |
| `persist` | `boolean` | `false` | 是否持久化到 localStorage |
| `persistKey` | `string` | `'svelte-i18n-locale'` | localStorage 存储键名 |
| `detectBrowserLocale` | `boolean` | `false` | 是否自动检测浏览器语言 |
| `availableLocales` | `string[]` | — | 可用语言白名单（用于浏览器检测匹配） |

### `I18nInstance`

| 属性 / 方法 | 类型 | 说明 |
|---|---|---|
| `locale` | `Writable<string>` | 响应式当前语言 |
| `t` | `Readable<(key, params?) => string>` | 响应式翻译函数 |
| `translate(key, params?)` | `(key, params?) => string` | 命令式翻译（非响应式） |
| `setLocale(locale)` | `(string) => void` | 切换语言 |
| `getLocale()` | `() => string` | 获取当前语言 |
| `loadMessages(locale, msgs)` | — | 替换指定语言的消息 |
| `mergeMessages(locale, msgs)` | — | 合并消息到指定语言 |
| `availableLocales()` | `() => string[]` | 列出所有已注册语言 |
| `hasKey(key, locale?)` | `(string, string?) => boolean` | 检查翻译键是否存在 |

### `createSimpleI18n(defaultLocale, messages, options?)`

双语场景的便捷封装。返回 `I18nInstance` 加额外的 `toggle()` 方法。

## 消息格式

### 插值

```json
{ "welcome": "欢迎，{name}！你有 {count} 条消息。" }
```

```ts
$t('welcome', { name: 'Alice', count: 5 })
// => "欢迎，Alice！你有 5 条消息。"
```

### 嵌套键

```json
{
  "nav": {
    "home": "首页",
    "settings": {
      "profile": "个人资料"
    }
  }
}
```

```ts
$t('nav.settings.profile') // => "个人资料"
```

### 复数

使用 `|` 分隔复数形式：

```json
{ "item": "没有项目 | 一个项目 | {count} 个项目" }
```

```ts
$t('item', 0) // => "没有项目"
$t('item', 1) // => "一个项目"
$t('item', 5) // => "5 个项目"
```

## CDN 使用

```html
<script src="https://unpkg.com/svelte-i18n/dist/svelte-i18n.iife.js"></script>
<script>
  const { createI18n } = SvelteI18n
  const i18n = createI18n({ locale: 'zh', messages: { zh: { hi: '嗨！' } } })
</script>
```

## 动态加载

```ts
// 按需加载语言包
const enMessages = await fetch('/locales/en.json').then(r => r.json())
i18n.loadMessages('en', enMessages)
i18n.setLocale('en')
```

## 许可证

[MIT](./LICENSE)
