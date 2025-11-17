import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  return (
    <Html lang="en">
      <Head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "tt650evu2d");
            `,
          }}
        />
      </Head>
      <script src={`https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}`} async />
      <link rel="icon" href="/images/favicon.png" type="image/png" />
      <link rel="shortcut icon" href="/images/favicon.png" type="image/png" />
      <link rel="apple-touch-icon" href="/images/favicon.png" />
      <meta
        property="og:title"
        content="Manage your business, create virtual accounts and payment links"
        key="title"
      />
      <body className="font-sans">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
