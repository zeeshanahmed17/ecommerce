import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function WarrantyPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold text-center mb-2">Warranty Information</h1>
      <p className="text-gray-500 text-center mb-8">
        Our warranty policies and product protection information.
      </p>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">Standard Warranty Policy</h2>
          <p className="text-gray-600 mb-4">
            All products sold by ShopElite come with a standard 1-year limited warranty that covers manufacturing defects and workmanship issues. This warranty is valid from the date of purchase and requires proof of purchase.
          </p>
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-medium mb-2">What's Covered:</h3>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li>Manufacturing defects that affect the functionality of the product</li>
              <li>Workmanship issues that were present at the time of purchase</li>
              <li>Electrical or mechanical failures during normal use</li>
            </ul>
          </div>
          <div className="bg-gray-50 p-4 rounded-md mt-4">
            <h3 className="font-medium mb-2">What's Not Covered:</h3>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li>Normal wear and tear</li>
              <li>Damage caused by accidents, misuse, or neglect</li>
              <li>Products that have been modified or altered</li>
              <li>Cosmetic damage that doesn't affect functionality</li>
              <li>Damage from improper cleaning or maintenance</li>
            </ul>
          </div>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">Extended Warranty Options</h2>
          <p className="text-gray-600 mb-4">
            For additional peace of mind, we offer extended warranty options that provide coverage beyond the standard warranty period.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-md p-4">
              <h3 className="font-medium mb-2">Premium Protection Plan</h3>
              <p className="text-sm text-gray-600 mb-3">Extends coverage to 3 years from date of purchase</p>
              <ul className="text-sm text-gray-600 list-disc pl-5 mb-4 space-y-1">
                <li>Covers all standard warranty items</li>
                <li>Includes accidental damage protection</li>
                <li>Priority customer support</li>
              </ul>
              <p className="text-sm font-medium">Starting at $49.99</p>
            </div>
            <div className="border rounded-md p-4">
              <h3 className="font-medium mb-2">Complete Care Package</h3>
              <p className="text-sm text-gray-600 mb-3">Extends coverage to 5 years from date of purchase</p>
              <ul className="text-sm text-gray-600 list-disc pl-5 mb-4 space-y-1">
                <li>All Premium Protection benefits</li>
                <li>Free annual maintenance check</li>
                <li>One-time replacement for severe damage</li>
              </ul>
              <p className="text-sm font-medium">Starting at $89.99</p>
            </div>
          </div>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">How to File a Warranty Claim</h2>
          <ol className="list-decimal pl-5 space-y-2 text-gray-600">
            <li>Gather your proof of purchase (order number, receipt)</li>
            <li>Take clear photos of the product and the issue</li>
            <li>Contact our customer service team with your information</li>
            <li>Our team will assess your claim and provide next steps</li>
            <li>If approved, you'll receive instructions for repair or replacement</li>
          </ol>
        </section>
      </div>
      
      <div className="mt-12 text-center">
        <h2 className="text-xl font-semibold mb-4">Need Assistance with a Warranty Claim?</h2>
        <p className="text-gray-600 mb-6">
          Our customer service team is here to help with any warranty questions or claims.
        </p>
        <div className="flex justify-center space-x-4">
          <Link href="/contact">
            <Button>Contact Support</Button>
          </Link>
          <Link href="/faq">
            <Button variant="outline">View FAQs</Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 