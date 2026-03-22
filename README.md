# Hệ Thống Quản Lý Kinh Doanh Đồ Uống - Giao Diện Người Dùng

Giao diện người dùng (Ứng dụng Web) của dự án **Quản lý Kinh doanh Đồ uống**, được xây dựng trên nền tảng Next.js hiện đại, mang lại trải nghiệm mượt mà và trực quan.

---

## 📄 Báo Cáo Dự Án
Chi tiết về yêu cầu hệ thống, thiết kế giao diện và quy trình nghiệp vụ có thể được tìm thấy tại:
👉 **[Xem Báo Cáo Đồ Án Chuyên Ngành 2](https://drive.google.com/file/d/1k0uGiPZl95nbOvWFmxplT5eA__Nfxd7W/view?usp=drive_link)**

---

## 🌟 Tính Năng Nổi Bật

- **🏠 Bảng Điều Khiển Thông Minh**: Theo dõi doanh thu, số lượng đơn hàng qua các biểu đồ trực quan (Recharts).
- **🛒 Hệ Thống Gọi Món**: Giao diện chọn món nhanh chóng, hỗ trợ quản lý bàn và khu vực theo thời gian thực.
- **💬 Trợ lý AI**: Tích hợp trợ lý ảo thông minh hỗ trợ giải đáp thắc mắc và phân tích dữ liệu kinh doanh.
- **💳 Thanh Toán**: Hiển thị mã QR thanh toán và hỗ trợ theo dõi trạng thái hóa đơn.
- **👤 Quản Lý Người Dùng & Nhân Viên**: Phân quyền (Quản trị viên/Nhân viên), quản lý hồ sơ và lịch sử hoạt động.
- **🔔 Thông Báo Tức Thời**: Nhận cập nhật kịp thời về các trạng thái đơn hàng và hệ thống qua Socket.io.
- **⚙️ Cấu Hình Hệ Thống**: Tùy chỉnh các tham số vận hành của cửa hàng một cách linh hoạt.

---

## 🛠 Công Nghệ Sử Dụng

- **Khung chương trình (Framework)**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Thư viện giao diện (UI Library)**: [Radix UI](https://www.radix-ui.com/) & [Tailwind CSS](https://tailwindcss.com/)
- **Biểu tượng (Icons)**: [Lucide React](https://lucide.dev/)
- **Biểu đồ (Charts)**: [Recharts](https://recharts.org/)
- **Quản lý trạng thái**: React Hooks & Context API
- **Tương tác API**: [Axios](https://axios-http.com/)
- **Thời gian thực**: [Socket.io-client](https://socket.io/)
- **Xác thực và lưu trữ**: Firebase Auth & JWT

---

## 🚦 Hướng Dẫn Cài Đặt

### 1. Yêu Cầu Hệ Thống
- Node.js (phiên bản 18 trở lên)
- Yarn hoặc NPM

### 2. Cài Đặt & Chạy Thử
```bash
# Cài đặt thư viện
yarn install

# Cấu hình môi trường
# Tạo tệp .env và thêm các biến cần thiết (NEXT_PUBLIC_API_URL, Firebase config...)

# Chạy ở chế độ phát triển
yarn dev
```

### 3. Xây Dựng Bản Phát Hành (Production)
```bash
yarn build
yarn start
```

---

## 📁 Cấu Trúc Thư Mục
```text
src/
├── app/            # Cấu trúc App Router của Next.js (Trang & Giao diện)
│   ├── (auth)      # Các trang xác thực (Đăng nhập/Đăng ký)
│   └── (dashboard) # Các mô-đun nghiệp vụ chính
├── components/     # Các thành phần giao diện tái sử dụng
├── hooks/          # Các React Hooks tùy chỉnh
├── lib/            # Thư viện tiện ích và cấu hình (Axios, Utils)
└── services/       # Các hàm xử lý tương tác với API
```
