"use client";

import { useEffect, useState } from "react";
import { getProducts } from "@/services/product.service";
import { Product } from "@/types";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const res = await getProducts();
        setProducts(res.data || []);
      } catch (error) {
        console.error("Lỗi tải sản phẩm:", error);
      }
    };

    fetchData();
  }, [router]);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Danh sách sản phẩm</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="border p-4 rounded-lg shadow hover:shadow-lg transition"
          >
            <h2 className="text-xl font-semibold text-blue-800">
              {product.name}
            </h2>
            <p className="text-gray-600 mt-2">
              Giá:{" "}
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(product.price)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Danh mục ID: {product.categoryId}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
