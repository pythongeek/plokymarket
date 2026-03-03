# ইউজার ম্যানেজমেন্ট এবং অ্যাডমিন কন্ট্রোল

* # **Polymarket: প্রোডাকশন-রেডি ইউজার ম্যানেজমেন্ট এবং অ্যাডমিন কন্ট্রোল ডিজাইন**

এই ডকুমেন্টটি **Polymarket**\-এর জন্য একটি সুরক্ষিত, স্কেলেবল এবং ইন্ডাস্ট্রি-স্ট্যান্ডার্ড ইউজার ম্যানেজমেন্ট সিস্টেমের ব্লুপ্রিন্ট হিসেবে কাজ করবে।

## **১. User Lifecycle Model (ইউজার জীবনচক্র)**

নিরাপত্তা এবং কমপ্লায়েন্স নিশ্চিত করতে ইউজারদের নিচের ধাপগুলোতে বিভক্ত করা হয়েছে:

### **Phase 1: Onboarding (অনবোর্ডিং)**

* **Unverified (State 0):** ইউজার ইমেইল বা গুগলের মাধ্যমে সাইন-আপ করেছেন। তিনি মার্কেট দেখতে পারবেন, কিন্তু ট্রেডিং বা ডিপোজিট করতে পারবেন না।  
* **Basic Verified (State 1):** ইমেইল ভেরিফাইড এবং প্রোফাইলের বেসিক তথ্য (নাম, ফোন) প্রদান করা হয়েছে। এটি ক্ষুদ্র বিনিয়োগকারীদের জন্য সীমিত ডিপোজিট (যেমন: \~$500) এবং ট্রেডিং সুবিধা দেবে।

### **Phase 2: Growth & Compliance (প্রবৃদ্ধি ও কমপ্লায়েন্স)**

* **Standard Verified (State 2 \- KYC Level 1):** সরকারি পরিচয়পত্র (NID/Passport) ভেরিফাইড। এতে উইথড্রয়াল সুবিধা এবং উচ্চতর লেনদেনের সীমা যোগ হবে।  
* **Premium Verified (State 3 \- KYC Level 2):** ঠিকানার প্রমাণ (Utility Bill/Bank Statement) অনুমোদিত। আনলিমিটেড লেনদেন এবং ভিআইপি মার্কেটে প্রবেশের সুযোগ।  
* **Corporate Verified (State 4 \- New):** প্রাতিষ্ঠানিক একাউন্টের জন্য বিশেষ ভেরিফিকেশন। মাল্টি-ইউজার এক্সেস কন্ট্রোল সুবিধা।

### **Phase 3: Security & Interventions (নিরাপত্তা ও হস্তক্ষেপ)**

* **Restricted:** সন্দেহজনক কার্যকলাপের কারণে ট্রেডিং বা উইথড্র সাময়িকভাবে বন্ধ।  
* **Dormant (New):** দীর্ঘকাল ইন-এক্টিভ থাকা একাউন্ট, যা পুনরায় লগইন করলে ইমেইল ভেরিফিকেশন চাইবে।  
* **Suspended/Banned:** প্ল্যাটফর্মের নীতি লঙ্ঘনের কারণে স্থায়ীভাবে এক্সেস বাতিল।

---

## **২. User Dashboard: Personal Control Center (ইউজার ড্যাশবোর্ড)**

ইউজারদের নিজেদের একাউন্ট পরিচালনার জন্য একটি প্রিমিয়াম ইন্টারফেস।

### **A. Professional Overview (ইউনিফাইড ভিউ)**

* **Net Equity Card:** বর্তমান ব্যালেন্স এবং ওপেন পজিশনের মোট মূল্য।  
* **Advanced PnL Analytics:** দৈনিক, সাপ্তাহিক এবং সর্বমোট প্রফিট/লস চার্ট এবং পারফরম্যান্স রেশিও।  
* **Activity Stream:** ট্রেড, ডিপোজিট এবং সিকিউরিটি নোটিফিকেশনের একটি লাইভ ফিড।

### **B. Financial Hub (আর্থিক হাব)**

* **Wallet Control:** QR কোড এবং ক্রিপ্টো অ্যাড্রেসের মাধ্যমে ডিপোজিট, উইথড্র এবং সাব-অ্যাকাউন্টের মধ্যে ইন্টারনাল ট্রান্সফার।  
* **One-Click Tax Reporting (New):** ইউজারদের লেনদেনের ট্যাক্স রিপোর্ট বা স্টেটমেন্ট PDF/CSV ফরম্যাটে ডাউনলোডের সুবিধা।  
* **Transaction History:** ফিল্টারসহ বিস্তারিত সার্চ সুবিধা।

### **C. Security & Integrity (নিরাপত্তা ব্যবস্থাপনা)**

* **2FA (Two-Factor Authentication):** Google Authenticator বা SMS ভিত্তিক ২-ধাপের নিরাপত্তা।  
* **Anti-Phishing Code (New):** প্ল্যাটফর্ম থেকে পাঠানো ইমেইলে একটি গোপন কোড থাকবে যাতে ইউজার নিশ্চিত হতে পারেন ইমেইলটি আসল।  
* **Device Management:** বর্তমানে কোন কোন ডিভাইসে লগইন করা আছে তা দেখা এবং সন্দেহজনক ডিভাইস রিমুভ করা।  
* **Withdrawal Whitelisting:** নির্দিষ্ট এবং বিশ্বস্ত অ্যাড্রেস ছাড়া অন্য কোথাও ফান্ড ট্রান্সফার ব্লক করার অপশন।

---

## **৩. Admin Control Center: The Control Tower (অ্যাডমিন কন্ট্রোল সেন্টার)**

### **A. Master User Control (মাস্টার ইউজার কন্ট্রোল)**

* **Dynamic Search & Advanced Filters:** ইউজার টিয়ার, রিস্ক স্কোর, ডেট (Debt), বা বড় অংকের ডিপোজিট অনুযায়ী ইউজার ফিল্টার করা।  
* **Financial Intervention:**  
  * **Manual Credits/Debits:** বোনাস বা বিবাদ নিষ্পত্তির জন্য ব্যালেন্স অ্যাডজাস্টমেন্ট।  
  * **Maker-Checker (Dual-Auth):** যেকোনো ফিন্যান্সিয়াল পরিবর্তনের জন্য একজন অ্যাডমিন রিকোয়েস্ট করবেন এবং অন্য একজন তা অ্যাপ্রুভ করবেন।  
* **Limit Overrides:** বিশেষ ইউজারের জন্য লেনদেনের সীমা ম্যানুয়ালি পরিবর্তন করা।

### **B. Risk & Compliance Dashboard (রিস্ক ড্যাশবোর্ড)**

* **Fraud Detection Alerts:** Wash-trading, Multi-accounting (একই আইপি থেকে অনেক একাউন্ট), এবং পাম্প-অ্যান্ড-ডাম্প প্যাটার্ন সনাক্তকরণ।  
* **KYC Review Engine:** AI-পাওয়ার্ড ডকুমেন্ট ভেরিফিকেশন এবং ম্যানুয়াল রিভিউ কিউ (Queue)।  
* **Emergency Tools:**  
  * **Panic Button (Account Freeze):** এক ক্লিকে ইউজারের সব অ্যাক্টিভিটি বন্ধ করা।  
  * **Mass Order Cancellation:** নির্দিষ্ট মার্কেটে ইউজারের সব ওপেন অর্ডার বাতিল করা।  
  * **Force Liquidation:** চরম ঝুঁকিপূর্ণ ক্ষেত্রে ইউজারের পজিশন ক্লোজ করা।

### **C. Operational & CRM Support**

* **Unified Support Inbox:** ইউজারের প্রোফাইলের সাথে সরাসরি যুক্ত চ্যাট বা টিকিট সিস্টেম।  
* **Behavioral CRM:** ইউজারের ট্রেডিং ভলিউম অনুযায়ী স্বয়ংক্রিয় প্রমোশনাল অফার বা নোটিফিকেশন পাঠানো।  
* **Audit Vault:** অ্যাডমিনদের প্রতিটি কাজের (কে, কখন, কেন পরিবর্তন করেছে) রিড-অনলি এবং আন-অল্টারেবল লগ।

---

## **৪. Technical Strategy (প্রযুক্তিগত কৌশল)**

* **Unified API Layer:** অ্যাডমিন ফাংশনগুলো `/api/admin/users/*` পাথে থাকবে যা কঠোরভাবে Role-Based Access Control (RBAC) দ্বারা নিয়ন্ত্রিত।  
* **Database Schema:** Supabase ব্যবহার করে `profiles`, `kyc_documents`, `audit_logs`, এবং `wallets` টেবিলগুলোর মধ্যে রিলেশন স্থাপন।  
* **Real-time Sync:** `Supabase Realtime` ব্যবহার করে অ্যাডমিন প্যানেল থেকে কোনো একাউন্ট ফ্রিজ করলে তা ইউজারের স্ক্রিনে সাথে সাথে আপডেট হবে (কোনো রিফ্রেশ ছাড়াই)।  
* **Security Protocols:** সেনসিটিভ ডাটা (যেমন: KYC ID) ডাটাবেসে এনক্রিপ্টেড অবস্থায় থাকবে এবং ফাইল স্টোরেজে (S3/Supabase Storage) প্রাইভেট এক্সেস থাকবে।

---

**গুরুত্বপূর্ণ নোট:** Plokymarket-এর এই ডিজাইনটি স্বচ্ছতা (Transparency) এবং বিশ্বাসের (Trust) ওপর ভিত্তি করে তৈরি। অ্যাডমিনের প্রতিটি পদক্ষেপ ট্র্যাকিংযোগ্য হতে হবে এবং ইউজারের জন্য প্ল্যাটফর্মটি হবে সর্বোচ্চ পর্যায়ের নিরাপদ।

# Walkthrough

# Walkthrough \- Advanced Admin Features

A new **Risk Management Controls** section has been added to the main Admin Dashboard. This allows administrators to:

* **Halt All Trading:** Instantly stop all new order placements platform-wide.  
* **Halt Withdrawals:** Freeze all fund movements to prevent unauthorized outflows during emergencies.  
* **Emergency Message:** (Backend support added) Capacity to display custom emergency alerts to users.

## Risk Management UIIMPORTANT

Global trading halts are enforced at the database level via the `check_trading_eligibility` function, ensuring absolute security even if the frontend is bypassed.2. KYC Verification Workflow

The User Management page now features a dedicated **KYC Requests** tab for streamlined identity verification.

* **Manual Review:** Admins can view submitted documents (ID Front, Back, Selfie) and verify or reject them.  
* **Syncing:** Approving a user's KYC automatically updates their `kyc_level` to 1, enabling higher trading limits and deposits.  
* **AI Integration:** The system captures AI-generated risk scores and factors into the review process.

3\. User Suspension Log & Auditing

Enhanced transparency for administrative actions:

* **Mandatory Reasoning:** Admins must provide a reason for any status change (Suspension, Ban, Activation).  
* **Audit History:** All actions are logged and visible in the **Audit History** tab of the user detail page, showing who performed the action, which values changed, and why.  
* **Bengali Error Messages:** Localized feedback for restricted users attempting to trade.

Technical ChangesDatabase & Security

* `072_risk_management_and_kyc.sql`: Initializes global risk settings and redefines `admin_kyc_action` for status synchronization.  
* Updated `check_trading_eligibility` to respect global trading halts.

Frontend Components

* `AdminPage.tsx`: Added Risk Management cards and toggles.  
* `AdminUsersPage`: Added KYC Requests tab and grouping.  
* `UserKYCView.tsx`: Connected UI to real verification APIs.  
* `UserOverviewView.tsx`: Enforced mandatory status change reasoning.

## User UX Enhancements Walkthrough

**Key Enhancements**

1. **Smart Withdraw Limits (Wallet Page)**  
   Implemented a visual indicator that shows the user's current withdrawal usage compared to their daily threshold, which is determined by their KYC level. This helps users understand when they need to upgrade their KYC status to increase their limits.  
2. **Automated Order Nudge (Wallet Page)**  
   Added a proactive nudge that appears when a user has a `locked_balance` (funds tied up in open orders). It provides context on why orders might not be matching and offers a quick link to their portfolio to review or cancel them.  
3. **Verified Trader Badge (Portfolio Page)**  
   KYC-verified users now display a "Verified Trader" badge next to their name, providing visual proof of their status and increasing platform credibility.  
4. **Trust Score Indicator (Portfolio Page)**  
   An explicit "Trust Score" progress bar has been added to the profile card. Verified users show 100% trust, while unverified users show 60%, encouraging them to complete the verification process.

**Changes Made**Frontend Components

* **Wallet Page**  
  * Integrated the Smart Withdraw Limits progress bar.  
  * Added the Automated Order Nudge for users with locked balances.  
  * Ensured correct rendering of balance cards and action buttons.  
* **Portfolio Page**  
  * Added the "Verified Trader" badge conditional on KYC level.  
  * Implemented the Trust Score progress bar.

Backend & Store Logic

* **`useStore.ts`**  
  * Updated `User` initialization to include `kyc_level` and `account_status`.  
* **`useUser` Hook**  
  * Updated to fetch `kyc_level` from `user_profiles` table to support the new UI badges.  
* **Types**  
  * Updated `User` interface with `kyc_level` and `account_status`.

## Governance & Compliance Updates (New)

**1\. Activity Log (\`public.audit\_logs\`)**

* Created a robust auditing system to record every admin action and critical system change. This ensures accountability and provides a clear trail for dispute resolution.  
* **Table:** `public.audit\_logs`  
* **Automatic Logging:** Triggers on `user\_status` and markets ensure no critical change goes unrecorded.

**2\. Dormant Account Management (90-Day Rule)**

* Implemented logic to identify and protect accounts that have been inactive for more than 90 days.  
* **Tracking:** `last\_login\_at` is updated on every login.  
* **Status:** Accounts inactive for \> 90 days are marked as dormant, requiring re-verification.

**3\. KYC Document Expiry (30-Day Alert)**

* Proactive alerts help users stay compliant by notifying them before their identification documents expire.  
* **Threshold:** Alerts trigger 30 days before document expiry.  
* **UI Touchpoints:** Warning banners added to both the Wallet and Portfolio pages.

# Verification

**Manual Verification Steps**  
**Wallet Limits: Visit the Wallet page to see your daily limit progress bar.**

**Order Nudge: Place a limit order that won't fill immediately, then check the Wallet page for the nudge banner.**

**Trust Badge: Verified users can see the Verified Trader badge on their Portfolio page.**

**Audit Logs: Perform an admin action (like updating a market) and check the public.audit\_logs table in Supabase.**

**Governance Alerts: Simulate dormancy (\>90 days inactive) or KYC expiry (\<30 days left) and check for the warning banners on the dashboard.**

# KYC & Compliance System Implementation Plan

KYC & Compliance System Implementation PlanGoal Description

Implement a robust KYC system tailored for Bangladesh, requiring users to verify their identity (NID/Passport) to withdraw more than 5000 BDT. This includes a document upload interface, an admin review dashboard, and strict backend enforcement of withdrawal limits.User Review Required

**IMPORTANT**

* **Database:** Validating migration for `kyc_documents`.  
* **Logic:** Confirming the 5000 BDT limit is per-transaction and triggered if `kyc_verified` is false (mapped to `kyc_level < 1`).  
* **Storage:** Documents will be stored in Supabase Storage bucket `kyc-documents` (need to ensure this bucket exists or create it).

Proposed ChangesDatabase Schema

* **\[NEW\] `kyc_documents` Table**  
  * `id` (UUID, PK)  
  * `user_id` (UUID, FK to `auth.users`)  
  * `document_type` (TEXT: 'NID', 'Passport', 'Driving License')  
  * `document_front_url` (TEXT)  
  * `document_back_url` (TEXT)  
  * `selfie_url` (TEXT)  
  * `status` (VARCHAR: 'pending', 'approved', 'rejected')  
  * `rejection_reason` (TEXT)  
  * `created_at` (TIMESTAMPTZ)  
  * `reviewed_at` (TIMESTAMPTZ)  
  * `reviewed_by` (UUID, FK to `auth.users`)

Backend Logic

* **\[NEW\] Withdrawal Validation API (`/api/wallet/withdraw`)**  
  * **Check:** fetch user profile.  
  * **Condition:** if (`amount > 5000` && `user.kyc_level < 1`) throw Error(...).  
  * **Action:** Create withdrawal request in `wallet_transactions`.  
* **\[MODIFY\] Admin Stats API**  
  * Add endpoint to fetch pending KYC documents.

User Interface

* **\[NEW\] `/kyc` Page (User)**  
  * **Form:**  
    * Select Document Type.  
    * Upload Front Image (Preview capable).  
    * Upload Back Image (Preview capable).  
    * Upload Selfie (Preview capable).  
  * **State:** Show "Pending", "Verified", or "Rejected" (with reason).  
* **\[NEW\] `/sys-cmd-7x9k2/kyc` Page (Admin)**  
  * **List:** Table of pending requests.  
  * **Detail Modal:**  
    * Zoomable images (using `react-medium-image-zoom`).  
    * "Approve" button \-\> Updates `kyc_documents.status = 'approved'` AND `user_profiles.kyc_level = 1`.  
    * "Reject" button \-\> Updates `kyc_documents.status = 'rejected'` with reason.

Verification PlanAutomated Tests

* **API:** Test `/api/wallet/withdraw` with unverified user trying to withdraw 5001 BDT. Expect 403/400.  
* **Database:** Trigger on approval updates `user_profiles`.

Manual Verification

* **User Flow:**  
  1. Register new user.  
  2. Try to withdraw 6000 BDT. Verify error message.  
  3. Go to `/kyc`, upload dummy images.  
  4. Verify status is "Pending".  
* **Admin Flow:**  
  1. Log in as admin.  
  2. Go to `/sys-cmd-7x9k2/kyc`.  
  3. See pending request.  
  4. Approve it.  
* **Final Check:**  
  1. As user, try to withdraw 6000 BDT again. Verify success (or proceeding to next step).

# Payment & Wallet Security (Bkash/Nagad)

Payment & Wallet Security (Bkash/Nagad)Database Schema

**\[NEW\] `payment_transactions` Table**

* `id` (UUID, PK)  
* `user_id` (UUID, FK)  
* `amount` (DECIMAL)  
* `currency` (VARCHAR, 'BDT')  
* `usdc_equivalent` (DECIMAL) \- For conversion tracking  
* `payment_method` (VARCHAR: 'Bkash', 'Nagad', 'Rocket')  
* `transaction_id` (TEXT, Unique) \- The TrxID users submit  
* `status` (VARCHAR: 'pending', 'approved', 'rejected')  
* `reviewed_by` (UUID, FK)  
* `created_at` (TIMESTAMPTZ)  
* `updated_at` (TIMESTAMPTZ)

Backend Logic

**\[NEW\] `submit_deposit_request` RPC**

* Accepts: `amount`, `payment_method`, `trx_id`.  
* Logic:  
  * Calculates `usdc_equivalent` (e.g., amount / 120).  
  * Inserts into `payment_transactions` with status 'pending'.

**\[NEW\] `approve_deposit` RPC**

* Accepts: `payment_id`, `admin_id`.  
* Logic:  
  * Updates `payment_transactions` status to 'approved'.  
  * Updates `wallets.balance`.  
  * Inserts record into `wallet_transactions` (Type: 'deposit').

**\[MODIFY\] `request_withdrawal` RPC**

* If `amount < 5000`, set status to 'processing' (ready for automation/n8n).  
* If `amount >= 5000`, set status to 'pending' (requires manual review).

User Interface

**\[MODIFY\] `WalletDashboard.tsx`**

* Add "Deposit via MFS" tab (Mobile Financial Services).  
* Form fields: Amount, Select Method (Bkash/Nagad), Transaction ID.  
* Display "Recent Deposits" list with status.

Verification PlanManual Verification

1. **Submit Deposit**:  
   * User inputs 1200 BDT, TrxID "ABC123456", Method "Bkash".  
   * Check `payment_transactions`: Status 'pending', USDC \~10.  
2. **Approve Deposit (Simulated/Admin)**:  
   * Admin calls `approve_deposit`.  
   * Check `wallets`: Balance increased by 1200\.  
   * Check `wallet_transactions`: Record created.  
3. **Withdrawal Automation Check**:  
   * Request 4000 BDT \-\> Status 'processing'.  
   * Request 6000 BDT \-\> Status 'pending'.

# Tab 3

Gamification & Loyalty System Implementation Plan  
Goal Description  
Implement a 5-level loyalty system to incentivize user activity. Users will progress from "Novice" to "Whale" based on their total trading volume. The system will be fully dynamic, allowing admins to configure level requirements and benefits.

User Review Required  
IMPORTANT

Database Changes: We are adding level\_id to user\_profiles and creating a new levels table. Existing users will be initialized to Level 1\. Volume Source: Levels will be based on user\_trading\_stats.total\_volume (lifetime volume).

Proposed Changes  
Database Schema  
\[NEW\] levels Table  
id  
 (INT, PK)  
name (VARCHAR, e.g., "Novice", "Trader")  
min\_volume (DECIMAL, Volume requirement)  
kyc\_required (INT, Minimum KYC level)  
benefits (JSONB, e.g., {"fee\_discount": 5, "withdrawal\_limit": 5000})  
icon\_url (TEXT, for UI display)  
\[MODIFY\] user\_profiles Table  
Add current\_level (INT, default 1, references levels.id)  
\[NEW\] update\_user\_level Function & Trigger  
Function: Checks user\_trading\_stats.total\_volume and updates user\_profiles.current\_level based on levels configuration.  
Trigger: Fires ON UPDATE of user\_trading\_stats.  
Admin Interface (/admin/levels)  
List View: Show all configured levels.  
Edit Modal: Update name, volume requirement, KYC requirement, and benefits.  
Actions: Add new levels (optional), reset user levels (maintenance tool).  
User Interface (/levels)  
Level Card: Show current level, badge, and benefits.  
Propress Bar: Visual indicator of progress to the next level (Current Volume / Next Level Target).  
Benefits Table: Comparison of all levels to motivate progression.  
Notification: Toast/Banner when a user levels up.  
Verification Plan  
Automated Tests  
Database Trigger:  
Insert test user with 0 volume \-\> Verify Level 1\.  
Update test user volume to 50,000 \-\> Verify update to Level 2\.  
Update test user volume to 5,000,000 \-\> Verify update to Level 5\.  
Manual Verification  
Admin Panel:  
Change Level 2 requirement to 60,000.  
Verify that a user with 55,000 volume downgrades (or stays same if logic dictates) \- logic will be simple re-check.  
User Dashboard:  
Check /levels page for correct data.  
Check Portfolio for Level Badge.

# Tab 6

ইভেন্ট ক্রিয়েশন ফ্লো, অ্যাডভান্সড ফিচার এবং ইউজার লেভেল সিস্টেম১. ইভেন্ট ক্রিয়েশন ফ্লো: অ্যাডমিন নেভিগেশনাল জার্নি

একজন অ্যাডমিন যখন প্যানেলে লগইন করবেন, তার মার্কেট তৈরির জার্নি নিচের ধাপগুলোর মাধ্যমে সম্পন্ন হবে:ধাপ ১: Basic Information (প্রাথমিক তথ্য)

অ্যাডমিন প্রথমে "Create New Market" বাটনে ক্লিক করবেন।

* **Event Title:** একটি আকর্ষণীয় শিরোনাম (যেমন: "বাংলাদেশ বনাম ভারত: এশিয়া কাপ ফাইনাল কে জিতবে?")।  
* **Category Selection:** ড্রপডাউন থেকে Sports, Politics, বা Crypto সিলেক্ট করা।  
* **Description & Image:** ইভেন্ট সম্পর্কে বিস্তারিত বর্ণনা এবং একটি থাম্বনেইল ইমেজ আপলোড।

ধাপ ২: Market Type & Odds Setup (মার্কেট টাইপ)

এখানে পলিমার্কেটের মূল মেকানিজম সেট করা হয়।

* **Binary vs Multiple Choice:** "Yes/No" হবে নাকি একাধিক অপশন থাকবে তা সিলেক্ট করা।  
* **Initial Price/Liquidity:** প্রতিটি শেয়ারের শুরুর দাম (যেমন: ০.৫০ টোকেন)।  
* **Trading Start & End Date:** ট্রেডিং কখন শুরু হবে এবং কখন বন্ধ হবে (Expiry)।

ধাপ ৩: Oracle & Resolution Source (ফলাফল নির্ধারণী সোর্স)

এটি স্বচ্ছতা নিশ্চিত করার জন্য সবচেয়ে গুরুত্বপূর্ণ ধাপ।

* **Resolution Source URL:** অ্যাডমিন এখানে অফিসিয়াল সোর্সের লিঙ্ক দেবেন (যেমন: ESPNCricinfo বা Prothom Alo)।  
* **Resolution Date:** কোন দিন ফলাফল ঘোষণা করা হবে।  
* **AI Validator (Gemini 1.5 Pro):** অ্যাডমিন যখন সোর্স লিঙ্ক দেবেন, Gemini ব্যাকগ্রাউন্ডে চেক করবে ওই লিঙ্কে সঠিক ডেটা আছে কিনা এবং ইভেন্টের শর্ত পরিষ্কার কিনা।

ধাপ ৪: Liquidity Provision (লিকুইডিটি পুল)

মার্কেট চালু করার জন্য শুরুতে কিছু টোকেন পুলে দিতে হয়।

* **Initial Funding:** অ্যাডমিন ওয়ালেট থেকে নির্দিষ্ট পরিমাণ লিকুইডিটি টোকেন মার্কেটে ইনজেক্ট করবেন।

ধাপ ৫: Review & Live (রিভিউ এবং লাইভ)

* **Draft/Review Mode:** সেভ করার পর ইভেন্টটি 'Pending' অবস্থায় থাকবে।  
* **Publish:** সবকিছু ঠিক থাকলে অ্যাডমিন 'Approve' বাটনে ক্লিক করবেন এবং ইভেন্টটি ইউজারের ফ্রন্টএন্ডে লাইভ হয়ে যাবে।

২. অ্যাডভান্সড ফিচারসমূহ (Bangladesh Context)

বাংলাদেশি প্রেক্ষাপটে ইউজারদের ধরে রাখতে এবং সিস্টেমকে নিরাপদ করতে জরুরি ফিচারগুলো:

1. **Local Payment Gateway Integration:**  
   * **Feature:** সরাসরি বিকাশ, নগদ বা রকেটের মাধ্যমে টোকেন রিচার্জ।  
   * **Tech Stack:** SSLCommerz বা ShurjoPay API।  
2. **Multilingual Support (Bangla & English):**  
   * **Feature:** ইভেন্টের টাইটেল এবং শর্তাবলী বাংলায় দেখার সুবিধা।  
3. **Community Dispute System:**  
   * **Feature:** যদি রেজাল্ট ভুল দেওয়া হয়, ইউজাররা চ্যালেঞ্জ করতে পারবে। এটি 'Oracle' লেভেল ইউজাররা রিভিউ করবে।  
4. **Social Sharing Cards:**  
   * **Feature:** ইউজার তার প্রেডিকশন সোশ্যাল মিডিয়ায় শেয়ার করার জন্য একটি সুন্দর কার্ড (Image) জেনারেট করতে পারবে।

৩. ইউজার লেভেল সিস্টেম (Level Requirements & Benefits)

একটি কমপ্লিট লিস্ট যা ডাটাবেসে ইমপ্লিমেন্ট করা যেতে পারে:

| লেভেল (Level) | রিকোয়মেন্ট (Requirements) | বেনিফিট (Benefits) |
| ----- | ----- | ----- |
| **Level 1: Rookie** | অ্যাকাউন্ট সাইন-আপ এবং মোবাইল ভেরিফিকেশন। | ১. প্রতিদিন ১টি ফ্রি প্রেডিকশন টিপস। ২. ৫,০০০ টাকা পর্যন্ত ডেইলি ট্রেড। |
| **Level 2: Expert** | মিনিমাম ২০টি ট্রেড সম্পন্ন করা \+ ১০,০০০ টোকেন ভলিউম। | ১. ট্রেডিং ফি-তে ২% ছাড়। ২. ইভেন্টে কমেন্ট করার অনুমতি। |
| **Level 3: Master** | ৫০টি ট্রেড \+ ৮০% প্রেডিকশন সঠিকতা \+ ২৫,০০০ টোকেন ভলিউম। | ১. ইনস্ট্যান্ট ক্যাশ-আউট সুবিধা। ২. ভিআইপি সাপোর্ট এবং ৫% ফি ছাড়। |
| **Level 4: Legend** | ১০০+ ট্রেড \+ ৫০০০+ প্রফিট \+ ১ লক্ষ টোকেন ভলিউম। | ১. নতুন ইভেন্ট প্রপোজ করার ক্ষমতা। ২. ডিসপ্যুট (Dispute) সমাধানে ভোট দেওয়ার ক্ষমতা। |

# অ্যাডভান্সড ফিচার

### **অ্যাডভান্সড ফিচারসমূহের বর্ণনা**

১. **Referral Program (রেফারেল প্রোগ্রাম):**

* **কিভাবে কাজ করবে:** প্রতিটি ইউজারের একটি ইউনিক রেফারেল কোড থাকবে। কেউ সেই কোড ব্যবহার করে সাইন-আপ করলে রেফারার (যিনি রেফার করেছেন) এবং রেফারি (যিনি জয়েন করেছেন) উভয়ই বোনাস পাবেন।  
* **ইমপ্লিমেন্টেশন:** public.users টেবিলে referred\_by কলাম যোগ করতে হবে এবং একটি নতুন referrals টেবিল তৈরি করতে হবে।

২. **Social Trading (সোশ্যাল ট্রেডিং):**

* **কিভাবে কাজ করবে:** টপ ট্রেডারদের একটি লিডারবোর্ড থাকবে। সাধারণ ইউজাররা তাদের প্রেডিকশন হিস্ট্রি দেখতে পারবেন এবং তাদের ট্রেড স্ট্র্যাটেজি ফলো করতে পারবেন।

৩. **Price Alerts (প্রাইস অ্যালার্ট):**

* **কিভাবে কাজ করবে:** n8n বা Supabase Edge Functions ব্যবহার করে মার্কেটের প্রাইস ট্র্যাক করা হবে। ইউজার নির্ধারিত প্রাইসে পৌঁছালে Push Notification (Firebase) বা SMS (Twilio/BulkSMSBD) পাঠানো হবে।

৪. **Local Payment Gateway (SSLCommerz/Shurjopay):**

* **কিভাবে কাজ করবে:** বর্তমানে আপনার সিস্টেমে bKash/Nagad ম্যানুয়াল সিস্টেমের এনাসমূহ আছে। গেটওয়ে ইন্টিগ্রেট করলে ইউজাররা সরাসরি পেমেন্ট পেজ থেকে অটোমেটেড ডিপোজিট করতে পারবেন।

---

**AI Insight (Bangla):** প্রতিটি মার্কেটের জন্য একটি AI জেনারেটেড সারসংক্ষেপ থাকবে (Bangla language-এ), যা ইউজারকে সিদ্ধান্ত নিতে সাহায্য করবে।

**Risk Management Tools:** 'Stop-Loss' ফিচার যোগ করুন, যাতে কোনো প্রেডিকশন ভুল হতে থাকলে নির্দিষ্ট মূল্যে ইউজার অটোমেটিক তার পজিশন থেকে বের হয়ে আসতে পারে।

**Local Context Notification:** বাংলাদেশের গুরুত্বপূর্ণ খেলা বা রাজনৈতিক ইভেন্টের সময় পুশ নোটিফিকেশন বা হোয়াটসঅ্যাপ এলার্ট পাঠানো।

# স্বতন্ত্র যাচাইকরণ সিস্টেম

Polymarket-এ ইভেন্টের ফলাফল নির্ধারণের জন্য ৫টি স্বতন্ত্র যাচাইকরণ সিস্টেম রয়েছে, যা নিম্নরূপ:১. এআই ওরাকল (স্বয়ংক্রিয়) / AI Oracle (Automated)

* **কার্যপ্রণালী:** রেজোলিউশনের জন্য খবর এবং ডেটা সোর্স স্ক্র্যাপ করতে `pg_net` ব্যবহার করে।  
* **শর্ত:** একটি সেট থ্রেশহোল্ডের (ডিফল্ট ৮০%) উপরে একটি কনফিডেন্স স্কোর প্রয়োজন।  
* **কনফিগারেশন:** `024_advanced_ai_oracle.sql` এবং `025_bangladesh_ai_oracle.sql` এর মাধ্যমে কনফিগার করা যায়।

২. ম্যানুয়াল অ্যাডমিন রেজোলিউশন / Manual Admin Resolution

* **কার্যপ্রণালী:** অ্যাডমিনরা ম্যানুয়ালি বিজয়ী ফলাফল সেট করতে পারে।  
* **বিকল্প ব্যবস্থা:** `admin_bypass_legal_review` বা অনুরূপ ফ্ল্যাগ সেট করা থাকলে অন্যান্য চেক বাইপাস করতে পারে।  
* **সংজ্ঞা:** `057_market_verification_config.sql`\-এ সংজ্ঞায়িত।

৩. বিশেষজ্ঞ প্যানেল রিভিউ (বিরোধ নিষ্পত্তি সিস্টেম) / Expert Panel Review (Dispute System)

* **কার্যপ্রণালী:** ডোমেইন বিশেষজ্ঞদের একটি প্যানেল (যেমন: বাংলাদেশের রাজনীতি, ক্রিকেট, অর্থনীতিতে বিশেষজ্ঞ) বিরোধের বিষয়ে ভোট দেয়।  
* **সিস্টেম:** বিশেষজ্ঞদের জন্য বিশ্বাসযোগ্যতা স্কোর এবং নির্ভুলতা ট্র্যাকিং অন্তর্ভুক্ত।  
* **সংজ্ঞা:** `028_dispute_settlement.sql`\-এ সংজ্ঞায়িত।

৪. কমিউনিটি বিরোধ নিষ্পত্তি প্রক্রিয়া / Community Dispute Mechanism

* **কার্যপ্রণালী:** ব্যবহারকারীরা তহবিল বন্ধক রেখে একটি রেজোলিউশনকে চ্যালেঞ্জ করতে পারে।  
* **এসকেলেশন লেভেল:** প্রাথমিক (Initial) → আপিল (Appeal) → চূড়ান্ত (Final)।  
* **সংজ্ঞা:** `028_dispute_settlement.sql`\-এ সংজ্ঞায়িত।

৫. বাহ্যিক ওরাকল (UMA / Chainlink) / External Oracles (UMA / Chainlink)

* **কার্যপ্রণালী:** বিকেন্দ্রীভূত ওরাকল নেটওয়ার্ক থেকে ডেটা আনতে দেয়।  
* **সমর্থন:** ডাটাবেস স্কিমাতে (`oracle_type enum`) সমর্থিত।  
* **রেফারেন্স:** `050_market_creation_workflow.sql`\-এ উল্লেখ করা হয়েছে।

এই সিস্টেমগুলিকে একত্রিত করা যেতে পারে; উদাহরণস্বরূপ, একটি এআই রেজোলিউশনকে কমিউনিটি বিরোধ নিষ্পত্তি প্রক্রিয়ার মাধ্যমে চ্যালেঞ্জ করা যেতে পারে, যা তখন একটি বিশেষজ্ঞ প্যানেলে এসকেলেট হয়।

# Tab 10

## **১. অ্যাডমিন প্যানেল: যাচাইকরণ সিস্টেমসমূহের ব্যবস্থাপনা ("কন্ট্রোল রুম")**

## 

## বাংলাদেশে ৫টি যাচাইকরণ সিস্টেমের কার্যকর ব্যবস্থাপনার জন্য অ্যাডমিন প্যানেলে নির্দিষ্ট মডিউল প্রয়োজন। আমরা এটিকে **"নির্বাচন ও নিষ্পত্তি" (Nirbachon O Nishpotti) হাব** বলতে পারি।

| ফিচার (Feature) | অ্যাডমিন কার্যকারিতা (BD Context) |
| ----- | ----- |
| **১. এআই ওরাকল (নিউজ স্ক্যানার)** | • **সোর্স ব্যবস্থাপনা:** স্থানীয় যাচাইকৃত সোর্স (যেমন: প্রথম আলো, দ্য ডেইলি স্টার, যমুনা টিভি) শ্বেততালিকাভুক্ত করা। • **কীওয়ার্ড টিউনিং:** প্রাসঙ্গিক বাংলার শব্দ যুক্ত করা (যেমন: "হরতাল", "অবরোধ", "খালেদা", "হাসিনা")। • **কনফিডেন্স থ্রেশহোল্ড:** সংবেদনশীল রাজনৈতিক ইভেন্টগুলোর জন্য উচ্চতর থ্রেশহোল্ড (৯০%+) সেট করা যাতে "ভুয়া খবর" দ্বারা ফলাফল প্রভাবিত না হয়। |
| **২. ম্যানুয়াল অ্যাডমিন রেজোলিউশন** | • **"রেড বাটন" (জরুরী):** ইন্টারনেট ব্ল্যাকআউট বা অস্পষ্ট সরকারি ঘোষণার জন্য। • **মেকার-চেকার:** একজন অ্যাডমিন রেজোলিউশন প্রস্তাব করবেন, অন্যজন তা অনুমোদন করবেন (অভ্যন্তরীণ দুর্নীতি রোধ)। |
| **৩. বিশেষজ্ঞ প্যানেল ("বিশিষ্ট ব্যক্তি")** | • **রোস্টার ব্যবস্থাপনা:** বিশেষজ্ঞদের নিয়োগ ও রেটিং (যেমন: বিপিএল-এর জন্য অবসরপ্রাপ্ত ক্রিকেটার, মুদ্রাস্ফীতির জন্য অর্থনীতিবিদ)। • **এসাইনমেন্ট:** নির্দিষ্ট বিরোধ নিষ্পত্তির জন্য নির্দিষ্ট বিশেষজ্ঞকে দায়িত্ব দেওয়া। • **পারফরম্যান্স:** তাদের "সঠিকতার হার" ট্র্যাক করা – ঘন ঘন ভুল ভোট দিলে স্ট্যাটাস হারাবেন। |
| **৪. বিরোধ ট্রাইব্যুনাল ("সালিশ")** | • **প্রমাণ পর্যালোচনা:** ইউজারদের জমা দেওয়া স্ক্রিনশট/লিঙ্ক দেখার ইন্টারফেস (যেমন: বিসিবি প্রেস রিলিজ)। • **বন্ড ব্যবস্থাপনা:** লকড বন্ড (সিকিউরিটি ডিপোজিট) দেখা এবং স্প্যামের জন্য তা বাজেয়াপ্ত করা বা বৈধ বিরোধের জন্য ফেরত দেওয়ার সিদ্ধান্ত নেওয়া। |
| **৫. বাহ্যিক ওরাকল (চেইনলিংক)** | • **এপিআই স্ট্যাটাস:** ক্রিপ্টো প্রাইস ফিড বা স্পোর্টস এপিআই-এর সাথে সংযোগ পর্যবেক্ষণ করা (যেমন: ক্রিকইনফো)। • **ফলব্যাক সেটিংস:** "যদি ক্রিকইনফো এপিআই ব্যর্থ হয়, তবে স্বয়ংক্রিয়ভাবে ম্যানুয়াল রেজোলিউশনে চলে যাও।" |

## \-----**২. ইউজার-ফেসিং ফিচারসমূহ (বাংলাদেশের প্রেক্ষাপটে "Polymarket" ভিউ)**

## 

## আপনি যে স্ক্রিনশট দিয়েছেন, সেটির প্রতিটি উপাদানকে একজন বাংলাদেশি ইউজারের কাছে কীভাবে ব্যাখ্যা করবেন তা নিচে দেওয়া হলো, যাতে তারা **"ট্রেডিং"** দিকটি বোঝেন, **"বাজি"** নয়।A. ইভেন্ট গ্রাফ ("দরের গতি")

* **এটি কী:** যে বড় লাইন চার্টটি দামের উত্থান-পতন দেখায়।  
* **বাংলাদেশি প্রেক্ষাপট:** "এটি ঢাকা স্টক এক্সচেঞ্জ (DSE)-এর চার্টের মতো ভাবুন, তবে একটি নির্দিষ্ট ইভেন্টের জন্য।"  
* **ব্যবহার:** রিয়েল-টাইম সম্ভাবনা দেখায়। যদি "সাকিব খেলছেন" এর জন্য লাইনটি উপরে ওঠে, তার মানে বেশি লোক বিশ্বাস করে তিনি খেলবেন।  
* **যাচাইকরণ লিঙ্ক:** মার্কেট নিষ্পত্তি হলে এই গ্রাফটি থেমে যাবে। একটি উল্লম্ব লাইন দেখাবে **"AI দ্বারা নিষ্পত্তি"** (বা বিশেষজ্ঞ)।

B. অর্ডার বুক ("কাঁচা বাজারের দর-দাম")

* **এটি কী:** লিকুইডিটি দেখানো "বিড" (সবুজ) এবং "আস্ক" (লাল) এর তালিকা।  
* **বাংলাদেশি প্রেক্ষাপট:** "বেচা-কেনার গভীরতা।"  
  * **বিড (কেনার জন্য):** যারা কম দামে 'হ্যাঁ' কিনতে অপেক্ষা করছে (যেমন: ৪০ পয়সা)।  
  * **আস্ক (বেচার জন্য):** যারা বেশি দামে 'হ্যাঁ' বিক্রি করতে ইচ্ছুক (যেমন: ৪৫ পয়সা)।  
* **গুরুত্ব:** এটি প্রমাণ করে যে এটি একটি মার্কেটপ্লেস (Peer-to-Peer), কোনো **"হাউস"** আপনার বিরুদ্ধে বাজি ধরছে না। আপনি অন্যান্য বাংলাদেশিদের সাথে ট্রেড করছেন।

C. রেজোলিউশনের নিয়মাবলী ("নিয়মাবলী")

* **এটি কী:** "মার্কেট চুক্তি" টেক্সট ব্লক যা স্পষ্টভাবে ব্যাখ্যা করে কীভাবে বিজয়ী নির্ধারিত হবে।  
* **বাংলাদেশি প্রেক্ষাপট:** এটি সবচেয়ে গুরুত্বপূর্ণ অংশ। এটি অবশ্যই স্পষ্ট বাংলায় থাকতে হবে।  
  * ***উদাহরণ:*** "বিসিবি অফিসিয়ালভাবে বাংলাদেশ সময় রাত ১০টার মধ্যে স্কোয়াড ঘোষণা করলে এই মার্কেট 'হ্যাঁ'-তে নিষ্পত্তি হবে।"  
  * **ওরাকল সোর্স:** পরিষ্কারভাবে "সোর্স: প্রথম আলো / বিসিবি ওয়েবসাইট" তালিকাভুক্ত করবে। এটি বিশ্বাস তৈরি করে যে অ্যাডমিন প্রতারণা করবে না।

D. টপ হোল্ডার ও অ্যাক্টিভিটি ("বড় বিনিয়োগকারী")

* **এটি কী:** সবচেয়ে বেশি শেয়ার ধারণকারী ইউজারদের তালিকা।  
* **বাংলাদেশি প্রেক্ষাপট:** "হোয়েল ওয়াচিং।"  
* **ব্যবহার:**  
  * **স্বচ্ছতা:** ইউজাররা দেখতে পারবেন কোনো নির্দিষ্ট "বিশেষজ্ঞ" বা বৈধ ট্রেডার বেশি কিনছেন কিনা।  
  * **গেমফিকেশন:** ইউজাররা "টপ হোল্ডার" তালিকায় তাদের নাম দেখতে চায় (লিডারবোর্ড)। এটি একটি সামাজিক মর্যাদার স্তর যোগ করে (***বড় ভাই*** স্ট্যাটাস)।

E. কিনুন/বিক্রি করুন উইজেট ("টাকা লাগান")

* **এটি কী:** যে বক্সে আপনি পরিমাণ ইনপুট করেন এবং "ট্রেড" এ ক্লিক করেন।  
* **বাংলাদেশি প্রেক্ষাপট:**  
  * **তাৎক্ষণিক গণনা:** "আপনি যদি ১০০০ টাকা দেন, তবে আপনি ২০০০ শেয়ার পাবেন। সম্ভাব্য পেআউট: ২০০০ টাকা।"  
  * **ফি:** প্ল্যাটফর্ম ফি ২% স্পষ্টভাবে দেখান (যা স্ট্যান্ডার্ড বিকাশ ক্যাশআউটের অনুভূতির সাথে মিলে যায়)।

\-----অ্যাডমিন প্যানেল ডেভেলপমেন্টের জন্য সংক্ষিপ্ত চেকলিস্ট

## 

## ১. **বিরোধ নিষ্পত্তির কিউ ইউআই:** "পেন্ডিং \-\> ইন রিভিউ \-\> নিষ্পত্তি" এর জন্য একটি ট্রেলো-সদৃশ বোর্ড।

## 

## 

## **১. অ্যাডমিন প্যানেল: মার্কেট ক্রিয়েশন ও ম্যানেজমেন্ট (Admin Journey)**

অ্যাডমিন প্যানেলটি হবে আপনার প্ল্যাটফর্মের "কন্ট্রোল রুম"। এখানে বাংলাদেশের কনটেক্সট অনুযায়ী নিচের ধাপগুলো থাকবে:

### **ক. ইভেন্ট তৈরির ইন্টারফেস (The Navigation Journey)**

অ্যাডমিন যখন "Create Market" এ ক্লিক করবেন, তখন তিনি একটি ৩-ধাপের ফ্লো দেখতে পাবেন:

1. **Basic Info & AI Setup:**  
   * **Input:** নিউজ লিঙ্ক (যেমন: প্রথম আলো বা ক্রিকইনফো) বা কি-ওয়ার্ড।  
   * **AI Integration:** এখানে **Gemini 1.5 Pro** বাটন থাকবে যা অটোমেটিক শিরোনাম, ডেসক্রিপশন এবং ক্যাটাগরি পূরণ করে দিবে।  
   * **Local Logic:** AI চেক করবে এই ইভেন্টটি বাংলাদেশের প্রচলিত আইন বা 'Betting Laws' এর সাথে সরাসরি সাংঘর্ষিক কি না।  
2. **Resolution Strategy (The 5-System Setup):**  
   এখানে অ্যাডমিন সিলেক্ট করবেন ইভেন্টটি কীভাবে শেষ (Resolve) হবে:  
   * **AI Oracle:** অন-চেক থাকবে (Scrape logic configuration)।  
   * **Expert Panel:** ড্রপডাউন থেকে নির্দিষ্ট ক্যাটাগরির (যেমন: 'Sports Experts') সিলেক্ট করা যাবে।  
   * **Dispute Window:** কতক্ষণ ইউজাররা আপিল করার সুযোগ পাবে (সাধারণত ২৪ ঘণ্টা)।  
3. **Liquidity & Launch:**  
   * অ্যাডমিন প্রাথমিক লিকুইডিটি বা 'Initial Pool' সেট করবেন (বিকাশ/নগদ গেটওয়ের মাধ্যমে সংগৃহীত ফান্ড থেকে)।

---

## **২. ইউজার ফেসিয়িং ফিচার (Polymarket UI এর আদলে)**

ইউজাররা যখন অ্যাপ বা ওয়েবসাইট ব্যবহার করবে, তারা নিচের মূল এলিমেন্টগুলো দেখতে পাবে:

### **ক. মার্কেট কার্ড (Market Card)**

* **Question:** সরাসরি প্রশ্ন (যেমন: "বিপিএল ২০২৬ কি ঢাকা জিতবে?")।  
* **Yes/No Odds:** কত টাকায় ১ টোকেন পাওয়া যাচ্ছে (যেমন: Yes ০.৬০ টোকেন, No ০.৪০ টোকেন)।  
* **Volume:** বাংলাদেশে কতজন এই মার্কেটে অংশ নিয়েছে।

### **খ. লাইভ অর্ডার বুক (Order Book)**

* ইউজাররা দেখতে পাবে কোন দামে কতগুলো 'Yes' বা 'No' শেয়ার বিক্রির জন্য ঝুলে আছে। এটি ট্রেডিংয়ের অভিজ্ঞতা দেবে।

### **গ. রেজোলিউশন স্ট্যাটাস (Verification Badge)**

ইভেন্টের নিচে পরিষ্কার ব্যাজ থাকবে:

* **"AI Verified"**: যদি AI ওরাকল দিয়ে রেজাল্ট আসে।  
* **"Community Disputed"**: যদি ইউজাররা আপিল করে থাকে। এটি স্বচ্ছতা নিশ্চিত করে।

---

## **৩. ইউজার লেভেল ইমপ্লিমেন্টেশন (List of Levels & Implementation)**

ইউজারদের এনগেজমেন্ট এবং প্ল্যাটফর্মের সিকিউরিটির জন্য আমরা এই ৪টি লেভেল ব্যবহার করব:

### **লেভেলের তালিকা ও সুবিধা**

| লেভেল | নাম | রিকোয়ারমেন্ট (Requirements) | বেনিফিট (Benefits) |
| :---- | :---- | :---- | :---- |
| **Level 1** | **Rookie** | শুধু বিকাশ/নগদ ভেরিফিকেশন। | বেসিক ট্রেডিং (সীমিত লিমিট)। |
| **Level 2** | **Analyst** | ১০টি সফল ট্রেড \+ ৫,০০০ টাকা টার্নওভার। | **Platform Fee** ২% কমে যাবে। |
| **Level 3** | **Expert** | ২৫টি সঠিক প্রেডিকশন \+ ৮৫% সঠিকতা। | **Community Dispute** এ ভোট দেওয়ার ক্ষমতা। |
| **Level 4** | **Guardian** | ১০০+ ট্রেড \+ কোনো ভায়োলেশন নেই। | **Expert Panel** এর মেম্বার হওয়ার সুযোগ ও রেভিনিউ শেয়ার। |

### **কোথায় এবং কীভাবে ইমপ্লিমেন্ট করবেন? (Implementation Guide)**

* **Database (PostgreSQL/Supabase):** users টেবিলে xp\_points এবং tier কলাম থাকবে।  
* **Trigger Function:** প্রতিবার কোনো ট্রেড সেটেল হলে একটি ডাটাবেস ফাংশন রান করবে যা ইউজারের স্কোর চেক করে অটো-লেভেল আপ করবে।  
* **Frontend logic:** ইউজার ড্যাশবোর্ডে **"Progress to Next Level"** বার দেখাবে। যখন কেউ Level 3 তে যাবে, তার জন্য **"Dispute Center"** ট্যাবটি আনলক হবে।

---

## **৪. বাংলাদেশের প্রেক্ষাপটে পেমেন্ট ফ্লো (Production Ready)**

যেহেতু পলিমান্কেট ক্রিপ্টো (USDC) ব্যবহার করে, আমরা বাংলাদেশে নিচের ফ্লো ব্যবহার করব:

1. **Deposit:** ইউজার বিকাশ/নগদ দিয়ে টাকা লোড করবে। আমাদের ব্যাকএন্ড সেই টাকা সমপরিমাণ **'Internal Credits'** বা টোকেনে কনভার্ট করে ওয়ালেটে দেখাবে।  
2. **Trade:** ইউজার এই টোকেন দিয়ে শেয়ার কিনবে।  
3. **Withdraw:** ইউজার যখন ক্যাশ-আউট রিকোয়েস্ট দিবে, অ্যাডমিন প্যানেল থেকে অটোমেটিক বিকাশ API-এর মাধ্যমে টাকা সেন্ট-মানি হয়ে যাবে।

# Core Features: Database to Frontend Integration

**Core Features: Database to Frontend Integration**

The core features are integrated from the Database up to the Frontend.1. Market Discovery Engine (The Storefront)

* **Core Feature:** Users browse active prediction markets, filter by category (Sports, Politics), and view live probabilities.  
* **Database (PostgreSQL):**  
  * `markets` table: Stores the core event data (Question, Description, Resolution Source, End Date).  
  * `market_creation_drafts`: Where admins/users build markets before they go live.  
* **Backend (Supabase):**  
  * RLS Policies: Ensure users only see `status = 'active'` markets (or their own drafts).  
  * Realtime: Subscriptions to the `markets` table push updates instantly when a market is resolved or liquidity changes.  
* **Frontend (Next.js):**  
  * `useMarkets` hook: Fetches data via `supabase-js`.  
  * `MarketCard` component: Displays the "Probability %" calculated from the Order Book.

2\. Trading System (CLOB \- Central Limit Order Book)

* **Core Feature:** The heart of the app. Users Buy (Bid) and Sell (Ask) outcome shares (Yes/No).  
* **Database:**  
  * `order_book`: Stores every single unfilled order (Price, Quantity, User, Expiry).  
  * `trades`: Immutable record of every matched transaction between Buyer and Seller.  
  * `user_positions`: Tracks how many shares a user currently holds.  
* **Backend:**  
  * Matching Engine (RPC): A Postgres Function (`match_order`) that runs atomically. When a user places an order, it instantly checks for a match. If matched, it creates a trade and updates user\_positions. If not, it sits in the `order_book`.  
* **Frontend:**  
  * `OrderBook` component: Visualizes the "Depth" (Green/Red bars).  
  * `TradeForm`: User inputs limit price and quantity. Calls `supabase.rpc('place_order', ...)` directly.

3\. Wallet & Payment System (The Bank)

* **Core Feature:** Handling Deposits (Bkash/Nagad), Withdrawals, and locking funds for orders.  
* **Database:**  
  * `wallets`: Stores the user's *Available Balance* and *Locked Balance* (funds tied up in open orders).  
  * `payment_transactions`: Logs every Bkash/Nagad deposit request and its status (Pending \-\> Approved).  
* **Backend:**  
  * Security Triggers: Database triggers prevent `locked_balance` from ever exceeding `total_balance`.  
  * Admin RPCs: `approve_deposit` function allows admins to verify a TrxID and credit the user's wallet safely.  
* **Frontend:**  
  * `WalletDashboard`: Shows balance and "Deposit" tabs.  
  * `WithdrawalForm`: Checks if amount \< `available_balance` before submitting.

4\. Oracle & Resolution (The Truth)

* **Core Feature:** Determining who won.  
* **Database:**  
  * `oracle_verifications`: Stores the AI or Admin's decision on a market outcome.  
  * `disputes`: Allows users to challenge a decision by bonding funds.  
* **Backend:**  
  *   **Pipeline:**  
    1. AI Scraper: Checks news sources \-\> Updates `oracle_verifications`.  
    2. Resolution: If no dispute, `resolve_market` RPC runs \-\> Calculates payouts \-\> Updates `user_positions` \-\> Unlocks funds to `wallets`.  
* **Frontend:**  
  * `ResolutionPanel`: Shows the "Proposed Outcome" and a countdown to finalization.

5\. Social & Gamification (The Community)

* **Core Feature:** Leaderboards, User Levels, and Chat.  
* **Database:**  
  * `user_trading_stats`: Tracks volume and PnL to calculate "Rank".  
  * `user_levels`: Defines badges (Greenhorn, Pro, Whale).  
  * `comments`: Threaded discussions on market pages.  
* **Backend:**  
  * Scheduled Jobs: Nightly calculation of Leaderboard rankings.  
  * Triggers: Automatically upgrades a user's Level when they hit a volume milestone.  
* **Frontend:**  
  * `LeaderboardTable`: Displays top traders.  
  * `ProfileBadges`: Shows off the user's level next to their name in comments.

# ভার্চুয়াল USDT ম্যানেজমেন্ট সিস্টেম

# **বাংলাদেশ ভিত্তিক ভার্চুয়াল USDT ম্যানেজমেন্ট সিস্টেম: সম্পূর্ণ ইমপ্লিমেন্টেশন গাইড**

## **১. সিস্টেম আর্কিটেকচার ও প্রযুক্তি স্ট্যাক**

### **১.১ কোর আর্কিটেকচার**

ALso we need to addan realtime usdt price api or fetch data from somewhere and keep changing the value on everywhere it distributed এই সিস্টেমের মূল ভিত্তি হলো একটি ক্লোজড-লুপ ডাটাবেস লেজার সিস্টেম, যেখানে ভার্চুয়াল USDT কোনো ব্লকচেইন নেটওয়ার্কের উপর নির্ভরশীল নয়, বরং সম্পূর্ণভাবে PostgreSQL ডাটাবেসের মাধ্যমে পরিচালিত হয়। এই আর্কিটেকচারাল পদ্ধতি বাংলাদেশের প্রেক্ষাপটে বিশেষভাবে উপযোগী কারণ এটি ব্লকচেইন-সম্পর্কিত নিয়ন্ত্রণগত জটিলতা এড়িয়ে একটি নিয়ন্ত্রিত পরিবেশে দ্রুত, কম খরচে এবং সম্পূর্ণ অডিটেবল ডিজিটাল কারেন্সি ম্যানেজমেন্ট সম্ভব করে। সিস্টেমের প্রতিটি USDT কয়েন শুধুমাত্র একটি ডাটাবেস এন্ট্রি—এর কোনো বাস্তব ব্লকচেইন মূল্য নেই, কিন্তু এটি প্ল্যাটফর্মের ভেতরে সম্পূর্ণ লিকুইডিটি এবং ট্রেডেবিলিটি প্রদান করে।  
ব্লকচেইন-ইন্ডিপেন্ডেন্ট আর্কিটেকচারের সুবিধাগুলো:

TableCopy

| সুবিধা | বর্ণনা | ব্লকচেইন তুলনা |
| :---- | :---- | :---- |
| ট্রানজেকশন স্পিড | মিলিসেকেন্ডে সম্পন্ন | মিনিট থেকে ঘণ্টা লাগতে পারে |
| ট্রানজেকশন কস্ট | প্রায় শূন্য | গ্যাস ফি প্রয়োজন |
| স্কেলেবিলিটি | ভার্টিকাল স্কেলিং সম্ভব | নেটওয়ার্ক কংগেশন সীমাবদ্ধতা |
| রেগুলেটরি কমপ্লায়েন্স | সম্পূর্ণ নিয়ন্ত্রিত | ডিসেন্ট্রালাইজড, নিয়ন্ত্রণ কঠিন |
| MFS ইন্টিগ্রেশন | সরাসরি API কল | ব্রিজ বা ওয়ারপ সার্ভিস প্রয়োজন |

তবে এই সিস্টেমের একটি সীমাবদ্ধতা হলো এটি প্ল্যাটফর্ম-স্পেসিফিক—এই USDT শুধুমাত্র আমাদের প্ল্যাটফর্মেই ব্যবহারযোগ্য, বাইরের কোনো এক্সচেঞ্জ বা ওয়ালেটে ট্রান্সফার করা যায় না। এই ট্রেড-অফ গ্রহণযোগ্য কারণ লক্ষ্য হলো একটি ক্লোজড প্রেডিকশন মার্কেটপ্লেস ইকোসিস্টেম তৈরি করা, একটি ওপেন ফিনান্সিয়াল সিস্টেম নয়।

BDT-USDT এক্সচেঞ্জ রেট কনফিগারেশন সিস্টেমের একটি গুরুত্বপূর্ণ অংশ। উদাহরণে ১০০ BDT \= ১ USDT হিসেবে ধরা হয়েছে, কিন্তু এই রেট ডাইনামিকভাবে পরিবর্তনযোগ্য। একটি `exchange_rates` টেবিল তৈরি করা যেতে পারে যেখানে `bdt_to_usdt` এবং `usdt_to_bdt` রেট স্টোর করা হয়, সাথে `effective_from` এবং `effective_until` টাইমস্ট্যাম্প। এর মাধ্যমে মার্কেট কন্ডিশন অনুযায়ী রেট আপডেট, হিস্টরিক্যাল রেট ট্র্যাকিং, বিভিন্ন ইউজার ক্যাটেগরির জন্য ভিন্ন রেট (VIP, regular), এবং প্রমোশনাল পিরিয়ডে স্পেশাল রেট ইমপ্লিমেন্ট করা যায়।

### **১.২ প্রযুক্তি স্ট্যাক ওভারভিউ**

TableCopy

| লেয়ার | প্রযুক্তি | ভার্সন | পারপাস | বিকল্প বিবেচনা |
| :---- | :---- | :---- | :---- | :---- |
| Frontend Framework | Next.js | 14+ (App Router) | SSR, API Routes, Full-stack React | Remix, Nuxt.js |
| UI Library | React | 18+ | Component-based UI | Vue, Svelte |
| Styling | Tailwind CSS | 3.4+ | Utility-first CSS | Styled Components |
| State Management | Zustand \+ React Query | Latest | Client state, Server state caching | Redux, SWR |
| Backend/Database | Supabase | Latest | PostgreSQL, Auth, Realtime, Storage | Firebase, PlanetScale |
| Database Engine | PostgreSQL | 15+ | ACID-compliant relational DB | MySQL, MongoDB |
| Workflow Automation | n8n | Latest | Business process automation | Zapier, Make.com |
| Local Development | Docker Compose | 2.20+ | Containerized dev environment | Podman, LXC |
| Production Hosting | Vercel | Free Tier | Edge deployment, CI/CD | Netlify, Railway |
| Monitoring | Vercel Analytics \+ Supabase Logs | Built-in | Performance, Error tracking | Sentry, Datadog |

Next.js 14+ App Router-এর বেছে নেওয়ার কারণ হলো এর বিল্ট-ইন API Routes সাপোর্ট, যা আলাদা ব্যাকএন্ড সার্ভার ছাড়াই ফুল-স্ট্যাক ডেভেলপমেন্ট সম্ভব করে। App Router-এর React Server Components (RSC) ডাটা-হেভি ফিনান্সিয়াল অ্যাপ্লিকেশনের জন্য পারফরম্যান্স অপ্টিমাইজেশন প্রদান করে—`loading.js` এবং `error.js` কনভেনশনগুলো লোডিং স্টেট ও এরর হ্যান্ডলিং স্ট্যান্ডার্ডাইজ করে। Vercel-এর ফ্রি টিয়ারে প্রতি মাসে ১০০ GB ব্যান্ডউইথ এবং ১০০০ বিল্ড মিনিট পাওয়া যায়, যা একটি স্টার্টআপ প্রজেক্টের জন্য যথেষ্ট।

Supabase PostgreSQL-এর উপর বিল্ট একটি ওপেন-সোর্স Firebase অল্টারনেটিভ। এটি প্রদান করে:

* Authentication: Email/password, Magic Link, OAuth, Phone OTP, MFA  
* Database: Full PostgreSQL with extensions (pg\_cron, pg\_stat\_statements)  
* Realtime: WebSocket-based live subscriptions for balance updates  
* Storage: Object storage for KYC documents, receipts  
* Edge Functions: Deno-based serverless functions for custom logic

n8n ওয়ার্কফ্লো অটোমেশনের জন্য বেছে নেওয়া হয়েছে কারণ এটি সেলফ-হোস্টেড হতে পারে (ডেটা সোভারেন্টি নিশ্চিত করে), ৪০০+ ইন্টিগ্রেশন আছে, এবং কোড-লো অটোমেশন সম্ভব। বাংলাদেশের প্রেক্ষাপটে, যেখানে ডেটা লোকালাইজেশন গুরুত্বপূর্ণ, n8n-এর সেলফ-হোস্টেড অপশন একটি বড় সুবিধা।

### **১.৩ সিস্টেম কম্পোনেন্টস ও তাদের দায়িত্ব**

সিস্টেমের পাঁচটি কোর ডাটাবেস টেবিলের মধ্যে সম্পর্ক ও দায়িত্ব নিম্নরূপ:

TableCopy

| টেবিল | প্রাইমারি কি | মূল দায়িত্ব | সম্পর্ক |
| :---- | :---- | :---- | :---- |
| `auth.users` | `id` (UUID) | Supabase নেটিভ অথেনটিকেশন, JWT সেশন | প্যারেন্ট টেবিল |
| `profiles` | `id` (UUID, FK) | ইউজার ব্যালেন্স, KYC স্ট্যাটাস, লিমিটস | ১:১ `auth.users` |
| `transactions` | `id` (UUID) | সমস্ত লেনদেনের অডিট ট্রেইল | N:১ `auth.users` |
| `deposit_requests` | `id` (UUID) | MFS ডিপোজিট কিউ, ভেরিফিকেশন স্ট্যাটাস | N:১ `auth.users` |
| `withdrawal_requests` | `id` (UUID) | USDT উইথড্র কিউ, ব্যালেন্স হোল্ড | N:১ `auth.users` |

`auth.users` — Supabase-এর বিল্ট-ইন অথেনটিকেশন টেবিল। ইউজার রেজিস্ট্রেশন, লগইন, পাসওয়ার্ড রিসেট, ইমেইল ভেরিফিকেশন—সব এখানে ম্যানেজ হয়। এই টেবিলে ট্রিগার লাগিয়ে সাইনআপ বোনাস অটোমেট করা হয়। UUID প্রাইমারি কি, `email`, `encrypted_password`, `email_confirmed_at`, `created_at` ইত্যাদি ফিল্ড আছে।

`profiles` — ইউজারের ব্যালেন্স ও অতিরিক্ত প্রোফাইল ডেটা। `auth.users`\-এর সাথে ১:১ রিলেশনশিপ। ফিল্ডস: `id` (UUID, FK to auth.users), `balance` (DECIMAL 12,2), `total_deposited`, `total_withdrawn`, `kyc_status`, `daily_withdrawal_limit`, `created_at`, `updated_at`। এই টেবিলে RLS পলিসি লাগানো আছে যাতে ইউজার শুধু নিজের ডেটা দেখতে পায়।

`transactions` — সমস্ত লেনদেনের অডিট ট্রেইল। ইমিউটেবল লগ—কোনো রো ডিলিট বা আপডেট করা যাবে না। ফিল্ডস: `id` (UUID PK), `user_id` (FK), `amount` (DECIMAL 12,2), `type` (ENUM: deposit, withdrawal, bonus, exchange, refund, fee, commission), `description`, `status`, `reference_id`, `metadata` (JSONB), `created_at`। `metadata` JSONB ফিল্ডে MFS TxnID, exchange rate at time of transaction, IP address ইত্যাদি স্টোর করা যায়।

`deposit_requests` — MFS ডিপোজিট কিউ। ইউজার সাবমিট করে, অ্যাডমিন ভেরিফাই করে। ফিল্ডস: `id`, `user_id`, `bdt_amount`, `usdt_amount`, `exchange_rate` (রেট হিস্টরি), `mfs_provider` (bkash/nagad/rocket/upay), `txn_id` (UNIQUE), `sender_number`, `status` (pending/verified/rejected/auto\_approved), `admin_notes`, `verified_by`, `verified_at`, `expires_at`, `created_at`। `UNIQUE(txn_id, mfs_provider)` কনস্ট্রেইন্ট—একই TxnID দুইবার ব্যবহার প্রিভেন্ট করে।

`withdrawal_requests` — USDT উইথড্র কিউ। ফিল্ডস: `id`, `user_id`, `usdt_amount`, `bdt_amount`, `exchange_rate`, `mfs_provider`, `recipient_number`, `recipient_name`, `status` (pending/processing/completed/rejected/cancelled), `balance_hold_id` (সেপারেট holds টেবিলের রেফারেন্স), `processed_by`, `processed_at`, `admin_notes`, `transfer_proof_url`, `created_at`, `updated_at`। স্ট্যাটাস মেশিন: pending → processing (balance hold) → completed/rejected।

## **২. ডাটাবেস স্কিমা ও ট্রিগার ইমপ্লিমেন্টেশন**

### **২.১ প্রোডাকশন স্কিমা (schema\_production.sql)**

#### **২.১.১ profiles টেবিল: ব্যালেন্স ম্যানেজমেন্টের কেন্দ্র**

`profiles` টেবিলের ডিজাইনে ফিনান্সিয়াল প্রিসিশন-কে সর্বোচ্চ গুরুত্ব দেওয়া হয়েছে। `DECIMAL(12,2)` ডেটা টাইপ নির্বাচনের পেছনে গণিত রয়েছে: ১২ ডিজিটের মোট প্রিসিশন মানে ম্যাক্সিমাম ৯৯৯,৯৯৯,৯৯৯,৯৯৯.৯৯ USDT স্টোর করা সম্ভব, যা প্রায় ১ বিলিয়ন USDT। বাংলাদেশি মার্কেটের context-এ এটি মিড-সাইজ প্ল্যাটফর্মের জন্য পর্যাপ্ত। ২ ডিজিটের স্কেল USDT-এর স্ট্যান্ডার্ড ৬ ডেসিমাল প্লেসের পরিবর্তে ২ ডিজিট ব্যবহার করে, কারণ এই সিস্টেমে ভার্চুয়াল USDT whole units-এ ট্রেড হয়।

sqlCopy

CREATE TABLE public.profiles (  
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,  
  balance DECIMAL(12,2) DEFAULT 0.00 NOT NULL   
    CHECK (balance \>= 0),  
  total\_deposited DECIMAL(12,2) DEFAULT 0.00 NOT NULL,  
  total\_withdrawn DECIMAL(12,2) DEFAULT 0.00 NOT NULL,  
  kyc\_status VARCHAR(20) DEFAULT 'pending'   
    CHECK (kyc\_status IN ('pending', 'verified', 'rejected')),  
  kyc\_submitted\_at TIMESTAMPTZ,  
  daily\_withdrawal\_limit DECIMAL(12,2) DEFAULT 1000.00,  
  last\_withdrawal\_date DATE,  
  referral\_code VARCHAR(20) UNIQUE,  
  created\_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,  
  updated\_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,  
    
  CONSTRAINT positive\_balance CHECK (balance \>= 0)  
);

*\-- অটো-আপডেট updated\_at ট্রিগার*  
CREATE OR REPLACE FUNCTION update\_updated\_at\_column()  
RETURNS TRIGGER AS $$  
BEGIN  
  NEW.updated\_at \= NOW();  
  RETURN NEW;  
END;  
$$ LANGUAGE plpgsql;

CREATE TRIGGER update\_profiles\_updated\_at  
  BEFORE UPDATE ON public.profiles

  FOR EACH ROW EXECUTE FUNCTION update\_updated\_at\_column();

`ON DELETE CASCADE` নিশ্চিত করে যে ইউজার অ্যাকাউন্ট ডিলিট হলে সংশ্লিষ্ট প্রোফাইলও অটোমেটিক ডিলিট হয়ে যায়। `kyc_status` ফিল্ডটি ভবিষ্যতের KYC ইন্টিগ্রেশনের জন্য প্রস্তুত—বাংলাদেশ ব্যাংকের নিয়মানুযায়ী প্রেডিকশন মার্কেটপ্লেস পরিচালনার জন্য এটি প্রয়োজন হতে পারে। `daily_withdrawal_limit` এবং `last_withdrawal_date` রেট লিমিটিং ইমপ্লিমেন্ট করে।

#### **২.১.২ transactions টেবিল: অডিট-গ্রেড ডিজাইন**

`transactions` টেবিল সিস্টেমের "সিঙ্গেল সোর্স অফ ট্রুথ"। প্রতিটি ব্যালেন্স চেঞ্জ—চাই ডিপোজিট হোক, উইথড্র হোক, বা বোনাস—এই টেবিলে একটি সেপারেট রো হিসেবে রেকর্ড হয়। এই টেবিলের স্কিমা ইমিউটেবল, অর্থাৎ একবার ইনসার্ট হওয়া রো আর আপডেট বা ডিলিট করা যায় না। ভুল হলে একটি রিভার্সাল transaction তৈরি করতে হবে।

sqlCopy

CREATE TYPE transaction\_type AS ENUM (  
  'deposit', 'withdrawal', 'bonus', 'exchange', 'refund', 'fee', 'commission'  
);

CREATE TYPE transaction\_status AS ENUM (  
  'pending', 'completed', 'failed', 'reversed'  
);

CREATE TABLE public.transactions (  
  id UUID DEFAULT gen\_random\_uuid() PRIMARY KEY,  
  user\_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,  
  amount DECIMAL(12,2) NOT NULL CHECK (amount \> 0),  
  type transaction\_type NOT NULL,  
  description TEXT NOT NULL,  
  status transaction\_status DEFAULT 'completed' NOT NULL,  
  reference\_id UUID, *\-- deposit\_requests বা withdrawal\_requests এর সাথে লিংক*  
  metadata JSONB DEFAULT '{}', *\-- অতিরিক্ত ডেটার জন্য ফ্লেক্সিবল স্টোরেজ*  
  ip\_address INET, *\-- সিকিউরিটি অডিটিং*  
  user\_agent TEXT,  
  created\_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,  
  completed\_at TIMESTAMPTZ,  
    
  CONSTRAINT positive\_amount CHECK (amount \> 0)  
);

*\-- পারফরম্যান্স ইনডেক্সেস*  
CREATE INDEX idx\_transactions\_user\_created   
  ON public.transactions(user\_id, created\_at DESC);  
CREATE INDEX idx\_transactions\_type\_status   
  ON public.transactions(type, status);  
CREATE INDEX idx\_transactions\_reference 

  ON public.transactions(reference\_id) WHERE reference\_id IS NOT NULL;

`reference_id` কলামটি পলিমোর্ফিক রিলেশনশিপ তৈরি করে। একটি deposit transaction `reference_type = 'deposit_request'` এবং `reference_id = <request_uuid>` সেট করতে পারে। এর মাধ্যমে এন্ড-টু-এন্ড ট্রেসেবিলিটি নিশ্চিত হয়—যেকোনো সময় transaction থেকে মূল রিকোয়েস্টে নেভিগেশন সম্ভব। `metadata` JSONB-এর উদাহরণ স্ট্রাকচার:

JSONCopy

{  
  "deposit\_request": {  
    "mfs\_provider": "bkash",  
    "txn\_id": "8A7B6C5D4E",  
    "sender\_number": "01712345678",  
    "sender\_name": "John Doe"  
  },  
  "ip\_geolocation": {  
    "country": "BD",  
    "city": "Dhaka",  
    "isp": "Grameenphone"  
  },  
  "exchange\_rate": {  
    "bdt\_to\_usdt": 100.00,  
    "applied\_at": "2024-01-15T10:30:00Z"  
  }

}

#### **২.১.৩ deposit\_requests টেবিল: স্টেট মেশিন ডিজাইন**

`deposit_requests` টেবিলটি ম্যানুয়াল ভেরিফিকেশন ওয়ার্কফ্লোর কোর। `status` ফিল্ডের স্টেট ট্রানজিশন:

plainCopy

pending → under\_review → verified → completed  
   ↓           ↓            ↓

rejected ←─────────────── (any state)

sqlCopy

CREATE TYPE mfs\_provider AS ENUM ('bkash', 'nagad', 'rocket', 'upay');  
CREATE TYPE deposit\_status AS ENUM (  
  'pending', 'under\_review', 'verified', 'rejected', 'auto\_approved', 'completed'  
);

CREATE TABLE public.deposit\_requests (  
  id UUID DEFAULT gen\_random\_uuid() PRIMARY KEY,  
  user\_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,  
    
  *\-- ফিনান্সিয়াল ডেটা*  
  bdt\_amount DECIMAL(12,2) NOT NULL CHECK (bdt\_amount \>= 50),  
  usdt\_amount DECIMAL(12,2) NOT NULL CHECK (usdt\_amount \> 0),  
  exchange\_rate DECIMAL(10,4) NOT NULL,  
    
  *\-- MFS ইনফরমেশন*  
  mfs\_provider mfs\_provider NOT NULL,  
  txn\_id VARCHAR(100) NOT NULL,  
  sender\_number VARCHAR(20) NOT NULL,  
  sender\_name VARCHAR(100),  
    
  *\-- স্টেট মেশিন*  
  status deposit\_status DEFAULT 'pending' NOT NULL,  
    
  *\-- অ্যাডমিন ভেরিফিকেশন*  
  admin\_notes TEXT,  
  verified\_by UUID REFERENCES auth.users(id),  
  verified\_at TIMESTAMPTZ,  
  rejection\_reason TEXT,  
    
  *\-- অটো-ভেরিফিকেশন (ফিউচার)*  
  auto\_verification\_attempted BOOLEAN DEFAULT FALSE,  
  auto\_verification\_result JSONB,  
    
  *\-- অডিট ট্রেইল*  
  ip\_address INET,  
  user\_agent TEXT,  
  created\_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,  
  expires\_at TIMESTAMPTZ DEFAULT (NOW() \+ INTERVAL '24 hours'),  
  updated\_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,  
    
  *\-- ইউনিক কনস্ট্রেইন্টস*  
  UNIQUE(txn\_id, mfs\_provider),  
    
  *\-- স্টেট ভ্যালিডেশন*  
  CONSTRAINT valid\_verification CHECK (  
    (status IN ('verified', 'rejected', 'completed') AND verified\_by IS NOT NULL)  
    OR (status IN ('pending', 'under\_review', 'auto\_approved') AND verified\_by IS NULL)  
  )  
);

*\-- ক্রিটিক্যাল ইনডেক্সেস*  
CREATE INDEX idx\_deposits\_status\_created   
  ON public.deposit\_requests(status, created\_at);  
CREATE INDEX idx\_deposits\_user   
  ON public.deposit\_requests(user\_id, created\_at DESC);  
CREATE INDEX idx\_deposits\_txn\_provider 

  ON public.deposit\_requests(txn\_id, mfs\_provider);

`UNIQUE(txn_id, mfs_provider)` কনস্ট্রেইন্টটি গুরুত্বপূর্ণ—একই TxnID ভিন্ন প্রোভাইডারে ব্যবহার করা যেতে পারে (যেমন একই নাম্বারে bKash ও Nagad দুটোই থাকতে পারে), কিন্তু একই প্রোভাইডারে একই TxnID দুইবার ব্যবহার প্রিভেন্ট করা হয়। `expires_at` ফিল্ডটি পেন্ডিং রিকোয়েস্ট অটো-এক্সপায়ার করতে ব্যবহৃত হয়।

#### **২.১.৪ withdrawal\_requests টেবিল: ব্যালেন্স হোল্ড মেকানিজম**

sqlCopy

CREATE TYPE withdrawal\_status AS ENUM (  
  'pending', 'processing', 'completed', 'rejected', 'cancelled'  
);

CREATE TABLE public.withdrawal\_requests (  
  id UUID DEFAULT gen\_random\_uuid() PRIMARY KEY,  
  user\_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,  
    
  *\-- ফিনান্সিয়াল ডেটা*  
  usdt\_amount DECIMAL(12,2) NOT NULL CHECK (usdt\_amount \> 0),  
  bdt\_amount DECIMAL(12,2) NOT NULL CHECK (bdt\_amount \> 0),  
  exchange\_rate DECIMAL(10,4) NOT NULL,  
    
  *\-- রিসিপিয়েন্ট ইনফরমেশন*  
  mfs\_provider mfs\_provider NOT NULL,  
  recipient\_number VARCHAR(20) NOT NULL,  
  recipient\_name VARCHAR(100),  
    
  *\-- স্ট্যাটাস মেশিন*  
  status withdrawal\_status DEFAULT 'pending' NOT NULL,  
    
  *\-- ব্যালেন্স হোল্ড (processing স্টেটে)*  
  balance\_hold\_id UUID, *\-- সেপারেট holds টেবিলের রেফারেন্স*  
    
  *\-- অ্যাডমিন প্রসেসিং*  
  processed\_by UUID REFERENCES auth.users(id),  
  processed\_at TIMESTAMPTZ,  
  admin\_notes TEXT,  
  transfer\_proof\_url TEXT, *\-- স্ক্রিনশট/রিসিপ্ট*  
    
  *\-- ইউজার ক্যান্সেললেশন*  
  cancelled\_at TIMESTAMPTZ,  
  cancellation\_reason TEXT,  
    
  *\-- অডিট ট্রেইল*  
  ip\_address INET,  
  user\_agent TEXT,  
  created\_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,  
  updated\_at TIMESTAMPTZ DEFAULT NOW() NOT NULL

);

ব্যালেন্স হোল্ড মেকানিজম—যখন একটি withdrawal `processing` স্টেটে যায়, সিস্টেম ইউজারের ব্যালেন্স থেকে USDT কেটে একটি সেপারেট `balance_holds` টেবিলে রাখে। এটি ডাবল-স্পেন্ডিং প্রিভেন্ট করে। যদি withdrawal `rejected` বা `cancelled` হয়, হোল্ড রিলিজ করে ব্যালেন্সে ফেরত দেওয়া হয়।

### **২.২ সাইনআপ বোনাস ট্রিগার: RLS-কমপ্লায়েন্ট ইমপ্লিমেন্টেশন**

#### **২.২.১ SECURITY DEFINER এর গুরুত্ব**

Supabase-এ RLS (Row Level Security) এনাবল্ড থাকলে, সাধারণ ট্রিগার ফাংশন `auth.users` থেকে `profiles` এবং `transactions`\-এ লিখতে পারে না কারণ ট্রিগারটি "anonymous" রোলে চলে। এই সমস্যার সমাধান হলো `SECURITY DEFINER` অ্যাট্রিবিউট ব্যবহার করা, যা ট্রিগার ফাংশনটিকে ডিফাইনারের (postgres সুপারইউজার) প্রিভিলেজে রান করতে দেয়, কলারের প্রিভিলেজে নয়।

sqlCopy

*\-- পুরোপুরি RLS-কমপ্লায়েন্ট ট্রিগার*  
CREATE OR REPLACE FUNCTION public.handle\_new\_user\_bonus()  
RETURNS trigger   
SECURITY DEFINER      *\-- ক্রিটিক্যাল: ফাংশন ওনারের পারমিশনে রান করে*  
SET search\_path \= public  *\-- SQL ইনজেকশন প্রিভেনশন*  
AS $$  
DECLARE  
  v\_bonus\_amount DECIMAL(12,2) :\= 5.00;  
  v\_max\_bonus\_per\_ip INTEGER :\= 3;  *\-- IP-based অ্যাবিউজ প্রিভেনশন*  
  v\_user\_ip INET;  
  v\_existing\_count INTEGER;  
  v\_user\_exists BOOLEAN;  
BEGIN  
  *\-- আইডেম্পোটেন্সি চেক: ইউজার আগে থেকেই profiles-এ আছে কিনা*  
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id \= new.id)   
  INTO v\_user\_exists;  
    
  IF v\_user\_exists THEN  
    RAISE NOTICE 'Profile already exists for user %, skipping bonus', new.id;  
    RETURN NEW;  
  END IF;

  *\-- IP-based অ্যাবিউজ চেক (ঐচ্ছিক)*  
  v\_user\_ip :\= inet\_client\_addr();  
    
  SELECT COUNT(\*) INTO v\_existing\_count  
  FROM public.profiles p  
  JOIN auth.users u ON p.id \= u.id  
  WHERE u.raw\_user\_meta\_data\-\>\>'ip\_address' \= v\_user\_ip::TEXT  
    AND p.created\_at \> NOW() \- INTERVAL '24 hours';  
    
  IF v\_existing\_count \>= v\_max\_bonus\_per\_ip THEN  
    v\_bonus\_amount :\= 0;  *\-- বোনাস বাতিল, কিন্তু অ্যাকাউন্ট তৈরি হয়*  
  END IF;

  *\-- profiles টেবিলে নতুন রো তৈরি*  
  INSERT INTO public.profiles (  
    id,   
    balance,  
    total\_deposited,  
    total\_withdrawn,  
    created\_at,  
    updated\_at  
  ) VALUES (  
    new.id,   
    v\_bonus\_amount,  
    0.00,  
    0.00,  
    NOW(),  
    NOW()  
  );  
    
  *\-- শুধুমাত্র বোনাস \> 0 হলে transaction রেকর্ড*  
  IF v\_bonus\_amount \> 0 THEN  
    INSERT INTO public.transactions (  
      user\_id,   
      amount,   
      type,   
      description,  
      status,  
      metadata,  
      created\_at  
    ) VALUES (  
      new.id,   
      v\_bonus\_amount,   
      'bonus',   
      'Signup Bonus USDT \- Welcome to Prediction Market',  
      'completed',  
      jsonb\_build\_object(  
        'source', 'signup\_trigger',  
        'triggered\_at', NOW(),  
        'ip\_address', v\_user\_ip,  
        'rate\_limited', false  
      ),  
      NOW()  
    );  
      
    *\-- নোটিফিকেশন (ঐচ্ছিক)*  
    INSERT INTO public.notifications (  
      user\_id,  
      type,  
      title,  
      message,  
      created\_at  
    ) VALUES (  
      new.id,  
      'bonus\_credited',  
      'Welcome Bonus Received\!',  
      format('You have received %s USDT as signup bonus.', v\_bonus\_amount),  
      NOW()  
    );  
  END IF;  
    
  RAISE LOG 'Signup bonus % USDT credited to user %', v\_bonus\_amount, new.id;  
    
  RETURN NEW;  
EXCEPTION  
  WHEN OTHERS THEN  
    *\-- লগিং করুন কিন্তু সাইনআপ ব্লক করবেন না*  
    RAISE WARNING 'Failed to process signup bonus for user %: %', new.id, SQLERRM;  
      
    *\-- ফেইল-সেফ: বোনাস ছাড়া প্রোফাইল তৈরি*  
    INSERT INTO public.profiles (id, balance, total\_deposited, total\_withdrawn)  
    VALUES (new.id, 0.00, 0.00, 0.00);  
      
    RETURN NEW;  
END;  
$$ LANGUAGE plpgsql;

*\-- ট্রিগার অ্যাটাচ*  
DROP TRIGGER IF EXISTS on\_auth\_user\_created ON auth.users;  
CREATE TRIGGER on\_auth\_user\_created  
  AFTER INSERT ON auth.users  
  FOR EACH ROW 

  EXECUTE FUNCTION public.handle\_new\_user\_bonus();

`SECURITY DEFINER` ক্লজটি অত্যন্ত গুরুত্বপূর্ণ। এটি নিশ্চিত করে যে ফাংশনটি ফাংশন ক্রিয়েটরের প্রিভিলেজে রান করে, যা `auth.users` টেবিল থেকে `public` স্কিমার টেবিলে INSERT করার জন্য প্রয়োজন। `SET search_path = public` SQL ইনজেকশন অ্যাটাক প্রিভেন্ট করে—নিশ্চিত করে যে সব টেবিল রেফারেন্স `public` স্কিমায় যায়। `EXCEPTION` ব্লক ক্রিটিক্যাল: এটি নিশ্চিত করে যে বোনাস ক্রেডিট ফেইল হলেও ইউজার অ্যাকাউন্ট তৈরি ব্লক হয় না।

#### **২.২.২ ট্রিগার টেস্টিং ও ভেরিফিকেশন**

sqlCopy

*\-- টেস্ট কেস ১: সাধারণ সাইনআপ*  
DO $$  
DECLARE  
  v\_user\_id UUID;  
  v\_profile RECORD;  
  v\_txn RECORD;  
BEGIN  
  *\-- টেস্ট ইউজার তৈরি (সরাসরি auth.users-এ ইনসার্ট না করে API ব্যবহার করুন)*  
  *\-- বা সাইনআপ ফ্লো টেস্ট করুন*  
    
  *\-- ভেরিফিকেশন*  
  SELECT id INTO v\_user\_id FROM auth.users   
  WHERE email \= 'test@example.com';  
    
  IF v\_user\_id IS NOT NULL THEN  
    RAISE NOTICE 'Test user ID: %', v\_user\_id;  
      
    *\-- profiles চেক*  
    SELECT \* INTO v\_profile FROM public.profiles WHERE id \= v\_user\_id;  
    IF FOUND AND v\_profile.balance \= 5.00 THEN  
      RAISE NOTICE 'SUCCESS: Profile created with 5.00 USDT bonus';  
    ELSE  
      RAISE NOTICE 'FAIL: Profile not found or incorrect balance';  
    END IF;  
      
    *\-- transactions চেক*  
    SELECT \* INTO v\_txn FROM public.transactions   
    WHERE user\_id \= v\_user\_id AND type \= 'bonus';  
    IF FOUND AND v\_txn.amount \= 5.00 THEN  
      RAISE NOTICE 'SUCCESS: Bonus transaction recorded';  
    ELSE  
      RAISE NOTICE 'FAIL: Bonus transaction not found';  
    END IF;  
  END IF;  
    
  *\-- ক্লিনআপ*  
  DELETE FROM public.notifications WHERE user\_id \= v\_user\_id;  
  DELETE FROM public.transactions WHERE user\_id \= v\_user\_id;  
  DELETE FROM public.profiles WHERE id \= v\_user\_id;  
  DELETE FROM auth.users WHERE id \= v\_user\_id;

END $$;

### **২.৩ RLS (Row Level Security) পলিসি: মাল্টি-লেয়ার ডিফেন্স**

#### **২.৩.১ profiles টেবিল RLS: গ্রানুলার অ্যাক্সেস কন্ট্রোল**

sqlCopy

*\-- RLS এনাবল*  
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY; *\-- সুপারইউজারদের জন্যও*

*\-- বেসিক SELECT: ইউজার শুধু নিজের ডেটা দেখতে পারে*  
CREATE POLICY "Users can view own profile"  
  ON public.profiles FOR SELECT  
  USING (auth.uid() \= id);

*\-- UPDATE: ইউজার শুধু নিজের নন-ফিনান্সিয়াল ফিল্ড আপডেট করতে পারে*  
*\-- ব্যালেন্স, total\_deposited, total\_withdrawn শুধু সিস্টেম/অ্যাডমিন দ্বারা মডিফাই হয়*  
CREATE POLICY "Users can update own non-financial fields"  
  ON public.profiles FOR UPDATE  
  USING (auth.uid() \= id)  
  WITH CHECK (  
    auth.uid() \= id   
    AND balance \= (SELECT balance FROM public.profiles WHERE id \= auth.uid())  
    AND total\_deposited \= (SELECT total\_deposited FROM public.profiles WHERE id \= auth.uid())  
    AND total\_withdrawn \= (SELECT total\_withdrawn FROM public.profiles WHERE id \= auth.uid())  
  );

*\-- অ্যাডমিন: সব ডেটা অ্যাক্সেস (সার্ভিস রোল বা স্পেসিফিক রোলের জন্য)*  
CREATE POLICY "Admins have full access"  
  ON public.profiles FOR ALL  
  USING (  
    EXISTS (  
      SELECT 1 FROM public.admin\_roles   
      WHERE user\_id \= auth.uid() AND role IN ('super\_admin', 'finance\_admin')  
    )  
  );

*\-- সার্ভিস রোল: সিস্টেম অপারেশন (ট্রিগার, Edge Functions)*  
CREATE POLICY "Service role can modify balance"  
  ON public.profiles FOR ALL  
  TO service\_role  
  USING (true)  
  WITH CHECK (true);

*\-- পলিসি ডিবাগিং*  
SELECT   
  schemaname,  
  tablename,  
  policyname,  
  permissive,  
  roles,  
  cmd,  
  qual,  
  with\_check  
FROM pg\_policies

WHERE tablename \= 'profiles';

`WITH CHECK` ক্লজটি `UPDATE` অপারেশনে নতুন ভ্যালু ভ্যালিডেট করে। সাবকোয়েরি দিয়ে কারেন্ট ভ্যালু চেক করা হয়—যদি নতুন ভ্যালু আলাদা হয়, INSERT/UPDATE রিজেক্ট হয়। এটি ক্লায়েন্ট-সাইড ভ্যালিডেশন বাইপাস প্রিভেনশন করে।

#### **২.৩.২ transactions টেবিল RLS: ইমিউটেবল অডিট লগ**

sqlCopy

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.transactions FORCE ROW LEVEL SECURITY;

*\-- ইউজার: শুধু নিজের ট্রানজেকশন দেখতে পারে*  
CREATE POLICY "Users can view own transactions"  
  ON public.transactions FOR SELECT  
  USING (auth.uid() \= user\_id);

*\-- কোনো DIRECT INSERT/UPDATE/DELETE অনুমোদিত নয়*  
*\-- সমস্ত writes সার্ভার-সাইড ফাংশন/ট্রিগার দিয়ে হয়*

CREATE POLICY "No direct inserts by users"  
  ON public.transactions FOR INSERT  
  WITH CHECK (false); *\-- Always reject*

CREATE POLICY "No updates by users"  
  ON public.transactions FOR UPDATE  
  USING (false);

CREATE POLICY "No deletes by users"  
  ON public.transactions FOR DELETE  
  USING (false);

*\-- সার্ভিস রোল ফুল অ্যাক্সেস*  
CREATE POLICY "Service role can manage transactions"  
  ON public.transactions FOR ALL  
  TO service\_role  
  USING (true)

  WITH CHECK (true);

`transactions` টেবিলের RLS স্ট্র্যাটেজি "read-only for users, write-only for system"। এটি নিশ্চিত করে যে অডিট ট্রেইল টেম্পার-প্রুফ—কোনো ক্লায়েন্ট-সাইড কোড, এমনকি compromised হলেও, ট্রানজেকশন হিস্টরি মডিফাই করতে পারবে না। সমস্ত writes RPC ফাংশন বা সার্ভিস রোল API কল দিয়ে হয়।

## **৩. লোকাল ডেভেলপমেন্ট এনভায়রনমেন্ট (Docker)**

### **৩.১ প্রজেক্ট স্ট্রাকচার: মনোরেপো অর্গানাইজেশন**

মনোরেপো স্ট্রাকচারটি Turborepo বা Nx ছাড়াই সিম্পল npm workspace দিয়ে ম্যানেজ করা হয়েছে—এটি ছোট টিমের জন্য কমপ্লেক্সিটি কমায়। প্রতিটি সার্ভিসের জন্য আলাদা ডিরেক্টরি থাকে যাতে ইন্ডিভিডুয়াল স্কেলিং সম্ভব।

plainCopy

usdt-platform/                          \# রুট ডিরেক্টরি  
├── apps/                               \# অ্যাপ্লিকেশনস  
│   └── web/                            \# Next.js 14+ মেইন অ্যাপ  
│       ├── src/  
│       │   ├── app/                    \# Next.js 14 App Router  
│       │   │   ├── (auth)/             \# গ্রুপ রাউট: লগইন/সাইনআপ  
│       │   │   │   ├── login/  
│       │   │   │   ├── register/  
│       │   │   │   ├── forgot-password/  
│       │   │   │   └── layout.tsx  
│       │   │   ├── (dashboard)/        \# গ্রুপ রাউট: অথেনটিকেটেড  
│       │   │   │   ├── wallet/         \# /wallet পেজ  
│       │   │   │   ├── transactions/   \# /transactions পেজ  
│       │   │   │   ├── history/        \# /history পেজ  
│       │   │   │   └── layout.tsx      \# ড্যাশবোর্ড লেআউট  
│       │   │   ├── admin/              \# অ্যাডমিন রাউট (protected)  
│       │   │   │   ├── deposits/  
│       │   │   │   ├── withdrawals/  
│       │   │   │   └── users/  
│       │   │   ├── api/                \# API Routes  
│       │   │   │   ├── webhooks/  
│       │   │   │   │   └── deposit/route.ts  
│       │   │   │   ├── deposit/  
│       │   │   │   │   └── route.ts    \# POST /api/deposit  
│       │   │   │   ├── withdraw/  
│       │   │   │   │   └── route.ts    \# POST /api/withdraw  
│       │   │   │   └── admin/  
│       │   │   │       └── verify-deposit/route.ts  
│       │   │   ├── layout.tsx  
│       │   │   └── page.tsx            \# হোমপেজ  
│       │   ├── views/                  \# পেজ-লেভেল কম্পোনেন্টস  
│       │   │   ├── Wallet.tsx          \# মেইন ওয়ালেট ভিউ  
│       │   │   ├── DepositForm.tsx  
│       │   │   ├── WithdrawalForm.tsx  
│       │   │   ├── TransactionHistory.tsx  
│       │   │   └── admin/  
│       │   │       ├── DepositVerification.tsx  
│       │   │       ├── WithdrawalProcessing.tsx  
│       │   │       └── UserManagement.tsx  
│       │   ├── components/             \# রিইউজেবল কম্পোনেন্টস  
│       │   │   ├── ui/                 \# shadcn/ui কম্পোনেন্টস  
│       │   │   ├── BalanceCard.tsx  
│       │   │   ├── MfsSelector.tsx  
│       │   │   ├── StatusBadge.tsx  
│       │   │   └── TransactionRow.tsx  
│       │   ├── lib/                    \# ইউটিলিটি ও কনফিগ  
│       │   │   ├── supabase/           \# Supabase ক্লায়েন্টস  
│       │   │   │   ├── client.ts       \# ব্রাউজার ক্লায়েন্ট  
│       │   │   │   ├── server.ts       \# সার্ভার ক্লায়েন্ট (RSC)  
│       │   │   │   └── admin.ts        \# সার্ভিস রোল ক্লায়েন্ট  
│       │   │   ├── utils/  
│       │   │   │   ├── formatters.ts   \# নাম্বার, ডেট ফরম্যাট  
│       │   │   │   └── validators.ts   \# ইনপুট ভ্যালিডেশন  
│       │   │   ├── constants.ts        \# এক্সচেঞ্জ রেট, MFS নাম্বার  
│       │   │   └── api-helpers.ts  
│       │   ├── hooks/                  \# কাস্টম React hooks  
│       │   │   ├── useBalance.ts       \# Realtime balance \+ caching  
│       │   │   ├── useTransactions.ts  
│       │   │   ├── useDeposit.ts  
│       │   │   └── useRealtime.ts      \# জেনেরিক realtime hook  
│       │   └── types/                  \# TypeScript types  
│       │       ├── database.ts         \# Supabase generated types  
│       │       └── index.ts  
│       ├── public/                     \# স্ট্যাটিক অ্যাসেটস  
│       ├── \_\_tests\_\_/                  \# টেস্ট ফাইলস  
│       ├── .env.local                  \# লোকাল এনভায়রনমেন্ট  
│       ├── next.config.js  
│       ├── tailwind.config.ts  
│       ├── tsconfig.json  
│       ├── package.json  
│       ├── Dockerfile                  \# প্রোডাকশন বিল্ড  
│       └── Dockerfile.dev              \# ডেভেলপমেন্ট  
├── packages/                           \# শেয়ার্ড প্যাকেজস (ঐচ্ছিক)  
│   ├── ui/                             \# শেয়ার্ড UI কম্পোনেন্টস  
│   ├── config/                         \# শেয়ার্ড কনফিগ (eslint, ts)  
│   └── types/                          \# শেয়ার্ড TypeScript types  
├── supabase/                           \# Supabase কনফিগারেশন  
│   ├── config.toml                     \# Supabase CLI config  
│   ├── seed.sql                        \# টেস্ট ডেটা  
│   ├── migrations/                     \# ভার্সনড মাইগ্রেশনস  
│   │   ├── 00000000000000\_initial\_schema.sql  
│   │   ├── 20240101000000\_add\_triggers.sql  
│   │   ├── 20240102000000\_add\_rls\_policies.sql  
│   │   └── 20240103000000\_add\_functions.sql  
│   └── functions/                      \# Edge Functions (ঐচ্ছিক)  
│       └── verify-deposit/index.ts  
├── n8n/                                \# n8n ওয়ার্কফ্লোস  
│   ├── workflows/                      \# এক্সপোর্টেড JSON ফাইলস  
│   │   ├── deposit-notification.json  
│   │   ├── withdrawal-processing.json  
│   │   ├── daily-report.json  
│   │   └── auto-verification.json  
│   └── credentials/                    \# (encrypted) ক্রেডেনশিয়ালস  
├── infrastructure/                     \# ইনফ্রাস্ট্রাকচার কোড  
│   ├── docker/                         \# Docker কনফিগস  
│   │   ├── n8n.Dockerfile  
│   │   └── nginx.conf  
│   └── terraform/                      \# IaC (ফিউচার)  
├── docker-compose.yml                  \# লোকাল স্ট্যাক orchestration  
├── .env.example                        \# এনভায়রনমেন্ট টেমপ্লেট  
├── Makefile                            \# কমন কমান্ডস  
├── turbo.json                          \# Turborepo config (ঐচ্ছিক)

└── README.md

### **৩.২ Docker Compose কনফিগারেশন: মাল্টি-সার্ভিস অর্কেস্ট্রেশন**

#### **৩.২.১ সম্পূর্ণ docker-compose.yml**

yamlCopy

version: '3.8'

*\# \=============================================================================*  
*\# NETWORKS*  
*\# \=============================================================================*  
networks:  
  usdt-network:  
    driver: bridge  
    ipam:  
      config:  
        \- subnet: 172.20.0.0/16

*\# \=============================================================================*  
*\# VOLUMES*  
*\# \=============================================================================*  
volumes:  
  supabase-data:  
    driver: local  
  n8n-data:  
    driver: local  
  redis-data:  
    driver: local  
  mailpit-data:  
    driver: local

*\# \=============================================================================*  
*\# SERVICES*  
*\# \=============================================================================*  
services:  
  *\# \---------------------------------------------------------------------------*  
  *\# Next.js Frontend (Development with HMR)*  
  *\# \---------------------------------------------------------------------------*  
  web:  
    build:  
      context: ./apps/web  
      dockerfile: Dockerfile.dev  
      args:  
        \- NODE\_ENV=development  
    container\_name: usdt-web  
    ports:  
      \- "3000:3000"  
    environment:  
      *\# Supabase connection*  
      \- NEXT\_PUBLIC\_SUPABASE\_URL=http://supabase:54321  
      \- NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY=${ANON\_KEY}  
      \- SUPABASE\_SERVICE\_ROLE\_KEY=${SERVICE\_ROLE\_KEY}  
      *\# App config*  
      \- NEXT\_PUBLIC\_APP\_URL=http://localhost:3000  
      \- NEXT\_PUBLIC\_EXCHANGE\_RATE=100  
      \- NEXT\_PUBLIC\_N8N\_WEBHOOK\_URL=http://n8n:5678/webhook  
    volumes:  
      *\# হট রিলোডের জন্য সোর্স মাউন্ট*  
      \- ./apps/web:/app  
      \- /app/node\_modules  *\# anonymous volume*  
      \- /app/.next         *\# build cache*  
    working\_dir: /app  
    command: \>  
      sh \-c "npm install && npm run dev \-- \--hostname 0.0.0.0"  
    networks:  
      \- usdt-network  
    depends\_on:  
      \- supabase  
      \- n8n  
    healthcheck:  
      test: \["CMD", "curl", "-f", "http://localhost:3000/api/health"\]  
      interval: 30s  
      timeout: 10s  
      retries: 3  
      start\_period: 40s

  *\# \---------------------------------------------------------------------------*  
  *\# Supabase Local Stack (Official CLI-based)*  
  *\# \---------------------------------------------------------------------------*  
  supabase:  
    image: supabase/supabase-local:latest  
    container\_name: usdt-supabase  
    ports:  
      \- "54321:54321"  *\# Kong API Gateway*  
      \- "54322:54322"  *\# GoTrue Auth*  
      \- "54323:54323"  *\# PostgREST*  
      \- "54324:54324"  *\# Realtime*  
      \- "54325:54325"  *\# Storage*  
      \- "54326:54326"  *\# Supabase Studio (UI)*  
    environment:  
      *\# Database*  
      \- POSTGRES\_PASSWORD=${POSTGRES\_PASSWORD:-postgres}  
      \- POSTGRES\_DB=postgres  
      *\# JWT*  
      \- JWT\_SECRET=${JWT\_SECRET:-super-secret-jwt-token-with-at-least-32-characters}  
      \- ANON\_KEY=${ANON\_KEY}  
      \- SERVICE\_ROLE\_KEY=${SERVICE\_ROLE\_KEY}  
      *\# Auth*  
      \- GOTRUE\_SITE\_URL=http://localhost:3000  
      \- GOTRUE\_ADDITIONAL\_REDIRECT\_URLS=http://localhost:3000/auth/callback  
      \- GOTRUE\_JWT\_EXP=3600  
      \- DISABLE\_SIGNUP=false  
      *\# Email (development \- Mailpit)*  
      \- GOTRUE\_SMTP\_HOST=mailpit  
      \- GOTRUE\_SMTP\_PORT=1025  
      \- GOTRUE\_SMTP\_USER=  
      \- GOTRUE\_SMTP\_PASS=  
      \- GOTRUE\_SMTP\_ADMIN\_EMAIL=admin@localhost  
      *\# Phone (development \- auto-confirm)*  
      \- ENABLE\_PHONE\_SIGNUP=true  
      \- ENABLE\_PHONE\_AUTOCONFIRM=true  
    volumes:  
      \- supabase-data:/var/lib/postgresql/data  
      \- ./supabase/migrations:/docker-entrypoint-initdb.d:ro  
    networks:  
      \- usdt-network  
    healthcheck:  
      test: \["CMD-SHELL", "pg\_isready \-U postgres \-d postgres"\]  
      interval: 10s  
      timeout: 5s  
      retries: 5

  *\# \---------------------------------------------------------------------------*  
  *\# n8n Workflow Automation*  
  *\# \---------------------------------------------------------------------------*  
  n8n:  
    image: n8nio/n8n:1.24.1  
    container\_name: usdt-n8n  
    ports:  
      \- "5678:5678"  
    environment:  
      *\# Basic Auth*  
      \- N8N\_BASIC\_AUTH\_ACTIVE=true  
      \- N8N\_BASIC\_AUTH\_USER=${N8N\_USER:-admin}  
      \- N8N\_BASIC\_AUTH\_PASSWORD=${N8N\_PASSWORD:-changeme}  
      *\# Security*  
      \- N8N\_ENCRYPTION\_KEY=${N8N\_ENCRYPTION\_KEY}  
      *\# URLs*  
      \- N8N\_HOST=localhost  
      \- N8N\_PORT=5678  
      \- N8N\_PROTOCOL=http  
      \- WEBHOOK\_URL=http://localhost:5678/  
      *\# Database (SQLite for local, upgrade to PostgreSQL for production-like)*  
      \- DB\_TYPE=sqlite  
      \- DB\_SQLITE\_PATH=/home/node/.n8n/database.sqlite  
      \- DB\_SQLITE\_VACUUM\_ON\_STARTUP=true  
      *\# Execution*  
      \- EXECUTIONS\_MODE=regular  
      \- EXECUTIONS\_TIMEOUT=300  
      \- EXECUTIONS\_TIMEOUT\_MAX=3600  
      *\# Logging*  
      \- N8N\_LOG\_LEVEL=info  
      *\# Feature flags*  
      \- N8N\_VERSION\_NOTIFICATIONS\_ENABLED=false  
      *\# Custom variables for our workflows*  
      \- SUPABASE\_URL=http://supabase:54321  
      \- SUPABASE\_SERVICE\_KEY=${SERVICE\_ROLE\_KEY}  
      \- ADMIN\_API\_KEY=${ADMIN\_API\_KEY}  
    volumes:  
      \- n8n-data:/home/node/.n8n  
      \- ./n8n/workflows:/backup/workflows:ro  
    networks:  
      \- usdt-network  
    depends\_on:  
      \- supabase  
    healthcheck:  
      test: \["CMD-SHELL", "wget \-qO- http://localhost:5678/healthz || exit 1"\]  
      interval: 30s  
      timeout: 10s  
      retries: 3

  *\# \---------------------------------------------------------------------------*  
  *\# Mailpit (Email testing for development)*  
  *\# \---------------------------------------------------------------------------*  
  mailpit:  
    image: axllent/mailpit:latest  
    container\_name: usdt-mailpit  
    ports:  
      \- "1025:1025"  *\# SMTP*  
      \- "8025:8025"  *\# Web UI*  
    volumes:  
      \- mailpit-data:/data  
    networks:  
      \- usdt-network

  *\# \---------------------------------------------------------------------------*  
  *\# Redis (Optional \- for caching, sessions, rate limiting)*  
  *\# \---------------------------------------------------------------------------*  
  redis:  
    image: redis:7-alpine  
    container\_name: usdt-redis  
    ports:  
      \- "6379:6379"  
    volumes:  
      \- redis-data:/data  
    networks:  
      \- usdt-network

    command: redis-server \--appendonly yes \--maxmemory 256mb \--maxmemory-policy allkeys-lru

#### **৩.২.২ এনভায়রনমেন্ট ভেরিয়েবল ম্যানেজমেন্ট**

`.env.example` ফাইলটি সব ডেভেলপারের জন্য একটি টেমপ্লেট হিসেবে কাজ করে। সেনসিটিভ ভ্যালুগুলো কমেন্ট আউট করা থাকে এবং জেনারেশন ইন্সট্রাকশন দেওয়া থাকে।

bashCopy

*\# \==========================================*  
*\# Supabase Configuration (Auto-generated by \`supabase start\`)*  
*\# \==========================================*

*\# Run \`supabase start\` to auto-generate these, or use defaults for local dev*  
POSTGRES\_PASSWORD\=your-super-secret-postgres-password  
JWT\_SECRET\=your-jwt-secret-at-least-32-characters-long

*\# These are derived from JWT\_SECRET, or use \`supabase status\` to get actual values*  
ANON\_KEY\=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  
SERVICE\_ROLE\_KEY\=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

*\# \==========================================*  
*\# Next.js / App Configuration*  
*\# \==========================================*

NEXT\_PUBLIC\_SUPABASE\_URL\=http://localhost:54321  
NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY\=${ANON\_KEY}  
SUPABASE\_SERVICE\_ROLE\_KEY\=${SERVICE\_ROLE\_KEY}

*\# Exchange rate: 1 USDT \= ? BDT (configurable)*  
NEXT\_PUBLIC\_EXCHANGE\_RATE\=100

*\# App URLs*  
NEXT\_PUBLIC\_APP\_URL\=http://localhost:3000  
NEXT\_PUBLIC\_ADMIN\_URL\=http://localhost:3000/admin

*\# Optional: Analytics, Error Tracking*  
*\# NEXT\_PUBLIC\_SENTRY\_DSN=*  
*\# NEXT\_PUBLIC\_GA\_ID=*

*\# \==========================================*  
*\# n8n Configuration*  
*\# \==========================================*

N8N\_USER\=admin  
N8N\_PASSWORD\=change-this-strong-password-in-production  
N8N\_ENCRYPTION\_KEY\=$(openssl rand \-hex 16)  *\# Generate: openssl rand \-hex 16*

*\# \==========================================*  
*\# MFS / Payment Configuration (Development \- mock values)*  
*\# \==========================================*

*\# These are displayed to users for manual transfer*  
BKASH\_MERCHANT\_NUMBER\=01700000000  
NAGAD\_MERCHANT\_NUMBER\=01700000000  
ROCKET\_MERCHANT\_NUMBER\=01700000000

*\# \==========================================*  
*\# Security / Compliance*  
*\# \==========================================*

*\# Rate limiting*  
RATE\_LIMIT\_REQUESTS\_PER\_MINUTE\=60  
RATE\_LIMIT\_REQUESTS\_PER\_HOUR\=1000

*\# Session config*  
SESSION\_MAX\_AGE\=86400  *\# 24 hours in seconds*

*\# Admin API key for webhook verification*

ADMIN\_API\_KEY\=$(openssl rand \-hex 32)

### **৩.৩ লোকাল সেটআপ স্টেপস: অটোমেটেড ও ম্যানুয়াল**

#### **৩.৩.১ অটোমেটেড সেটআপ স্ক্রিপ্ট**

bashCopy

\#\!/bin/bash  
*\# setup-local.sh \- লোকাল ডেভেলপমেন্ট সেটআপ অটোমেশন*

set \-e  *\# Exit on error*

echo "🚀 USDT Platform Local Setup"

*\# ১. ডিপেন্ডেন্সি চেক*  
echo "📋 Checking dependencies..."  
command \-v docker \>/dev/null 2\>&1 || { echo "❌ Docker required. Install: https://docs.docker.com/get-docker/"; exit 1; }  
command \-v docker-compose \>/dev/null 2\>&1 || { echo "❌ Docker Compose required"; exit 1; }  
command \-v node \>/dev/null 2\>&1 || { echo "❌ Node.js 18+ required"; exit 1; }

*\# ২. Node.js ভার্সন চেক*  
NODE\_VERSION\=$(node \-v | cut \-d'v' \-f2 | cut \-d'.' \-f1)  
if \[ "$NODE\_VERSION" \-lt 18 \]; then  
  echo "❌ Node.js 18+ required, found $(node \-v)"  
  exit 1  
fi

*\# ৩. এনভায়রনমেন্ট ফাইল সেটআপ*  
echo "⚙️  Setting up environment..."  
if \[ \! \-f ".env.local" \]; then  
  cp .env.example .env.local  
    
  *\# অটো-জেনারেট সিক্রেটস*  
  JWT\_SECRET\=$(openssl rand \-base64 32)  
  N8N\_ENCRYPTION\_KEY\=$(openssl rand \-hex 16)  
  ADMIN\_API\_KEY\=$(openssl rand \-hex 32)  
    
  *\# sed দিয়ে রিপ্লেস*  
  sed \-i.bak "s/your-jwt-secret-at-least-32-characters-long/${JWT\_SECRET}/g" .env.local  
  sed \-i.bak "s/\\$(openssl rand \-hex 16)/${N8N\_ENCRYPTION\_KEY}/g" .env.local  
  sed \-i.bak "s/\\$(openssl rand \-hex 32)/${ADMIN\_API\_KEY}/g" .env.local  
  rm \-f .env.local.bak  
    
  echo "✅ Created .env.local with generated secrets"  
  echo "⚠️  Review and update MFS merchant numbers before testing"  
else  
  echo "ℹ️  .env.local already exists, skipping generation"  
fi

*\# ৪. Node modules ইনস্টল*  
echo "📦 Installing dependencies..."  
cd apps/web && npm install && cd ../..

*\# ৫. Docker সার্ভিসেস স্টার্ট*  
echo "🐳 Starting Docker services..."  
docker-compose pull  
docker-compose up \-d \--build

*\# ৬. সার্ভিস হেলথ চেক*  
echo "⏳ Waiting for services to be healthy..."

*\# Supabase হেলথ চেক*  
RETRIES\=30  
until curl \-s http://localhost:54321/health \> /dev/null 2\>&1 || \[ $RETRIES \-eq 0 \]; do  
  echo "  Waiting for Supabase... ($RETRIES retries left)"  
  sleep 2  
  RETRIES\=$((RETRIES\-1))  
done

if \[ $RETRIES \-eq 0 \]; then  
  echo "❌ Supabase failed to start. Check logs: docker-compose logs supabase"  
  exit 1  
fi  
echo "✅ Supabase is ready"

*\# n8n হেলথ চেক*  
RETRIES\=30  
until curl \-s http://localhost:5678/healthz \> /dev/null 2\>&1 || \[ $RETRIES \-eq 0 \]; do  
  echo "  Waiting for n8n... ($RETRIES retries left)"  
  sleep 2  
  RETRIES\=$((RETRIES\-1))  
done

if \[ $RETRIES \-eq 0 \]; then  
  echo "❌ n8n failed to start. Check logs: docker-compose logs n8n"  
  exit 1  
fi  
echo "✅ n8n is ready"

*\# ৭. Database migrations (ঐচ্ছিক \- Supabase CLI ব্যবহার করলে অটো হয়)*  
echo "🗄️  Checking database schema..."  
if command \-v supabase &\> /dev/null; then  
  echo "ℹ️  Supabase CLI detected. Run 'supabase db reset' to apply migrations."  
else  
  echo "ℹ️  Supabase CLI not detected. Migrations auto-applied via docker-entrypoint-initdb.d"  
fi

*\# ৮. n8n workflows ইমপোর্ট*  
echo "⚡ Importing n8n workflows..."  
if \[ \-d "n8n/workflows" \] && \[ "$(ls \-A n8n/workflows/\*.json 2\>/dev/null)" \]; then  
  docker-compose exec \-T n8n n8n import:workflow \--input\=/backup/workflows/ 2\>/dev/null || \\  
    echo "⚠️  Workflow import may need manual execution in n8n UI"  
else  
  echo "ℹ️  No workflows to import"  
fi

echo ""  
echo "🎉 Setup complete\!"  
echo ""  
echo "📍 Access points:"  
echo "  🌐 Next.js App:     http://localhost:3000"  
echo "  🔧 Supabase Studio: http://localhost:54326"  
echo "  ⚡ n8n Editor:      http://localhost:5678"  
echo "  📧 Mailpit UI:      http://localhost:8025"  
echo ""  
echo "🔑 Default credentials:"  
echo "  n8n: admin / $(grep N8N\_PASSWORD .env.local | cut \-d\= \-f2)"  
echo ""  
echo "📋 Next steps:"  
echo "  1\. Create test account at http://localhost:3000/register"  
echo "  2\. Verify signup bonus in Supabase Studio"  
echo "  3\. Configure n8n workflows at http://localhost:5678"  
echo "  4\. Update MFS merchant numbers in .env.local"  
echo ""  
echo "🛠️  Useful commands:"  
echo "  make logs          \# View all logs"  
echo "  make logs-web      \# View Next.js logs only"  
echo "  make shell-web     \# Access web container shell"

echo "  make db-reset      \# Reset database (WARNING: destroys data)"

#### **৩.৩.২ Makefile for Common Commands**

makefileCopy

*\# Makefile \- কমন ডেভেলপমেন্ট কমান্ডস*

.PHONY: help up down restart logs shell db-migrate db-reset n8n-import n8n-export test lint type-check

help: *\#\# Show all available commands*  
	@grep \-E '^\[a-zA-Z\_-\]+:.\*?\#\# .\*$$' $(MAKEFILE\_LIST) | sort | awk 'BEGIN {FS \= ":.\*?\#\# "}; {printf "\\033\[36m%-20s\\033\[0m %s\\n", $$1, $$2}'

*\# \=============================================================================*  
*\# Docker Lifecycle*  
*\# \=============================================================================*

up: *\#\# Start all services*  
	docker-compose up \-d

down: *\#\# Stop all services*  
	docker-compose down

restart: down up *\#\# Restart all services*

logs: *\#\# View logs from all services*  
	docker-compose logs \-f

logs-web: *\#\# View Next.js logs only*  
	docker-compose logs \-f web

logs-db: *\#\# View database logs only*  
	docker-compose logs \-f supabase

logs-n8n: *\#\# View n8n logs only*  
	docker-compose logs \-f n8n

*\# \=============================================================================*  
*\# Shell Access*  
*\# \=============================================================================*

shell-web: *\#\# Open shell in web container*  
	docker-compose exec web sh

shell-db: *\#\# Open PostgreSQL shell*  
	docker-compose exec supabase psql \-U postgres \-d postgres

shell-n8n: *\#\# Open shell in n8n container*  
	docker-compose exec n8n sh

*\# \=============================================================================*  
*\# Database Operations*  
*\# \=============================================================================*

db-migrate: *\#\# Run pending migrations (requires Supabase CLI)*  
	supabase db reset \--linked 2\>/dev/null || \\  
		docker-compose exec \-T supabase psql \-U postgres \-d postgres \< supabase/migrations/$$(ls \-t supabase/migrations/\*.sql | head \-1)

db-reset: *\#\# Reset database (WARNING: destroys all data)*  
	docker-compose down \-v  
	docker-compose up \-d supabase  
	sleep 10  
	$(MAKE) db-migrate

db-seed: *\#\# Seed database with test data*  
	docker-compose exec \-T supabase psql \-U postgres \-d postgres \< supabase/seed.sql

*\# \=============================================================================*  
*\# n8n Workflows*  
*\# \=============================================================================*

n8n-import: *\#\# Import n8n workflows*  
	docker-compose exec n8n n8n import:workflow \--input\=/backup/workflows/

n8n-export: *\#\# Export n8n workflows*  
	docker-compose exec n8n n8n export:workflow \--output\=/backup/workflows/

n8n-backup: *\#\# Backup n8n data*  
	docker run \--rm \-v usdt-platform\_n8n-data:/source \-v $$(pwd)/backups:/backup alpine tar czf /backup/n8n-$$(date \+%Y%m%d-%H%M%S).tar.gz \-C /source .

*\# \=============================================================================*  
*\# Testing & Quality*  
*\# \=============================================================================*

test: *\#\# Run unit tests*  
	docker-compose exec web npm test

test-e2e: *\#\# Run end-to-end tests*  
	docker-compose exec web npm run test:e2e

lint: *\#\# Run linter*  
	docker-compose exec web npm run lint

type-check: *\#\# Run TypeScript type checking*  
	docker-compose exec web npm run type-check

format: *\#\# Format code with Prettier*  
	docker-compose exec web npm run format

*\# \=============================================================================*  
*\# Production Build (Local Testing)*  
*\# \=============================================================================*

build: *\#\# Build production image*  
	docker-compose \-f docker-compose.yml \-f docker-compose.prod.yml build web

build-test: build *\#\# Test production build locally*

	docker-compose \-f docker-compose.yml \-f docker-compose.prod.yml up \-d web

## **৪. Next.js ফ্রন্টএন্ড ইমপ্লিমেন্টেশন**

### **৪.১ Supabase ক্লায়েন্ট আর্কিটেকচার: সার্ভার-ক্লায়েন্ট সেপারেশন**

Next.js 14-এ Server Components ও Client Components উভয়ের জন্য আলাদা Supabase ক্লায়েন্ট কনফিগারেশন প্রয়োজন। Server Components-এ `cookies()` ব্যবহার করে সেশন ম্যানেজ করা হয়, আর Client Components-এ ব্রাউজার স্টোরেজ ব্যবহার করা হয়। এই সেপারেশন সিকিউরিটি এবং পারফরম্যান্স উভয়ই অপ্টিমাইজ করে।

TypeScriptCopy

*// lib/supabase/server.ts \- Server Components/Server Actions এর জন্য*  
import { createServerClient, type CookieOptions } from '@supabase/ssr'  
import { cookies } from 'next/headers'

export function createClient() {  
  const cookieStore \= cookies()

  return createServerClient(  
    process.env.NEXT\_PUBLIC\_SUPABASE\_URL\!,  
    process.env.NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY\!,  
    {  
      cookies: {  
        get(name: string) {  
          return cookieStore.get(name)?.value  
        },  
        set(name: string, value: string, options: CookieOptions) {  
          try {  
            cookieStore.set({ name, value, ...options })  
          } catch (error) {  
            *// Server Component-এ set করতে পারবে না*  
            *// Middleware বা Server Action-এ করা উচিত*  
          }  
        },  
        remove(name: string, options: CookieOptions) {  
          try {  
            cookieStore.set({ name, value: '', ...options })  
          } catch (error) {  
            *// Server Component-এ remove করতে পারবে না*  
          }  
        },  
      },  
    }  
  )

}

TypeScriptCopy

*// lib/supabase/client.ts \- Client Components এর জন্য*  
'use client'

import { createBrowserClient } from '@supabase/ssr'

let clientInstance: ReturnType\<typeof createBrowserClient\> | null \= null

export function createClient() {  
  *// Singleton pattern to prevent multiple instances*  
  if (clientInstance) return clientInstance  
    
  clientInstance \= createBrowserClient(  
    process.env.NEXT\_PUBLIC\_SUPABASE\_URL\!,  
    process.env.NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY\!,  
    {  
      auth: {  
        autoRefreshToken: true,  
        persistSession: true,  
        detectSessionInUrl: true,  
        flowType: 'pkce', *// PKCE for enhanced security*  
      },  
      realtime: {  
        params: {  
          eventsPerSecond: 10, *// Rate limit for realtime*  
        },  
      },  
    }  
  )  
    
  return clientInstance  
}

*// Convenience export*

export const supabase \= createClient()

TypeScriptCopy

*// lib/supabase/admin.ts \- Server-side admin operations ⚠️*  
*// শুধুমাত্র সার্ভার-সাইডে ব্যবহার করুন\! ক্লায়েন্ট-সাইডে এক্সপোজ করবেন না\!*

import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin \= createClient(  
  process.env.NEXT\_PUBLIC\_SUPABASE\_URL\!,  
  process.env.SUPABASE\_SERVICE\_ROLE\_KEY\!,  
  {  
    auth: {  
      autoRefreshToken: false,  
      persistSession: false,  
    },  
  }  
)

*// Runtime check to prevent accidental client-side usage*  
if (typeof window \!== 'undefined') {  
  throw new Error('supabaseAdmin cannot be used in browser environment')

}

`supabaseAdmin` ক্লায়েন্টটি `SERVICE_ROLE_KEY` ব্যবহার করে যা RLS বাইপাস করে—এটি অ্যাডমিন অপারেশনের জন্য দরকার। `typeof window !== 'undefined'` চেকটি defense in depth—অ্যাক্সিডেন্টাল ব্রাউজার এক্সপোজার প্রিভেন্ট করে।

### **৪.২ Wallet.tsx: সম্পূর্ণ ইউজার ইন্টারফেস**

TypeScriptCopy

*// apps/web/src/views/Wallet.tsx*  
'use client'

import { useState, useEffect, useCallback } from 'react'  
import { createClient } from '@/lib/supabase/client'  
import { useRouter } from 'next/navigation'  
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

*// টাইপ ডেফিনিশন*  
interface WalletData {  
  balance: number  
  total\_deposited: number  
  total\_withdrawn: number  
  kyc\_status: 'pending' | 'verified' | 'rejected'  
  daily\_withdrawal\_limit: number  
}

interface Transaction {  
  id: string  
  amount: number  
  type: 'deposit' | 'withdrawal' | 'bonus' | 'exchange' | 'refund'  
  description: string  
  status: 'pending' | 'completed' | 'failed' | 'reversed'  
  created\_at: string  
}

interface DepositRequest {  
  id: string  
  bdt\_amount: number  
  usdt\_amount: number  
  mfs\_provider: 'bkash' | 'nagad' | 'rocket' | 'upay'  
  txn\_id: string  
  status: string  
  created\_at: string  
}

*// কনস্ট্যান্টস*  
const EXCHANGE\_RATE \= 100 *// 1 USDT \= 100 BDT*  
const MIN\_DEPOSIT\_BDT \= 100  
const MAX\_DEPOSIT\_BDT \= 50000  
const MIN\_WITHDRAW\_USDT \= 1

export default function Wallet() {  
  const supabase \= createClient()  
  const router \= useRouter()  
  const queryClient \= useQueryClient()  
    
  *// UI স্টেট*  
  const \[activeTab, setActiveTab\] \= useState\<'overview' | 'deposit' | 'withdraw' | 'history'\>('overview')  
    
  *// ডিপোজিট ফর্ম স্টেট*  
  const \[depositAmount, setDepositAmount\] \= useState('')  
  const \[txnId, setTxnId\] \= useState('')  
  const \[senderNumber, setSenderNumber\] \= useState('')  
  const \[mfsProvider, setMfsProvider\] \= useState\<'bkash' | 'nagad' | 'rocket'\>('bkash')  
    
  *// উইথড্র ফর্ম স্টেট*  
  const \[withdrawAmount, setWithdrawAmount\] \= useState('')  
  const \[withdrawNumber, setWithdrawNumber\] \= useState('')  
  const \[withdrawProvider, setWithdrawProvider\] \= useState\<'bkash' | 'nagad' | 'rocket'\>('bkash')

  *// React Query: ব্যালেন্স ফেচিং with caching*  
  const { data: wallet, isLoading: walletLoading } \= useQuery({  
    queryKey: \['wallet'\],  
    queryFn: async () \=\> {  
      const { data: { user } } \= await supabase.auth.getUser()  
      if (\!user) throw new Error('Not authenticated')  
        
      const { data, error } \= await supabase  
        .from('profiles')  
        .select('\*')  
        .eq('id', user.id)  
        .single()  
        
      if (error) throw error  
      return data as WalletData  
    },  
    staleTime: 30000, *// 30 seconds*  
  })

  *// React Query: ট্রানজেকশন হিস্ট্রি*  
  const { data: transactions, isLoading: txsLoading } \= useQuery({  
    queryKey: \['transactions'\],  
    queryFn: async () \=\> {  
      const { data: { user } } \= await supabase.auth.getUser()  
      if (\!user) return \[\]  
        
      const { data, error } \= await supabase  
        .from('transactions')  
        .select('\*')  
        .eq('user\_id', user.id)  
        .order('created\_at', { ascending: false })  
        .limit(50)  
        
      if (error) throw error  
      return data as Transaction\[\]  
    },  
  })

  *// React Query: পেন্ডিং ডিপোজিটস*  
  const { data: pendingDeposits } \= useQuery({  
    queryKey: \['pendingDeposits'\],  
    queryFn: async () \=\> {  
      const { data: { user } } \= await supabase.auth.getUser()  
      if (\!user) return \[\]  
        
      const { data, error } \= await supabase  
        .from('deposit\_requests')  
        .select('\*')  
        .eq('user\_id', user.id)  
        .eq('status', 'pending')  
        .order('created\_at', { ascending: false })  
        
      if (error) throw error  
      return data as DepositRequest\[\]  
    },  
    refetchInterval: 30000, *// Auto-refresh every 30s*  
  })

  *// Realtime subscription: লাইভ ব্যালেন্স আপডেট*  
  useEffect(() \=\> {  
    const setupSubscription \= async () \=\> {  
      const { data: { user } } \= await supabase.auth.getUser()  
      if (\!user) return

      const channel \= supabase  
        .channel(\`wallet:${user.id}\`)  
        .on(  
          'postgres\_changes',  
          {  
            event: 'UPDATE',  
            schema: 'public',  
            table: 'profiles',  
            filter: \`id=eq.${user.id}\`,  
          },  
          (payload) \=\> {  
            queryClient.setQueryData(\['wallet'\], payload.new)  
          }  
        )  
        .subscribe()

      return () \=\> {  
        supabase.removeChannel(channel)  
      }  
    }

    setupSubscription()  
  }, \[supabase, queryClient\])

  *// ডিপোজিট মিউটেশন*  
  const depositMutation \= useMutation({  
    mutationFn: async () \=\> {  
      const bdtAmount \= parseFloat(depositAmount)  
        
      *// ভ্যালিডেশন*  
      if (isNaN(bdtAmount) || bdtAmount \< MIN\_DEPOSIT\_BDT || bdtAmount \> MAX\_DEPOSIT\_BDT) {  
        throw new Error(\`ডিপোজিট পরিমাণ ${MIN\_DEPOSIT\_BDT}\-${MAX\_DEPOSIT\_BDT} BDT এর মধ্যে হতে হবে\`)  
      }  
        
      if (\!txnId.trim() || txnId.length \< 8) {  
        throw new Error('সঠিক Transaction ID দিন')  
      }  
        
      if (\!senderNumber.trim() || \!/^01\[3\-9\]\\d{8}$/.test(senderNumber)) {  
        throw new Error('সঠিক বাংলাদেশি মোবাইল নম্বর দিন (01XXXXXXXXX)')  
      }

      const { data: { user } } \= await supabase.auth.getUser()  
      if (\!user) throw new Error('Not authenticated')

      const usdtAmount \= parseFloat((bdtAmount / EXCHANGE\_RATE).toFixed(2))

      const { error } \= await supabase.from('deposit\_requests').insert({  
        user\_id: user.id,  
        bdt\_amount: bdtAmount,  
        usdt\_amount: usdtAmount,  
        exchange\_rate: EXCHANGE\_RATE,  
        mfs\_provider: mfsProvider,  
        txn\_id: txnId.trim().toUpperCase(),  
        sender\_number: senderNumber.trim(),  
        status: 'pending'  
      })

      if (error) {  
        if (error.code \=== '23505') {  
          throw new Error('এই Transaction ID আগে ব্যবহার করা হয়েছে')  
        }  
        throw error  
      }

      return { success: true }  
    },  
    onSuccess: () \=\> {  
      *// ফর্ম রিসেট*  
      setDepositAmount('')  
      setTxnId('')  
      setSenderNumber('')  
        
      *// ক্যাশ ইনভ্যালিডেট*  
      queryClient.invalidateQueries({ queryKey: \['pendingDeposits'\] })  
        
      *// ট্যাব চেঞজ*  
      setActiveTab('overview')  
        
      *// নোটিফিকেশন (Toast library ব্যবহার করুন)*  
      alert('✅ ডিপোজিট রিকোয়েস্ট সফলভাবে সাবমিট হয়েছে\! অ্যাডমিন ভেরিফিকেশনের পর USDT ক্রেডিট হবে।')  
    },  
    onError: (error: Error) \=\> {  
      alert(\`❌ ত্রুটি: ${error.message}\`)  
    },  
  })

  *// উইথড্র মিউটেশন*  
  const withdrawMutation \= useMutation({  
    mutationFn: async () \=\> {  
      const usdtAmount \= parseFloat(withdrawAmount)  
        
      if (isNaN(usdtAmount) || usdtAmount \< MIN\_WITHDRAW\_USDT) {  
        throw new Error(\`সর্বনিম্ন উইথড্র ${MIN\_WITHDRAW\_USDT} USDT\`)  
      }  
        
      if (\!wallet || usdtAmount \> wallet.balance) {  
        throw new Error('অপর্যাপ্ত ব্যালেন্স')  
      }  
        
      if (\!withdrawNumber.trim() || \!/^01\[3\-9\]\\d{8}$/.test(withdrawNumber)) {  
        throw new Error('সঠিক মোবাইল নম্বর দিন')  
      }

      *// Server Action বা API Route কল*  
      const response \= await fetch('/api/withdrawals', {  
        method: 'POST',  
        headers: { 'Content-Type': 'application/json' },  
        body: JSON.stringify({  
          amount: usdtAmount,  
          mfs\_provider: withdrawProvider,  
          recipient\_number: withdrawNumber.trim()  
        })  
      })

      if (\!response.ok) {  
        const error \= await response.json()  
        throw new Error(error.message || 'উইথড্র রিকোয়েস্ট ব্যর্থ')  
      }

      return response.json()  
    },  
    onSuccess: () \=\> {  
      setWithdrawAmount('')  
      setWithdrawNumber('')  
      queryClient.invalidateQueries({ queryKey: \['wallet'\] })  
      queryClient.invalidateQueries({ queryKey: \['transactions'\] })  
      setActiveTab('overview')  
      alert('✅ উইথড্র রিকোয়েস্ট সাবমিট হয়েছে\! প্রসেসিং এর পর টাকা পাঠানো হবে।')  
    },  
    onError: (error: Error) \=\> {  
      alert(\`❌ ত্রুটি: ${error.message}\`)  
    },  
  })

  *// লোডিং স্টেট*  
  if (walletLoading) {  
    return \<div className\="loading"\>লোড হচ্ছে...\</div\>  
  }

  return (  
    \<div className\="wallet-container max-w-4xl mx-auto p-6"\>  
      {*/\* ট্যাব নেভিগেশন \*/*}  
      \<div className\="tabs flex gap-4 mb-6 border-b"\>  
        {(\['overview', 'deposit', 'withdraw', 'history'\] as const).map((tab) \=\> (  
          \<button  
            key\={tab}  
            onClick\={() \=\> setActiveTab(tab)}  
            className\={\`pb-2 px-4 ${activeTab \=== tab ? 'border-b-2 border-blue-500 font-semibold' : 'text-gray-500'}\`}  
          \>  
            {tab \=== 'overview' && 'ওভারভিউ'}  
            {tab \=== 'deposit' && 'ডিপোজিট'}  
            {tab \=== 'withdraw' && 'উইথড্র'}  
            {tab \=== 'history' && 'ইতিহাস'}  
          \</button\>  
        ))}  
      \</div\>

      {*/\* ওভারভিউ ট্যাব \*/*}  
      {activeTab \=== 'overview' && (  
        \<div className\="overview-tab"\>  
          {*/\* ব্যালেন্স কার্ড \*/*}  
          \<div className\="balance-card bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-6 mb-6"\>  
            \<h2 className\="text-lg opacity-90"\>মোট ব্যালেন্স\</h2\>  
            \<p className\="text-4xl font-bold"\>{wallet?.balance.toFixed(2)} USDT\</p\>  
            \<p className\="text-sm opacity-75 mt-2"\>  
              ≈ ৳{(wallet?.balance || 0) \* EXCHANGE\_RATE).toLocaleString('bn-BD')} BDT  
            \</p\>  
          \</div\>

          {*/\* স্ট্যাটস গ্রিড \*/*}  
          \<div className\="stats-grid grid grid-cols-3 gap-4 mb-6"\>  
            \<div className\="stat-card bg-gray-50 rounded-lg p-4"\>  
              \<p className\="text-sm text-gray-500"\>মোট ডিপোজিট\</p\>  
              \<p className\="text-xl font-semibold"\>{wallet?.total\_deposited.toFixed(2)} USDT\</p\>  
            \</div\>  
            \<div className\="stat-card bg-gray-50 rounded-lg p-4"\>  
              \<p className\="text-sm text-gray-500"\>মোট উইথড্র\</p\>  
              \<p className\="text-xl font-semibold"\>{wallet?.total\_withdrawn.toFixed(2)} USDT\</p\>  
            \</div\>  
            \<div className\="stat-card bg-gray-50 rounded-lg p-4"\>  
              \<p className\="text-sm text-gray-500"\>KYC স্ট্যাটাস\</p\>  
              \<p className\={\`text-xl font-semibold ${  
                wallet?.kyc\_status \=== 'verified' ? 'text-green-600' : 'text-yellow-600'  
              }\`}\>  
                {wallet?.kyc\_status \=== 'verified' ? '✓ ভেরিফাইড' : '⏳ পেন্ডিং'}  
              \</p\>  
            \</div\>  
          \</div\>

          {*/\* পেন্ডিং ডিপোজিটস \*/*}  
          {pendingDeposits && pendingDeposits.length \> 0 && (  
            \<div className\="pending-deposits bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6"\>  
              \<h3 className\="font-semibold text-yellow-800 mb-2"\>⏳ পেন্ডিং ডিপোজিট রিকোয়েস্ট\</h3\>  
              {pendingDeposits.map((deposit) \=\> (  
                \<div key\={deposit.id} className\="flex justify-between items-center py-2 border-b border-yellow-200 last:border-0"\>  
                  \<div\>  
                    \<p className\="font-medium"\>৳{deposit.bdt\_amount} ({deposit.usdt\_amount} USDT)\</p\>  
                    \<p className\="text-sm text-gray-600"\>{deposit.mfs\_provider} • {deposit.txn\_id}\</p\>  
                  \</div\>  
                  \<span className\="text-sm text-yellow-700 bg-yellow-100 px-2 py-1 rounded"\>  
                    অপেক্ষমান  
                  \</span\>  
                \</div\>  
              ))}  
            \</div\>  
          )}

          {*/\* দ্রুত অ্যাকশন \*/*}  
          \<div className\="quick-actions flex gap-4"\>  
            \<button  
              onClick\={() \=\> setActiveTab('deposit')}  
              className\="flex-1 bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600"  
            \>  
              \+ ডিপোজিট করুন  
            \</button\>  
            \<button  
              onClick\={() \=\> setActiveTab('withdraw')}  
              className\="flex-1 bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600"  
            \>  
              \- উইথড্র করুন  
            \</button\>  
          \</div\>  
        \</div\>  
      )}

      {*/\* ডিপোজিট ট্যাব \*/*}  
      {activeTab \=== 'deposit' && (  
        \<form onSubmit\={(e) \=\> { e.preventDefault(); depositMutation.mutate() }} className\="deposit-form space-y-4"\>  
          \<h3 className\="text-xl font-semibold mb-4"\>ক্যাশ ডিপোজিট (bKash/Nagad/Rocket)\</h3\>  
            
          {*/\* নির্দেশনা \*/*}  
          \<div className\="instructions bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4"\>  
            \<p className\="text-sm text-blue-800"\>  
              \<strong\>ধাপ ১:\</strong\> নিচের নাম্বারে টাকা সেন্ড করুন\<br/\>  
              \<strong\>bKash:\</strong\> 017XXXXXXXX (Send Money)\<br/\>  
              \<strong\>Nagad:\</strong\> 017XXXXXXXX (Send Money)\<br/\>  
              \<strong\>Rocket:\</strong\> 017XXXXXXXX (Send Money)\<br/\>  
              \<strong\>ধাপ ২:\</strong\> Transaction ID (TxnID) নিচে লিখুন  
            \</p\>  
          \</div\>

          {*/\* MFS প্রোভাইডার \*/*}  
          \<div\>  
            \<label className\="block text-sm font-medium mb-1"\>পেমেন্ট মেথড\</label\>  
            \<select  
              value\={mfsProvider}  
              onChange\={(e) \=\> setMfsProvider(e.target.value as any)}  
              className\="w-full border rounded-lg p-2"  
            \>  
              \<option value\="bkash"\>bKash\</option\>  
              \<option value\="nagad"\>Nagad\</option\>  
              \<option value\="rocket"\>Rocket\</option\>  
            \</select\>  
          \</div\>

          {*/\* BDT অ্যামাউন্ট \*/*}  
          \<div\>  
            \<label className\="block text-sm font-medium mb-1"\>টাকার পরিমাণ (BDT)\</label\>  
            \<input  
              type\="number"  
              min\={MIN\_DEPOSIT\_BDT}  
              max\={MAX\_DEPOSIT\_BDT}  
              step\="100"  
              placeholder\={\`সর্বনিম্ন ৳${MIN\_DEPOSIT\_BDT}\`}  
              value\={depositAmount}  
              onChange\={(e) \=\> setDepositAmount(e.target.value)}  
              className\="w-full border rounded-lg p-2"  
            /\>  
            \<p className\="text-sm text-gray-500 mt-1"\>  
              আপনি পাবেন: \<strong\>{(parseFloat(depositAmount || '0') / EXCHANGE\_RATE).toFixed(2)} USDT\</strong\>  
            \</p\>  
          \</div\>

          {*/\* সেন্ডার নাম্বার \*/*}  
          \<div\>  
            \<label className\="block text-sm font-medium mb-1"\>সেন্ডার মোবাইল নাম্বার\</label\>  
            \<input  
              type\="tel"  
              placeholder\="01XXXXXXXXX"  
              value\={senderNumber}  
              onChange\={(e) \=\> setSenderNumber(e.target.value)}  
              className\="w-full border rounded-lg p-2"  
            /\>  
          \</div\>

          {*/\* TxnID \*/*}  
          \<div\>  
            \<label className\="block text-sm font-medium mb-1"\>Transaction ID (TxnID)\</label\>  
            \<input  
              type\="text"  
              placeholder\="যেমন: 8A7B6C5D4E"  
              value\={txnId}  
              onChange\={(e) \=\> setTxnId(e.target.value.toUpperCase())}  
              className\="w-full border rounded-lg p-2"  
            /\>  
          \</div\>

          {*/\* সাবমিট বাটন \*/*}  
          \<button  
            type\="submit"  
            disabled\={depositMutation.isPending}  
            className\="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50"  
          \>  
            {depositMutation.isPending ? 'প্রসেসিং...' : 'ডিপোজিট রিকোয়েস্ট করুন'}  
          \</button\>  
        \</form\>  
      )}

      {*/\* উইথড্র ট্যাব \*/*}  
      {activeTab \=== 'withdraw' && (  
        \<form onSubmit\={(e) \=\> { e.preventDefault(); withdrawMutation.mutate() }} className\="withdraw-form space-y-4"\>  
          \<h3 className\="text-xl font-semibold mb-4"\>USDT উইথড্র (BDT\-তে কনভার্ট)\</h3\>  
            
          {*/\* নির্দেশনা \*/*}  
          \<div className\="instructions bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4"\>  
            \<p className\="text-sm text-purple-800"\>  
              \<strong\>রেট:\</strong\> 1 USDT \= ৳{EXCHANGE\_RATE} BDT\<br/\>  
              \<strong\>সর্বনিম্ন:\</strong\> {MIN\_WITHDRAW\_USDT} USDT\<br/\>  
              \<strong\>প্রসেসিং টাইম:\</strong\> ১\-২৪ ঘণ্টা  
            \</p\>  
          \</div\>

          {*/\* USDT অ্যামাউন্ট \*/*}  
          \<div\>  
            \<label className\="block text-sm font-medium mb-1"\>USDT পরিমাণ\</label\>  
            \<input  
              type\="number"  
              min\={MIN\_WITHDRAW\_USDT}  
              step\="0.01"  
              max\={wallet?.balance}  
              placeholder\={\`সর্বনিম্ন ${MIN\_WITHDRAW\_USDT} USDT\`}  
              value\={withdrawAmount}  
              onChange\={(e) \=\> setWithdrawAmount(e.target.value)}  
              className\="w-full border rounded-lg p-2"  
            /\>  
            \<p className\="text-sm text-gray-500 mt-1"\>  
              আপনি পাবেন: \<strong\>৳{(parseFloat(withdrawAmount || '0') \* EXCHANGE\_RATE).toFixed(2)} BDT\</strong\>  
            \</p\>  
          \</div\>

          {*/\* MFS প্রোভাইডার \*/*}  
          \<div\>  
            \<label className\="block text-sm font-medium mb-1"\>রিসিভ করবেন (bKash/Nagad/Rocket)\</label\>  
            \<select  
              value\={withdrawProvider}  
              onChange\={(e) \=\> setWithdrawProvider(e.target.value as any)}  
              className\="w-full border rounded-lg p-2"  
            \>  
              \<option value\="bkash"\>bKash\</option\>  
              \<option value\="nagad"\>Nagad\</option\>  
              \<option value\="rocket"\>Rocket\</option\>  
            \</select\>  
          \</div\>

          {*/\* রিসিপিয়েন্ট নাম্বার \*/*}  
          \<div\>  
            \<label className\="block text-sm font-medium mb-1"\>মোবাইল নাম্বার (যেখানে টাকা পাবেন)\</label\>  
            \<input  
              type\="tel"  
              placeholder\="01XXXXXXXXX"  
              value\={withdrawNumber}  
              onChange\={(e) \=\> setWithdrawNumber(e.target.value)}  
              className\="w-full border rounded-lg p-2"  
            /\>  
          \</div\>

          {*/\* সাবমিট বাটন \*/*}  
          \<button  
            type\="submit"  
            disabled\={withdrawMutation.isPending || \!wallet || parseFloat(withdrawAmount) \> wallet.balance}  
            className\="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50"  
          \>  
            {withdrawMutation.isPending ? 'প্রসেসিং...' : 'উইথড্র রিকোয়েস্ট করুন'}  
          \</button\>  
        \</form\>  
      )}

      {*/\* ইতিহাস ট্যাব \*/*}  
      {activeTab \=== 'history' && (  
        \<div className\="history-tab"\>  
          \<h3 className\="text-xl font-semibold mb-4"\>লেনদেনের ইতিহাস\</h3\>  
            
          {txsLoading ? (  
            \<p\>লোড হচ্ছে...\</p\>  
          ) : transactions && transactions.length \> 0 ? (  
            \<div className\="transaction-list space-y-2"\>  
              {transactions.map((tx) \=\> (  
                \<div key\={tx.id} className\={\`transaction-item flex justify-between items-center p-3 rounded-lg ${  
                  tx.type \=== 'deposit' || tx.type \=== 'bonus' ? 'bg-green-50' : 'bg-red-50'  
                }\`}\>  
                  \<div\>  
                    \<p className\="font-medium"\>  
                      {tx.type \=== 'deposit' && '💰 ডিপোজিট'}  
                      {tx.type \=== 'withdrawal' && '💸 উইথড্র'}  
                      {tx.type \=== 'bonus' && '🎁 বোনাস'}  
                      {tx.type \=== 'exchange' && '💱 এক্সচেঞ্জ'}  
                      {tx.type \=== 'refund' && '↩️ রিফান্ড'}  
                    \</p\>  
                    \<p className\="text-sm text-gray-600"\>{tx.description}\</p\>  
                    \<p className\="text-xs text-gray-400"\>  
                      {new Date(tx.created\_at).toLocaleString('bn-BD')}  
                    \</p\>  
                  \</div\>  
                  \<div className\="text-right"\>  
                    \<p className\={\`font-bold ${  
                      tx.type \=== 'deposit' || tx.type \=== 'bonus' ? 'text-green-600' : 'text-red-600'  
                    }\`}\>  
                      {tx.type \=== 'deposit' || tx.type \=== 'bonus' ? '+' : '-'}  
                      {tx.amount.toFixed(2)} USDT  
                    \</p\>  
                    \<span className\={\`text-xs px-2 py-1 rounded ${  
                      tx.status \=== 'completed' ? 'bg-green-100 text-green-700' :  
                      tx.status \=== 'pending' ? 'bg-yellow-100 text-yellow-700' :  
                      'bg-red-100 text-red-700'  
                    }\`}\>  
                      {tx.status \=== 'completed' ? '✓ সম্পন্ন' :  
                       tx.status \=== 'pending' ? '⏳ অপেক্ষমান' : '✓ বাতিল'}  
                    \</span\>  
                  \</div\>  
                \</div\>  
              ))}  
            \</div\>  
          ) : (  
            \<p className\="text-gray-500 text-center py-8"\>কোনো লেনদেন পাওয়া যায়নি\</p\>  
          )}  
        \</div\>  
      )}  
    \</div\>  
  )

}

### **৪.৩ অ্যাডমিন প্যানেল: Deposit Verification**

TypeScriptCopy

*// apps/web/src/views/admin/DepositVerification.tsx*  
'use client'

import { useState, useEffect } from 'react'  
import { supabaseAdmin } from '@/lib/supabase/admin'  
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface PendingDeposit {  
  id: string  
  user\_id: string  
  bdt\_amount: number  
  usdt\_amount: number  
  mfs\_provider: string  
  txn\_id: string  
  sender\_number: string  
  sender\_name: string | null  
  status: string  
  created\_at: string  
  user\_email?: string *// joined from auth.users*  
}

export default function DepositVerification() {  
  const queryClient \= useQueryClient()  
  const \[selectedDeposit, setSelectedDeposit\] \= useState\<PendingDeposit | null\>(null)  
  const \[adminNotes, setAdminNotes\] \= useState('')  
  const \[rejectionReason, setRejectionReason\] \= useState('')

  *// পেন্ডিং ডিপোজিটস ফেচ*  
  const { data: pendingDeposits, isLoading } \= useQuery({  
    queryKey: \['adminPendingDeposits'\],  
    queryFn: async () \=\> {  
      const { data, error } \= await supabaseAdmin  
        .from('deposit\_requests')  
        .select(\`  
          \*,  
          user\_email:auth.users\!inner(email)  
        \`)  
        .eq('status', 'pending')  
        .order('created\_at', { ascending: false })  
        
      if (error) throw error  
      return data as PendingDeposit\[\]  
    },  
    refetchInterval: 10000, *// Auto-refresh every 10s*  
  })

  *// ভেরিফাই মিউটেশন*  
  const verifyMutation \= useMutation({  
    mutationFn: async ({ depositId, userId, usdtAmount, notes }: {  
      depositId: string  
      userId: string  
      usdtAmount: number  
      notes: string  
    }) \=\> {  
      *// Atomic transaction using RPC*  
      const { data, error } \= await supabaseAdmin.rpc('verify\_and\_credit\_deposit', {  
        p\_deposit\_id: depositId,  
        p\_user\_id: userId,  
        p\_usdt\_amount: usdtAmount,  
        p\_admin\_notes: notes  
      })

      if (error) throw error  
      return data  
    },  
    onSuccess: () \=\> {  
      queryClient.invalidateQueries({ queryKey: \['adminPendingDeposits'\] })  
      setSelectedDeposit(null)  
      setAdminNotes('')  
      alert('✅ ডিপোজিট সফলভাবে ভেরিফাই এবং ক্রেডিট করা হয়েছে')  
    },  
    onError: (error: Error) \=\> {  
      alert(\`❌ ত্রুটি: ${error.message}\`)  
    },  
  })

  *// রিজেক্ট মিউটেশন*  
  const rejectMutation \= useMutation({  
    mutationFn: async ({ depositId, reason }: { depositId: string; reason: string }) \=\> {  
      const { error } \= await supabaseAdmin  
        .from('deposit\_requests')  
        .update({  
          status: 'rejected',  
          rejection\_reason: reason,  
          updated\_at: new Date().toISOString()  
        })  
        .eq('id', depositId)

      if (error) throw error  
    },  
    onSuccess: () \=\> {  
      queryClient.invalidateQueries({ queryKey: \['adminPendingDeposits'\] })  
      setSelectedDeposit(null)  
      setRejectionReason('')  
      alert('❌ ডিপোজিট রিজেক্ট করা হয়েছে')  
    },  
  })

  if (isLoading) return \<div\>লোড হচ্ছে...\</div\>

  return (  
    \<div className\="deposit-verification max-w-6xl mx-auto p-6"\>  
      \<h2 className\="text-2xl font-bold mb-6"\>পেন্ডিং ডিপোজিট ভেরিফিকেশন\</h2\>  
        
      {pendingDeposits && pendingDeposits.length \=== 0 && (  
        \<div className\="text-center py-12 text-gray-500"\>  
          ✅ কোনো পেন্ডিং ডিপোজিট নেই  
        \</div\>  
      )}

      \<div className\="deposits-grid grid gap-4"\>  
        {pendingDeposits?.map((deposit) \=\> (  
          \<div   
            key\={deposit.id}   
            className\={\`deposit-card border rounded-lg p-4 ${  
              selectedDeposit?.id \=== deposit.id ? 'border-blue-500 ring-2 ring-blue-200' : ''  
            }\`}  
          \>  
            \<div className\="flex justify-between items-start"\>  
              \<div\>  
                \<p className\="text-lg font-semibold"\>  
                  ৳{deposit.bdt\_amount} → {deposit.usdt\_amount} USDT  
                \</p\>  
                \<p className\="text-sm text-gray-600"\>  
                  {deposit.user\_email} • {deposit.mfs\_provider}  
                \</p\>  
                \<p className\="text-sm"\>  
                  TxnID: \<code className\="bg-gray-100 px-1 rounded"\>{deposit.txn\_id}\</code\>  
                \</p\>  
                \<p className\="text-sm text-gray-500"\>  
                  সেন্ডার: {deposit.sender\_number} {deposit.sender\_name && \`(${deposit.sender\_name})\`}  
                \</p\>  
                \<p className\="text-xs text-gray-400 mt-1"\>  
                  {new Date(deposit.created\_at).toLocaleString('bn-BD')}  
                \</p\>  
              \</div\>  
                
              \<div className\="flex gap-2"\>  
                \<button  
                  onClick\={() \=\> setSelectedDeposit(deposit)}  
                  className\="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"  
                \>  
                  ভেরিফাই  
                \</button\>  
                \<button  
                  onClick\={() \=\> setSelectedDeposit({ ...deposit, status: 'rejecting' } as any)}  
                  className\="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"  
                \>  
                  রিজেক্ট  
                \</button\>  
              \</div\>  
            \</div\>  
          \</div\>  
        ))}  
      \</div\>

      {*/\* ভেরিফাই মোডাল \*/*}  
      {selectedDeposit && selectedDeposit.status \!== 'rejecting' && (  
        \<div className\="fixed inset-0 bg-black/50 flex items-center justify-center p-4"\>  
          \<div className\="bg-white rounded-lg max-w-md w-full p-6"\>  
            \<h3 className\="text-xl font-bold mb-4"\>ডিপোজিট ভেরিফাই করুন\</h3\>  
              
            \<div className\="bg-gray-50 rounded p-3 mb-4 text-sm"\>  
              \<p\>\<strong\>ইউজার:\</strong\> {selectedDeposit.user\_email}\</p\>  
              \<p\>\<strong\>পরিমাণ:\</strong\> ৳{selectedDeposit.bdt\_amount} → {selectedDeposit.usdt\_amount} USDT\</p\>  
              \<p\>\<strong\>MFS:\</strong\> {selectedDeposit.mfs\_provider}\</p\>  
              \<p\>\<strong\>TxnID:\</strong\> {selectedDeposit.txn\_id}\</p\>  
            \</div\>

            \<div className\="mb-4"\>  
              \<label className\="block text-sm font-medium mb-1"\>অ্যাডমিন নোটস (ঐচ্ছিক)\</label\>  
              \<textarea  
                value\={adminNotes}  
                onChange\={(e) \=\> setAdminNotes(e.target.value)}  
                placeholder\="যেমন: bKash app-এ ভেরিফাইড"  
                className\="w-full border rounded p-2"  
                rows\={3}  
              /\>  
            \</div\>

            \<div className\="flex gap-2"\>  
              \<button  
                onClick\={() \=\> verifyMutation.mutate({  
                  depositId: selectedDeposit.id,  
                  userId: selectedDeposit.user\_id,  
                  usdtAmount: selectedDeposit.usdt\_amount,  
                  notes: adminNotes  
                })}  
                disabled\={verifyMutation.isPending}  
                className\="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600 disabled:opacity-50"  
              \>  
                {verifyMutation.isPending ? 'প্রসেসিং...' : '✓ কনফার্ম ভেরিফাই'}  
              \</button\>  
              \<button  
                onClick\={() \=\> setSelectedDeposit(null)}  
                className\="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"  
              \>  
                বাতিল  
              \</button\>  
            \</div\>  
          \</div\>  
        \</div\>  
      )}

      {*/\* রিজেক্ট মোডাল \*/*}  
      {selectedDeposit && selectedDeposit.status \=== 'rejecting' && (  
        \<div className\="fixed inset-0 bg-black/50 flex items-center justify-center p-4"\>  
          \<div className\="bg-white rounded-lg max-w-md w-full p-6"\>  
            \<h3 className\="text-xl font-bold mb-4 text-red-600"\>ডিপোজিট রিজেক্ট করুন\</h3\>  
              
            \<div className\="mb-4"\>  
              \<label className\="block text-sm font-medium mb-1"\>রিজেকশন কারণ \*\</label\>  
              \<textarea  
                value\={rejectionReason}  
                onChange\={(e) \=\> setRejectionReason(e.target.value)}  
                placeholder\="যেমন: ভুল TxnID, টাকা পাওয়া যায়নি"  
                className\="w-full border rounded p-2"  
                rows\={3}  
                required  
              /\>  
            \</div\>

            \<div className\="flex gap-2"\>  
              \<button  
                onClick\={() \=\> rejectMutation.mutate({  
                  depositId: selectedDeposit.id,  
                  reason: rejectionReason  
                })}  
                disabled\={rejectMutation.isPending || \!rejectionReason.trim()}  
                className\="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600 disabled:opacity-50"  
              \>  
                {rejectMutation.isPending ? 'প্রসেসিং...' : '✓ কনফার্ম রিজেক্ট'}  
              \</button\>  
              \<button  
                onClick\={() \=\> setSelectedDeposit(null)}  
                className\="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"  
              \>  
                বাতিল  
              \</button\>  
            \</div\>  
          \</div\>  
        \</div\>  
      )}  
    \</div\>  
  )

}

## **৫. n8n Workflow Automation**

### **৫.১ n8n সেটআপ ও Supabase Connection**

n8n-এ Supabase node ব্যবহার করে সরাসরি PostgreSQL কোয়েরি বা REST API কল করা যায়। লোকাল ডেভেলপমেন্টে n8n Docker কন্টেইনারটি Supabase নেটওয়ার্কে অ্যাক্সেসযোগ্য, তাই `http://supabase:54321` ব্যবহার করা যায়।

TableCopy

| Connection Type | Configuration | Use Case |
| :---- | :---- | :---- |
| PostgreSQL | Host: `supabase`, Port: `5432`, DB: `postgres` | Direct SQL queries, fast |
| Supabase REST | URL: `http://supabase:54321`, Service Key | RLS-compliant, audit logging |
| Webhook | URL: `http://n8n:5678/webhook/...` | External system integration |

### **৫.২ মেইন Workflows**

#### **৫.২.১ Deposit Notification Workflow**

plainCopy

Trigger: Webhook (POST /webhook/deposit-notification)  
  ↓  
Set: Extract user\_id, bdt\_amount, mfs\_provider from body  
  ↓  
Supabase: Get user email from profiles  
  ↓  
Function: Format notification message (Bangla)  
  ↓  
Parallel:  
  ├─ Telegram: Send to admin group  
  ├─ Email: Send to admin email

  └─ Supabase: Insert notification record

Webhook Payload:

JSONCopy

{  
  "user\_id": "uuid",  
  "bdt\_amount": 1000,  
  "mfs\_provider": "bkash",  
  "txn\_id": "8A7B6C5D4E"

}

Formatted Message (Bangla):

plainCopy

🚨 নতুন ডিপোজিট রিকোয়েস্ট\!

ইউজার: user@example.com  
পরিমাণ: ৳1,000 → 10.00 USDT  
MFS: bKash  
TxnID: 8A7B6C5D4E  
সময়: ১৫ জানুয়ারি, ২০২৪ ১০:৩০ AM

ভেরিফাই করতে: https://admin.yourapp.com/deposits

#### **৫.২.২ Auto-Verification Workflow (Future Enhancement)**

plainCopy

Trigger: Schedule (Every 5 minutes)  
  ↓  
Supabase: SELECT \* FROM deposit\_requests   
          WHERE status \= 'pending'   
          AND created\_at \< NOW() \- INTERVAL '10 minutes'  
          AND auto\_verification\_attempted \= false  
  ↓  
For Each: pending deposit  
  ├─ HTTP Request: bKash Merchant API (if available)  
  │   GET /tokenized/checkout/payment/status/{paymentID}  
  ├─ Condition: transactionStatus \=== 'Completed'?  
  │   ├─ Yes → Supabase RPC: auto\_verify\_deposit()  
  │   └─ No → Supabase: UPDATE auto\_verification\_attempted \= true  
  │            → Continue to manual queue

  └─ Error: Log to error tracking, notify admin

#### **৫.২.৩ Withdrawal Processing Workflow**

plainCopy

Trigger: Webhook (POST /webhook/withdrawal-requested)  
  ↓  
Supabase: Check user balance (RPC: check\_balance)  
  ↓  
Condition: Sufficient balance?  
  ├─ No → Supabase: UPDATE status \= 'rejected'  
  │         → Notify user: insufficient balance  
  └─ Yes → Supabase RPC: hold\_balance(p\_amount)  
           ↓  
           Supabase: UPDATE status \= 'processing'  
           ↓  
           Telegram: Notify admin for manual BDT transfer  
           ↓  
           Wait: Admin confirmation webhook  
           ↓  
           Condition: Admin approved?  
             ├─ Yes → Supabase RPC: complete\_withdrawal()  
             │         → Notify user: completed  
             └─ No → Supabase RPC: release\_hold()

                     → Notify user: rejected

### **৫.৩ n8n Workflow JSON Example**

JSONCopy

{  
  "name": "BD Deposit Notification",  
  "nodes": \[  
    {  
      "parameters": {  
        "httpMethod": "POST",  
        "path": "deposit-notification",  
        "responseMode": "responseNode"  
      },  
      "name": "Webhook",  
      "type": "n8n-nodes-base.webhook",  
      "typeVersion": 1,  
      "position": \[250, 300\],  
      "webhookId": "deposit-notification"  
    },  
    {  
      "parameters": {  
        "operation": "select",  
        "table": "profiles",  
        "matchType": "all",  
        "filters": {  
          "conditions": \[  
            {  
              "column": "id",  
              "condition": "eq",  
              "value": "={{ $json.body.user\_id }}"  
            }  
          \]  
        }  
      },  
      "name": "Get User Profile",  
      "type": "n8n-nodes-base.supabase",  
      "typeVersion": 1,  
      "position": \[450, 300\],  
      "credentials": {  
        "supabaseApi": "supabase-local"  
      }  
    },  
    {  
      "parameters": {  
        "jsCode": "// Format Bangla notification\\nconst deposit \= $json.body;\\nconst profile \= $json\[0\];\\n\\nconst date \= new Date().toLocaleString('bn-BD', {\\n  timeZone: 'Asia/Dhaka',\\n  year: 'numeric',\\n  month: 'long',\\n  day: 'numeric',\\n  hour: '2-digit',\\n  minute: '2-digit'\\n});\\n\\nconst message \= \`🚨 নতুন ডিপোজিট রিকোয়েস্ট\!\\n\\nইউজার: ${profile.id}\\nপরিমাণ: ৳${deposit.bdt\_amount.toLocaleString('bn-BD')} → ${deposit.usdt\_amount} USDT\\nMFS: ${deposit.mfs\_provider}\\nTxnID: ${deposit.txn\_id}\\nসময়: ${date}\\n\\nভেরিফাই করতে: https://admin.yourapp.com/deposits\`;\\n\\nreturn \[{ json: { message, deposit, profile } }\];"  
      },  
      "name": "Format Message",  
      "type": "n8n-nodes-base.code",  
      "typeVersion": 2,  
      "position": \[650, 300\]  
    },  
    {  
      "parameters": {  
        "chatId": "-1001234567890",  
        "text": "={{ $json.message }}",  
        "additionalOptions": {}  
      },  
      "name": "Telegram Admin",  
      "type": "n8n-nodes-base.telegram",  
      "typeVersion": 1,  
      "position": \[850, 200\],  
      "credentials": {  
        "telegramApi": "telegram-bot"  
      }  
    },  
    {  
      "parameters": {  
        "operation": "insert",  
        "table": "notifications",  
        "data": "={{ { user\_id: $json.deposit.user\_id, type: \\"admin\_alert\\", title: \\"New Deposit Request\\", message: $json.message, created\_at: new Date().toISOString() } }}"  
      },  
      "name": "Save Notification",  
      "type": "n8n-nodes-base.supabase",  
      "typeVersion": 1,  
      "position": \[850, 400\],  
      "credentials": {  
        "supabaseApi": "supabase-local"  
      }  
    },  
    {  
      "parameters": {  
        "options": {}  
      },  
      "name": "Respond to Webhook",  
      "type": "n8n-nodes-base.respondToWebhook",  
      "typeVersion": 1,  
      "position": \[1050, 300\]  
    }  
  \],  
  "connections": {  
    "Webhook": {  
      "main": \[\[{"node": "Get User Profile", "type": "main", "index": 0}\]\]  
    },  
    "Get User Profile": {  
      "main": \[\[{"node": "Format Message", "type": "main", "index": 0}\]\]  
    },  
    "Format Message": {  
      "main": \[  
        \[{"node": "Telegram Admin", "type": "main", "index": 0}\],  
        \[{"node": "Save Notification", "type": "main", "index": 0}\]  
      \]  
    },  
    "Telegram Admin": {  
      "main": \[\[{"node": "Respond to Webhook", "type": "main", "index": 0}\]\]  
    },  
    "Save Notification": {  
      "main": \[\[{"node": "Respond to Webhook", "type": "main", "index": 0}\]\]  
    }  
  },  
  "settings": {  
    "executionOrder": "v1"  
  },  
  "staticData": null,  
  "tags": \[\]

}

## **৬. প্রোডাকশন ডিপ্লয়মেন্ট (Vercel)**

### **৬.১ Vercel প্রজেক্ট সেটআপ**

#### **৬.১.১ প্রাথমিক কনফিগারেশন**

bashCopy

*\# Vercel CLI ইনস্টল*  
npm i \-g vercel

*\# লগিন*  
vercel login

*\# প্রজেক্ট লিংক (existing অথবা new)*  
vercel link

*\# এনভায়রনমেন্ট ভেরিয়েবল সেট*  
vercel env add NEXT\_PUBLIC\_SUPABASE\_URL  
vercel env add NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY  
vercel env add SUPABASE\_SERVICE\_ROLE\_KEY

*\# প্রোডাকশন ডিপ্লয়*

vercel \--prod

#### **৬.১.২ vercel.json কনফিগারেশন**

JSONCopy

{  
  "version": 2,  
  "builds": \[  
    {  
      "src": "apps/web/package.json",  
      "use": "@vercel/next"  
    }  
  \],  
  "routes": \[  
    {  
      "src": "/(.\*)",  
      "dest": "apps/web/$1"  
    }  
  \],  
  "env": {  
    "NEXT\_PUBLIC\_SUPABASE\_URL": "@supabase\_url",  
    "NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY": "@supabase\_anon\_key"  
  },  
  "functions": {  
    "apps/web/src/app/api/\*\*/\*.ts": {  
      "maxDuration": 30  
    }  
  }

}

### **৬.২ সিকিউরিটি ও কমপ্লায়েন্স**

#### **৬.২.১ এনভায়রনমেন্ট ভেরিয়েবল সিকিউরিটি**

TableCopy

| Variable | Type | Scope | Description |
| :---- | :---- | :---- | :---- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Browser \+ Server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Browser \+ Server | Client-side API key (RLS-enforced) |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Server only | Admin operations, bypasses RLS |
| `N8N_WEBHOOK_SECRET` | Secret | Server only | Webhook authentication |
| `ADMIN_API_KEY` | Secret | Server only | Admin panel API access |
| `JWT_SECRET` | Secret | Edge Functions | Custom JWT signing (if needed) |

Critical: `SUPABASE_SERVICE_ROLE_KEY` কখনোই `NEXT_PUBLIC_` prefix দিয়ে শুরু করবেন না—এটি ব্রাউজারে এক্সপোজ হয়ে যাবে।

#### **৬.২.২ HTTPS ও CORS কনফিগারেশন**

TypeScriptCopy

*// next.config.js*  
*/\*\* @type {import('next').NextConfig} \*/*  
const nextConfig \= {  
  async headers() {  
    return \[  
      {  
        source: '/api/:path\*',  
        headers: \[  
          { key: 'Access-Control-Allow-Credentials', value: 'true' },  
          {   
            key: 'Access-Control-Allow-Origin',   
            value: process.env.ALLOWED\_ORIGIN || 'https://yourdomain.com'   
          },  
          {   
            key: 'Access-Control-Allow-Methods',   
            value: 'GET,POST,PUT,DELETE,OPTIONS'   
          },  
          {   
            key: 'Access-Control-Allow-Headers',   
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'   
          },  
        \],  
      },  
      {  
        source: '/:path\*',  
        headers: \[  
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },  
          { key: 'X-Frame-Options', value: 'DENY' },  
          { key: 'X-Content-Type-Options', value: 'nosniff' },  
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },  
          {  
            key: 'Content-Security-Policy',  
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://\*.supabase.co wss://\*.supabase.co;"  
          }  
        \]  
      }  
    \]  
  },  
    
  *// Image optimization*  
  images: {  
    domains: \['localhost'\],  
    remotePatterns: \[  
      {  
        protocol: 'https',  
        hostname: '\*.supabase.co',  
      },  
    \],  
  },  
    
  *// Experimental features*  
  experimental: {  
    serverActions: true,  
    serverComponentsExternalPackages: \['@supabase/supabase-js'\],  
  },  
}

module.exports \= nextConfig

### **৬.৩ মনিটরিং ও লগিং**

#### **৬.৩.১ Supabase Realtime সাবস্ক্রিপশন**

TypeScriptCopy

*// hooks/useRealtimeBalance.ts*  
import { useEffect, useState } from 'react'  
import { createClient } from '@/lib/supabase/client'

export function useRealtimeBalance(userId: string | undefined) {  
  const supabase \= createClient()  
  const \[balance, setBalance\] \= useState\<number | null\>(null)  
  const \[connectionStatus, setConnectionStatus\] \= useState\<'connecting' | 'connected' | 'error'\>('connecting')

  useEffect(() \=\> {  
    if (\!userId) return

    const channel \= supabase  
      .channel(\`balance:${userId}\`)  
      .on(  
        'postgres\_changes',  
        {  
          event: 'UPDATE',  
          schema: 'public',  
          table: 'profiles',  
          filter: \`id=eq.${userId}\`,  
        },  
        (payload) \=\> {  
          setBalance(payload.new.balance)  
        }  
      )  
      .subscribe((status) \=\> {  
        setConnectionStatus(status \=== 'SUBSCRIBED' ? 'connected' : 'error')  
      })

    *// Initial fetch*  
    supabase  
      .from('profiles')  
      .select('balance')  
      .eq('id', userId)  
      .single()  
      .then(({ data }) \=\> setBalance(data?.balance ?? null))

    return () \=\> {  
      supabase.removeChannel(channel)  
    }  
  }, \[userId, supabase\])

  return { balance, connectionStatus }

}

#### **৬.৩.২ Error Tracking (Sentry Integration)**

TypeScriptCopy

*// sentry.client.config.ts*  
import \* as Sentry from '@sentry/nextjs'

Sentry.init({  
  dsn: process.env.NEXT\_PUBLIC\_SENTRY\_DSN,  
    
  *// Adjust this value in production, or use tracesSampler for greater control*  
  tracesSampleRate: 1.0,  
    
  *// ...*  
  *// Note: if you want to override the automatic release value, do not set a*  
  *// \`release\` value here \- use the environment variable \`SENTRY\_RELEASE\`, so*  
  *// that it will also get attached to your source maps*  
    
  beforeSend(event) {  
    *// সংবেদনশীল ডেটা ফিল্টার*  
    if (event.exception) {  
      const error \= event.exception.values?.\[0\]  
      *// PII রিমুভ করুন*  
      if (error?.stacktrace) {  
        error.stacktrace.frames \= error.stacktrace.frames.map(frame \=\> ({  
          ...frame,  
          vars: undefined *// Remove local variables*  
        }))  
      }  
    }  
      
    *// ফিনান্সিয়াল এরর আলাদা ট্যাগিং*  
    if (event.message?.includes('balance') || event.message?.includes('transaction')) {  
      event.tags \= { ...event.tags, financial: true }  
    }  
      
    return event  
  },  
    
  ignoreErrors: \[  
    *// Common browser errors to ignore*  
    'ResizeObserver loop limit exceeded',  
    'Network request failed',  
  \],

})

## **৭. MFS ইন্টিগ্রেশন গাইড (bKash/Nagad/Rocket)**

### **৭.১ ম্যানুয়াল ভেরিফিকেশন প্রসেস (Current)**

TableCopy

| Step | Actor | Action | System Response |
| :---- | :---- | :---- | :---- |
| 1 | User | Wallet → Deposit → Amount, MFS, TxnID | Create `deposit_requests` row, status='pending' |
| 2 | System | Trigger n8n webhook | Admin notification (Telegram/Email) |
| 3 | Admin | Check MFS app/USSD for transaction | Verify sender, amount, TxnID match |
| 4 | Admin | Click "Verify" in admin panel | RPC: `verify_and_credit_deposit()` |
| 5 | System | Atomic transaction | Update `deposit_requests`, `profiles`, `transactions` |
| 6 | System | Realtime notification | User sees updated balance instantly |

### **৭.২ ফিউচার API ইন্টিগ্রেশন (Merchant Account)**

#### **৭.২.১ bKash Tokenized Checkout API Structure**

TypeScriptCopy

*// services/bkash.service.ts (future implementation)*  
interface BkashConfig {  
  baseUrl: string *// 'https://tokenized.pay.bka.sh/v1.2.0-beta'*  
  username: string  
  password: string  
  appKey: string  
  appSecret: string  
}

interface BkashTokenResponse {  
  id\_token: string  
  token\_type: string  
  expires\_in: number  
  refresh\_token?: string  
}

interface BkashCreatePaymentResponse {  
  paymentID: string  
  bkashURL: string *// Redirect user here*  
  callbackURL: string  
  successCallbackURL: string  
  failureCallbackURL: string  
  cancelledCallbackURL: string  
  amount: string  
  intent: string  
  currency: string  
  merchantInvoiceNumber: string  
}

class BkashService {  
  private config: BkashConfig  
  private accessToken: string | null \= null  
  private tokenExpiry: Date | null \= null

  constructor(config: BkashConfig) {  
    this.config \= config  
  }

  private async getAccessToken(): Promise\<string\> {  
    *// Return cached token if valid*  
    if (this.accessToken && this.tokenExpiry && new Date() \< this.tokenExpiry) {  
      return this.accessToken  
    }

    const response \= await fetch(\`${this.config.baseUrl}/token/grant\`, {  
      method: 'POST',  
      headers: {  
        'Content-Type': 'application/json',  
        'username': this.config.username,  
        'password': this.config.password,  
      },  
      body: JSON.stringify({  
        app\_key: this.config.appKey,  
        app\_secret: this.config.appSecret,  
      }),  
    })

    const data: BkashTokenResponse \= await response.json()  
    this.accessToken \= data.id\_token  
    this.tokenExpiry \= new Date(Date.now() \+ (data.expires\_in \- 60) \* 1000) *// 1 min buffer*  
      
    return this.accessToken  
  }

  async createPayment(params: {  
    amount: number  
    merchantInvoiceNumber: string  
    callbackURL: string  
  }): Promise\<BkashCreatePaymentResponse\> {  
    const token \= await this.getAccessToken()

    const response \= await fetch(\`${this.config.baseUrl}/checkout/create\`, {  
      method: 'POST',  
      headers: {  
        'Content-Type': 'application/json',  
        'Authorization': token,  
        'X-APP-Key': this.config.appKey,  
      },  
      body: JSON.stringify({  
        amount: params.amount.toString(),  
        currency: 'BDT',  
        intent: 'sale',  
        merchantInvoiceNumber: params.merchantInvoiceNumber,  
        callbackURL: params.callbackURL,  
      }),  
    })

    return response.json()  
  }

  async executePayment(paymentID: string): Promise\<{  
    statusCode: string  
    statusMessage: string  
    transactionStatus: 'Completed' | 'Initiated' | 'Failed'  
    amount: string  
    currency: string  
    intent: string  
    merchantInvoiceNumber: string  
    trxID: string  
  }\> {  
    const token \= await this.getAccessToken()

    const response \= await fetch(\`${this.config.baseUrl}/checkout/execute\`, {  
      method: 'POST',  
      headers: {  
        'Content-Type': 'application/json',  
        'Authorization': token,  
        'X-APP-Key': this.config.appKey,  
      },  
      body: JSON.stringify({ paymentID }),  
    })

    return response.json()  
  }

  async queryPayment(paymentID: string): Promise\<{  
    paymentID: string  
    transactionStatus: string  
    amount: string  
    trxID?: string  
  }\> {  
    const token \= await this.getAccessToken()

    const response \= await fetch(\`${this.config.baseUrl}/checkout/payment/status/${paymentID}\`, {  
      headers: {  
        'Authorization': token,  
        'X-APP-Key': this.config.appKey,  
      },  
    })

    return response.json()  
  }  
}

*// Usage in API route*  
export async function POST(request: Request) {  
  const bkash \= new BkashService({  
    baseUrl: process.env.BKASH\_BASE\_URL\!,  
    username: process.env.BKASH\_USERNAME\!,  
    password: process.env.BKASH\_PASSWORD\!,  
    appKey: process.env.BKASH\_APP\_KEY\!,  
    appSecret: process.env.BKASH\_APP\_SECRET\!,  
  })

  const { amount, invoiceNumber, callbackURL } \= await request.json()  
    
  const payment \= await bkash.createPayment({  
    amount,  
    merchantInvoiceNumber: invoiceNumber,  
    callbackURL,  
  })

  *// Store paymentID in database, redirect user to bkashURL*  
  return Response.json({ bkashURL: payment.bkashURL, paymentID: payment.paymentID })

}

## **৮. টেস্টিং ও কোয়ালিটি অ্যাসুরেন্স**

### **৮.১ ইউনিট টেস্টিং (Jest \+ React Testing Library)**

TypeScriptCopy

*// \_\_tests\_\_/components/Wallet.test.tsx*  
import { render, screen, fireEvent, waitFor } from '@testing-library/react'  
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'  
import Wallet from '@/views/Wallet'

*// Mock Supabase*  
jest.mock('@/lib/supabase/client', () \=\> ({  
  createClient: () \=\> ({  
    auth: {  
      getUser: () \=\> Promise.resolve({ data: { user: { id: 'test-user' } } }),  
    },  
    from: () \=\> ({  
      select: () \=\> ({  
        eq: () \=\> ({  
          single: () \=\> Promise.resolve({   
            data: { balance: 100, total\_deposited: 500, total\_withdrawn: 400, kyc\_status: 'verified' }   
          }),  
        }),  
        order: () \=\> ({  
          limit: () \=\> Promise.resolve({ data: \[\] }),  
        }),  
      }),  
      insert: () \=\> Promise.resolve({ error: null }),  
    }),  
  }),  
}))

const queryClient \= new QueryClient({  
  defaultOptions: { queries: { retry: false } },  
})

function renderWithProviders(ui: React.ReactElement) {  
  return render(  
    \<QueryClientProvider client\={queryClient}\>  
      {ui}  
    \</QueryClientProvider\>  
  )  
}

describe('Wallet Component', () \=\> {  
  it('displays correct balance', async () \=\> {  
    renderWithProviders(\<Wallet /\>)  
      
    await waitFor(() \=\> {  
      expect(screen.getByText(/100.00 USDT/)).toBeInTheDocument()  
    })  
  })

  it('calculates BDT to USDT conversion correctly', async () \=\> {  
    renderWithProviders(\<Wallet /\>)  
      
    const amountInput \= screen.getByPlaceholderText(/সর্বনিম্ন/)  
    fireEvent.change(amountInput, { target: { value: '1000' } })  
      
    expect(screen.getByText(/10.00 USDT/)).toBeInTheDocument()  
  })

  it('validates minimum deposit amount', async () \=\> {  
    renderWithProviders(\<Wallet /\>)  
      
    *// Switch to deposit tab*  
    fireEvent.click(screen.getByText(/ডিপোজিট/))  
      
    const submitButton \= screen.getByText(/ডিপোজিট রিকোয়েস্ট/)  
    const amountInput \= screen.getByPlaceholderText(/সর্বনিম্ন/)  
      
    fireEvent.change(amountInput, { target: { value: '50' } })  
    fireEvent.click(submitButton)  
      
    *// Should show validation error (implementation dependent)*  
    await waitFor(() \=\> {  
      expect(screen.getByText(/সর্বনিম্ন 100/)).toBeInTheDocument()  
    })  
  })

})

### **৮.২ ইন্টিগ্রেশন টেস্টিং (Database Triggers)**

TypeScriptCopy

*// \_\_tests\_\_/database/triggers.test.ts*  
import { createClient } from '@supabase/supabase-js'

const supabase \= createClient(  
  process.env.NEXT\_PUBLIC\_SUPABASE\_URL\!,  
  process.env.SUPABASE\_SERVICE\_ROLE\_KEY\!  
)

describe('Signup Bonus Trigger', () \=\> {  
  const testEmail \= \`test-${Date.now()}@example.com\`  
  let userId: string

  afterAll(async () \=\> {  
    *// Cleanup*  
    await supabase.from('transactions').delete().eq('user\_id', userId)  
    await supabase.from('profiles').delete().eq('id', userId)  
    await supabase.auth.admin.deleteUser(userId)  
  })

  it('credits 5 USDT bonus on new user signup', async () \=\> {  
    *// Create user*  
    const { data: { user }, error: signUpError } \= await supabase.auth.signUp({  
      email: testEmail,  
      password: 'TestPassword123\!',  
    })

    expect(signUpError).toBeNull()  
    expect(user).not.toBeNull()  
    userId \= user\!.id

    *// Wait for trigger to execute*  
    await new Promise(resolve \=\> setTimeout(resolve, 1000))

    *// Verify profile created with bonus*  
    const { data: profile, error: profileError } \= await supabase  
      .from('profiles')  
      .select('\*')  
      .eq('id', userId)  
      .single()

    expect(profileError).toBeNull()  
    expect(profile).not.toBeNull()  
    expect(profile\!.balance).toBe(5.00)

    *// Verify transaction recorded*  
    const { data: transactions, error: txError } \= await supabase  
      .from('transactions')  
      .select('\*')  
      .eq('user\_id', userId)  
      .eq('type', 'bonus')

    expect(txError).toBeNull()  
    expect(transactions).toHaveLength(1)  
    expect(transactions\!\[0\].amount).toBe(5.00)  
    expect(transactions\!\[0\].description).toContain('Signup Bonus')  
  })

})

## **৯. ডিপ্লয়মেন্ট চেকলিস্ট**

### **৯.১ প্রি-ডিপ্লয়মেন্ট**

TableCopy

| Category | Item | Status |
| :---- | :---- | :---- |
| Environment | All environment variables set in Vercel | ☐ |
|  | `SUPABASE_SERVICE_ROLE_KEY` marked as secret | ☐ |
|  | `NEXT_PUBLIC_` variables verified | ☐ |
| Database | All migrations applied to production | ☐ |
|  | RLS policies enabled and tested | ☐ |
|  | Triggers and functions deployed | ☐ |
|  | Indexes created for performance | ☐ |
| Security | CORS origins restricted to production domain | ☐ |
|  | CSP headers configured | ☐ |
|  | Rate limiting enabled | ☐ |
|  | Webhook secrets configured | ☐ |
| n8n | Workflows exported and version controlled | ☐ |
|  | Production n8n instance configured | ☐ |
|  | Webhook URLs updated to production | ☐ |
| Monitoring | Sentry DSN configured | ☐ |
|  | Supabase logs enabled | ☐ |
|  | Alert thresholds set | ☐ |

### **৯.২ পোস্ট-ডিপ্লয়মেন্ট**

TableCopy

| Test | Method | Expected Result |
| :---- | :---- | :---- |
| Health check | `GET /api/health` | 200 OK |
| Authentication | Sign up → Verify email → Login | Session created, bonus credited |
| Deposit flow | Create request → Admin verify → Balance update | Realtime update visible |
| Withdrawal flow | Create request → Balance hold → Complete | Balance deducted, notification sent |
| RLS enforcement | Attempt to read other user's data | 403 or empty result |
| Trigger idempotency | Same signup twice | Single bonus only |

## **১০. ট্রাবলশুটিং ও FAQs**

### **১০.১ সাধারণ সমস্যা ও সমাধান**

TableCopy

| সমস্যা | সম্ভাব্য কারণ | সমাধান |
| :---- | :---- | :---- |
| Trigger কাজ করছে না | RLS permission, missing `SECURITY DEFINER` | `SECURITY DEFINER` যোগ করুন, `search_path` সেট করুন |
| Balance update দেখা যাচ্ছে না | Realtime subscription disconnected | Channel reconnect, check `eventsPerSecond` limit |
| n8n webhook fail | CORS, network isolation, wrong URL | Vercel function logs চেক করুন, `WEBHOOK_URL` verify করুন |
| MFS verification delay | Manual process bottleneck | Auto-verification workflow ইমপ্লিমেন্ট করুন |
| "Insufficient balance" error | Race condition, stale cache | Optimistic updates disable করুন, refetch করুন |
| Duplicate TxnID accepted | Missing UNIQUE constraint | `UNIQUE(txn_id, mfs_provider)` যোগ করুন |

### **১০.২ পারফরম্যান্স অপ্টিমাইজেশন**

TableCopy

| Area | Optimization | Impact |
| :---- | :---- | :---- |
| Database | Add composite indexes: `(user_id, created_at)`, `(status, created_at)` | 10-100x query speedup |
|  | Use `EXPLAIN ANALYZE` for slow queries | Identify bottlenecks |
| Caching | S/React Query with appropriate `staleTime` | Reduce redundant fetches |
|  | Redis for session storage (if needed) | Faster session validation |
| Frontend | Next.js Image optimization | Reduced bandwidth |
|  | Code splitting with dynamic imports | Faster initial load |
| Realtime | Batch updates, debounce rapid changes | Reduce WebSocket load |

### **১০.৩ কমপ্লায়েন্স ও লিগ্যাল কনসিডারেশন**

বাংলাদেশে ভার্চুয়াল কয়েন সিস্টেম পরিচালনার সময় নিম্নলিখিত বিষয়গুলো বিবেচনা করুন:

* বাংলাদেশ ব্যাংক গাইডলাইনস: বর্তমানে ক্রিপ্টোকারেন্সি নিষিদ্ধ, কিন্তু ক্লোজড-লুপ ভার্চুয়াল পয়েন্ট সিস্টেমের স্পষ্ট নিয়ন্ত্রণ নেই—আইনি পরামর্শ নিন  
* KYC/AML: ইউজার আইডেন্টিটি ভেরিফিকেশন, ট্রানজেকশন মনিটরিং, এবং সাসপিশিয়াস অ্যাক্টিভিটি রিপোর্টিং  
* ট্যাক্স কমপ্লায়েন্স: প্ল্যাটফর্ম রেভিনিউ এবং ইউজার উইনিংসের ট্যাক্স ইমপ্লিকেশন  
* ডেটা প্রটেকশন: ডিজিটাল সিকিউরিটি অ্যাক্ট ২০১৮ অনুযায়ী ব্যবহারকারী ডেটা সুরক্ষা

# Tab 13

🎯 ভার্চুয়াল USDT ম্যানেজমেন্ট সিস্টেম \- বর্তমান অবস্থা এবং অবশিষ্ট কাজ  
✅ ইতিমধ্যে বাস্তবায়িত:  
কম্পোনেন্ট	অবস্থা	বিবরণ  
Database Schema	✅ সম্পূর্ণ	USDT টেবিল, workflow tracking, exchange rate history  
Backend Workflows	✅ সম্পূর্ণ	Binance P2P API থেকে রেট আপডেট (৫ মিনিটে), auto-verification  
Exchange Rate Logic	✅ সম্পূর্ণ	Binance P2P API \+ fallback মেকানিজম  
Integration	✅ সম্পূর্ণ	বিদ্যমান workflows-এ USDT লজিক যোগ করা হয়েছে  
❌ যা বাকি আছে (প্রয়োজনীয় ফাইলসমূহ):  
১. Frontend: ইউজার ওয়ালেট ইন্টারফেস (বাংলা)

Apply  
apps/web/src/app/(dashboard)/wallet/page.tsx  
apps/web/src/app/(dashboard)/wallet/deposit/page.tsx  
apps/web/src/app/(dashboard)/wallet/withdraw/page.tsx  
apps/web/src/components/wallet/  
├── BalanceCard.tsx          \# রিয়েলটাইম USDT ব্যালেন্স \+ রিফ্রেশ বাটন  
├── DepositForm.tsx          \# ডিপোজিট ফর্ম (MFS \+ TXN ID)  
├── WithdrawalForm.tsx       \# উইথড্র ফর্ম  
├── TransactionHistory.tsx   \# লেনদেন ইতিহাস  
└── ExchangeRateDisplay.tsx  \# রিয়েলটাইম রেট ডিসপ্লে  
২. Admin Panel: ইউজার ম্যানেজমেন্ট

Apply  
apps/web/src/app/admin/usdt/  
├── page.tsx                 \# মেইন USDT ড্যাশবোর্ড  
├── users/  
│   ├── page.tsx            \# ইউজার লিস্ট \+ ব্যালেন্স  
│   ├── \[id\]/  
│   │   └── page.tsx        \# ইউজার ডিটেইল \+ ক্রেডিট/ডেবিট  
│   └── actions/  
│       ├── credit/route.ts \# ক্রেডিট API  
│       └── debit/route.ts  \# ডেবিট API  
├── settings/  
│   └── page.tsx            \# এক্সচেঞ্জ রেট সেটিংস  
└── transactions/  
    └── page.tsx            \# সকল ট্রানজেকশন লগ  
৩. API Routes: রিয়েলটাইম ব্যালেন্স

Apply  
apps/web/src/app/api/wallet/  
├── balance/  
│   └── route.ts            \# GET: বর্তমান ব্যালেন্স  
├── transactions/  
│   └── route.ts            \# GET: ট্রানজেকশন হিস্ট্রি  
└── update/  
    └── route.ts            \# POST: WebSocket/SSE আপডেট

apps/web/src/app/api/exchange-rate/  
├── current/  
│   └── route.ts            \# GET: বর্তমান রেট  
├── refresh/  
│   └── route.ts            \# POST: ম্যানুয়াল রিফ্রেশ  
└── history/  
    └── route.ts            \# GET: রেট হিস্ট্রি  
৪. Real-time: WebSocket/SSE Implementation

Apply  
apps/web/src/lib/realtime/  
├── wallet-channels.ts      \# Supabase realtime setup  
├── balance-listener.ts     \# ব্যালেন্স আপডেট লিসেনার  
└── exchange-rate-sse.ts    \# সার্ভার সেন্ট ইভেন্টস  
৫. Admin Settings: Exchange Rate Configuration

Apply  
apps/web/src/components/admin/usdt/  
├── ExchangeRateSettings.tsx  \# রেট সোর্স, ইন্টারভাল, থ্রেশহোল্ড  
├── UserCreditForm.tsx        \# ইউজারকে USDT ক্রেডিট  
├── UserSearch.tsx            \# ইউজার খোঁজা  
└── TransactionAudit.tsx      \# অডিট লগ  
📋 বিস্তারিত প্রয়োজনীয়তা:  
A. রিয়েলটাইম ব্যালেন্স আপডেট:  
Typescript

Apply  
// Supabase Realtime subscription  
const channel \= supabase.channel('wallet:' \+ userId)  
  .on('postgres\_changes', {  
    event: '\*',  
    schema: 'public',  
    table: 'wallets',  
    filter: 'user\_id=eq.' \+ userId  
  }, (payload) \=\> {  
    // Update UI instantly  
    setBalance(payload.new.usdt\_balance);  
  })  
  .subscribe();  
B. এক্সচেঞ্জ রেট রিফ্রেশ বাটন:  
Typescript

Apply  
// right after balance display  
\<BalanceCard\>  
  \<div className="flex items-center gap-2"\>  
    \<span\>১ USDT \= {rate} BDT\</span\>  
    \<Button   
      onClick={handleRefresh}  
      variant="outline"  
      size="sm"  
    \>  
      \<RefreshCw className="h-4 w-4" /\>  
    \</Button\>  
  \</div\>  
  \<small className="text-muted-foreground"\>  
    আপডেট: {new Date(lastUpdated).toLocaleTimeString('bn-BD')}  
  \</small\>  
\</BalanceCard\>  
C. Admin \- ইউজারে USDT ক্রেডিট:  
Typescript

Apply  
// POST /api/admin/usdt/credit  
{  
  "userId": "uuid-or-email-or-mobile",  
  "amount": 100.50,  
  "reason": "Bonus",  
  "reference": "admin\_action"  
}

// Response:  
{  
  "success": true,  
  "user": { "id": "...", "email": "...", "phone": "..." },  
  "previousBalance": 250.00,  
  "newBalance": 350.50,  
  "transactionId": "txn\_..."  
}  
D. ট্রেডিং সিস্টেম ইন্টিগ্রেশন:  
Typescript

Apply  
// Order placement এ USDT চেক  
const canTrade \= await supabase.rpc('can\_user\_trade', {  
  user\_id: userId,  
  required\_usdt: orderAmount  
});

if (\!canTrade) {  
  throw new Error("অপর্যাপ্ত USDT ব্যালেন্স");  
}

// অর্ডার পূরণে USDT ডেবিট  
await supabase.rpc('debit\_usdt\_for\_trade', {  
  user\_id: userId,  
  amount: orderAmount,  
  market\_id: marketId  
});  
E. কারেন্সি রিফ্রেশ সেটিংস (Admin):  
Typescript

Apply  
interface ExchangeRateSettings {  
  source: "binance\_p2p" | "manual" | "api";  
  autoRefreshInterval: 300; // seconds (5 min, 3 hours \= 10800\)  
  threshold: 0.5; // অটো আপডেট যদি রেট 0.5% বদলায়  
  fallbackRate: 120; // BDT per USDT  
  lastUpdated: "2024-01-20T10:30:00Z";  
  status: "active" | "paused";  
}  
🔧 টেকনিক্যাল ইমপ্লিমেন্টেশন প্ল্যান:  
পর্যায় ১: রিয়েলটাইম কম্পোনেন্ট (১ দিন)  
Potentially dangerous command  
Bash  
Run  
\# ফাইল তৈরি  
apps/web/src/components/wallet/BalanceCard.tsx  
apps/web/src/hooks/useRealtimeBalance.ts  
apps/web/src/app/api/exchange-rate/current/route.ts  
apps/web/src/app/api/exchange-rate/refresh/route.ts  
পর্যায় ২: Admin User Management (১ দিন)  
Potentially dangerous command  
Bash  
Run  
apps/web/src/app/admin/usdt/users/page.tsx  
apps/web/src/app/admin/usdt/users/\[id\]/page.tsx  
apps/web/src/app/api/admin/usdt/credit/route.ts  
apps/web/src/app/api/admin/usdt/debit/route.ts  
apps/web/src/components/admin/usdt/UserCreditForm.tsx  
পর্যায় ৩: সেটিংস এবং কনফিগারেশন (১ দিন)  
Potentially dangerous command  
Bash  
Run  
apps/web/src/app/admin/usdt/settings/page.tsx  
apps/web/src/components/admin/usdt/ExchangeRateSettings.tsx  
apps/web/src/app/api/admin/usdt/settings/route.ts  
পর্যায় ৪: ট্রেডিং ইন্টিগ্রেশন (১ দিন)  
Potentially dangerous command  
Bash  
Run  
\# মার্কেট অর্ডার প্লেসমেন্টে USDT চেক  
apps/web/src/lib/trading/validate-usdt-balance.ts  
\# রিয়েলটাইম ব্যালেন্স ডিসপ্লে ট্রেডিং পেজে  
পর্যায় ৫: টেস্টিং এবং ডিপ্লয়মেন্ট (১ দিন)  
Bash  
Run  
\# সব API টেস্ট  
\# কিউএ সিএনারিও:  
\# 1\. ইউজার ডিপোজিট করে → ব্যালেন্স আপডেট হয়  
\# 2\. অ্যাডমিন ক্রেডিট করে → ব্যালেন্স আপডেট \+ নোটিফিকেশন  
\# 3\. রেট রিফ্রেশ → নতুন রেট দেখায়  
\# 4\. ইউজার ট্রেড করে → USDT ডেবিট হয়  
📊 ফাইনাল সিস্টেম আউটকাম:

Apply  
ইউজার ফ্লো:  
1\. লগইন → ওয়ালেট পেজ → ব্যালেন্স দেখা (রিয়েলটাইম)  
2\. ডিপোজিট বাটন → ফর্ম পূরণ → সাবমিট  
3\. ১০-৩০ মিনিটে অটো ভেরিফিকেশন → ব্যালেন্স আপডেট  
4\. ট্রেডিং পেজে → USDT দিয়ে অর্ডার প্লেস  
5\. রিফ্রেশ বাটনে → নতুন এক্সচেঞ্জ রেট দেখা

অ্যাডমিন ফ্লো:  
1\. অ্যাডমিন প্যানেল → USDT ড্যাশবোর্ড  
2\. ইউজার সার্চ → ব্যালেন্স শো করে  
3\. ক্রেডিট/ডেবিট ফর্ম → অ্যামাউন্ট \+ রিসন  
4\. সেটিংস পেজ → রেট সোর্স, ইন্টারভাল কনফিগার  
5\. রিপোর্টস → দৈনিক মোট ডিপোজিট/উইথড্র

# Copywriting moto

When we introduced [Polymarket embeds](https://on.substack.com/p/dynamic-prediction-market-tables)in 2024, creators started weaving prediction market data into their analysis, from election forecasts to AI breakthroughs to economic policy. As more creators have integrated and responded to this data in their work, we’ve been building tools to support how they reference and discuss it on Substack.  
Today, in partnership with Polymarket, we’re introducing native tools that make it easier to share, discuss, and debate prediction market data directly on Substack. Polymarket has also joined our [sponsorships pilot](https://substack.com/@hamish/note/c-185976913), supporting a cohort of creators who integrate these tools into their work.  
---

#### **What are prediction markets, and why do they matter?**

Prediction markets are an emerging technology that aggregates real-time estimates of what will happen in the future. While the stock market lets people trade shares of companies, and the price reflects an estimate of how much a business is worth, Polymarket lets people trade shares of future events, like elections, economic trends, and scientific breakthroughs. The price reflects a market estimate of how likely an outcome is to happen.  
So while the stock market can tell you how much traders think Nvidia is worth, Polymarket can tell you whether traders think [the Fed will raise interest rates](https://polymarket.com/event/fed-decision-in-march-885), that [Ukraine will join NATO this year](https://polymarket.com/event/ukraine-joins-nato-before-2027), or that [One Battle After Another will win Best Picture at the Oscars](https://polymarket.com/event/oscars-2026-best-picture-winner). As with the stock market, these prices offer powerful insights into how participants are assessing the likelihood of different outcomes—everyone is free to disagree about how much Nvidia is actually worth, or what movie will win, but everyone still sees the same ticker of what it’s trading at, up to the second.

#### **What’s new**

When we first introduced Polymarket embeds, creators had to paste external links into posts. Even with that extra step, one in five of Substack’s top 250 highest-revenue publications started using them. Today, we’re making it easier with three new features, now available on iOS, Android, and web:

#### **Notes embeds**

Polymarket data can now be embedded directly in Notes, not just posts. This means you can quickly reference a prediction market that automatically refreshes with the latest odds, while sharing commentary, responding to news, or sparking a discussion—whether you’re writing a full article or a quick note.  
Writer and podcaster [Konstantin Kisin](https://open.substack.com/users/13247845-konstantin-kisin?utm_source=mentions)[referenced market expectations in a note](https://substack.com/@konstantinkisin/note/c-212567608)about different timelines for Keir Starmer’s potential exit as U.K. prime minister, while tech analyst [Azeem Azhar](https://open.substack.com/users/710379-azeem-azhar?utm_source=mentions)[used a Polymarket embed in Notes](https://substack.com/@exponentialview/note/c-212573688) to comment on how Anthropic’s research progress moved prediction market sentiment around AI model performance.

#### **Search within Substack**

You can now search for Polymarket data directly from the post editor or Notes composer. No need to open a new tab, find the right market, and copy a link back. Just search, select, and insert an embed directly alongside your analysis.  
![][image1]

#### **Dynamic visualizations**

Polymarket embeds now adapt their visual format to match the type of question you’re referencing—a yes-or-no question looks different from one with multiple possible outcomes. Substack automatically selects the right format to ensure that the data is clear and easy to read.  
For example, when [Cartoons Hate Her](https://open.substack.com/users/208140520-cartoons-hate-her?utm_source=mentions)embedded data on [the Democratic favorite for 2028](https://www.cartoonshateher.com/p/democrats-need-a-president-who-fucks)—with the caveat that it’s still “way too early to say”—it automatically displayed as a multi-candidate ranking. When [shit you should care about](https://open.substack.com/users/109003477-shit-you-should-care-about?utm_source=mentions) [embedded a question](https://shityoushouldcareabout.substack.com/p/5ddd4c57-c425-400c-aca2-39ea83d11c23) about whether the U.S. will confirm before 2027 that aliens exist, it displayed as a simple percentage.

These tools are available to start using today. You’ll find instructions in our [Help Center](https://support.substack.com/hc/en-us/articles/28879761546260-How-do-I-embed-Polymarket-odds-into-a-Substack-post), and if you publish something using the tools, tag [Substack Team](https://open.substack.com/users/41856304-substack-team?utm_source=mentions)—we’d love to see what you’re working on.

# Fix Scattered কোডবেস

আপনার কোডবেসে ছড়িয়ে ছিটিয়ে থাকা লজিকগুলোকে সুসংগঠিত (organize) করা এবং প্রোডাকশন লঞ্চের জন্য প্রস্তুত করার একটি কার্যকর **Architecture Strategy** নিচে দেওয়া হলো। এটি আপনার কোডকে আরও রিডঅ্যাবল, টেস্টেবল এবং স্কেলেবল করবে।

### **১. Service Layer Pattern প্রবর্তন (Logic Centralization)**

বর্তমানে আপনার লজিকগুলো API Route, Hooks এবং SQL Triggers-এর মধ্যে ছড়িয়ে আছে। এটি পরিবর্তন করে একটি **services/** ডিরেক্টরি তৈরি করুন।

* **Strategy:** প্রতিটি ডোমেইনের জন্য আলাদা সার্ভিস ফাইল তৈরি করুন (যেমন: WalletService.ts, TradeService.ts, MarketService.ts)।  
* **Tech Stack:** TypeScript Classes/Functions.

**Action:** \`\`\`typescript  
// apps/web/src/lib/services/TradeService.ts  
export class TradeService {  
static async placeOrder(userId: string, marketId: string, orderData: any) {  
// ১. ব্যালেন্স চেক (Business Logic)  
// ২. অর্ডার ভ্যালিডেশন  
// ৩. ডাটাবেস ট্রানজেকশন কল  
}  
}  
সব API Route এখন সরাসরি ডাটাবেসে কল না করে এই সার্ভিসগুলোকে কল করবে। এতে লজিক এক জায়গায় থাকবে।

* 

### **২. ডোমেইন ভিত্তিক ফোল্ডার স্ট্রাকচার (Organized Structure)**

কোডবেসকে ডোমেইন অনুযায়ী সাজান যাতে টিম মেম্বাররা সহজেই কোড খুঁজে পায়:

Plaintext  
src/  
 ├── lib/  
 │    ├── services/      (সব Business Logic থাকবে এখানে)  
 │    ├── providers/     (Auth, Theme, I18n Providers)  
 │    └── utils/         (Formatting, Helpers)  
 ├── components/  
 │    ├── shared/        (Button, Input, Modal \- Generic UI)  
 │    ├── markets/       (Market specific UI)  
 │    └── trading/       (Orderbook, Charts specific UI)  
 ├── store/              (Zustand/Redux modules)  
 └── hooks/              (Custom hooks divided by domain)

### **৩. SQL এবং Backend Logic-এর ভারসাম্য (Decoupling)**

আপনার অনেক লজিক (৯৬টি মাইগ্রেশন) সরাসরি SQL-এ আছে। প্রোডাকশনের জন্য এটি কিছুটা ঝুকিপূর্ণ।

* **Strategy:** জটিল গাণিতিক হিসাব এবং এপিআই কল নির্ভর কাজগুলো TypeScript-এ নিয়ে আসুন। শুধুমাত্র **Data Integrity** এবং **Atomic Transactions**\-এর জন্য SQL ব্যবহার করুন।  
* **Action:** matching\_engine.sql থেকে ডাটা ম্যাচিংয়ের কোর পার্ট রেখে, নোটিফিকেশন বা ইমেইল পাঠানোর ট্রিগারগুলো **Edge Functions**\-এ সরিয়ে নিন।

### **৪. সেন্ট্রালাইজড এরর এবং রেসপন্স হ্যান্ডলিং**

প্রতিটি এপিআই রুটে আলাদাভাবে এরর হ্যান্ডেল না করে একটি গ্লোবাল প্যাটার্ন ব্যবহার করুন।

* **Tech Task:** একটি apiHandler.ts ইউটিলিটি তৈরি করুন যা সব রিকোয়েস্ট র‍্যাপ করবে।  
* **Benefits:** এর ফলে প্রোডাকশনে কোনো বাগ আসলে আপনি এক জায়গার লগ দেখেই বুঝতে পারবেন সমস্যা কোথায়।

### **৫. গ্লোবাল কনফিগ ম্যানেজার (Environment readiness)**

আপনার হার্ডকোডেড ভ্যালু এবং এপিআই এন্ডপয়েন্টগুলো একটি সেন্ট্রাল ফাইল থেকে কল করুন।

* **Code:** src/config/constants.ts  
* **Action:** সব n8n ওয়েব হুক ইউআরএল, আপস্ট্যাশ ইউআরএল এবং ফিনান্সিয়াল লিমিটগুলো এখানে রাখুন। লঞ্চের আগে শুধু এই ফাইলটি চেক করলেই হবে।

---

### **৬. দ্রুত লঞ্চের জন্য ৫ দিনের অর্গানাইজেশন প্ল্যান (Shortest time)**

| দিন | ফোকাস এরিয়া | কাজ |
| :---- | :---- | :---- |
| **১ম দিন** | **Refactor Services** | এপিআই রুটের লজিকগুলোকে lib/services/ ফোল্ডারে ক্লাস হিসেবে সরিয়ে নেওয়া। |
| **২য় দিন** | **Security Audit** | অ্যাডমিন প্যানেলের হার্ডকোডেড ইউআরএল বাদ দিয়ে Supabase RLS এবং Roles সেটআপ করা। |
| **৩য় দিন** | **Cleanup Components** | আন-ইউজড কোড রিমুভ করা এবং ডোমেইন অনুযায়ী কম্পোনেন্ট ফোল্ডার সাজানো। |
| **৪র্থ দিন** | **Migration Sync** | সব ডাটাবেস মাইগ্রেশন ক্লিন করে একটি schema\_final.sql তৈরি করা। |
| **৫ম দিন** | **CI/CD & Monitoring** | Vercel-এ ডিপ্লয়মেন্ট এবং Sentry/LogSnag ইন্টিগ্রেশন চেক করা। |

### **৭. টেকনিক্যাল অর্গানাইজেশনের টিপস**

* **Zustand Store:** স্টেট ম্যানেজমেন্টকে ছোট ছোট মডিউলে ভাগ করুন (যেমন: useAuthStore, useMarketStore) যাতে পারফরম্যান্স ভালো থাকে।  
* **Typescript interfaces:** src/types/ ফোল্ডারে সব ডাটাবেস টাইপ এক জায়গায় রাখুন যাতে কোড লিখতে গিয়ে অটো-কমপ্লিশন পাওয়া যায়।

এই পদ্ধতিতে এগোলে আপনার "Scattered" কোডবেস একটি **Professional Modular Monolith**\-এ পরিণত হবে, যা লঞ্চের জন্য ১০০% রেডি থাকবে। আপনি কি কোনো নির্দিষ্ট মডিউল (যেমন: **Wallet logic**) সার্ভিস লেয়ারে নেওয়ার কোড এক্সাম্পল দেখতে চান?

# workflow lifecycle

একটি প্রোডাকশন-রেডি প্রেডিকশন মার্কেট প্ল্যাটফর্ম চালানোর জন্য পুরো অপারেশনাল লাইফসাইকেলকে ৫টি প্রধান ধাপে ভাগ করা যায়। আপনার বর্তমান কোডবেসে থাকা n8n এবং Upstash-এর সমন্বয় করে একটি পূর্ণাঙ্গ ডিজাইন নিচে দেওয়া হলো:

### **১. মার্কেট জেনারেশন লাইফসাইকেল (Discovery & Creation)**

এই পর্যায়ে প্রতিদিনের নতুন টপিক এবং মার্কেট তৈরি করা হয়।

* **Daily AI Topics (n8n):** প্রতিদিন টপ নিউজ সোর্স (Google News, Twitter API) থেকে ডাটা স্ক্র্যাপ করা এবং AI দিয়ে পটেনশিয়াল মার্কেট আইডিয়া জেনারেট করা।  
* **Market Approval Workflow (Upstash):** অ্যাডমিন প্যানেল থেকে কোনো ড্রাফট মার্কেট এপ্রুভ করলে সেটি ডাটাবেসে লাইভ করার কাজ।  
* **Missing (প্রয়োজনীয়):** *Auto-Thumbnail Generator* (n8n) \- মার্কেটের টাইটেল অনুযায়ী অটোমেটিক ইমেজ জেনারেট করা।

### **২. ট্রেডিং এবং রিস্ক অপারেশনস (Live Market)**

মার্কেট লাইভ হওয়ার পর ট্রেডিং সচল রাখা এবং সিস্টেমেটিক বাগ প্রতিরোধ করা।

* **Tick-Adjustment Cron (Upstash):** মার্কেটের ভোলাটিলিটি অনুযায়ী প্রাইজ মুভমেন্টের "Tick" সাইজ অটোমেটিক অ্যাডজাস্ট করা।  
* **Order Expiry/TIF Monitor (Upstash):** Time-in-Force (TIF) অর্ডারগুলো (যেমন: GTD \- Good Till Date) সময় শেষ হলে অটোমেটিক ক্যানসেল করা।  
* **Missing (প্রয়োজনীয়):** *Anomaly Detection Workflow* (Upstash) \- যদি কোনো মার্কেটে হঠাৎ অস্বাভাবিক ভলিউম বা প্রাইজ ম্যানিপুলেশন দেখা দেয়, তবে মার্কেটটি সাময়িকভাবে পজ (Pause) করা।

### **৩. ফিন্যান্সিয়াল ট্রানজেকশন লাইফসাইকেল (Money Flow)**

ইউজারের ডিপোজিট, উইথড্রয়াল এবং ব্যালেন্স রিকনসিলিয়েশন।

* **Binance P2P Scraper (n8n):** রিয়েল-টাইমে বিডিটি (BDT) থেকে ইউএসডিটি (USDT) রেট আপডেট করা এবং সেলারদের এভেইল্যাবিলিটি চেক করা।  
* **Manual Deposit Verification (n8n \+ Manual):** ইউজার টাকা পাঠানোর পর অ্যাডমিন প্যানেলে নোটিফিকেশন পাঠানো এবং এপ্রুভ করার পর ব্যালেন্স আপডেট করা।  
* **Withdrawal Processing (Upstash):** উইথড্রয়াল রিকোয়েস্ট কিউতে রাখা এবং ট্রানজেকশন সাকসেসফুল হলে লেজার আপডেট করা।  
* **Missing (প্রয়োজনীয়):** *Daily Audit Ledger* (Upstash) \- প্রতিদিনের শেষে মোট ইনকাম এবং আউটগোয়িং ব্যালেন্স চেক করা।

### **৪. রেজোলিউশন এবং ওরাকল ওরাকল (The Truth)**

মার্কেট শেষ হওয়ার পর সঠিক রেজাল্ট খুঁজে বের করা।

* **Market Resolution Engine (n8n):** মার্কেটের ডেডলাইন শেষ হলে অটোমেটিক রেজাল্ট খুঁজে বের করা (News API বা API Strategies ব্যবহার করে)।  
* **Expert Panel Dispute (n8n):** যদি কোনো রেজাল্ট নিয়ে ডিস্পিউট (Dispute) তৈরি হয়, তবে সেটি এক্সপার্টদের কাছে ভোটিংয়ের জন্য পাঠানো।  
* **AI Oracle (Upstash):** ছোট মার্কেটগুলোর ক্ষেত্রে AI দিয়ে দ্রুত ভেরিফিকেশন করা।

### **৫. সেটেলমেন্ট এবং রিওয়ার্ড (Closure)**

মার্কেট বন্ধ হওয়ার পর টাকা ডিস্ট্রিবিউশন।

* **Payout burning/Settlement (Upstash):** উইনিং আউটকামের ভিত্তিতে ইউজারের ব্যালেন্স ডিস্ট্রিবিউট করা এবং হারানো শেয়ারগুলো 'বার্ন' করা।  
* **Leaderboard & Loyalty (Upstash):** সফল ট্রেড শেষে ইউজারের র‍্যাংক এবং লয়্যালটি পয়েন্ট আপডেট করা।

---

### **কুইক সামারি টেবিল: n8n vs Upstash**

| ফিচার ক্যাটাগরি | টেক স্ট্যাক (Tech Stack) | কেন এটি ব্যবহার করবেন? |
| :---- | :---- | :---- |
| **News/Data Scraping** | n8n | থার্ড-পার্টি এপিআই ইন্টেগ্রেশন সহজ। |
| **Complex Logic AI Chain** | n8n | মাল্টি-স্টেপ এআই প্রম্পটিং সহজ। |
| **Order Book Handling** | Upstash Workflow | সার্ভারলেস ও ল্যাটেন্সি কম। |
| **Settlement Retries** | Upstash Workflow | ট্রানজেকশন ফেইল করলে অটো-রিট্রাই সুবিধা। |
| **Binance P2P Scraper** | n8n | ব্রাউজার অটোমেশন ও স্ক্র্যাপিং সহজ। |
| **User Notifications** | Upstash Workflow | স্টেটফুল ইভেন্ট ট্রিগার করা যায়। |

---

### **যা যা এখনও মিসিং (Build these next)**

১. **Dispute Timer Workflow (Upstash):** ডিস্পিউট জমা পড়ার পর ২৪ ঘণ্টার মধ্যে কোনো সমাধান না হলে অটোমেটিক অ্যাডমিন ইন্টারভেনশন মোডে নেওয়া।

২. **Admin Activity Audit (Upstash):** অ্যাডমিন যদি কোনো সেনসিটিভ ডাটা (যেমন: ইউজারের ব্যালেন্স) পরিবর্তন করে, তবে তার একটি ইমিউটেবল লগ তৈরি করা।

৩. **Dynamic Fee Adjuster (n8n):** নেটওয়ার্ক ট্র্যাফিক অনুযায়ী ট্রেডিং ফি অটোমেটিক বাড়ানো বা কমানো।

**অ্যাকশন প্ল্যান:**

প্রথমে **Upstash Settlement Engine**\-টি নিশ্চিত করুন, কারণ এটি ফিন্যান্সিয়াল ডাটার সাথে যুক্ত। এরপর **n8n News Scraper** তৈরি করুন যাতে আপনার প্ল্যাটফর্মে অটোমেটিক কন্টেন্ট আসতে থাকে।

আপনি কি **Payout Settlement**\-এর জন্য একটি স্পেসিফিক Upstash workflow কোড আর্কিটেকচার দেখতে চান?

# Event Page Feature Gap

 **Plokymarket vs Polymarket — Event Page Feature Gap Analysis**

\> **\*\*Purpose\*\***: Production-ready documentation identifying all missing or incomplete features on the Plokymarket event/market detail page compared to Polymarket.com. Based on screenshot comparison and full codebase audit.

\---

**\#\# Current State Summary**

**\#\#\# ✅ What Plokymarket Already Has**

| Component | File | Status |  
|:---|:---|:---|  
| **\*\*Price Chart\*\*** | \`components/trading/PriceChart.tsx\` (246 loc) | ✅ Working — AreaChart with real-time trades |  
| **\*\*Order Book\*\*** | \`components/trading/OrderBook.tsx\` (224 loc) | ✅ Working — YES/NO sides, spread indicator |  
| **\*\*Trading Panel\*\*** | \`components/trading/TradingPanel.tsx\` (661 loc) | ✅ Working — Buy/Sell, Market/Limit, slippage |  
| **\*\*My Positions\*\*** | \`components/trading/MyPositions.tsx\` (79 loc) | ✅ Working — P\&L display |  
| **\*\*Depth Chart\*\*** | \`components/clob/DepthChart.tsx\` | ✅ Working — Bid/Ask visualization |  
| **\*\*Liquidity Heatmap\*\*** | \`components/clob/LiquidityHeatMap.tsx\` | ✅ Working — Volume heatmap |  
| **\*\*Market Status\*\*** | \`components/market/MarketStatusDisplay.tsx\` (660 loc) | ✅ Working — Status badges, oracle confidence |  
| **\*\*Market Info\*\*** | \`components/market/MarketInfoPanel.tsx\` (132 loc) | ⚠️ Partial — Resolution criteria, oracle, creator, **\*\*but historical chart is a static SVG placeholder\*\*** |  
| **\*\*Comments\*\*** | \`components/social/CommentSection.tsx\` (290 loc) | ✅ Working — CRUD, threading, replies |  
| **\*\*Activity Feed\*\*** | \`components/social/ActivityFeed.tsx\` (847 loc) | ✅ Built — **\*\*But NOT used on the market detail page\*\*** |  
| **\*\*Pause Banner\*\*** | \`components/trading/PauseBanner.tsx\` | ✅ Working — Emergency/category/market pause |  
| **\*\*Breadcrumbs\*\*** | Inline in page | ✅ Working — Markets \> Category |

\---

**\#\# 🔴 Missing Features (Critical Gaps)**

**\#\#\# Gap 1: Multi-Outcome Markets**  
**\*\*Priority: 🔴 Critical\*\*** | **\*\*Polymarket has it: Yes\*\***

Polymarket supports markets with 10+ outcomes (e.g., "Who will win MVP?" with individual players listed). Plokymarket only supports binary YES/NO markets.

**\*\*What's needed:\*\***  
\- **\*\*Database\*\***: Add \`market\_type\` ENUM (\`binary\`, \`multi\_outcome\`) to \`markets\` table. Add \`outcomes\` table with columns: \`id\`, \`market\_id\`, \`label\`, \`image\_url\`, \`current\_price\`, \`total\_volume\`.  
\- **\*\*Backend\*\***: Modify \`MarketService.createMarketWithLiquidity()\` to accept N outcomes. Each outcome gets its own order book.  
\- **\*\*Frontend\*\***: New \`MultiOutcomeList\` component showing each outcome as a row with: label, percentage, Buy Yes/Buy No buttons, and sparkline price movement indicator.  
\- **\*\*Trading Panel\*\***: Refactor \`TradingPanel.tsx\` to accept a selected outcome instead of just YES/NO.

**\*\*Files to modify:\*\***  
\- \`types/index.ts\` — Add \`MarketOutcome\` interface  
\- \`lib/services/MarketService.ts\` — Multi-outcome creation logic  
\- \`app/(dashboard)/markets/\[id\]/page.tsx\` — Conditional rendering for multi vs binary  
\- New: \`components/market/MultiOutcomeList.tsx\`  
\- New: \`components/market/OutcomeRow.tsx\`

\---

**\#\#\# Gap 2: Share/Bookmark/Social Actions Bar**  
**\*\*Priority: 🔴 Critical\*\*** | **\*\*Polymarket has it: Yes\*\***

Polymarket has a floating action bar below the title with: **\*\*Share\*\***, **\*\*Bookmark\*\***, **\*\*Follow\*\***, and **\*\*notification bell\*\*** icons. Plokymarket has no social action bar on the market detail page.

**\*\*What's needed:\*\***  
\- **\*\*Database\*\***: Add \`user\_bookmarks\` table (\`user\_id\`, \`market\_id\`, \`created\_at\`). Add \`market\_followers\` table (\`user\_id\`, \`market\_id\`, \`notify\_on\_trade\`, \`notify\_on\_resolve\`).  
\- **\*\*Frontend\*\***: New \`MarketActions\` component with:  
  \- 📤 Share button (copy link, Web Share API, Twitter/Facebook)  
  \- 🔖 Bookmark toggle (saves to user profile)  
  \- 👥 Follower count display  
  \- 🔔 Notification preferences per market  
\- **\*\*API Routes\*\***: \`POST /api/markets/\[id\]/bookmark\`, \`POST /api/markets/\[id\]/follow\`

**\*\*Files to create:\*\***  
\- \`components/market/MarketActions.tsx\`  
\- \`app/api/markets/\[id\]/bookmark/route.ts\`  
\- \`app/api/markets/\[id\]/follow/route.ts\`

\---

**\#\#\# Gap 3: Trade Activity Tab (Recent Trades Feed)**  
**\*\*Priority: 🔴 Critical\*\*** | **\*\*Polymarket has it: Yes\*\***

Polymarket shows a **\*\*tabbed interface\*\*** below the chart with "Activity" and "Comments" tabs. The Activity tab shows recent trades with: user avatar, username, trade direction (Bought Yes/No), amount, price, and timestamp. Plokymarket has the \`ActivityFeed\` component (847 loc) but it is **\*\*NOT rendered\*\*** on the market detail page.

**\*\*What's needed:\*\***  
\- **\*\*Page integration\*\***: Add a tab system to the market detail page with "Activity" and "Comments" tabs.  
\- **\*\*Activity Feed per Market\*\***: Filter \`ActivityFeed\` component by \`marketId\` to show only trades for this market.  
\- **\*\*Trade display format\*\***: Each trade should show:  
  \- User avatar \+ username  
  \- "Bought **\*\*Yes\*\*** 50 shares at ৳0.52" or "Sold **\*\*No\*\*** 20 shares at ৳0.48"  
  \- Timestamp (relative: "2 min ago")

**\*\*Files to modify:\*\***  
\- \`app/(dashboard)/markets/\[id\]/page.tsx\` — Add Tabs component wrapping Activity \+ Comments  
\- Wire existing \`ActivityFeed\` with \`filterTypes={\['trader\_activity'\]}\` and market filter

\---

**\#\#\# Gap 4: Volume & Liquidity Banner**  
**\*\*Priority: 🟡 High\*\*** | **\*\*Polymarket has it: Yes\*\***

Polymarket shows total volume and liquidity prominently near the top (e.g., "$50"). Our market stats section is at the bottom. Needs to be more prominent.

**\*\*What's needed:\*\***  
\- **\*\*Redesign\*\***: Move total volume, total liquidity, and unique traders count into a prominent horizontal banner just below the title.  
\- **\*\*Format\*\***: \`৳1.2 লাখ Vol  ·  ৳50K Liquidity  ·  24 Traders\`  
\- **\*\*Realtime updates\*\***: Subscribe to trade completions to update volume live.

**\*\*Files to modify:\*\***  
\- \`app/(dashboard)/markets/\[id\]/page.tsx\` — Add stats banner between header and chart

\---

**\#\#\# Gap 5: Related Markets / "You Might Also Like"**  
**\*\*Priority: 🟡 High\*\*** | **\*\*Polymarket has it: Yes (bottom section)\*\***

Polymarket shows "Related markets" at the bottom of the page. Plokymarket has nothing below comments.

**\*\*What's needed:\*\***  
\- **\*\*Backend\*\***: Query markets in the same category, excluding the current one, ordered by volume/recency.  
\- **\*\*Frontend\*\***: New \`RelatedMarkets\` component showing 3-4 \`PolymarketCard\` cards in a horizontal row.  
\- **\*\*API\*\***: \`GET /api/markets?category=X\&exclude=CURRENT\_ID\&limit=4\`

**\*\*Files to create:\*\***  
\- \`components/market/RelatedMarkets.tsx\`

**\*\*Files to modify:\*\***  
\- \`app/(dashboard)/markets/\[id\]/page.tsx\` — Add RelatedMarkets at the bottom

\---

**\#\#\# Gap 6: User Avatars & Profile Links in Comments**  
**\*\*Priority: 🟡 High\*\*** | **\*\*Polymarket has it: Yes\*\***

Polymarket comments show: user avatar, username (clickable to profile), timestamp, and like/reply counts. Plokymarket's \`CommentSection\` has threading but is **\*\*missing\*\***:  
\- User avatar display (round thumbnail)  
\- Clickable username linking to \`/profile/\[userId\]\`  
\- Like/upvote button with count  
\- "Top" / "Newest" sort tabs

**\*\*What's needed:\*\***  
\- **\*\*Database\*\***: Add \`comment\_likes\` table (\`user\_id\`, \`comment\_id\`, \`created\_at\`). Add \`like\_count\` column to \`comments\` table (or compute via query).  
\- **\*\*Frontend\*\***: Enhance \`CommentItem\` in \`CommentSection.tsx\` to include avatar, profile link, like button, and sort controls.  
\- **\*\*API\*\***: \`POST /api/comments/\[id\]/like\`

**\*\*Files to modify:\*\***  
\- \`components/social/CommentSection.tsx\` — Add avatar, like button, sort  
\- \`hooks/social/useComments.ts\` — Add like/sort functionality

\---

**\#\#\# Gap 7: Market Thumbnail / Cover Image**  
**\*\*Priority: 🟡 High\*\*** | **\*\*Polymarket has it: Yes\*\***

Polymarket shows a round event thumbnail next to the title (visible in both the header and the event card). Plokymarket's market detail page has **\*\*no image\*\*** displayed, even though \`image\_url\` is stored in the database.

**\*\*What's needed:\*\***  
\- Display the event/market \`image\_url\` as a round thumbnail next to the title in the header area (matching the \`PolymarketCard\` design).  
\- Fallback to a gradient icon if no image is set.

**\*\*Files to modify:\*\***  
\- \`app/(dashboard)/markets/\[id\]/page.tsx\` — Add thumbnail to header section

\---

**\#\# 🟡 Missing Features (Important Gaps)**

**\#\#\# Gap 8: Price Change Indicators (Sparklines & Deltas)**  
**\*\*Priority: 🟡 Medium\*\***

Polymarket shows price change arrows and percentages (e.g., "+3¢" or "↑2%") next to each outcome. Plokymarket shows static prices with no change context.

**\*\*What's needed:\*\***  
\- **\*\*Backend\*\***: Store hourly price snapshots in a \`price\_history\` table (\`market\_id\`, \`outcome\`, \`price\`, \`recorded\_at\`).  
\- **\*\*Frontend\*\***: Calculate 24h price change. Show green/red arrow \+ delta next to price. Optional: mini sparkline (7-day) using Recharts \`\<Sparkline\>\`.

**\*\*Files to create:\*\***  
\- \`components/market/PriceChange.tsx\`  
\- \`app/api/markets/\[id\]/price-history/route.ts\`

\---

**\#\#\# Gap 9: Real Historical Price Chart (Replace Placeholder)**  
**\*\*Priority: 🟡 Medium\*\***

The \`MarketInfoPanel.tsx\` has a "Historical Price (7-Day)" section that is currently **\*\*a static SVG mockup\*\*** with hardcoded fake paths and "Chart Data Loading..." text. This needs to be replaced with real data.

**\*\*What's needed:\*\***  
\- Connect the historical chart to actual trade data from the \`trades\` table.  
\- Support timeframe switching (1D / 7D / 1M / ALL) which currently renders as non-functional badges.  
\- Use Recharts \`\<AreaChart\>\` consistent with \`PriceChart.tsx\`.

**\*\*Files to modify:\*\***  
\- \`components/market/MarketInfoPanel.tsx\` lines 105-131 — Replace static SVG with Recharts

\---

**\#\#\# Gap 10: Market Creator Profile Badge**  
**\*\*Priority: 🟢 Low-Medium\*\***

Polymarket shows the market creator with a verified badge. Plokymarket hardcodes "Plokymarket BD" with a static "Verified" badge. This should be dynamic based on the actual \`created\_by\` user.

**\*\*What's needed:\*\***  
\- Fetch \`user\_profiles\` data for \`market.created\_by\` to get the creator's display name and verification status.  
\- Display dynamically in \`MarketInfoPanel.tsx\`.

**\*\*Files to modify:\*\***  
\- \`components/market/MarketInfoPanel.tsx\` — Dynamic creator lookup

\---

**\#\#\# Gap 11: Bet Slip / Cart System**  
**\*\*Priority: 🟢 Low-Medium\*\*** | **\*\*Polymarket has it: Yes\*\***

Polymarket has a persistent "bet slip" sidebar where users can add multiple bets and submit them together. Plokymarket's \`TradingPanel\` handles one trade at a time.

**\*\*What's needed:\*\***  
\- **\*\*State\*\***: Global \`betSlipStore\` (Zustand) to hold pending bets across markets.  
\- **\*\*Frontend\*\***: \`BetSlip\` component that slides out from the right, showing all pending bets with amounts and potential payout.  
\- **\*\*Batch API\*\***: \`POST /api/orders/batch\` to submit multiple orders atomically.

**\*\*Files to create:\*\***  
\- \`store/betSlipStore.ts\`  
\- \`components/trading/BetSlip.tsx\`

\---

**\#\#\# Gap 12: Notification Badge & Bell Icon**  
**\*\*Priority: 🟢 Low\*\***

Polymarket has a notification bell in the nav with unread count badges. Plokymarket has notification API routes but no visual bell/badge on the market page or navbar.

**\*\*What's needed:\*\***  
\- Add bell icon to the top navigation bar with unread count badge.  
\- Wire to existing \`GET /api/notifications\` endpoint.  
\- Show dropdown with recent notifications on click.

**\*\*Files to create:\*\***  
\- \`components/layout/NotificationBell.tsx\`

\---

**\#\#\# Gap 13: SEO & Open Graph Meta Tags**  
**\*\*Priority: 🟢 Low\*\***

Each market page should have dynamic Open Graph meta tags so shared links show rich previews on social media (title, description, image, price).

**\*\*What's needed:\*\***  
\- Convert \`app/(dashboard)/markets/\[id\]/page.tsx\` to use \`generateMetadata()\` for server-side meta tags.  
\- Include: \`og:title\`, \`og:description\`, \`og:image\` (market thumbnail or auto-generated card image), \`twitter:card\`.

**\*\*Files to modify:\*\***  
\- \`app/(dashboard)/markets/\[id\]/page.tsx\` — Add \`generateMetadata()\`

\---

**\#\#\# Gap 14: Mobile-Optimized Trading Experience**  
**\*\*Priority: 🟢 Low\*\***

Polymarket has a bottom sheet / sticky footer for mobile trading. Plokymarket's \`TradingPanel\` is in a right column that stacks below on mobile, requiring long scrolls.

**\*\*What's needed:\*\***  
\- Add a mobile sticky footer bar showing current price \+ "Trade" button.  
\- On tap, open a bottom sheet / modal with the full \`TradingPanel\`.  
\- Use \`@media (max-width: 1024px)\` breakpoint.

**\*\*Files to create:\*\***  
\- \`components/trading/MobileTradingBar.tsx\`  
\- \`components/trading/TradingBottomSheet.tsx\`

\---

**\#\# Implementation Priority Matrix**

| Priority | Feature | Effort | Impact |  
|:---|:---|:---|:---|  
| 🔴 P0 | Gap 3: Activity Tab (wire existing) | 🟢 Low | 🔴 High |  
| 🔴 P0 | Gap 7: Market Thumbnail | 🟢 Low | 🔴 High |  
| 🔴 P0 | Gap 4: Volume Banner | 🟢 Low | 🔴 High |  
| 🔴 P1 | Gap 2: Share/Bookmark Bar | 🟡 Medium | 🔴 High |  
| 🔴 P1 | Gap 6: Comment Avatars/Likes | 🟡 Medium | 🟡 High |  
| 🟡 P2 | Gap 5: Related Markets | 🟡 Medium | 🟡 Medium |  
| 🟡 P2 | Gap 9: Real Historical Chart | 🟡 Medium | 🟡 Medium |  
| 🟡 P2 | Gap 8: Price Change Indicators | 🟡 Medium | 🟡 Medium |  
| 🟡 P3 | Gap 10: Dynamic Creator Badge | 🟢 Low | 🟢 Low |  
| 🟡 P3 | Gap 13: SEO Meta Tags | 🟢 Low | 🟡 Medium |  
| 🟠 P4 | Gap 1: Multi-Outcome Markets | 🔴 High | 🔴 High |  
| 🟠 P4 | Gap 11: Bet Slip System | 🔴 High | 🟡 Medium |  
| 🟠 P5 | Gap 12: Notification Bell | 🟡 Medium | 🟢 Low |  
| 🟠 P5 | Gap 14: Mobile Trading UX | 🟡 Medium | 🟡 Medium |

\---

**\#\# Database Schema Changes Summary**

\`\`\`sql  
\-- Gap 1: Multi-outcome markets  
CREATE TABLE outcomes (  
  id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  market\_id UUID NOT NULL REFERENCES markets(id),  
  label TEXT NOT NULL,  
  image\_url TEXT,  
  current\_price DECIMAL(10,4) DEFAULT 0.5,  
  total\_volume DECIMAL(18,2) DEFAULT 0,  
  display\_order INT DEFAULT 0,  
  created\_at TIMESTAMPTZ DEFAULT now()  
);

\-- Gap 2: Bookmarks & Follows  
CREATE TABLE user\_bookmarks (  
  user\_id UUID NOT NULL REFERENCES auth.users(id),  
  market\_id UUID NOT NULL REFERENCES markets(id),  
  created\_at TIMESTAMPTZ DEFAULT now(),  
  PRIMARY KEY (user\_id, market\_id)  
);

CREATE TABLE market\_followers (  
  user\_id UUID NOT NULL REFERENCES auth.users(id),  
  market\_id UUID NOT NULL REFERENCES markets(id),  
  notify\_on\_trade BOOLEAN DEFAULT false,  
  notify\_on\_resolve BOOLEAN DEFAULT true,  
  created\_at TIMESTAMPTZ DEFAULT now(),  
  PRIMARY KEY (user\_id, market\_id)  
);

\-- Gap 6: Comment Likes  
CREATE TABLE comment\_likes (  
  user\_id UUID NOT NULL REFERENCES auth.users(id),  
  comment\_id UUID NOT NULL REFERENCES comments(id),  
  created\_at TIMESTAMPTZ DEFAULT now(),  
  PRIMARY KEY (user\_id, comment\_id)  
);

\-- Gap 8: Price History  
CREATE TABLE price\_history (  
  id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
  market\_id UUID NOT NULL REFERENCES markets(id),  
  outcome TEXT NOT NULL DEFAULT 'YES',  
  price DECIMAL(10,4) NOT NULL,  
  recorded\_at TIMESTAMPTZ DEFAULT now()  
);  
CREATE INDEX idx\_price\_history\_market ON price\_history(market\_id, recorded\_at DESC);  
\`\`\`

\---

**\#\# Recommended Implementation Order**

**\#\#\# Phase 1 — Quick Wins (1-2 days)**  
1\. **\*\*Gap 7\*\***: Add market thumbnail to detail header  
2\. **\*\*Gap 4\*\***: Move volume/liquidity stats to a prominent banner  
3\. **\*\*Gap 3\*\***: Wire ActivityFeed into market detail page with tabs  
4\. **\*\*Gap 10\*\***: Dynamic creator badge from \`user\_profiles\`

**\#\#\# Phase 2 — Social Layer (3-4 days)**  
5\. **\*\*Gap 2\*\***: Share/Bookmark action bar \+ DB tables  
6\. **\*\*Gap 6\*\***: Comment avatars, likes, sort tabs \+ DB table  
7\. **\*\*Gap 5\*\***: Related Markets section

**\#\#\# Phase 3 — Data & Polish (3-4 days)**  
8\. **\*\*Gap 9\*\***: Replace fake historical chart with real data  
9\. **\*\*Gap 8\*\***: Price change indicators \+ price\_history table  
10\. **\*\*Gap 13\*\***: SEO/OpenGraph meta tags

**\#\#\# Phase 4 — Advanced (5-7 days)**  
11\. **\*\*Gap 1\*\***: Multi-outcome market support  
12\. **\*\*Gap 11\*\***: Bet slip/cart system  
13\. **\*\*Gap 14\*\***: Mobile trading bottom sheet  
14\. **\*\*Gap 12\*\***: Notification bell in navbar

# AI এজেন্ট

### **১. আর্কিটেকচার ডিজাইন: "মডুলার AI সার্ভিস" (Modular AI Services)**

প্রতিটি ফিচারের জন্য আলাদা মডেল তৈরি করার সেরা উপায় হলো **Vertex AI Model Garden** এবং **Vertex AI Pipelines** ব্যবহার করা। প্রতিটি ফিচার একটি নির্দিষ্ট মাইক্রো-সার্ভিস বা API এন্ডপয়েন্ট হিসেবে কাজ করবে।

* **স্পেশালাইজড এজেন্ট:** আপনার AI এজেন্টকে নির্দেশ দিতে হবে যাতে সে প্রতিটি ফিচারের জন্য আলাদা 'System Prompt' এবং 'Tools' তৈরি করে।  
* **সার্ভারলেস এপ্রোচ:** ভার্সেল (Vercel) যেহেতু সার্ভারলেস ফাংশন সাপোর্ট করে, তাই প্রতিটি স্পেশালাইজড মডেলকে Vertex AI SDK-এর মাধ্যমে কল করতে হবে।

---

### **২. ফিচারের ভিত্তিতে স্পেশালাইজড মডেল তৈরি**

আপনার এজেন্ট প্রতিটি ফিচারের জন্য নিচের ধাপগুলো অনুসরণ করবে:

#### **ক) মার্কেট রেজোলিউশন মডেল (Market Resolution Model)**

* **মডেল:** Gemini 1.5 Pro।  
* **কাজ:** এটি সংবাদের সত্যতা যাচাই করবে। এজেন্টকে এমনভাবে প্রম্পট ইঞ্জিনিয়ারিং করতে হবে যাতে সে প্রজেক্টের news\_scraper থেকে আসা ডেটা প্রসেস করতে পারে।

#### **খ) KYC ভেরিফিকেশন মডেল (KYC Model)**

* **মডেল:** Vertex AI Document AI \+ Vision।  
* **কাজ:** আপলোড করা এনআইডি (NID) কার্ডের টেক্সট রিড করা এবং ইউজারের ছবির সাথে মিল দেখা। আপনার এজেন্ট পাইথন বা টাইপস্ক্রিপ্টে এই সার্ভিসটি তৈরি করবে।

#### **গ) রিস্ক অ্যানালিটিক্স মডেল (Risk Engine Model)**

* **মডেল:** AutoML for Tabular Data।  
* **কাজ:** ট্রেডিং প্যাটার্ন দেখে অস্বাভাবিক লেনদেন শনাক্ত করা।

---

### **৩. ভার্সেলে (Vercel) যুক্ত করার পদ্ধতি**

আপনার AI এজেন্টকে নিচের কোড স্ট্রাকচারটি ভার্সেল প্রজেক্টের src/app/api/ ডিরেক্টরিতে যোগ করতে হবে:

#### **ধাপ ১: এনভায়রনমেন্ট ভেরিয়েবল সেটআপ**

প্রথমে ভার্সেল ড্যাশবোর্ডে Google Cloud-এর ক্রেডেনশিয়ালগুলো যোগ করতে হবে:

Bash  
GOOGLE\_APPLICATION\_CREDENTIALS\_JSON='{...}'  
PROJECT\_ID='your-project-id'  
LOCATION='us-central1'

#### **ধাপ ২: স্পেশালাইজড API এন্ডপয়েন্ট তৈরি**

প্রতিটি স্পেশালাইজড মডেলের জন্য আলাদা রুট তৈরি করতে হবে। উদাহরণস্বরূপ, মার্কেট রেজোলিউশনের জন্য:

src/app/api/ai/resolve-market/route.ts

TypeScript  
import { VertexAI } from '@google-cloud/vertexai';  
import { NextResponse } from 'next/server';

export async function POST(req: Request) {  
  const { marketQuestion, dataSources } \= await req.json();  
    
  const vertexAI \= new VertexAI({  
    project: process.env.PROJECT\_ID\!,  
    location: process.env.LOCATION\!,  
  });

  const model \= vertexAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

  const prompt \= \`  
    Analyze the following data from Bangladeshi news sources: ${dataSources}.  
    Resolve this market: "${marketQuestion}".  
    Result must be YES, NO, or UNRESOLVED. Provide reasoning in Bangla.  
  \`;

  const result \= await model.generateContent(prompt);  
  const response \= result.response.candidates\[0\].content;

  return NextResponse.json({ resolution: response });  
}

---

### **৪. AI এজেন্ট কীভাবে বিল্ড করবে (Agent Instruction)**

আপনার এজেন্টকে নিচের মতো করে নির্দেশ দিন:

1. **Code Generation:** "প্রতিটি স্পেশালাইজড ফিচারের জন্য আলাদা src/lib/services/ai/ ডিরেক্টরিতে আলাদা ফাইল তৈরি করো"।  
2. **SDK Integration:** "ভার্সেলে ডিপ্লয় করার জন্য @google-cloud/vertexai লাইব্রেরি ব্যবহার করে সার্ভারলেস ফাংশন লেখো"।  
3. **Deployment Verification:** "বিল্ড করার আগে npm run type-check করে নিশ্চিত করো কোনো এরর নেই"।

### **৫. সারাংশ (Workflow Summary)**

| ফিচার | Vertex AI টুল | ভার্সেল ইমপ্লিমেন্টেশন |
| :---- | :---- | :---- |
| **মার্কেট রেজোলিউশন** | Gemini 1.5 Pro | API Route (/api/ai/resolve) |
| **KYC ভেরিফিকেশন** | Document AI | API Route (/api/kyc/verify) |
| **ইউজার সাপোর্ট** | Search & Conversation | Edge Function (/api/support) |
| **অ্যানোমালি ডিটেকশন** | AutoML Tabular | QStash Scheduled Job (/api/cron/risk) |

# Tab 19

\-- \============================================================================  
\-- Atomic Event and Market Creation Function  
\-- Ensures data consistency by creating both event and markets in a single transaction  
\-- If market creation fails, event is also rolled back  
\-- \============================================================================

CREATE OR REPLACE FUNCTION create\_event\_with\_markets(  
    p\_event\_data JSONB,  
    p\_markets\_data JSONB\[\]  
) RETURNS JSONB AS $$  
DECLARE  
    new\_event\_id UUID;  
    market\_record JSONB;  
    result JSONB;  
    event\_title TEXT;  
    event\_slug TEXT;  
BEGIN  
    \-- Extract event details for logging  
    event\_title :\= p\_event\_data\-\>\>'title';  
    event\_slug :\= p\_event\_data\-\>\>'slug';  
     
    RAISE NOTICE 'Creating event: % with slug: %', event\_title, event\_slug;

    \-- \============================================================================  
    \-- STEP 1: Insert Event  
    \-- \============================================================================  
    INSERT INTO events (  
        title,  
        question,  
        description,  
        category,  
        subcategory,  
        tags,  
        slug,  
        image\_url,  
        trading\_closes\_at,  
        resolution\_date,  
        resolution\_method,  
        resolution\_config,  
        status,  
        is\_featured,  
        created\_by,  
        initial\_liquidity  
    ) VALUES (  
        event\_title,  
        p\_event\_data\-\>\>'question',  
        p\_event\_data\-\>\>'description',  
        p\_event\_data\-\>\>'category',  
        p\_event\_data\-\>\>'subcategory',  
        COALESCE((p\_event\_data\-\>\>'tags')::TEXT\[\], ARRAY\[\]::TEXT\[\]),  
        event\_slug,  
        p\_event\_data\-\>\>'image\_url',  
        (p\_event\_data\-\>\>'trading\_closes\_at')::TIMESTAMPTZ,  
        (p\_event\_data\-\>\>'resolution\_date')::TIMESTAMPTZ,  
        COALESCE(p\_event\_data\-\>\>'resolution\_method', 'MANUAL'),  
        COALESCE(p\_event\_data\-\>'resolution\_config', '{}'::JSONB),  
        COALESCE(p\_event\_data\-\>\>'status', 'active'),  
        COALESCE((p\_event\_data\-\>\>'is\_featured')::BOOLEAN, false),  
        (p\_event\_data\-\>\>'created\_by')::UUID,  
        COALESCE((p\_event\_data\-\>\>'initial\_liquidity')::DECIMAL, 1000)  
    )  
    RETURNING id INTO new\_event\_id;

    RAISE NOTICE 'Event created with ID: %', new\_event\_id;

    \-- \============================================================================  
    \-- STEP 2: Insert Markets (Loop through array)  
    \-- \============================================================================  
    IF p\_markets\_data IS NOT NULL AND array\_length(p\_markets\_data, 1) \> 0 THEN  
        FOREACH market\_record IN ARRAY p\_markets\_data  
        LOOP  
            RAISE NOTICE 'Creating market: % for event: %', market\_record\-\>\>'question', new\_event\_id;  
             
            INSERT INTO markets (  
                event\_id,  
                question,  
                description,  
                outcomes,  
                initial\_liquidity,  
                trading\_fee,  
                min\_trade\_amount,  
                max\_trade\_amount,  
                status,  
                trading\_closes\_at,  
                resolution\_date,  
                created\_by  
            ) VALUES (  
                new\_event\_id,  
                market\_record\-\>\>'question',  
                COALESCE(market\_record\-\>\>'description', ''),  
                COALESCE(market\_record\-\>'outcomes', '\["Yes", "No"\]'::JSONB),  
                COALESCE((market\_record\-\>\>'liquidity')::DECIMAL, 1000),  
                COALESCE((market\_record\-\>\>'trading\_fee')::DECIMAL, 0.02),  
                COALESCE((market\_record\-\>\>'min\_trade\_amount')::DECIMAL, 10),  
                COALESCE((market\_record\-\>\>'max\_trade\_amount')::DECIMAL, 10000),  
                'active'::market\_status,  
                (market\_record\-\>\>'trading\_closes\_at')::TIMESTAMPTZ,  
                (market\_record\-\>\>'resolution\_date')::TIMESTAMPTZ,  
                (p\_event\_data\-\>\>'created\_by')::UUID  
            );  
        END LOOP;  
         
        RAISE NOTICE 'Created % markets for event: %', array\_length(p\_markets\_data, 1), new\_event\_id;  
    ELSE  
        \-- Create default market if no markets provided  
        RAISE NOTICE 'Creating default market for event: %', new\_event\_id;  
         
        INSERT INTO markets (  
            event\_id,  
            question,  
            description,  
            outcomes,  
            initial\_liquidity,  
            trading\_fee,  
            min\_trade\_amount,  
            max\_trade\_amount,  
            status,  
            trading\_closes\_at,  
            resolution\_date,  
            created\_by  
        ) VALUES (  
            new\_event\_id,  
            event\_title,  
            p\_event\_data\-\>\>'description',  
            '\["হ্যাঁ", "না"\]'::JSONB,  
            COALESCE((p\_event\_data\-\>\>'initial\_liquidity')::DECIMAL, 1000),  
            0.02,  
            10,  
            10000,  
            'active'::market\_status,  
            (p\_event\_data\-\>\>'trading\_closes\_at')::TIMESTAMPTZ,  
            (p\_event\_data\-\>\>'resolution\_date')::TIMESTAMPTZ,  
            (p\_event\_data\-\>\>'created\_by')::UUID  
        );  
    END IF;

    \-- \============================================================================  
    \-- STEP 3: Create initial liquidity pool (if using LMSR)  
    \-- \============================================================================  
    BEGIN  
        \-- Check if liquidity\_pools table exists  
        IF EXISTS (SELECT 1 FROM information\_schema.tables WHERE table\_name \= 'liquidity\_pools') THEN  
            INSERT INTO liquidity\_pools (  
                event\_id,  
                market\_id,  
                b\_parameter,  
                total\_liquidity,  
                status  
            )  
            SELECT  
                new\_event\_id,  
                m.id,  
                COALESCE((p\_event\_data\-\>\>'b\_parameter')::DECIMAL, 100),  
                COALESCE((p\_event\_data\-\>\>'initial\_liquidity')::DECIMAL, 1000),  
                'active'::market\_status  
            FROM markets m  
            WHERE m.event\_id \= new\_event\_id;  
             
            RAISE NOTICE 'Liquidity pools created for event: %', new\_event\_id;  
        END IF;  
    EXCEPTION WHEN OTHERS THEN  
        \-- Liquidity pool creation is optional, don't fail transaction  
        RAISE WARNING 'Could not create liquidity pools: %', SQLERRM;  
    END;

    \-- \============================================================================  
    \-- STEP 4: Log activity  
    \-- \============================================================================  
    BEGIN  
        IF EXISTS (SELECT 1 FROM information\_schema.tables WHERE table\_name \= 'activity\_log') THEN  
            INSERT INTO activity\_log (  
                user\_id,  
                action,  
                entity\_type,  
                entity\_id,  
                details  
            ) VALUES (  
                (p\_event\_data\-\>\>'created\_by')::UUID,  
                'EVENT\_CREATED',  
                'event',  
                new\_event\_id,  
                jsonb\_build\_object(  
                    'title', event\_title,  
                    'slug', event\_slug,  
                    'category', p\_event\_data\-\>\>'category',  
                    'markets\_count', COALESCE(array\_length(p\_markets\_data, 1), 1)  
                )  
            );  
        END IF;  
    EXCEPTION WHEN OTHERS THEN  
        \-- Activity logging is optional  
        RAISE WARNING 'Could not log activity: %', SQLERRM;  
    END;

    \-- \============================================================================  
    \-- SUCCESS: Build result  
    \-- \============================================================================  
    result :\= jsonb\_build\_object(  
        'success', true,  
        'event\_id', new\_event\_id,  
        'slug', event\_slug,  
        'message', 'Event and markets created successfully'  
    );

    RAISE NOTICE 'Transaction completed successfully for event: %', new\_event\_id;  
     
    RETURN result;

EXCEPTION WHEN OTHERS THEN  
    \-- \============================================================================  
    \-- FAILURE: Rollback happens automatically  
    \-- \============================================================================  
    RAISE EXCEPTION 'Transaction failed: % | Event: % | Slug: %',  
        SQLERRM, event\_title, event\_slug;  
END;  
$$ LANGUAGE plpgsql;

\-- \============================================================================  
\-- Grant execute permission to authenticated users  
\-- \============================================================================  
GRANT EXECUTE ON FUNCTION create\_event\_with\_markets(JSONB, JSONB\[\]) TO authenticated;  
GRANT EXECUTE ON FUNCTION create\_event\_with\_markets(JSONB, JSONB\[\]) TO service\_role;

\-- \============================================================================  
\-- Add comment for documentation  
\-- \============================================================================  
COMMENT ON FUNCTION create\_event\_with\_markets(JSONB, JSONB\[\]) IS  
'Atomic function to create an event with its associated markets.  
Ensures data consistency by using a single transaction.  
If any part fails, the entire operation is rolled back.

Parameters:  
\- p\_event\_data: JSONB containing event details (title, slug, category, etc.)  
\- p\_markets\_data: Array of JSONB objects containing market details

Returns:  
\- JSONB with success status, event\_id, slug, and message';

# event fix

I've analyzed the 16 files in the 'Event fix final try' folder. It's clear we've accumulated a significant amount of technical debt through multiple partial migrations and ad-hoc patches. The core issues seem to stem from a schema mismatch where the RPC function was trying to reference an 'outcomes' column that doesn't exist in the 'markets' table, and a general lack of synchronization between the backend SQL and the frontend React components.

Hmm... I need to be careful here. If I just apply these files blindly, I might overwrite current work or re-introduce old bugs. But looking at the current structure, it seems the '125' and '141' migrations are the primary candidates for fixing the backend, while the '070' file covers social features.

Wait, I noticed a potential conflict between '125\_fix\_event\_creation\_and\_markets\_fetch.sql' and '141\_complete\_system\_fix.sql'. Both define the create\_event\_complete function. In '125', it's a more basic version, but '141' includes logic for initial liquidity and price history. If these run out of order, or if the application code expects the features from '141' but only gets '125', the market creation will still be broken.

Actually, looking at the frontend files like page.tsx and useMarkets.ts, they seem to expect a very specific data structure—specifically the 25 Bangladesh-specific categories and the 'custom\_categories' table. This confirms that the backend must be stabilized first to support these frontend requirements.

Before I can propose a robust plan or execute any changes, I need to verify the current state of the database. I don't know which of these migrations have already been partially applied or if the 'outcomes' table mentioned in '125' even exists yet. I also need to check if the EventService.ts mentioned in the '141' migration is actually present in the apps/web/src/lib/services/ directory, as the code suggests it's a central dependency.

Unless I have a clear map of the existing schema and the current frontend service implementations, any fix I apply will be based on guesswork. Therefore, the most logical first step is to inspect the actual project files. I need to see the current SQL schema to understand the baseline and check the service directory to see if the necessary frontend utilities are already in place or need to be created from the 'Event fix final try' folder. This will allow me to sequence the SQL migrations correctly and ensure the frontend patches have the necessary dependencies.  
I've read all 16 files in the "Event fix final try" folder. Let me give you a comprehensive analysis and a step-by-step plan.

---

## **📁 File Inventory (16 Files Total)**

### **Database Migrations (3 files)**

| File | Purpose |
| :---- | :---- |
| 070\_social\_and\_market\_features.sql | Creates social tables: user\_bookmarks, market\_followers, comment\_likes, price\_history |
| 125\_fix\_event\_creation\_and\_markets\_fetch.sql | MAIN FIX \- Fixes create\_event\_with\_markets RPC, removes invalid outcomes column reference, adds custom\_categories table with 25 categories, fixes RLS policies |
| 141\_complete\_system\_fix.sql | COMPREHENSIVE FIX \- Fixes resolution\_systems FK, adds missing columns to markets, creates create\_event\_complete function, adds social tables, price history trigger |

### **API Routes (2 files)**

| File | Purpose |
| :---- | :---- |
| admin\_events\_route.ts | Admin events listing API with auth guard |
| route.ts | FIXED event creation API route (delegates to EventService) |

### **Configuration (1 file)**

| File | Purpose |
| :---- | :---- |
| categories.ts | 25 Bangladesh-specific categories with icons |

### **Types (1 file)**

| File | Purpose |
| :---- | :---- |
| plokymarket.ts | Shared TypeScript types for Event, Market, Order, Trade, etc. |

### **Services (1 file)**

| File | Purpose |
| :---- | :---- |
| MarketService.ts | Server-side market operations (seed orderbook, update prices, stats) |

### **Hooks (2 files)**

| File | Purpose |
| :---- | :---- |
| useMarkets.ts | Fixed hook \- fetches ALL events, no status filter, events-first then markets fallback |
| useMarketsRealtime.ts | Real-time Supabase subscription hook for live price updates |

### **Admin UI (1 file)**

| File | Purpose |
| :---- | :---- |
| page.tsx | FIXED event creation form with 25 categories, custom category input, AI Oracle config |

### **Market Page Components (4 files)**

| File | Purpose |
| :---- | :---- |
| MARKET\_PAGE\_PATCH.tsx | Instructions for patching market detail page |
| MarketActions.tsx | Share, Bookmark, Follow buttons component |
| MarketStatsBanner.tsx | Real-time stats banner (volume, liquidity, traders, trades) |
| RelatedMarkets.tsx | Related markets carousel component |

---

## **🔍 Root Cause Analysis (Why Previous Migrations Failed)**

Based on the README and files:

1. Bug 1: create\_event\_with\_markets RPC tried to INSERT into outcomes column on markets table — but outcomes is a separate table, not a column  
2. Bug 2: RLS policies filtered only active status markets — hiding draft/pending/resolved events  
3. Bug 3: Scattered SQL logic with no atomic transactions → partial failures left orphaned rows  
4. Bug 4: Markets table missing columns: name, slug, answer\_type, answer1, answer2, liquidity, etc.  
5. Bug 5: resolution\_systems.event\_id FK pointed to markets(id) instead of events(id)

---

## **📋 Step-by-Step Implementation Plan**

### **PHASE 1: Database Foundation (CRITICAL \- Do First)**

| Step | Action | File to Use |
| :---- | :---- | :---- |
| 1.1 | Backup your database before any changes | — |
| 1.2 | Run migration 141\_complete\_system\_fix.sql in Supabase SQL Editor | 141\_complete\_system\_fix.sql |
| 1.3 | Verify no errors in Supabase logs | — |
| 1.4 | Test RPC function exists: SELECT create\_event\_complete('{}'::jsonb, NULL); | — |

*Note: Migration 141 is the most comprehensive — it includes everything from 070 and 125 plus more fixes. Start with this one.*

### **PHASE 2: Backend API (Node.js/Next.js)**

| Step | Action | Source File | Destination Path |
| :---- | :---- | :---- | :---- |
| 2.1 | Copy fixed event creation API route | route.ts | apps/web/src/app/api/admin/events/create/route.ts |
| 2.2 | Copy admin events listing API | admin\_events\_route.ts | apps/web/src/app/api/admin/events/route.ts |
| 2.3 | Create EventService if not exists | (from 141 migration references) | apps/web/src/lib/services/EventService.ts |
| 2.4 | Copy MarketService | MarketService.ts | apps/web/src/lib/services/MarketService.ts |

### **PHASE 3: Configuration & Types**

| Step | Action | Source File | Destination Path |
| :---- | :---- | :---- | :---- |
| 3.1 | Copy categories config | categories.ts | apps/web/src/lib/config/categories.ts |
| 3.2 | Copy shared types | plokymarket.ts | apps/web/src/types/plokymarket.ts |

### **PHASE 4: Frontend Hooks**

| Step | Action | Source File | Destination Path |
| :---- | :---- | :---- | :---- |
| 4.1 | Copy fixed useMarkets hook | useMarkets.ts | apps/web/src/hooks/useMarkets.ts |
| 4.2 | Copy realtime hook | useMarketsRealtime.ts | apps/web/src/hooks/useMarketsRealtime.ts |

### **PHASE 5: Admin UI**

| Step | Action | Source File | Destination Path |
| :---- | :---- | :---- | :---- |
| 5.1 | Copy fixed event creation page | page.tsx | apps/web/src/app/(dashboard)/sys-cmd-7x9k2/events/create/page.tsx |

### **PHASE 6: Market Detail Page Enhancements**

| Step | Action | Source File | Destination Path |
| :---- | :---- | :---- | :---- |
| 6.1 | Copy MarketStatsBanner component | MarketStatsBanner.tsx | apps/web/src/components/market/MarketStatsBanner.tsx |
| 6.2 | Copy MarketActions component | MarketActions.tsx | apps/web/src/components/market/MarketActions.tsx |
| 6.3 | Copy RelatedMarkets component | RelatedMarkets.tsx | apps/web/src/components/market/RelatedMarkets.tsx |
| 6.4 | Apply patches from MARKET\_PAGE\_PATCH.tsx to your market detail page | MARKET\_PAGE\_PATCH.tsx | apps/web/src/app/(dashboard)/markets/\[id\]/page.tsx |

### **PHASE 7: Testing & Verification**

| Step | Action | Expected Result |
| :---- | :---- | :---- |
| 7.1 | Create a test event via admin panel | Event creates without "outcomes column" error |
| 7.2 | Check markets list page | New event appears immediately |
| 7.3 | Check market detail page | Shows correct data, stats banner visible |
| 7.4 | Test custom category | Can add "+ Custom" category, saves to DB |
| 7.5 | Test real-time updates | Price changes reflect without page refresh |

---

## **⚠️ Gaps Identified (Need Your Input)**

### **Gap 1: EventService.ts**

Migration 141 references eventService.createEventAtomic() but the file only contains MarketService.ts. You need to create:

*`// apps/web/src/lib/services/EventService.ts`*  
`export class EventService {`  
  `async createEventAtomic(input: CreateEventInput, adminId: string) {`  
    `// Calls the create_event_complete RPC`  
  `}`  
`}`

### **Gap 2: Timezone Utility**

The route.ts imports convertToUTC from @/lib/utils/timezone — this file may not exist. You need:

*`// apps/web/src/lib/utils/timezone.ts`*  
`export function convertToUTC(dhakaTime: string): string {`  
  `// Convert Asia/Dhaka to UTC`  
`}`

### **Gap 3: marketStore**

useMarkets.ts imports from @/stores/marketStore — verify this exists or adjust path.

### **Gap 4: Supabase Client Import**

Some files import from @/lib/supabase directly — verify this matches your structure (should be @/lib/supabase/client).

---

## **🎯 Recommended Action (My Advice)**

Given multiple failed migrations, I recommend:

1. Start with a clean approach: Run only migration 141\_complete\_system\_fix.sql — it's the most complete  
2. Don't run 070 or 125 separately — 141 already includes those changes  
3. Test the database first before touching frontend:  
   `SELECT * FROM create_event_complete('{"title":"Test","category":"Sports"}'::jsonb, NULL);`  
4. Copy files in this order: Database → API Routes → Services → Hooks → UI Components

# Db migrations

142c\_workflow\_monitoring\_views  
142b\_upstash\_workflow\_infrastructure  
142a\_normalize\_events\_title  
20260301192500\_012\_integrity\_rls  
20260301192113\_011\_integrity\_fix  
137\_fix\_slug\_and\_required\_columns  
135\_fix\_events\_markets\_relationship  
136\_fix\_events\_columns\_and\_fk  
134\_debug\_event\_creation  
133\_fix\_jsonb\_to\_text\_array  
create\_event\_complete\_function  
130\_fix\_markets\_events\_fk  
129\_allow\_custom\_categories  
128\_fix\_user\_profiles\_rls\_recursion  
127\_phase2\_batch\_orders  
126\_phase2\_notification\_system  
125\_phase2\_price\_history\_analytics  
124\_phase2\_social\_layer  
123\_phase2\_multi\_outcome\_markets  
Create Event with Markets Function  
123\_withdrawal\_api\_support  
122\_wallet\_optimistic\_locking  
121\_system\_hardening\_wallets  
121\_system\_hardening\_indexes  
120\_performance\_indexes  
119\_secure\_atomic\_wallet\_updates  
097\_withdrawal\_2fa  
119\_events\_realtime\_rls  
118\_clob\_industry\_standard  
117\_market\_metrics  
115\_emergency\_pause\_system  
106\_event\_validation\_and\_realtime  
104\_market\_spec\_compliance  
103\_mfs\_deposit\_support  
102\_market\_admin\_fields  
101\_spec\_alignment\_patch  
097\_workflow\_consolidation  
100\_fix\_event\_schema\_and\_rls  
096\_exchange\_rate\_live  
095\_workflow\_tracking  
094\_fix\_events\_system\_bugs  
003\_oracle\_system  
002\_usdt\_functions  
001\_usdt\_schema  
031\_fix\_user\_profiles\_rls  
030\_add\_admin\_profile  
029\_create\_verification\_workflows  
Drop resolution\_systems table if present  
092\_ai\_daily\_topics\_system  
091\_admin\_activity\_logs  
combined\_089\_090  
news\_sources  
088\_expert\_panel\_system  
087\_settle\_market\_v2  
086\_ai\_topic\_config  
085\_fix\_ai\_daily\_topics  
081\_ai\_event\_creation\_schema  
Markets RLS Policy Fix  
079: Update Withdrawal Logic for Automation  
078: Payment Transactions & Deposit RPCs  
077: KYC Review RPC  
076: Withdrawal Request RPC & Wallet Transactions  
075: KYC Documents and Withdrawal Logic  
074: Gamification & Loyalty System  
Governance & Compliance — Audit, Dormant Accounts & KYC  
072: Risk Management & KYC Advanced Workflow  
071\_user\_security\_updates  
Admin Settings, Agent Wallets & Manual Deposits  
P2P Seller Cache and Deposit Attempts  
Binance P2P Seller Cache & Affiliate Deposit Tracking  
User KYC Profiles Schema Update  
User KYC Profiles and RLS Policies  
KYC schema, storage bucket and access policies  
KYC Configuration & Workflow  
Admin RLS Fixes & User Search RPC  
KYC Documents Storage & Access Policies  
063\_kyc\_system  
Deploy Market Function with Event Linkage  
Market Settlement Function  
Create Market Draft with Event Pre-fill  
Events Table and Market Link Migration  
Platform Analytics Snapshots  
Market Verification and Admin Bypass Enhancements  
Admin Account Lookup  
User profiles admin flag migration  
Add is\_dismissed Column to Notifications  
Admin Security & Audit Controls  
User Profiles, Notifications & KYC/Status Setup  
054\_fix\_json\_syntax  
User Profiles, Notification Template Fixes & Account Defaults  
User Admin & Audit Trails  
Market Creation Workflow Drafts  
Comprehensive Notification System Schema  
Maker Rebates & Spread Rewards System  
047\_user\_follows\_and\_feed\_enhancement  
048\_maker\_rebates\_system  
Follow System & Activity Feed Integration  
Badges, Follows & Feed Preferences \+ Comment Vote Trigger  
Threaded Market Comments Retriever  
043\_fix\_missing\_columns  
Advanced Social & Moderation Schema  
Seed Resolved Markets and Activity Using Existing Users  
Users table diagnostic  
Diagnose and Minimal Fix for Trigger/Constraint Insert Failures  
Leaderboard Data Workaround  
Users Table Introspection  
Bulletproof Leaderboard Mock Data  
Leaderboard Mock Data Seeder  
Inspect users triggers and wallets foreign keys  
030\_leaderboard\_mock\_data\_safe  
029\_leaderboard\_mock\_data\_fixed  
024\_payout\_multioutcome  
028\_dispute\_settlement  
027\_advanced\_verification  
026\_verification\_tracking  
025\_bangladesh\_ai\_oracle  
024\_advanced\_ai\_oracle  
023\_regulatory\_reporting\_scalability  
022\_trade\_ledger\_immutability  
021\_advanced\_matching\_engine  
020\_partial\_fill\_management  
019\_advanced\_cancellation\_system  
018\_sample\_bangladesh\_data  
017\_atomic\_order\_commitment  
016\_market\_phases  
015\_adaptive\_tick\_config  
011\_platform\_features  
008\_clob\_functions  
004\_leaderboard\_system  
014\_unified\_wallet\_schema  
012\_wallet\_management  
013\_risk\_engine\_sync  
010\_ledger\_functions  
007\_clob\_system  
009\_clob\_mev  
006\_comments\_system  
005\_activity\_feed  


[image1]: <data:image/png;base64,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>