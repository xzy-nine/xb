/**
 * 全局弹窗层级管理器
 * 每次调用 getNextZIndex() 返回递增的 z-index 值
 * 不清理，直接无限递增直到网页关闭
 */

let zIndexCounter = 50

export function getNextZIndex(): number {
  zIndexCounter += 1
  return zIndexCounter
}

/**
 * 获取当前 z-index 计数器值（不递增）
 */
export function getCurrentZIndex(): number {
  return zIndexCounter
}
