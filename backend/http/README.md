# API contract

Base URL: `http://localhost:8080/api`. The `.http` files in this folder have a request for every endpoint, including the error cases.

## Errors

Every error uses the same envelope:

```json
{ "error": { "code": "INSUFFICIENT_STOCK", "sku": "TPG-TRG-1KG", "available": 8 } }
```

| Code | Status | When |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Invalid input. `details` lists each field, for example `items.1.qty` |
| `BAD_REQUEST` | 400 | Malformed JSON or an unknown field |
| `NOT_FOUND` | 404 | Product or order does not exist |
| `SKU_EXISTS` | 409 | SKU is already used |
| `PRODUCT_HAS_HISTORY` | 409 | Product has stock movements or order lines and cannot be deleted |
| `INSUFFICIENT_STOCK` | 409 | Not enough stock; includes `sku` and `available` |
| `ORDER_ALREADY_CANCELLED` | 409 | Order was cancelled before |

## Products

| Method | Path | Response |
|---|---|---|
| GET | `/products?search=&page=&limit=` | 200 `{data, page, limit, total}`. Search matches SKU or name, case-insensitive. Each product has `last_movement_at` (ISO string or null). |
| GET | `/products/{id}` | 200 product, 404 if missing |
| POST | `/products` | 201 product. Body `{"sku","name","price","is_active"?}`. Stock starts at 0. |
| PUT | `/products/{id}` | 200 product. Body `{"sku","name","price","is_active"}`. 404 if missing. |
| DELETE | `/products/{id}` | 204, or 409 `PRODUCT_HAS_HISTORY` |

```bash
curl 'localhost:8080/api/products?search=beras&page=1&limit=5'
curl -X POST localhost:8080/api/products -d '{"sku":"KRP-UDG-250","name":"Kerupuk Udang 250 g","price":14500}'
```

## Stock

| Method | Path | Response |
|---|---|---|
| POST | `/products/{id}/stock` | 201 `{movement, stock}`. Body `{"type":"in"\|"out","qty":n,"note":"..."}`. 409 `INSUFFICIENT_STOCK` when taking out more than exists. |
| GET | `/products/{id}/movements` | 200 `{data}`, newest first |

```bash
curl -X POST localhost:8080/api/products/1/stock -d '{"type":"in","qty":10,"note":"Supplier delivery"}'
curl -X POST localhost:8080/api/products/1/stock -d '{"type":"out","qty":999999}'
curl localhost:8080/api/products/1/movements
```

## Orders

| Method | Path | Response |
|---|---|---|
| GET | `/orders?search=&status=&page=&limit=` | 200 `{data, page, limit, total}`. Search matches customer or order id. |
| POST | `/orders` | 201 order with items, unit prices from the database, and the total. Body `{"customer","items":[{"sku","qty"}]}`. 409 `INSUFFICIENT_STOCK` names the SKU that failed, and nothing is written. |
| GET | `/orders/{id}` | 200 order with items, status and total |
| POST | `/orders/{id}/cancel` | 200 order, stock is restored. 409 `ORDER_ALREADY_CANCELLED`. |

```bash
curl -X POST localhost:8080/api/orders \
  -d '{"customer":"Toko Maju Jaya","items":[{"sku":"GLA-PSR-1KG","qty":2},{"sku":"TEH-CLP-25","qty":3}]}'
curl localhost:8080/api/orders/1
curl -X POST localhost:8080/api/orders/1/cancel
```

`GET /products/{id}` and `GET /orders` are additions beyond the original brief.
