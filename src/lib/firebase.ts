import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Cấu hình Firebase từ biến môi trường
// Cần thêm các biến này vào .env.local ở frontend
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Khởi tạo app Firebase (chỉ khởi tạo nếu chưa có để tránh lỗi hot-reload trong Next.js)
// Nếu không cấu hình đủ biến môi trường, firebaseConfig sẽ thiết lập nhưng không hoạt động đúng
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Lấy tham chiếu đến Firestore database
export const db = getFirestore(app);
