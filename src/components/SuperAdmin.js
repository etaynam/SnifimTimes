import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import ImportBranches from './ImportBranches';
import Footer from './Footer';
import { 
  FaEdit, 
  FaTrash, 
  FaUser, 
  FaUserTie, 
  FaCheck, 
  FaTimes,
  FaBuilding,
  FaUsers,
  FaClock,
  FaFileUpload,
  FaEnvelope,
  FaCog,
  FaSignOutAlt,
  FaBars,
  FaTimes as FaTimesIcon
} from 'react-icons/fa';
import './SuperAdmin.css';

const SuperAdmin = () => {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('branches');
  const [branches, setBranches] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // Sidebar open by default on desktop, closed on mobile
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);

  useEffect(() => {
    fetchData();
    
    // Handle window resize for sidebar
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  const menuItems = [
    { id: 'branches', label: 'ניהול סניפים', icon: FaBuilding },
    { id: 'managers', label: 'ניהול מנהלים', icon: FaUsers },
    { id: 'view', label: 'צפייה בשעות', icon: FaClock },
    { id: 'import', label: 'ייבוא CSV', icon: FaFileUpload },
    { id: 'messages', label: 'הודעות', icon: FaEnvelope },
    { id: 'settings', label: 'הגדרות', icon: FaCog }
  ];

  if (loading) {
    return (
      <div className="superadmin-loading">
        <div className="spinner"></div>
        <p>טוען...</p>
      </div>
    );
  }

  return (
    <div className="superadmin-container">
      {/* Header */}
      <header className="superadmin-header">
        <div className="header-left">
          <button 
            className="sidebar-toggle" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <FaTimesIcon /> : <FaBars />}
          </button>
          <img src="/Logo.png" alt="מחסני השוק" className="header-logo" />
        </div>
        <div className="header-right">
          <button className="btn-signout" onClick={signOut}>
            <FaSignOutAlt />
            <span>התנתק</span>
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="superadmin-layout">
        {/* Sidebar Overlay (mobile) */}
        {sidebarOpen && (
          <div 
            className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`superadmin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <nav className="sidebar-nav">
            {menuItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={`sidebar-menu-item ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab(item.id);
                    // Close sidebar on mobile after selection
                    if (window.innerWidth <= 1024) {
                      setSidebarOpen(false);
                    }
                  }}
                >
                  <Icon className="menu-icon" />
                  <span className="menu-label">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="superadmin-main">
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
          {activeTab === 'messages' && <MessagesTab branches={branches} onUpdate={fetchData} onMessage={showMessage} />}
          {activeTab === 'settings' && <SettingsTab onMessage={showMessage} />}
        </main>
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

      // Trigger Make webhook if hours were updated
      if (branchData.hours) {
        const branch = branches.find(b => b.id === id);
        if (branch) {
          const webhookData = {
            event: 'branch_hours_updated',
            branch_id: id,
            branch_name: branch.name,
            branch_number: branch.branch_number,
            serial_number: branch.serial_number,
            hours: branchData.hours,
            updated_at: new Date().toISOString()
          };

          try {
            console.log('Triggering Make webhook from SuperAdmin with data:', webhookData);
            const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/trigger-make-webhook`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
              },
              body: JSON.stringify(webhookData)
            });
            
            const result = await response.json();
            console.log('Make webhook response from SuperAdmin:', result);
            
            if (!response.ok) {
              console.error('Webhook response not ok:', result);
            }
          } catch (webhookError) {
            console.error('Error triggering Make webhook from SuperAdmin:', webhookError);
            // Don't fail the update if webhook fails
          }
        }
      }

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
    <div className="tab-content-wrapper">
      <div className="search-actions-bar">
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="חפש סניף..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'ביטול' : '+ הוסף סניף'}
        </button>
      </div>

      {showAddForm && (
        <BranchForm onSave={handleAdd} onCancel={() => setShowAddForm(false)} />
      )}

      <div className="branches-grid-container">
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
      </div>
      
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
  const [city, setCity] = useState(branch?.city || '');
  const [phone, setPhone] = useState(branch?.phone || '');
  const [branchMessage, setBranchMessage] = useState(branch?.branch_message || '');
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
    onSave({ name, address, format, city, phone, branch_message: branchMessage, hours });
  };

  return (
    <form onSubmit={handleSubmit} className="form-card">
      <div className="form-layout-grid">
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

        <div className="form-group">
          <label>עיר:</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="לדוגמה: תל אביב"
          />
        </div>

        <div className="form-group">
          <label>טלפון:</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="05X-XXXXXXX"
          />
        </div>
      </div>

      <div className="form-group">
        <label>הודעה לסניף:</label>
        <textarea
          value={branchMessage}
          onChange={(e) => setBranchMessage(e.target.value)}
          placeholder="הודעה שתוצג בתחתית כרטיסיית הסניף"
          rows={3}
          style={{
            width: '100%',
            padding: '12px',
            border: '2px solid #e0e0e0',
            borderRadius: '8px',
            fontSize: '15px',
            fontFamily: 'Almoni, sans-serif',
            resize: 'vertical'
          }}
        />
      </div>

      {/* Period Toggle */}
      <div className="period-toggle-container">
        <button
          type="button"
          onClick={() => setActivePeriod('summer')}
          style={{
            padding: '12px 16px',
            border: activePeriod === 'summer' ? '2px solid #009245' : '2px solid #e0e0e0',
            background: activePeriod === 'summer' ? 'white' : '#f8f9fa',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: activePeriod === 'summer' ? 600 : 500,
            color: activePeriod === 'summer' ? '#009245' : '#666'
          }}
        >
          ☀️ שעון קיץ
        </button>
        <button
          type="button"
          onClick={() => setActivePeriod('winter')}
          style={{
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
      <div className="days-grid-container">
        {days.map((day) => (
          <div key={day} className="day-item">
            <div className="day-item-header">
              <span>{dayNames[day]}</span>
            </div>
            {day === 'sat' ? (
              // Saturday - just checkbox
              <label className="day-saturday-checkbox">
                <input
                  type="checkbox"
                  checked={hours[activePeriod][day].openSaturday}
                  onChange={(e) =>
                    handleTimeChange(activePeriod, day, 'openSaturday', e.target.checked)
                  }
                  style={{ width: '22px', height: '22px', accentColor: '#009245', cursor: 'pointer', flexShrink: 0 }}
                />
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#333' }}>פתוח במוצ״ש</span>
              </label>
            ) : (
              // Regular days
              <div className="day-time-inputs">
                <input
                  type="time"
                  value={hours[activePeriod][day].open || ''}
                  onChange={(e) => handleTimeChange(activePeriod, day, 'open', e.target.value)}
                  step="1800"
                  min="06:00"
                  max="23:59"
                />
                <span style={{ color: '#999', flexShrink: 0 }}>-</span>
                <input
                  type="time"
                  value={hours[activePeriod][day].close || ''}
                  onChange={(e) => handleTimeChange(activePeriod, day, 'close', e.target.value)}
                  step="1800"
                  min="06:00"
                  max="23:59"
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
      // Error handled silently
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
    <div className="tab-content-wrapper">
      <div className="search-actions-bar">
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="חפש מנהל..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'ביטול' : '+ הוסף מנהל'}
        </button>
      </div>

      {showAddForm && (
        <ManagerForm onSave={handleAdd} onCancel={() => setShowAddForm(false)} />
      )}

      <div className="managers-grid-container">
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
      </div>
      
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

// eslint-disable-next-line no-unused-vars
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
  const daysHebrew = {
    sun: 'ראשון',
    mon: 'שני',
    tue: 'שלישי',
    wed: 'רביעי',
    thu: 'חמישי',
    fri: 'שישי',
    sat: 'שבת'
  };

  const periods = {
    summer: 'שעון קיץ',
    winter: 'שעון חורף'
  };

  const renderHours = (hours) => {
    if (!hours || typeof hours !== 'object') {
      return <p style={{ color: '#999' }}>לא הוגדר</p>;
    }
    
    // Check if hours is a JSONB string that needs parsing
    let parsedHours = hours;
    if (typeof hours === 'string') {
      try {
        parsedHours = JSON.parse(hours);
      } catch (e) {
        return <p style={{ color: '#999' }}>שגיאה בפרסור הנתונים</p>;
      }
    }
    
    if (!parsedHours || typeof parsedHours !== 'object') {
      return <p style={{ color: '#999' }}>לא הוגדר</p>;
    }

    return Object.keys(periods).map(period => {
      const periodData = parsedHours[period];
      if (!periodData || typeof periodData !== 'object') {
        return null;
      }

      return (
        <div key={period} style={{ marginBottom: '30px' }}>
          <h4 style={{ color: '#009245', marginBottom: '15px', fontSize: '18px', fontWeight: '700' }}>
            {periods[period]}
          </h4>
          <div style={{ display: 'grid', gap: '10px' }}>
            {Object.keys(daysHebrew).map(day => {
              const dayData = periodData[day];
              if (!dayData) return null;

              if (day === 'sat') {
                // Saturday special handling
                return (
                  <div key={day} style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                    <strong>{daysHebrew[day]}:</strong>{' '}
                    {dayData.openSaturday ? (
                      <span style={{ color: '#009245' }}>פתוח במוצאי שבת</span>
                    ) : (
                      <span style={{ color: '#999' }}>סגור</span>
                    )}
                  </div>
                );
              }

              // Handle both old format (open/close) and new format (start/end)
              const start = dayData.start || dayData.open || '';
              const end = dayData.end || dayData.close || '';
              const closed = dayData.closed;

              return (
                <div key={day} style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <strong>{daysHebrew[day]}:</strong>{' '}
                  {closed ? (
                    <span style={{ color: '#999' }}>סגור</span>
                  ) : start && end ? (
                    <span>{start} - {end}</span>
                  ) : (
                    <span style={{ color: '#999' }}>לא הוגדר</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="tab-content-wrapper">
      <div className="hours-display-grid">
        {branches.map(branch => (
          <div key={branch.id} className="item-card">
            <h3>{branch.name}</h3>
            {branch.address && (
              <p style={{ color: '#666', marginBottom: '20px' }}>📍 {branch.address}</p>
            )}
            <div className="hours-display">
              {renderHours(branch.hours)}
            </div>
          </div>
        ))}
      </div>
      <Footer />
    </div>
  );
};

const BranchMessageEditor = ({ branch, onUpdate }) => {
  const [editingMessage, setEditingMessage] = useState(false);
  const [tempMessage, setTempMessage] = useState(branch.branch_message || '');
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempStartTime, setTempStartTime] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');
  const [tempEndTime, setTempEndTime] = useState('');

  // Helper to split datetime
  const splitDateTime = (isoString) => {
    if (!isoString) return { date: '', time: '' };
    const date = new Date(isoString);
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = date.toTimeString().split(' ')[0].slice(0, 5);
    return { date: dateStr, time: timeStr };
  };

  // Helper to combine date and time
  const combineDateTime = (date, time) => {
    if (!date) return null;
    if (!time) {
      return new Date(date + 'T00:00:00').toISOString();
    }
    return new Date(date + 'T' + time + ':00').toISOString();
  };

  const handleSave = async () => {
    const updateData = {
      branch_message: tempMessage || null,
      branch_message_start_date: combineDateTime(tempStartDate, tempStartTime),
      branch_message_end_date: combineDateTime(tempEndDate, tempEndTime)
    };
    await onUpdate(branch.id, updateData);
    setEditingMessage(false);
  };

  const handleCancel = () => {
    setTempMessage(branch.branch_message || '');
    const { date: startDate, time: startTime } = splitDateTime(branch.branch_message_start_date);
    const { date: endDate, time: endTime } = splitDateTime(branch.branch_message_end_date);
    setTempStartDate(startDate);
    setTempStartTime(startTime);
    setTempEndDate(endDate);
    setTempEndTime(endTime);
    setEditingMessage(false);
  };

  // Initialize dates when starting to edit
  const startEdit = () => {
    setTempMessage(branch.branch_message || '');
    const { date: startDate, time: startTime } = splitDateTime(branch.branch_message_start_date);
    const { date: endDate, time: endTime } = splitDateTime(branch.branch_message_end_date);
    setTempStartDate(startDate);
    setTempStartTime(startTime);
    setTempEndDate(endDate);
    setTempEndTime(endTime);
    setEditingMessage(true);
  };

  return (
    <div className="item-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '15px' }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: '0 0 10px' }}>{branch.name}</h4>
          {editingMessage ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <textarea
                value={tempMessage}
                onChange={(e) => setTempMessage(e.target.value)}
                placeholder="הכנס הודעה לסניף זה"
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #009245',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'Almoni, sans-serif',
                  resize: 'vertical'
                }}
              />
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', display: 'block', marginBottom: '5px' }}>תאריך התחלה:</label>
                  <input
                    type="date"
                    value={tempStartDate}
                    onChange={(e) => setTempStartDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontFamily: 'Almoni, sans-serif'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', display: 'block', marginBottom: '5px' }}>שעת התחלה:</label>
                  <input
                    type="time"
                    value={tempStartTime}
                    onChange={(e) => setTempStartTime(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontFamily: 'Almoni, sans-serif'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', display: 'block', marginBottom: '5px' }}>תאריך סיום:</label>
                  <input
                    type="date"
                    value={tempEndDate}
                    onChange={(e) => setTempEndDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontFamily: 'Almoni, sans-serif'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', display: 'block', marginBottom: '5px' }}>שעת סיום:</label>
                  <input
                    type="time"
                    value={tempEndTime}
                    onChange={(e) => setTempEndTime(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontFamily: 'Almoni, sans-serif'
                    }}
                  />
                </div>
              </div>

              <p style={{ fontSize: '11px', color: '#666', margin: '0' }}>
                להשאיר ריק = הודעה תוצג מיד / ללא סיום
              </p>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="btn"
                  style={{ padding: '8px 16px', fontSize: '14px' }}
                  onClick={handleSave}
                >
                  שמור
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '14px' }}
                  onClick={handleCancel}
                >
                  ביטול
                </button>
              </div>
            </div>
          ) : (
            <div>
              {branch.branch_message ? (
                <>
                  <p style={{ margin: 0, padding: '10px', background: 'rgba(231, 76, 60, 0.08)', borderRadius: '8px', color: '#c0392b' }}>
                    {branch.branch_message}
                  </p>
                  {(branch.branch_message_start_date || branch.branch_message_end_date) && (
                    <p style={{ margin: '5px 0 0', fontSize: '11px', color: '#999' }}>
                      {branch.branch_message_start_date && (
                        <>מתחיל: {new Date(branch.branch_message_start_date).toLocaleString('he-IL', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</>
                      )}
                      {branch.branch_message_start_date && branch.branch_message_end_date && ' | '}
                      {branch.branch_message_end_date && (
                        <>מסתיים: {new Date(branch.branch_message_end_date).toLocaleString('he-IL', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</>
                      )}
                    </p>
                  )}
                </>
              ) : (
                <p style={{ margin: 0, color: '#999', fontStyle: 'italic' }}>אין הודעה</p>
              )}
              <button
                className="btn btn-secondary"
                style={{ marginTop: '10px', padding: '6px 12px', fontSize: '13px' }}
                onClick={startEdit}
              >
                {branch.branch_message ? 'ערוך' : 'הוסף הודעה'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MessagesTab = ({ branches, onUpdate, onMessage }) => {
  const [globalMessages, setGlobalMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddGlobal, setShowAddGlobal] = useState(false);
  const [editingGlobal, setEditingGlobal] = useState(null);
  const [newGlobalMessage, setNewGlobalMessage] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newEndTime, setNewEndTime] = useState('');

  const fetchGlobalMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('global_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }
      
      // Only set messages that actually exist (data is not null)
      setGlobalMessages(data || []);
      console.log('Fetched messages:', data);
    } catch (err) {
      console.error('Error in fetchGlobalMessages:', err);
      onMessage('שגיאה בטעינת ההודעות');
      // Clear state if there's an error
      setGlobalMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper function to combine date and time into ISO string
  const combineDateTime = (date, time) => {
    if (!date) return null;
    if (!time) {
      // If no time provided, set to start/end of day
      return new Date(date + 'T00:00:00').toISOString();
    }
    return new Date(date + 'T' + time + ':00').toISOString();
  };

  // Helper function to split ISO datetime into date and time
  const splitDateTime = (isoString) => {
    if (!isoString) return { date: '', time: '' };
    const date = new Date(isoString);
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = date.toTimeString().split(' ')[0].slice(0, 5);
    return { date: dateStr, time: timeStr };
  };

  const handleAddGlobalMessage = async () => {
    if (!newGlobalMessage.trim()) {
      onMessage('יש להכניס הודעה');
      return;
    }

    try {
      const messageData = {
        message: newGlobalMessage,
        is_active: true,
        start_date: combineDateTime(newStartDate, newStartTime),
        end_date: combineDateTime(newEndDate, newEndTime)
      };

      const { error } = await supabase
        .from('global_messages')
        .insert(messageData);

      if (error) throw error;
      onMessage('הודעה נוספה בהצלחה', true);
      setNewGlobalMessage('');
      setNewStartDate('');
      setNewStartTime('');
      setNewEndDate('');
      setNewEndTime('');
      setShowAddGlobal(false);
      fetchGlobalMessages();
    } catch (err) {
      onMessage('שגיאה בהוספת ההודעה');
    }
  };

  const handleEditGlobalMessage = async (msg) => {
    const { date: startDate, time: startTime } = splitDateTime(msg.start_date);
    const { date: endDate, time: endTime } = splitDateTime(msg.end_date);
    
    setEditingGlobal(msg.id);
    setNewGlobalMessage(msg.message);
    setNewStartDate(startDate);
    setNewStartTime(startTime);
    setNewEndDate(endDate);
    setNewEndTime(endTime);
    setShowAddGlobal(true);
  };

  const handleUpdateGlobalMessageComplete = async () => {
    if (!newGlobalMessage.trim()) {
      onMessage('יש להכניס הודעה');
      return;
    }

    try {
      const messageData = {
        message: newGlobalMessage,
        start_date: combineDateTime(newStartDate, newStartTime),
        end_date: combineDateTime(newEndDate, newEndTime)
      };

      const { error } = await supabase
        .from('global_messages')
        .update(messageData)
        .eq('id', editingGlobal);

      if (error) throw error;
      onMessage('הודעה עודכנה בהצלחה', true);
      setNewGlobalMessage('');
      setNewStartDate('');
      setNewStartTime('');
      setNewEndDate('');
      setNewEndTime('');
      setEditingGlobal(null);
      setShowAddGlobal(false);
      fetchGlobalMessages();
    } catch (err) {
      onMessage('שגיאה בעדכון ההודעה');
    }
  };

  const cancelEdit = () => {
    setNewGlobalMessage('');
    setNewStartDate('');
    setNewStartTime('');
    setNewEndDate('');
    setNewEndTime('');
    setEditingGlobal(null);
    setShowAddGlobal(false);
  };

  const handleUpdateGlobalMessage = async (id, isActive) => {
    try {
      const { error } = await supabase
        .from('global_messages')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
      onMessage('ההודעה עודכנה', true);
      fetchGlobalMessages();
    } catch (err) {
      onMessage('שגיאה בעדכון ההודעה');
    }
  };

  const handleDeleteGlobalMessage = async (id) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק הודעה זו?')) return;

    try {
      // Check current auth status
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session:', session);
      console.log('Trying to delete message with id:', id);

      // First, verify the message exists in the database
      const { data: existingMessage, error: checkError } = await supabase
        .from('global_messages')
        .select('id')
        .eq('id', id)
        .maybeSingle();

      if (checkError) {
        console.error('Check error:', checkError);
        throw checkError;
      }

      // If message doesn't exist in DB, just remove it from local state
      if (!existingMessage) {
        console.warn('Message not found in database, removing from local state only');
        setGlobalMessages(prev => prev.filter(msg => msg.id !== id));
        onMessage('ההודעה לא נמצאה בדאטאבייס והוסרה מהתצוגה', true);
        return;
      }

      console.log('Message exists, attempting deletion...');

      // Message exists, try to delete it
      const { data, error } = await supabase
        .from('global_messages')
        .delete()
        .eq('id', id)
        .select();

      console.log('Delete response - data:', data, 'error:', error);

      if (error) {
        console.error('Delete error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        throw error;
      }
      
      // Check if deletion was successful (data should contain deleted row)
      if (!data || data.length === 0) {
        console.warn('Delete returned empty array - RLS policy might be blocking');
        // Still remove from local state and show message
        setGlobalMessages(prev => prev.filter(msg => msg.id !== id));
        onMessage('ההודעה לא נמחקה מהדאטאבייס (בעיית הרשאות). נסה להריץ את המיגרציה fix_global_messages_rls.sql', false);
        return;
      }
      
      console.log('Delete successful, deleted:', data);
      
      // Remove from local state immediately
      setGlobalMessages(prev => prev.filter(msg => msg.id !== id));
      onMessage('ההודעה נמחקה בהצלחה', true);
      
      // Also refresh from database to be sure
      await fetchGlobalMessages();
    } catch (err) {
      console.error('Error deleting message:', err);
      console.error('Full error object:', JSON.stringify(err, null, 2));
      
      // Remove from local state anyway to clean up UI
      setGlobalMessages(prev => prev.filter(msg => msg.id !== id));
      
      // If deletion failed but message might not exist, remove from local state anyway
      if (err.code === 'PGRST116' || err.message?.includes('not found')) {
        onMessage('ההודעה הוסרה מהתצוגה', true);
      } else if (err.code === '42501' || err.message?.includes('permission') || err.message?.includes('policy')) {
        onMessage('אין הרשאה למחוק הודעה. אנא הריץ את המיגרציה fix_global_messages_rls.sql ב-Supabase', false);
      } else {
        onMessage(`שגיאה במחיקת ההודעה: ${err.message || 'שגיאה לא ידועה'}`, false);
      }
    }
  };

  const handleUpdateBranchMessage = async (branchId, updateData) => {
    try {
      const { error } = await supabase
        .from('branches')
        .update(updateData)
        .eq('id', branchId);

      if (error) throw error;
      onMessage('הודעת הסניף עודכנה', true);
      onUpdate();
    } catch (err) {
      onMessage('שגיאה בעדכון הודעת הסניף');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '20px' }}>טוען...</div>;
  }

  return (
    <div className="tab-content-wrapper">
      <div className="messages-layout">
        <div>
          <h3 style={{ marginBottom: '20px', color: '#009245' }}>הודעות כלליות</h3>
        
          <div style={{ marginBottom: '30px' }}>
        <button className="btn" onClick={() => setShowAddGlobal(!showAddGlobal)}>
          {showAddGlobal ? 'ביטול' : '+ הוסף הודעה כללית'}
        </button>

        {showAddGlobal && (
          <div className="form-card" style={{ marginTop: '20px' }}>
            <div className="form-group">
              <label>הודעה:</label>
              <textarea
                value={newGlobalMessage}
                onChange={(e) => setNewGlobalMessage(e.target.value)}
                placeholder="הכניס הודעה שתצג לכל הסניפים"
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontFamily: 'Almoni, sans-serif',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div className="form-group">
                <label>תאריך התחלה (אופציונלי):</label>
                <input
                  type="date"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontFamily: 'Almoni, sans-serif'
                  }}
                />
              </div>
              <div className="form-group">
                <label>שעת התחלה (אופציונלי, פורמט 24 שעות):</label>
                <input
                  type="time"
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontFamily: 'Almoni, sans-serif'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div className="form-group">
                <label>תאריך סיום (אופציונלי):</label>
                <input
                  type="date"
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontFamily: 'Almoni, sans-serif'
                  }}
                />
              </div>
              <div className="form-group">
                <label>שעת סיום (אופציונלי, פורמט 24 שעות):</label>
                <input
                  type="time"
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontFamily: 'Almoni, sans-serif'
                  }}
                />
              </div>
            </div>

            <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>
              להשאיר ריק = הודעה תוצג מיד / ללא סיום
            </p>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn" 
                onClick={editingGlobal ? handleUpdateGlobalMessageComplete : handleAddGlobalMessage}
              >
                {editingGlobal ? 'עדכן' : 'שמור'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
                ביטול
              </button>
            </div>
          </div>
        )}

        {globalMessages.map((msg) => (
          <div key={msg.id} className="item-card" style={{ marginTop: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.message}</p>
                <p style={{ margin: '10px 0 0', fontSize: '12px', color: '#999' }}>
                  נוצרה: {new Date(msg.created_at).toLocaleDateString('he-IL')}
                  {' | '}
                  סטטוס: {msg.is_active ? 'פעילה' : 'לא פעילה'}
                  {msg.start_date && (
                    <>
                      {' | '}
                      מתחיל: {new Date(msg.start_date).toLocaleString('he-IL', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </>
                  )}
                  {msg.end_date && (
                    <>
                      {' | '}
                      מסתיים: {new Date(msg.end_date).toLocaleString('he-IL', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </>
                  )}
                </p>
              </div>
              <div className="item-actions">
                <button
                  className="icon-btn"
                  onClick={() => handleEditGlobalMessage(msg)}
                  title="ערוך"
                >
                  <FaEdit />
                </button>
                <button
                  className="icon-btn"
                  onClick={() => handleUpdateGlobalMessage(msg.id, !msg.is_active)}
                  title={msg.is_active ? 'השבת' : 'הפעל'}
                >
                  {msg.is_active ? <FaCheck style={{ color: '#009245' }} /> : <FaTimes style={{ color: '#999' }} />}
                </button>
                <button
                  className="icon-btn-danger"
                  onClick={() => handleDeleteGlobalMessage(msg.id)}
                  title="מחק"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          </div>
        ))}

        {globalMessages.length === 0 && !showAddGlobal && (
          <p style={{ textAlign: 'center', color: '#999', margin: '20px 0' }}>
            אין הודעות כלליות
          </p>
        )}
      </div>

          <h3 style={{ marginBottom: '20px', color: '#009245', marginTop: '40px' }}>הודעות סניפים</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {branches.map((branch) => (
              <BranchMessageEditor
                key={branch.id}
                branch={branch}
                onUpdate={handleUpdateBranchMessage}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const SettingsTab = ({ onMessage }) => {
  const [displayPeriod, setDisplayPeriod] = useState('auto');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_key, setting_value')
        .eq('setting_key', 'display_period')
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setDisplayPeriod(data.setting_value || 'auto');
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      onMessage('שגיאה בטעינת ההגדרות');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePeriod = async () => {
    try {
      setSaving(true);
      
      // Upsert the setting
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          setting_key: 'display_period',
          setting_value: displayPeriod,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'setting_key'
        });

      if (error) throw error;
      
      onMessage('ההגדרה נשמרה בהצלחה', true);
    } catch (err) {
      console.error('Error saving settings:', err);
      onMessage('שגיאה בשמירת ההגדרה');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '20px' }}>טוען...</div>;
  }

  const getCurrentPeriod = () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    return month >= 4 && month <= 9 ? 'שעון קיץ' : 'שעון חורף';
  };

  return (
    <div className="tab-content-wrapper">
      <div className="settings-layout">
        <h3 style={{ marginBottom: '20px', color: '#009245' }}>הגדרות תצוגה</h3>
        
        <div className="form-card">
        <div className="form-group">
          <label style={{ fontSize: '16px', fontWeight: 600, marginBottom: '10px', display: 'block' }}>
            תקופת תצוגה באתר הציבורי:
          </label>
          <p style={{ marginBottom: '15px', color: '#666', fontSize: '14px' }}>
            בחר איזה תקופה תוצג למשתמשים באתר הציבורי
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '12px', border: displayPeriod === 'auto' ? '2px solid #009245' : '2px solid #e0e0e0', borderRadius: '8px', background: displayPeriod === 'auto' ? '#f8fff9' : 'white' }}>
              <input
                type="radio"
                name="display_period"
                value="auto"
                checked={displayPeriod === 'auto'}
                onChange={(e) => setDisplayPeriod(e.target.value)}
                style={{ width: '20px', height: '20px', accentColor: '#009245', cursor: 'pointer' }}
              />
              <div>
                <span style={{ fontWeight: 600 }}>אוטומטי</span>
                <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#666' }}>
                  התצוגה תתעדכן אוטומטית לפי החודש הנוכחי ({getCurrentPeriod()})
                </p>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '12px', border: displayPeriod === 'summer' ? '2px solid #009245' : '2px solid #e0e0e0', borderRadius: '8px', background: displayPeriod === 'summer' ? '#f8fff9' : 'white' }}>
              <input
                type="radio"
                name="display_period"
                value="summer"
                checked={displayPeriod === 'summer'}
                onChange={(e) => setDisplayPeriod(e.target.value)}
                style={{ width: '20px', height: '20px', accentColor: '#009245', cursor: 'pointer' }}
              />
              <div>
                <span style={{ fontWeight: 600 }}>☀️ שעון קיץ</span>
                <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#666' }}>
                  תצוגה קבועה של שעון קיץ (אפריל - ספטמבר)
                </p>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '12px', border: displayPeriod === 'winter' ? '2px solid #009245' : '2px solid #e0e0e0', borderRadius: '8px', background: displayPeriod === 'winter' ? '#f8fff9' : 'white' }}>
              <input
                type="radio"
                name="display_period"
                value="winter"
                checked={displayPeriod === 'winter'}
                onChange={(e) => setDisplayPeriod(e.target.value)}
                style={{ width: '20px', height: '20px', accentColor: '#009245', cursor: 'pointer' }}
              />
              <div>
                <span style={{ fontWeight: 600 }}>❄️ שעון חורף</span>
                <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#666' }}>
                  תצוגה קבועה של שעון חורף (אוקטובר - מרץ)
                </p>
              </div>
            </label>
          </div>
        </div>

        <div className="form-actions" style={{ marginTop: '20px' }}>
          <button 
            type="button" 
            className="btn" 
            onClick={handleSavePeriod}
            disabled={saving}
          >
            {saving ? 'שומר...' : 'שמור הגדרה'}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdmin;
