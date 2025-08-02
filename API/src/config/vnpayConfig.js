// vnpayConfig.js (hoặc nơi bạn định nghĩa các biến này, thường là trong .env)
module.exports = {
  vnp_TmnCode: "BQ8S0XIX",
  vnp_HashSecret: "ICZU7H42UPRXC9MA0YDYDLDIBDJV2B4Y",
  vnp_Url: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  vnp_ReturnUrl: `http://localhost:3000/payment/vnpay_return`, // Đã thay đổi
  // Đừng quên thêm VNP_IPN_URL nếu bạn chưa có
  vnp_IpnUrl: `http://localhost:3000/payment/vnpay_ipn` // Đã thêm
};