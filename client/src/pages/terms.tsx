import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useEffect } from "react";

export default function TermsOfService() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center text-gray-dark">
              TERMS OF SERVICE
            </CardTitle>
            <p className="text-center text-gray-medium mt-2">
              <strong>Last updated: July 06, 2025</strong>
            </p>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">AGREEMENT TO OUR LEGAL TERMS</h2>
            
            <p>
              We are <strong>lendibl LLC</strong>, doing business as <strong>lendibl</strong> ("Company," "we," "us," "our"), 
              a company registered in California, United States at 7800 Kennard Lane, San Ramon, CA 94582.
            </p>

            <p>
              We operate the website <a href="https://lendibl.com" className="text-blue-600 hover:underline">https://lendibl.com</a> (the "Site"), 
              as well as any other related products and services that refer or link to these legal terms (the "Legal Terms") 
              (collectively, the "Services").
            </p>

            <p>
              <strong>We provide a platform that allows anyone to rent anything from anyone else close-by.</strong>
            </p>

            <p>
              You can contact us by phone at <strong>925-336-5339</strong>, email at <strong>arnav.nallani@gmail.com</strong>, 
              or by mail to 7800 Kennard Lane, San Ramon, CA 94582, United States.
            </p>

            <p>
              These Legal Terms constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you"), 
              and lendibl LLC, concerning your access to and use of the Services. You agree that by accessing the Services, 
              you have read, understood, and agreed to be bound by all of these Legal Terms. 
              <strong>IF YOU DO NOT AGREE WITH ALL OF THESE LEGAL TERMS, THEN YOU ARE EXPRESSLY PROHIBITED FROM USING THE SERVICES 
              AND YOU MUST DISCONTINUE USE IMMEDIATELY.</strong>
            </p>

            <p>
              We will provide you with prior notice of any scheduled changes to the Services you are using. The modified Legal Terms 
              will become effective upon posting or notifying you by arnav.nallani@gmail.com, as stated in the email message. 
              By continuing to use the Services after the effective date of any changes, you agree to be bound by the modified terms.
            </p>

            <p>
              <strong>The Services are intended for users who are at least 18 years old. Persons under the age of 18 are not permitted 
              to use or register for the Services.</strong>
            </p>

            <p>We recommend that you print a copy of these Legal Terms for your records.</p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">1. OUR SERVICES</h2>
            <p>
              The information provided when using the Services is not intended for distribution to or use by any person or entity 
              in any jurisdiction or country where such distribution or use would be contrary to law or regulation or which would 
              subject us to any registration requirement within such jurisdiction or country. Accordingly, those persons who choose 
              to access the Services from other locations do so on their own initiative and are solely responsible for compliance 
              with local laws, if and to the extent local laws are applicable.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">Platform Role</h3>
            <p>
              <strong>lendibl acts solely as a platform provider.</strong> We do not own, control, or manage any items listed on our marketplace. 
              All rental agreements are directly between the lender (owner) and renter. lendibl facilitates these connections but is not 
              a party to any rental transactions.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">2. USER RESPONSIBILITIES AND ASSUMPTION OF RISK</h2>
            
            <h3 className="text-lg font-semibold mt-6 mb-3">Lender Responsibilities</h3>
            <ul className="list-disc ml-6 space-y-2">
              <li>Ensure items are safe, functional, and described accurately</li>
              <li>Provide honest condition assessments and complete item descriptions</li>
              <li>May specify security deposit requirements when listing items</li>
              <li>May request documentation from renters if damage or loss occurs</li>
            </ul>

            <h3 className="text-lg font-semibold mt-6 mb-3">Renter Responsibilities</h3>
            <ul className="list-disc ml-6 space-y-2">
              <li>Return items in the same condition they were received</li>
              <li>You are responsible for the item's condition from pick-up to return</li>
              <li>If damaged, lost, or stolen during your rental period, you must notify the lender immediately and arrange compensation</li>
              <li>If an item is damaged, lost, or stolen, you agree to compensate the lender at fair market value</li>
            </ul>

            <h3 className="text-lg font-semibold mt-6 mb-3">Assumption of Risk</h3>
            <p>
              <strong>You acknowledge that engaging in peer-to-peer rentals carries inherent risks.</strong> You agree that any use of rented 
              items is at your own risk. By participating in any transaction on lendibl, you expressly acknowledge and agree that you are 
              renting or lending at your own risk.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">3. INTELLECTUAL PROPERTY RIGHTS</h2>
            
            <h3 className="text-lg font-semibold mt-6 mb-3">Our intellectual property</h3>
            <p>
              We are the owner or the licensee of all intellectual property rights in our Services, including all source code, 
              databases, functionality, software, website designs, audio, video, text, photographs, and graphics in the Services 
              (collectively, the "Content"), as well as the trademarks, service marks, and logos contained therein (the "Marks").
            </p>
            
            <p>
              Our Content and Marks are protected by copyright and trademark laws (and various other intellectual property rights 
              and unfair competition laws) and treaties in the United States and around the world.
            </p>
            
            <p>
              The Content and Marks are provided in or through the Services "AS IS" for your personal, non-commercial use or 
              internal business purpose only.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">Your use of our Services</h3>
            <p>
              Subject to your compliance with these Legal Terms, including the "PROHIBITED ACTIVITIES" section below, we grant you 
              a non-exclusive, non-transferable, revocable license to: access the Services; and download or print a copy of any 
              portion of the Content to which you have properly gained access solely for your personal, non-commercial use or 
              internal business purpose.
            </p>
            
            <p>
              Except as set out in this section or elsewhere in our Legal Terms, no part of the Services and no Content or Marks 
              may be copied, reproduced, aggregated, republished, uploaded, posted, publicly displayed, encoded, translated, 
              transmitted, distributed, sold, licensed, or otherwise exploited for any commercial purpose whatsoever, without our 
              express prior written permission.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">3. USER REPRESENTATIONS</h2>
            <p>By using the Services, you represent and warrant that:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>All registration information you submit will be true, accurate, current, and complete</li>
              <li>You will maintain the accuracy of such information and promptly update such registration information as necessary</li>
              <li>You have the legal capacity and you agree to comply with these Legal Terms</li>
              <li>You are not a minor in the jurisdiction in which you reside</li>
              <li>You will not access the Services through automated or non-human means</li>
              <li>You will not use the Services for any illegal or unauthorized purpose</li>
              <li>Your use of the Services will not violate any applicable law or regulation</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8 mb-4">4. PROHIBITED ACTIVITIES</h2>
            <p>
              You may not access or use the Services for any purpose other than that for which we make the Services available. 
              The Services may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.
            </p>
            <p>As a user of the Services, you agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Systematically retrieve data or other content from the Services to create or compile a collection, database, or directory</li>
              <li>Trick, defraud, or mislead us and other users, especially in any attempt to learn sensitive account information</li>
              <li>Circumvent, disable, or otherwise interfere with security-related features of the Services</li>
              <li>Disparage, tarnish, or otherwise harm, in our opinion, us and/or the Services</li>
              <li>Use any information obtained from the Services in order to harass, abuse, or harm another person</li>
              <li>Make improper use of our support services or submit false reports of abuse or misconduct</li>
              <li>Use the Services in a manner inconsistent with any applicable laws or regulations</li>
              <li>Engage in unauthorized framing of or linking to the Services</li>
              <li>Upload or transmit viruses, Trojan horses, or other material that interferes with any party's uninterrupted use of the Services</li>
              <li>Engage in any automated use of the system, such as using scripts to send comments or messages</li>
              <li>Delete the copyright or other proprietary rights notice from any Content</li>
              <li>Attempt to impersonate another user or person or use the username of another user</li>
              <li>Upload or transmit any material that acts as a passive or active information collection or transmission mechanism</li>
              <li>Interfere with, disrupt, or create an undue burden on the Services or the networks or services connected to the Services</li>
              <li>Harass, annoy, intimidate, or threaten any of our employees or agents engaged in providing any portion of the Services to you</li>
              <li>Attempt to bypass any measures of the Services designed to prevent or restrict access to the Services</li>
              <li>Copy or adapt the Services' software, including but not limited to Flash, PHP, HTML, JavaScript, or other code</li>
              <li>Except as permitted by applicable law, decipher, decompile, disassemble, or reverse engineer any of the software comprising or in any way making up a part of the Services</li>
              <li>Except as may be the result of standard search engine or Internet browser usage, use, launch, develop, or distribute any automated system</li>
              <li>Use a buying agent or purchasing agent to make purchases on the Services</li>
              <li>Make any unauthorized use of the Services, including collecting usernames and/or email addresses of users by electronic or other means</li>
              <li>Use the Services as part of any effort to compete with us or otherwise use the Services and/or the Content for any revenue-generating endeavor or commercial enterprise</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8 mb-4">5. PAYMENT TERMS AND CANCELLATION POLICY</h2>
            <p>
              All payments are processed through Stripe. By making a booking, you authorize Lendibl to charge your payment method 
              for the total rental cost including applicable fees. Lendibl charges a 6% service fee on all successful rentals.
            </p>
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

            <h2 className="text-2xl font-semibold mt-8 mb-4">6. LIABILITY FOR RENTAL ITEMS</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-6">
              <h3 className="text-lg font-semibold text-red-800 mb-3">Owner and Renter Liability:</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-red-700 mb-2">Owner Liability:</h4>
                  <p className="text-red-700">
                    <strong>Owners take FULL RESPONSIBILITY for giving damaged items or for misleading the renter into thinking they are getting something they're not.</strong> 
                    This includes but is not limited to providing items that are broken, non-functional, significantly different from the description, 
                    or in worse condition than represented in the listing.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-red-700 mb-2">Renter Liability:</h4>
                  <p className="text-red-700">
                    <strong>Renters take FULL RESPONSIBILITY for damaging items that they rent or misleading the owner into thinking the item they give back is functional when it isn't in reality.</strong> 
                    This includes but is not limited to causing physical damage, loss, theft, or returning items in worse condition than received 
                    without proper disclosure.
                  </p>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mt-3 italic">
                Both parties are expected to act in good faith and provide accurate representations of item condition throughout the rental process.
              </p>
            </div>

            <h2 className="text-2xl font-semibold mt-8 mb-4">7. DAMAGE, LOSS, AND DISPUTE POLICY</h2>
            <p>
              At lendibl, we strive to provide a safe and trusted marketplace. However, as a peer-to-peer platform, the responsibility 
              for item care and return lies with the users.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">Dispute Handling</h3>
            <ul className="list-disc ml-6 space-y-2">
              <li>lendibl provides a Dispute Reporting Tool within the app for transparency</li>
              <li>lendibl may facilitate communication between parties in case of disputes but is not obligated to resolve them</li>
              <li>lendibl can offer mediation support but does not guarantee resolution outcomes</li>
              <li>All disputes are ultimately between the lender and renter</li>
            </ul>

            <h3 className="text-lg font-semibold mt-6 mb-3">No Guarantees or Insurance</h3>
            <p>
              <strong>lendibl does not provide any insurance, warranties, or guarantees regarding the condition, quality, or safety of items.</strong> 
              We are actively evaluating insurance and protection options to offer enhanced security to our community in the future.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">8. USER REGISTRATION</h2>
            <p>
              You may be required to register to use the Services. You agree to keep your password confidential and will be responsible 
              for all use of your account and password. We reserve the right to remove, reclaim, or change a username you select if we 
              determine, in our sole discretion, that such username is inappropriate, obscene, or otherwise objectionable.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">9. SERVICES MANAGEMENT</h2>
            <p>
              We reserve the right, but not the obligation, to: (1) monitor the Services for violations of these Legal Terms; 
              (2) take appropriate legal action against anyone who, in our sole discretion, violates the law or these Legal Terms, 
              including without limitation, reporting such user to law enforcement authorities; (3) in our sole discretion and without 
              limitation, refuse, restrict access to, limit the availability of, or disable (to the extent technologically feasible) 
              any of your Contributions or any portion thereof; (4) in our sole discretion and without limitation, notice, or liability, 
              to remove from the Services or otherwise disable all files and content that are excessive in size or are in any way 
              burdensome to our systems; and (5) otherwise manage the Services in a manner designed to protect our rights and property 
              and to facilitate the proper functioning of the Services.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">10. PRIVACY POLICY</h2>
            <p>
              We care about data privacy and security. Please review our Privacy Policy: <a href="/privacy-policy" className="text-blue-600 hover:underline">https://lendibl.com/privacy-policy</a>. 
              By using the Services, you agree to be bound by our Privacy Policy, which is incorporated into these Legal Terms. 
              Please be advised the Services are hosted in the United States. If you access the Services from any other region of the world 
              with laws or other requirements governing personal data collection, use, or disclosure that differ from applicable laws in 
              the United States, then through your continued use of the Services, you are transferring your data to the United States, 
              and you expressly consent to have your data transferred to and processed in the United States.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">11. LIMITATION OF LIABILITY AND WAIVER</h2>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 my-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-3">⚠️ WAIVER AND RELEASE OF LIABILITY</h3>
              <p className="text-yellow-700 mb-4">
                By participating in any transaction on lendibl, you expressly acknowledge and agree:
              </p>
              <ul className="list-disc ml-6 text-yellow-700 space-y-2">
                <li>You are renting or lending at your own risk</li>
                <li>You release lendibl, its affiliates, officers, and employees from any and all claims, liabilities, damages, injuries, or losses arising from or connected to your use of the platform</li>
                <li>This waiver applies to personal injury, property damage, financial loss, or any other harm experienced during a rental transaction</li>
              </ul>
            </div>

            <p>
              <strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW, LENDIBL IS NOT LIABLE FOR ANY DAMAGES, LOSSES, INJURIES, OR CLAIMS ARISING OUT OF OR RELATED TO RENTALS FACILITATED ON THE PLATFORM.</strong>
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">12. INDEMNIFICATION</h2>
            <p>
              You agree to indemnify and hold harmless lendibl from any claims, damages, or liabilities arising from your use of the platform or any rental activities. 
              This includes but is not limited to legal fees, court costs, and any settlements or judgments related to disputes between users.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">13. TERM AND TERMINATION</h2>
            <p>
              These Legal Terms shall remain in full force and effect while you use the Services. WITHOUT LIMITING ANY OTHER PROVISION 
              OF THESE LEGAL TERMS, WE RESERVE THE RIGHT TO, IN OUR SOLE DISCRETION AND WITHOUT NOTICE OR LIABILITY, DENY ACCESS TO 
              AND USE OF THE SERVICES (INCLUDING BLOCKING CERTAIN IP ADDRESSES), TO ANY PERSON FOR ANY REASON OR FOR NO REASON, 
              INCLUDING WITHOUT LIMITATION FOR BREACH OF ANY REPRESENTATION, WARRANTY, OR COVENANT CONTAINED IN THESE LEGAL TERMS 
              OR OF ANY APPLICABLE LAW OR REGULATION. WE MAY TERMINATE YOUR USE OR PARTICIPATION IN THE SERVICES OR DELETE YOUR ACCOUNT 
              AND ANY CONTENT OR INFORMATION THAT YOU POSTED AT ANY TIME, WITHOUT WARNING, IN OUR SOLE DISCRETION.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">14. MODIFICATIONS AND INTERRUPTIONS</h2>
            <p>
              We reserve the right to change, modify, or remove the contents of the Services at any time or for any reason 
              at our sole discretion without notice. However, we have no obligation to update any information on our Services. 
              We will not be liable to you or any third party for any modification, price change, suspension, or discontinuance 
              of the Services.
            </p>
            
            <p>
              We cannot guarantee the Services will be available at all times. We may experience hardware, software, or other 
              problems or need to perform maintenance related to the Services, resulting in interruptions, delays, or errors. 
              We reserve the right to change, revise, update, suspend, discontinue, or otherwise modify the Services at any time 
              or for any reason without notice to you.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">15. GOVERNING LAW</h2>
            <p>
              These Legal Terms shall be governed by and defined following the laws of California, United States. 
              lendibl LLC and yourself irrevocably consent that the courts of California, United States shall have 
              exclusive jurisdiction to resolve any dispute which may arise in connection with these Legal Terms.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">16. DISPUTE RESOLUTION</h2>
            
            <h3 className="text-lg font-semibold mt-6 mb-3">Informal Negotiations</h3>
            <p>
              To expedite resolution and control the cost of any dispute, controversy, or claim related to these Legal Terms 
              (each a "Dispute" and collectively, the "Disputes") brought by either you or us (individually, a "Party" and 
              collectively, the "Parties"), the Parties agree to first attempt to negotiate any Dispute (except those Disputes 
              expressly provided below) informally for at least thirty (30) days before initiating arbitration. Such informal 
              negotiations commence upon written notice from one Party to the other Party.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">Binding Arbitration</h3>
            <p>
              Any dispute arising out of or in connection with these Legal Terms, including any question regarding its existence, 
              validity, or termination, shall be referred to and finally resolved by the International Commercial Arbitration Court 
              under the European Arbitration Chamber (Belgium, Brussels, Avenue Louise, 146) according to the Rules of this ICAC, 
              which, as a result of referring to it, is considered as the part of this clause. The number of arbitrators shall be three (3). 
              The seat, or legal place, or arbitration shall be San Ramon, California, United States. The language of the proceedings 
              shall be English. The governing law of these Legal Terms shall be substantive law of California, United States.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">17. CORRECTIONS</h2>
            <p>
              There may be information on the Services that contains typographical errors, inaccuracies, or omissions, including 
              descriptions, pricing, availability, and various other information. We reserve the right to correct any errors, 
              inaccuracies, or omissions and to change or update the information on the Services at any time, without prior notice.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">18. DISCLAIMER</h2>
            <p>
              THE SERVICES ARE PROVIDED ON AN AS-IS AND AS-AVAILABLE BASIS. YOU AGREE THAT YOUR USE OF THE SERVICES WILL BE AT YOUR 
              SOLE RISK. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, IN CONNECTION WITH 
              THE SERVICES AND YOUR USE THEREOF, INCLUDING, WITHOUT LIMITATION, THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS 
              FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE MAKE NO WARRANTIES OR REPRESENTATIONS ABOUT THE ACCURACY OR 
              COMPLETENESS OF THE SERVICES' CONTENT OR THE CONTENT OF ANY WEBSITES OR MOBILE APPLICATIONS LINKED TO THE SERVICES 
              AND WE WILL ASSUME NO LIABILITY OR RESPONSIBILITY FOR ANY (1) ERRORS, MISTAKES, OR INACCURACIES OF CONTENT AND MATERIALS, 
              (2) PERSONAL INJURY OR PROPERTY DAMAGE, OF ANY NATURE WHATSOEVER, RESULTING FROM YOUR ACCESS TO AND USE OF THE SERVICES, 
              (3) ANY UNAUTHORIZED ACCESS TO OR USE OF OUR SECURE SERVERS AND/OR ANY AND ALL PERSONAL INFORMATION AND/OR FINANCIAL 
              INFORMATION STORED THEREIN, (4) ANY INTERRUPTION OR CESSATION OF TRANSMISSION TO OR FROM THE SERVICES, (5) ANY BUGS, 
              VIRUSES, TROJAN HORSES, OR THE LIKE WHICH MAY BE TRANSMITTED TO OR THROUGH THE SERVICES BY ANY THIRD PARTY, AND/OR 
              (6) ANY ERRORS OR OMISSIONS IN ANY CONTENT AND MATERIALS OR FOR ANY LOSS OR DAMAGE OF ANY KIND INCURRED AS A RESULT 
              OF THE USE OF ANY CONTENT POSTED, TRANSMITTED, OR OTHERWISE MADE AVAILABLE VIA THE SERVICES.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">19. LIMITATIONS OF LIABILITY</h2>
            <p>
              IN NO EVENT WILL WE OR OUR DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY DIRECT, INDIRECT, 
              CONSEQUENTIAL, EXEMPLARY, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFIT, LOST REVENUE, LOSS OF DATA, 
              OR OTHER DAMAGES ARISING FROM YOUR USE OF THE SERVICES, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. 
              NOTWITHSTANDING ANYTHING TO THE CONTRARY CONTAINED HEREIN, OUR LIABILITY TO YOU FOR ANY CAUSE WHATSOEVER AND REGARDLESS 
              OF THE FORM OF THE ACTION, WILL AT ALL TIMES BE LIMITED TO THE AMOUNT PAID, IF ANY, BY YOU TO US DURING THE SIX (6) MONTH 
              PERIOD PRIOR TO ANY CAUSE OF ACTION ARISING.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">17. INDEMNIFICATION</h2>
            <p>
              You agree to defend, indemnify, and hold us harmless, including our subsidiaries, affiliates, and all of our respective 
              officers, agents, partners, and employees, from and against any loss, damage, liability, claim, or demand, including 
              reasonable attorneys' fees and expenses, made by any third party due to or arising out of: (1) your Contributions; 
              (2) use of the Services; (3) breach of these Legal Terms; (4) any breach of your representations and warranties set 
              forth in these Legal Terms; (5) your violation of the rights of a third party, including but not limited to intellectual 
              property rights; or (6) any overt harmful act toward any other user of the Services with whom you connected via the Services.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">18. USER DATA</h2>
            <p>
              We will maintain certain data that you transmit to the Services for the purpose of managing the performance of the Services, 
              as well as data relating to your use of the Services. Although we perform regular routine backups of data, you are solely 
              responsible for all data that you transmit or that relates to any activity you have undertaken using the Services. You agree 
              that we shall have no liability to you for any loss or corruption of any such data, and you hereby waive any right of action 
              against us arising from any such loss or corruption of such data.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">19. CONTACT US</h2>
            <p>
              In order to resolve a complaint regarding the Services or to receive further information regarding use of the Services, 
              please contact us at:
            </p>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
              <p><strong>lendibl LLC</strong></p>
              <p>7800 Kennard Lane</p>
              <p>San Ramon, CA 94582</p>
              <p>United States</p>
              <p><strong>Phone:</strong> 925-336-5339</p>
              <p><strong>Email:</strong> legal@lendibl.com</p>
            </div>

            <div className="border-t border-gray-200 pt-6 mt-8">
              <p className="text-sm text-gray-500 text-center">By using lendibl, you acknowledge that you have read, understood, and agree to be bound by these Legal Terms. These Legal Terms constitute the sole and entire agreement between you and lendibl LLC regarding the Services and supersede all prior and contemporaneous understandings, agreements, representations, and warranties, both written and oral, regarding the Services.</p>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}