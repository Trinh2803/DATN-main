# Hướng dẫn sử dụng chương trình giảm giá nâng cao

## Tính năng mới

### 1. Tạo mã giảm giá cho sản phẩm cụ thể
- **Chọn sản phẩm**: Click vào nút "Chọn sản phẩm" trong form tạo/chỉnh sửa mã giảm giá
- **Tìm kiếm sản phẩm**: Sử dụng ô tìm kiếm trong modal để tìm sản phẩm nhanh chóng
- **Chọn nhiều sản phẩm**: Có thể chọn nhiều sản phẩm cùng lúc
- **Xóa sản phẩm**: Click vào nút "X" bên cạnh tên sản phẩm để xóa khỏi danh sách

### 2. Tạo mã giảm giá cho danh mục sản phẩm
- **Chọn danh mục**: Click vào nút "Chọn danh mục" trong form
- **Tìm kiếm danh mục**: Sử dụng ô tìm kiếm để tìm danh mục
- **Áp dụng cho toàn bộ danh mục**: Mã giảm giá sẽ áp dụng cho tất cả sản phẩm trong danh mục đã chọn

### 3. Hiển thị thông tin chi tiết
- **Số lượng sản phẩm/danh mục**: Hiển thị số lượng sản phẩm và danh mục được áp dụng
- **Tên sản phẩm/danh mục**: Hiển thị tên cụ thể của từng sản phẩm và danh mục
- **Trạng thái hoạt động**: Dễ dàng bật/tắt mã giảm giá

## Cách sử dụng

### Tạo mã giảm giá mới
1. Click vào nút "Thêm mã giảm giá"
2. Điền thông tin cơ bản (mã, tên, loại giảm giá, giá trị, thời gian)
3. Chọn sản phẩm hoặc danh mục áp dụng (tùy chọn)
4. Click "Thêm mới" để lưu

### Chỉnh sửa mã giảm giá
1. Click vào nút "Sửa" bên cạnh mã giảm giá
2. Thay đổi thông tin cần thiết
3. Thêm/bớt sản phẩm hoặc danh mục
4. Click "Cập nhật" để lưu

### Xóa mã giảm giá
1. Click vào nút "Xóa" bên cạnh mã giảm giá
2. Xác nhận việc xóa

### Bật/tắt mã giảm giá
- Click vào nút trạng thái để bật/tắt mã giảm giá

## Lưu ý quan trọng

### Validation
- Mã giảm giá phải là duy nhất
- Phần trăm giảm giá phải từ 1-100%
- Số tiền giảm giá phải lớn hơn 0
- Ngày kết thúc phải sau ngày bắt đầu

### Logic áp dụng
- Nếu không chọn sản phẩm/danh mục: Áp dụng cho tất cả sản phẩm
- Nếu chọn sản phẩm: Chỉ áp dụng cho sản phẩm đã chọn
- Nếu chọn danh mục: Áp dụng cho tất cả sản phẩm trong danh mục
- Có thể kết hợp cả sản phẩm và danh mục

### Hiệu lực
- Mã giảm giá chỉ có hiệu lực trong khoảng thời gian đã định
- Phải đạt giá trị đơn hàng tối thiểu
- Không vượt quá giới hạn sử dụng
- Phải được kích hoạt (isActive = true)

## Giao diện

### Modal chọn sản phẩm
- Hiển thị danh sách sản phẩm với hình ảnh và giá
- Tìm kiếm theo tên sản phẩm
- Dấu tích xanh cho sản phẩm đã chọn

### Modal chọn danh mục
- Hiển thị danh sách danh mục với hình ảnh
- Tìm kiếm theo tên danh mục
- Dấu tích xanh cho danh mục đã chọn

### Danh sách mã giảm giá
- Hiển thị thông tin chi tiết
- Số lượng sản phẩm/danh mục áp dụng
- Tên cụ thể của sản phẩm/danh mục
- Trạng thái hoạt động

## API Endpoints

### GET /api/discounts
- Lấy tất cả mã giảm giá (cần admin token)

### POST /api/discounts
- Tạo mã giảm giá mới (cần admin token)

### PUT /api/discounts/:id
- Cập nhật mã giảm giá (cần admin token)

### DELETE /api/discounts/:id
- Xóa mã giảm giá (cần admin token)

### POST /api/discounts/check
- Kiểm tra mã giảm giá (public)

## Cấu trúc dữ liệu

```json
{
  "_id": "discount001",
  "code": "WELCOME10",
  "name": "Giảm giá chào mừng",
  "description": "Giảm giá 10% cho khách hàng mới",
  "discountType": "percentage",
  "discountValue": 10,
  "minOrderValue": 500000,
  "maxDiscount": 100000,
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-12-31T23:59:59.000Z",
  "usageLimit": 1000,
  "usedCount": 0,
  "isActive": true,
  "applicableProducts": ["product001", "product002"],
  "applicableCategories": ["category001"],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
``` 