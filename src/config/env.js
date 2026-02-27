const env = {
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
    altUrl: process.env.NEXT_PUBLIC_ALT_URL,
    secretKey: process.env.NEXT_PUBLIC_SECRET_KEY,
    publicUrl: process.env.NEXT_PUBLIC_APP_URL,
    imageUrl : process.env.NEXT_PUBLIC_IMAGE_URL,
    oldUrl : process.env.NEXT_PUBLIC_OLD_URL,
    recaptchaSiteKey : process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
    // S3/bucket (Amplify-friendly names; avoid AWS_ prefix)
    bucketRegion: process.env.BUCKET_REGION,
    bucketAccessKeyId: process.env.BUCKET_ACCESS_KEY_ID,
    bucketSecretAccessKey: process.env.BUCKET_SECRET_ACCESS_KEY,
    bucketName: process.env.BUCKET_NAME,
};

export default env;