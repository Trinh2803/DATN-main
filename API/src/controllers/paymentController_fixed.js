// ... (giữ nguyên phần đầu file paymentController.js)

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

        // Tăng bộ đếm sử dụng mã giảm giá (nếu có)
        try {
            const discountId = updatedOrderData?.discountInfo?._id;
            if (!discountId) return;
            
            console.log(`[PAYMENT] Processing discount update for order ${order._id}, discount: ${discountId}`);
            
            const discount = Discount.getDiscountById(discountId);
            if (!discount) {
                console.warn(`[PAYMENT] Discount ${discountId} not found`);
                return;
            }
            
            if (!discount.isActive) {
                console.log(`[PAYMENT] Discount ${discountId} is not active`);
                return;
            }
            
            const now = new Date();
            const withinTime = (!discount.startDate || now >= new Date(discount.startDate)) && 
                             (!discount.endDate || now <= new Date(discount.endDate));
            
            if (!withinTime) {
                console.log(`[PAYMENT] Discount ${discountId} is not within valid date range`);
                return;
            }
            
            // Kiểm tra giới hạn sử dụng toàn cục
            if (discount.usageLimit && (discount.usedCount || 0) >= discount.usageLimit) {
                console.log(`[PAYMENT] Discount ${discountId} has reached global usage limit`);
                // Tự động vô hiệu hóa mã nếu đạt giới hạn
                if (discount.isActive) {
                    console.log(`[PAYMENT] Auto-disabling discount ${discountId} - reached usage limit`);
                    Discount.updateDiscount(discountId, { isActive: false });
                }
                return;
            }
            
            const userId = req.user?.id || req.user?._id || updatedOrderData.userId;
            
            // Xử lý giới hạn sử dụng theo người dùng (nếu có)
            if (discount.usageLimitPerUser && userId) {
                const usedBy = { ...(discount.usedBy || {}) };
                const userUsed = usedBy[userId] || 0;
                
                if (userUsed >= discount.usageLimitPerUser) {
                    console.log(`[PAYMENT] User ${userId} has reached usage limit for discount ${discountId}`);
                    return;
                }
                
                // Tăng bộ đếm cho người dùng
                usedBy[userId] = userUsed + 1;
                
                console.log(`[PAYMENT] Updating discount ${discountId} with user limit for user ${userId}`);
                const updateResult = Discount.updateDiscount(discountId, {
                    usedCount: 1, // Tăng 1 lần sử dụng
                    usedBy: { [userId]: 1 } // Cập nhật số lần sử dụng của user
                });
                
                console.log(`[PAYMENT] Discount update result:`, updateResult);
            } else {
                // Chỉ tăng bộ đếm toàn cục
                console.log(`[PAYMENT] Updating global usage for discount ${discountId}`);
                const updateResult = Discount.updateDiscount(discountId, {
                    usedCount: 1 // Chỉ tăng usedCount lên 1
                });
                
                console.log(`[PAYMENT] Global discount update result:`, updateResult);
            }
        } catch (incErr) {
            console.error('[ERROR] Failed to update discount usage after payment:', incErr);
        }

        return res.status(201).json({
            success: true,
            message: 'Đơn hàng đã được tạo thành công sau thanh toán VNPay',
            data: order
        });
    } catch (error) {
        console.error('Error creating order after payment:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo đơn hàng sau thanh toán VNPay',
            error: error.message
        });
    }
};

// ... (giữ nguyên phần còn lại của file paymentController.js)
