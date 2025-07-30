const moment = require('moment');
const crypto = require('crypto');
const querystring = require('qs');
const Payment = require("../models/paymentModel");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
// const Variant = require("../models/variantModel"); // Không có model riêng, dùng product.variants
// const OrderDetail = require("../models/orderdetailModel"); // Không có, dùng order.items
const vnpConfig = require('../config/vnpayConfig');

// Hàm lấy IP client
function getClientIp(_req) {
    let ipAddr = _req.headers['x-forwarded-for'] ||
        _req.connection?.remoteAddress ||
        _req.socket?.remoteAddress ||
        _req.connection?.socket?.remoteAddress || '';
    if (ipAddr.includes('::ffff:')) {
        ipAddr = ipAddr.split('::ffff:')[1];
    }
    return ipAddr;
}

// Sắp xếp object theo key
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

// 1. Tạo URL thanh toán VNPAY
const createPayment = async (_req, res) => {
    try {
        const { orderId, amount, bankCode, language = 'vn' } = _req.body;
        if (!orderId || !amount || isNaN(amount) || parseFloat(amount) <= 0) {
            return res.status(400).json({ code: '99', message: 'Thiếu hoặc sai orderId/amount.' });
        }
        // Lấy thông tin order từ DB để đảm bảo amount khớp
        const currentOrder = await Order.findById(orderId);
        if (!currentOrder) {
            return res.status(404).json({ code: '99', message: 'Không tìm thấy đơn hàng.' });
        }
        if (parseFloat(amount) !== currentOrder.finalAmount) {
            return res.status(400).json({ code: '99', message: 'Số tiền không khớp với đơn hàng.' });
        }
        // Tìm bản ghi Payment đã tạo (trạng thái pending)
        let existingPayment = await Payment.findOne({ orderId: orderId, paymentMethod: 'vnpay' });
        if (!existingPayment) {
            return res.status(400).json({ code: '99', message: 'Không tìm thấy payment cho đơn hàng này.' });
        }
        const ipAddr = getClientIp(_req);
        const tmnCode = vnpConfig.vnp_TmnCode;
        const secretKey = vnpConfig.vnp_HashSecret;
        let vnpUrl = vnpConfig.vnp_Url;
        const returnUrl = vnpConfig.vnp_ReturnUrl;
        const date = new Date();
        const createDate = moment(date).format('YYYYMMDDHHmmss');
        const orderId_vnpay = existingPayment.vnp_TxnRef;
        let vnp_Params = {};
        vnp_Params['vnp_Version'] = '2.1.0';
        vnp_Params['vnp_Command'] = 'pay';
        vnp_Params['vnp_TmnCode'] = tmnCode;
        vnp_Params['vnp_Amount'] = amount * 100;
        if (bankCode) vnp_Params['vnp_BankCode'] = bankCode;
        vnp_Params['vnp_CreateDate'] = createDate;
        vnp_Params['vnp_CurrCode'] = 'VND';
        vnp_Params['vnp_IpAddr'] = ipAddr;
        vnp_Params['vnp_Locale'] = language;
        vnp_Params['vnp_OrderInfo'] = `Thanh toan don hang: ${orderId_vnpay}`;
        vnp_Params['vnp_OrderType'] = 'other';
        vnp_Params['vnp_ReturnUrl'] = returnUrl;
        vnp_Params['vnp_TxnRef'] = orderId_vnpay;
        vnp_Params = sortObject(vnp_Params);
        const signData = querystring.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac("sha512", secretKey);
        const secureHash = hmac.update(signData).digest("hex");
        vnp_Params['vnp_SecureHash'] = secureHash;
        vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });
        res.status(200).json({
            code: '00',
            message: 'Thành công',
            data: vnpUrl,
            orderId: orderId,
        });
    } catch (err) {
        console.error('Lỗi createPayment:', err);
        res.status(500).json({ code: '99', message: 'Lỗi server', error: err.message });
    }
};

// 2. Xử lý kết quả trả về từ VNPAY (qua trình duyệt)
const paymentReturn = async (req, res) => {
    let vnp_Params = req.query;
    const secureHash = vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];
    vnp_Params = sortObject(vnp_Params);
    const secretKey = vnpConfig.vnp_HashSecret;
    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(signData).digest("hex");
    const orderId = vnp_Params['vnp_TxnRef'];
    const responseCode = vnp_Params['vnp_ResponseCode'];
    const transactionStatus = vnp_Params['vnp_TransactionStatus'];
    const vnp_TransactionNo = vnp_Params['vnp_TransactionNo'];
    let message = "Giao dịch không xác định.";
    let paymentStatus = "pending";
    let orderStatus = "Chờ xác nhận";
    try {
        if (secureHash === signed) {
            const payment = await Payment.findOne({ vnp_TxnRef: orderId });
            const order = await Order.findById(payment.orderId);
            if (!payment || !order) {
                message = "Không tìm thấy thông tin thanh toán hoặc đơn hàng.";
                orderStatus = "Đã hủy";
            } else if (payment.paymentStatus === 'paid' || payment.paymentStatus === 'failed') {
                message = "Giao dịch đã được xác nhận trạng thái trước đó.";
                paymentStatus = payment.paymentStatus;
                orderStatus = order.status;
            } else {
                if (responseCode === '00' && transactionStatus === '00') {
                    message = "Thanh toán thành công. Đơn hàng của bạn đã được xác nhận.";
                    paymentStatus = "paid";
                    orderStatus = "Đang chuẩn bị";
                    // Trừ kho từng sản phẩm/variant
                    for (const detail of order.items) {
                        const product = await Product.findById(detail.productId);
                        if (!product) continue;
                        // Tìm variant đúng
                        const variantIndex = product.variants.findIndex(v => v.id === detail.variantId);
                        if (variantIndex !== -1) {
                            if (product.variants[variantIndex].stock < detail.quantity) {
                                message = `Không đủ tồn kho cho sản phẩm ${product.name}`;
                                paymentStatus = "failed";
                                orderStatus = "Đã hủy";
                                break;
                            }
                            product.variants[variantIndex].stock -= detail.quantity;
                        }
                        await product.save();
                        // Tăng lượt mua
                        product.sellCount = (product.sellCount || 0) + 1;
                        await product.save();
                    }
                } else {
                    message = `Thanh toán không thành công. Mã lỗi: ${responseCode}. Trạng thái: ${transactionStatus}.`;
                    paymentStatus = "failed";
                    orderStatus = "Đã hủy";
                }
                // Cập nhật Payment và Order status trong DB
                payment.paymentStatus = paymentStatus;
                payment.vnp_ResponseCode = responseCode;
                payment.vnp_TransactionStatus = transactionStatus;
                payment.vnp_TransactionNo = vnp_TransactionNo;
                payment.vnp_PayDate = vnp_Params['vnp_PayDate'];
                payment.vnp_CardType = vnp_Params['vnp_CardType'];
                await payment.save();
                order.status = orderStatus;
                await order.save();
            }
        } else {
            message = "Chữ ký không hợp lệ. Giao dịch không được xác minh.";
            paymentStatus = "failed";
            orderStatus = "Đã hủy";
        }
    } catch (err) {
        console.error('Lỗi paymentReturn:', err);
        message = 'Có lỗi xảy ra trong quá trình xử lý kết quả thanh toán.';
        paymentStatus = "failed";
        orderStatus = "Đã hủy";
    }
    res.json({
        responseCode: responseCode,
        message: message,
        orderId: orderId,
        paymentStatus: paymentStatus,
        orderStatus: orderStatus,
        vnp_TransactionNo: vnp_TransactionNo,
    });
};

// 3. Xử lý IPN từ VNPAY (server-to-server)
const paymentIpn = async (req, res) => {
    let vnp_Params = req.query;
    const secureHash = vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];
    vnp_Params = sortObject(vnp_Params);
    const secretKey = vnpConfig.vnp_HashSecret;
    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(signData).digest("hex");
    const orderId = vnp_Params['vnp_TxnRef'];
    const vnp_Amount = vnp_Params['vnp_Amount'] / 100;
    const vnp_ResponseCode = vnp_Params['vnp_ResponseCode'];
    const vnp_TransactionStatus = vnp_Params['vnp_TransactionStatus'];
    try {
        const payment = await Payment.findOne({ vnp_TxnRef: orderId });
        if (!payment) {
            return res.status(200).json({ RspCode: '01', Message: 'Không tìm thấy payment' });
        }
        const order = await Order.findById(payment.orderId);
        if (!order) {
            return res.status(200).json({ RspCode: '01', Message: 'Không tìm thấy đơn hàng' });
        }
        if (secureHash !== signed) {
            return res.status(200).json({ RspCode: '97', Message: 'Sai checksum' });
        }
        if (vnp_Amount !== payment.amount) {
            return res.status(200).json({ RspCode: '04', Message: 'Sai số tiền' });
        }
        if (payment.paymentStatus === 'paid' || payment.paymentStatus === 'failed') {
            return res.status(200).json({ RspCode: '02', Message: 'Đơn hàng đã xác nhận' });
        }
        if (vnp_ResponseCode === '00' && vnp_TransactionStatus === '00') {
            payment.paymentStatus = 'paid';
            order.status = 'Đang chuẩn bị';
            await order.save();
        } else {
            payment.paymentStatus = 'failed';
            order.status = 'Đã hủy';
            await order.save();
        }
        payment.vnp_Amount = vnp_Amount * 100;
        payment.vnp_BankCode = vnp_Params['vnp_BankCode'];
        payment.vnp_CardType = vnp_Params['vnp_CardType'];
        payment.vnp_OrderInfo = vnp_Params['vnp_OrderInfo'];
        payment.vnp_PayDate = vnp_Params['vnp_PayDate'];
        payment.vnp_ResponseCode = vnp_ResponseCode;
        payment.vnp_TmnCode = vnp_Params['vnp_TmnCode'];
        payment.vnp_TransactionNo = vnp_Params['vnp_TransactionNo'];
        payment.vnp_TransactionStatus = vnp_TransactionStatus;
        payment.vnp_SecureHash = secureHash;
        await payment.save();
        res.status(200).json({ RspCode: '00', Message: 'Xác nhận thành công' });
    } catch (err) {
        console.error('Lỗi paymentIpn:', err);
        res.status(200).json({ RspCode: '99', Message: 'Lỗi không xác định' });
    }
};

module.exports = {
    createPayment,
    paymentReturn,
    paymentIpn
}; 