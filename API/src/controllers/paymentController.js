const moment = require('moment');
const crypto = require('crypto');
const querystring = require('qs');
const { vnp_TmnCode, vnp_HashSecret, vnp_Url, vnp_ReturnUrl } = require('../config/vnpayConfig');
const orderService = require('../services/orderService');
const Discount = require('../models/discountModel');

// Tạo URL thanh toán
exports.createPayment = async (req, res) => {
    try {
        const { amount, bankCode, language, orderData } = req.body;
        // Lưu ý: KHÔNG tăng bộ đếm mã giảm giá tại đây.
        // Việc tăng usedCount sẽ thực hiện sau khi thanh toán VNPay thành công (createOrderAfterPayment).

        process.env.TZ = 'Asia/Ho_Chi_Minh'; // Thiết lập múi giờ
        const date = new Date();
        const createDate = moment(date).format('YYYYMMDDHHmmss');
        const ipAddr = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || '127.0.0.1';
        const orderId = moment(date).format('YYYYMMDDHHmmss') + String(Math.floor(Math.random() * 100000)).padStart(5, '0');

        // Kiểm tra amount hợp lệ
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
            return res.status(400).json({ code: '99', message: 'Invalid amount' });
        }

        const locale = language || 'vn';
        const currCode = 'VND';
        const amountInVND = Math.round(parseFloat(amount) * 100);

        // Luôn sử dụng URL trả về được cấu hình trong server để tránh sai cổng/ứng dụng
        const effectiveReturnUrl = vnp_ReturnUrl;
        console.log('[VNPay] Using returnUrl (from config):', effectiveReturnUrl);

        // Cấu hình tham số gửi đến VNPay
        let vnp_Params = {
            vnp_Version: '2.1.0',
            vnp_Command: 'pay',
            vnp_TmnCode: vnp_TmnCode,
            vnp_Locale: locale,
            vnp_CurrCode: currCode,
            vnp_TxnRef: orderId,
            vnp_OrderInfo: `Thanh toán cho mã GD: ${orderId}`,
            vnp_OrderType: 'other',
            vnp_Amount: amountInVND,
            vnp_ReturnUrl: effectiveReturnUrl,
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
        res.status(200).json({ code: '00', message: 'Success', data: paymentUrl });
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
        const hmac = crypto.createHmac('sha512', vnp_HashSecret);const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        if (secureHash === signed) {
            const responseCode = vnp_Params['vnp_ResponseCode'];
            
            // Tạo query string để redirect về frontend
            const queryParams = new URLSearchParams({
                vnp_ResponseCode: responseCode,
                vnp_TxnRef: vnp_Params['vnp_TxnRef'],
                vnp_Amount: vnp_Params['vnp_Amount'],
                vnp_BankCode: vnp_Params['vnp_BankCode'] || '',
                vnp_PayDate: vnp_Params['vnp_PayDate'],
                vnp_TransactionNo: vnp_Params['vnp_TransactionNo'] || '',
                vnp_OrderInfo: vnp_Params['vnp_OrderInfo'] || ''
            }).toString();
            
            // Redirect về frontend theo cấu hình
            return res.redirect(`${vnp_ReturnUrl}?${queryParams}`);
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

// Tạo đơn hàng sau khi thanh toán VNPay thành công
exports.createOrderAfterPayment = async (req, res) => {
    try {
        const { orderData, vnpayData } = req.body;
        
        // Cập nhật thông tin thanh toán vào orderData
        const updatedOrderData = {
            ...orderData,
            paymentMethod: 'vnpay',
            paymentStatus: 'completed',
            status: 'Đã thanh toán',
            vnpayInfo: {
                transactionId: vnpayData.vnp_TxnRef,
                transactionNo: vnpayData.vnp_TransactionNo,
                amount: parseInt(vnpayData.vnp_Amount),
                bankCode: vnpayData.vnp_BankCode,
                payDate: vnpayData.vnp_PayDate,
                responseCode: vnpayData.vnp_ResponseCode,
                orderInfo: vnpayData.vnp_OrderInfo,
                secureHash: vnpayData.vnp_SecureHash
            }
        };

        // Tạo đơn hàng trong database
        const order = await orderService.createOrder(updatedOrderData);
        
        // Không tăng bộ đếm mã giảm giá ở đây. orderService.createOrder() đã xử lý tăng usedCount sau khi đơn hàng được tạo thành công.

        res.status(201).json({
            success: true,
            message: 'Đơn hàng đã được tạo thành công sau thanh toán VNPay',
            data: order
        });
    } catch (error) {
        console.error('Error creating order after VNPay payment:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo đơn hàng sau thanh toán',
            error: error.message
        });
    }
};

// Lấy thông tin hóa đơn
exports.getInvoice = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await orderService.getOrderById(orderId);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        // Tạo thông tin hóa đơn
        const invoice = {
            orderId: order._id,
            orderDate: order.createdAt,
            customerInfo: {
                name: order.customerName,
                email: order.customerEmail,
                phone: order.customerPhone,
                address: order.customerAddress
            },
            items: order.items,
            total: order.total,
            finalAmount: order.finalAmount,
            discountInfo: order.discountInfo,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            vnpayInfo: order.vnpayInfo,
            status: order.status
        };

        res.status(200).json({
            success: true,
            message: 'Lấy thông tin hóa đơn thành công',
            data: invoice
        });
    } catch (error) {
        console.error('Error getting invoice:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin hóa đơn',
            error: error.message
        });
    }
};

// Hàm sắp xếp object
function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}
