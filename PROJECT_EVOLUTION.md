# Project Evolution Log

This file tracks every architectural decision, feature addition, refactor, and AI-generated change during the development of the Shared Expense Management App.

---

## Version 1.3.0

2026-06-14

## Prompt Given
Refactor API architecture. Expenses should be nested under groups. Preferred route structure:
- GET /api/groups/:groupId/expenses
- POST /api/groups/:groupId/expenses
- GET /api/groups/:groupId/balances
Update route architecture and folder documentation.

## Changes Made
- Configured express routers to merge parent params.
- Restructured `expense.routes.js` to mount directly inside `group.routes.js` under the `/:groupId/expenses` path.
- Removed top-level standalone `/expenses` endpoint mount.
- Updated frontend axios requests in `expense.service.js` to target nested API routes.

## Files Added
None

## Files Modified
- [group.routes.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/routes/group.routes.js)
- [expense.routes.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/routes/expense.routes.js)
- [index.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/routes/index.js)
- [expense.service.js](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/services/expense.service.js)

## Reason For Change
- Align API routes under a restful structure where expenses are sub-resources of a group.

## Impact On Project
- Simplifies permission checks by checking group membership at the parent route level before executing child expense modifications.

---

## Version 1.2.0

2026-06-14

## Prompt Given
Update the project architecture. Add a dedicated balance calculation module. Backend: services/balance.service.js. Responsibilities: Net balance calculation, Who owes whom calculation, Settlement suggestions, Group balance summaries. Do not implement logic yet.

## Changes Made
- Created balance calculations service shell containing placeholders.

## Files Added
- [balance.service.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/services/balance.service.js)

## Files Modified
None

## Reason For Change
- Separate financial balancing calculations from basic CRUD transaction services.

## Impact On Project
- Implements Separation of Concerns, isolating debt minimization mathematical computations from DB access layers.

---

## Version 1.1.0

2026-06-14

## Prompt Given
Update the project architecture. Add a dedicated CSV Import module. Backend: routes/import.routes.js, controllers/import.controller.js, services/import.service.js, services/anomaly.service.js. Frontend: pages/ImportCSV.jsx, pages/ImportReport.jsx. Requirements: Keep architecture modular, CSV processing must be isolated from expense management, Prepare structure for anomaly detection and import reports.

## Changes Made
- Added `multer` dependency for upload handling.
- Implemented file uploader drag-and-drop page and audit report view.
- Added CSV validation parser service and anomaly warning scanner (flagging duplicates, outliers, split discrepancies).
- Registered routes and navigation links.

## Files Added
- [import.routes.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/routes/import.routes.js)
- [import.controller.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/controllers/import.controller.js)
- [import.service.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/services/import.service.js)
- [anomaly.service.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/services/anomaly.service.js)
- [ImportCSV.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/ImportCSV.jsx)
- [ImportReport.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/ImportReport.jsx)

## Files Modified
- [package.json](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/package.json)
- [index.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/routes/index.js)
- [AppRoutes.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/routes/AppRoutes.jsx)
- [Sidebar.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/components/layout/Sidebar.jsx)

## Reason For Change
- Enable bulk uploading of spreadsheet bills with validation safeguards.

## Impact On Project
- Processing is isolated, protecting active expense tables from direct writes until manual review is approved on the frontend.

---

## Version 1.0.0

2026-06-14

## Prompt Given
Create the complete folder structure for a Shared Expense Management App. Tech Stack: React + Vite + Tailwind, Node.js + Express, PostgreSQL + Prisma. Generate: Frontend structure, Backend structure, Environment files, Routing structure, API structure. Do not write business logic yet.

## Changes Made
- Created Node.js + Express workspace config with Prisma ORM setup.
- Generated database schema configurations (`schema.prisma`) for Users, Groups, Expenses, and Splits.
- Setup route controllers, error middlewares, and auth check shells on the backend.
- Created React + Vite + Tailwind frontend workspace containing Auth Context state, custom hooks, Axios API clients, layout shells (Navbar, Sidebar), and router mapping definitions (AppRoutes, ProtectedRoute).
- Configured theme palettes and styling assets.

## Files Added
- [package.json](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/package.json)
- [.env](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/.env)
- [.env.example](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/.env.example)
- [schema.prisma](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/prisma/schema.prisma)
- [server.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/server.js)
- [app.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/app.js)
- [prisma.service.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/services/prisma.service.js)
- [auth.middleware.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/middleware/auth.middleware.js)
- [error.middleware.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/middleware/error.middleware.js)
- [validation.middleware.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/middleware/validation.middleware.js)
- [auth.controller.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/controllers/auth.controller.js)
- [user.controller.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/controllers/user.controller.js)
- [group.controller.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/controllers/group.controller.js)
- [expense.controller.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/controllers/expense.controller.js)
- [index.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/routes/index.js)
- [auth.routes.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/routes/auth.routes.js)
- [user.routes.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/routes/user.routes.js)
- [group.routes.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/routes/group.routes.js)
- [expense.routes.js](file:///c:/Users/ASUS/Desktop/Share_Bill/backend/src/routes/expense.routes.js)
- [package.json](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/package.json)
- [vite.config.js](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/vite.config.js)
- [tailwind.config.js](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/tailwind.config.js)
- [postcss.config.js](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/postcss.config.js)
- [.env](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/.env)
- [.env.example](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/.env.example)
- [index.html](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/index.html)
- [main.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/main.jsx)
- [App.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/App.jsx)
- [index.css](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/styles/index.css)
- [AppRoutes.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/routes/AppRoutes.jsx)
- [ProtectedRoute.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/routes/ProtectedRoute.jsx)
- [AuthContext.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/context/AuthContext.jsx)
- [useAuth.js](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/hooks/useAuth.js)
- [api.js](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/services/api.js)
- [auth.service.js](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/services/auth.service.js)
- [group.service.js](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/services/group.service.js)
- [expense.service.js](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/services/expense.service.js)
- [Login.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/Login.jsx)
- [Register.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/Register.jsx)
- [Dashboard.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/Dashboard.jsx)
- [Groups.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/Groups.jsx)
- [GroupDetails.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/GroupDetails.jsx)
- [Expenses.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/Expenses.jsx)
- [NotFound.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/pages/NotFound.jsx)
- [Layout.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/components/layout/Layout.jsx)
- [Navbar.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/components/layout/Navbar.jsx)
- [Sidebar.jsx](file:///c:/Users/ASUS/Desktop/Share_Bill/frontend/src/components/layout/Sidebar.jsx)

## Files Modified
None

## Reason For Change
- Initialize workspace for Shared Expense Management App.

## Impact On Project
- Boilerplate directories and compilation configs resolve correctly, serving as foundation for the codebase.
