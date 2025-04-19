import Stripe from 'stripe';
import dotenv from 'dotenv';
import type { Stripe as StripeType } from 'stripe';

dotenv.config();

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const isDev = process.env.NODE_ENV === 'development';

// In development, use a dummy key if not provided
if (!STRIPE_SECRET_KEY && !isDev) {
  throw new Error('STRIPE_SECRET_KEY is required in environment variables');
}

// Initialize Stripe with your secret key or use a fake key in development
const stripe = new Stripe(STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_dev', {
  apiVersion: '2025-03-31.basil',
});

type CreatePaymentIntentParams = {
  amount: number;
  currency?: string;
  metadata?: Record<string, string>;
};

type CreateCheckoutSessionParams = {
  lineItems: Array<{
    price_data: {
      currency: string;
      product_data: {
        name: string;
        images?: string[];
      };
      unit_amount: number;
    };
    quantity: number;
  }>;
  successUrl: string;
  cancelUrl: string;
};

export const createPaymentIntent = async (
  { amount, currency = 'usd', metadata }: CreatePaymentIntentParams
): Promise<StripeType.PaymentIntent> => {
  try {
    return await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects amount in cents
      currency,
      automatic_payment_methods: { enabled: true },
      ...(metadata && { metadata }),
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

export const createCheckoutSession = async (
  { lineItems, successUrl, cancelUrl }: CreateCheckoutSessionParams
): Promise<StripeType.Checkout.Session> => {
  try {
    return await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

export const retrievePaymentIntent = async (
  paymentIntentId: string
): Promise<StripeType.PaymentIntent> => {
  try {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    throw error;
  }
};

export default stripe; 