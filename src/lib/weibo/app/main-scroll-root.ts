/** 主列滚动容器的持有器。经函数读写，避免在 render 期直接访问 ref。 */
export interface MainScrollRoot {
  node: HTMLDivElement | null
}

export function createMainScrollRoot(): MainScrollRoot {
  return { node: null }
}

export function setMainScrollRootNode(root: MainScrollRoot, node: HTMLDivElement | null) {
  root.node = node
}

export function readMainScrollRoot(root: MainScrollRoot) {
  return root.node
}

export function resetMainScrollRoot(root: MainScrollRoot) {
  const node = root.node
  if (node) node.scrollTop = 0
}

export function scrollMainScrollRootToTop(root: MainScrollRoot) {
  root.node?.scrollTo({ top: 0, behavior: 'smooth' })
}
