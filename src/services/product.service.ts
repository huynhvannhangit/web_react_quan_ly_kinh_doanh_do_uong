import api from "./api";
import { Product } from "@/types";

export const getProducts = async () => {
  const response = await api.get<{ data: Product[] }>("/product");
  return response.data;
};
