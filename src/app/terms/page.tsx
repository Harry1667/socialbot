import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — SocialMaster",
  description: "The terms that govern your use of SocialMaster.",
};

const EFFECTIVE_DATE = "2026-05-20";
const CONTACT_EMAIL = "support@socialbot.looptw.com";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-foreground">
      <header className="mb-10 border-b border-border pb-6">
        <p className="text-sm text-muted-foreground">
          服務條款 · Terms of Service
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          SocialMaster Terms of Service
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Effective date: {EFFECTIVE_DATE}
        </p>
      </header>

      <article className="space-y-8 text-[15px] leading-7">
        <section>
          <h2 className="mb-2 text-xl font-semibold">1. Acceptance</h2>
          <p>
            By accessing or using SocialMaster (&quot;the Service&quot;), you
            agree to these Terms of Service. If you do not agree, do not use
            the Service.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">2. The Service</h2>
          <p>
            SocialMaster is a personal content management tool for drafting,
            scheduling, and publishing social media posts to accounts that you
            own or are authorized to manage on Facebook, Instagram, Threads,
            and X. The Service is provided on an &quot;as is&quot; basis and we
            may modify, suspend, or discontinue any part of it at any time.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">
            3. Your Account and Conduct
          </h2>
          <ul className="ml-6 list-disc space-y-2">
            <li>
              You are responsible for the content you publish through the
              Service and for keeping your credentials secure.
            </li>
            <li>
              You agree to comply with the terms of every platform you connect
              (Meta Platform Terms, X Developer Agreement, Threads Terms, etc.)
              in addition to these Terms.
            </li>
            <li>
              You will not use the Service to send spam, harass others, infringe
              intellectual-property rights, distribute malware, automate
              engagement (likes, follows, replies) in violation of platform
              rules, or otherwise break the law.
            </li>
            <li>
              You will not attempt to reverse-engineer, scrape, or overload the
              Service.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">
            4. Third-Party Platforms
          </h2>
          <p>
            The Service relies on official APIs from Meta, X, and Threads.
            Those platforms may change, throttle, or revoke API access without
            notice; we are not responsible for outages or rejected posts caused
            by upstream changes. Your use of those platforms is governed by
            their own terms, which you accept when you connect an account.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">
            5. Intellectual Property
          </h2>
          <p>
            You retain all rights to the content you create with the Service.
            You grant us a limited, non-exclusive license to store and
            transmit that content solely to operate the Service on your behalf.
            All Service code, design, and trademarks remain our property.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">6. Fees and Usage</h2>
          <p>
            The Service is currently provided free of charge. Connecting to X
            via its pay-per-use API may incur charges billed directly by X to
            the developer account you authorize; we do not control or rebate
            those fees.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">7. Termination</h2>
          <p>
            You may stop using the Service at any time and request deletion of
            your data per our{" "}
            <Link href="/privacy" className="underline">
              Privacy Policy
            </Link>
            . We may suspend or terminate access if you violate these Terms or
            if required by law.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">8. Disclaimer</h2>
          <p>
            The Service is provided &quot;as is&quot; and &quot;as
            available,&quot; without warranties of any kind, express or
            implied, including merchantability, fitness for a particular
            purpose, and non-infringement. We do not guarantee uninterrupted,
            error-free, or secure operation.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">
            9. Limitation of Liability
          </h2>
          <p>
            To the maximum extent permitted by law, we are not liable for
            indirect, incidental, special, consequential, or punitive damages,
            or any loss of profits, data, or goodwill arising out of or related
            to your use of the Service.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">10. Governing Law</h2>
          <p>
            These Terms are governed by the laws of Taiwan, R.O.C., without
            regard to its conflict-of-law principles. Disputes shall be
            resolved in the Taiwan Taipei District Court as the court of first
            instance.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">11. Changes</h2>
          <p>
            We may revise these Terms from time to time. The effective date at
            the top of this page will reflect the most recent revision.
            Continued use of the Service after a revision constitutes
            acceptance.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">12. Contact</h2>
          <p>
            Questions:{" "}
            <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
          </p>
        </section>
      </article>

      <footer className="mt-16 flex items-center justify-between border-t border-border pt-6 text-sm text-muted-foreground">
        <Link href="/privacy" className="underline">
          ← Privacy Policy
        </Link>
        <Link href="/" className="underline">
          Home →
        </Link>
      </footer>
    </main>
  );
}
