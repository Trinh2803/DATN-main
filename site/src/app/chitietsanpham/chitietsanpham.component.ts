import { Component, OnInit, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
import { DiscountService, Discount } from '../discount.service';
import { forkJoin } from 'rxjs';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  selector: 'app-chitietsanpham',
  templateUrl: './chitietsanpham.component.html',
  styleUrls: ['./chitietsanpham.component.css'],
})
export class ChiTietSanPhamComponent implements OnInit {
  @ViewChild('commentsSection', { static: false }) commentsSection!: ElementRef;
  product: ProductInterface | null = null;
  selectedVariant: Variant | null = null;
  quantity: number = 1;
  selectedImage: string | null = null;
  relatedProducts: ProductInterface[] = [];
  private wishlistCache = new Map<string, boolean>();

  hasBought: boolean = false;

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

  couponCode: string = '';
  appliedCoupon: any = null;
  availableCoupons: any[] = [];
  couponError: string = '';
  isApplyingCoupon: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private commentService: CommentService,
    private discountService: DiscountService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
  this.route.paramMap.subscribe(params => {
    const productId = params.get('id');
    if (productId) {
      this.product = null;
      this.relatedProducts = [];
      
      // Gọi các API cần thiết đồng thời
      forkJoin({
        product: this.productService.getProductById(productId),
        hasBought: this.http.get<{ success: boolean, bought: boolean }>(
          `http://localhost:3000/api/orders/has-bought/${productId}`,
          { headers: new HttpHeaders({ 'Authorization': `Bearer ${localStorage.getItem('token')}` }) }
        )
      }).subscribe({
        next: ({ product, hasBought }) => {
          this.product = product;
          this.selectedVariant = product.selectedVariant || null;
          this.selectedImage = product.thumbnail;
          this.hasBought = !!hasBought.bought; // Cập nhật hasBought
          this.loadRelatedProducts();
          this.loadWishlistStatus();
          this.loadComments();
          this.loadAvailableCoupons();

          // Kiểm tra query parameter để cuộn đến phần đánh giá
          this.route.queryParams.subscribe(queryParams => {
            if (queryParams['review'] === 'true') {
              this.scrollToComments();
            }
          });
        },
        error: (err: any) => {
          this.router.navigate(['/sanpham']);
        }
      });
    } else {
      this.router.navigate(['/sanpham']);
    }
  });
}
  scrollToComments(): void {
    setTimeout(() => {
      if (this.commentsSection && this.hasBought) {
        this.commentsSection.nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      } else if (!this.hasBought) {
        Swal.fire({
          title: 'Thông báo',
          text: 'Bạn cần mua sản phẩm này để có thể đánh giá!',
          icon: 'info',
          confirmButtonText: 'OK',
        });
      }
    }, 100); // Delay để đảm bảo DOM đã sẵn sàng
  }

  checkHasBought(productId: string) {
    const token = localStorage.getItem('token');
    if (!token) {
      this.hasBought = false;
      return;
    }
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    this.http.get<{ success: boolean, bought: boolean }>(
      `http://localhost:3000/api/orders/has-bought/${productId}`,
      { headers }
    ).subscribe({
      next: (res) => {
        this.hasBought = !!res.bought;
      },
      error: () => {
        this.hasBought = false;
      }
    });
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

    this.cartService.addToCartWithQuantity(productToAdd, this.quantity, this.appliedCoupon || undefined);
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

    this.cartService.addToCartWithQuantity(productToAdd, this.quantity, this.appliedCoupon || undefined);
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
        this.relatedProducts = products
          .filter((p: ProductInterface) => {
            if (p.categoryId !== this.product!.categoryId || p._id === this.product!._id) return false;
            if (typeof p.stock !== 'number' && !p.variants) return true;
            if (typeof p.stock === 'number' && p.stock > 0) return true;
            if (p.variants && Array.isArray(p.variants)) {
              return p.variants.some((v: any) => typeof v.stock !== 'number' || v.stock > 0);
            }
            return false;
          })
          .slice(0, 4);
      },
      error: (err: any) => {
        console.error('Error loading related products:', err);
      }
    });
  }

  goToProduct(id: string): void {
    console.log('Navigating to product with ID:', id);
    this.router.navigate(['/chitiet', id]);
  }

  getRelatedProductPrice(product: ProductInterface): number {
    if (product.variants && product.variants.length > 0) {
      const minPrice = Math.min(...product.variants.map(v => v.salePrice || v.price));
      return minPrice;
    }
    return product.salePrice || product.price;
  }

  getRelatedProductOriginalPrice(product: ProductInterface): number {
    if (product.variants && product.variants.length > 0) {
      const minOriginalPrice = Math.min(...product.variants.map(v => v.price));
      return minOriginalPrice;
    }
    return product.price;
  }

  isRelatedProductOnSale(product: ProductInterface): boolean {
    if (product.variants && product.variants.length > 0) {
      return product.variants.some(v => v.salePrice && v.salePrice < v.price);
    }
    return product.salePrice != null && product.salePrice < product.price;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.style.display = 'none';
    }
  }

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
          if (err.status === 401 || err.status === 403) {
            Swal.fire({
              title: 'Phiên đăng nhập hết hạn',
              text: 'Vui lòng đăng nhập lại',
              icon: 'warning',
              confirmButtonText: 'OK'
            });
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
          if (err.status === 401 || err.status === 403) {
            Swal.fire({
              title: 'Phiên đăng nhập hết hạn',
              text: 'Vui lòng đăng nhập lại',
              icon: 'warning',
              confirmButtonText: 'OK'
            });
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

  loadAvailableCoupons(): void {
    if (!this.product) {
      this.availableCoupons = [];
      return;
    }
    const productId = this.product._id;
    const categoryId = this.product.categoryId?._id;
    this.discountService.getApplicable(productId, categoryId).subscribe({
      next: (res: { success: boolean; data: Discount[] }) => {
        this.availableCoupons = res.data || [];
      },
      error: (err: any) => {
        console.error('Không tải được danh sách mã giảm giá:', err);
        this.availableCoupons = [];
      }
    });
  }

  applyCoupon(): void {
    if (!this.couponCode.trim()) {
      this.couponError = 'Vui lòng nhập mã giảm giá';
      return;
    }

    if (this.appliedCoupon) {
      this.couponError = 'Mỗi đơn hàng chỉ được áp dụng một mã giảm giá';
      return;
    }

    this.isApplyingCoupon = true;
    this.couponError = '';

    const totalAmount = this.getCurrentPrice();
    const productIds = this.product ? [this.product._id] : [];

    console.log('Checking discount code:', this.couponCode.trim(), 'for amount:', totalAmount);

    this.discountService.checkDiscountCode(this.couponCode.trim(), totalAmount, productIds).subscribe({
      next: (response: { success: boolean; discount: any, message?: string }) => {
        console.log('Discount check response:', response);

        if (response && response.success && response.discount) {
          const discount = response.discount;

          if (!discount.isActive) {
            this.couponError = 'Mã giảm giá này đã bị vô hiệu hóa';
            this.isApplyingCoupon = false;
            return;
          }

          if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
            this.couponError = 'Mã giảm giá đã hết lượt sử dụng';
            this.isApplyingCoupon = false;
            return;
          }

          const now = new Date();
          const startDate = new Date(discount.startDate);
          const endDate = new Date(discount.endDate);

          if (now < startDate) {
            this.couponError = 'Mã giảm giá chưa đến thời gian áp dụng';
            this.isApplyingCoupon = false;
            return;
          }

          if (now > endDate) {
            this.couponError = 'Mã giảm giá đã hết hạn';
            this.isApplyingCoupon = false;
            return;
          }

          if (discount.minOrderValue && totalAmount < discount.minOrderValue) {
            this.couponError = `Đơn hàng tối thiểu ${discount.minOrderValue.toLocaleString()}đ để áp dụng mã này`;
            this.isApplyingCoupon = false;
            return;
          }

          this.discountService.applyDiscount(discount._id, discount.code).subscribe({
            next: (applyResponse: any) => {
              if (applyResponse.success) {
                this.applyDiscountToProduct(discount);
              } else {
                this.couponError = applyResponse.message || 'Không thể áp dụng mã giảm giá';
                this.isApplyingCoupon = false;
              }
            },
            error: (err) => {
              console.error('Error applying discount:', err);
              this.couponError = err?.error?.message || 'Có lỗi khi áp dụng mã giảm giá';
              this.isApplyingCoupon = false;
            }
          });

        } else {
          this.couponError = response?.message || 'Mã giảm giá không hợp lệ hoặc không thể áp dụng cho sản phẩm này';
          this.isApplyingCoupon = false;
        }
      },
      error: (err: any) => {
        console.error('Error checking discount code:', err);
        this.couponError = err?.error?.message || 'Có lỗi xảy ra khi kiểm tra mã giảm giá';
        this.isApplyingCoupon = false;
      }
    });
  }

  private applyDiscountToProduct(discount: any): void {
    if (!this.product) {
      this.isApplyingCoupon = false;
      return;
    }

    this.appliedCoupon = { ...discount };
    this.couponCode = '';
    this.couponError = '';

    console.log('Applied discount:', this.appliedCoupon);
    console.log('Original price:', this.getCurrentPrice());
    console.log('Discounted price:', this.getFinalPrice());

    setTimeout(() => {
      this.cdr.detectChanges();
      console.log('Change detection triggered');
    });

    Swal.fire({
      title: 'Thành công!',
      text: `Đã áp dụng mã giảm giá ${discount.name} - Giảm ${discount.discountValue}${discount.discountType === 'percentage' ? '%' : 'đ'}`,
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    });

    this.isApplyingCoupon = false;
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
    if (!this.appliedCoupon || !this.selectedVariant) return 0;

    const price = this.selectedVariant.salePrice || this.selectedVariant.price;
    let discount = 0;

    console.log('Calculating discount for price:', price, 'with coupon:', this.appliedCoupon);

    if (this.appliedCoupon.discountType === 'percentage') {
      discount = price * (this.appliedCoupon.discountValue / 100);

      if (this.appliedCoupon.maxDiscount !== undefined && discount > this.appliedCoupon.maxDiscount) {
        console.log('Applying max discount limit:', this.appliedCoupon.maxDiscount);
        discount = this.appliedCoupon.maxDiscount;
      }
    } else {
      discount = this.appliedCoupon.discountValue;
    }

    const finalDiscount = Math.min(discount, price);
    console.log('Final discount amount:', finalDiscount);

    return finalDiscount;
  }

  getFinalPrice(): number {
    const price = this.getCurrentPrice();
    console.log('Calculating final price. Base price:', price);

    if (!this.appliedCoupon) {
      console.log('No discount applied, final price:', price);
      return price;
    }

    const discount = this.getDiscountAmount();
    const finalPrice = Math.max(0, price - discount);

    console.log('Final price after discount:', finalPrice, '(Discount:', discount, ')');
    return finalPrice;
  }
}