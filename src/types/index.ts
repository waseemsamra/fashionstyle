export interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  isNew?: boolean;
  isSale?: boolean;
  rating?: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  image: string;
  itemCount: number;
}

export interface Testimonial {
  id: number;
  name: string;
  role: string;
  content: string;
  avatar: string;
  rating: number;
}
