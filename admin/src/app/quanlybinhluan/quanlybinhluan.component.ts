import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CommentService } from '../services/comment.service';
import { Comment, CommentStats, CommentFilters, ApiResponse } from '../interfaces/comment.interface';
import Swal from 'sweetalert2';
import { ProductService, Product } from '../services/product.service';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-quanlybinhluan',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule, NgSelectModule],
  templateUrl: './quanlybinhluan.component.html',
  styleUrls: ['./quanlybinhluan.component.css'],
})
export class QuanlybinhluanComponent implements OnInit, AfterViewInit {
  comments: Comment[] = [];
  filteredComments: Comment[] = [];
  userAvatar: string = '/assets/images/icon.png';
  errorMessage: string | undefined;
  searchQuery: string = '';

  // Phân trang
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;

  // Lọc và sắp xếp
  statusFilter: string = 'all';
  ratingFilter: number = 0;
  sortBy: string = 'createdAt';
  sortOrder: 'asc' | 'desc' = 'desc';
  productFilter: string = 'all';
  productFilterOptions: { value: string, label: string }[] = [
    { value: 'all', label: 'Tất cả' },
    { value: 'homepage', label: 'Trang chủ' }
  ];

  // Thống kê
  commentStats: CommentStats = {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    stats: []
  };

  // Loading state
  isLoading: boolean = false;

  // Modal states
  showReplyModal: boolean = false;
  showEditModal: boolean = false;
  selectedComment: Comment | null = null;
  replyContent: string = '';
  editContent: string = '';
  editRating: number = 5;

  // Bulk actions
  selectedComments: string[] = [];
  selectAll: boolean = false;

  constructor(
    private commentService: CommentService,
    private router: Router,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      this.errorMessage = 'Vui lòng đăng nhập.';
      Swal.fire('Lỗi', this.errorMessage, 'error');
      console.log('No token found, redirecting to login');
      this.router.navigate(['/login']);
      return;
    }
    this.loadComments();
    this.loadCommentStats();
    this.loadUserAvatar();
    this.loadProductFilterOptions();
  }

  loadProductFilterOptions(): void {
    this.productService.getProducts().subscribe({
      next: (products: Product[]) => {
        const productOptions = products.map(p => ({ value: p._id!, label: p.name }));
        this.productFilterOptions = [
          { value: 'all', label: 'Tất cả' },
          { value: 'homepage', label: 'Trang chủ' },
          ...productOptions
        ];
      },
      error: () => {
        // Nếu lỗi, giữ lại 2 option mặc định
      }
    });
  }

  ngAfterViewInit(): void {
    document.querySelectorAll('.icon').forEach((ico) => {
      const name = ico.classList[1]?.split('-')[1] || '';
      if (name) {
        ico.innerHTML = `<svg width="20" height="20"><use xlink:href="#${ico.classList[1]}" /></svg>`;
      }
    });
  }

  loadComments(): void {
  this.isLoading = true;
  console.log('Loading comments');

  const filters: CommentFilters = {};
  if (this.statusFilter !== 'all') {
    filters.status = this.statusFilter as Comment['status'];
  }
  if (this.ratingFilter > 0) {
    filters.rating = this.ratingFilter;
  }
  if (this.productFilter !== 'all') {
    filters.productId = this.productFilter;
  }

  this.commentService.getComments(filters).subscribe({
    next: (response: ApiResponse<Comment[]>) => {
      if (response.success) {
        // Đảm bảo productId có giá trị hợp lệ
        this.comments = (response.data || []).map(comment => ({
          ...comment,
          productId: comment.productId || { _id: 'unknown', name: 'Không xác định' }
        }));
        this.applyFiltersAndSort();
        this.errorMessage = undefined;
        console.log('Comments loaded:', this.comments);
      } else {
        this.errorMessage = response.message || 'Lỗi khi lấy danh sách bình luận.';
        Swal.fire('Lỗi', this.errorMessage, 'error');
        console.log('Error response from getComments:', response.message);
      }
      this.isLoading = false;
    },
    error: (err) => {
      console.error('Error loading comments:', err);
      this.errorMessage =
        err.status === 401 || err.status === 403
          ? 'Không có quyền truy cập. Vui lòng đăng nhập lại.'
          : err.error?.message || err.message || 'Lỗi khi lấy danh sách bình luận';
      Swal.fire('Lỗi', this.errorMessage, 'error');
      if (err.status === 401 || err.status === 403) {
        localStorage.removeItem('adminToken');
        this.router.navigate(['/login']);
      }
      this.isLoading = false;
    },
  });
  }

  loadCommentStats(): void {
    this.commentService.getCommentStats().subscribe({
      next: (response: ApiResponse<CommentStats>) => {
        if (response.success) {
          this.commentStats = response.data;
          console.log('Comment stats loaded:', this.commentStats);
        } else {
          console.log('Error loading comment stats:', response.message);
        }
      },
      error: (err) => {
        console.error('Error loading comment stats:', err);
      },
    });
  }

  applyFiltersAndSort(): void {
    let filtered = [...this.comments];

    // Lọc theo sản phẩm
    if (this.productFilter !== 'all') {
      filtered = filtered.filter(comment => comment.productId && comment.productId._id === this.productFilter);
    }

    // Lọc theo từ khóa tìm kiếm
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter((comment) => {
        const userName = comment.userName?.toLowerCase() || '';
        const userEmail = comment.userEmail?.toLowerCase() || '';
        const content = comment.content?.toLowerCase() || '';
        const productName = comment.productId?.name?.toLowerCase() || '';
        const status = comment.status?.toLowerCase() || '';
        return userName.includes(query) ||
               userEmail.includes(query) ||
               content.includes(query) ||
               productName.includes(query) ||
               status.includes(query);
      });
    }

    // Lọc theo trạng thái
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(comment => comment.status === this.statusFilter);
    }

    // Lọc theo rating
    if (this.ratingFilter > 0) {
      filtered = filtered.filter(comment => comment.rating === this.ratingFilter);
    }

    // Sắp xếp
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (this.sortBy) {
        case 'userName':
          aValue = a.userName || '';
          bValue = b.userName || '';
          break;
        case 'rating':
          aValue = a.rating || 0;
          bValue = b.rating || 0;
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'productName':
          aValue = a.productId?.name || '';
          bValue = b.productId?.name || '';
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt || '').getTime();
          bValue = new Date(b.createdAt || '').getTime();
          break;
      }

      if (this.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    this.filteredComments = filtered;
    this.calculatePagination();
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredComments.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  get paginatedComments(): Comment[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredComments.slice(startIndex, endIndex);
  }

  search(): void {
    this.currentPage = 1;
    this.applyFiltersAndSort();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadComments();
  }

  onSortChange(): void {
    this.applyFiltersAndSort();
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;

    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, this.currentPage - 2);
      const end = Math.min(this.totalPages, start + maxVisiblePages - 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    return pages;
  }

  // Helper method for template
  getEndIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.filteredComments.length);
  }

  // Bulk selection methods
  toggleSelectAll(): void {
    if (this.selectAll) {
      this.selectedComments = this.paginatedComments.map(comment => comment._id!);
    } else {
      this.selectedComments = [];
    }
  }

  toggleCommentSelection(commentId: string): void {
    const index = this.selectedComments.indexOf(commentId);
    if (index > -1) {
      this.selectedComments.splice(index, 1);
    } else {
      this.selectedComments.push(commentId);
    }
    this.updateSelectAllState();
  }

  updateSelectAllState(): void {
    this.selectAll = this.selectedComments.length === this.paginatedComments.length;
  }

  // Status management
  updateCommentStatus(commentId: string, status: Comment['status']): void {
    Swal.fire({
      title: 'Xác nhận',
      text: `Bạn có chắc muốn cập nhật trạng thái thành "${this.getStatusText(status)}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Xác nhận',
      cancelButtonText: 'Hủy',
    }).then((result) => {
      if (result.isConfirmed) {
        console.log('Updating status for comment:', commentId, 'to', status);
        this.commentService.updateCommentStatus(commentId, status).subscribe({
          next: (response: ApiResponse<Comment>) => {
            if (response.success) {
              this.loadComments();
              this.loadCommentStats();
              this.errorMessage = undefined;
              Swal.fire('Thành công', 'Cập nhật trạng thái thành công', 'success');
              console.log('Comment status updated:', response.data);
            } else {
              this.errorMessage = response.message || 'Lỗi khi cập nhật trạng thái.';
              Swal.fire('Lỗi', this.errorMessage, 'error');
              console.log('Update status failed:', response.message);
            }
          },
          error: (err) => {
            console.error('Error updating comment status:', err);
            this.errorMessage = err.error?.message || err.message || 'Lỗi khi cập nhật trạng thái';
            Swal.fire('Lỗi', this.errorMessage, 'error');
          },
        });
      }
    });
  }

  // Bulk status update
  bulkUpdateStatus(status: Comment['status']): void {
    if (this.selectedComments.length === 0) {
      Swal.fire('Cảnh báo', 'Vui lòng chọn ít nhất một bình luận.', 'warning');
      return;
    }

    Swal.fire({
      title: 'Xác nhận',
      text: `Bạn có chắc muốn cập nhật trạng thái ${this.selectedComments.length} bình luận thành "${this.getStatusText(status)}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Xác nhận',
      cancelButtonText: 'Hủy',
    }).then((result) => {
      if (result.isConfirmed) {
        this.commentService.bulkUpdateStatus(this.selectedComments, status).subscribe({
          next: (response: ApiResponse<any>) => {
            if (response.success) {
              this.loadComments();
              this.loadCommentStats();
              this.selectedComments = [];
              this.selectAll = false;
              Swal.fire('Thành công', 'Cập nhật trạng thái thành công', 'success');
            } else {
              this.errorMessage = response.message || 'Lỗi khi cập nhật trạng thái.';
              Swal.fire('Lỗi', this.errorMessage, 'error');
            }
          },
          error: (err) => {
            console.error('Error bulk updating status:', err);
            this.errorMessage = err.error?.message || err.message || 'Lỗi khi cập nhật trạng thái';
            Swal.fire('Lỗi', this.errorMessage, 'error');
          },
        });
      }
    });
  }

  // Reply to comment
  openReplyModal(comment: Comment): void {
    this.selectedComment = comment;
    this.replyContent = '';
    this.showReplyModal = true;
  }

  submitReply(): void {
    if (!this.selectedComment || !this.replyContent.trim()) {
      Swal.fire('Cảnh báo', 'Vui lòng nhập nội dung trả lời.', 'warning');
      return;
    }

    this.commentService.replyToComment(this.selectedComment._id!, this.replyContent.trim()).subscribe({
      next: (response: ApiResponse<Comment>) => {
        if (response.success) {
          this.loadComments();
          this.showReplyModal = false;
          this.selectedComment = null;
          this.replyContent = '';
          Swal.fire('Thành công', 'Trả lời bình luận thành công', 'success');
        } else {
          this.errorMessage = response.message || 'Lỗi khi trả lời bình luận.';
          Swal.fire('Lỗi', this.errorMessage, 'error');
        }
      },
      error: (err) => {
        console.error('Error replying to comment:', err);
        this.errorMessage = err.error?.message || err.message || 'Lỗi khi trả lời bình luận';
        Swal.fire('Lỗi', this.errorMessage, 'error');
      },
    });
  }

  // Edit comment
  openEditModal(comment: Comment): void {
    this.selectedComment = comment;
    this.editContent = comment.content;
    this.editRating = comment.rating;
    this.showEditModal = true;
  }

  submitEdit(): void {
    if (!this.selectedComment || !this.editContent.trim()) {
      Swal.fire('Cảnh báo', 'Vui lòng nhập nội dung bình luận.', 'warning');
      return;
    }

    const updateData = {
      content: this.editContent.trim(),
      rating: this.editRating
    };

    this.commentService.editComment(this.selectedComment._id!, updateData).subscribe({
      next: (response: ApiResponse<Comment>) => {
        if (response.success) {
          this.loadComments();
          this.showEditModal = false;
          this.selectedComment = null;
          this.editContent = '';
          this.editRating = 5;
          Swal.fire('Thành công', 'Chỉnh sửa bình luận thành công', 'success');
        } else {
          this.errorMessage = response.message || 'Lỗi khi chỉnh sửa bình luận.';
          Swal.fire('Lỗi', this.errorMessage, 'error');
        }
      },
      error: (err) => {
        console.error('Error editing comment:', err);
        this.errorMessage = err.error?.message || err.message || 'Lỗi khi chỉnh sửa bình luận';
        Swal.fire('Lỗi', this.errorMessage, 'error');
      },
    });
  }

  // Delete comment
  deleteComment(commentId: string): void {
    Swal.fire({
      title: 'Xác nhận xóa',
      text: 'Bạn có chắc muốn xóa bình luận này? Hành động này không thể hoàn tác.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#d33',
    }).then((result) => {
      if (result.isConfirmed) {
        this.commentService.deleteComment(commentId).subscribe({
          next: (response: ApiResponse<Comment>) => {
            if (response.success) {
              this.loadComments();
              this.loadCommentStats();
              Swal.fire('Thành công', 'Xóa bình luận thành công', 'success');
            } else {
              this.errorMessage = response.message || 'Lỗi khi xóa bình luận.';
              Swal.fire('Lỗi', this.errorMessage, 'error');
            }
          },
          error: (err) => {
            console.error('Error deleting comment:', err);
            this.errorMessage = err.error?.message || err.message || 'Lỗi khi xóa bình luận';
            Swal.fire('Lỗi', this.errorMessage, 'error');
          },
        });
      }
    });
  }

  // Helper methods
  getStatusText(status: string): string {
    switch (status) {
      case 'pending': return 'Chờ duyệt';
      case 'approved': return 'Đã duyệt';
      case 'rejected': return 'Từ chối';
      default: return status;
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'approved': return '#4caf50';
      case 'rejected': return '#f44336';
      default: return '#757575';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'pending': return 'badge-warning';
      case 'approved': return 'badge-success';
      case 'rejected': return 'badge-danger';
      default: return 'badge-secondary';
    }
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getRatingStars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  loadUserAvatar(): void {
    const avatar = localStorage.getItem('userAvatar') || '/assets/images/icon.png';
    this.userAvatar = avatar;
    console.log('User avatar loaded:', this.userAvatar);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userAvatar');
    console.log('Logging out');
    Swal.fire('Thành công', 'Đăng xuất thành công', 'success');
    this.router.navigate(['/login']);
  }

  closeModal(): void {
    this.showReplyModal = false;
    this.showEditModal = false;
    this.selectedComment = null;
    this.replyContent = '';
    this.editContent = '';
    this.editRating = 5;
  }
}
