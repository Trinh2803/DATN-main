import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../product.service';
import { CartService } from '../cart.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductInterface, Variant } from '../product-interface';
import { WishlistService } from '../wishlist.service';
import { CommentService } from '../comment.service';
import { Comment } from '../interfaces/comment.interface';
import Swal from 'sweetalert2';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  selector: 'app-chitietsanpham',
  templateUrl: './chitietsanpham.component.html',
  styleUrls: ['./chitietsanpham.component.css'],
})
export class ChiTietSanPhamComponent implements OnInit {
  product: ProductInterface | null = null;
  selectedVariant: Variant | null = null;
  quantity: number = 1;
  selectedImage: string | null = null;  //Thêm biến lưu ảnh chính
  relatedProducts: ProductInterface[] = []; // Thêm sản phẩm liên quan
  private wishlistCache = new Map<string, boolean>();

  // Comment properties
  comments: Comment[] = [];
  averageRating: number = 0;
  commentFilter: string | number = 'all';
  hoverRating: number = 0;
  isSubmitting: boolean = false;
  newComment = {
    userName: '',
    userEmail: '',
    rating: 0,
    content: ''
  };

  // Coupon properties
  couponCode: string = '';
  appliedCoupon: any = null;
  availableCoupons: any[] = [];
  couponError: string = '';
  isApplyingCoupon: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private commentService: CommentService
  ) {}

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.productService.getProductById(productId).subscribe({
        next: (data: ProductInterface) => {
          this.product = data;
          this.selectedVariant = data.selectedVariant || null;
          this.selectedImage = data.thumbnail;
          console.log('Processed product data:', data);
          // Lấy sản phẩm liên quan sau khi có thông tin sản phẩm
          this.loadRelatedProducts();
          // Load wishlist status
          this.loadWishlistStatus();
          // Load comments
          this.loadComments();
          // Load available coupons
          this.loadAvailableCoupons();
        },
        error: (err: any) => {
          console.error('Lỗi khi lấy chi tiết sản phẩm:', err);
        },
      });
    }
  }

  private loadWishlistStatus(): void {
    if (!this.product) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    this.wishlistService.isInWishlist(this.product._id).subscribe({
      next: (isInWishlist) => {
        this.wishlistCache.set(this.product!._id, isInWishlist);
      },
      error: (err) => {
        console.error('Error loading wishlist status:', err);
      }
    });
  }

  selectImage(image: string): void {
    this.selectedImage = image;
  }

  selectVariant(variant: Variant): void {
    this.selectedVariant = variant;
    if (this.product) {
      this.product = { ...this.product, selectedVariant: variant };
    }
    this.quantity = 1;
  }

  isSaleProduct(): boolean {
    if (this.selectedVariant) {
      return (
        this.selectedVariant.salePrice != null &&
        this.selectedVariant.salePrice < this.selectedVariant.price
      );
    }
    if (this.product) {
      // Nếu có biến thể, kiểm tra xem có biến thể nào có giảm giá không (đồng nhất với trang chủ)
      if (this.product.variants && this.product.variants.length > 0) {
        return this.product.variants.some(v => v.salePrice && v.salePrice < v.price);
      }
      return (
        this.product.salePrice != null &&
        this.product.salePrice < this.product.price
      );
    }
    return false;
  }

  calculateDiscountPercentage(): number {
    if (this.selectedVariant) {
      if (
        !this.selectedVariant.salePrice ||
        this.selectedVariant.salePrice >= this.selectedVariant.price
      ) {
        return 0;
      }
      return Math.round(
        ((this.selectedVariant.price - this.selectedVariant.salePrice) /
          this.selectedVariant.price) * 100
      );
    }
    if (this.product) {
      // Nếu có biến thể, tìm % giảm giá cao nhất (đồng nhất với trang chủ)
      if (this.product.variants && this.product.variants.length > 0) {
        const maxDiscount = Math.max(...this.product.variants.map(v => {
          if (!v.salePrice || v.salePrice >= v.price) return 0;
          return Math.round(((v.price - v.salePrice) / v.price) * 100);
        }));
        return maxDiscount;
      }
      if (!this.product.salePrice || this.product.salePrice >= this.product.price) {
        return 0;
      }
      return Math.round(
        ((this.product.price - this.product.salePrice) / this.product.price) * 100
      );
    }
    return 0;
  }

  calculateVariantDiscount(variant: Variant): number {
    if (!variant.salePrice || variant.salePrice >= variant.price) {
      return 0;
    }
    return Math.round(((variant.price - variant.salePrice) / variant.price) * 100);
  }

  increaseQuantity(): void {
    if (this.quantity < this.getCurrentStock()) {
      this.quantity++;
    }
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart(): void {
    if (!this.product) return;

    const productToAdd: ProductInterface = { ...this.product };
    if (this.selectedVariant) {
      productToAdd.selectedVariant = this.selectedVariant;
    }

    this.cartService.addToCartWithQuantity(productToAdd, this.quantity);
    Swal.fire({
      title: 'Thành công',
      text: `Đã thêm ${this.quantity} sản phẩm vào giỏ hàng`,
      icon: 'success',
      confirmButtonText: 'OK'
    });
  }

  buyNow(): void {
    if (!this.product) return;

    const productToAdd: ProductInterface = { ...this.product };
    if (this.selectedVariant) {
      productToAdd.selectedVariant = this.selectedVariant;
    }

    this.cartService.addToCartWithQuantity(productToAdd, this.quantity);
    this.router.navigate(['/checkout']);
  }

  getCurrentPrice(): number {
    if (this.selectedVariant) {
      return this.selectedVariant.salePrice || this.selectedVariant.price;
    }
    if (this.product) {
      if (this.product.variants && this.product.variants.length > 0) {
        const minPrice = Math.min(...this.product.variants.map(v => v.salePrice || v.price));
        return minPrice;
      }
      return this.product.salePrice || this.product.price;
    }
    return 0;
  }

  getOriginalPrice(): number {
    if (this.selectedVariant) {
      return this.selectedVariant.price;
    }
    if (this.product) {
      if (this.product.variants && this.product.variants.length > 0) {
        const minOriginalPrice = Math.min(...this.product.variants.map(v => v.price));
        return minOriginalPrice;
      }
      return this.product.price;
    }
    return 0;
  }

  isVariantInStock(variant: Variant): boolean {
    return variant.stock > 0;
  }

  getCurrentStock(): number {
    if (this.selectedVariant) {
      return this.selectedVariant.stock;
    }
    if (this.product) {
      if (this.product.variants && this.product.variants.length > 0) {
        return Math.max(...this.product.variants.map(v => v.stock));
      }
      return this.product.stock || 0;
    }
    return 0;
  }

  loadRelatedProducts(): void {
    if (!this.product) return;

    this.productService.getAllProducts().subscribe({
      next: (products: ProductInterface[]) => {
        // Lọc sản phẩm cùng danh mục, loại bỏ sản phẩm hiện tại và chỉ lấy sản phẩm còn hàng
        this.relatedProducts = products
          .filter((p: ProductInterface) => {
            if (p.categoryId !== this.product!.categoryId || p._id === this.product!._id) return false;
            // Nếu không có trường stock thì vẫn hiển thị
            if (typeof p.stock !== 'number' && !p.variants) return true;
            // Nếu có stock thì kiểm tra còn hàng
            if (typeof p.stock === 'number' && p.stock > 0) return true;
            // Nếu có variants thì kiểm tra từng variant
            if (p.variants && Array.isArray(p.variants)) {
              return p.variants.some((v: any) => typeof v.stock !== 'number' || v.stock > 0);
            }
            return false;
          })
          .slice(0, 4); // Chỉ lấy 4 sản phẩm liên quan
      },
      error: (err: any) => {
        console.error('Error loading related products:', err);
      }
    });
  }

  goToProduct(id: string): void {
    this.router.navigate(['/chitiet', id]);
  }

  // Lấy giá hiện tại của sản phẩm liên quan
  getRelatedProductPrice(product: ProductInterface): number {
    if (product.variants && product.variants.length > 0) {
      const minPrice = Math.min(...product.variants.map(v => v.salePrice || v.price));
      return minPrice;
    }
    return product.salePrice || product.price;
  }

  // Lấy giá gốc của sản phẩm liên quan
  getRelatedProductOriginalPrice(product: ProductInterface): number {
    if (product.variants && product.variants.length > 0) {
      const minOriginalPrice = Math.min(...product.variants.map(v => v.price));
      return minOriginalPrice;
    }
    return product.price;
  }

  // Kiểm tra sản phẩm liên quan có giảm giá không
  isRelatedProductOnSale(product: ProductInterface): boolean {
    if (product.variants && product.variants.length > 0) {
      return product.variants.some(v => v.salePrice && v.salePrice < v.price);
    }
    return product.salePrice != null && product.salePrice < product.price;
  }

  // Xử lý lỗi ảnh
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.style.display = 'none';
    }
  }

  // Wishlist methods
  toggleFavorite(): void {
    if (!this.product) return;

    const token = localStorage.getItem('token');
    if (!token) {
      Swal.fire({
        title: 'Thông báo',
        text: 'Vui lòng đăng nhập để sử dụng tính năng yêu thích',
        icon: 'info',
        confirmButtonText: 'OK'
      });
      return;
    }

    const isCurrentlyInWishlist = this.wishlistCache.get(this.product._id) || false;

    if (isCurrentlyInWishlist) {
      // Xóa khỏi wishlist
      this.wishlistService.removeFromWishlist(this.product._id).subscribe({
        next: (response) => {
          if (response.success) {
            this.wishlistCache.set(this.product!._id, false);
            Swal.fire({
              title: 'Thành công',
              text: 'Đã xóa khỏi danh sách yêu thích',
              icon: 'success',
              confirmButtonText: 'OK'
            });
          } else {
            Swal.fire({
              title: 'Lỗi',
              text: response.message || 'Lỗi khi xóa khỏi danh sách yêu thích',
              icon: 'error',
              confirmButtonText: 'OK'
            });
          }
        },
        error: (err) => {
          console.error('Error removing from wishlist:', err);
          // Check if token is expired
          if (err.status === 401 || err.status === 403) {
            Swal.fire({
              title: 'Phiên đăng nhập hết hạn',
              text: 'Vui lòng đăng nhập lại',
              icon: 'warning',
              confirmButtonText: 'OK'
            });
            // Clear token and redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            this.router.navigate(['/dangnhap']);
          } else {
            Swal.fire({
              title: 'Lỗi',
              text: 'Lỗi khi xóa khỏi danh sách yêu thích',
              icon: 'error',
              confirmButtonText: 'OK'
            });
          }
        }
      });
    } else {
      // Thêm vào wishlist
      this.wishlistService.addToWishlist(this.product._id).subscribe({
        next: (response) => {
          if (response.success) {
            this.wishlistCache.set(this.product!._id, true);
            Swal.fire({
              title: 'Thành công',
              text: 'Đã thêm vào danh sách yêu thích',
              icon: 'success',
              confirmButtonText: 'OK'
            });
          } else {
            Swal.fire({
              title: 'Lỗi',
              text: response.message || 'Lỗi khi thêm vào danh sách yêu thích',
              icon: 'error',
              confirmButtonText: 'OK'
            });
          }
        },
        error: (err) => {
          console.error('Error adding to wishlist:', err);
          // Check if token is expired
          if (err.status === 401 || err.status === 403) {
            Swal.fire({
              title: 'Phiên đăng nhập hết hạn',
              text: 'Vui lòng đăng nhập lại',
              icon: 'warning',
              confirmButtonText: 'OK'
            });
            // Clear token and redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            this.router.navigate(['/dangnhap']);
          } else {
            Swal.fire({
              title: 'Lỗi',
              text: 'Lỗi khi thêm vào danh sách yêu thích',
              icon: 'error',
              confirmButtonText: 'OK'
            });
          }
        }
      });
    }
  }

  isFavorite(): boolean {
    if (!this.product) return false;
    return this.wishlistCache.get(this.product._id) || false;
  }

  // Comment methods
  loadComments(): void {
    if (this.product?._id) {
      this.commentService.getCommentsByProduct(this.product._id).subscribe({
        next: (response) => {
          if (response.success) {
            this.comments = response.data.filter(comment => comment.status === 'approved');
            this.calculateAverageRating();
          }
        },
        error: (err) => {
          console.error('Lỗi khi tải bình luận:', err);
        }
      });
    }
  }

  calculateAverageRating(): void {
    if (this.comments.length > 0) {
      const totalRating = this.comments.reduce((sum, comment) => sum + comment.rating, 0);
      this.averageRating = totalRating / this.comments.length;
    } else {
      this.averageRating = 0;
    }
  }

  setRating(rating: number): void {
    this.newComment.rating = rating;
  }

  getRatingText(rating: number): string {
    const ratingTexts = {
      1: 'Rất tệ',
      2: 'Tệ', 
      3: 'Bình thường',
      4: 'Tốt',
      5: 'Rất tốt'
    };
    return ratingTexts[rating as keyof typeof ratingTexts] || '';
  }

  submitComment(): void {
    if (!this.product?._id) return;

    this.isSubmitting = true;
    const commentData = {
      productId: this.product._id,
      userName: this.newComment.userName,
      userEmail: this.newComment.userEmail,
      rating: this.newComment.rating,
      content: this.newComment.content
    };

    this.commentService.createComment(commentData).subscribe({
      next: (response) => {
        if (response.success) {
          Swal.fire({
            title: 'Thành công!',
            text: 'Đánh giá của bạn đã được gửi và đang chờ duyệt',
            icon: 'success',
            confirmButtonText: 'OK'
          });
          // Reset form
          this.newComment = {
            userName: '',
            userEmail: '',
            rating: 0,
            content: ''
          };
        }
      },
      error: (err) => {
        console.error('Lỗi khi gửi bình luận:', err);
        Swal.fire({
          title: 'Lỗi!',
          text: 'Có lỗi xảy ra khi gửi đánh giá',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  getRatingCount(rating: number): number {
    return this.comments.filter(comment => comment.rating === rating).length;
  }

  getRatingPercentage(rating: number): number {
    if (this.comments.length === 0) return 0;
    return (this.getRatingCount(rating) / this.comments.length) * 100;
  }

  setCommentFilter(filter: string | number): void {
    this.commentFilter = filter;
  }

  getFilteredComments(): Comment[] {
    if (this.commentFilter === 'all') {
      return this.comments;
    }
    return this.comments.filter(comment => comment.rating === this.commentFilter);
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Coupon methods
  loadAvailableCoupons(): void {
    // Mock data - trong thực tế sẽ gọi API để lấy mã giảm giá có sẵn
    this.availableCoupons = [
      {
        id: '1',
        code: 'WELCOME10',
        name: 'Chào mừng khách hàng mới',
        description: 'Giảm 10% cho đơn hàng đầu tiên',
        discountType: 'percentage',
        discountValue: 10,
        minOrderValue: 500000,
        expiryDate: '2024-12-31',
        isActive: true
      },
      {
        id: '2',
        code: 'SAVE50K',
        name: 'Tiết kiệm 50K',
        description: 'Giảm 50,000đ cho đơn hàng từ 1,000,000đ',
        discountType: 'fixed',
        discountValue: 50000,
        minOrderValue: 1000000,
        expiryDate: '2024-11-30',
        isActive: true
      },
      {
        id: '3',
        code: 'FREESHIP',
        name: 'Miễn phí vận chuyển',
        description: 'Miễn phí ship cho đơn hàng từ 300,000đ',
        discountType: 'shipping',
        discountValue: 0,
        minOrderValue: 300000,
        expiryDate: '2024-12-15',
        isActive: true
      }
    ];
  }

  applyCoupon(): void {
    if (!this.couponCode.trim()) {
      this.couponError = 'Vui lòng nhập mã giảm giá';
      return;
    }

    this.isApplyingCoupon = true;
    this.couponError = '';

    // Simulate API call
    setTimeout(() => {
      const coupon = this.availableCoupons.find(c => 
        c.code.toLowerCase() === this.couponCode.toLowerCase() && c.isActive
      );

      if (coupon) {
        // Check minimum order value
        const currentPrice = this.getCurrentPrice();
        if (currentPrice < coupon.minOrderValue) {
          this.couponError = `Đơn hàng tối thiểu ${coupon.minOrderValue.toLocaleString('vi-VN')}đ để áp dụng mã này`;
        } else {
          this.appliedCoupon = coupon;
          this.couponCode = '';
          this.couponError = '';
          Swal.fire({
            title: 'Thành công!',
            text: `Đã áp dụng mã giảm giá ${coupon.name}`,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
        }
      } else {
        this.couponError = 'Mã giảm giá không hợp lệ hoặc đã hết hạn';
      }
      
      this.isApplyingCoupon = false;
    }, 1000);
  }

  removeCoupon(): void {
    this.appliedCoupon = null;
    this.couponError = '';
    Swal.fire({
      title: 'Đã xóa mã giảm giá',
      icon: 'info',
      timer: 1500,
      showConfirmButton: false
    });
  }

  selectCoupon(code: string): void {
    this.couponCode = code;
    this.applyCoupon();
  }

  formatDiscount(coupon: any): string {
    if (coupon.discountType === 'percentage') {
      return `${coupon.discountValue}%`;
    } else if (coupon.discountType === 'fixed') {
      return `${coupon.discountValue.toLocaleString('vi-VN')}đ`;
    } else if (coupon.discountType === 'shipping') {
      return 'Miễn phí ship';
    }
    return '';
  }

  getDiscountAmount(): number {
    if (!this.appliedCoupon) return 0;
    
    const currentPrice = this.getCurrentPrice();
    
    if (this.appliedCoupon.discountType === 'percentage') {
      return (currentPrice * this.appliedCoupon.discountValue) / 100;
    } else if (this.appliedCoupon.discountType === 'fixed') {
      return Math.min(this.appliedCoupon.discountValue, currentPrice);
    }
    
    return 0;
  }

  getFinalPrice(): number {
    const originalPrice = this.getCurrentPrice();
    const discountAmount = this.getDiscountAmount();
    return Math.max(0, originalPrice - discountAmount);
  }
}
