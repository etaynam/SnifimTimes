import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../config/supabase';
import { FaMapMarkerAlt, FaPhone, FaClock, FaArrowRight, FaBuilding, FaTimes } from 'react-icons/fa';
import Header from './Header';
import WazeIcon from '../images/waze-icon.png';
import './BranchDetails.css';

const BranchDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [displayPeriod, setDisplayPeriod] = useState('auto');
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    fetchBranch();
    fetchDisplayPeriod();

    // Subscribe to app_settings changes for display_period
    const settingsChannel = supabase
      .channel('settings-changes-details')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'app_settings',
          filter: 'setting_key=eq.display_period'
        },
        (payload) => {
          console.log('Display period setting updated:', payload);
          fetchDisplayPeriod();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(settingsChannel);
    };
  }, [slug]);

  const fetchDisplayPeriod = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'display_period')
        .maybeSingle();

      if (error) {
        console.error('Error fetching display period:', error);
        return;
      }

      if (data && data.setting_value) {
        setDisplayPeriod(data.setting_value);
      }
    } catch (err) {
      console.error('Error in fetchDisplayPeriod:', err);
    }
  };

  const fetchBranch = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to find branch - first by serial_number (most common), then by ID, then by name
      let data = null;
      let error = null;

      // First, try by serial_number (most common case)
      const { data: dataBySerial, error: errorBySerial } = await supabase
        .from('branches')
        .select('*')
        .eq('serial_number', slug)
        .maybeSingle();

      if (dataBySerial && !errorBySerial) {
        data = dataBySerial;
      } else if (errorBySerial) {
        error = errorBySerial;
      }

      // If not found by serial_number, try by ID (UUID)
      if (!data) {
        const { data: dataById, error: errorById } = await supabase
          .from('branches')
          .select('*')
          .eq('id', slug)
          .maybeSingle();

        if (dataById && !errorById) {
          data = dataById;
        } else if (errorById && !error) {
          error = errorById;
        }
      }

      // If still not found, try by name
      if (!data) {
        try {
          const decodedSlug = decodeURIComponent(slug);
          const { data: dataByName, error: errorByName } = await supabase
            .from('branches')
            .select('*')
            .ilike('name', `%${decodedSlug}%`)
            .limit(1)
            .maybeSingle();

          if (dataByName && !errorByName) {
            data = dataByName;
          }
        } catch (decodeError) {
          console.warn('Could not decode slug:', decodeError);
        }
      }

      if (error && !data) {
        throw error;
      }

      if (!data) {
        setError('הסניף לא נמצא');
        console.log('Branch not found for slug:', slug);
      } else {
        setBranch(data);
      }
    } catch (err) {
      console.error('Error fetching branch:', err);
      setError('שגיאה בטעינת הסניף');
    } finally {
      setLoading(false);
    }
  };

  const formatHoursDisplay = (hours) => {
    if (!hours) return null;

    let hoursObj = hours;
    if (typeof hours === 'string') {
      try {
        hoursObj = JSON.parse(hours);
      } catch (e) {
        return null;
      }
    }

    // Determine which period to display
    let period = 'winter'; // Default to winter
    if (displayPeriod === 'winter') {
      period = 'winter';
    } else if (displayPeriod === 'summer') {
      period = 'summer';
    } else {
      // 'auto' - determine based on current month (same logic as BranchList)
      const now = new Date();
      const month = now.getMonth() + 1; // 1-12
      // Summer: April to September (4-9), Winter: October to March (10-12, 1-3)
      period = (month >= 4 && month <= 9) ? 'summer' : 'winter';
    }

    const periodHours = hoursObj[period];
    if (!periodHours) return null;

    const dayNames = {
      sun: 'ראשון',
      mon: 'שני',
      tue: 'שלישי',
      wed: 'רביעי',
      thu: 'חמישי',
      fri: 'שישי',
      sat: 'מוצ״ש'
    };

    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const todayIndex = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentDay = days[todayIndex];

    const formattedDays = days.map((day, index) => {
      const dayInfo = periodHours[day];
      if (!dayInfo) return null;

      const dayName = dayNames[day];
      let hours = '';
      let isOpen = false;
      let isToday = (day === currentDay);
      let minutesUntilClose = null;

      if (day === 'sat') {
        if (dayInfo.openSaturday) {
          const openTime = dayInfo.open || '';
          const closeTime = dayInfo.close || '';
          hours = `${openTime} – ${closeTime}`;
          
          if (isToday && openTime && closeTime) {
            const now = new Date();
            const [openHour, openMin] = openTime.split(':').map(Number);
            const [closeHour, closeMin] = closeTime.split(':').map(Number);
            const openDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), openHour, openMin);
            let closeDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), closeHour, closeMin);
            
            // If close time is earlier than open time, assume it closes the next day
            if (closeDate < openDate) {
              closeDate = new Date(closeDate.getTime() + 24 * 60 * 60 * 1000);
            }
            
            isOpen = now >= openDate && now < closeDate;
            if (isOpen) {
              const totalMinutes = Math.floor((closeDate - now) / (1000 * 60));
              const hoursCount = Math.floor(totalMinutes / 60);
              const minsCount = totalMinutes % 60;
              minutesUntilClose = { hours: hoursCount, minutes: minsCount, total: totalMinutes };
            }
          }
        } else {
          hours = 'סגור';
        }
      } else {
        const openTime = dayInfo.open || '';
        const closeTime = dayInfo.close || '';
        
        if (openTime && closeTime) {
          hours = `${openTime} – ${closeTime}`;
          
          if (isToday) {
            const now = new Date();
            const [openHour, openMin] = openTime.split(':').map(Number);
            const [closeHour, closeMin] = closeTime.split(':').map(Number);
            const openDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), openHour, openMin);
            let closeDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), closeHour, closeMin);
            
            // If close time is earlier than open time, assume it closes the next day
            if (closeDate < openDate) {
              closeDate = new Date(closeDate.getTime() + 24 * 60 * 60 * 1000);
            }
            
            isOpen = now >= openDate && now < closeDate;
            if (isOpen) {
              const totalMinutes = Math.floor((closeDate - now) / (1000 * 60));
              const hoursCount = Math.floor(totalMinutes / 60);
              const minsCount = totalMinutes % 60;
              minutesUntilClose = { hours: hoursCount, minutes: minsCount, total: totalMinutes };
            }
          }
        } else {
          hours = 'סגור';
        }
      }

      return {
        day: dayName,
        hours,
        isOpen,
        isToday,
        minutesUntilClose
      };
    }).filter(Boolean);

    return {
      days: formattedDays,
      period: period === 'summer' ? '☀️ שעון קיץ' : '❄️ שעון חורף'
    };
  };

  const trackNavigationClick = async () => {
    try {
      await supabase
        .from('navigation_clicks')
        .insert({
          branch_id: branch.id,
          branch_name: branch.name,
          user_agent: navigator.userAgent,
        });
    } catch (error) {
      console.error('Error tracking navigation click:', error);
    }
  };

  const handleWazeClick = (e) => {
    e.preventDefault();
    
    trackNavigationClick();
    
    const fullAddress = `${branch.address}${branch.city ? ', ' + branch.city : ''}`;
    const encodedAddress = encodeURIComponent(fullAddress);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = `waze://?q=${encodedAddress}&navigate=yes`;
    } else {
      window.open(`https://waze.com/ul?q=${encodedAddress}&navigate=yes`, '_blank');
    }
  };

  const generateSlug = (branch) => {
    if (!branch) return '';
    if (branch.serial_number) return branch.serial_number;
    // Create slug from name (basic Hebrew URL encoding)
    return encodeURIComponent(branch.name.toLowerCase().replace(/\s+/g, '-'));
  };

  const getBranchUrl = (branch) => {
    if (!branch) return '';
    return `/branch/${generateSlug(branch)}`;
  };

  const getFullAddress = (branch) => {
    if (!branch) return '';
    return `${branch.address || ''}${branch.city ? ', ' + branch.city : ''}`.trim();
  };

  if (loading) {
    return (
      <>
        <Helmet>
          <title>טוען... | מחסני השוק</title>
        </Helmet>
        <Header />
        <div className="branch-details-loading">
          <div className="spinner"></div>
          <p>טוען סניף...</p>
        </div>
      </>
    );
  }

  if (error || !branch) {
    return (
      <>
        <Helmet>
          <title>סניף לא נמצא | מחסני השוק</title>
        </Helmet>
        <Header />
        <div className="branch-details-error">
          <h2>הסניף לא נמצא</h2>
          <Link to="/" className="back-to-list-btn">
            <FaArrowRight /> חזרה לרשימת הסניפים
          </Link>
        </div>
      </>
    );
  }

  const hoursData = formatHoursDisplay(branch.hours);
  const fullAddress = getFullAddress(branch);
  const branchUrl = `${window.location.origin}${getBranchUrl(branch)}`;

  // Structured Data for LocalBusiness
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Store",
    "name": branch.name,
    "image": `${window.location.origin}/images/Logo.png`,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": branch.address || '',
      "addressLocality": branch.city || '',
      "addressCountry": "IL"
    },
    "telephone": branch.phone || '',
    "priceRange": "$$",
    "openingHoursSpecification": hoursData ? hoursData.days.map(dayInfo => {
      if (dayInfo.hours === 'סגור' || !dayInfo.hours.includes('–')) return null;
      const [open, close] = dayInfo.hours.split(' – ');
      if (!open || !close) return null;
      
      const dayMapping = {
        'ראשון': 'Sunday',
        'שני': 'Monday',
        'שלישי': 'Tuesday',
        'רביעי': 'Wednesday',
        'חמישי': 'Thursday',
        'שישי': 'Friday',
        'מוצ״ש': 'Saturday'
      };

      return {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": dayMapping[dayInfo.day] || dayInfo.day,
        "opens": `${open}:00`,
        "closes": `${close}:00`
      };
    }).filter(Boolean) : []
  };

  return (
    <>
      <Helmet>
        <title>{branch.name} | מחסני השוק</title>
        <meta name="description" content={`${branch.name} - ${fullAddress}. טלפון: ${branch.phone || ''}. ${hoursData ? hoursData.period : 'שעות פעילות'} - מחסני השוק`} />
        <link rel="canonical" href={branchUrl} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={branchUrl} />
        <meta property="og:title" content={`${branch.name} | מחסני השוק`} />
        <meta property="og:description" content={`${branch.name} - ${fullAddress}`} />
        <meta property="og:image" content={`${window.location.origin}/images/Logo.png`} />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={branchUrl} />
        <meta name="twitter:title" content={`${branch.name} | מחסני השוק`} />
        <meta name="twitter:description" content={`${branch.name} - ${fullAddress}`} />
        <meta name="twitter:image" content={`${window.location.origin}/images/Logo.png`} />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <Header />
      
      <div className="branch-details-container">
        <div className="branch-details-content">
          {/* Breadcrumb */}
          <nav className="breadcrumb">
            <Link to="/">סניפים</Link>
            <span className="breadcrumb-separator">›</span>
            <span className="breadcrumb-current">{branch.name}</span>
          </nav>

          {/* Branch Header */}
          <div className="branch-details-header">
            <div className="branch-header-main">
              <div className="branch-title-wrapper">
                <h1 className="branch-details-title">{branch.name}</h1>
                {fullAddress && (
                  <button
                    className="waze-btn-header"
                    onClick={handleWazeClick}
                    title="ניווט לסניף עם Waze"
                  >
                    <img src="/images/waze-icon.png" alt="Waze" className="waze-icon-header" />
                    <span>ניווט</span>
                  </button>
                )}
              </div>
              {branch.format && (
                <span className="branch-details-format">{branch.format}</span>
              )}
            </div>
            
            {branch.branch_message && (() => {
              const now = new Date();
              const startDate = branch.branch_message_start_date ? new Date(branch.branch_message_start_date) : null;
              const endDate = branch.branch_message_end_date ? new Date(branch.branch_message_end_date) : null;
              
              if (startDate && now < startDate) return null;
              if (endDate && now > endDate) return null;
              
              return (
                <div className="branch-details-message">
                  <span>{branch.branch_message}</span>
                </div>
              );
            })()}
          </div>

          {/* Branch Info Cards */}
          <div className="branch-info-grid">
            {/* Address Card */}
            {fullAddress && (
              <div className="branch-info-card address-card">
                <div className="info-card-icon">
                  <FaMapMarkerAlt />
                </div>
                <div className="info-card-content">
                  <h3>כתובת</h3>
                  <p>{branch.address}</p>
                </div>
              </div>
            )}

            {/* Phone Card */}
            {branch.phone && (
              <div className="branch-info-card phone-card">
                <div className="info-card-icon">
                  <FaPhone />
                </div>
                <div className="info-card-content">
                  <h3>טלפון</h3>
                  <a href={`tel:${branch.phone.replace(/\s+/g, '')}`} className="phone-link">
                    {branch.phone}
                  </a>
                </div>
              </div>
            )}

            {/* City Card */}
            {branch.city && (
              <div className="branch-info-card city-card">
                <div className="info-card-icon">
                  <FaBuilding />
                </div>
                <div className="info-card-content">
                  <h3>עיר / יישוב</h3>
                  <p>{branch.city}</p>
                </div>
              </div>
            )}
          </div>

          {/* Hours Section */}
          {hoursData && hoursData.days.length > 0 && (
            <div className="branch-hours-section">
              <div className="hours-section-header">
                <FaClock className="attention-icon" />
                <h2>שעות פעילות</h2>
                <span className="period-badge">{hoursData.period}</span>
              </div>
              
              <div className="hours-list-two-columns">
                {hoursData.days.map((dayInfo, idx) => (
                  <div 
                    key={idx} 
                    className={`hours-list-item ${dayInfo.isToday ? 'today' : ''} ${dayInfo.isOpen ? 'open' : ''}`}
                  >
                    <span className="hours-day-name">{dayInfo.day}:</span>
                    <div className="hours-time-wrapper">
                      <span className="hours-time">{dayInfo.hours}</span>
                      {dayInfo.isToday && (
                        <div className="hours-status">
                          <span className={`status-indicator ${dayInfo.isOpen ? 'open' : 'closed'}`}>
                            {dayInfo.isOpen ? 'פתוח' : 'סגור'}
                          </span>
                          {dayInfo.isOpen && dayInfo.minutesUntilClose !== null && dayInfo.minutesUntilClose.total > 0 && (
                            <span className="closing-soon-badge">
                              נסגר בעוד{' '}
                              {dayInfo.minutesUntilClose.hours > 0 && `${dayInfo.minutesUntilClose.hours} שעות `}
                              {dayInfo.minutesUntilClose.minutes > 0 && `${dayInfo.minutesUntilClose.minutes} דק'`}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="branch-details-actions">
            <button
              className="report-error-btn"
              onClick={() => setShowReportModal(true)}
            >
              מצאת טעות בשעות שלנו? דווחו לנו.
            </button>
          </div>

          {/* Back to List */}
          <div className="back-to-list-section">
            <Link to="/" className="back-link">
              <FaArrowRight /> חזרה לרשימת הסניפים
            </Link>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && branch && (
        <ReportModal
          branch={branch}
          onClose={() => {
            setShowReportModal(false);
          }}
        />
      )}
    </>
  );
};

// Report Modal Component
const ReportModal = ({ branch, onClose }) => {
  const [selectedDays, setSelectedDays] = useState([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  
  const dayNames = {
    sun: 'ראשון',
    mon: 'שני',
    tue: 'שלישי',
    wed: 'רביעי',
    thu: 'חמישי',
    fri: 'שישי',
    sat: 'שבת'
  };
  
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const MAX_MESSAGE_LENGTH = 200;

  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedDays.length === 0) {
      alert('אנא בחר לפחות יום אחד');
      return;
    }
    
    if (!message.trim()) {
      alert('אנא הזן תיאור של הטעות');
      return;
    }

    setSending(true);
    
    try {
      const { error } = await supabase
        .from('branch_reports')
        .insert({
          branch_id: branch.id,
          branch_name: branch.name,
          days: selectedDays,
          message: message.trim()
        });

      if (error) throw error;
      
      setShowThankYou(true);
    } catch (err) {
      console.error('Error submitting report:', err);
      alert('שגיאה בשליחת הדיווח. נסה שוב מאוחר יותר.');
    } finally {
      setSending(false);
    }
  };

  if (showThankYou) {
    return (
      <div className="report-modal-overlay" onClick={onClose}>
        <div className="report-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="report-thank-you">
            <div className="thank-you-icon">✓</div>
            <h2>תודה על הדיווח!</h2>
            <p>הדיווח שלך התקבל וניבדק בקרוב.</p>
            <button className="btn" onClick={onClose} style={{ marginTop: '20px' }}>
              סגור
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="report-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="report-modal-header">
          <h2>דיווח על טעות בשעות</h2>
          <button className="modal-close-btn" onClick={onClose} title="סגור">
            <FaTimes />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="report-form">
          <div className="report-branch-name">
            <strong>סניף:</strong> {branch.name}
          </div>

          <div className="report-days-selection">
            <label className="report-label">בחר ימים בהם הטעות קיימת:</label>
            <div className="days-checkboxes">
              {days.map(day => (
                <label key={day} className="day-checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedDays.includes(day)}
                    onChange={() => toggleDay(day)}
                    style={{ width: '20px', height: '20px', accentColor: '#009245', cursor: 'pointer', marginLeft: '8px' }}
                  />
                  <span>{dayNames[day]}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="report-message-section">
            <label className="report-label">
              תאר את הטעות:
              <span className="char-count">({message.length}/{MAX_MESSAGE_LENGTH})</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => {
                if (e.target.value.length <= MAX_MESSAGE_LENGTH) {
                  setMessage(e.target.value);
                }
              }}
              placeholder="לדוגמה: שעות הפתיחה המוצגות שגויות, הסניף פתוח בשעות אחרות..."
              rows={4}
              className="report-textarea"
              required
            />
          </div>

          <div className="report-form-actions">
            <button type="submit" className="btn" disabled={sending}>
              {sending ? 'שולח...' : 'שלח דיווח'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={sending}>
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BranchDetails;
