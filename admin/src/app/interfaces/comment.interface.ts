export interface Product {
  _id: string;
  name: string;
  thumbnail?: string; // thumbnail là tùy chọn
}

export interface Comment {
  _id?: string;
  userName: string;
  userEmail: string;
  content: string;
  rating: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
  isEdited?: boolean;
  productId?: Product; // productId là tùy chọn
  adminReply?: {
    content: string;
    adminId: { name: string };
    repliedAt: string;
  };
}

export interface CommentStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  stats: any[];
}

export interface CommentFilters {
  status?: string;
  productId?: string;
  rating?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
