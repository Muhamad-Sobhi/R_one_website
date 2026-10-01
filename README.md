# R/ONE Storefront

Arabic RTL Next.js storefront connected to the R/ONE Firebase project.

## Run locally

Use Node.js 20.9 or newer. From this directory:

```sh
npm install
npm run dev
```

The public Firebase web configuration can be supplied with `NEXT_PUBLIC_FIREBASE_*`; the app has the R/ONE project defaults for local browsing. Order creation also requires Firebase Admin credentials on the server. Set `FIREBASE_SERVICE_ACCOUNT_JSON` or `GOOGLE_APPLICATION_CREDENTIALS` in an untracked `.env.local` file.

## Production deployment

This is a standalone Next.js app. Deploy the `Frontend` directory to Vercel or another Node.js host using Node.js 20.9 or newer. The production commands are:

```sh
npm ci
npm run typecheck
npm run build
npm start
```

Set these variables in the hosting provider's encrypted environment settings:

- `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, and `NEXT_PUBLIC_FIREBASE_APP_ID` from the public Firebase web app configuration.
- `FIREBASE_SERVICE_ACCOUNT_JSON` containing the server-side service account JSON. Do not use a `NEXT_PUBLIC_` prefix or commit this value. Grant the account only the Firestore data permissions needed to read catalog/shipping/offers and transactionally create orders, update customers, and decrement product stock.
- Optionally `FIREBASE_PROJECT_ID` to pin the Admin SDK to the same project as the public Firebase configuration.

Before launch, publish `../Dashboard/firestore.rules` to project `r-one-1450f`. Public reads are required for `products`, `categories`, `brands`, `offers`, and `shippingRates`; writes and operational collections stay admin-only. Verify the public catalog and workshop profile, then submit a low-value test order and confirm it appears in the Dashboard with stock decremented. Use HTTPS and configure the production domain in the hosting provider.

## Firestore access

The storefront reads `products`, `categories`, `brands`, `offers`, `shippingRates`, and `workshopSettings/main`. Publish the rules in `../Dashboard/firestore.rules` to the `r-one-1450f` Firebase project. These rules allow visitors to read storefront catalog and delivery data; writes to operational collections remain restricted to active admins. The workshop profile is already readable by its public document ID.

Order submissions go through `/api/orders`, which uses Firebase Admin and validates prices, active offers, delivery rates, and available stock in a transaction. It decrements product stock and creates or updates:

- `orders/{autoId}` with customer details, delivery data, priced item snapshots, totals, `itemsCount`, `status: "جديد"`, and `createdAt`. When no active rate exists for the entered area, `shippingPending` is `true`, `shippingCost` is `null`, and `total` is the products subtotal until the workshop confirms delivery.
- `customers/{sha256(phone digits)}` with the latest contact/address, `ordersCount`, `totalSpent`, and timestamps.

The order shape is compatible with the Dashboard's order and customer views. Cart contents stay in browser `localStorage`; no customer record is created until checkout succeeds.