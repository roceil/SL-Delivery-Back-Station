export interface BreadcrumbItem {
  label: string
  to?: string
}

export function useBreadcrumb() {
  const extraItems = useState<BreadcrumbItem[]>('breadcrumb-extra', () => [])

  function setBreadcrumb(...items: BreadcrumbItem[]) {
    extraItems.value = items
  }

  function clearBreadcrumb() {
    extraItems.value = []
  }

  return { extraItems, setBreadcrumb, clearBreadcrumb }
}
