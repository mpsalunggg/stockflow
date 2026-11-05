import { createBrowserRouter } from 'react-router'
import { AppLayout, type RouteHandle } from '@/components/layout/app-layout'
import { CreateOrderPage } from '@/features/orders/page/create-order-page'
import { OrderDetailPage } from '@/features/orders/page/order-detail-page'
import { OrdersPage } from '@/features/orders/page/orders-page'
import { ProductsPage } from '@/features/products/page/products-page'
import { StockHistoryPage } from '@/features/stock/page/stock-history-page'

const handle = (title: string) => ({ title }) satisfies RouteHandle

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, handle: handle('Products'), element: <ProductsPage /> },
      { path: 'stock', handle: handle('Stock History'), element: <StockHistoryPage /> },
      { path: 'orders', handle: handle('Sales Orders'), element: <OrdersPage /> },
      { path: 'orders/new', handle: handle('Create Order'), element: <CreateOrderPage /> },
      { path: 'orders/:id', handle: handle('Order Detail'), element: <OrderDetailPage /> },
    ],
  },
])
