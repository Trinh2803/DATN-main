const VNPAYService = require("../services/payService");

const PaymentController = {
  // === TẠO YÊU CẦU THANH TOÁN ===
  createPayment: async (req, res) => {
    try {
      const response = await VNPAYService.handleCreatePayment(req, res);
      console.log("Payment response:", response); // Debug log

      return res.status(200).json({
        success: true,
        data: response,
      });
    } catch (error) {
      console.error("Payment error:", error.message);
      return res.status(500).json({
        error: error.message || "Failed to process payment callback",
        code: error.code || "INTERNAL_SERVER_ERROR",
      });
    }
  },

  // === TRẢ VỀ CALLBACK URL CHO VNPAY ===
  checkIpnVNPay: async (req, res) => {
    try {
      const result = VNPAYService.verifyReturnUrl(req.query);

      if (!result.isVerified) {
        return res.send("Chữ ký không hợp lệ!");
      }

      if (!result.isSuccess) {
        return res.send("Giao dịch không thành công!");
      }

      // ✅ Gọi IPN xử lý tự động ở đây
      const ipnResult = await VNPAYService.handleIPN(req.query);

      if (!ipnResult.success) {
        return res.send(`Xử lý IPN thất bại: ${ipnResult.message}`);
      }
      console.log("IPN processed successfully:", ipnResult);

      // ✅ Giao dịch thành công + xử lý IPN thành công
      // Có thể redirect sang frontend
      return res.redirect("http://localhost:4200/thongke");
    } catch (error) {
      return res.status(500).send({
        error: error.message || "Lỗi khi xử lý IPN VNPay",
        code: error.code || "INTERNAL_SERVER_ERROR",
      });
    }
  },

  // === LẤY TRẠNG THÁI GIAO DỊCH ===
  getTransactionStatus: async (req, res) => {
    try {
      const { orderId } = req.body;
      if (!orderId) {
        return res.status(400).json({
          error: "Order ID is required",
        });
      }

      const paymentService = VNPAYService.handleGetTransactionStatus(req);

      return res.status(200).json({
        success: true,
        data: paymentService,
      });
    } catch (error) {
      console.error("Get transaction status error:", error.message);
      return res.status(500).json({
        error: error.message || "Failed to get transaction status",
        code: error.code || "INTERNAL_SERVER_ERROR",
      });
    }
  },
};

module.exports = PaymentController;
