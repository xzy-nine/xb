/**
 * Errors thrown by the m.weibo.cn fetch layer.
 */

/**
 * Thrown by `mweiboFetch` when m.weibo.cn returns its captcha interceptor
 * response ({"ok":-100,"errno":"-100","url":"https://m.weibo.cn/captcha/show?backUrl="}).
 *
 * Pages that consume `mweiboFetch` should catch this and surface a friendly
 * prompt that guides the user to complete the captcha at m.weibo.cn.
 */
export class MweiboCaptchaError extends Error {
  readonly kind = 'mweibo-captcha' as const
  readonly captchaUrl: string

  constructor(captchaUrl: string) {
    super(`m.weibo.cn captcha required: ${captchaUrl}`)
    this.name = 'MweiboCaptchaError'
    this.captchaUrl = captchaUrl
  }
}
