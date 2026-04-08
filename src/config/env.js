const env = {
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
    altUrl: process.env.NEXT_PUBLIC_ALT_URL,
    secretKey: process.env.NEXT_PUBLIC_SECRET_KEY,
    publicUrl: process.env.NEXT_PUBLIC_APP_URL,
    imageUrl : process.env.NEXT_PUBLIC_IMAGE_URL,
    oldUrl : process.env.NEXT_PUBLIC_OLD_URL,
    recaptchaSiteKey : process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
    // S3 storage (server-only env vars)
    storageRegion: process.env.STORAGE_REGION,
    storageAccessKeyId: process.env.STORAGE_ACCESS_KEY_ID,
    storageSecretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY,
    storageName: process.env.STORAGE_NAME,
};

export default env;