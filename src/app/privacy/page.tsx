import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — SocialMaster",
  description:
    "How SocialMaster collects, uses, and protects your information.",
};

const EFFECTIVE_DATE = "2026-05-20";
const CONTACT_EMAIL = "privacy@socialbot.looptw.com";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-foreground">
      <header className="mb-10 border-b border-border pb-6">
        <p className="text-sm text-muted-foreground">
          隱私權政策 · Privacy Policy
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          SocialMaster Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Effective date: {EFFECTIVE_DATE}
        </p>
      </header>

      <article className="space-y-8 text-[15px] leading-7">
        <section>
          <h2 className="mb-2 text-xl font-semibold">1. Introduction</h2>
          <p>
            SocialMaster (&quot;the Service&quot;, &quot;we&quot;,
            &quot;us&quot;) is a personal content management tool that helps
            authorized users draft, schedule, and publish posts to social media
            accounts they own or manage, including Facebook Pages, Instagram
            Business accounts, Threads, and X (Twitter). This policy explains
            what we collect, why we collect it, and the choices you have.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">
            2. Information We Collect
          </h2>
          <ul className="ml-6 list-disc space-y-2">
            <li>
              <strong>Account identifiers.</strong> When you connect a social
              account via OAuth, we receive your platform user ID, display
              name, and the access/refresh tokens needed to act on your
              behalf.
            </li>
            <li>
              <strong>Content you create.</strong> Drafts, articles, hooks,
              schedules, hashtags, and media you upload to the Service.
            </li>
            <li>
              <strong>Publishing results.</strong> The external post ID, URL,
              and status returned by each platform after we publish on your
              behalf.
            </li>
            <li>
              <strong>Operational logs.</strong> Minimal request logs (IP,
              timestamp, endpoint) retained for security and debugging.
            </li>
          </ul>
          <p className="mt-3">
            We do <strong>not</strong> collect data from your social media
            audience beyond what is necessary to display your own posts and
            engagement metrics inside the Service.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">
            3. How We Use Information
          </h2>
          <ul className="ml-6 list-disc space-y-2">
            <li>
              To publish content to the social accounts you have explicitly
              connected.
            </li>
            <li>To store and display your drafts, schedules, and history.</li>
            <li>
              To refresh OAuth tokens before they expire so scheduled posts can
              continue to publish.
            </li>
            <li>To diagnose errors and protect the Service from abuse.</li>
          </ul>
          <p className="mt-3">
            We do not sell your data, use it for advertising, or train any
            third-party machine learning models with it.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">4. Third Parties</h2>
          <p>
            The Service interacts with the official APIs of Meta (Facebook /
            Instagram), Threads, and X under the permissions you grant. Their
            handling of your data is governed by their own policies:
          </p>
          <ul className="ml-6 mt-2 list-disc space-y-1">
            <li>
              Meta —{" "}
              <a
                className="underline"
                href="https://www.facebook.com/privacy/policy/"
                target="_blank"
                rel="noreferrer"
              >
                facebook.com/privacy/policy
              </a>
            </li>
            <li>
              X (Twitter) —{" "}
              <a
                className="underline"
                href="https://x.com/en/privacy"
                target="_blank"
                rel="noreferrer"
              >
                x.com/en/privacy
              </a>
            </li>
          </ul>
          <p className="mt-3">
            Media you upload is stored on Cloudflare R2 object storage. We do
            not share your content with any other third party.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">5. Data Retention</h2>
          <p>
            We retain your content, connected-account records, and publishing
            history for as long as your account remains active. You may delete
            individual records at any time through the Service. When you
            disconnect a social account, we revoke and delete the corresponding
            access and refresh tokens within 24 hours.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">6. Your Rights</h2>
          <ul className="ml-6 list-disc space-y-2">
            <li>
              <strong>Access.</strong> Request a copy of the data we hold about
              you.
            </li>
            <li>
              <strong>Correction.</strong> Edit any draft, schedule, or
              connected-account label inside the Service.
            </li>
            <li>
              <strong>Deletion.</strong> Delete your account and all associated
              data by emailing{" "}
              <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>
              . We will confirm deletion within 30 days.
            </li>
            <li>
              <strong>Withdraw consent.</strong> You can revoke our access at
              any time from your Facebook, Instagram, Threads, or X settings;
              the next API call we make will fail and we will mark the account
              inactive.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">7. Security</h2>
          <p>
            Access tokens are transmitted over TLS and stored in a database
            protected by network-level access controls. We minimize the number
            of people with production access and review that list periodically.
            No system is perfectly secure; please report any suspected
            vulnerability to{" "}
            <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">8. Children</h2>
          <p>
            The Service is not directed to children under 13 (or the equivalent
            minimum age in your jurisdiction) and we do not knowingly collect
            data from them.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">9. Changes</h2>
          <p>
            We may update this policy from time to time. The effective date at
            the top of this page will reflect the most recent revision.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">10. Contact</h2>
          <p>
            Questions or requests:{" "}
            <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
          </p>
        </section>
      </article>

      <footer className="mt-16 flex items-center justify-between border-t border-border pt-6 text-sm text-muted-foreground">
        <Link href="/" className="underline">
          ← Home
        </Link>
        <Link href="/terms" className="underline">
          Terms of Service →
        </Link>
      </footer>
    </main>
  );
}
