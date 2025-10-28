#!/bin/bash

# 🚀 סקריפט עדכון ידני ל-UPress
# שימוש: ./update-upress.sh "הודעה על העדכון"

echo "🚀 מתחיל תהליך עדכון ל-UPress..."

# בדיקה שיש הודעה
if [ -z "$1" ]; then
    echo "❌ שגיאה: צריך לספק הודעה על העדכון"
    echo "שימוש: ./update-upress.sh \"הודעה על העדכון\""
    exit 1
fi

UPDATE_MESSAGE="$1"

echo "📝 הודעה: $UPDATE_MESSAGE"

# בניית הפרויקט
echo "🔨 בונה את הפרויקט..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ שגיאה בבנייה! תהליך נעצר."
    exit 1
fi

echo "✅ בנייה הושלמה בהצלחה!"

# יצירת קובץ ZIP
echo "📦 יוצר קובץ ZIP..."
cd build
zip -r ../build-for-upress.zip . > /dev/null
cd ..

echo "✅ קובץ ZIP נוצר: build-for-upress.zip"

# עדכון Git
echo "📤 מעדכן Git..."
git add .
git commit -m "🔄 $UPDATE_MESSAGE"
git push origin main

echo "✅ Git עודכן בהצלחה!"

# יצירת קובץ מידע על העדכון
echo "📋 יוצר קובץ מידע..."
cat > update-info.txt << EOF
עדכון ל-UPress
================
תאריך: $(date)
הודעה: $UPDATE_MESSAGE
קובץ: build-for-upress.zip
גודל: $(du -h build-for-upress.zip | cut -f1)

הוראות:
1. לך ל-UPress → ניהול קבצים
2. העלה את build-for-upress.zip
3. חלץ את הקבצים
4. מחק את הקבצים הישנים (אם נדרש)

GitHub: https://github.com/etaynam/SnifimTimes
EOF

echo "✅ קובץ מידע נוצר: update-info.txt"

echo ""
echo "🎉 תהליך הושלם בהצלחה!"
echo ""
echo "📁 קבצים שנוצרו:"
echo "   - build-for-upress.zip (להעלאה ל-UPress)"
echo "   - update-info.txt (מידע על העדכון)"
echo ""
echo "📋 השלבים הבאים:"
echo "   1. לך ל-UPress → ניהול קבצים"
echo "   2. העלה את build-for-upress.zip"
echo "   3. חלץ את הקבצים"
echo "   4. בדוק שהאתר עובד"
echo ""
echo "🔗 GitHub Repository: https://github.com/etaynam/SnifimTimes"
