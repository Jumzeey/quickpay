import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  return (
    <Html lang="en">
      <Head />
      <script src={`https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}`} async/>
      <link rel="icon" href="/favicon.ico" />
      <meta
        property="og:title"
        content="Manage your business, create virtual accounts and payment links"
        key="title"
      />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
