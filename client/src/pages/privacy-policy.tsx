import { Link } from "wouter";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-16">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-100 p-8">
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors">
              ← Back to Home
            </Link>
          </div>
          
          <div className="prose prose-blue max-w-none">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">PRIVACY POLICY</h1>
            <p className="text-gray-600 mb-8">Last updated June 23, 2025</p>

            <div className="space-y-8 text-gray-700 leading-relaxed">
              <section>
                <p>
                  This privacy notice for Lendibl ("<strong>we</strong>," "<strong>us</strong>," or "<strong>our</strong>"), describes how and why we might collect, store, use, and/or share ("<strong>process</strong>") your information when you use our services ("<strong>Services</strong>"), such as when you:
                </p>
                <ul className="list-disc ml-6 mt-4 space-y-2">
                  <li>Visit our website at lendibl.com, or any website of ours that links to this privacy notice</li>
                  <li>Engage with us in other related ways, including any sales, marketing, or events</li>
                </ul>
                <p className="mt-4">
                  <strong>Questions or concerns?</strong> Reading this privacy notice will help you understand your privacy rights and choices. If you do not agree with our policies and practices, please do not use our Services.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">SUMMARY OF KEY POINTS</h2>
                <p className="italic mb-4">
                  This summary provides key points from our privacy notice, but you can find out more details about any of these topics by clicking the link following each key point or by using our table of contents below to find the section you are looking for.
                </p>
                <p>
                  <strong>What personal information do we process?</strong> When you visit, use, or navigate our Services, we may process personal information depending on how you interact with us and the Services, the choices you make, and the products and features you use.
                </p>
                <p className="mt-4">
                  <strong>Do we process any sensitive personal information?</strong> We do not process sensitive personal information.
                </p>
                <p className="mt-4">
                  <strong>Do we collect any information from third parties?</strong> We do not collect any information from third parties.
                </p>
                <p className="mt-4">
                  <strong>How do we process your information?</strong> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent.
                </p>
                <p className="mt-4">
                  <strong>In what situations and with which parties do we share personal information?</strong> We may share information in specific situations and with specific third parties.
                </p>
                <p className="mt-4">
                  <strong>What are your rights?</strong> Depending on where you are located geographically, the applicable privacy law may mean you have certain rights regarding your personal information.
                </p>
                <p className="mt-4">
                  <strong>How do you exercise your rights?</strong> The easiest way to exercise your rights is by submitting a data subject access request, or by contacting us. We will consider and act upon any request in accordance with applicable data protection laws.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">TABLE OF CONTENTS</h2>
                <ol className="list-decimal ml-6 space-y-1">
                  <li>WHAT INFORMATION DO WE COLLECT?</li>
                  <li>HOW DO WE PROCESS YOUR INFORMATION?</li>
                  <li>WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</li>
                  <li>HOW LONG DO WE KEEP YOUR INFORMATION?</li>
                  <li>DO WE COLLECT INFORMATION FROM MINORS?</li>
                  <li>WHAT ARE YOUR PRIVACY RIGHTS?</li>
                  <li>CONTROLS FOR DO-NOT-TRACK FEATURES</li>
                  <li>DO WE MAKE UPDATES TO THIS NOTICE?</li>
                  <li>HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</li>
                  <li>HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</li>
                </ol>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">1. WHAT INFORMATION DO WE COLLECT?</h2>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Personal information you disclose to us</h3>
                <p>
                  <strong>In Short:</strong> We collect personal information that you provide to us.
                </p>
                <p className="mt-4">
                  We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.
                </p>
                <p className="mt-4">
                  <strong>Personal Information Provided by You.</strong> The personal information that we collect depends on the context of your interactions with us and the Services, the choices you make, and the products and features you use. The personal information we collect may include the following:
                </p>
                <ul className="list-disc ml-6 mt-4 space-y-1">
                  <li>names</li>
                  <li>email addresses</li>
                  <li>phone numbers</li>
                  <li>payment information</li>
                  <li>usernames</li>
                  <li>passwords</li>
                </ul>
                <p className="mt-4">
                  <strong>Sensitive Information.</strong> We do not process sensitive information.
                </p>
                <p className="mt-4">
                  <strong>Payment Data.</strong> We may collect data necessary to process your payment if you choose to make purchases, such as your payment instrument number, and the security code associated with your payment instrument. All payment data is handled and stored by Stripe. You may find their privacy notice link(s) here: https://stripe.com/privacy.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">2. HOW DO WE PROCESS YOUR INFORMATION?</h2>
                <p>
                  <strong>In Short:</strong> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent.
                </p>
                <p className="mt-4">
                  We process your personal information for a variety of reasons, depending on how you interact with our Services, including:
                </p>
                <ul className="list-disc ml-6 mt-4 space-y-2">
                  <li><strong>To facilitate account creation and authentication and otherwise manage user accounts.</strong> We may process your information so you can create and log in to your account, as well as keep your account in working order.</li>
                  <li><strong>To deliver and facilitate delivery of services to the user.</strong> We may process your information to provide you with the requested service.</li>
                  <li><strong>To respond to user inquiries/offer support to users.</strong> We may process your information to respond to your inquiries and solve any potential issues you might have with the requested service.</li>
                  <li><strong>To send administrative information to you.</strong> We may process your information to send you details about our products and services, changes to our terms and policies, and other similar information.</li>
                  <li><strong>To fulfill and manage your orders.</strong> We may process your information to fulfill and manage your orders, payments, returns, and exchanges made through the Services.</li>
                  <li><strong>To enable user-to-user communications.</strong> We may process your information if you choose to use any of our offerings that allow for communication with another user.</li>
                  <li><strong>To request feedback.</strong> We may process your information when necessary to request feedback and to contact you about your use of our Services.</li>
                  <li><strong>To send you marketing and promotional communications.</strong> We may process the personal information you send to us for our marketing purposes, if this is in accordance with your marketing preferences.</li>
                  <li><strong>To protect our Services.</strong> We may process your information as part of our efforts to keep our Services safe and secure, including fraud monitoring and prevention.</li>
                  <li><strong>To identify usage trends.</strong> We may process information about how you use our Services to better understand how they are being used so we can improve them.</li>
                  <li><strong>To save or protect an individual's vital interest.</strong> We may process your information when necessary to save or protect an individual's vital interest, such as to prevent harm.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">3. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</h2>
                <p>
                  <strong>In Short:</strong> We may share information in specific situations described in this section and/or with the following third parties.
                </p>
                <p className="mt-4">
                  We may need to share your personal information in the following situations:
                </p>
                <ul className="list-disc ml-6 mt-4 space-y-2">
                  <li><strong>Business Transfers.</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</li>
                  <li><strong>When we use Stripe.</strong> We may share your information with Stripe for payment processing. You can find their privacy notice at https://stripe.com/privacy.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">4. HOW LONG DO WE KEEP YOUR INFORMATION?</h2>
                <p>
                  <strong>In Short:</strong> We keep your information for as long as necessary to fulfill the purposes outlined in this privacy notice unless otherwise required by law.
                </p>
                <p className="mt-4">
                  We will only keep your personal information for as long as it is necessary for the purposes set out in this privacy notice, unless a longer retention period is required or permitted by law (such as tax, accounting, or other legal requirements).
                </p>
                <p className="mt-4">
                  When we have no ongoing legitimate business need to process your personal information, we will either delete or anonymize such information, or, if this is not possible (for example, because your personal information has been stored in backup archives), then we will securely store your personal information and isolate it from any further processing until deletion is possible.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">5. DO WE COLLECT INFORMATION FROM MINORS?</h2>
                <p>
                  <strong>In Short:</strong> We do not knowingly collect data from or market to children under 18 years of age.
                </p>
                <p className="mt-4">
                  We do not knowingly collect, solicit data from, or market to children under 18 years of age, nor do we knowingly sell such personal information. By using the Services, you represent that you are at least 18 or that you are the parent or guardian of such a minor and consent to such minor dependent's use of the Services.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">6. WHAT ARE YOUR PRIVACY RIGHTS?</h2>
                <p>
                  <strong>In Short:</strong> You may review, change, or terminate your account at any time, depending on your country, province, or state of residence.
                </p>
                <p className="mt-4">
                  <strong>Withdrawing your consent:</strong> If we are relying on your consent to process your personal information, which may be express and/or implied consent depending on the applicable law, you have the right to withdraw your consent at any time.
                </p>
                <p className="mt-4">
                  <strong>Account Information</strong>
                </p>
                <p className="mt-2">
                  If you would at any time like to review or change the information in your account or terminate your account, you can:
                </p>
                <ul className="list-disc ml-6 mt-2">
                  <li>Log in to your account settings and update your user account.</li>
                </ul>
                <p className="mt-4">
                  Upon your request to terminate your account, we will deactivate or delete your account and information from our active databases. However, we may retain some information in our files to prevent fraud, troubleshoot problems, assist with any investigations, enforce our legal terms and/or comply with applicable legal requirements.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">7. CONTROLS FOR DO-NOT-TRACK FEATURES</h2>
                <p>
                  Most web browsers and some mobile operating systems and mobile applications include a Do-Not-Track ("DNT") feature or setting you can activate to signal your privacy preference not to have data about your online browsing activities monitored and collected. At this stage, no uniform technology standard for recognizing and implementing DNT signals has been finalized. As such, we do not currently respond to DNT browser signals or any other mechanism that automatically communicates your choice not to be tracked online.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">8. DO WE MAKE UPDATES TO THIS NOTICE?</h2>
                <p>
                  <strong>In Short:</strong> Yes, we will update this notice as necessary to stay compliant with relevant laws.
                </p>
                <p className="mt-4">
                  We may update this privacy notice from time to time. The updated version will be indicated by an updated "Revised" date at the top of this privacy notice. If we make material changes to this privacy notice, we may notify you either by prominently posting a notice of such changes or by directly sending you a notification. We encourage you to review this privacy notice frequently to be informed of how we are protecting your information.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">9. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</h2>
                <p>
                  If you have questions or comments about this notice, you may contact us by email at privacy@lendibl.com.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">10. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</h2>
                <p>
                  Based on the applicable laws of your country, you may have the right to request access to the personal information we collect from you, details about how we have processed it, correct inaccuracies, or delete your personal information. You may also have the right to withdraw your consent to our processing of your personal information.
                </p>
                <p className="mt-4">
                  If you wish to exercise any of these rights, please contact us at privacy@lendibl.com. We will consider and act upon any request in accordance with applicable data protection laws.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}