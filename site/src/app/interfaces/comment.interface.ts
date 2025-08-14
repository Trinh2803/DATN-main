export interface Comment {
  _id?: string;
  productId: {
    _id: string;
    name: string;
    thumbnail?: string;
  };
  userId?: {
    _id: string;
    name: string;
    email: string;
  };
  userName: string;
  userEmail: string;
  rating: number;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  adminReply?: {
    content: string;
    adminId: {
      _id: string;
      name: string;
    };
    repliedAt: string;
  };
  isEdited: boolean;
  editedAt?: string;
  editedBy?: {
    _id: string;
    name: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CommentStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  stats: Array<{
    _id: string;
    count: number;
    avgRating: number;
  }>;
}

export interface CommentFilters {
  status?: 'pending' | 'approved' | 'rejected';
  productId?: string;
  rating?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
