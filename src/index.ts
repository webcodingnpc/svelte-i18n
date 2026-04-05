/**
 * svelte-i18n — Svelte 5 国际化库
 *
 * 参考 vue-i18n 设计，为 Svelte 5 提供完整的国际化方案。
 *
 * 核心功能：
 * - createI18n：创建 i18n 实例
 * - t()：翻译函数，支持插值 / 复数 / 嵌套键
 * - locale：当前语言 store（响应式）
 * - 支持动态加载语言包
 * - 支持 localStorage 持久化
 * - 支持浏览器语言自动检测
 * - 支持命名空间
 *
 * @example
 * ```ts
 * import { createI18n } from 'svelte-i18n'
 *
 * const i18n = createI18n({
 *   locale: 'zh',
 *   fallbackLocale: 'en',
 *   messages: {
 *     zh: { hello: '你好 {name}' },
 *     en: { hello: 'Hello {name}' },
 *   },
 * })
 *
 * // 在 Svelte 组件中
 * const { t, locale } = i18n
 * $t('hello', { name: 'World' }) // => '你好 World'
 * ```
 */

import { writable, derived, get, type Writable, type Readable } from 'svelte/store'

// ==================== 类型定义 ====================

/** 语言消息对象（支持嵌套） */
export type Messages = {
    [key: string]: string | Messages
}

/** 多语言消息映射 */
export type LocaleMessages = {
    [locale: string]: Messages
}

/** 复数规则函数 */
export type PluralizationRule = (choice: number, choicesLength: number) => number

/** 复数规则映射 */
export type PluralizationRules = {
    [locale: string]: PluralizationRule
}

/** 插值参数 */
export type InterpolationParams = {
    [key: string]: string | number | boolean
}

/** i18n 配置选项 */
export interface I18nOptions {
    /** 当前语言 */
    locale: string
    /** 回退语言 */
    fallbackLocale?: string
    /** 语言消息 */
    messages?: LocaleMessages
    /** 复数规则 */
    pluralizationRules?: PluralizationRules
    /** 是否持久化到 localStorage */
    persist?: boolean
    /** localStorage 存储键名 */
    persistKey?: string
    /** 是否自动检测浏览器语言 */
    detectBrowserLocale?: boolean
    /** 支持的语言列表（用于浏览器检测匹配） */
    availableLocales?: string[]
}

/** i18n 实例 */
export interface I18nInstance {
    /** 当前语言（可写 store） */
    locale: Writable<string>
    /** 翻译函数（派生 store，响应式） */
    t: Readable<(key: string, params?: InterpolationParams | number) => string>
    /** 命令式翻译（非响应式，直接取当前值） */
    translate: (key: string, params?: InterpolationParams | number) => string
    /** 切换语言 */
    setLocale: (locale: string) => void
    /** 获取当前语言 */
    getLocale: () => string
    /** 动态加载语言包 */
    loadMessages: (locale: string, messages: Messages) => void
    /** 合并语言包（不覆盖已有键） */
    mergeMessages: (locale: string, messages: Messages) => void
    /** 获取所有已注册的语言 */
    availableLocales: () => string[]
    /** 判断某个键是否有翻译 */
    hasKey: (key: string, locale?: string) => boolean
}

// ==================== 工具函数 ====================

/**
 * 深层获取嵌套对象值
 * @example getNestedValue({ a: { b: 'hello' } }, 'a.b') => 'hello'
 */
function getNestedValue(obj: Messages, path: string): string | undefined {
    const keys = path.split('.')
    let current: Messages | string | undefined = obj
    for (const key of keys) {
        if (current === undefined || current === null || typeof current === 'string') {
            return undefined
        }
        current = current[key]
    }
    return typeof current === 'string' ? current : undefined
}

/**
 * 深层合并对象
 */
function deepMerge(target: Messages, source: Messages): Messages {
    const result = { ...target }
    for (const key of Object.keys(source)) {
        if (
            typeof source[key] === 'object' &&
            source[key] !== null &&
            typeof result[key] === 'object' &&
            result[key] !== null
        ) {
            result[key] = deepMerge(result[key] as Messages, source[key] as Messages)
        } else {
            result[key] = source[key]
        }
    }
    return result
}

/**
 * 字符串插值
 * @example interpolate('你好 {name}', { name: 'World' }) => '你好 World'
 */
function interpolate(template: string, params: InterpolationParams): string {
    return template.replace(/\{(\w+)\}/g, (_, key) => {
        return params[key] !== undefined ? String(params[key]) : `{${key}}`
    })
}

/**
 * 默认复数规则（英语规则）
 */
function defaultPluralization(choice: number, choicesLength: number): number {
    if (choicesLength === 2) {
        return choice === 1 ? 0 : 1
    }
    // 0 = zero, 1 = singular, 2 = plural
    if (choice === 0) return 0
    if (choice === 1) return Math.min(1, choicesLength - 1)
    return Math.min(2, choicesLength - 1)
}

/**
 * 处理复数
 * 消息格式：'没有苹果 | 一个苹果 | {count} 个苹果'
 */
function pluralize(
    message: string,
    choice: number,
    rule: PluralizationRule = defaultPluralization,
): string {
    const choices = message.split('|').map((s) => s.trim())
    const index = rule(choice, choices.length)
    return choices[Math.min(index, choices.length - 1)]
}

/**
 * 检测浏览器语言
 */
function detectBrowserLanguage(availableLocales: string[]): string | null {
    if (typeof navigator === 'undefined') return null
    const browserLangs = navigator.languages || [navigator.language]
    for (const lang of browserLangs) {
        // 完全匹配
        if (availableLocales.includes(lang)) return lang
        // 前缀匹配 zh-CN => zh
        const prefix = lang.split('-')[0]
        if (availableLocales.includes(prefix)) return prefix
    }
    return null
}

// ==================== 核心 ====================

/**
 * 创建 i18n 实例
 *
 * @example
 * ```ts
 * const i18n = createI18n({
 *   locale: 'zh',
 *   fallbackLocale: 'en',
 *   messages: {
 *     zh: { greeting: '你好 {name}' },
 *     en: { greeting: 'Hello {name}' },
 *   },
 * })
 * ```
 */
export function createI18n(options: I18nOptions): I18nInstance {
    const {
        fallbackLocale,
        pluralizationRules = {},
        persist = false,
        persistKey = 'svelte-i18n-locale',
        detectBrowserLocale = false,
        availableLocales: userAvailableLocales,
    } = options

    // 语言消息存储（可变）
    const allMessages: LocaleMessages = { ...(options.messages || {}) }

    // 可用语言列表
    const getAvailableLocales = () => {
        const fromMessages = Object.keys(allMessages)
        const merged = new Set([...fromMessages, ...(userAvailableLocales || [])])
        return Array.from(merged)
    }

    // 确定初始语言
    let initialLocale = options.locale

    // 尝试从 localStorage 恢复
    if (persist) {
        try {
            const saved = localStorage.getItem(persistKey)
            if (saved && getAvailableLocales().includes(saved)) {
                initialLocale = saved
            }
        } catch { }
    }

    // 尝试检测浏览器语言
    if (detectBrowserLocale && !persist) {
        const detected = detectBrowserLanguage(getAvailableLocales())
        if (detected) {
            initialLocale = detected
        }
    }

    // 创建响应式 locale store
    const locale = writable<string>(initialLocale)

    // 持久化监听
    if (persist) {
        locale.subscribe((val) => {
            try {
                localStorage.setItem(persistKey, val)
            } catch { }
        })
    }

    /**
     * 内部翻译函数
     */
    function _translate(
        currentLocale: string,
        key: string,
        params?: InterpolationParams | number,
    ): string {
        // 从当前语言查找
        let message = allMessages[currentLocale]
            ? getNestedValue(allMessages[currentLocale], key)
            : undefined

        // 回退语言查找
        if (message === undefined && fallbackLocale && fallbackLocale !== currentLocale) {
            message = allMessages[fallbackLocale]
                ? getNestedValue(allMessages[fallbackLocale], key)
                : undefined
        }

        // 未找到翻译，返回键名
        if (message === undefined) {
            return key
        }

        // 处理复数
        if (typeof params === 'number') {
            const rule = pluralizationRules[currentLocale] || defaultPluralization
            message = pluralize(message, params, rule)
            return interpolate(message, { count: params, n: params })
        }

        // 处理插值
        if (params && typeof params === 'object') {
            return interpolate(message, params)
        }

        return message
    }

    // 创建响应式 t 函数
    const t = derived(locale, ($locale) => {
        return (key: string, params?: InterpolationParams | number): string => {
            return _translate($locale, key, params)
        }
    })

    // 命令式翻译（非响应式）
    function translate(key: string, params?: InterpolationParams | number): string {
        return _translate(get(locale), key, params)
    }

    // 切换语言
    function setLocale(newLocale: string) {
        locale.set(newLocale)
    }

    // 获取当前语言
    function getLocale(): string {
        return get(locale)
    }

    // 动态加载语言包（覆盖）
    function loadMessages(loc: string, messages: Messages) {
        allMessages[loc] = messages
    }

    // 合并语言包（深层合并，不覆盖已有键）
    function mergeMessages(loc: string, messages: Messages) {
        if (allMessages[loc]) {
            allMessages[loc] = deepMerge(allMessages[loc], messages)
        } else {
            allMessages[loc] = messages
        }
    }

    // 判断键是否存在
    function hasKey(key: string, loc?: string): boolean {
        const targetLocale = loc || get(locale)
        if (!allMessages[targetLocale]) return false
        return getNestedValue(allMessages[targetLocale], key) !== undefined
    }

    return {
        locale,
        t,
        translate,
        setLocale,
        getLocale,
        loadMessages,
        mergeMessages,
        availableLocales: getAvailableLocales,
        hasKey,
    }
}

// ==================== 便捷工具 ====================

/**
 * 创建简单的 i18n（仅需 locale + messages）
 *
 * @example
 * ```ts
 * const { t, locale, toggle } = createSimpleI18n('zh', {
 *   zh: { hello: '你好' },
 *   en: { hello: 'Hello' },
 * })
 * ```
 */
export function createSimpleI18n(
    defaultLocale: string,
    messages: LocaleMessages,
    options?: { persist?: boolean; persistKey?: string },
) {
    const i18n = createI18n({
        locale: defaultLocale,
        fallbackLocale: Object.keys(messages).find((l) => l !== defaultLocale) || defaultLocale,
        messages,
        persist: options?.persist ?? false,
        persistKey: options?.persistKey,
    })

    // 在两种语言间切换
    const locales = Object.keys(messages)
    function toggle() {
        const current = i18n.getLocale()
        const idx = locales.indexOf(current)
        const next = locales[(idx + 1) % locales.length]
        i18n.setLocale(next)
    }

    return {
        ...i18n,
        toggle,
    }
}

// 导出类型
export type { Writable, Readable }
