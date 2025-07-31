const moment = require('moment');
const crypto = require('crypto');
const querystring = require('qs');
const { vnp_TmnCode, vnp_HashSecret, vnp_Url, vnp_ReturnUrl } = require('../config/vnpayConfig');

// Tạo URL thanh toán
exports.createPayment = async (req, res) => {
    try {
        process.env.TZ = 'Asia/Ho_Chi_Minh'; // Thiết lập múi giờ
        const date = new Date();
        const createDate = moment(date).format('YYYYMMDDHHmmss');
        const ipAddr = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || '127.0.0.1';
        const orderId = moment(date).format('YYYYMMDDHHmmss') + String(Math.floor(Math.random() * 100000)).padStart(5, '0');
        const { amount, bankCode, language, orderInfo } = req.body;

        // Kiểm tra amount hợp lệ
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
            return res.status(400).json({ code: '99', message: 'Invalid amount' });
        }

        const locale = language || 'vn';
        const currCode = 'VND';
        const amountInVND = Math.round(parseFloat(amount) * 100);

        // Cấu hình tham số gửi đến VNPay
        let vnp_Params = {
            vnp_Version: '2.1.0',
            vnp_Command: 'pay',
            vnp_TmnCode: vnp_TmnCode,
            vnp_Locale: locale,
            vnp_CurrCode: currCode,
            vnp_TxnRef: orderId,
            vnp_OrderInfo: orderInfo || `Thanh toán cho mã GD: ${orderId}`,
            vnp_OrderType: 'other',
            vnp_Amount: amountInVND,
            vnp_ReturnUrl: vnp_ReturnUrl,
            vnp_IpAddr: ipAddr,
            vnp_CreateDate: createDate,
        };

        if (bankCode) {
            vnp_Params['vnp_BankCode'] = bankCode;
        }

        // Sắp xếp tham số và tạo chữ ký
        vnp_Params = sortObject(vnp_Params);
        const signData = querystring.stringify(vnp_Params, { encode: false }); 
        const hmac = crypto.createHmac('sha512', vnp_HashSecret);
        vnp_Params['vnp_SecureHash'] = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        const paymentUrl = `${vnp_Url}?${querystring.stringify(vnp_Params, { encode: false })}`;
        res.status(200).json({ 
            code: '00', 
            message: 'Success', 
            data: paymentUrl,
            orderId: orderId,
            amount: amountInVND
        });
    } catch (err) {
        console.error('Error creating payment:', err.message);
        res.status(500).json({ code: '99', message: 'Internal server error' });
    }
};

// Xử lý kết quả trả về từ VNPay
exports.paymentReturn = (req, res) => {
    try {
        let vnp_Params = req.query;

        // Lấy và xóa chữ ký từ tham số
        const secureHash = vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        // Sắp xếp tham số và tạo chữ ký để so sánh
        vnp_Params = sortObject(vnp_Params);
        const signData = querystring.stringify(vnp_Params, { encode: false }); 
        const hmac = crypto.createHmac('sha512', vnp_HashSecret);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        if (secureHash === signed) {
            const responseCode = vnp_Params['vnp_ResponseCode'];
            if (responseCode === '00') {
                return res.status(200).json({
                    code: '00',
                    message: 'Transaction successful',
                    data: vnp_Params,
                });
            } else {
                return res.status(400).json({
                    code: responseCode,
                    message: 'Transaction failed',
                    data: vnp_Params,
                });
            }
        } else {
            return res.status(400).json({
                code: '97',
                message: 'Invalid signature',
                data: vnp_Params,
            });
        }
    } catch (err) {
        console.error('Error handling payment return:', err.message);
        res.status(500).json({ code: '99', message: 'Internal server error' });
    }
};

// Hàm sắp xếp object
function sortObject(obj) {
    const sortedKeys = Object.keys(obj).sort();
    const sorted = {};
    sortedKeys.forEach((key) => {
        sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, '+');
    });
    return sorted;
} 