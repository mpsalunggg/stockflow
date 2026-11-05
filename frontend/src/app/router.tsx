import { createBrowserRouter } from 'react-router'
import { AppLayout, type RouteHandle } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/layout/page-header'
import { ProductsPage } from '@/features/products/page/products-page'
import { StockHistoryPage } from '@/features/stock/page/stock-history-page'

const page = (title: string) => ({
  handle: { title } satisfies RouteHandle,
  element: <PageHeader title={title} />,
})

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, handle: { title: 'Products' } satisfies RouteHandle, element: <ProductsPage /> },
      { path: 'stock', handle: { title: 'Stock History' } satisfies RouteHandle, element: <StockHistoryPage /> },
      { path: 'orders', ...page('Sales Orders') },
      { path: 'orders/new', ...page('Create Order') },
      { path: 'orders/:id', ...page('Order Detail') },
    ],
  },
])
