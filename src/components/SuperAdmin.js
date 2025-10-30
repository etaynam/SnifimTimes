import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import ImportBranches from './ImportBranches';
import Footer from './Footer';
import SitemapGenerator from './SitemapGenerator';
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
  FaTable,
  FaMapMarkerAlt,
  FaPhone,
  FaExclamationTriangle,
  FaTimes as FaTimesIcon,
  FaChartBar,
  FaEdit as FaEditIcon,
  FaSearch
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
    { id: 'bulk-hours', label: 'עריכת שעות המונית', icon: FaEditIcon },
    { id: 'import', label: 'ייבוא CSV', icon: FaFileUpload },
    { id: 'messages', label: 'הודעות', icon: FaEnvelope },
    { id: 'reports', label: 'דיווחים', icon: FaExclamationTriangle },
    { id: 'statistics', label: 'סטטיסטיקות', icon: FaChartBar },
    { id: 'seo', label: 'SEO & Sitemap', icon: FaSearch },
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
          {activeTab === 'bulk-hours' && <BulkHoursEditTab branches={branches} onUpdate={fetchData} onMessage={showMessage} />}
          {activeTab === 'import' && <ImportBranches onMessage={showMessage} onImportComplete={fetchData} />}
          {activeTab === 'messages' && <MessagesTab branches={branches} onUpdate={fetchData} onMessage={showMessage} />}
          {activeTab === 'reports' && <ReportsTab branches={branches} onUpdate={fetchData} onMessage={showMessage} />}
          {activeTab === 'statistics' && <StatisticsTab onMessage={showMessage} />}
          {activeTab === 'seo' && <SitemapGenerator />}
          {activeTab === 'settings' && <SettingsTab onMessage={showMessage} />}
        </main>
      </div>
    </div>
  );
};

const BranchesTab = ({ branches, onUpdate, onMessage }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
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
        <div className="actions-buttons-wrapper">
          <button className="btn btn-bulk-edit" onClick={() => setShowBulkEdit(true)}>
            <FaTable />
            <span>עריכה מהירה</span>
          </button>
          <button className="btn" onClick={() => setShowAddForm(true)}>
            + הוסף סניף
          </button>
        </div>
      </div>

      {/* Bulk Edit Modal */}
      {showBulkEdit && (
        <BulkEditModal
          branches={branches}
          onClose={() => setShowBulkEdit(false)}
          onSave={async (updatedBranches) => {
            try {
              for (const branch of updatedBranches) {
                await supabase
                  .from('branches')
                  .update({
                    name: branch.name,
                    address: branch.address,
                    city: branch.city,
                    phone: branch.phone,
                    format: branch.format,
                    branch_message: branch.branch_message
                  })
                  .eq('id', branch.id);
              }
              onMessage(`עודכנו ${updatedBranches.length} סניפים בהצלחה`, true);
              setShowBulkEdit(false);
              onUpdate();
            } catch (err) {
              onMessage('שגיאה בשמירת השינויים');
            }
          }}
        />
      )}


      {/* Branch Edit Modal */}
      {(showAddForm || editingBranch) && (
        <div className="branch-modal-overlay" onClick={() => { setShowAddForm(false); setEditingBranch(null); }}>
          <div className="branch-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="branch-modal-header">
              <h2>{editingBranch ? 'עריכת סניף' : 'הוספת סניף חדש'}</h2>
              <button 
                className="modal-close-btn"
                onClick={() => { setShowAddForm(false); setEditingBranch(null); }}
                title="סגור"
              >
                <FaTimesIcon />
              </button>
            </div>
            <div className="branch-modal-body">
              {editingBranch ? (
                <BranchForm
                  branch={branches.find(b => b.id === editingBranch)}
                  onSave={(data) => {
                    handleUpdate(editingBranch, data);
                    setEditingBranch(null);
                  }}
                  onCancel={() => setEditingBranch(null)}
                />
              ) : (
                <BranchForm
                  onSave={(data) => {
                    handleAdd(data);
                    setShowAddForm(false);
                  }}
                  onCancel={() => setShowAddForm(false)}
                />
              )}
            </div>
          </div>
        </div>
      )}

      <div className="branches-grid-container">
        {filteredBranches.map(branch => (
          <div key={branch.id} className="item-card">
            <div className="branch-card-layout">
              <div className="branch-card-info">
                <div className="branch-card-header-info">
                  <h3 className="branch-name-title">{branch.name}</h3>
                  {branch.format && (
                    <span className="branch-format-tag">{branch.format}</span>
                  )}
                </div>
                
                <div className="branch-details-compact">
                  {branch.address && (
                    <div className="branch-detail-row">
                      <FaMapMarkerAlt className="detail-icon-small" />
                      <span>{branch.address}</span>
                    </div>
                  )}
                  {branch.city && (
                    <div className="branch-detail-row branch-city-row">
                      <span>{branch.city}</span>
                    </div>
                  )}
                  {branch.phone && (
                    <div className="branch-detail-row">
                      <FaPhone className="detail-icon-small" />
                      <span>{branch.phone}</span>
                    </div>
                  )}
                  {getManagersForBranch(branch.id).length > 0 && (
                    <div className="branch-managers-row">
                      {getManagersForBranch(branch.id).map((mgr, idx) => (
                        <span key={idx} className="manager-badge">
                          <FaUser className="manager-icon-small" />
                          <span>{mgr.name || mgr.phone}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
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

      {/* Days Table - Compact Table Layout */}
      <div className="days-compact-table">
        <div className="compact-table-header">
          <div className="compact-col-day">יום</div>
          <div className="compact-col-times">שעות פעילות</div>
        </div>
        {days.map((day) => (
          <div key={day} className="compact-table-row">
            <div className="compact-col-day">
              <span className="day-name-compact">{dayNames[day]}</span>
            </div>
            <div className="compact-col-times">
              {day === 'sat' ? (
                // Saturday - checkbox
                <label className="saturday-checkbox-compact">
                  <input
                    type="checkbox"
                    checked={hours[activePeriod][day].openSaturday}
                    onChange={(e) =>
                      handleTimeChange(activePeriod, day, 'openSaturday', e.target.checked)
                    }
                    style={{ width: '18px', height: '18px', accentColor: '#009245', cursor: 'pointer' }}
                  />
                  <span>פתוח במוצ״ש</span>
                </label>
              ) : (
                // Regular days - inline
                <div className="compact-time-inputs">
                  <input
                    type="time"
                    value={hours[activePeriod][day].open || ''}
                    onChange={(e) => handleTimeChange(activePeriod, day, 'open', e.target.value)}
                    step="1800"
                    min="06:00"
                    max="23:59"
                    className="compact-time-field"
                  />
                  <span className="time-separator-compact">—</span>
                  <input
                    type="time"
                    value={hours[activePeriod][day].close || ''}
                    onChange={(e) => handleTimeChange(activePeriod, day, 'close', e.target.value)}
                    step="1800"
                    min="06:00"
                    max="23:59"
                    className="compact-time-field"
                  />
                </div>
              )}
            </div>
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

// Bulk Edit Modal Component - Excel-like interface
const BulkEditModal = ({ branches, onClose, onSave }) => {
  const [editedBranches, setEditedBranches] = useState(
    branches.map(b => ({
      id: b.id,
      name: b.name || '',
      address: b.address || '',
      city: b.city || '',
      phone: b.phone || '',
      format: b.format || '',
      branch_message: b.branch_message || ''
    }))
  );
  const [saving, setSaving] = useState(false);

  const handleCellChange = (branchIndex, field, value) => {
    const updated = [...editedBranches];
    updated[branchIndex] = {
      ...updated[branchIndex],
      [field]: value
    };
    setEditedBranches(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(editedBranches);
    setSaving(false);
  };

  return (
    <div className="branch-modal-overlay" onClick={onClose}>
      <div className="bulk-edit-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="branch-modal-header">
          <h2>עריכה מהירה - כל הסניפים</h2>
          <button className="modal-close-btn" onClick={onClose} title="סגור">
            <FaTimesIcon />
          </button>
        </div>
        <div className="bulk-edit-body">
          <div className="bulk-edit-table-container">
            <table className="bulk-edit-table">
              <thead>
                <tr>
                  <th style={{ width: '200px' }}>שם הסניף</th>
                  <th style={{ width: '250px' }}>כתובת</th>
                  <th style={{ width: '150px' }}>עיר</th>
                  <th style={{ width: '120px' }}>טלפון</th>
                  <th style={{ width: '120px' }}>פורמט</th>
                  <th style={{ width: '300px' }}>הודעה</th>
                </tr>
              </thead>
              <tbody>
                {editedBranches.map((branch, index) => (
                  <tr key={branch.id}>
                    <td>
                      <input
                        type="text"
                        value={branch.name}
                        onChange={(e) => handleCellChange(index, 'name', e.target.value)}
                        className="bulk-edit-input"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={branch.address}
                        onChange={(e) => handleCellChange(index, 'address', e.target.value)}
                        className="bulk-edit-input"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={branch.city}
                        onChange={(e) => handleCellChange(index, 'city', e.target.value)}
                        className="bulk-edit-input"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={branch.phone}
                        onChange={(e) => handleCellChange(index, 'phone', e.target.value)}
                        className="bulk-edit-input"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={branch.format}
                        onChange={(e) => handleCellChange(index, 'format', e.target.value)}
                        className="bulk-edit-input"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={branch.branch_message}
                        onChange={(e) => handleCellChange(index, 'branch_message', e.target.value)}
                        className="bulk-edit-input"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bulk-edit-actions">
            <button className="btn" onClick={handleSave} disabled={saving}>
              {saving ? 'שומר...' : 'שמור שינויים'}
            </button>
            <button className="btn btn-secondary" onClick={onClose} disabled={saving}>
              ביטול
            </button>
          </div>
        </div>
      </div>
    </div>
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

const ReportsTab = ({ onUpdate, onMessage, branches }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('open'); // 'all', 'open', 'pending', 'in_progress', 'closed'
  const [closingReport, setClosingReport] = useState(null);
  const [closeReason, setCloseReason] = useState('');
  const [editingBranchId, setEditingBranchId] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('branch_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (err) {
      console.error('Error fetching reports:', err);
      onMessage('שגיאה בטעינת הדיווחים');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (reportId, newStatus) => {
    try {
      const { error } = await supabase
        .from('branch_reports')
        .update({ status: newStatus })
        .eq('id', reportId);

      if (error) throw error;
      onMessage('הסטטוס עודכן בהצלחה', true);
      fetchReports();
    } catch (err) {
      onMessage('שגיאה בעדכון הסטטוס');
    }
  };

  const handleCloseReport = async () => {
    if (!closeReason.trim()) {
      alert('אנא הזן סיבה לסגירה');
      return;
    }

    try {
      const { error } = await supabase
        .from('branch_reports')
        .update({ 
          status: 'closed',
          closed_reason: closeReason.trim()
        })
        .eq('id', closingReport.id);

      if (error) throw error;
      onMessage('הדיווח נסגר בהצלחה', true);
      setClosingReport(null);
      setCloseReason('');
      fetchReports();
    } catch (err) {
      onMessage('שגיאה בסגירת הדיווח');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק דיווח זה?')) return;

    try {
      const { error } = await supabase
        .from('branch_reports')
        .delete()
        .eq('id', id);

      if (error) throw error;
      onMessage('הדיווח נמחק בהצלחה', true);
      fetchReports();
    } catch (err) {
      onMessage('שגיאה במחיקת הדיווח');
    }
  };

  const dayNames = {
    sun: 'ראשון',
    mon: 'שני',
    tue: 'שלישי',
    wed: 'רביעי',
    thu: 'חמישי',
    fri: 'שישי',
    sat: 'שבת'
  };

  const filteredReports = filterStatus === 'all' 
    ? reports 
    : filterStatus === 'open'
    ? reports.filter(r => r.status === 'pending' || r.status === 'in_progress')
    : reports.filter(r => r.status === filterStatus);

  const openReportsCount = reports.filter(r => r.status === 'pending' || r.status === 'in_progress').length;

  const getStatusBadge = (status) => {
    const statuses = {
      pending: { text: 'ממתין לטיפול', color: '#f39c12' },
      in_progress: { text: 'בטיפול', color: '#3498db' },
      closed: { text: 'סגור', color: '#95a5a6' }
    };
    const statusInfo = statuses[status] || statuses.pending;
    return (
      <span style={{
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 600,
        background: statusInfo.color + '20',
        color: statusInfo.color,
        fontFamily: 'Almoni, sans-serif'
      }}>
        {statusInfo.text}
      </span>
    );
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '20px' }}>טוען...</div>;
  }

  return (
    <div className="tab-content-wrapper">
      <div style={{ marginBottom: '24px' }}>
        <div className="reports-filters" style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'nowrap', alignItems: 'center', overflowX: 'auto', paddingBottom: '5px' }}>
          <button
            className={`btn btn-filter ${filterStatus === 'open' ? 'active' : ''}`}
            onClick={() => setFilterStatus('open')}
            style={{ 
              background: filterStatus === 'open' ? '#e74c3c' : '#f8f9fa', 
              color: filterStatus === 'open' ? 'white' : '#666',
              border: filterStatus === 'open' ? 'none' : '1px solid #e0e0e0',
              fontWeight: filterStatus === 'open' ? 600 : 500,
              padding: '8px 16px',
              borderRadius: '20px',
              whiteSpace: 'nowrap',
              fontSize: '14px',
              transition: 'all 0.3s ease'
            }}
          >
            פניות פתוחות ({openReportsCount})
          </button>
          <button
            className={`btn btn-filter ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
            style={{ 
              background: filterStatus === 'all' ? '#009245' : '#f8f9fa', 
              color: filterStatus === 'all' ? 'white' : '#666',
              border: filterStatus === 'all' ? 'none' : '1px solid #e0e0e0',
              fontWeight: filterStatus === 'all' ? 600 : 500,
              padding: '8px 16px',
              borderRadius: '20px',
              whiteSpace: 'nowrap',
              fontSize: '14px',
              transition: 'all 0.3s ease'
            }}
          >
            הכל ({reports.length})
          </button>
          <button
            className={`btn btn-filter ${filterStatus === 'pending' ? 'active' : ''}`}
            onClick={() => setFilterStatus('pending')}
            style={{ 
              background: filterStatus === 'pending' ? '#f39c12' : '#f8f9fa', 
              color: filterStatus === 'pending' ? 'white' : '#666',
              border: filterStatus === 'pending' ? 'none' : '1px solid #e0e0e0',
              fontWeight: filterStatus === 'pending' ? 600 : 500,
              padding: '8px 16px',
              borderRadius: '20px',
              whiteSpace: 'nowrap',
              fontSize: '14px',
              transition: 'all 0.3s ease'
            }}
          >
            ממתינים ({reports.filter(r => r.status === 'pending').length})
          </button>
          <button
            className={`btn btn-filter ${filterStatus === 'in_progress' ? 'active' : ''}`}
            onClick={() => setFilterStatus('in_progress')}
            style={{ 
              background: filterStatus === 'in_progress' ? '#3498db' : '#f8f9fa', 
              color: filterStatus === 'in_progress' ? 'white' : '#666',
              border: filterStatus === 'in_progress' ? 'none' : '1px solid #e0e0e0',
              fontWeight: filterStatus === 'in_progress' ? 600 : 500,
              padding: '8px 16px',
              borderRadius: '20px',
              whiteSpace: 'nowrap',
              fontSize: '14px',
              transition: 'all 0.3s ease'
            }}
          >
            בטיפול ({reports.filter(r => r.status === 'in_progress').length})
          </button>
          <button
            className={`btn btn-filter ${filterStatus === 'closed' ? 'active' : ''}`}
            onClick={() => setFilterStatus('closed')}
            style={{ 
              background: filterStatus === 'closed' ? '#95a5a6' : '#f8f9fa', 
              color: filterStatus === 'closed' ? 'white' : '#666',
              border: filterStatus === 'closed' ? 'none' : '1px solid #e0e0e0',
              fontWeight: filterStatus === 'closed' ? 600 : 500,
              padding: '8px 16px',
              borderRadius: '20px',
              whiteSpace: 'nowrap',
              fontSize: '14px',
              transition: 'all 0.3s ease'
            }}
          >
            סגורים ({reports.filter(r => r.status === 'closed').length})
          </button>
        </div>
      </div>

      {filteredReports.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '80px 40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px'
        }}>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf0 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '30px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
          }}>
            <FaExclamationTriangle style={{
              fontSize: '50px',
              color: '#bdc3c7'
            }} />
          </div>
          <h3 style={{ 
            margin: '0 0 12px 0', 
            color: '#7f8c8d', 
            fontSize: '28px',
            fontFamily: 'Almoni, sans-serif',
            fontWeight: 700,
            letterSpacing: '-0.5px'
          }}>
            אין פניות פתוחות
          </h3>
          <p style={{ 
            margin: 0, 
            color: '#95a5a6', 
            fontSize: '16px',
            fontFamily: 'Almoni, sans-serif',
            lineHeight: '1.6',
            maxWidth: '400px'
          }}>
            כל הפניות טופלו או נסגרו. מעולה!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredReports.map(report => (
            <div key={report.id} className="item-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    <h4 style={{ margin: 0, fontSize: '18px', fontFamily: 'Almoni, sans-serif' }}>{report.branch_name}</h4>
                    {getStatusBadge(report.status)}
                  </div>
                  
                  <div style={{ marginBottom: '10px' }}>
                    <strong style={{ fontSize: '14px', color: '#666' }}>ימים:</strong>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '5px' }}>
                      {report.days && report.days.map((day, idx) => (
                        <span key={idx} style={{
                          padding: '4px 10px',
                          background: '#f8fff9',
                          border: '1px solid #009245',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontFamily: 'Almoni, sans-serif',
                          color: '#009245'
                        }}>
                          {dayNames[day] || day}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <strong style={{ fontSize: '14px', color: '#666' }}>תיאור:</strong>
                    <p style={{ margin: '5px 0 0', color: '#333', fontSize: '15px', fontFamily: 'Almoni, sans-serif', whiteSpace: 'pre-wrap' }}>
                      {report.message}
                    </p>
                  </div>

                  {report.closed_reason && (
                    <div style={{ marginTop: '10px', padding: '10px', background: '#f8f9fa', borderRadius: '8px' }}>
                      <strong style={{ fontSize: '13px', color: '#666' }}>סיבת סגירה:</strong>
                      <p style={{ margin: '5px 0 0', color: '#555', fontSize: '14px', fontFamily: 'Almoni, sans-serif' }}>
                        {report.closed_reason}
                      </p>
                    </div>
                  )}

                  <p style={{ margin: '10px 0 0', fontSize: '12px', color: '#999' }}>
                    נוצר: {new Date(report.created_at).toLocaleString('he-IL', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                <div className="item-actions" style={{ flexDirection: 'column', gap: '8px' }}>
                  {report.branch_id && branches && branches.find(b => b.id === report.branch_id) && (
                    <button
                      className="icon-btn"
                      onClick={() => setEditingBranchId(report.branch_id)}
                      title="ערוך סניף"
                      style={{ background: '#27ae60', color: 'white' }}
                    >
                      <FaBuilding />
                    </button>
                  )}
                  {report.status !== 'closed' && (
                    <>
                      {report.status === 'pending' && (
                        <button
                          className="icon-btn"
                          onClick={() => handleStatusChange(report.id, 'in_progress')}
                          title="העבר לטיפול"
                          style={{ background: '#3498db', color: 'white' }}
                        >
                          <FaEdit />
                        </button>
                      )}
                      <button
                        className="icon-btn"
                        onClick={() => setClosingReport(report)}
                        title="סגור דיווח"
                        style={{ background: '#95a5a6', color: 'white' }}
                      >
                        <FaCheck />
                      </button>
                    </>
                  )}
                  <button
                    className="icon-btn-danger"
                    onClick={() => handleDelete(report.id)}
                    title="מחק"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Close Report Modal */}
      {closingReport && (
        <div className="branch-modal-overlay" onClick={() => setClosingReport(null)}>
          <div className="branch-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="branch-modal-header">
              <h2>סגור דיווח</h2>
              <button className="modal-close-btn" onClick={() => setClosingReport(null)} title="סגור">
                <FaTimesIcon />
              </button>
            </div>
            <div className="branch-modal-body">
              <div className="form-group">
                <label>סיבה לסגירה:</label>
                <textarea
                  value={closeReason}
                  onChange={(e) => setCloseReason(e.target.value)}
                  placeholder="פרט את הסיבה לסגירת הדיווח"
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
                  required
                />
              </div>
              <div className="form-actions">
                <button className="btn" onClick={handleCloseReport}>
                  סגור דיווח
                </button>
                <button className="btn btn-secondary" onClick={() => { setClosingReport(null); setCloseReason(''); }}>
                  ביטול
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Branch Edit Modal from Reports */}
      {editingBranchId && branches && (
        <div className="branch-modal-overlay" onClick={() => setEditingBranchId(null)}>
          <div className="branch-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="branch-modal-header">
              <h2>עריכת סניף</h2>
              <button 
                className="modal-close-btn"
                onClick={() => setEditingBranchId(null)}
                title="סגור"
              >
                <FaTimesIcon />
              </button>
            </div>
            <div className="branch-modal-body">
              <BranchForm
                branch={branches.find(b => b.id === editingBranchId)}
                onSave={async (data) => {
                  try {
                    const { error } = await supabase
                      .from('branches')
                      .update(data)
                      .eq('id', editingBranchId);
                    if (error) throw error;
                    onMessage('הסניף עודכן בהצלחה', true);
                    setEditingBranchId(null);
                    onUpdate();
                  } catch (err) {
                    onMessage('שגיאה בעדכון הסניף');
                  }
                }}
                onCancel={() => setEditingBranchId(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const BulkHoursEditTab = ({ branches, onUpdate, onMessage }) => {
  const [activePeriod, setActivePeriod] = useState('summer'); // 'summer' or 'winter'
  const [editedBranches, setEditedBranches] = useState({});
  const [saving, setSaving] = useState(false);

  // Initialize edited branches with existing hours
  useEffect(() => {
    const initial = {};
    branches.forEach(branch => {
      let hours = branch.hours || {};
      if (typeof hours === 'string') {
        try {
          hours = JSON.parse(hours);
        } catch (e) {
          hours = {};
        }
      }
      
      const defaultHours = {
        summer: {
          sun: { open: '', close: '', openSaturday: false },
          mon: { open: '', close: '' },
          tue: { open: '', close: '' },
          wed: { open: '', close: '' },
          thu: { open: '', close: '' },
          fri: { open: '', close: '' },
          sat: { open: '', close: '', openSaturday: false }
        },
        winter: {
          sun: { open: '', close: '', openSaturday: false },
          mon: { open: '', close: '' },
          tue: { open: '', close: '' },
          wed: { open: '', close: '' },
          thu: { open: '', close: '' },
          fri: { open: '', close: '' },
          sat: { open: '', close: '', openSaturday: false }
        }
      };

      initial[branch.id] = {
        ...defaultHours,
        ...hours
      };
    });
    setEditedBranches(initial);
  }, [branches]);

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

  const handleHourChange = (branchId, day, field, value) => {
    setEditedBranches(prev => ({
      ...prev,
      [branchId]: {
        ...prev[branchId],
        [activePeriod]: {
          ...prev[branchId][activePeriod],
          [day]: {
            ...prev[branchId][activePeriod][day],
            [field]: value
          }
        }
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updates = [];

      for (const branchId in editedBranches) {
        const branch = branches.find(b => b.id === branchId);
        if (!branch) continue;

        // Merge with existing hours to preserve the other period
        let existingHours = branch.hours || {};
        if (typeof existingHours === 'string') {
          try {
            existingHours = JSON.parse(existingHours);
          } catch (e) {
            existingHours = {};
          }
        }

        const updatedHours = {
          ...existingHours,
          [activePeriod]: editedBranches[branchId][activePeriod]
        };

        updates.push(
          supabase
            .from('branches')
            .update({ hours: updatedHours })
            .eq('id', branchId)
        );
      }

      await Promise.all(updates);
      onMessage(`עודכנו שעות עבור ${branches.length} סניפים בהצלחה`, true);
      onUpdate();
    } catch (err) {
      console.error('Error saving hours:', err);
      onMessage('שגיאה בשמירת השעות');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="tab-content-wrapper">
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontFamily: 'Almoni, sans-serif' }}>עריכת שעות המונית</h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'nowrap' }}>
          <button
            className={`btn ${activePeriod === 'summer' ? '' : 'btn-secondary'}`}
            onClick={() => setActivePeriod('summer')}
            style={{
              background: activePeriod === 'summer' ? '#009245' : '#f8f9fa',
              color: activePeriod === 'summer' ? 'white' : '#666',
              border: '1px solid #e0e0e0',
              padding: '12px 28px',
              borderRadius: '8px',
              fontWeight: 600,
              fontFamily: 'Almoni, sans-serif',
              whiteSpace: 'nowrap',
              minWidth: '140px'
            }}
          >
            ☀️ שעון קיץ
          </button>
          <button
            className={`btn ${activePeriod === 'winter' ? '' : 'btn-secondary'}`}
            onClick={() => setActivePeriod('winter')}
            style={{
              background: activePeriod === 'winter' ? '#009245' : '#f8f9fa',
              color: activePeriod === 'winter' ? 'white' : '#666',
              border: '1px solid #e0e0e0',
              padding: '12px 28px',
              borderRadius: '8px',
              fontWeight: 600,
              fontFamily: 'Almoni, sans-serif',
              whiteSpace: 'nowrap',
              minWidth: '140px'
            }}
          >
            ❄️ שעון חורף
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button 
          className="btn" 
          onClick={handleSave} 
          disabled={saving}
          style={{ padding: '12px 24px', fontSize: '16px', fontWeight: 600 }}
        >
          {saving ? 'שומר...' : 'שמור כל השינויים'}
        </button>
      </div>

      <div className="item-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 300px)' }}>
          <table className="bulk-hours-table" style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Almoni, sans-serif', minWidth: '1050px' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#f8f9fa', zIndex: 10 }}>
              <tr>
                <th style={{ padding: '8px', textAlign: 'right', fontWeight: 600, background: '#f8f9fa', borderBottom: '2px solid #e0e0e0', position: 'sticky', right: 0, background: '#f8f9fa', zIndex: 11, minWidth: '130px', fontSize: '14px' }}>
                  שם הסניף
                </th>
                <th style={{ padding: '8px', textAlign: 'center', fontWeight: 600, background: '#f8f9fa', borderBottom: '2px solid #e0e0e0', position: 'sticky', right: '130px', background: '#f8f9fa', zIndex: 11, minWidth: '60px', fontSize: '14px' }}>
                  מספר
                </th>
                {days.map(day => (
                  <th key={day} style={{ padding: '12px', textAlign: 'center', fontWeight: 600, background: '#f8f9fa', borderBottom: '2px solid #e0e0e0', minWidth: day === 'sat' ? '150px' : '180px' }}>
                    {dayNames[day]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {branches.map((branch, index) => {
                const isEven = index % 2 === 0;
                const rowBg = isEven ? '#e8f5e9' : 'white';
                return (
                <tr key={branch.id} style={{ background: rowBg }}>
                  <td style={{ padding: '8px', background: rowBg, borderBottom: '1px solid #f0f0f0', position: 'sticky', right: 0, zIndex: 9, fontWeight: 600, fontSize: '14px' }}>
                    {branch.name}
                  </td>
                  <td style={{ padding: '8px', background: rowBg, borderBottom: '1px solid #f0f0f0', position: 'sticky', right: '130px', zIndex: 9, textAlign: 'center', fontWeight: 600, color: '#009245', fontSize: '14px' }}>
                    {branch.branch_number || '-'}
                  </td>
                  {days.map(day => (
                    <td key={day} style={{ padding: '8px', borderBottom: '1px solid #f0f0f0', background: rowBg }}>
                      {day === 'sat' ? (
                        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={editedBranches[branch.id]?.[activePeriod]?.[day]?.openSaturday || false}
                            onChange={(e) => handleHourChange(branch.id, day, 'openSaturday', e.target.checked)}
                            style={{ width: '18px', height: '18px', accentColor: '#009245', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '13px' }}>פתוח</span>
                        </label>
                      ) : (
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', justifyContent: 'center' }}>
                          <input
                            type="time"
                            value={editedBranches[branch.id]?.[activePeriod]?.[day]?.open || ''}
                            onChange={(e) => handleHourChange(branch.id, day, 'open', e.target.value)}
                            step="1800"
                            style={{
                              width: '75px',
                              padding: '6px',
                              border: '1px solid #e0e0e0',
                              borderRadius: '4px',
                              fontSize: '13px',
                              fontFamily: 'Almoni, sans-serif'
                            }}
                          />
                          <span style={{ fontSize: '14px', color: '#999' }}>—</span>
                          <input
                            type="time"
                            value={editedBranches[branch.id]?.[activePeriod]?.[day]?.close || ''}
                            onChange={(e) => handleHourChange(branch.id, day, 'close', e.target.value)}
                            step="1800"
                            style={{
                              width: '75px',
                              padding: '6px',
                              border: '1px solid #e0e0e0',
                              borderRadius: '4px',
                              fontSize: '13px',
                              fontFamily: 'Almoni, sans-serif'
                            }}
                          />
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <button 
          className="btn" 
          onClick={handleSave} 
          disabled={saving}
          style={{ padding: '12px 24px', fontSize: '16px', fontWeight: 600 }}
        >
          {saving ? 'שומר...' : 'שמור כל השינויים'}
        </button>
      </div>
    </div>
  );
};

const StatisticsTab = ({ onMessage }) => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      
      // Fetch all navigation clicks
      const { data: clicks, error } = await supabase
        .from('navigation_clicks')
        .select('*')
        .order('clicked_at', { ascending: false });

      if (error) throw error;

      // Calculate statistics
      const totalClicks = clicks.length;
      
      // Group by branch
      const branchStats = {};
      clicks.forEach(click => {
        const key = click.branch_id || click.branch_name;
        if (!branchStats[key]) {
          branchStats[key] = {
            branch_id: click.branch_id,
            branch_name: click.branch_name,
            count: 0
          };
        }
        branchStats[key].count++;
      });

      // Convert to array and sort
      const branchStatsArray = Object.values(branchStats).sort((a, b) => b.count - a.count);
      
      // Find most and least clicked
      const mostClicked = branchStatsArray.length > 0 ? branchStatsArray[0] : null;
      const leastClicked = branchStatsArray.length > 0 ? branchStatsArray[branchStatsArray.length - 1] : null;

      setStatistics({
        totalClicks,
        branchStats: branchStatsArray,
        mostClicked,
        leastClicked
      });
    } catch (err) {
      console.error('Error fetching statistics:', err);
      onMessage('שגיאה בטעינת הסטטיסטיקות');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '20px' }}>טוען סטטיסטיקות...</div>;
  }

  if (!statistics) {
    return <div style={{ textAlign: 'center', padding: '20px' }}>אין נתונים להצגה</div>;
  }

  return (
    <div className="tab-content-wrapper">
      <h2 style={{ marginBottom: '24px', fontFamily: 'Almoni, sans-serif' }}>סטטיסטיקות ניווט Waze</h2>
      
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {/* Total Clicks */}
        <div className="item-card" style={{ textAlign: 'center', padding: '24px' }}>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#009245', marginBottom: '8px' }}>
            {statistics.totalClicks}
          </div>
          <div style={{ fontSize: '16px', color: '#666', fontFamily: 'Almoni, sans-serif' }}>
            סה"כ לחיצות ניווט
          </div>
        </div>

        {/* Most Clicked */}
        {statistics.mostClicked && (
          <div className="item-card" style={{ padding: '24px' }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px', fontFamily: 'Almoni, sans-serif' }}>
              הסניף הפופולרי ביותר
            </div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '4px', fontFamily: 'Almoni, sans-serif' }}>
              {statistics.mostClicked.branch_name}
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#009245', fontFamily: 'Almoni, sans-serif' }}>
              {statistics.mostClicked.count} לחיצות
            </div>
          </div>
        )}

        {/* Least Clicked */}
        {statistics.leastClicked && statistics.leastClicked.branch_name !== statistics.mostClicked?.branch_name && (
          <div className="item-card" style={{ padding: '24px' }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px', fontFamily: 'Almoni, sans-serif' }}>
              הסניף הכי פחות פופולרי
            </div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '4px', fontFamily: 'Almoni, sans-serif' }}>
              {statistics.leastClicked.branch_name}
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e74c3c', fontFamily: 'Almoni, sans-serif' }}>
              {statistics.leastClicked.count} לחיצות
            </div>
          </div>
        )}
      </div>

      {/* Branch Statistics Table */}
      <div className="item-card">
        <h3 style={{ marginBottom: '20px', fontFamily: 'Almoni, sans-serif' }}>לחיצות לכל סניף</h3>
        {statistics.branchStats.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            אין נתונים להצגה
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Almoni, sans-serif' }}>
              <thead>
                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e0e0e0' }}>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#2c3e50' }}>
                    שם הסניף
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#2c3e50' }}>
                    מספר לחיצות
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#2c3e50' }}>
                    אחוז מהסה"כ
                  </th>
                </tr>
              </thead>
              <tbody>
                {statistics.branchStats.map((stat, index) => {
                  const percentage = ((stat.count / statistics.totalClicks) * 100).toFixed(1);
                  return (
                    <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px', color: '#2c3e50' }}>
                        {stat.branch_name}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#009245' }}>
                        {stat.count}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#666' }}>
                        {percentage}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdmin;
