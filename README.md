# ShasthoBondhu (স্বাস্থ্যবন্ধু)

> **Tagline:** Find Care. Donate Blood. Save Lives.  
> **বাংলা স্লোগান:** চিকিৎসা সেবা খুঁজুন • রক্ত দিন • জীবন বাঁচান

---

## 🏥 Overview

**ShasthoBondhu** is a modern, trustworthy, and community-centric healthcare assistance platform built specifically for Bangladesh. It connects citizens across all 8 administrative divisions with nearby hospitals, qualified specialist doctors, 24/7 pharmacies, voluntary blood donors, and vital dengue prevention & emergency guidelines.

> **Important Prototype Notice:**  
> This application is currently an initial **frontend prototype**. All hospital directories, doctor profiles, pharmacy listings, and blood donor contacts are simulated demo data (`isDemo: true`). In strict compliance with healthcare ethics and safety policies, no real-world patient records, real doctor phone numbers, or donor personal identities are exposed or written to a database in this phase.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack, React 19)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Font Support:** Geist & Bengali typography fallbacks

---

## 🌟 Key Features & Sections

1. **Navigation Bar**
   - Brand logo with medical heart icon.
   - Smooth navigation links: Home, Find Doctors, Hospitals, Pharmacies, Blood Donation, Dengue Help.
   - Dual-language switcher (English ⇄ বাংলা) updating all UI strings dynamically.
   - Quick-action National Health Hotline indicator (`16263`).
   - Mobile-responsive navigation drawer.

2. **Hero Section**
   - Welcoming heading and Bangladesh healthcare mission subtitle.
   - Unified multi-criteria search bar: text keyword, division filter (Dhaka, Chittagong, Sylhet, etc.), and category selector.
   - Call to action buttons: "Explore Healthcare", "Find Blood Donor", and "Register as Donor".
   - Trust highlights: 24/7 National Hotlines, 8 Divisions Covered, Privacy-First Blood Network.

3. **Healthcare Category Cards**
   - 6 quick-navigation visual cards:
     - 🩺 Specialist Doctors (বিশেষজ্ঞ ডাক্তার)
     - 🏥 Hospitals & ICUs (হাসপাতাল ও আইসিইউ)
     - 💊 Pharmacies & Medicine (ফার্মেসি ও ওষুধ)
     - 🩸 Blood Donation (রক্তদাতা সন্ধান)
     - ⚠️ Dengue Information (ডেঙ্গু সতর্কতা)
     - 📞 Emergency Medical Assistance (জরুরি হেল্পলাইন)

4. **Blood Donation Section**
   - Blood group filter buttons (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`).
   - Division and area filter controls with real-time matching.
   - Masked telephone numbers (e.g. `+880 17**-***482`) to protect donor privacy.
   - Clear banner stating the voluntary, non-commercial nature of blood donation.
   - Interactive **Donor Registration Modal** with strict ethical consent checkboxes.

5. **Hospital Directory Preview**
   - Facility search by name, district, or medical service.
   - Service filters: 24/7 Emergency, ICU Available, Dialysis Unit, CCU, NICU.
   - Clear demonstration data badges and emergency casualty contact fields.

6. **Doctor Directory Preview**
   - Search by physician name, location, or medical specialty.
   - Specialty filters: General Medicine & Dengue, Cardiology, Child Care, Gynecology, Orthopedics, Neurology.
   - Chamber visiting hours, consultation fee estimates (demo), and qualifications.
   - Interactive **Appointment Consultation Request Modal**.

7. **Pharmacy Directory Preview**
   - Search by pharmacy name, area, or division.
   - 24/7 open emergency filter.
   - **Prominent Medicine Availability Disclaimer:** Explicitly notifies users that stocks change continuously and requires direct confirmation with a doctor's prescription.

8. **Dengue Help Section**
   - High-visibility public health guide based on DGHS / WHO advisories.
   - 4-point mosquito breeding prevention measures (Aedes control).
   - Common symptoms checklist (high fever, retro-orbital pain, body aches).
   - **Critical Emergency Warning Signs Alert Box:** Severe abdominal pain, persistent vomiting, mucosal bleeding, drowsiness, fluid shock.
   - Direct dial access to Bangladesh official hotlines (`16263`, `999`, `10655`, `333`).
   - Medical disclaimer stating that the site does not provide clinical diagnosis.

9. **Footer & Compliance**
   - About ShasthoBondhu mission.
   - Critical Emergency Guidance Advisory callout.
   - Verified emergency contact links.
   - Interactive **Privacy Policy & Terms of Service** modals.

---

## 📁 Project Structure

```text
C:\Project\ShasthoBondhu\
├── src/
│   ├── app/
│   │   ├── favicon.ico
│   │   ├── globals.css          # Medical styling, scrollbar, theme
│   │   ├── layout.tsx           # Metadata, fonts, and root shell
│   │   └── page.tsx             # Main application orchestrator
│   ├── components/
│   │   ├── blood-donation.tsx   # Blood group filter & donor cards
│   │   ├── category-grid.tsx    # 6 quick-access healthcare cards
│   │   ├── dengue-help.tsx      # Dengue prevention & warning signs
│   │   ├── doctor-directory.tsx # Specialist doctor chamber directory
│   │   ├── footer.tsx           # Advisory notice, hotlines, policies
│   │   ├── hero.tsx             # Hero search bar & quick CTAs
│   │   ├── hospital-directory.tsx # Hospital & ICU facility search
│   │   ├── navbar.tsx           # Bilingual navigation & mobile drawer
│   │   ├── pharmacy-directory.tsx # Dispensary locator & stock disclaimer
│   │   └── modals/
│   │       ├── appointment-modal.tsx # Doctor booking prototype
│   │       ├── auth-modal.tsx        # Sign in / Register prototype
│   │       ├── donor-modal.tsx       # Voluntary donor registration
│   │       ├── hotline-modal.tsx     # 24/7 BD emergency hotlines
│   │       └── legal-modal.tsx       # Privacy & medical disclaimers
│   ├── context/
│   │   └── language-context.tsx # English / Bengali state management
│   ├── data/
│   │   ├── sample-data.ts       # Structured demo dataset
│   │   └── translations.ts      # Bilingual language dictionary
│   └── types/
│       └── index.ts             # TypeScript definitions
├── package.json
├── tsconfig.json
├── eslint.config.mjs
└── README.md
```

---

## 🚀 Installation & Development

### Prerequisites
- Node.js (v18.x or v20.x or v24.x recommended)
- npm (v9.x+ or v10.x+)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

### 3. Run Linter
```bash
npm run lint
```

### 4. Build for Production
```bash
npm run build
```

### 5. Start Production Server
```bash
npm start
```

---

## 🛡️ Adherence to Development Guidelines
1. **Isolated Codebase:** Kept strictly within `C:\Project\ShasthoBondhu`.
2. **Demo Data Transparency:** All sample entries are explicitly tagged with `Demo Data` / `Sample Listing` badges.
3. **Privacy by Design:** Donor phone numbers are masked (`+880 17**-***000`), and real personal identities are not exposed.
4. **No Pretend Database Writes:** Forms and modals clearly notify users that actions are simulated in frontend prototype mode.
5. **No Medical Diagnosis:** Prominent disclaimers instruct users to visit hospitals or call 16263/999 in life-threatening scenarios.
