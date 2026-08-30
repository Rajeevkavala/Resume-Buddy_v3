export {};

declare global {
  interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    prefill?: {
      email?: string;
      name?: string;
      contact?: string;
    };
    theme?: {
      color?: string;
      backdrop_color?: string;
    };
    handler?: (response: any) => void;
    modal?: {
      ondismiss?: () => void;
      escape?: boolean;
      animation?: boolean;
    };
  }

  interface RazorpayInstance {
    open(): void;
    close?(): void;
    on(event: string, handler: (response: any) => void): void;
  }

  interface Window {
    Razorpay?: any;
  }
}
