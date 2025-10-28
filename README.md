# 🏪 מערכת ניהול שעות פעילות - מחסני השוק

מערכת פנימית מאובטחת לניהול שעות פעילות של סניפי רשת מחסני השוק (בערך 70 סניפים).

## 🚀 תכונות עיקריות

- **🔐 התחברות מאובטחת** עם OTP דרך SMS
- **📱 ממשק מותאם למובייל** עם תמיכה ב-RTL
- **👥 ניהול מנהלים** וסניפים
- **⏰ עדכון שעות פעילות** לכל יום ולכל עונה
- **📊 ייבוא נתונים** מקובץ CSV
- **🛡️ אבטחה גבוהה** עם RLS ו-CSP

## 🎯 משתמשים

### מנהל סניף:
- התחברות עם מספר טלפון + OTP
- עדכון שעות הפעילות של הסניפים שלו
- ממשק פשוט ונוח למובייל

### סופר אדמין:
- ניהול כל הסניפים והמנהלים
- ייבוא נתונים מקובץ CSV
- צפייה בשעות כל הסניפים
- הקצאת מנהלים לסניפים

## 🛠️ טכנולוגיות

- **Frontend:** React.js
- **Backend:** Supabase
- **Database:** PostgreSQL עם RLS
- **Authentication:** OTP דרך SMS
- **Styling:** CSS עם תמיכה ב-RTL
- **Deployment:** UPress + GitHub Actions

## 📦 התקנה ופריסה

### פריסה ידנית:
```bash
# בניית הפרויקט
npm run build

# יצירת קובץ ZIP
cd build && zip -r ../build-for-upress.zip . && cd ..

# העלאה ל-UPress
# העלה את build-for-upress.zip וחלץ אותו
```

### פריסה אוטומטית:
```bash
# עדכון מהיר
./update-upress.sh "הודעה על העדכון"

# או עדכון ידני
git add .
git commit -m "עדכון חדש"
git push origin main
```

## 🔧 משתני סביבה

```bash
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_MASTER_CODE=9517
```

## 📊 מבנה מסד הנתונים

### טבלאות עיקריות:
- **`branches`** - סניפים
- **`managers`** - מנהלים
- **`manager_branches`** - הקצאת מנהלים לסניפים

### שדות חשובים:
- **`hours`** - שעות פעילות (JSONB)
- **`phone`** - מספר טלפון (מזהה)
- **`is_admin`** - סטטוס אדמין

## 🔐 אבטחה

- **Row Level Security (RLS)** על כל הטבלאות
- **Content Security Policy (CSP)** מחמיר
- **OTP מאובטח** דרך Supabase Edge Functions
- **הצפנת נתונים** במסד הנתונים
- **הגנה מפני XSS** ו-CSRF

## 📱 תמיכה במכשירים

- **מובייל:** מותאם במיוחד לטלפונים
- **דסקטופ:** ממשק מורחב ונוח
- **RTL:** תמיכה מלאה בעברית
- **פונטים:** Almoni מותאמים

## 🚀 עדכונים עתידיים

### פריסה אוטומטית (מומלץ):
1. הגדר GitHub Secrets
2. כל `git push` יעדכן את האתר אוטומטית

### פריסה ידנית:
1. השתמש ב-`./update-upress.sh`
2. או עקוב אחרי `MANUAL-UPDATE-GUIDE.md`

## 📞 תמיכה

### בעיות נפוצות:
- **האתר לא עובד:** בדוק שה-`index.html` בתיקייה הראשית
- **שגיאות התחברות:** בדוק את משתני הסביבה
- **בעיות SMS:** בדוק את הגדרות Supabase

### לוגים ודיבוג:
- **Browser Console:** F12 → Console
- **GitHub Actions:** Repository → Actions
- **Supabase Logs:** Dashboard → Logs

## 📈 סטטיסטיקות

- **סניפים:** ~70 סניפים
- **מנהלים:** משתנה
- **עדכונים:** יומיים
- **זמן תגובה:** <2 שניות

## 🔗 קישורים

- **GitHub:** https://github.com/etaynam/SnifimTimes
- **Supabase:** https://supabase.com/dashboard
- **UPress:** [הקישור שלך]

---

**גרסה:** 1.0  
**עדכון אחרון:** $(date)  
**מפתח:** AI Assistant + Etay