export interface User {
  id: number;
  email: string;
  fullName: string;
  role: string;
}

export interface LoginResponse {
  data: {
    accessToken: string;
    refreshToken: string;
    user: User;
  };
  message: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  categoryId: number;
  description?: string;
}
