# ⚡ FulFillPro — E-Commerce Order Fulfillment System

## 🏗️ Kiến trúc
- **Frontend**: React 18 + React Router v6 + Recharts
- **Backend**: Node.js + Express
- **Database**: MySQL

## 👥 4 Roles
| Role | Email | Mô tả |
|------|-------|-------|
| **Admin** | admin@store.com | Quản trị toàn hệ thống (dashboard, đơn hàng, sản phẩm, users, kho, doanh thu) |
| **Customer** | customer@store.com | Mua hàng, giỏ hàng, thanh toán, theo dõi đơn |
| **Warehouse** | warehouse@store.com | Đóng gói đơn hàng, quản lý kho |
| **Delivery** | delivery@store.com | Nhận và giao đơn hàng |

> **Mật khẩu tất cả:** `password123`

---

## 🚀 Hướng dẫn chạy

### Bước 1: Cài đặt MySQL
Tạo database:
```sql
CREATE DATABASE ecommerce_fulfillment CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Bước 2: Cấu hình Backend
```bash
cd backend
cp .env.example .env
# Sửa .env: điền DB_PASSWORD của bạn
npm install
npm run seed    # Tạo bảng + dữ liệu mẫu
npm run dev     # Chạy server port 5000
```

### Bước 3: Chạy Frontend
```bash
cd frontend
npm install
npm start       # Chạy app port 3000
```

### Bước 4: Mở trình duyệt
```
http://localhost:3000
```

---

## 📋 Business Process Flow
```
Customer đặt hàng
    → Thanh toán (simulate success/fail)
        → Warehouse nhận đơn (paid) → đóng gói → shipped
            → Delivery nhận đơn → giao → delivered / báo lỗi (tối đa 3 lần)
                → Admin theo dõi toàn bộ qua Dashboard
```

## 🗄️ Cấu trúc dự án
```
ecommerce-fulfillment/
├── backend/
│   ├── src/
│   │   ├── config/        # DB, schema, seed
│   │   ├── controllers/   # auth, product, cart, order, admin
│   │   ├── middleware/    # JWT auth
│   │   └── routes/        # API routes
│   └── .env.example
└── frontend/
    └── src/
        ├── pages/
        │   ├── admin/     # Dashboard, Orders, Products, Users, Inventory, Revenue
        │   ├── customer/  # Shop, Cart, MyOrders
        │   ├── warehouse/ # Orders, Inventory
        │   └── delivery/  # DeliveryPage
        ├── context/       # Auth, Toast
        └── utils/         # API, formatters
```
