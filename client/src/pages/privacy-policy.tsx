import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-16">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-100 p-8">
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </div>
          
          <div className="prose prose-blue max-w-none">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">PRIVACY POLICY</h1>
            <p className="text-gray-600 mb-8">Last updated June 23, 2025</p>
            
            <div className="space-y-8 text-gray-700 leading-relaxed">
              <section>
                <p>
                  This Privacy Notice for lendibl LLC (doing business as lendibl) ("<strong>we</strong>," "<strong>us</strong>," or "<strong>our</strong>"), describes how and why we might access, collect, store, use, and/or share ("<strong>process</strong>") your personal information when you use our services ("<strong>Services</strong>"), including when you:
                </p>
                <ul className="list-disc ml-6 mt-4 space-y-2">
                  <li>Visit our website at lendibl.com or any website of ours that links to this Privacy Notice</li>
                  <li>Engage with us in other related ways, including any sales, marketing, or events</li>
                </ul>
                <p className="mt-4">
                  <strong>Questions or concerns?</strong> Reading this Privacy Notice will help you understand your privacy rights and choices. We are responsible for making decisions about how your personal information is processed. If you do not agree with our policies and practices, please do not use our Services. If you still have any questions or concerns, please contact us at <strong>arnav.nallani@gmail.com</strong>.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">SUMMARY OF KEY POINTS</h2>
                <p className="italic mb-4">
                  <strong>This summary provides key points from our Privacy Notice, but you can find out more details about any of these topics by clicking the link following each key point or by using our table of contents below to find the section you are looking for.</strong>
                </p>
                <div className="space-y-4">
                  <p>
                    <strong>What personal information do we process?</strong> When you visit, use, or navigate our Services, we may process personal information depending on how you interact with us and the Services, the choices you make, and the products and features you use.
                  </p>
                  <p>
                    <strong>Do we process any sensitive personal information?</strong> Some of the information may be considered "special" or "sensitive" in certain jurisdictions, for example your racial or ethnic origins, sexual orientation, and religious beliefs. We may process sensitive personal information when necessary with your consent or as otherwise permitted by applicable law.
                  </p>
                  <p>
                    <strong>Do we collect any information from third parties?</strong> We do not collect any information from third parties.
                  </p>
                  <p>
                    <strong>How do we process your information?</strong> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent.
                  </p>
                  <p>
                    <strong>In what situations and with which parties do we share personal information?</strong> We may share information in specific situations and with specific third parties.
                  </p>
                  <p>
                    <strong>How do we keep your information safe?</strong> We have adequate organizational and technical processes and procedures in place to protect your personal information. However, no electronic transmission over the internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorized third parties will not be able to defeat our security and improperly collect, access, steal, or modify your information.
                  </p>
                  <p>
                    <strong>What are your rights?</strong> Depending on where you are located geographically, the applicable privacy law may mean you have certain rights regarding your personal information.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">1. WHAT INFORMATION DO WE COLLECT?</h2>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Personal information you disclose to us</h3>
                <p>
                  <strong>In Short:</strong> We collect personal information that you provide to us.
                </p>
                <p className="mt-4">
                  We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.
                </p>
                <p className="mt-4">
                  <strong>Personal Information Provided by You.</strong> The personal information that we collect depends on the context of your interactions with us and the Services, the choices you make, and the products and features you use. The personal information we collect may include the following:
                </p>
                <ul className="list-disc ml-6 mt-4 space-y-2">
                  <li>names</li>
                  <li>phone numbers</li>
                  <li>email addresses</li>
                  <li>mailing addresses</li>
                  <li>usernames</li>
                  <li>passwords</li>
                  <li>contact preferences</li>
                  <li>contact or authentication data</li>
                  <li>billing addresses</li>
                </ul>
                <p className="mt-4">
                  <strong>Sensitive Information.</strong> We do not process sensitive information.
                </p>
                <p className="mt-4">
                  <strong>Payment Data.</strong> We may collect data necessary to process your payment if you make purchases, such as your payment instrument number (such as a credit card number), and the security code associated with your payment instrument. All payment data is handled and stored by Stripe and you may find their privacy notice link(s) here: <a href="https://stripe.com/privacy" className="text-blue-600 underline">https://stripe.com/privacy</a>.
                </p>
                <p className="mt-4">
                  All personal information that you provide to us must be true, complete, and accurate, and you must notify us of any changes to such personal information.
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
                  <li><strong>To determine the effectiveness of our marketing and promotional campaigns.</strong> We may process your information to better understand how to provide marketing and promotional campaigns that are most relevant to you.</li>
                  <li><strong>To save or protect an individual's vital interest.</strong> We may process your information when necessary to save or protect an individual's vital interest, such as to prevent harm.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">3. WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR INFORMATION?</h2>
                <p>
                  <strong>In Short:</strong> We only process your personal information when we believe it is necessary and we have a valid legal reason (i.e., legal basis) to do so under applicable law, like with your consent, to comply with laws, to provide you with services to enter into or fulfill our contractual obligations, to protect your rights, or to fulfill our legitimate business interests.
                </p>
                <p className="mt-4">
                  <strong>If you are located in the EU or UK, this section applies to you.</strong>
                </p>
                <p className="mt-4">
                  The General Data Protection Regulation (GDPR) and UK GDPR require us to explain the valid legal bases we rely on in order to process your personal information. As such, we may rely on the following legal bases to process your personal information:
                </p>
                <ul className="list-disc ml-6 mt-4 space-y-2">
                  <li><strong>Consent.</strong> We may process your information if you have given us permission (i.e., consent) to use your personal information for a specific purpose.</li>
                  <li><strong>Performance of a Contract.</strong> We may process your personal information when we believe it is necessary to fulfill our contractual obligations to you, including providing our Services or at your request prior to entering into a contract with you.</li>
                  <li><strong>Legitimate Interests.</strong> We may process your information when we believe it is reasonably necessary to achieve our legitimate business interests.</li>
                  <li><strong>Legal Obligations.</strong> We may process your information where we believe it is necessary for compliance with our legal obligations.</li>
                  <li><strong>Vital Interests.</strong> We may process your information where we believe it is necessary to protect your vital interests or the vital interests of a third party.</li>
                </ul>
                <p className="mt-4">
                  <strong>If you are located in Canada, this section applies to you.</strong>
                </p>
                <p className="mt-4">
                  We may process your information if you have given us specific permission (i.e., express consent) to use your personal information for a specific purpose, or in situations where your permission can be inferred (i.e., implied consent).
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">4. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</h2>
                <p>
                  <strong>In Short:</strong> We may share information in specific situations described in this section and/or with the following categories of third parties.
                </p>
                <p className="mt-4">
                  <strong>Vendors, Consultants, and Other Third-Party Service Providers.</strong> We may share your data with third-party vendors, service providers, contractors, or agents ("third parties") who perform services for us or on our behalf and require access to such information to do that work.
                </p>
                <p className="mt-4">
                  We may need to share your personal information in the following situations:
                </p>
                <ul className="list-disc ml-6 mt-4 space-y-2">
                  <li><strong>Business Transfers.</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</li>
                  <li><strong>When we use Stripe for payment processing.</strong> We may share your data with Stripe for payment processing. You can find their privacy notice at <a href="https://stripe.com/privacy" className="text-blue-600 underline">https://stripe.com/privacy</a>.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">5. HOW LONG DO WE KEEP YOUR INFORMATION?</h2>
                <p>
                  <strong>In Short:</strong> We keep your information for as long as necessary to fulfill the purposes outlined in this Privacy Notice unless otherwise required by law.
                </p>
                <p className="mt-4">
                  We will only keep your personal information for as long as it is necessary for the purposes set out in this Privacy Notice, unless a longer retention period is required or permitted by law (such as tax, accounting, or other legal requirements). No purpose in this notice will require us keeping your personal information for longer than the period of time in which users have an account with us.
                </p>
                <p className="mt-4">
                  When we have no ongoing legitimate business need to process your personal information, we will either delete or anonymize such information, or, if this is not possible (for example, because your personal information has been stored in backup archives), then we will securely store your personal information and isolate it from any further processing until deletion is possible.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">6. HOW DO WE KEEP YOUR INFORMATION SAFE?</h2>
                <p>
                  <strong>In Short:</strong> We aim to protect your personal information through a system of organizational and technical security measures.
                </p>
                <p className="mt-4">
                  We have implemented appropriate and reasonable technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorized third parties will not be able to defeat our security and improperly collect, access, steal, or modify your information. Although we will do our best to protect your personal information, transmission of personal information to and from our Services is at your own risk. You should only access the Services within a secure environment.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">7. WHAT ARE YOUR PRIVACY RIGHTS?</h2>
                <p>
                  <strong>In Short:</strong> In some regions, such as the European Economic Area (EEA), United Kingdom (UK), Switzerland, and Canada, you have rights that allow you greater access to and control over your personal information. You may review, change, or terminate your account at any time, depending on your country, province, or state of residence.
                </p>
                <p className="mt-4">
                  In some regions (like the EEA, UK, Switzerland, and Canada), you have certain rights under applicable data protection laws. These may include the right (i) to request access and obtain a copy of your personal information, (ii) to request rectification or erasure; (iii) to restrict the processing of your personal information; (iv) if applicable, to data portability; and (v) not to be subject to automated decision-making. In certain circumstances, you may also have the right to object to the processing of your personal information.
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
                <p className="mt-4">
                  If you have questions or comments about your privacy rights, you may email us at <strong>arnav.nallani@gmail.com</strong>.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">8. CONTROLS FOR DO-NOT-TRACK FEATURES</h2>
                <p>
                  Most web browsers and some mobile operating systems and mobile applications include a Do-Not-Track ("DNT") feature or setting you can activate to signal your privacy preference not to have data about your online browsing activities monitored and collected. At this stage, no uniform technology standard for recognizing and implementing DNT signals has been finalized. As such, we do not currently respond to DNT browser signals or any other mechanism that automatically communicates your choice not to be tracked online. If a standard for online tracking is adopted that we must follow in the future, we will inform you about that practice in a revised version of this Privacy Notice.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">9. DO CALIFORNIA RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?</h2>
                <p>
                  <strong>In Short:</strong> Yes, if you are a resident of California, you are granted specific rights regarding access to your personal information.
                </p>
                <p className="mt-4">
                  California Civil Code Section 1798.83, also known as the "Shine The Light" law, permits our users who are California residents to request and obtain from us, once a year and free of charge, information about categories of personal information (if any) we disclosed to third parties for direct marketing purposes and the names and addresses of all third parties with which we shared personal information in the immediately preceding calendar year. If you are a California resident and would like to make such a request, please submit your request in writing to us using the contact information provided below.
                </p>
                <p className="mt-4">
                  If you are under 18 years of age, reside in California, and have a registered account with Services, you have the right to request removal of unwanted data that you publicly post on the Services. To request removal of such data, please contact us using the contact information provided below and include the email address associated with your account and a statement that you reside in California. We will make sure the data is not publicly displayed on the Services, but please be aware that the data may not be completely or comprehensively removed from all our systems (e.g., backups, etc.).
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">10. DO WE MAKE UPDATES TO THIS NOTICE?</h2>
                <p>
                  <strong>In Short:</strong> Yes, we will update this notice as necessary to stay compliant with relevant laws.
                </p>
                <p className="mt-4">
                  We may update this Privacy Notice from time to time. The updated version will be indicated by an updated "Revised" date at the top of this Privacy Notice. If we make material changes to this Privacy Notice, we may notify you either by prominently posting a notice of such changes or by directly sending you a notification. We encourage you to review this Privacy Notice frequently to be informed of how we are protecting your information.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">11. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</h2>
                <p>
                  If you have questions or comments about this notice, you may email us at <strong>arnav.nallani@gmail.com</strong> or contact us by post at:
                </p>
                <div className="mt-4 ml-4">
                  <p>lendibl LLC</p>
                  <p>7800 Kennard Lane</p>
                  <p>San Ramon, CA 94582</p>
                  <p>United States</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">12. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</h2>
                <p>
                  Based on the applicable laws of your country or state of residence in the US, you may have the right to request access to the personal information we collect from you, details about how we have processed it, correct inaccuracies, or delete your personal information. You may also have the right to withdraw your consent to our processing of your personal information. These rights may be limited in some circumstances by applicable law. To request to review, update, or delete your personal information, please fill out and submit a data subject access request.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}