import { Component, OnInit, AfterViewInit, OnDestroy, NO_ERRORS_SCHEMA, ViewChild, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { OrderService } from '../services/order.service';
import { Router, RouterModule } from '@angular/router';
import { Order, ApiResponse } from '../interfaces/order-response.interface';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, registerLocaleData } from '@angular/common';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType, registerables } from 'chart.js';
import Swal from 'sweetalert2';
import localeVi from '@angular/common/locales/vi';
import { Subscription } from 'rxjs';

// Đăng ký locale tiếng Việt
registerLocaleData(localeVi);

@Component({
  selector: 'app-thongke',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    RouterModule, 
    FormsModule, 
    BaseChartDirective
  ],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './thongke.component.html',
  styleUrls: ['./thongke.component.css'],
  schemas: [NO_ERRORS_SCHEMA]
})
export class ThongkeComponent implements OnInit, AfterViewInit, OnDestroy {
  private subscriptions = new Subscription();

  pendingOrders: Order[] = [];
  completedOrders: Order[] = [];
  originalPendingOrders: Order[] = [];
  originalCompletedOrders: Order[] = [];
  searchQuery: string = '';
  userAvatar: string = '/assets/images/icon.png';
  errorMessage: string | null = null;
  
  // Chart properties
  @ViewChild(BaseChartDirective, { static: true }) chart?: BaseChartDirective;
  public lineChartType: ChartType = 'line';
  public lineChartOptions: ChartConfiguration['options'];
  public lineChartData: ChartData<'line'>;
  
  // Revenue properties
  granularity: 'day'|'month'|'quarter' = 'day';
  startDate?: string;
  endDate?: string;
  revenueSeries: any[] = [];
  totalRevenue: number = 0;
  prevTotalRevenue: number = 0;
  comparisonDelta: number = 0;

  constructor(
    private authService: AuthService,
    private orderService: OrderService,
    private router: Router
  ) {
    this.lineChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
            drawBorder: false
          },
          ticks: {
            color: '#64748b',
            font: {
              family: '"Inter", sans-serif',
              size: 12
            },
            callback: (value: string | number) => {
              return new Intl.NumberFormat('vi-VN', { 
                style: 'currency', 
                currency: 'VND',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(Number(value));
            }
          }
        },
        x: {
          grid: {
            display: false,
            drawBorder: false
          },
          ticks: {
            color: '#64748b',
            font: {
              family: '"Inter", sans-serif',
              size: 12
            }
          }
        }
      },
      plugins: {
        legend: { 
          display: true,
          position: 'top',
          labels: {
            color: '#334155',
            font: {
              family: '"Inter", sans-serif',
              size: 13,
              weight: '500'
            },
            padding: 20,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: 'rg(255, 255, 255, 0.95)',
          titleColor: '#1e293b',
          titleFont: {
            family: '"Inter", sans-serif',
            size: 13,
            weight: '600'
          },
          bodyColor: '#475569',
          bodyFont: {
            family: '"Inter", sans-serif',
            size: 12,
            weight: '500'
          },
          padding: 12,
          borderColor: '#e2e8f0',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
          usePointStyle: true,
          callbacks: {
            label: (context: any) => {
              let label = context.dataset?.label || '';
              if (label) label += ': ';
              if (context.parsed?.y !== null && context.parsed?.y !== undefined) {
                label += new Intl.NumberFormat('vi-VN', { 
                  style: 'currency', 
                  currency: 'VND',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(context.parsed.y);
              }
              return label;
            },
            labelPointStyle: () => {
              return {
                pointStyle: 'circle',
                rotation: 0
              };
            }
          }
        }
      },
      elements: {
        line: {
          tension: 0.4,
          borderWidth: 2
        },
        point: {
          radius: 4,
          hoverRadius: 6,
          hoverBorderWidth: 2
        }
      }
    };

    this.lineChartData = {
      labels: [],
      datasets: [
        {
          data: [],
          label: 'Doanh thu',
          backgroundColor: 'rgba(46, 108, 255, 0.1)',
          borderColor: '#2e6cff',
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#2e6cff',
          pointHoverBackgroundColor: '#2e6cff',
          pointHoverBorderColor: '#ffffff',
          borderWidth: 2,
          pointBorderWidth: 2,
          pointHoverBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.3
        }
      ]
    };
  }

  ngOnInit(): void {
    if (!this.authService.getToken() || !this.authService.isAdmin()) {
      this.errorMessage = 'Vui lòng đăng nhập với tài khoản admin để tiếp tục';
      Swal.fire('Lỗi', this.errorMessage, 'error');
      this.router.navigate(['/login']);
      return;
    }
    this.loadOrders();
    this.loadUserAvatar();
    this.loadRevenue();
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.unsubscribe();
  }

  private updateChartData(): void {
    if (!this.revenueSeries || this.revenueSeries.length === 0) {
      return;
    }

    const labels = this.revenueSeries.map(item => item.label);
    const data = this.revenueSeries.map(item => item.revenue);

    this.lineChartData.labels = labels;
    this.lineChartData.datasets[0].data = data;
    
    if (this.chart) {
      this.chart.update();
    }
  }

  ngAfterViewInit(): void {
    document.querySelectorAll('.icon').forEach((ico) => {
      ico.addEventListener('click', (e: Event) => {
        (e.target as HTMLElement).parentElement?.classList.toggle('showMenu');
      });
      const name = ico.classList[1]?.split('-')[1] || '';
      if (name) {
        ico.innerHTML = `<svg width="20" height="20"><use xlink:href="#${ico.classList[1]}" /></svg>`;
      }
    });
  }

  loadRevenue(): void {
    this.orderService.getRevenue({ 
      granularity: this.granularity, 
      start: this.startDate || undefined, 
      end: this.endDate || undefined 
    }).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.revenueSeries = res.data.series || [];
          this.totalRevenue = res.data.total || 0;
          
          // Cập nhật biểu đồ
          this.updateChartData();
          
          // So sánh với kỳ trước (lấy nửa đầu so với nửa sau)
          const half = Math.floor(this.revenueSeries.length / 2);
          const first = this.revenueSeries.slice(0, half).reduce((s, x) => s + (x.revenue || 0), 0);
          const second = this.revenueSeries.slice(half).reduce((s, x) => s + (x.revenue || 0), 0);
          this.prevTotalRevenue = first;
          const base = first === 0 ? 1 : first;
          this.comparisonDelta = ((second - first) / base) * 100;
        }
      },
      error: (err) => {
        console.error('Lỗi khi tải dữ liệu doanh thu:', err);
        Swal.fire('Lỗi', 'Không thể tải dữ liệu doanh thu', 'error');
      }
    });
  }

  loadOrders(): void {
    this.orderService.getPendingOrders().subscribe({
      next: (response: ApiResponse<Order[]>) => {
        if (response.success) {
          this.pendingOrders = response.data || [];
          this.originalPendingOrders = [...this.pendingOrders]; // Lưu danh sách gốc
          this.errorMessage = null;
        } else {
          this.errorMessage = response.message || 'Lỗi khi lấy đơn hàng chờ xác nhận.';
          Swal.fire('Lỗi', this.errorMessage, 'error');
        }
      },
      error: (err) => {
        console.error('Error fetching pending orders:', err);
        this.errorMessage =
          err.status === 401 || err.status === 403
            ? 'Không có quyền truy cập. Vui lòng đăng nhập lại.'
            : 'Lỗi khi lấy đơn hàng chờ xác nhận.';
        Swal.fire('Lỗi', this.errorMessage, 'error');
        if (err.status === 401 || err.status === 403) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
      },
    });

    this.orderService.getCompletedOrders().subscribe({
      next: (response: ApiResponse<Order[]>) => {
        if (response.success) {
          this.completedOrders = response.data || [];
          this.originalCompletedOrders = [...this.completedOrders]; // Lưu danh sách gốc
          this.errorMessage = null;
        } else {
          this.errorMessage = response.message || 'Lỗi khi lấy đơn hàng đã giao.';
          Swal.fire('Lỗi', this.errorMessage, 'error');
        }
      },
      error: (err) => {
        console.error('Error fetching completed orders:', err);
        this.errorMessage =
          err.status === 401 || err.status === 403
            ? 'Không có quyền truy cập. Vui lòng đăng nhập lại.'
            : 'Lỗi khi lấy đơn hàng đã giao.';
        Swal.fire('Lỗi', this.errorMessage, 'error');
        if (err.status === 401 || err.status === 403) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
      },
    });
  }

  loadUserAvatar(): void {
    this.authService.getUserAvatar().subscribe({
      next: (avatar) => {
        if (avatar) {
          this.userAvatar = avatar.startsWith('http') ? avatar : `http://localhost:3000${avatar}`;
        }
      },
      error: (err) => {
        console.error('Error loading avatar:', err);
        // Nếu lỗi xác thực, đăng xuất và chuyển về trang login
        if (err.status === 401 || err.status === 403) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
      },
    });
  }

  search(): void {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) {
      // Khôi phục danh sách gốc khi xóa từ khóa tìm kiếm
      this.pendingOrders = [...this.originalPendingOrders];
      this.completedOrders = [...this.originalCompletedOrders];
      return;
    }

    // Lọc theo customerName hoặc status
    this.pendingOrders = this.originalPendingOrders.filter((order) => {
      const customerName = order.customerName?.toLowerCase() || '';
      const status = order.status?.toLowerCase() || '';
      return customerName.includes(query) || status.includes(query);
    });

    this.completedOrders = this.originalCompletedOrders.filter((order) => {
      const customerName = order.customerName?.toLowerCase() || '';
      const status = order.status?.toLowerCase() || '';
      return customerName.includes(query) || status.includes(query);
    });
  }

  logout(): void {
    this.authService.logout();
    Swal.fire('Thành công', 'Đăng xuất thành công', 'success');
    this.router.navigate(['/login']);
  }
}