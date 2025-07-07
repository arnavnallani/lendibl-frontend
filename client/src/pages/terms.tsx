import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center text-gray-dark">
              Terms of Service
            </CardTitle>
            <p className="text-center text-gray-medium mt-2">
              Last updated: July 7, 2025
            </p>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Lendibl ("we," "our," or "us"), you accept and agree to be bound by the terms and provision of this agreement. 
              If you do not agree to abide by the above, please do not use this service.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">2. Service Description</h2>
            <p>
              Lendibl is a peer-to-peer rental marketplace that connects item owners ("Lenders") with renters ("Borrowers"). 
              We facilitate transactions but are not party to the rental agreements between users.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">3. User Accounts</h2>
            <p>
              You must create an account to use our services. You are responsible for maintaining the confidentiality of your account 
              information and for all activities that occur under your account.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">4. Payment Terms</h2>
            <p>
              All payments are processed through Stripe. By making a booking, you authorize Lendibl to charge your payment method 
              for the total rental cost including applicable fees.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">5. Cancellation and Refund Policy</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">Important Cancellation Terms:</h3>
              
              <h4 className="font-semibold text-blue-700 mb-2">Full Refund Conditions:</h4>
              <ul className="list-disc pl-6 text-blue-700 space-y-1">
                <li>You cancel your booking before the owner approves your request</li>
                <li>The owner does not approve your request within 24 hours of submission</li>
                <li>The owner declines your booking request</li>
              </ul>
              
              <h4 className="font-semibold text-red-700 mb-2 mt-4">NO REFUND Conditions:</h4>
              <ul className="list-disc pl-6 text-red-700 space-y-1">
                <li><strong>You cancel after the owner has already approved your booking</strong></li>
                <li>You fail to pick up the item during the agreed rental period</li>
                <li>You violate the terms of the rental agreement</li>
              </ul>
              
              <p className="text-sm text-gray-600 mt-3 italic">
                Please carefully consider your booking decisions as approved bookings cannot be refunded upon cancellation.
              </p>
            </div>

            <h2 className="text-2xl font-semibold mt-8 mb-4">6. User Responsibilities</h2>
            
            <h3 className="text-lg font-semibold mt-6 mb-3">As a Borrower (Renter):</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use items responsibly and as intended</li>
              <li>Return items in the same condition as received</li>
              <li>Pay for any damage or loss that occurs during your rental period</li>
              <li>Coordinate pickup and return with the item owner</li>
              <li>Understand that cancelling after approval results in no refund</li>
            </ul>

            <h3 className="text-lg font-semibold mt-6 mb-3">As a Lender (Owner):</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate descriptions and photos of your items</li>
              <li>Ensure items are in safe, working condition</li>
              <li>Respond to booking requests within 24 hours</li>
              <li>Be available for item pickup and return coordination</li>
              <li>Set up payment method to receive rental earnings</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8 mb-4">7. Prohibited Activities</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Listing illegal items or items that violate intellectual property rights</li>
              <li>Using the platform for any illegal purposes</li>
              <li>Manipulating reviews or ratings</li>
              <li>Harassing or threatening other users</li>
              <li>Circumventing platform fees or payment processing</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8 mb-4">8. Fees</h2>
            <p>
              Lendibl charges a 6% service fee on all successful rentals. This fee covers payment processing, 
              platform maintenance, and customer support. Fees are non-refundable except in cases of platform error.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">9. Liability and Insurance</h2>
            <p>
              Lendibl is not responsible for damage, loss, or injury related to rental items. Users are encouraged 
              to verify insurance coverage for rental activities. We provide a platform but do not guarantee the 
              condition, safety, or legality of listed items.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">10. Dispute Resolution</h2>
            <p>
              In case of disputes between users, Lendibl may provide mediation services but is not obligated to resolve conflicts. 
              Users agree to attempt good faith resolution before pursuing legal action.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">11. Platform Changes</h2>
            <p>
              We reserve the right to modify or discontinue the service at any time. We will provide reasonable notice 
              of significant changes to these terms or the platform functionality.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">12. Termination</h2>
            <p>
              We may terminate or suspend your account for violations of these terms. Upon termination, 
              your right to use the service ceases immediately.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">13. Governing Law</h2>
            <p>
              These terms are governed by the laws of the United States. Any disputes will be resolved in 
              the appropriate courts of jurisdiction.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">14. Contact Information</h2>
            <p>
              For questions about these Terms of Service, please contact us at:
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
              <p><strong>Email:</strong> arnav.nallani@gmail.com</p>
              <p><strong>Company:</strong> lendibl LLC</p>
            </div>

            <div className="border-t border-gray-200 pt-6 mt-8">
              <p className="text-sm text-gray-500 text-center">
                By using Lendibl, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
              </p>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}