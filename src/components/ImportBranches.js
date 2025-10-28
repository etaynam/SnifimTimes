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

      // Parse data with proper column mapping
      const data = [];
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        
        if (values.length < 6) {
          console.log(`Skipping incomplete row ${i}:`, values);
          continue; // Skip incomplete rows
        }

        const row = {
          branchNumber: cleanValue(values[0]), // A = מספר סניף
          branchName: cleanValue(values[1]),   // B = שם הסניף
          address: cleanValue(values[2]),      // C = כתובת
          managerName: cleanValue(values[3]),  // D = שם מנהל
          managerPhone: cleanValue(values[4]), // E = טלפון מנהל
          format: cleanValue(values[5])        // F = פורמט
        };

        // Validate required fields
        if (!row.branchName || !row.managerPhone) {
          console.log(`Skipping invalid row ${i}:`, row);
          continue;
        }

        data.push(row);
      }

      console.log(`Parsed ${data.length} valid rows from ${lines.length - 1} total rows`);
      setParsedData(data);
      checkDuplicates(data);
    };

    reader.readAsText(file, 'UTF-8');
  };

  const parseCSVLine = (line) => {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    values.push(current); // Add the last value
    return values;
  };

  const cleanValue = (value) => {
    if (!value) return '';
    return value.trim().replace(/^["']|["']$/g, ''); // Remove quotes and trim
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
      let successCount = 0;
      let errorCount = 0;
      
      // Process managers first (slow and careful)
      const managerMap = new Map();
      
      console.log('🔄 Step 1: Processing managers...');
      for (let i = 0; i < parsedData.length; i++) {
        const row = parsedData[i];
        
        if (!row.managerPhone) {
          console.log(`Skipping row ${i + 1}: No manager phone`);
          continue;
        }
        
        if (!managerMap.has(row.managerPhone)) {
          try {
            console.log(`Processing manager ${i + 1}/${parsedData.length}: ${row.managerName} (${row.managerPhone})`);
            
            // Check if manager exists
            const { data: existing, error: checkError } = await supabase
              .from('managers')
              .select('id, phone, name')
              .eq('phone', row.managerPhone)
              .maybeSingle();

            if (checkError) {
              console.error(`Error checking manager ${row.managerPhone}:`, checkError);
              errorCount++;
              continue;
            }

            if (existing) {
              console.log(`Manager exists: ${existing.name} (${existing.phone})`);
              managerMap.set(row.managerPhone, existing.id);
            } else {
              console.log(`Creating new manager: ${row.managerName} (${row.managerPhone})`);
              
              // Create new manager
              const { data: newManager, error: insertError } = await supabase
                .from('managers')
                .insert({
                  phone: row.managerPhone,
                  name: row.managerName || '',
                  is_admin: false
                })
                .select()
                .single();

              if (insertError) {
                console.error(`Error creating manager ${row.managerPhone}:`, insertError);
                errorCount++;
                continue;
              }

              if (newManager) {
                console.log(`Manager created successfully: ${newManager.id}`);
                managerMap.set(row.managerPhone, newManager.id);
              }
            }
            
            // Small delay to prevent overwhelming the database
            await new Promise(resolve => setTimeout(resolve, 100));
            
          } catch (err) {
            console.error(`Unexpected error with manager ${row.managerPhone}:`, err);
            errorCount++;
          }
        }
      }

      console.log(`✅ Managers processed: ${managerMap.size} unique managers`);

      // Process branches (slow and careful)
      console.log('🔄 Step 2: Processing branches...');
      for (let i = 0; i < parsedData.length; i++) {
        const row = parsedData[i];
        
        if (!row.branchName) {
          console.log(`Skipping row ${i + 1}: No branch name`);
          continue;
        }

        try {
          console.log(`Processing branch ${i + 1}/${parsedData.length}: ${row.branchName}`);

          // Check if branch exists by name
          const { data: existingBranch, error: checkError } = await supabase
            .from('branches')
            .select('id, name')
            .eq('name', row.branchName)
            .maybeSingle();
          
          if (checkError) {
            console.error(`Error checking branch ${row.branchName}:`, checkError);
            errorCount++;
            continue;
          }

          let branchId;
          
          if (existingBranch) {
            console.log(`Updating existing branch: ${existingBranch.name}`);
            
            // Update existing branch
            const { error: updateError } = await supabase
              .from('branches')
              .update({
                branch_number: row.branchNumber,
                name: row.branchName,
                address: row.address,
                format: row.format
              })
              .eq('id', existingBranch.id);
            
            if (updateError) {
              console.error(`Error updating branch ${row.branchName}:`, updateError);
              errorCount++;
              continue;
            }
            
            branchId = existingBranch.id;
            console.log(`Branch updated successfully: ${branchId}`);
          } else {
            console.log(`Creating new branch: ${row.branchName}`);
            
            // Create new branch
            const { data: newBranch, error: insertError } = await supabase
              .from('branches')
              .insert({
                branch_number: row.branchNumber,
                name: row.branchName,
                address: row.address,
                format: row.format
              })
              .select()
              .single();
            
            if (insertError) {
              console.error(`Error creating branch ${row.branchName}:`, insertError);
              errorCount++;
              continue;
            }
            
            if (newBranch) {
              branchId = newBranch.id;
              console.log(`Branch created successfully: ${branchId}`);
            }
          }

          // Assign manager to branch
          if (branchId && row.managerPhone && managerMap.has(row.managerPhone)) {
            const managerId = managerMap.get(row.managerPhone);
            
            console.log(`Assigning manager ${managerId} to branch ${branchId}`);
            
            try {
              // Check if assignment exists
              const { data: existingAssign, error: checkErr } = await supabase
                .from('manager_branches')
                .select('id')
                .eq('manager_id', managerId)
                .eq('branch_id', branchId)
                .maybeSingle();

              if (checkErr) {
                console.error(`Error checking assignment:`, checkErr);
                errorCount++;
                continue;
              }

              if (!existingAssign) {
                const { error: assignErr } = await supabase
                  .from('manager_branches')
                  .insert({
                    manager_id: managerId,
                    branch_id: branchId
                  })
                  .select();
                
                if (assignErr) {
                  console.error(`Error creating assignment:`, assignErr);
                  errorCount++;
                  continue;
                }
                
                console.log(`Assignment created successfully`);
              } else {
                console.log(`Assignment already exists`);
              }
            } catch (err) {
              console.error(`Unexpected error assigning:`, err);
              errorCount++;
            }
          } else {
            console.log(`Skipping assignment: branchId=${branchId}, managerPhone=${row.managerPhone}, hasManager=${managerMap.has(row.managerPhone)}`);
          }
          
          successCount++;
          
          // Small delay to prevent overwhelming the database
          await new Promise(resolve => setTimeout(resolve, 150));
          
        } catch (err) {
          console.error(`Unexpected error with branch ${row.branchName}:`, err);
          errorCount++;
        }
      }

      const message = `ייבוא הושלם: ${successCount} סניפים עודכנו בהצלחה${errorCount > 0 ? `, ${errorCount} שגיאות` : ''}`;
      onMessage(message, errorCount === 0);
      
      setParsedData([]);
      setFile(null);
      setStep('upload');
      
      // Refresh the data
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (error) {
      console.error('Import error:', error);
      onMessage('שגיאה כללית בייבוא הנתונים');
    } finally {
      setLoading(false);
    }
  };

  // const formats = ['מחסני השוק', 'מחסני השוק מהדרין', 'מחסני השוק בשבילך', 'מחסני השוק בסיטי', 'קואופ שופ'];

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

