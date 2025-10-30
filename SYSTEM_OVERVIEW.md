# 📋 סקירה מלאה של מערכת ניהול שעות פעילות - מחסני השוק

## 🎯 מטרת המערכת

מערכת אינטרנט לניהול והצגת שעות פעילות של סניפי רשת מחסני השוק (כ-70 סניפים). המערכת כוללת:
- **ממשק ציבורי** להצגת שעות הפעילות של כל הסניפים
- **ממשק מנהלי סניפים** לעדכון שעות הפעילות של הסניפים שלהם
- **ממשק סופר אדמין** לניהול מלא של המערכת

---

## 🛠️ טכנולוגיות

### Frontend
- **React.js 19.2.0** - ספרייה עיקרית
- **React Router DOM 7.9.4** - ניהול ניתובים
- **React Icons 5.5.0** - אייקונים
- **CSS Modules** - עיצוב (RTL support)
- **Custom Fonts** - Almoni (עברית)

### Backend & Database
- **Supabase** - Backend as a Service (BaaS)
  - PostgreSQL Database עם Row Level Security (RLS)
  - Realtime Subscriptions - עדכונים בזמן אמת
  - Edge Functions (Deno) - פונקציות שרת
  - Authentication - מערכת אימות מותאמת אישית

### Authentication
- **OTP דרך SMS** - קוד 4 ספרות נשלח ב-SMS
- **Master Code** - קוד חירום: `9517`
- **SMS Provider** - SMS4FREE API

### Deployment
- **UPress** - אירוח (FTP Deployment)
- **GitHub Actions** - CI/CD אוטומטי
- **React Scripts 5.0.1** - Build tooling

---

## 📁 מבנה הפרויקט

```
snifimTimes/
├── src/
│   ├── components/          # רכיבי React
│   │   ├── BranchList.js    # עמוד ציבורי - רשימת סניפים
│   │   ├── BranchManager.js # פאנל מנהל סניף
│   │   ├── SuperAdmin.js    # פאנל סופר אדמין
│   │   ├── Login.js         # טופס התחברות
│   │   ├── ImportBranches.js # ייבוא CSV
│   │   ├── Footer.js        # תחתית
│   │   └── *.css            # קבצי עיצוב
│   ├── contexts/
│   │   └── AuthContext.js   # ניהול אימות
│   ├── config/
│   │   └── supabase.js      # הגדרות Supabase
│   ├── App.js               # רכיב ראשי + routing
│   └── index.js             # Entry point
├── supabase/
│   └── functions/           # Edge Functions
│       ├── generate-otp/    # יצירת קוד OTP
│       ├── verify-otp/      # אימות קוד OTP
│       ├── check-manager/   # בדיקת מנהל
│       └── trigger-make-webhook/ # Webhook handler
├── public/                  # קבצים סטטיים
├── *.sql                    # מיגרציות מסד נתונים
└── package.json             # תלויות

```

---

## 🗄️ מבנה מסד הנתונים

### טבלה: `branches` (סניפים)

| עמודה | סוג | תיאור |
|-------|-----|-------|
| `id` | UUID | מזהה ייחודי (Primary Key) |
| `branch_number` | TEXT | מספר סניף |
| `name` | TEXT | שם הסניף (חובה) |
| `address` | TEXT | כתובת |
| `city` | TEXT | עיר |
| `phone` | TEXT | מספר טלפון |
| `format` | TEXT | פורמט/סוג (מותג) |
| `hours` | JSONB | שעות פעילות (מבנה מורכב - ראה למטה) |
| `branch_message` | TEXT | הודעה ספציפית לסניף |
| `branch_message_start_date` | TIMESTAMPTZ | תאריך/שעה התחלה להצגת הודעה |
| `branch_message_end_date` | TIMESTAMPTZ | תאריך/שעה סיום להצגת הודעה |
| `created_at` | TIMESTAMPTZ | תאריך יצירה |
| `updated_at` | TIMESTAMPTZ | תאריך עדכון אחרון |

#### מבנה שדה `hours` (JSONB):

```json
{
  "summer": {
    "sun": { "open": "08:00", "close": "20:00" },
    "mon": { "open": "08:00", "close": "20:00" },
    "tue": { "open": "08:00", "close": "20:00" },
    "wed": { "open": "08:00", "close": "20:00" },
    "thu": { "open": "08:00", "close": "20:00" },
    "fri": { "open": "08:00", "close": "14:00" },
    "sat": { "openSaturday": false } // או true אם פתוח בשבת
  },
  "winter": {
    "sun": { "open": "08:00", "close": "19:00" },
    "mon": { "open": "08:00", "close": "19:00" },
    // ... (אותו מבנה כמו קיץ)
    "sat": { "openSaturday": false }
  }
}
```

**הערות:**
- ימים: `sun`, `mon`, `tue`, `wed`, `thu`, `fri`, `sat`
- שעות בפורמט: `"HH:MM"` (24 שעות)
- אם `openSaturday: true` ללא `open`/`close` → מוצג "פתוח כחצי שעה מצאת השבת"
- אם `openSaturday: false` → סגור בשבת

---

### טבלה: `managers` (מנהלים)

| עמודה | סוג | תיאור |
|-------|-----|-------|
| `id` | UUID | מזהה ייחודי (Primary Key) |
| `user_id` | UUID | קישור ל-auth.users (אופציונלי) |
| `name` | TEXT | שם המנהל |
| `phone` | TEXT | מספר טלפון (ייחודי, חובה) |
| `is_admin` | BOOLEAN | האם מנהל הוא סופר אדמין |
| `created_at` | TIMESTAMPTZ | תאריך יצירה |
| `updated_at` | TIMESTAMPTZ | תאריך עדכון |

**הערות:**
- `phone` חייב להיות ייחודי
- `is_admin = true` → גישה ל-SuperAdmin
- `is_admin = false` → גישה ל-BranchManager (רק סניפים משויכים)

---

### טבלה: `manager_branches` (שיוך מנהלים לסניפים)

| עמודה | סוג | תיאור骨骼 |
|-------|-----|--------|
| `id` | UUID | מזהה ייחודי |
| `manager_id` | UUID | FK → managers.id |
| `branch_id` | UUID | FK → branches.id |
| `created_at` | TIMESTAMPTZ | תאריך יצירה |

**הערות:**
- Constraint: `UNIQUE(manager_id, branch_id)` - מנהל לא יכול להיות משויך לאותו סניף פעמיים
- CASCADE DELETE: אם מנהל/סניף נמחק, השיוך נמחק אוטומטית

---

### טבלה: `otp_codes` (קודי אימות)

| עמודה | סוג | תיאור |
|-------|-----|-------|
| `id` | UUID | מזהה ייחודי |
| `phone` | TEXT | מספר טלפון |
| `code` | TEXT | קוד 4 ספרות |
| `created_at` | TIMESTAMPTZ | תאריך יצירה |
| `expires_at` | TIMESTAMPTZ | תאריך פג תוקף (5 דקות) |

**הערות:**
- הקוד נמחק אחרי אימות מוצלח (one-time use)
- תוקף: 5 דקות
- מאוחסן ב-DB ולא נשלח בחזרה ל-client (אבטחה)

---

### טבלה: `global_messages` (הודעות גלובליות)

| עמודה | סוג | תיאור |
|-------|-----|-------|
| `id` | UUID | מזהה ייחודי |
| `message` | TEXT | תוכן ההודעה (חובה) |
| `is_active` | BOOLEAN | האם ההודעה פעילה |
| `start_date` | TIMESTAMPTZ | תאריך/שעה התחלה להצגה |
| `end_date` | TIMESTAMPTZ | תאריך/שעה סיום להצגה |
| `created_at` | TIMESTAMPTZ | תאריך יצירה |
| `updated_at` | TIMESTAMPTZ | תאריך עדכון |

**הערות:**
- הודעות מוצגות **מעל כל הכרטיסיות** בעמוד הציבורי
- סינון אוטומטי לפי `start_date` ו-`end_date`
- אם `start_date = NULL` → מוצג מיד
- אם `end_date = NULL` → מוצג ללא הגבלת זמן
- RLS מושבת על הטבלה הזו (אבטחה ברמת האפליקציה)

---

### טבלה: `app_settings` (הגדרות כלליות)

| עמודה | סוג | תיאור |
|-------|-----|-------|
| `id` | UUID | מזהה ייחודי |
| `setting_key` | VARCHAR(100) | מפתח הגדרה (ייחודי) |
| `setting_value` | TEXT | ערך ההגדרה |
| `description` | TEXT | תיאור |
| `created_at` | TIMESTAMPTZ | תאריך יצירה |
| `updated_at` | TIMESTAMPTZ | תאריך עדכון |

**הגדרות קיימות:**
- `display_period` - תקופת תצוגה: `"auto"`, `"summer"`, או `"winter"`
  - `"auto"` - אוטומטי לפי חודש נוכחי (אפריל-ספטמבר = קיץ, אחרת חורף)
  - `"summer"` - תמיד קיץ
  - `"winter"` - תמיד חורף

---

## 🔐 Row Level Security (RLS) Policies

**הערה חשובה:** המערכת משתמשת באימות מותאם אישית (לא Supabase Auth הרגיל), לכן:
- רוב הטבלאות עם RLS מושבת או עם מדיניות פתוחה
- אבטחה נעשית ברמת האפליקציה (רק מנהלים מחוברים יכולים לגשת)

### `branches`
- **SELECT:** כל אחד יכול לראות (ציבורי)
- **INSERT/UPDATE/DELETE:** רק למנהלים מחוברים (בדיקה ברמת אפליקציה)

### `managers`
- **SELECT:** כל אחד יכול לראות (לצורך אימות)
- **INSERT/UPDATE/DELETE:** רק סופר אדמין (בדיקה ברמת אפליקציה)

### `manager_branches`
- **SELECT:** כל אחד יכול לראות
- **INSERT/UPDATE/DELETE:** רק סופר אדמין

### `otp_codes`
- **INSERT:** Edge Function בלבד (service_role)
- **SELECT/DELETE:** Edge Function בלבד

### `global_messages`
- **RLS מושבת** - אבטחה ברמת אפליקציה

### `app_settings`
- **SELECT:** כל אחד יכול לראות (ציבורי)
- **INSERT/UPDATE/DELETE:** רק סופר אדמין

---

## 🔄 Flow של אימות (Authentication Flow)

### 1. בקשת קוד OTP (`/manager` → Login)

```
User → Enter Phone Number → Click "שלח קוד"
  ↓
Frontend → AuthContext.signInWithPhone(phone)
  ↓
POST /functions/v1/generate-otp
  ↓
Edge Function:
  1. Validate phone (10 digits)
  2. Generate 4-digit code
  3. Store in otp_codes table (expires 5 min)
  4. Send SMS via SMS4FREE API
  5. Return success (WITHOUT code)
  ↓
Frontend → Show "קוד נשלח"
```

### 2. אימות קוד OTP

```
User → Enter Code → Click "התחבר"
  ↓
Frontend → AuthContext.verifyOTP(phone, code)
  ↓
POST /functions/v1/verify-otp
  ↓ Hadge Function:
  1. Find OTP in database (by phone + code)
  2. Check expiration
  3. Constant-time comparison (security)
  4. Delete OTP (one-time use)
  5. Return success/failure
  ↓
Frontend:
  If success:
    - Create user object: { id: `demo-${phone}`, phone }
    - Check admin status from managers table
    - Set user session (local state)
    - Redirect:
      * If is_admin → /manager → SuperAdmin
      * Else → /manager → BranchManager
```

### 3. Master Code (קוד חירום)

```
User → Enter Phone + Master Code (9517)
  ↓
Frontend → AuthContext.verifyOTP(phone, '9517', isMasterCode=true)
  ↓
Frontend:
  1. Check if manager exists in DB
  2. Create user session (local)
  3. Check admin status
  4. Redirect accordingly
```

**הערה:** Master Code **לא** עובר דרך Edge Function - בדיקה מקומית בלבד.

---

## 📱 רכיבי המערכת

### 1. BranchList.js (עמוד ציבורי - `/`)

**תפקיד:** הצגת רשימת כל הסניפים עם פילטרים.

**תכונות:**
- **Real-time Updates** - עדכונים אוטומטיים דרך Supabase Realtime
- **Filters:**
  - חיפוש טקסט חופשי (בשם/כתובת)
  - סינון לפי עיר (`city`)
  - סינון לפי מותג/פורמט (`format`)
  - סינון "פתוח עכשיו" (`filterOpenOnly`)
- **Display Period** - בחירת תקופת תצוגה (`auto`/`summer`/`winter`)
- **Branch Cards:**
  - שם, כתובת, טלפון, עיר
  - שעות פעילות (כולל סטטוס "פתוח/סגור", "יסגר בעוד X דקות")
  - הודעות גלובליות (מעל כרטיסיות)
  - הודעות סניף (בתחתית כל כרטיסייה, עם סגנון אזהרה)
- **Infinite Scroll** - טעינה הדרגתית (10 סניפים בכל פעם)
- **Responsive** - מותאם למובייל ודסקטופ (RTL)

**טכנולוגיות:**
- `useEffect` + Supabase Realtime subscriptions
- `useRef` + Intersection Observer לתמיכה ב-Infinite Scroll
  - תאריכים ושעות: סינון הודעות לפי `start_date`/`end_date`
- חישוב "פתוח עכשיו" - השוואת שעה נוכחית לשעות פעילות

---

### 2. BranchManager.js (פאנל מנהל סניף - `/manager`)

**תפקיד:** עדכון שעות פעילות של הסניפים המשויכים למנהל.

**תכונות:**
- הצגת רשימת סניפים של המנהל (מ-`manager_branches`)
- עריכת שעות לכל סניף:
  - בחירת תקופה (`summer`/`winter`)
  - טבלה עם ימים (א-ש)
  - שדות `open`/`close` לכל יום
  - `openSaturday` checkbox
- שמירה ב-Supabase (Real-time update ל-BranchList)
- התנתקות

**הגבלות:**
- מנהל רואה רק את הסניפים שלו
- לא יכול למחוק/להוסיף סניפים
- לא יכול לערוך פרטים אחרים (שם, כתובת, וכו')

---

### 3. SuperAdmin.js (פאנל סופר אדמין - `/manager` for admins)

**תפקיד:** ניהול מלא של המערכת.

**מבנה CRM-style:**
- **Header** עם לוגו "מחסני השוק" (100px width)
- **Sidebar** עם תפריט ניווט (איקונים)
- **Main Content** - תוכן דינמי לפי טאב

**טאבים:**

#### 3.1 ניהול סניפים (`branches`)
- רשימת כל הסניפים (grid layout)
- חיפוש לפי שם
- **הוספת/עריכת סניף:**
  - שם, כתובת, עיר, טלפון, מספר סניף, פורמט
  - שעות פעילות (summer/winter, כל יום)
  - הודעות סניף (עם תאריכי התחלה/סיום)
- מחיקת סניפים
- ייצוא/ייבוא נתונים

#### 3.2 ניהול מנהלים (`managers`)
- רשימת כל המנהלים
- הוספה/עריכה/מחיקה
- הקצאת/הסרת סניפים למנהל
- הגדרת `is_admin` flag

#### 3.3 צפייה בשעות (`view`)
- תצוגה מקוצרת של שעות כל הסניפים
- חיפוש וסינון

#### 3.4 ייבוא CSV (`import`)
- העלאת קובץ CSV
- מפה שדות (columns mapping)
- תצוגה מקדימה
- ייבוא למסד הנתונים

#### 3.5 הודעות (`messages`)
- **הודעות גלובליות:**
  - הוספה/עריכה/מחיקה
  - הגדרת תאריכי התחלה/סיום
  - הגדרת סטטוס פעיל/לא פעיל
- **הודעות סניפים:**
  - עריכת הודעה לכל סניף
  - תאריכי התחלה/סיום

#### 3.6 הגדרות (`settings`)
- בחירת תקופת תצוגה (`display_period`)
- הגדרות עתידיות

---

### 4. Login.js

**תפקיד:** טופס התחברות.

**תכונות:**
- שדה מספר טלפון (10 ספרות)
- שדה קוד (4 ספרות)
- אפשרות Master Code
- שליחה של OTP
- אימות OTP

---

### 5. ImportBranches.js

**תפקיד:** ייבוא סניפים מקובץ CSV.

**תכונות:**
- העלאת קובץ CSV
- מפה שדות (column mapping)
- תצוגה מקדימה
- אימות נתונים
- ייבוא למסד הנתונים

---

## 🔄 Real-time Updates (Supabase Realtime)

המערכת משתמשת ב-Supabase Realtime כדי לעדכן את העמוד הציבורי אוטומטית כשיש שינויים:

```javascript
// BranchList.js
const channel = supabase
  .channel('branches-changes')
  .on('postgres_changes', {
    event: '*', // INSERT, UPDATE, DELETE
    schema: 'public',
    table: 'branches'
  }, (payload) => {
    fetchBranches(); // רענון אוטומטי
  })
  .subscribe();
```

**טבלאות עם Real-time:**
- `branches` - עדכון שעות/פרטי סניפים
- `app_settings` - עדכון `display_period`

---

## 🎨 עיצוב ו-UI/UX

### פונטים
- **Almoni** - פונט עברי מותאם (Bold + Neue Medium)
- מותקן ב-`public/images/fonts/`

### RTL Support
- כל הקומפוננטים עם `direction: rtl`
- Flexbox/Grid עם `flex-direction: row-reverse` כנדרש
- טקסט עברי מלא

### Responsive Design
- **Mobile (< 768px):**
  - Sidebar מוסתרת (hamburger menu)
  - פילטרים בשורה אחת (flex-wrap)
  - כרטיסיות סניפים במלוא הרוחב
- **Desktop (> 1024px):**
  - Sidebar קבוע (240px)
  - Grid layouts (2-3 עמודות)
  - עיצוב מורחב

### צבעים
- ירוק ראשי: `#27ae60`
- רקע עדין: `#fafdfb`
- כפתורים: ירוק עם hover effects
- הודעות: רקע אדום עדין (`rgba(255, 87, 34, 0. units)`)

---

## 🔧 Environment Variables

```bash
REACT_APP_SUPABASE_URL=https://xxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJxxx...
REACT_APP_MASTER_CODE=9517
```

**Edge Functions Secrets (ב-Supabase Dashboard):**
- `SMS_USER` - שם משתמש SMS4FREE
- `SMS_PASS` - סיסמה SMS4FREE

---

## 🚀 Deployment

### GitHub Actions Workflow

**קובץ:** `.github/workflows/deploy.yml`

**Process:**
1. Trigger: `push` to `main` branch
2. Checkout code
3. Setup Node.js
4. Install dependencies (`npm ci`)
5. Build React app (`npm run build`)
6. Create ZIP file
7. FTP upload to UPress server

**Secrets נדרשים:**
- `FTP_SERVER`
- `FTP_USERNAME`
- `FTP_PASSWORD`
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`
- `REACT_APP_MASTER_CODE`

---

## 📊 מיגרציות מסד נתונים

כל קובץ `.sql` הוא מיגרציה נפרדת שצריך להריץ ב-Supabase SQL Editor.

**סדר מיגרציות מומלץ:**
1. `supabase-schema.sql` - טבלאות בסיסיות
2. `create-required-columns.sql` - עמודות נוספות
3. `add-hours-column.sql` - עמודת hours
4. `add_city_column.sql` - עמודת city
5. `add_phone_column.sql` - עמודת phone
6. `add_branch_serial_number.sql` - מספרי סניפים
7. `add_branch_messages.sql` - הודעות
8. `add_message_dates.sql` - תאריכים להודעות
9. `add_app_settings.sql` - הגדרות כלליות
10. `create-otp-table.sql` - טבלת OTP
11. `fix_global_messages_rls.sql` - תיקון RLS
12. `secure-rls-policies.sql` / `fix-rls-policies.sql` - מדיניות אבטחה

---

## 🔍 פיצ'רים מיוחדים

### 1. "פתוח עכשיו" Filter
- חישוב בזמן אמת אם סניף פתוח
- השוואת שעה נוכחית לשעות היום
- הצגת "יסגר בעוד X דקות" (אם נשארו פחות מ-60 דקות)

### 2. שבת מיוחדת
- אם `openSaturday: true` ללא שעות → "פתוח כחצי שעה מצאת השבת"
- אם `openSaturday: false` → "סגור בשבת"

### 3. הודעות מתוזמנות
- הודעות גלובליות וסניפיות עם `start_date`/`end_date`
- סינון אוטומטי לפי תאריך/שעה נוכחית
- אין צורך למחוק ידנית

### 4. תקופת תצוגה דינמית
- `auto` - אוטומטי לפי חודש (אפריל-ספטמבר = קיץ)
- `summer`/`winter` - כפייה ידנית

### 5. Infinite Scroll
- טעינה הדרגתית של 10 סניפים בכל פעם
- שימוש ב-Intersection Observer
- ביצועים טובים גם עם 70+ סניפים

---

## 🐛 Known Issues & Solutions

### 1. RLS Policies
**בעיה:** חלק מה-RLS policies לא עובדים עם custom auth.
**פתרון:** ב-`global_messages` RLS מושבת, אבטחה ברמת אפליקציה.

### 2. OTP Storage
**בעיה:** בעבר הקוד נשלח בחזרה ל-client (בעיית אבטחה).
**פתרון:** הקוד נשמר רק ב-DB ונשלח ב-SMS בלבד.

### 3. Master Code
**בעיה:** קוד מאסטר לא עובר דרך Edge Function.
**פתרון:** זה בכוונה - קוד חירום שרק ב-frontend.

### 4. Session Management
**בעיה:** אין session storage אמיתי (רק local state).
**פתרון:** המערכת יוצרת user object מקומי, לא Supabase session.

---

## 📝 הערות למפתחים

### Custom Authentication
המערכת **לא** משתמשת ב-Supabase Auth הרגיל. במקום זאת:
- OTP נשלח דרך Edge Function
- אימות נעשה דרך Edge Function
- User session נוצר מקומית (`{ id: 'demo-${phone}', phone }`)
- בדיקת admin status נעשית דרך query ל-`managers` table

### Phone Number Format
- כל מספרי טלפון ב-DB כ-10 ספרות (ללא מקפים/רווחים)
- ניקוי: `phone.replace(/[^0-9]/g, '')`
- אימות: `.length === 10`

### Hours JSONB Structure
- תמיד להתחיל ב-`{}` אם אין נתונים
- לבדוק `typeof hours === 'string'` (אם צריך parse)
- לבדוק קיום `hours.summer` ו-`hours.winter`
- לעמודות של ימים: תמיד `.sun`, `.mon`, וכו' (lowercase)

### Real-time Subscriptions
- תמיד לנקות subscriptions ב-`useEffect` cleanup
- להשתמש ב-`supabase.removeChannel()`
- להיזהר מ-memory leaks

---

## 🔗 קישורים חשובים

- **Supabase Dashboard:** https://supabase.com/dashboard
- **GitHub Repository:** https://github.com/etaynam/SnifimTimes
- **SMS4FREE API:** https://api.sms4free.co.il

---

## 📚 טכנולוגיות נוספות

### Deno (Edge Functions)
- גרסה: `0.168.0`
- Runtime: Deno Deploy (בתוך Supabase)
- Modules: ESM (`https://esm.sh/`)

### PostgreSQL Functions
- `update_updated_at_column()` - טריגר לעדכון `updated_at` אוטומטי
- `uuid_generate_v4()` / `gen_random_uuid()` - יצירת UUID

---

## ✅ Checklist לפריסה חדשה

- [ ] הגדרת Supabase project
- [ ] הרצת כל המיגרציות SQL (בסדר)
- [ ] הגדרת Edge Functions Secrets (SMS credentials)
- [ ] הגדרת Environment Variables ב-GitHub Secrets
- [ ] הגדרת Environment Variables ב-UPress
- [ ] בדיקת SMS API
- [ ] בדיקת Master Code
- [ ] בדיקת Real-time updates
- [ ] בדיקת RLS policies
- [ ] בדיקת responsive design (mobile + desktop)

---

**גרסת מסמך:** 1.0  
**תאריך עדכון:** 2025  
**מטרה:** סקירה מלאה ל-AGENT automation

