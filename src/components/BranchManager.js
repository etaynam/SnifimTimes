import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';
import { FaClock, FaSignOutAlt } from 'react-icons/fa';
import Footer from './Footer';
import './BranchManager.css';

const BranchManager = () => {
  const { user, signOut } = useAuth();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [managerName, setManagerName] = useState('');

  useEffect(() => {
    fetchBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      setError('');

      // Clean phone number (remove dashes and non-numeric chars)
      const cleanPhone = user.phone ? user.phone.replace(/[^0-9]/g, '') : '';
      
      // Security: Phone validation
      if (!cleanPhone || cleanPhone.length !== 10) {
        setError('Invalid phone format');
        return;
      }

      // First, find the manager by phone
      const { data: manager, error: managerError } = await supabase
        .from('managers')
        .select('id, name')
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (managerError) throw managerError;
      if (!manager) {
        setError('לא נמצא מנהל למספר טלפון זה');
        return;
      }

      // Save manager name for display
      setManagerName(manager.name || '');

      // Get manager's assigned branches
      // Security: Only get branches assigned to this specific manager
      const { data: branchData, error: branchError } = await supabase
        .from('manager_branches')
        .select('branch_id, branches (*)')
        .eq('manager_id', manager.id);

      if (branchError) throw branchError;

      const branchList = (branchData || []).map(mb => ({
        id: mb.branch_id,
        ...mb.branches
      }));

      setBranches(branchList);
    } catch (err) {
      // Security: Don't expose error details
      setError('שגיאה בטעינת הסניפים');
    } finally {
      setLoading(false);
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'בוקר טוב';
    if (hour < 15) return 'צהריים טובים';
    if (hour < 18) return 'אחר צהריים טובים';
    return 'ערב טוב';
  };

  const getInitial = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="App">
      <div className="container">
        <div className="card">
          {/* Sticky User Header */}
          <div className="user-header-sticky">
            <div className="user-info">
              <div className="user-avatar">
                {getInitial(managerName)}
              </div>
              <div className="user-details">
                <div className="greeting">{getGreeting()} {managerName ? managerName : ''}</div>
                <div className="user-phone">{user?.phone}</div>
              </div>
            </div>
            <button className="btn-icon-signout" onClick={signOut} title="התנתק">
              <FaSignOutAlt />
            </button>
          </div>

          <div className="header">
            <img src="/Logo.png" alt="Logo" className="logo" />
            <h1 className="subtitle">ניהול שעות פעילות</h1>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="branches-list">
            {branches.length === 0 ? (
              <p>לא הוקצו לך סניפים</p>
            ) : (
              branches.map(branch => (
                <BranchCard
                  key={branch.id}
                  branch={branch}
                  setError={setError}
                  setSuccess={setSuccess}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const BranchCard = ({ branch, setError, setSuccess }) => {
  const [activePeriod, setActivePeriod] = useState('summer'); // 'summer' or 'winter'
  const [hours, setHours] = useState({
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
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load existing hours if any
    if (branch.hours && typeof branch.hours === 'object') {
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
      
      setHours({
        summer: { ...defaultHours.summer, ...(branch.hours.summer || {}) },
        winter: { ...defaultHours.winter, ...(branch.hours.winter || {}) }
      });
    }
  }, [branch]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      setError('');
      setSuccess('');

      // Security: Validate and sanitize hours data
      const sanitizedHours = {
        summer: {},
        winter: {}
      };

      // Security: Validate hours format before sending
      const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      days.forEach(day => {
        ['summer', 'winter'].forEach(period => {
          if (!hours[period] || !hours[period][day]) {
            sanitizedHours[period][day] = { open: '', close: '', openSaturday: false };
          } else {
            // Security: Only allow time format (HH:MM)
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            const open = hours[period][day].open || '';
            const close = hours[period][day].close || '';
            
            sanitizedHours[period][day] = {
              open: timeRegex.test(open) ? open : '',
              close: timeRegex.test(close) ? close : '',
              openSaturday: day === 'sat' ? (hours[period][day].openSaturday || false) : undefined
            };
          }
        });
      });

      const { error: updateError } = await supabase
        .from('branches')
        .update({ hours: sanitizedHours })
        .eq('id', branch.id);

      if (updateError) throw updateError;

      // Trigger Make webhook with update details
      const webhookData = {
        event: 'branch_hours_updated',
        branch_id: branch.id,
        branch_name: branch.name,
        branch_number: branch.branch_number,
        serial_number: branch.serial_number,
        hours: sanitizedHours,
        updated_at: new Date().toISOString()
      };

      try {
        console.log('Triggering Make webhook with data:', webhookData);
        const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/trigger-make-webhook`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify(webhookData)
        });
        
        const result = await response.json();
        console.log('Make webhook response:', result);
        
        if (!response.ok) {
          console.error('Webhook response not ok:', result);
        }
      } catch (webhookError) {
        console.error('Error triggering Make webhook:', webhookError);
        // Don't fail the update if webhook fails
      }

      setSuccess('השעות עודכנו בהצלחה');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      // Security: Don't expose error details
      setError('שגיאה בעדכון השעות');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="branch-card-modern">
      <div className="branch-header">
        <h3>{branch.name}</h3>
        {branch.address && <p className="branch-address">{branch.address}</p>}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Period Toggle */}
        <div className="period-toggle">
          <button
            type="button"
            className={`period-btn ${activePeriod === 'summer' ? 'active' : ''}`}
            onClick={() => setActivePeriod('summer')}
          >
            ☀️ שעון קיץ
          </button>
          <button
            type="button"
            className={`period-btn ${activePeriod === 'winter' ? 'active' : ''}`}
            onClick={() => setActivePeriod('winter')}
          >
            ❄️ שעון חורף
          </button>
        </div>

        {/* Days Table */}
        <div className="hours-table">
          {days.map((day, index) => (
            <div key={day} className={`day-row ${day === 'sat' ? 'saturday-row' : ''}`}>
              <div className="day-name">
                <FaClock /> {dayNames[day]}
              </div>
              {day === 'sat' ? (
                // Saturday - just show checkbox
                <div className="saturday-toggle-full">
                  <label className="saturday-toggle">
                    <input
                      type="checkbox"
                      checked={hours[activePeriod][day].openSaturday}
                      onChange={(e) =>
                        handleTimeChange(activePeriod, day, 'openSaturday', e.target.checked)
                      }
                    />
                    <span>פתוח במוצ״ש</span>
                  </label>
                </div>
              ) : (
                // Regular days - show time inputs
                <div className="time-inputs">
                  <input
                    type="time"
                    value={hours[activePeriod][day].open || ''}
                    onChange={(e) => handleTimeChange(activePeriod, day, 'open', e.target.value)}
                    className="time-input"
                    step="1800"
                    min="06:00"
                    max="23:59"
                  />
                  <span className="separator">-</span>
                  <input
                    type="time"
                    value={hours[activePeriod][day].close || ''}
                    onChange={(e) => handleTimeChange(activePeriod, day, 'close', e.target.value)}
                    className="time-input"
                    step="1800"
                    min="06:00"
                    max="23:59"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <button type="submit" className="btn btn-sticky" disabled={loading}>
          {loading ? 'מעדכן...' : '💾 שמור שעות'}
        </button>
      </form>
      <Footer />
    </div>
  );
};

export default BranchManager;
