export interface Mold {
  id: string;
  position: string;
  customer: string;
  status: string;
  is_deleted: boolean;
  product_name: string;
  photo_urls: string[];
  navodka_url: string; // JSON string or array
  previous_position: string;
}

export interface NavodkaItem {
  url: string;
  title: string;
}

export interface MoldComment {
  id: string | number;
  mold_id: string;
  user_name: string;
  comment: string;
  photo_urls: string[];
  created_at: string;
}

export interface MoldLog {
  id?: string | number;
  mold_id: string;
  old_position: string;
  new_position: string;
  user_name: string;
  created_at: string;
}

export interface Customer {
  name: string;
  bg: string;
}

export interface ActiveSession {
  user_name: string;
  last_seen: string;
  device_type?: string;
  role?: string;
}

export interface ToastMessage {
  id: number;
  text: string;
  isError?: boolean;
}
