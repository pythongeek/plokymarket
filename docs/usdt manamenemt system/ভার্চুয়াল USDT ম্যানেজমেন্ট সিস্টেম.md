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

