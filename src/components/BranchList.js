import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { FaMapMarkerAlt, FaBuilding, FaSearch, FaTimes, FaSun, FaPhone } from 'react-icons/fa';
import './BranchList.css';

const BranchList = () => {
  const [branches, setBranches] = useState([]);
  const [filteredBranches, setFilteredBranches] = useState([]);
  const [displayedBranches, setDisplayedBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('');
  const [filterOpenOnly, setFilterOpenOnly] = useState(false);
  const [cities, setCities] = useState([]);
  const [formats, setFormats] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [globalMessages, setGlobalMessages] = useState([]);
  const [displayPeriod, setDisplayPeriod] = useState('auto'); // 'auto', 'summer', or 'winter'
  
  const observerTarget = useRef(null);
  const ITEMS_PER_LOAD = 10;

  // Fetch all branches on mount and set up real-time subscription
  useEffect(() => {
    fetchBranches();
    fetchDisplayPeriod();

    // Subscribe to real-time updates for branches table
    const channel = supabase
      .channel('branches-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // listen to all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'branches'
        },
        (payload) => {
          console.log('Branch updated:', payload);
          // Refetch branches when changes occur
          fetchBranches();
        }
      )
      .subscribe();

    // Subscribe to app_settings changes for display_period
    const settingsChannel = supabase
      .channel('settings-changes')
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

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(settingsChannel);
    };
  }, []);

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

  const fetchBranches = async () => {
    try {
      setLoading(true);
      
      // Fetch branches - always get fresh data without cache
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .order('name');

      if (error) throw error;
      
             // Fetch active global messages that are within date range
             const now = new Date().toISOString();
             const { data: messages, error: messagesError } = await supabase
               .from('global_messages')
               .select('*')
               .eq('is_active', true)
               .order('created_at', { ascending: false });

             // Filter messages by date range
             const activeMessages = (messages || []).filter(msg => {
               const startDate = msg.start_date ? new Date(msg.start_date) : null;
               const endDate = msg.end_date ? new Date(msg.end_date) : null;
               const nowDate = new Date(now);
               
               // If start_date exists and we're before it, don't show
               if (startDate && nowDate < startDate) return false;
               
               // If end_date exists and we're after it, don't show
               if (endDate && nowDate > endDate) return false;
               
               return true;
             });

             if (messagesError) {
               console.error('Error fetching global messages:', messagesError);
             } else {
               setGlobalMessages(activeMessages);
             }

      // Debug: log hours structure for first few branches
      if (data && data.length > 0) {
        console.log('Sample hours structures:');
        data.slice(0, 3).forEach((branch, idx) => {
          console.log(`Branch ${idx + 1} (${branch.name}):`, branch.hours);
        });
      }

      setBranches(data || []);
      
      // Extract unique cities and formats
      const uniqueCities = [...new Set((data || []).map(b => b.city).filter(Boolean))].sort();
      const uniqueFormats = [...new Set((data || []).map(b => b.format).filter(Boolean))].sort();
      
      setCities(uniqueCities);
      setFormats(uniqueFormats);
    } catch (err) {
      console.error('Error fetching branches:', err);
    } finally {
      setLoading(false);
    }
  };

  // Check if branch is currently open - defined with useCallback to avoid re-creation
  const isBranchOpenNow = useCallback((branch) => {
    if (!branch.hours) return false;
    
    const now = new Date();
    const month = now.getMonth() + 1;
    const isSummer = month >= 4 && month <= 9;
    
    let hoursObj = branch.hours;
    if (typeof hoursObj === 'string') {
      try {
        hoursObj = JSON.parse(hoursObj);
      } catch {
        return false;
      }
    }
    
    const period = isSummer ? hoursObj.summer : hoursObj.winter;
    if (!period || typeof period !== 'object') return false;
    
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const todayIndex = now.getDay();
    const today = days[todayIndex];
    
    const dayHours = period[today];
    if (!dayHours) return false;
    
    if (today === 'sat' && dayHours.openSaturday === false) return false;
    
    const open = (dayHours.open || dayHours.start || '').trim();
    const close = (dayHours.close || dayHours.end || '').trim();
    
    if (!open || !close) return false;
    
    const parseTimeToMinutes = (timeStr) => {
      if (!timeStr) return 0;
      const [hours, minutes] = timeStr.split(':').map(Number);
      return (hours || 0) * 100 + (minutes || 0);
    };
    
    const currentTime = now.getHours() * 100 + now.getMinutes();
    const openTime = parseTimeToMinutes(open);
    const closeTime = parseTimeToMinutes(close);
    
    return currentTime >= openTime && currentTime <= closeTime;
  }, []);

  // Filter branches based on search, city, format, and open/closed status
  useEffect(() => {
    let filtered = [...branches];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(branch =>
        branch.name?.toLowerCase().includes(searchLower) ||
        branch.address?.toLowerCase().includes(searchLower) ||
        branch.city?.toLowerCase().includes(searchLower)
      );
    }

    // City filter
    if (selectedCity) {
      filtered = filtered.filter(branch => branch.city === selectedCity);
    }

    // Format filter
    if (selectedFormat) {
      filtered = filtered.filter(branch => branch.format === selectedFormat);
    }

    // Open/Closed filter
    if (filterOpenOnly) {
      filtered = filtered.filter(branch => isBranchOpenNow(branch));
    }

    setFilteredBranches(filtered);
    setDisplayedBranches(filtered.slice(0, ITEMS_PER_LOAD));
    setHasMore(filtered.length > ITEMS_PER_LOAD);
  }, [branches, searchTerm, selectedCity, selectedFormat, filterOpenOnly, isBranchOpenNow]);

  // Load more function for infinite scroll
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    const currentLength = displayedBranches.length;
    const nextBranches = filteredBranches.slice(currentLength, currentLength + ITEMS_PER_LOAD);
    
    setTimeout(() => {
      setDisplayedBranches(prev => [...prev, ...nextBranches]);
      setHasMore(currentLength + nextBranches.length < filteredBranches.length);
      setLoadingMore(false);
    }, 300);
  }, [loadingMore, hasMore, filteredBranches, displayedBranches]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, loadMore]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCity('');
    setSelectedFormat('');
    setFilterOpenOnly(false);
  };

  const getPeriodIcon = (isSummer) => {
    return isSummer ? '☀️' : '❄️';
  };

  const getPeriodName = (isSummer) => {
    return isSummer ? 'שעון קיץ' : 'שעון חורף';
  };

  const formatHoursDisplay = (hours) => {
    if (!hours) return null;
    
    // Handle if hours is a string (JSON from database)
    let hoursObj = hours;
    if (typeof hours === 'string') {
      try {
        hoursObj = JSON.parse(hours);
      } catch (e) {
        return null;
      }
    }
    
    if (typeof hoursObj !== 'object') return null;
    
    // Check if it's the new JSONB structure
    if (!hoursObj.summer && !hoursObj.winter) return null;
    
    // Determine which period to display based on setting
    const now = new Date();
    let isSummer;
    if (displayPeriod === 'summer') {
      isSummer = true;
    } else if (displayPeriod === 'winter') {
      isSummer = false;
    } else {
      // 'auto' - determine based on current month
      const month = now.getMonth() + 1; // 1-12
      isSummer = month >= 4 && month <= 9; // April to September
    }
    const period = isSummer ? hoursObj.summer : hoursObj.winter;
    
    if (!period || typeof period !== 'object') return null;
    
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const dayNames = {
      sun: 'ראשון',
      mon: 'שני',
      tue: 'שלישי',
      wed: 'רביעי',
      thu: 'חמישי',
      fri: 'שישי',
      sat: 'שבת'
    };
    
    // Helper function to parse time string to minutes for comparison
    const parseTimeToMinutes = (timeStr) => {
      if (!timeStr) return 0;
      const [hours, minutes] = timeStr.split(':').map(Number);
      return (hours || 0) * 100 + (minutes || 0);
    };
    
    const todayIndex = now.getDay(); // 0 = Sunday
    const todayDay = days[todayIndex];
    const currentTime = now.getHours() * 100 + now.getMinutes(); // HHMM format for comparison
    
    const hoursList = [];
    
    days.forEach(day => {
      const dayHours = period[day];
      if (dayHours && typeof dayHours === 'object') {
        // Get open/close times, handling both formats
        const open = (dayHours.open || dayHours.start || '').trim();
        const close = (dayHours.close || dayHours.end || '').trim();
        
        let displayText = '';
        let isToday = day === todayDay;
        let isOpen = false;
        let minutesUntilClose = null;
        
        // Helper function to convert HHMM format to minutes since midnight
        const timeToMinutes = (timeValue) => {
          const hours = Math.floor(timeValue / 100);
          const minutes = timeValue % 100;
          return hours * 60 + minutes;
        };
        
        // Handle Saturday specially
        if (day === 'sat') {
          if (dayHours.openSaturday === false) {
            displayText = 'סגור';
            if (isToday) {
              isOpen = false;
              minutesUntilClose = null; // Don't show closing time if closed
            }
          } else if (dayHours.openSaturday === true) {
            // Saturday is open
            if (open && close) {
              displayText = `${open} - ${close}`;
              if (isToday) {
                const openTime = parseTimeToMinutes(open);
                const closeTime = parseTimeToMinutes(close);
                isOpen = currentTime >= openTime && currentTime <= closeTime;
                
                if (isOpen) {
                  const currentMinutes = timeToMinutes(currentTime);
                  const closeMinutes = timeToMinutes(closeTime);
                  const minutesLeft = closeMinutes - currentMinutes;
                  
                  // Show message if less than 60 minutes remain AND branch is open
                  if (minutesLeft > 0 && minutesLeft <= 60) {
                    minutesUntilClose = minutesLeft;
                  } else {
                    minutesUntilClose = null;
                  }
                } else {
                  minutesUntilClose = null; // Don't show closing time if closed
                }
              }
            } else {
              // openSaturday is true but no hours defined - open after Shabbat
              displayText = 'פתוח כחצי שעה אחר צאת השבת';
              if (isToday) {
                isOpen = true; // Assume open if no specific hours
                minutesUntilClose = null;
              }
            }
          } else {
            // openSaturday not explicitly set - check if open/close exist
            if (open && close) {
              displayText = `${open} - ${close}`;
              if (isToday) {
                const openTime = parseTimeToMinutes(open);
                const closeTime = parseTimeToMinutes(close);
                isOpen = currentTime >= openTime && currentTime <= closeTime;
                
                if (isOpen) {
                  const currentMinutes = timeToMinutes(currentTime);
                  const closeMinutes = timeToMinutes(closeTime);
                  const minutesLeft = closeMinutes - currentMinutes;
                  
                  // Show message if less than 60 minutes remain AND branch is open
                  if (minutesLeft > 0 && minutesLeft <= 60) {
                    minutesUntilClose = minutesLeft;
                  } else {
                    minutesUntilClose = null;
                  }
                } else {
                  minutesUntilClose = null; // Don't show closing time if closed
                }
              }
            } else {
              displayText = 'סגור';
              if (isToday) {
                isOpen = false;
                minutesUntilClose = null; // Don't show closing time if closed
              }
            }
          }
        } else {
          // Regular days
          if (open && close) {
            displayText = `${open} - ${close}`;
            if (isToday) {
              const openTime = parseTimeToMinutes(open);
              const closeTime = parseTimeToMinutes(close);
              isOpen = currentTime >= openTime && currentTime <= closeTime;
              
              if (isOpen) {
                const currentMinutes = timeToMinutes(currentTime);
                const closeMinutes = timeToMinutes(closeTime);
                const minutesLeft = closeMinutes - currentMinutes;
                
                // Show message if less than 60 minutes remain AND branch is open
                if (minutesLeft > 0 && minutesLeft <= 60) {
                  minutesUntilClose = minutesLeft;
                } else {
                  minutesUntilClose = null;
                }
              } else {
                minutesUntilClose = null; // Don't show closing time if closed
              }
            }
          } else {
            displayText = 'סגור';
            if (isToday) {
              isOpen = false;
              minutesUntilClose = null; // Don't show closing time if closed
            }
          }
        }
        
        hoursList.push({
          day: dayNames[day],
          hours: displayText,
          isToday: isToday,
          isOpen: isOpen,
          minutesUntilClose: minutesUntilClose
        });
      }
    });
    
    return {
      period: isSummer,
      icon: getPeriodIcon(isSummer),
      periodName: getPeriodName(isSummer),
      days: hoursList
    };
  };

  if (loading) {
    return (
      <div className="branch-list-loading">
        <div className="spinner"></div>
        <p>טוען סניפים...</p>
      </div>
    );
  }

  return (
    <div className="branch-list-container">
            {/* Global Messages */}
            {globalMessages.length > 0 && (
              <div className="global-messages-container">
                {globalMessages.map((msg) => (
                  <div key={msg.id} className="global-message">
                    {msg.message}
                  </div>
                ))}
              </div>
            )}

            {/* Filters Section */}
            <div className="branch-list-filters">
              <div className="filters-row">
                <div className="search-container">
                  <div className="search-icon-wrapper">
                    <FaSearch className="search-icon" />
                    {!searchTerm && (
                      <span className="search-placeholder">חפש סניף</span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="clear-search">
                      <FaTimes />
                    </button>
                  )}
                </div>

                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="filter-select"
                >
                  <option value="">כל הערים</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>

                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="filter-select"
                >
                  <option value="">כל המותגים</option>
                  {formats.map(format => (
                    <option key={format} value={format}>{format}</option>
                  ))}
                </select>

                <div className="open-filter-switch">
                  <input
                    type="checkbox"
                    id="open-filter"
                    checked={filterOpenOnly}
                    onChange={(e) => setFilterOpenOnly(e.target.checked)}
                    className="switch-input"
                  />
                  <label htmlFor="open-filter" className="switch-label">
                    <div className="switch-icon-wrapper">
                      <FaSun className="switch-icon" />
                    </div>
                    <span className="switch-text">פתוח</span>
                  </label>
                </div>
              </div>

        {(searchTerm || selectedCity || selectedFormat || filterOpenOnly) && (
          <div className="reset-filters-row">
            <button onClick={resetFilters} className="reset-filters-btn">
              נקה סינונים
            </button>
          </div>
        )}

        <div className="results-count">
          מוצגים {displayedBranches.length} מתוך {filteredBranches.length} סניפים
        </div>
      </div>

      {/* Branches Grid */}
      {displayedBranches.length > 0 ? (
        <>
          <div className="branches-grid">
            {displayedBranches.map(branch => (
              <div key={branch.id} className="branch-card">
                <div className="branch-card-header">
                  <div className="branch-name-wrapper">
                    <h3 className="branch-name">{branch.name}</h3>
                    {branch.format && (
                      <span className="branch-format">{branch.format}</span>
                    )}
                  </div>
                        {branch.address && (
                          <div className="branch-address">
                            <FaMapMarkerAlt className="address-icon" />
                            <span>{branch.address}</span>
                          </div>
                        )}
                        {branch.phone && (
                          <div className="branch-phone">
                            <FaPhone className="phone-icon" />
                            <span>{branch.phone}</span>
                          </div>
                        )}
                </div>
                
                <div className="branch-card-body">
                  {branch.city && (
                    <div className="branch-info">
                      <span className="branch-city">{branch.city}</span>
                    </div>
                  )}
                  
                  {branch.hours && formatHoursDisplay(branch.hours) && (() => {
                    const hoursData = formatHoursDisplay(branch.hours);
                    return (
                      <div className="branch-hours-section">
                        <div className="branch-hours-header">
                          <span className="period-icon">{hoursData.icon}</span>
                          <span className="period-name">{hoursData.periodName}</span>
                        </div>
                        <div className="branch-hours-list">
                          {hoursData.days.map((dayInfo, idx) => (
                            <div 
                              key={idx} 
                              className={`branch-hour-item ${dayInfo.isToday ? 'today' : ''} ${dayInfo.isOpen ? 'open' : dayInfo.isToday ? 'closed' : ''}`}
                            >
                              <span className="day-name">{dayInfo.day}:</span>
                              <div className="hours-with-status">
                                <span className="day-hours">{dayInfo.hours}</span>
                                {dayInfo.isToday && (
                                  <div className="status-indicator">
                                    <span className={`status-dot ${dayInfo.isOpen ? 'open-dot' : 'closed-dot'}`}></span>
                                    <span className={`status-pill ${dayInfo.isOpen ? 'open-pill' : 'closed-pill'}`}>
                                      {dayInfo.isOpen ? 'פתוח' : 'סגור'}
                                    </span>
                                    {dayInfo.minutesUntilClose !== null && (
                                      <span className="closing-soon-text">
                                        נסגר בעוד {dayInfo.minutesUntilClose} דק'
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                        })()}
                        
                        {/* Branch-specific message - only show if within date range */}
                        {(() => {
                          if (!branch.branch_message) return null;
                          
                          const now = new Date();
                          const startDate = branch.branch_message_start_date ? new Date(branch.branch_message_start_date) : null;
                          const endDate = branch.branch_message_end_date ? new Date(branch.branch_message_end_date) : null;
                          
                          // Check if message should be shown based on dates
                          if (startDate && now < startDate) return null; // Not started yet
                          if (endDate && now > endDate) return null; // Already ended
                          
                          return (
                            <div className="branch-message">
                              <span className="branch-message-text">{branch.branch_message}</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </div>

          {/* Infinite Scroll Trigger */}
          <div ref={observerTarget} className="scroll-trigger">
            {loadingMore && (
              <div className="loading-more">
                <div className="spinner-small"></div>
                <p>טוען עוד סניפים...</p>
              </div>
            )}
            {!hasMore && displayedBranches.length > 0 && (
              <p className="end-message">הצגת את כל הסניפים</p>
            )}
          </div>
        </>
      ) : (
        <div className="no-results">
          <FaBuilding className="no-results-icon" />
          <p>לא נמצאו סניפים תואמים</p>
          {(searchTerm || selectedCity || selectedFormat) && (
            <button onClick={resetFilters} className="reset-filters-btn">
              נקה סינונים
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default BranchList;

