import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const recaptchaUrl = recaptchaSiteKey
    ? `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(recaptchaSiteKey)}`
    : 'https://www.google.com/recaptcha/api.js';

  return (
    <Html lang="en">
      <Head>
        <link rel="icon" type="image/svg+xml" href="/images/favicon.svg" />
        {/* <link rel="icon" type="image/x-icon" href="/favicon.ico" /> */}
        <meta
          property="og:title"
          content="Manage your business, create virtual accounts and payment links"
          key="title"
        />
        <script src={recaptchaUrl} async />
      </Head>
      <body className="font-sans">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
