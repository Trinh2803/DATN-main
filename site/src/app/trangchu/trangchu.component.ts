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
    // Start the banner auto-slide
    this.startAutoSlide();

    // Fetch new products
    this.productService.getNewProducts().subscribe({
      next: (data: any) => {
        console.log('Raw New Products:', data);
        console.log('Is array?', Array.isArray(data));
        this.newProducts = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
        console.log('Assigned New Products:', this.newProducts);
      },
      error: (error) => {
        console.error('Error fetching new products:', error);
        this.newProducts = [];
      }
    });

    // Fetch sale products
    this.productService.getSaleProducts().subscribe({
      next: (data: any) => {
        console.log('Raw Sale Products:', data);
        console.log('Is array?', Array.isArray(data));
        this.saleProducts = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
        console.log('Assigned Sale Products:', this.saleProducts);
      },
      error: (error) => {
        console.error('Error fetching sale products:', error);
        this.saleProducts = [];
      }
    });

    // Fetch hot products
    this.productService.getHotProducts().subscribe({
      next: (data: any) => {
        console.log('Raw Hot Products:', data);
        this.hotProducts = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
        console.log('Assigned Hot Products:', this.hotProducts);
      },
      error: (error) => {
        console.error('Error fetching hot products:', error);
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
