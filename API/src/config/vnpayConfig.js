// Cấu hình VNPay
const vnpayConfig = {
    // Thông tin merchant
    vnp_TmnCode: process.env.VNP_TMN_CODE || 'OKP6YB69', // Mã website tại VNPAY 
    vnp_HashSecret: process.env.VNP_HASH_SECRET || 'TYIW4OPTLQWJT2INA3G5S63DDO2W2BYW', // Chuỗi bí mật
    vnp_Url: process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html', // URL thanh toán cho môi trường test
    vnp_ReturnUrl: process.env.VNP_RETURN_URL || 'http://localhost:3000/payment/vnpay_return', // URL nhận kết quả
    vnp_ApiUrl: process.env.VNP_API_URL || 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction', // URL API VNPay
};

module.exports = vnpayConfig; 