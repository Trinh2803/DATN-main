import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListcardComponent } from '../listcard/listcard.component';
import { ProductInterface } from '../product-interface';
import { ProductService } from '../product.service';

interface Slide {
  image: string;
  subtitle: string;
  title: string;
  linkButtonText: string;
  linkButtonUrl: string;
  rewardButtonText: string;
  rewardButtonUrl: string;
  detailsText: string;
  detailsUrl: string;
}

interface NewsItem {
  image: string;
  title: string;
  date: string;
  description: string;
  link: string;
}

@Component({
  selector: 'app-trangchu',
  standalone: true,
  imports: [CommonModule, ListcardComponent],
  templateUrl: './trangchu.component.html',
  styleUrls: ['./trangchu.component.css']
})
export class TrangchuComponent implements OnInit, OnDestroy {
  allProducts: ProductInterface[] = [];
  newProducts: ProductInterface[] = [];
  saleProducts: ProductInterface[] = [];
  hotProducts: ProductInterface[] = [];
  newsItems: NewsItem[] = [
    {
      image: 'https://product.hstatic.net/200000065946/product/pro_xam_noi_that_moho_sofa_2_734c2cf3b5674220a6305219e51aec73_large.jpg',
      title: 'Xu hướng nội thất 2025: Tối giản và hiện đại',
      date: '01/06/2025',
      description: 'Khám phá những xu hướng nội thất mới nhất cho năm 2025, tập trung vào sự tối giản, tiện nghi và thân thiện với môi trường.',
      link: '/news/trend-2025'
    },
    {
      image: 'https://product.hstatic.net/200000065946/product/pro_combo_ban_an_4_ghe_noi_that_moho_combo___1__a278207568a84c75aaaeb001710d1972_large.jpg',
      title: 'Bí quyết chọn bàn ăn phù hợp cho gia đình',
      date: '30/05/2025',
      description: 'Tìm hiểu cách chọn bàn ăn phù hợp với không gian và phong cách sống của bạn, từ kích thước đến chất liệu.',
      link: '/news/choose-dining-table'
    },
    {
      image: 'https://product.hstatic.net/200000065946/product/pro_nau_noi_that_moho_combo_phong_ngu_dalumd_4_mon_1_347053d304bc4750a8491e34315e1f45_master.jpg',
      title: 'Mẹo trang trí phòng ngủ ấm cúng',
      date: '28/05/2025',
      description: 'Những ý tưởng đơn giản để biến phòng ngủ của bạn thành một không gian ấm cúng và thư giãn.',
      link: '/news/bedroom-decor-tips'
    }
  ];
  slides: Slide[] = [
    {
      image: './images/banner1.png',
      subtitle: 'Chào mừng bạn đến với cửa hàng',
      title: 'Sản phẩm mới nhất 2025',
      linkButtonText: 'Mua ngay',
      linkButtonUrl: '/shop',
      rewardButtonText: 'Nhận ưu đãi',
      rewardButtonUrl: '/offers',
      detailsText: 'Xem chi tiết',
      detailsUrl: '/details'
    },
    {
      image: './images/banner2.png',
      subtitle: 'Ưu đãi đặc biệt',
      title: 'Giảm giá lên đến 50%',
      linkButtonText: 'Khám phá ngay',
      linkButtonUrl: '/sale',
      rewardButtonText: 'Nhận quà tặng',
      rewardButtonUrl: '/rewards',
      detailsText: 'Tìm hiểu thêm',
      detailsUrl: '/sale-details'
    },
    {
      image: './images/banner2.webp',
      subtitle: 'Bộ sưu tập hot',
      title: 'Xu hướng thời trang mới',
      linkButtonText: 'Xem bộ sưu tập',
      linkButtonUrl: '/collection',
      rewardButtonText: 'Ưu đãi đặc biệt',
      rewardButtonUrl: '/special-offers',
      detailsText: 'Chi tiết sản phẩm',
      detailsUrl: '/collection-details'
    }
  ];

  currentSlide: number = 0;
  private autoSlideInterval: any;

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    // Gọi API lấy tất cả sản phẩm
    this.productService.getAllProducts().subscribe({
      next: (data: any) => {
        const arr = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
        this.allProducts = arr.filter((p: any) => p && typeof p === 'object' && p._id);
      },
      error: (error) => {
        this.allProducts = [];
      }
    });
    // Start the banner auto-slide
    this.startAutoSlide();

    // Fetch new products
    this.productService.getNewProducts().subscribe({
      next: (data: any) => {
        const arr = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
        this.newProducts = arr.filter((p: any) => p && typeof p === 'object' && p._id);
      },
      error: (error) => {
        this.newProducts = [];
      }
    });

    this.productService.getSaleProducts().subscribe({
      next: (data: any) => {
        const arr = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
        this.saleProducts = arr.filter((p: any) => p && typeof p === 'object' && p._id);
      },
      error: (error) => {
        this.saleProducts = [];
      }
    });

    this.productService.getHotProducts().subscribe({
      next: (data: any) => {
        console.log('API hotProducts trả về:', data);
        const arr = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
        this.hotProducts = arr.filter((p: any) => p && typeof p === 'object' && p._id);
        if (this.hotProducts.length === 0) {
          console.warn('Không có sản phẩm hot nào để hiển thị!');
        }
      },
      error: (error) => {
        console.error('Lỗi API hotProducts:', error);
        this.hotProducts = [];
      }
    });

    // Note: News items are currently static. Uncomment the below code if you have a service to fetch news.
    /*
    this.productService.getNewsItems().subscribe({
      next: (data: any) => {
        console.log('Raw News Items:', data);
        this.newsItems = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
        console.log('Assigned News Items:', this.newsItems);
      },
      error: (error) => {
        console.error('Error fetching news items:', error);
        this.newsItems = [];
      }
    });
    */
  }

  ngOnDestroy(): void {
    this.stopAutoSlide();
  }

  startAutoSlide(): void {
    this.autoSlideInterval = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  stopAutoSlide(): void {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
    }
  }

  nextSlide(): void {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
  }

  prevSlide(): void {
    this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
  }
}
