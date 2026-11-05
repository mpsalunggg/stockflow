import { PageHeader } from '@/components/layout/page-header'
import { useProducts } from '../hooks'

export function ProductsPage() {
  const { data, isPending, error } = useProducts({ page: 1, limit: 10 })

  return (
    <>
      <PageHeader title="Products" description="Manage your inventory and product catalog." />
      {isPending && <p className="text-sm text-muted-foreground">Loading...</p>}
      {error && <p className="text-sm text-destructive">{error.message}</p>}
      {data && <p className="text-sm text-muted-foreground">{data.total} products</p>}
    </>
  )
}
