import React, { useState } from 'react';
import { supabase } from '../config/supabase';
import './ImportBranches.css';

const ImportBranches = ({ onMessage, onImportComplete }) => {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('upload'); // 'upload' or 'review'

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      onMessage('אנא בחר קובץ CSV בלבד');
      return;
    }

    setFile(selectedFile);
    parseCSV(selectedFile);
  };

  const parseCSV = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        onMessage('קובץ CSV ריק או לא תקין');
        return;
      }

      // Get headers
      const headers = lines[0].split(',').map(h => h.trim());
      
      // Parse data
      const data = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        
        if (values.length < 6) continue; // Skip incomplete rows

        const row = {
          branchNumber: values[0] || '',
          branchName: values[1] || '',
          address: values[2] || '',
          managerName: values[3] || '',
          managerPhone: values[4] || '',
          format: values[5] || ''
        };

        data.push(row);
      }

      setParsedData(data);
      checkDuplicates(data);
    };

    reader.readAsText(file, 'UTF-8');
  };

  const checkDuplicates = async (data) => {
    try {
      // Check for duplicate manager phones
      const phones = data.map(row => row.managerPhone).filter(p => p);
      const uniquePhones = [...new Set(phones)];
      
      if (phones.length !== uniquePhones.length) {
        const duplicates = phones.filter((phone, index) => phones.indexOf(phone) !== index);
        onMessage(`נמצאו מספרים כפולים בטלפונים: ${duplicates.join(', ')}`, false);
      }

      setStep('review');
    } catch (error) {
      onMessage('שגיאה בבדיקת כפילויות');
    }
  };

  const handleImport = async () => {
    if (parsedData.length === 0) {
      onMessage('אין נתונים לייבא');
      return;
    }

    setLoading(true);
    
    try {
      // First, create/update managers
      const managerMap = new Map();
      
      for (const row of parsedData) {
        if (!row.managerPhone) continue;
        
        if (!managerMap.has(row.managerPhone)) {
          try {
            // Check if manager exists
            const { data: existing, error: checkError } = await supabase
              .from('managers')
              .select('id, phone')
              .eq('phone', row.managerPhone)
              .maybeSingle();

            if (existing) {
              managerMap.set(row.managerPhone, existing.id);
            } else {
              // Create new manager without user_id
              const { data: newManager, error: insertError } = await supabase
                .from('managers')
                .insert({
                  phone: row.managerPhone,
                  name: row.managerName || '',
                  is_admin: false
                })
                .select()
                .single();

              if (newManager && !insertError) {
                managerMap.set(row.managerPhone, newManager.id);
              }
            }
          } catch (err) {
            console.error('Error with manager:', row.managerPhone, err);
          }
        }
      }

      // Now create/update branches and assign to managers
      for (const row of parsedData) {
        if (!row.branchName) continue;

        console.log('🔍 Processing branch:', row.branchName);

        // Check if branch exists by name
        let existingBranch = null;
        try {
          console.log('📡 Checking if branch exists...');
          const { data, error } = await supabase
            .from('branches')
            .select('id')
            .eq('name', row.branchName)
            .maybeSingle();
          
          console.log('📦 Branch query result:', { data, error });
          existingBranch = data;
        } catch (err) {
          console.error('❌ Error checking branch:', err);
        }

        let branchId;
        
        if (existingBranch) {
          console.log('📝 Updating existing branch:', existingBranch.id);
          // Update existing branch
          const { error } = await supabase
            .from('branches')
            .update({
              branch_number: row.branchNumber,
              name: row.branchName,
              address: row.address,
              format: row.format
            })
            .eq('id', existingBranch.id);
          
          console.log('Update result:', { error });
          branchId = existingBranch.id;
        } else {
          console.log('➕ Creating new branch');
          // Create new branch
          const { data: newBranch, error } = await supabase
            .from('branches')
            .insert({
              branch_number: row.branchNumber,
              name: row.branchName,
              address: row.address,
              format: row.format
            })
            .select()
            .single();
          
          console.log('Insert result:', { newBranch, error });
          if (!error && newBranch) {
            branchId = newBranch.id;
          }
        }

        // Assign manager to branch
        if (branchId && row.managerPhone && managerMap.has(row.managerPhone)) {
          const managerId = managerMap.get(row.managerPhone);
          
          console.log('🔗 Assigning manager to branch:', { managerId, branchId });
          
          try {
            // Check if assignment exists
            const { data: existingAssign, error: checkErr } = await supabase
              .from('manager_branches')
              .select('id')
              .eq('manager_id', managerId)
              .eq('branch_id', branchId)
              .maybeSingle();

            console.log('Assignment check:', { existingAssign, error: checkErr });

            if (!existingAssign) {
              const { data: newAssign, error: assignErr } = await supabase
                .from('manager_branches')
                .insert({
                  manager_id: managerId,
                  branch_id: branchId
                })
                .select();
              
              console.log('Assignment result:', { newAssign, error: assignErr });
            }
          } catch (err) {
            console.error('❌ Error assigning:', err);
          }
        }
      }

      onMessage(`היובא בוצע בהצלחה: ${parsedData.length} סניפים`, true);
      setParsedData([]);
      setFile(null);
      setStep('upload');
      
      // Refresh the data
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (error) {
      console.error('Import error:', error);
      onMessage('שגיאה בייבוא הנתונים');
    } finally {
      setLoading(false);
    }
  };

  const formats = ['מחסני השוק', 'מחסני השוק מהדרין', 'מחסני השוק בשבילך', 'מחסני השוק בסיטי', 'קואופ שופ'];

  if (step === 'review') {
    return (
      <div>
        <h3>סקירת נתונים לייבוא ({parsedData.length} שורות)</h3>
        <div className="csv-preview">
          <table>
            <thead>
              <tr>
                <th>מספר סניף</th>
                <th>שם סניף</th>
                <th>כתובת</th>
                <th>מנהל</th>
                <th>טלפון</th>
                <th>פורמט</th>
              </tr>
            </thead>
            <tbody>
              {parsedData.map((row, index) => (
                <tr key={index}>
                  <td>{row.branchNumber}</td>
                  <td>{row.branchName}</td>
                  <td>{row.address}</td>
                  <td>{row.managerName}</td>
                  <td>{row.managerPhone}</td>
                  <td>{row.format}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <button className="btn" onClick={handleImport} disabled={loading}>
            {loading ? 'מייבא...' : 'ייבא נתונים'}
          </button>
          <button className="btn btn-secondary" onClick={() => {
            setStep('upload');
            setParsedData([]);
            setFile(null);
          }}>
            ביטול
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3>ייבוא סניפים מקובץ CSV</h3>
      <p style={{ marginBottom: '20px', color: '#666' }}>
        אנא העלה קובץ CSV עם העמודות הבאות: מספר סניף, שם סניף, כתובת, שם מנהל, טלפון מנהל, פורמט
      </p>

      <div className="csv-upload-area">
        <label htmlFor="csv-upload" className="csv-upload-label">
          <input
            type="file"
            id="csv-upload"
            accept=".csv"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <div className="csv-upload-content">
            <span>📁</span>
            <p>לחץ לבחירת קובץ CSV או גרור את הקובץ לכאן</p>
          </div>
        </label>
      </div>

      {file && (
        <div style={{ marginTop: '15px' }}>
          <p>קובץ שנבחר: <strong>{file.name}</strong></p>
        </div>
      )}
    </div>
  );
};

export default ImportBranches;

