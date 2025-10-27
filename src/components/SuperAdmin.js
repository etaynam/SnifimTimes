import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import ImportBranches from './ImportBranches';
import Footer from './Footer';
import { FaEdit, FaTrash, FaUser, FaUserTie, FaCheck, FaTimes } from 'react-icons/fa';
import './SuperAdmin.css';

const SuperAdmin = () => {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('branches');
  const [branches, setBranches] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [branchesResult, managersResult] = await Promise.all([
        supabase.from('branches').select('*').order('name'),
        supabase.from('managers').select('*').order('phone')
      ]);

      if (branchesResult.error) throw branchesResult.error;
      if (managersResult.error) throw managersResult.error;

      setBranches(branchesResult.data);
      setManagers(managersResult.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('שגיאה בטעינת הנתונים');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, isSuccess = false) => {
    if (isSuccess) {
      setSuccess(text);
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(text);
      setTimeout(() => setError(''), 3000);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>טוען...</p>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="container">
        <div className="card">
          <div className="header">
            <img src="/Logo.png" alt="Logo" className="logo" />
            <h1 className="subtitle">ניהול מערכת</h1>
            <p>פאנל אדמין</p>
          </div>

          <div className="actions-bar">
            <button className="btn btn-secondary" onClick={signOut}>
              התנתק
            </button>
          </div>

          <div className="tabs">
            <button
              className={`tab ${activeTab === 'branches' ? 'active' : ''}`}
              onClick={() => setActiveTab('branches')}
            >
              ניהול סניפים
            </button>
            <button
              className={`tab ${activeTab === 'managers' ? 'active' : ''}`}
              onClick={() => setActiveTab('managers')}
            >
              ניהול מנהלים
            </button>
            <button
              className={`tab ${activeTab === 'view' ? 'active' : ''}`}
              onClick={() => setActiveTab('view')}
            >
              צפייה בשעות
            </button>
            <button
              className={`tab ${activeTab === 'import' ? 'active' : ''}`}
              onClick={() => setActiveTab('import')}
            >
              ייבוא CSV
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {activeTab === 'branches' && (
            <BranchesTab branches={branches} onUpdate={fetchData} onMessage={showMessage} />
          )}
          {activeTab === 'managers' && (
            <ManagersTab managers={managers} branches={branches} onUpdate={fetchData} onMessage={showMessage} />
          )}
          {activeTab === 'view' && <ViewHoursTab branches={branches} />}
          {activeTab === 'import' && <ImportBranches onMessage={showMessage} onImportComplete={fetchData} />}
        </div>
      </div>
    </div>
  );
};

const BranchesTab = ({ branches, onUpdate, onMessage }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [managerBranches, setManagerBranches] = useState([]);
  const [managers, setManagers] = useState([]);

  useEffect(() => {
    const loadManagerData = async () => {
      const { data: mbData } = await supabase.from('manager_branches').select('*');
      const { data: mgrData } = await supabase.from('managers').select('*');
      setManagerBranches(mbData || []);
      setManagers(mgrData || []);
    };
    loadManagerData();
  }, []);

  const getManagersForBranch = (branchId) => {
    const assignments = managerBranches.filter(mb => mb.branch_id === branchId);
    return assignments.map(assignment => {
      const manager = managers.find(m => m.id === assignment.manager_id);
      return manager;
    }).filter(Boolean);
  };

  const filteredBranches = branches.filter(branch =>
    branch.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = async (branchData) => {
    try {
      const { error } = await supabase.from('branches').insert(branchData);
      if (error) throw error;
      onMessage('סניף נוסף בהצלחה', true);
      setShowAddForm(false);
      onUpdate();
    } catch (err) {
      onMessage('שגיאה בהוספת הסניף');
    }
  };

  const handleUpdate = async (id, branchData) => {
    try {
      const { error } = await supabase
        .from('branches')
        .update(branchData)
        .eq('id', id);
      if (error) throw error;
      onMessage('הסניף עודכן בהצלחה', true);
      setEditingBranch(null);
      onUpdate();
    } catch (err) {
      onMessage('שגיאה בעדכון הסניף');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק סניף זה?')) return;

    try {
      const { error } = await supabase.from('branches').delete().eq('id', id);
      if (error) throw error;
      onMessage('סניף נמחק בהצלחה', true);
      onUpdate();
    } catch (err) {
      onMessage('שגיאה במחיקת הסניף');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="חפש סניף..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            padding: '12px',
            border: 'none',
            background: '#f8f9fa',
            borderRadius: '10px',
            fontSize: '16px',
            fontFamily: 'Almoni, sans-serif',
            fontWeight: 300
          }}
        />
        <button className="btn" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'ביטול' : '+ הוסף סניף'}
        </button>
      </div>

      {showAddForm && (
        <BranchForm onSave={handleAdd} onCancel={() => setShowAddForm(false)} />
      )}

      {filteredBranches.map(branch => (
        <div key={branch.id} className="item-card">
          {editingBranch === branch.id ? (
            <BranchForm
              branch={branch}
              onSave={(data) => handleUpdate(branch.id, data)}
              onCancel={() => setEditingBranch(null)}
            />
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div style={{ flex: 1 }}>
                  <h3>{branch.name}</h3>
                  {getManagersForBranch(branch.id).map((mgr, idx) => (
                    <p key={idx} style={{ color: '#666', fontSize: '14px', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <FaUser /> {mgr.name || mgr.phone}
                    </p>
                  ))}
                  {branch.format && <p style={{ color: '#009245', fontSize: '12px', marginTop: '5px', fontWeight: 'bold' }}>{branch.format}</p>}
                </div>
                <div className="item-actions">
                  <button
                    className="icon-btn"
                    onClick={() => setEditingBranch(branch.id)}
                    title="ערוך"
                  >
                    <FaEdit />
                  </button>
                  <button 
                    className="icon-btn-danger" 
                    onClick={() => handleDelete(branch.id)}
                    title="מחק"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ))}
      
      {filteredBranches.length === 0 && searchTerm && (
        <p style={{ textAlign: 'center', color: '#999', margin: '20px 0' }}>
          לא נמצאו סניפים התואמים לחיפוש
        </p>
      )}
    </div>
  );
};

const BranchForm = ({ branch, onSave, onCancel }) => {
  const [name, setName] = useState(branch?.name || '');
  const [address, setAddress] = useState(branch?.address || '');
  const [format, setFormat] = useState(branch?.format || '');
  const [activePeriod, setActivePeriod] = useState('summer');
  
  // Initialize hours with default structure
  const defaultHours = {
    summer: {
      sun: { open: '', close: '' },
      mon: { open: '', close: '' },
      tue: { open: '', close: '' },
      wed: { open: '', close: '' },
      thu: { open: '', close: '' },
      fri: { open: '', close: '' },
      sat: { open: '', close: '', openSaturday: false }
    },
    winter: {
      sun: { open: '', close: '' },
      mon: { open: '', close: '' },
      tue: { open: '', close: '' },
      wed: { open: '', close: '' },
      thu: { open: '', close: '' },
      fri: { open: '', close: '' },
      sat: { open: '', close: '', openSaturday: false }
    }
  };
  
  // Safely get existing hours or use default
  const getInitialHours = () => {
    if (branch?.hours && typeof branch.hours === 'object') {
      return {
        summer: { ...defaultHours.summer, ...branch.hours.summer },
        winter: { ...defaultHours.winter, ...branch.hours.winter }
      };
    }
    return defaultHours;
  };
  
  const [hours, setHours] = useState(getInitialHours());

  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const dayNames = {
    sun: 'ראשון',
    mon: 'שני',
    tue: 'שלישי',
    wed: 'רביעי',
    thu: 'חמישי',
    fri: 'שישי',
    sat: 'מוצ״ש'
  };

  const handleTimeChange = (period, day, field, value) => {
    setHours(prev => ({
      ...prev,
      [period]: {
        ...prev[period],
        [day]: {
          ...prev[period][day],
          [field]: value
        }
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ name, address, format, hours });
  };

  return (
    <form onSubmit={handleSubmit} className="form-card">
      <div className="form-group">
        <label>שם הסניף:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      
      <div className="form-group">
        <label>כתובת:</label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>
      
      <div className="form-group">
        <label>פורמט:</label>
        <input
          type="text"
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          placeholder="לדוגמה: Super, Mega, Express"
        />
      </div>

      {/* Period Toggle */}
      <div style={{ marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => setActivePeriod('summer')}
          style={{
            flex: 1,
            padding: '12px 16px',
            border: activePeriod === 'summer' ? '2px solid #009245' : '2px solid #e0e0e0',
            background: activePeriod === 'summer' ? 'white' : '#f8f9fa',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: activePeriod === 'summer' ? 600 : 500,
            color: activePeriod === 'summer' ? '#009245' : '#666',
            marginLeft: '8px'
          }}
        >
          ☀️ שעון קיץ
        </button>
        <button
          type="button"
          onClick={() => setActivePeriod('winter')}
          style={{
            flex: 1,
            padding: '12px 16px',
            border: activePeriod === 'winter' ? '2px solid #009245' : '2px solid #e0e0e0',
            background: activePeriod === 'winter' ? 'white' : '#f8f9fa',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: activePeriod === 'winter' ? 600 : 500,
            color: activePeriod === 'winter' ? '#009245' : '#666'
          }}
        >
          ❄️ שעון חורף
        </button>
      </div>

      {/* Days Table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {days.map((day) => (
          <div key={day} style={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            padding: '16px', 
            background: '#f8f9fa', 
            borderRadius: '8px' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '15px' }}>
              <span>{dayNames[day]}</span>
            </div>
            {day === 'sat' ? (
              // Saturday - just checkbox
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '14px 16px', border: '2px solid #e0e0e0', background: 'white', borderRadius: '8px', width: '100%', transition: 'all 0.3s' }}>
                <input
                  type="checkbox"
                  checked={hours[activePeriod][day].openSaturday}
                  onChange={(e) =>
                    handleTimeChange(activePeriod, day, 'openSaturday', e.target.checked)
                  }
                  style={{ width: '22px', height: '22px', accentColor: '#009245', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#333' }}>פתוח במוצ״ש</span>
              </label>
            ) : (
              // Regular days
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                <input
                  type="time"
                  value={hours[activePeriod][day].open || ''}
                  onChange={(e) => handleTimeChange(activePeriod, day, 'open', e.target.value)}
                  step="1800"
                  min="06:00"
                  max="23:59"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: '14px 16px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '16px',
                    background: 'white',
                    boxSizing: 'border-box'
                  }}
                />
                <span style={{ color: '#999', flexShrink: 0 }}>-</span>
                <input
                  type="time"
                  value={hours[activePeriod][day].close || ''}
                  onChange={(e) => handleTimeChange(activePeriod, day, 'close', e.target.value)}
                  step="1800"
                  min="06:00"
                  max="23:59"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: '14px 16px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '16px',
                    background: 'white',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="form-actions">
        <button type="submit" className="btn">
          שמור
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          ביטול
        </button>
      </div>
    </form>
  );
};

const ManagersTab = ({ managers, branches, onUpdate, onMessage }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedManager, setSelectedManager] = useState(null);
  const [managerBranches, setManagerBranches] = useState([]);
  const [branchSearch, setBranchSearch] = useState('');

  const filteredManagers = managers.filter(manager =>
    manager.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    manager.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (selectedManager) {
      fetchManagerBranches(selectedManager);
    }
  }, [selectedManager]);

  const fetchManagerBranches = async (managerId) => {
    try {
      const { data } = await supabase
        .from('manager_branches')
        .select('branch_id, branches (*)')
        .eq('manager_id', managerId);
      setManagerBranches(data || []);
    } catch (err) {
      console.error('Error fetching manager branches:', err);
    }
  };

  const handleAdd = async (managerData) => {
    try {
      const { error } = await supabase.from('managers').insert(managerData);
      if (error) throw error;
      onMessage('מנהל נוסף בהצלחה', true);
      setShowAddForm(false);
      onUpdate();
    } catch (err) {
      onMessage('שגיאה בהוספת המנהל');
    }
  };

  const toggleAdmin = async (id, currentValue) => {
    try {
      const { error } = await supabase
        .from('managers')
        .update({ is_admin: !currentValue })
        .eq('id', id);
      if (error) throw error;
      onMessage('ההרשאות עודכנו', true);
      onUpdate();
    } catch (err) {
      onMessage('שגיאה בעדכון ההרשאות');
    }
  };

  const handleAssignBranches = async () => {
    try {
      const managerId = selectedManager;
      
      // Remove old assignments
      await supabase
        .from('manager_branches')
        .delete()
        .eq('manager_id', managerId);
      
      // Add new assignments
      if (managerBranches.length > 0) {
        await supabase.from('manager_branches').insert(
          managerBranches.map(mb => ({
            manager_id: managerId,
            branch_id: mb.branch_id
          }))
        );
      }
      
      onMessage('השיוכים עודכנו בהצלחה', true);
      fetchManagerBranches(managerId);
    } catch (err) {
      onMessage('שגיאה בעדכון השיוכים');
    }
  };

  const toggleBranchAssignment = (branch) => {
    const exists = managerBranches.find(mb => mb.branch_id === branch.id);
    if (exists) {
      setManagerBranches(managerBranches.filter(mb => mb.branch_id !== branch.id));
    } else {
      setManagerBranches([...managerBranches, { branch_id: branch.id, branches: branch }]);
    }
  };

  const isBranchAssigned = (branchId) => {
    return managerBranches.some(mb => mb.branch_id === branchId);
  };

  const filteredBranches = branches.filter(branch =>
    branch.name?.toLowerCase().includes(branchSearch.toLowerCase()) ||
    branch.address?.toLowerCase().includes(branchSearch.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="חפש מנהל..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            padding: '12px',
            border: 'none',
            background: '#f8f9fa',
            borderRadius: '10px',
            fontSize: '16px',
            fontFamily: 'Almoni, sans-serif',
            fontWeight: 300
          }}
        />
        <button className="btn" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'ביטול' : '+ הוסף מנהל'}
        </button>
      </div>

      {showAddForm && <ManagerForm onSave={handleAdd} onCancel={() => setShowAddForm(false)} />}

      {filteredManagers.map(manager => (
        <div key={manager.id} className="item-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div style={{ flex: 1 }}>
              <h3>{manager.phone}</h3>
              {manager.name && <p style={{ color: '#666', fontSize: '14px', marginTop: '5px' }}>{manager.name}</p>}
              <p style={{ color: '#009245', fontSize: '14px', marginTop: '5px' }}>אדמין: {manager.is_admin ? 'כן' : 'לא'}</p>
            </div>
            <div className="item-actions">
              <button
                className="icon-btn"
                onClick={() => toggleAdmin(manager.id, manager.is_admin)}
                title={manager.is_admin ? 'הסר אדמין' : 'הפוך לאדמין'}
              >
                {manager.is_admin ? <FaUserTie /> : <FaUser />}
              </button>
              <button
                className="icon-btn"
                onClick={() => setSelectedManager(manager.id)}
                title="שייך סניפים"
              >
                <FaEdit />
              </button>
            </div>
          </div>
          {selectedManager === manager.id && (
            <BranchAssignmentPanel
              manager={manager}
              branches={branches}
              filteredBranches={filteredBranches}
              managerBranches={managerBranches}
              branchSearch={branchSearch}
              setBranchSearch={setBranchSearch}
              toggleBranchAssignment={toggleBranchAssignment}
              isBranchAssigned={isBranchAssigned}
              handleAssignBranches={handleAssignBranches}
              onClose={() => setSelectedManager(null)}
            />
          )}
        </div>
      ))}
      
      {filteredManagers.length === 0 && searchTerm && (
        <p style={{ textAlign: 'center', color: '#999', margin: '20px 0' }}>
          לא נמצאו מנהלים התואמים לחיפוש
        </p>
      )}
    </div>
  );
};

const BranchAssignmentPanel = ({ 
  manager, 
  filteredBranches, 
  managerBranches, 
  branchSearch, 
  setBranchSearch,
  toggleBranchAssignment,
  isBranchAssigned,
  handleAssignBranches,
  onClose 
}) => {
  return (
    <div style={{ marginTop: '16px', padding: '20px', background: 'white', border: '2px solid #009245', borderRadius: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h4 style={{ margin: 0, color: '#009245' }}>שיוך סניפים למנהל: {manager.phone}</h4>
        <button className="icon-btn" onClick={onClose} title="סגור">
          <FaTimes />
        </button>
      </div>
      
      <input
        type="text"
        placeholder="חפש סניף..."
        value={branchSearch}
        onChange={(e) => setBranchSearch(e.target.value)}
        style={{
          width: '100%',
          padding: '12px',
          border: '2px solid #e0e0e0',
          borderRadius: '8px',
          fontSize: '15px',
          fontFamily: 'Almoni, sans-serif',
          marginBottom: '16px'
        }}
      />
      
      <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        {filteredBranches.map(branch => (
          <div
            key={branch.id}
            onClick={() => toggleBranchAssignment(branch)}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px',
              background: isBranchAssigned(branch.id) ? '#f8fff9' : '#f8f9fa',
              border: isBranchAssigned(branch.id) ? '2px solid #009245' : '2px solid #e0e0e0',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          >
            <div>
              <p style={{ margin: 0, fontWeight: 600 }}>{branch.name}</p>
              {branch.address && <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>{branch.address}</p>}
            </div>
            {isBranchAssigned(branch.id) ? (
              <FaCheck style={{ color: '#009245', fontSize: '20px' }} />
            ) : (
              <div style={{ width: '20px', height: '20px', border: '2px solid #999', borderRadius: '4px' }} />
            )}
          </div>
        ))}
      </div>
      
      <button className="btn" onClick={handleAssignBranches} style={{ width: '100%' }}>
        שמור שיוכים
      </button>
    </div>
  );
};

const ManagerForm = ({ onSave, onCancel }) => {
  const [phone, setPhone] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // First, we need to get/create the user
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phone,
        options: { shouldCreateUser: true }
      });

      if (error) throw error;

      // Note: In a real scenario, you'd handle the user_id properly
      onSave({ phone, is_admin: isAdmin });
    } catch (err) {
      alert('שגיאה: ' + err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-card">
      <div className="form-group">
        <label>מספר טלפון:</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="05X-XXXXXXX"
          required
        />
      </div>
      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={isAdmin}
            onChange={(e) => setIsAdmin(e.target.checked)}
          />
          אדמין
        </label>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn">
          שמור
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          ביטול
        </button>
      </div>
    </form>
  );
};

const AssignmentsTab = ({ onUpdate, onMessage }) => {
  const [managers, setManagers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedManager, setSelectedManager] = useState('');
  const [selectedBranches, setSelectedBranches] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [managersResult, branchesResult] = await Promise.all([
        supabase.from('managers').select('*'),
        supabase.from('branches').select('*')
      ]);

      setManagers(managersResult.data);
      setBranches(branchesResult.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssign = async () => {
    try {
      // Remove existing assignments
      await supabase
        .from('manager_branches')
        .delete()
        .eq('manager_id', selectedManager);

      // Add new assignments
      if (selectedBranches.length > 0) {
        const assignments = selectedBranches.map(branchId => ({
          manager_id: selectedManager,
          branch_id: branchId
        }));

        const { error } = await supabase
          .from('manager_branches')
          .insert(assignments);

        if (error) throw error;
      }

      onMessage('השיוך עודכן בהצלחה', true);
      setSelectedManager('');
      setSelectedBranches([]);
    } catch (err) {
      onMessage('שגיאה בעדכון השיוך');
    }
  };

  return (
    <div>
      <div className="form-group">
        <label>בחר מנהל:</label>
        <select
          value={selectedManager}
          onChange={(e) => setSelectedManager(e.target.value)}
        >
          <option value="">-- בחר מנהל --</option>
          {managers.map(manager => (
            <option key={manager.id} value={manager.id}>
              {manager.phone}
            </option>
          ))}
        </select>
      </div>

      {selectedManager && (
        <>
          <div className="form-group">
            <label>בחר סניפים:</label>
            {branches.map(branch => (
              <label key={branch.id} className="checkbox-label">
                <input
                  type="checkbox"
                  value={branch.id}
                  checked={selectedBranches.includes(branch.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedBranches([...selectedBranches, branch.id]);
                    } else {
                      setSelectedBranches(selectedBranches.filter(id => id !== branch.id));
                    }
                  }}
                />
                {branch.name}
              </label>
            ))}
          </div>
          <button className="btn" onClick={handleAssign}>
            שמור שיוך
          </button>
        </>
      )}
    </div>
  );
};

const ViewHoursTab = ({ branches }) => {
  return (
    <div>
      {branches.map(branch => (
        <div key={branch.id} className="item-card">
          <h3>{branch.name}</h3>
          <div className="hours-display">
            <div>
              <h4>שעון קיץ:</h4>
              <p>{branch.summer_opening || 'לא הוגדר'} - {branch.summer_closing || 'לא הוגדר'}</p>
            </div>
            <div>
              <h4>שעון חורף:</h4>
              <p>{branch.winter_opening || 'לא הוגדר'} - {branch.winter_closing || 'לא הוגדר'}</p>
            </div>
          </div>
        </div>
      ))}
      <Footer />
    </div>
  );
};

export default SuperAdmin;
