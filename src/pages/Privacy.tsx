export default function Privacy() {
  return (
    <main className="w-full max-w-4xl mx-auto px-4 sm:px-8 py-12 md:py-20 bg-[var(--background)] min-h-screen">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-main)] mb-4">Privacy Policy</h1>
        <p className="text-[var(--text-muted)] text-sm md:text-base font-medium">Last Updated: August 2, 2026</p>
      </div>

      <hr className="border-[var(--border-color)] mb-12" />

      <div className="space-y-12 text-[var(--text-main)] text-sm md:text-base leading-relaxed">
        
        {/* Section 1 */}
        <section>
          <h2 className="text-xl font-bold mb-4">1. Introduction</h2>
          <div className="text-[var(--text-muted)] space-y-4">
            <p>
              At zQuab, we believe privacy is a fundamental part of meaningful online conversations. This Privacy Policy explains what information we collect, why we collect it, how we use it, and the choices available to you.
            </p>
            <p>
              By using zQuab, you agree to the practices described in this Privacy Policy.
            </p>
          </div>
        </section>

        <hr className="border-[var(--border-color)]" />

        {/* Section 2 */}
        <section>
          <h2 className="text-xl font-bold mb-4">2. Anonymous by Design</h2>
          <div className="text-[var(--text-muted)] space-y-4">
            <p>
              We designed zQuab to facilitate spontaneous connections without requiring you to expose your identity.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>No account is required to use Stranger Chat.</li>
              <li>Guests are anonymous by default.</li>
              <li>Creating an account is optional (when available).</li>
              <li>You control what profile information you choose to share.</li>
            </ul>
          </div>
        </section>

        <hr className="border-[var(--border-color)]" />

        {/* Section 3 */}
        <section>
          <h2 className="text-xl font-bold mb-4">3. Information We Collect</h2>
          <div className="text-[var(--text-muted)] space-y-6">
            <div>
              <h3 className="font-semibold text-[var(--text-main)] mb-2">Information You Provide</h3>
              <p className="mb-2">If you choose to create a registered account, you may voluntarily provide:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Username</li>
                <li>Profile picture</li>
                <li>Bio</li>
                <li>Optional profile details</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-[var(--text-main)] mb-2">Automatically Collected Information</h3>
              <p className="mb-2">We collect limited technical information to operate the platform, prevent abuse, improve reliability, and enforce our Terms of Service. This includes:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>IP Address</li>
                <li>Browser type and version</li>
                <li>Device type and Operating System</li>
                <li>Language preferences</li>
                <li>Approximate geographic location (Country/Region)</li>
                <li>Connection timestamps</li>
              </ul>
            </div>
          </div>
        </section>

        <hr className="border-[var(--border-color)]" />

        {/* Section 4 */}
        <section>
          <h2 className="text-xl font-bold mb-4">4. Conversations</h2>
          <div className="text-[var(--text-muted)] space-y-4">
            <p>
              Messages exchanged during Stranger Chat are intended to be temporary. We do not build user profiles based on the contents of your conversations. 
            </p>
            <p>
              Conversation handling and storage may evolve as new features are introduced, including registered accounts and direct messaging, but our priority remains minimizing unnecessary data retention.
            </p>
          </div>
        </section>

        <hr className="border-[var(--border-color)]" />

        {/* Section 5 */}
        <section>
          <h2 className="text-xl font-bold mb-4">5. Cookies & Local Storage</h2>
          <div className="text-[var(--text-muted)] space-y-4">
            <p>
              zQuab uses cookies and local browser storage to provide and improve our services. These technologies are strictly used for:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-[var(--text-main)]">Authentication:</strong> Keeping you logged in if you use a registered account.</li>
              <li><strong className="text-[var(--text-main)]">Preferences:</strong> Remembering your settings, such as Dark or Light theme.</li>
              <li><strong className="text-[var(--text-main)]">Security:</strong> Preventing malicious activity and verifying secure connections.</li>
              <li><strong className="text-[var(--text-main)]">Analytics:</strong> Understanding general platform usage to improve performance (if applicable).</li>
            </ul>
          </div>
        </section>

        <hr className="border-[var(--border-color)]" />

        {/* Section 6 */}
        <section>
          <h2 className="text-xl font-bold mb-4">6. How We Use Information</h2>
          <div className="text-[var(--text-muted)] space-y-4">
            <p>We use the collected information to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Operate and maintain the platform.</li>
              <li>Improve reliability and user experience.</li>
              <li>Prevent abuse, spam, and malicious behavior.</li>
              <li>Diagnose technical issues.</li>
              <li>Secure user accounts and infrastructure.</li>
              <li>Enforce our Community Guidelines and Terms of Service.</li>
            </ul>
          </div>
        </section>

        <hr className="border-[var(--border-color)]" />

        {/* Section 7 */}
        <section>
          <h2 className="text-xl font-bold mb-4">7. Sharing Information</h2>
          <div className="text-[var(--text-muted)] space-y-4">
            <p>
              <strong className="text-[var(--text-main)]">We do not sell your personal information.</strong> 
            </p>
            <p>Information may only be shared under the following circumstances:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>When legally required by court order or subpoena.</li>
              <li>To comply with law enforcement investigations.</li>
              <li>To protect the safety and rights of our users.</li>
              <li>To prevent fraud or imminent harm.</li>
              <li>With trusted infrastructure providers who assist in operating zQuab securely.</li>
            </ul>
          </div>
        </section>

        <hr className="border-[var(--border-color)]" />

        {/* Section 8 */}
        <section>
          <h2 className="text-xl font-bold mb-4">8. Data Retention</h2>
          <div className="text-[var(--text-muted)] space-y-4">
            <p>
              Information is retained only for as long as reasonably necessary to operate the platform, comply with legal obligations, and resolve disputes. Guest chats, server logs, and associated temporary data are regularly purged in accordance with our infrastructure lifecycle.
            </p>
          </div>
        </section>

        <hr className="border-[var(--border-color)]" />

        {/* Section 9 */}
        <section>
          <h2 className="text-xl font-bold mb-4">9. Security</h2>
          <div className="text-[var(--text-muted)] space-y-4">
            <p>
              We implement industry-standard encryption, access controls, and active monitoring to secure your data and our infrastructure. However, no platform or transmission of data over the internet is 100% secure. We are designed to maximize user privacy, but you use the platform at your own risk.
            </p>
          </div>
        </section>

        <hr className="border-[var(--border-color)]" />

        {/* Section 10 */}
        <section>
          <h2 className="text-xl font-bold mb-4">10. Children's Privacy</h2>
          <div className="text-[var(--text-muted)] space-y-4">
            <p>
              zQuab is strictly not intended for children. You must be at least 18 years of age to use our platform. If we become aware that a child under the required age has provided personal information, we will take steps to delete such information immediately.
            </p>
          </div>
        </section>

        <hr className="border-[var(--border-color)]" />

        {/* Section 11 */}
        <section>
          <h2 className="text-xl font-bold mb-4">11. International Users</h2>
          <div className="text-[var(--text-muted)] space-y-4">
            <p>
              zQuab operates globally. By using the platform, you understand and acknowledge that your information may be transferred to, stored, and processed in countries outside of your country of residence, where data protection laws may differ.
            </p>
          </div>
        </section>

        <hr className="border-[var(--border-color)]" />

        {/* Section 12 */}
        <section>
          <h2 className="text-xl font-bold mb-4">12. Your Rights</h2>
          <div className="text-[var(--text-muted)] space-y-4">
            <p>Depending on your jurisdiction, you may have the right to request:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Access to the data we hold about you.</li>
              <li>Correction of inaccurate or incomplete data.</li>
              <li>Deletion or removal of your account and associated data (once account features are fully deployed).</li>
            </ul>
          </div>
        </section>

        <hr className="border-[var(--border-color)]" />

        {/* Section 13 */}
        <section>
          <h2 className="text-xl font-bold mb-4">13. Changes to this Policy</h2>
          <div className="text-[var(--text-muted)] space-y-4">
            <p>
              We may update this Privacy Policy from time to time. When we make significant changes, we will update the "Last Updated" date at the top of this document. Continued use of zQuab after these changes constitutes your acceptance of the revised policy.
            </p>
          </div>
        </section>

        <hr className="border-[var(--border-color)]" />

        {/* Section 14 */}
        <section>
          <h2 className="text-xl font-bold mb-4">14. Contact</h2>
          <div className="text-[var(--text-muted)] space-y-4">
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy, please contact us at:
            </p>
            <ul className="space-y-2">
              <li><strong className="text-[var(--text-main)]">Legal Inquiries:</strong> legal@zquab.com</li>
              <li><strong className="text-[var(--text-main)]">General Support:</strong> support@zquab.com</li>
            </ul>
          </div>
        </section>

      </div>
    </main>
  );
}