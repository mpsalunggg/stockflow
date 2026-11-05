import { createBrowserRouter } from 'react-router'
import { AppLayout, type RouteHandle } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/layout/page-header'
import { ProductsPage } from '@/features/products/page/products-page'

const page = (title: string) => ({
  handle: { title } satisfies RouteHandle,
  element: <PageHeader title={title} />,
})

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, handle: { title: 'Products' } satisfies RouteHandle, element: <ProductsPage /> },
      { path: 'stock', ...page('Stock History') },
      { path: 'orders', ...page('Sales Orders') },
      { path: 'orders/new', ...page('Create Order') },
      { path: 'orders/:id', ...page('Order Detail') },
    ],
  },
])
