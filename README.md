# Hệ Thống Quản Lý Kinh Doanh Đồ Uống - Giao Diện Người Dùng

Giao diện người dùng (Web Application) của dự án **Quản lý Kinh doanh Đồ uống**, được xây dựng trên nền tảng Next.js hiện đại, mang lại trải nghiệm mượt mà và trực quan.

---

## 📄 Báo Cáo Dự Án
Chi tiết về yêu cầu hệ thống, thiết kế giao diện và quy trình nghiệp vụ có thể được tìm thấy tại:
👉 **[Xem Báo Cáo Đồ Án Chuyên Ngành 2](https://drive.google.com/file/d/1k0uGiPZl95nbOvWFmxplT5eA__Nfxd7W/view?usp=drive_link)**

---

## 🌟 Tính Năng Nổi Bật

- **🏠 Dashboard Thông Minh**: Theo dõi doanh thu, số lượng đơn hàng qua các biểu đồ trực quan (Recharts).
- **🛒 Hệ Thống Gọi Món (Gói món)**: Giao diện chọn món nhanh chóng, hỗ trợ quản lý bàn và khu vực thời gian thực.
- **💬 Trợ lý AI**: Tích hợp trợ lý ảo thông minh hỗ trợ giải đáp thắc mắc và phân tích dữ liệu.
- **💳 Thanh Toán**: Hiển thị mã QR thanh toán và hỗ trợ theo dõi trạng thái hóa đơn.
- **👤 Quản Lý Người Dùng & Nhân Viên**: Phân quyền (Admin/Staff), quản lý hồ sơ và lịch sử hoạt động.
- **🔔 Thông Báo Real-time**: Nhận cập nhật tức thì về các trạng thái đơn hàng và hệ thống qua Socket.io.
- **⚙️ Cấu Hình Hệ Thống**: Tùy chỉnh các tham số vận hành của cửa hàng một cách linh hoạt.

---

## 🛠 Công Nghệ Sử Dụng

- **Khung chương trình (Framework)**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Thư viện UI**: [Radix UI](https://www.radix-ui.com/) & [Tailwind CSS](https://tailwindcss.com/)
- **Biểu tượng (Icons)**: [Lucide React](https://lucide.dev/)
- **Biểu đồ (Charts)**: [Recharts](https://recharts.org/)
- **Quản lý trạng thái**: React Hooks & Context API
- **Tương tác API**: [Axios](https://axios-http.com/)
- **Thời gian thực**: [Socket.io-client](https://socket.io/)
- **Xác thực/Lưu trữ**: Firebase Auth & JWT

---

## 🚦 Hướng Dẫn Cài Đặt

### 1. Yêu Cầu Hệ Thống
- Node.js (v18 trở lên)
- Yarn hoặc NPM

### 2. Cài Đặt & Chạy Thử
```bash
# Cài đặt thư viện
yarn install

# Cấu hình môi trường
# Tạo file .env và thêm các biến cần thiết (NEXT_PUBLIC_API_URL, Firebase config...)

# Chạy ở chế độ phát triển
yarn dev
```

### 3. Xây Dựng Bản Sản Xuất (Production)
```bash
yarn build
yarn start
```

---

## 📁 Cấu Trúc Thư Mục
```text
src/
├── app/            # Next.js App Router (Trang & Giao diện)
│   ├── (auth)      # Các trang đăng nhập/đăng ký
│   └── (dashboard) # Các module nghiệp vụ chính
├── components/     # Các thành phần tái sử dụng
├── hooks/          # Các React Hooks tùy chỉnh
├── lib/            # Tiện ích và cấu hình (Axios, Utils)
└── services/       # Các hàm tương tác với API
```
