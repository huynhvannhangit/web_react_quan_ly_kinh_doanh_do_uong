import api from "./api";

export const paymentService = {
  createVnpayUrl: async (invoiceId: number) => {
    const response = await api.post<{ data: { url: string } }>(
      "/payment/vnpay/create-url",
      {
        invoiceId,
      },
    );
    return response.data.data.url;
  },

  createMomoUrl: async (invoiceId: number) => {
    const response = await api.post<{ data: { url: string } }>(
      "/payment/momo/create-url",
      {
        invoiceId,
      },
    );
    return response.data.data.url;
  },
};
