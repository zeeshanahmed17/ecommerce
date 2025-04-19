import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function FaqPage() {
  const faqs = [
    {
      question: "How do I track my order?",
      answer: "You can track your order by logging into your account and visiting the 'My Orders' section. There you'll find a list of all your orders and their current status. You can also use the tracking number provided in your shipping confirmation email to track your package directly on the carrier's website."
    },
    {
      question: "What is your return policy?",
      answer: "We offer a 30-day return policy for most items. Products must be in their original condition and packaging. To initiate a return, log into your account, go to 'My Orders', select the order containing the item you wish to return, and follow the return process. Once we receive the returned item, we'll process your refund within 5-7 business days."
    },
    {
      question: "Do you ship internationally?",
      answer: "Yes, we ship to most countries worldwide. International shipping costs and delivery times vary depending on the destination. You can see the shipping options and estimated delivery times during checkout. Please note that international orders may be subject to customs duties and taxes, which are the responsibility of the customer."
    },
    {
      question: "How can I change or cancel my order?",
      answer: "You can change or cancel your order within 2 hours of placing it. After that, we begin processing orders and cannot guarantee changes. To request a change or cancellation, please contact our customer service team immediately via email at support@shopelite.com or call us at +1 (800) 123-4567."
    },
    {
      question: "Are my payment details secure?",
      answer: "Yes, we take security very seriously. Our website uses industry-standard SSL encryption to protect your personal information. We comply with PCI DSS requirements and never store your full credit card details on our servers. We work with trusted payment processors to ensure your transactions are secure."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, MasterCard, American Express, Discover), PayPal, Apple Pay, Google Pay, and Shop Pay. For certain regions, we also offer local payment options. All available payment methods will be displayed during the checkout process."
    },
    {
      question: "How do I find my size?",
      answer: "We provide detailed size guides for all our clothing and footwear products. You can find the size guide link on each product page. If you're still unsure about sizing, please contact our customer service team who can provide specific guidance based on the item you're interested in."
    },
    {
      question: "Do you offer gift wrapping?",
      answer: "Yes, we offer gift wrapping services for a small additional fee. During checkout, you'll have the option to select gift wrapping and include a personalized message. Your items will be beautifully wrapped and the receipt will be excluded from the package."
    },
    {
      question: "How can I contact customer service?",
      answer: "Our customer service team is available Monday through Friday, 9am to 6pm EST. You can reach us via email at support@shopelite.com, by phone at +1 (800) 123-4567, or through the contact form on our website. We typically respond to all inquiries within 24 hours."
    },
    {
      question: "Do you have a loyalty program?",
      answer: "Yes, we have a loyalty program called ShopElite Rewards. You earn points for every purchase, product review, and social media share. These points can be redeemed for discounts on future purchases. You can sign up for the program through your account dashboard."
    }
  ];

  return (
    <div className="container mx-auto py-12 px-4 max-w-3xl">
      <h1 className="text-3xl font-bold text-center mb-2">Frequently Asked Questions</h1>
      <p className="text-gray-500 text-center mb-8">
        Find answers to our most commonly asked questions. Can't find what you're looking for?
        <Link href="/contact" className="text-primary hover:underline ml-1">
          Contact us
        </Link>.
      </p>
      
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-left">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-gray-600">{faq.answer}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      
      <div className="mt-12 text-center">
        <h2 className="text-xl font-semibold mb-4">Still have questions?</h2>
        <p className="text-gray-600 mb-6">
          Our customer service team is here to help you with any questions or concerns.
        </p>
        <Link href="/contact">
          <Button>Contact Us</Button>
        </Link>
      </div>
    </div>
  );
} 