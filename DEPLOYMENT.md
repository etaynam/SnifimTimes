# 🚀 הוראות פריסה ל-UPress

## 📋 הגדרת GitHub Secrets

לפני הפריסה הראשונה, צריך להגדיר את ה-Secrets הבאים ב-GitHub:

### 🔐 Secrets נדרשים:

1. **REACT_APP_SUPABASE_URL**
   - הערך: `https://your-project.supabase.co`
   - מקבל מ-Supabase Dashboard → Settings → API

2. **REACT_APP_SUPABASE_ANON_KEY**
   - הערך: `your-anon-key`
   - מקבל מ-Supabase Dashboard → Settings → API

3. **REACT_APP_MASTER_CODE**
   - הערך: `9517`
   - קוד מאסטר להתחברות

4. **FTP_SERVER**
   - הערך: `your-domain.com` או IP של השרת
   - מקבל מ-UPress

5. **FTP_USERNAME**
   - הערך: `your-upress-username`
   - שם משתמש של UPress

6. **FTP_PASSWORD**
   - הערך: `your-upress-password`
   - סיסמה של UPress

## 🛠️ איך להגדיר Secrets:

1. לך ל-GitHub Repository
2. לחץ על **Settings** (בתפריט העליון)
3. לחץ על **Secrets and variables** → **Actions**
4. לחץ על **New repository secret**
5. הוסף כל Secret בנפרד

## 🚀 פריסה:

### פריסה אוטומטית:
```bash
git add .
git commit -m "עדכון חדש"
git push origin main
```

### פריסה ידנית:
1. לך ל-GitHub Repository
2. לחץ על **Actions**
3. לחץ על **Deploy to UPress**
4. לחץ על **Run workflow**

## ✅ בדיקה:

אחרי הפריסה, בדוק שהאתר עובד:
- נסה להתחבר עם מספר טלפון קיים
- בדוק שהקוד מאסטר עובד (9517)
- בדוק שהממשק נראה תקין

## 🔧 פתרון בעיות:

### אם הפריסה נכשלת:
1. בדוק שה-Secrets מוגדרים נכון
2. בדוק שה-FTP credentials נכונים
3. בדוק שה-UPress מאפשר FTP

### אם האתר לא עובד:
1. בדוק שה-Environment Variables מוגדרים ב-UPress
2. בדוק שה-Supabase URL ו-Anon Key נכונים
3. בדוק שה-Master Code מוגדר

## 📞 תמיכה:

אם יש בעיות, בדוק את ה-logs ב-GitHub Actions:
1. לך ל-GitHub Repository
2. לחץ על **Actions**
3. לחץ על הפריסה האחרונה
4. בדוק את ה-logs של כל שלב
