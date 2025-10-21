const env = {
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
    altUrl: process.env.NEXT_PUBLIC_ALT_URL,
    secretKey: process.env.NEXT_PUBLIC_SECRET_KEY,
    publicUrl: process.env.NEXT_PUBLIC_APP_URL,
    imageUrl : process.env.NEXT_PUBLIC_IMAGE_URL,
    oldUrl : process.env.NEXT_PUBLIC_OLD_URL,
    recaptchaSiteKey : process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
};

export default env;