# S3 CORS setup for direct uploads

The app uploads files to S3 using **presigned URLs**: the browser sends a `PUT` request directly to S3. S3 will reject it with a CORS error until the bucket has a CORS configuration that allows your app’s origin.

## 1. Open CORS in the S3 console

1. AWS Console → **S3** → open bucket **rampadmindevbucket**.
2. Go to the **Permissions** tab.
3. Scroll to **Cross-origin resource sharing (CORS)** and click **Edit**.

## 2. Paste the CORS configuration

Use the same structure as `s3-cors-config.json` in this folder. Example:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://dev-gateman.v3.connectramp.com"
    ],
    "ExposeHeaders": ["ETag"]
  }
]
```

- **AllowedOrigins**: Add every origin that will upload (e.g. your production portal URL). Do **not** add the S3 bucket URL.
- **AllowedMethods**: `PUT` is required for upload; `GET`/`HEAD` are optional if the app or backend reads objects from S3.
- **AllowedHeaders**: `*` or at least `Content-Type` so the browser can send the file’s content type.

## 3. Save

Click **Save changes**. After that, direct `PUT` uploads from the browser to the presigned URL should work without CORS errors.

## 4. (Optional) Apply via AWS CLI

If you use the CLI and have the bucket name in an env var:

```bash
aws s3api put-bucket-cors --bucket rampadmindevbucket --cors-configuration file://docs/s3-cors-config.json
```

Replace `rampadmindevbucket` if your bucket name is different.
