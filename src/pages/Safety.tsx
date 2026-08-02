import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function Safety() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "Is zQuab anonymous?",
      a: "Yes. You can start chatting without creating an account. When accounts are introduced, you'll still control how much information you choose to share."
    },
    {
      q: "Is zQuab free?",
      a: "Yes. Stranger Chat is free to use."
    },
    {
      q: "Can I block someone?",
      a: "Blocking features will become available for registered users in a future update."
    },
    {
      q: "Can I report abusive behaviour?",
      a: "Reporting tools are currently under development and will be introduced alongside account-based moderation features."
    },
    {
      q: "Should I share my personal information?",
      a: "No. We recommend keeping conversations anonymous until you genuinely trust the other person."
    }
  ];

  return (
    <main className="w-full max-w-4xl mx-auto px-4 sm:px-8 py-10 md:py-12 bg-[var(--background)] min-h-screen">
      
      {/* Header */}
      <div className="mb-10 border-b border-[var(--border-color)] pb-6">
        <h1 className="text-3xl font-bold text-[var(--text-main)] mb-2">Trust & Safety Policy</h1>
        <p className="text-sm text-[var(--text-muted)]">
          At zQuab, we believe the best conversations happen when people feel safe, respected, and in control. This document outlines our guidelines and your responsibilities while using our platform.
        </p>
      </div>

      <div className="space-y-10 text-[var(--text-main)] text-sm sm:text-base leading-relaxed">
        
        {/* Section 1 */}
        <section>
          <h2 className="text-xl font-bold mb-4">1. Community Guidelines</h2>
          <p className="text-[var(--text-muted)] mb-4">
            Every conversation on zQuab starts with mutual respect. These guidelines help keep the experience enjoyable for everyone.
          </p>
          <ul className="list-disc pl-5 space-y-3 text-[var(--text-muted)]">
            <li><strong className="text-[var(--text-main)]">Be Respectful:</strong> Treat the person on the other side as a real human being. Harassment, hate speech, bullying, discrimination, or intimidation have no place on zQuab.</li>
            <li><strong className="text-[var(--text-main)]">Keep It Clean:</strong> Avoid sharing explicit content, illegal material, or unwanted sexual advances. Respect boundaries.</li>
            <li><strong className="text-[var(--text-main)]">Protect Your Privacy:</strong> Never share sensitive personal information such as your home address, financial information, passwords, or government identification.</li>
            <li><strong className="text-[var(--text-main)]">Respect Consent:</strong> If someone does not want to continue the conversation, respect their decision. A meaningful conversation should always be voluntary.</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section>
          <h2 className="text-xl font-bold mb-4">2. Privacy First</h2>
          <div className="text-[var(--text-muted)] space-y-3">
            <p>
              Unlike many online platforms, zQuab is built around conversations—not collecting personal information.
            </p>
            <p>
              We encourage users to protect their identity while chatting and to only share personal details when they genuinely trust the other person. Your privacy is your responsibility, and we are committed to giving you the tools to stay in control.
            </p>
          </div>
        </section>

        {/* Section 3 */}
        <section>
          <h2 className="text-xl font-bold mb-4">3. Staying Safe While Chatting</h2>
          <p className="text-[var(--text-muted)] mb-4">
            Keep these practices in mind to ensure your online chats remain positive and secure:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-[var(--text-muted)]">
            <li>Avoid sharing your exact location.</li>
            <li>Never send passwords or banking information.</li>
            <li>Be cautious when moving conversations to other platforms.</li>
            <li>Trust your instincts. If something feels wrong, leave the conversation.</li>
            <li>Remember that it is okay to end a chat at any time.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section>
          <h2 className="text-xl font-bold mb-4">4. Reporting & Blocking</h2>
          <p className="text-[var(--text-muted)]">
            As zQuab evolves, we will introduce reporting and blocking tools for registered users to help maintain a healthy community. During our early release, we encourage users to simply leave any conversation that makes them uncomfortable. Your comfort and safety always come first.
          </p>
        </section>

        {/* Section 5 */}
        <section>
          <h2 className="text-xl font-bold mb-4">5. Our Philosophy</h2>
          <div className="text-[var(--text-muted)] space-y-3">
            <p>
              Technology should make it easier to meet people, not harder to trust them. Our mission is not simply to connect strangers; it is to create an environment where conversations feel natural, respectful, and meaningful.
            </p>
            <p>
              Every feature we build is guided by three principles: Privacy, Simplicity, and Human Connection.
            </p>
          </div>
        </section>

        {/* Section 6 - FAQ */}
        <section className="pt-4">
          <h2 className="text-xl font-bold mb-4">6. Frequently Asked Questions</h2>
          <div className="border-t border-[var(--border-color)]">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-[var(--border-color)]">
                <button 
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between py-4 text-left focus:outline-none"
                >
                  <span className="font-semibold text-[var(--text-main)] text-sm sm:text-base pr-4">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-[var(--text-muted)] flex-shrink-0 transition-transform duration-200 ${openFaq === index ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === index && (
                  <div className="pb-4 text-[var(--text-muted)] text-sm sm:text-base leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}