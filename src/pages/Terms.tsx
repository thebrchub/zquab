import { motion } from 'framer-motion';

export default function Terms() {
  return (
    <div className="flex-1 w-full max-w-3xl mx-auto px-4 py-12 md:py-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-4xl font-bold mb-4 text-[var(--text-main)]">Terms of Service</h1>
        <p className="text-[var(--text-muted)]">Please read these terms carefully before using zQuab.</p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass p-8 md:p-10 rounded-3xl border border-[var(--border-color)] text-[var(--text-muted)] space-y-8"
      >
        <section>
          <h2 className="text-2xl font-bold mb-4 text-[var(--text-main)]">1. Acceptance of Terms</h2>
          <p className="leading-relaxed">
            By accessing and using zQuab, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to abide by these terms, please do not use this service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-[var(--text-main)]">2. Age Requirement</h2>
          <p className="leading-relaxed">
            You must be at least 18 years old to use zQuab. By using our platform, you represent and warrant that you meet this age requirement. If you are under 18, you are strictly prohibited from using the service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-[var(--text-main)]">3. User Conduct</h2>
          <p className="leading-relaxed mb-4">
            You are solely responsible for your conduct and any data, text, or information that you submit or post via the service. You agree not to:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Use the service for any illegal or unauthorized purpose.</li>
            <li>Transmit any worms, viruses, or any code of a destructive nature.</li>
            <li>Harass, abuse, or harm another person.</li>
            <li>Spam or solicit other users.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-[var(--text-main)]">4. Termination</h2>
          <p className="leading-relaxed">
            We reserve the right to modify or terminate the service for any reason, without notice at any time. We also reserve the right to refuse service to anyone, block IP addresses, or permanently ban users who violate these Terms of Service.
          </p>
        </section>
      </motion.div>
    </div>
  );
}