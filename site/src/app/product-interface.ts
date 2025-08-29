export interface Variant {
  _id: string;
  size: string;
  price: number;
  salePrice?: number | null;
  stock: number;
}

export interface ProductInterface {
  _id: string;
  name: string;
  price: number;
  salePrice?: number | null;
  stock?: number;
  quantity?: number; // Số lượng tồn kho
  sold?: number; // Số lượng đã bán
  createdAt?: string | Date;
  thumbnail: string;
  images?: string[];
  sellCount: number;
  categoryId: {
    _id: string;
    name: string;
  };
  description: string;
  variants?: Variant[];
  selectedVariant?: Variant;
  isHot?: boolean; // Cờ đánh dấu sản phẩm hot
  isInWishlist?: boolean; // Trạng thái sản phẩm có trong wishlist không
}

export interface CategoryInterface {
  _id: string;
  name: string;
  slug: string;
  image: string | File;
  updatedAt?: string;
}
