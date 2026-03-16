# Direct S3 File Upload from Next.js

This guide explains how to set up **direct client-to-S3 file uploads** in a Next.js app using **presigned URLs**. The browser uploads files straight to S3; your API never handles the file bytes, which reduces server load and scales better for large files.

---

## Overview

**Flow:**

1. Client asks your Next.js API for a **presigned PUT URL** (with desired S3 key and content type).
2. API uses AWS credentials (server-side only) to generate a time-limited URL and returns it.
3. Client uploads the file directly to S3 with a `PUT` request to that URL.
4. Client (or API) can then use the S3 **object key** (and optional public/base URL) for storage, display, or downstream APIs.

**Why presigned URLs?**

- AWS credentials stay on the server; the client never sees them.
- No need to proxy file bytes through your Next.js app.
- Uploads scale with S3, not with your app server.

---

## Requirements

### 1. NPM packages

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

- **@aws-sdk/client-s3** – S3 client and `PutObjectCommand` / `GetObjectCommand`.
- **@aws-sdk/s3-request-presigner** – generates presigned URLs.

### 2. Environment variables

**Server-only** (never expose these to the client):

| Variable | Description | Example |
|----------|-------------|---------|
| `STORAGE_REGION` | AWS region of the bucket | `us-east-1` |
| `STORAGE_NAME` | S3 bucket name | `my-app-uploads` |
| `STORAGE_ACCESS_KEY_ID` | IAM access key ID | `AKIA...` |
| `STORAGE_SECRET_ACCESS_KEY` | IAM secret access key | (secret) |

**Optional (client-safe):**

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_IMAGE_URL` or `NEXT_PUBLIC_S3_PUBLIC_URL` | Base URL for built object URLs (if bucket is public or you use a CDN) | `https://my-app-uploads.s3.us-east-1.amazonaws.com/` |
| `NEXT_PUBLIC_USE_S3_FILE_UPLOAD` | Feature flag to enable S3 upload in the app (e.g. `true` / `false`) | `true` |

Add these to `.env` (and `.env.local` for local overrides). Do **not** commit real secrets; use a `.env.example` without values.

### 3. Amplify (`amplify.yml`) setup

For **AWS Amplify** deployments, Next.js does not read Amplify’s environment variables by default. Use `amplify.yml` so the S3-related (and other) env vars are written into `.env.production` before `npm run build`, and are available at runtime for API routes.

**1. Set variables in Amplify Console**

In **Amplify Console → your app → Environment variables**, add:

- `STORAGE_REGION`
- `STORAGE_NAME`
- `STORAGE_ACCESS_KEY_ID`
- `STORAGE_SECRET_ACCESS_KEY`
- (Optional) `NEXT_PUBLIC_IMAGE_URL`, `NEXT_PUBLIC_USE_S3_FILE_UPLOAD`, and any other `NEXT_PUBLIC_*` you need.

**2. Use this in `amplify.yml`**

In the `build` phase, before `npm run build`, inject those variables into `.env.production` so the build and runtime can use them:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install
    build:
      commands:
        # Make server-side env vars available to Next.js API routes / SSR at runtime.
        # Amplify sets env in the build environment; Next.js loads from .env files.
        - env | grep -e STORAGE_NAME -e STORAGE_REGION -e STORAGE_ACCESS_KEY_ID -e STORAGE_SECRET_ACCESS_KEY >> .env.production || true
        - env | grep -e NEXT_PUBLIC_ >> .env.production || true
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

- The first `env | grep ...` line appends the S3/storage variables to `.env.production`.
- The second appends all `NEXT_PUBLIC_*` variables (so the client bundle gets the right values).
- `|| true` avoids failing the build if a variable is missing (remove it if you want the build to fail when required vars are absent).

Ensure `STORAGE_*` and any required `NEXT_PUBLIC_*` are set in Amplify’s environment variables for the branch you deploy.

---

## Implementation steps

### Step 1: Server-side S3 client and presigner

Create a **server-only** module (e.g. `src/lib/s3.ts`) that:

- Reads `STORAGE_REGION`, `STORAGE_NAME`, `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY`.
- Instantiates `S3Client` from `@aws-sdk/client-s3`.
- Exposes a function that accepts `key` and `contentType`, builds a `PutObjectCommand`, and uses `getSignedUrl` from `@aws-sdk/s3-request-presigner` to return a presigned PUT URL.

**Important:** Do not import this file from client components or client-side code; it uses server-only env and the Node SDK.

Example signature:

```ts
getPresignedUploadUrl(options: { key: string; contentType: string; expiresIn?: number }): Promise<{ url: string; key: string }>
```

Use a short `expiresIn` (e.g. 900 seconds) so leaked URLs are valid only briefly.

### Step 2: API route for presigned URL

Create a Next.js API route (e.g. `pages/api/upload/presigned.ts`) that:

- Accepts **GET** with query params: `key` (S3 object key), `contentType` (MIME type).
- Validates both and normalizes `key` (e.g. trim, remove leading slashes).
- Calls `getPresignedUploadUrl({ key, contentType, expiresIn })`.
- Returns JSON: `{ url, key }`.

Return 400 if `key` or `contentType` is missing; 500 on S3 errors. This route is the only place that uses AWS credentials for generating upload URLs.

### Step 3: Client-side upload helper

Create a **client-safe** helper (e.g. `src/lib/uploadToS3.ts`) that:

1. Takes `file: File` and optional `key?: string`.
2. Derives a key if not provided (e.g. `uploads/{timestamp}-{randomId}/{file.name}`).
3. Calls your API: `GET /api/upload/presigned?key=...&contentType=...`.
4. Uses the returned `url` to `fetch(url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })`.
5. Returns `{ key, url }` where `url` is the final object URL (e.g. `NEXT_PUBLIC_IMAGE_URL + key`).

The client never sees AWS credentials; it only gets a one-time upload URL.

### Step 4: Optional feature flag

If you want to toggle S3 vs. other upload methods (e.g. multipart to your backend):

- Use `NEXT_PUBLIC_USE_S3_FILE_UPLOAD` in a small config module (e.g. `src/config/upload.ts`).
- In components that support both flows, call `uploadToS3(...)` when the flag is true, otherwise use your existing upload path.

Restart the dev server after changing `NEXT_PUBLIC_*` so Next.js inlines the new value.

### Step 5: (Optional) Presigned download URL for previews

For private buckets, you can add a server function that generates a **presigned GET** URL:

- Use `GetObjectCommand` and `getSignedUrl` with the same S3 client.
- Expose an API route that accepts a `key` and returns `{ url }` for preview/download in the browser.

Keep expiry short (e.g. 15 minutes). Do not expose S3 keys in URLs if they are sensitive; use the presigned URL only for trusted, short-lived access.

---

## Usage example

```tsx
// In a client component
import { uploadToS3 } from "@/lib/uploadToS3";

async function handleFileSelect(file: File) {
  try {
    const { key, url } = await uploadToS3({ file });
    // Send `key` or `url` to your backend for storage in DB or downstream APIs
    await saveDocumentUrl(key);
  } catch (e) {
    console.error("Upload failed", e);
  }
}
```

---

## Security checklist

- **Never** put `STORAGE_ACCESS_KEY_ID` or `STORAGE_SECRET_ACCESS_KEY` in `NEXT_PUBLIC_*` or client code.
- Use short expiry for presigned URLs (e.g. 15 minutes).
- Validate and sanitize `key` in the API route (no path traversal, e.g. reject `..`).
- Optionally restrict `key` to a prefix (e.g. `uploads/`) and allowed content types.

---

## Summary

| Step | What |
|------|------|
| 1 | Install `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`. |
| 2 | Add server-only S3 client and `getPresignedUploadUrl()` in `src/lib/s3.ts`. |
| 3 | Add GET API route `api/upload/presigned` that returns `{ url, key }`. |
| 4 | Add client helper `uploadToS3()` that gets a presigned URL then PUTs the file to S3. |
| 5 | (Optional) Feature flag and presigned GET for private previews. |
| 6 | For Amplify: set S3 env vars in Console and use `amplify.yml` to write them to `.env.production` before build. |

After this, the Next.js app can support direct S3 uploads without sending file data through your server.
