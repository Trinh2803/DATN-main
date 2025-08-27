const nodemailer = require('nodemailer');
require('dotenv').config();

const { MAIL_USER, MAIL_PASS } = process.env;
if (!MAIL_USER || !MAIL_PASS) {
  console.error('[MAIL] Missing MAIL_USER or MAIL_PASS environment variables');
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: MAIL_USER,
    pass: MAIL_PASS,
  }
});

const sendOtpEmail = async (to, otp) => {
  await transporter.sendMail({
    from: `"DEHO Support" <${process.env.MAIL_USER}>`,
    to,
    subject: 'Mã OTP xác thực đặt lại mật khẩu',
    html: `
      <h3>Mã xác nhận của bạn là:</h3>
      <p style="font-size: 20px; font-weight: bold;">${otp}</p>
      <p>OTP có hiệu lực trong 5 phút.</p>
    `
  });
};

const sendOrderConfirmationEmail = async (to, order) => {
  const currency = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);
  const itemsRows = (order.items || []).map((it) => `
        <tr>
          <td style="padding:8px;border:1px solid #eee;">${it.productName || ''}${it.size ? ` (Size: ${it.size})` : ''}</td>
          <td style="padding:8px;border:1px solid #eee;" align="center">${it.quantity}</td>
          <td style="padding:8px;border:1px solid #eee;" align="right">${currency(it.price)}</td>
          <td style="padding:8px;border:1px solid #eee;" align="right">${currency((it.quantity || 0) * (it.price || 0))}</td>
        </tr>
  `).join('');

  const discountLine = Number(order.discountAmount) > 0 ? `
      <tr>
        <td colspan="3" style="padding:8px;border:1px solid #eee;" align="right"><strong>Giảm giá</strong></td>
        <td style="padding:8px;border:1px solid #eee;" align="right">- ${currency(order.discountAmount)}</td>
      </tr>
  ` : '';

  const total = typeof order.total === 'number' ? order.total : (order.finalAmount || order.subtotal || 0);

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#222">
      <h2>Cảm ơn bạn đã đặt hàng tại DEHO!</h2>
      <p>Xin chào ${order.customerName || ''}, chúng tôi đã nhận được đơn hàng của bạn.</p>
      <p><strong>Mã đơn hàng:</strong> ${order._id}</p>
      <p><strong>Phương thức thanh toán:</strong> ${order.paymentMethod || 'COD'}</p>
      <p><strong>Trạng thái:</strong> ${order.status || 'Chờ xác nhận'}</p>

      <h3>Thông tin nhận hàng</h3>
      <p>
        <strong>Người nhận:</strong> ${order.customerName || ''}<br/>
        <strong>SĐT:</strong> ${order.customerPhone || ''}<br/>
        <strong>Địa chỉ:</strong> ${order.customerAddress || ''}
      </p>

      <h3>Chi tiết đơn hàng</h3>
      <table cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;border:1px solid #eee;">
        <thead>
          <tr>
            <th align="left" style="padding:8px;border:1px solid #eee;">Sản phẩm</th>
            <th align="center" style="padding:8px;border:1px solid #eee;">SL</th>
            <th align="right" style="padding:8px;border:1px solid #eee;">Đơn giá</th>
            <th align="right" style="padding:8px;border:1px solid #eee;">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
          <tr>
            <td colspan="3" style="padding:8px;border:1px solid #eee;" align="right"><strong>Tạm tính</strong></td>
            <td style="padding:8px;border:1px solid #eee;" align="right">${currency(order.subtotal || 0)}</td>
          </tr>
          ${discountLine}
          <tr>
            <td colspan="3" style="padding:8px;border:1px solid #eee;" align="right"><strong>Tổng thanh toán</strong></td>
            <td style="padding:8px;border:1px solid #eee;" align="right"><strong>${currency(total)}</strong></td>
          </tr>
        </tbody>
      </table>

      <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng phản hồi lại email này.</p>
      <p>Trân trọng,<br/>DEHO Team</p>
    </div>
  `;

  const info = await transporter.sendMail({
    from: `"DEHO" <${process.env.MAIL_USER}>`,
    to,
    subject: `Xác nhận đơn hàng #${order._id}`,
    html
  });
  console.log('[MAIL] Order confirmation sent:', { to, messageId: info?.messageId });
};

module.exports = {
  sendOtpEmail,
  sendOrderConfirmationEmail
};
