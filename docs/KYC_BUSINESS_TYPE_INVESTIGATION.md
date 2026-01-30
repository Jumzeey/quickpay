# Why only one business type appears on KYC (investigation)

## Summary

**There is no select for business type on the KYC form because:**

1. The KYC form **hardcodes** `business_type: "registered"` in its default values and **never** reads the logged-in user’s `user.business_type` from the auth store.
2. All in-app links to sign-up go to `/onboarding/join-us` (the index page), which **always** sends `business_type: "starter"` to the API. The URL-based route `/onboarding/join-us/[business]` (e.g. `/join-us/registered`) exists but is **not linked** anywhere, so users never choose “registered” at signup via UI.
3. So: at signup everyone is effectively “starter” from the only linked page; on KYC the form always shows the “registered” flow and submits `business_type: "registered"`. Result: **only the “registered” flow is ever used on KYC**, and there is no UI to switch.

---

## 1. Where business type is set

### Registration (sign-up)

| Entry point | File | How `business_type` is set |
|------------|------|----------------------------|
| `/onboarding/join-us` | `join-us/index.tsx` | **Hardcoded** in payload: `business_type: "starter"` (line 144). No select; user cannot choose. |
| `/onboarding/join-us/[business]` | `join-us/[business].tsx` | From **URL param** `params.business` (e.g. `/join-us/starter` or `/join-us/registered`). User “chooses” only by which URL they land on. |

**Links in the codebase:**

- Footer, sign-in page, Header: all link to **`/onboarding/join-us`** only.
- There are **no** links to `/onboarding/join-us/starter` or `/onboarding/join-us/registered`.

So in practice, every user who signs up via the app gets `business_type: "starter"` sent to the API, and the “[business]” route is unused unless someone shares a direct URL.

### KYC form

| File | Behaviour |
|------|-----------|
| `your-business/kyc-verification/kyc-form.tsx` | `defaultValues` include **`business_type: "registered"`** (line 134). There is **no** read from `useAuthentication().user.business_type`. The form never shows the “starter” flow for existing “starter” users. |

So regardless of what the backend stored at signup (`user.business_type`), the KYC form always:

- Renders the **registered** business UI (UBO, CAC, MEMART, etc.).
- Submits `business_type: "registered"` in the KYC payload.

That’s why it looks like “only one business type is being registered” on KYC: the form is fixed to “registered” and there is no select.

---

## 2. Where business type is read (after signup)

- **Auth user**  
  - Set at login/verify from API (`user` in auth store).  
  - Used in: `_app.tsx` (tracking), `profileTab.tsx` (e.g. `user?.business_type === "starter business"`), `BusinessHeader`, etc.  
  - So the **backend** can store and return a business type (e.g. `"starter"` / `"starter business"` / `"registered"`).

- **KYC form**  
  - Does **not** use `user.business_type`.  
  - Only uses the form’s own `business_type` (default `"registered"`).

- **KYC verification index** (`kyc-verification/index.tsx`)  
  - Decides “starter” vs “registered” from **previously submitted KYC data**: `getField("Business Type").toLowerCase() === "starter business"`.  
  - So it’s based on what was **last submitted** in KYC, not on the auth user.  
  - Because the form always submits `business_type: "registered"`, that submitted “Business Type” will always be the registered variant, so the index will never treat the user as “starter business” after first KYC submit.

---

## 3. Value mismatch (backend vs frontend)

- **profileTab** and KYC index use: `"starter business"` (with space).  
- **KYC form** and join payloads use: `"starter"` and `"registered"` (no space).  

If the API returns `"starter business"`, any logic that checks for `"starter"` or `"registered"` needs to account for that (e.g. normalize or map values).

---

## 4. What to do next (options)

1. **Use the user’s business type on KYC**  
   - In `kyc-form.tsx`, set form `defaultValues.business_type` from `useAuthentication().user?.business_type` (and normalize to `"starter"` / `"registered"` if the API uses `"starter business"`).  
   - Then the form will show starter vs registered flow according to how the user was created.

2. **Add a business type select on KYC**  
   - Keep or add a dropdown (starter / registered) and use that as the single source of truth for the KYC submission.  
   - Optionally pre-fill it from `user.business_type` and allow override.

3. **Expose both registration paths**  
   - Add links or a choice on the main join page to “Register as starter” → `/onboarding/join-us/starter` and “Register as registered business” → `/onboarding/join-us/registered`, so the backend receives the correct `business_type` at signup.  
   - Then (1) or (2) can align KYC with that.

4. **Align string values**  
   - Decide canonical values (e.g. `"starter"` and `"registered"`) and use them consistently in frontend and, if possible, API (or map API values in the app).

---

## 5. Files to change (depending on choice)

- **KYC form using user type:**  
  `src/pages/your-business/kyc-verification/kyc-form.tsx`  
  - Read `user?.business_type` from `useAuthentication()`, map to `"starter"` / `"registered"`, and use in `defaultValues.business_type` (and optionally reset when user loads).

- **Registration entry points:**  
  `src/pages/onboarding/join-us/index.tsx`,  
  `src/components/Footer.tsx`,  
  `src/pages/onboarding/sign-in.tsx`,  
  `src/components/Header.tsx`  
  - If you want users to choose type at signup, add links or a select that navigates to `/onboarding/join-us/starter` or `/onboarding/join-us/registered`, or send the chosen value from the index page instead of hardcoding `"starter"`.

- **Value consistency:**  
  `src/components/settings/profileTab.tsx`,  
  `src/pages/your-business/kyc-verification/index.tsx`  
  - Use the same normalized values when comparing `user.business_type` or KYC “Business Type” (e.g. treat `"starter business"` as `"starter"` where needed).
