#!/bin/bash

echo "הגדרת SMS Secrets ל-Supabase"
echo "================================"
echo ""
read -p "הכנס את מספר הטלפון שלך (לדוגמה: 0546324261): " SMS_USER
read -sp "הכנס את הסיסמה שלך: " SMS_PASS
echo ""
echo ""
echo "מגדיר את ה-Secrets..."

cd /Users/etaynaaman/Library/CloudStorage/GoogleDrive-invoice@m-shuk.info/My\ Drive/מחלקת\ שיווק\ ופרסום/code/snifimTimes

npx supabase secrets set SMS_USER="$SMS_USER"
npx supabase secrets set SMS_PASS="$SMS_PASS"

echo ""
echo "✅ ה-Secrets הוגדרו בהצלחה!"
echo ""
echo "עכשיו תוכל לשלוח SMS דרך המערכת"

