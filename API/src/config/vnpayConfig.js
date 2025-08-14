// vnpayConfig.js (hoặc nơi bạn định nghĩa các biến này, thường là trong .env)
// Mặc định trỏ tới site dev server (4200). Có thể override bằng biến môi trường SITE_BASE_URL
const SITE_BASE = process.env.SITE_BASE_URL || 'http://localhost:4200';
module.exports = {
  vnp_TmnCode: "BQ8S0XIX",
  vnp_HashSecret: "ICZU7H42UPRXC9MA0YDYDLDIBDJV2B4Y",
  vnp_Url: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  // Mặc định redirect về site (không phải admin). Có thể override bằng biến môi trường SITE_BASE_URL
  vnp_ReturnUrl: `${SITE_BASE.replace(/\/$/, '')}/payment-result`,
  // Đừng quên thêm VNP_IPN_URL nếu bạn chưa có
  vnp_IpnUrl: `http://localhost:3000/payment/vnpay_ipn`
};