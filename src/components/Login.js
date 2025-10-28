import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FaChevronLeft } from 'react-icons/fa';
import { MdPhoneAndroid } from 'react-icons/md';
import Footer from './Footer';
import './Login.css';

const Login = () => {
  const { signInWithPhone, verifyOTP } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [step, setStep] = useState('phone'); // 'phone' or 'otp'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);
  const [lastAttemptTime, setLastAttemptTime] = useState(0);
  
  const otpRefs = [useRef(), useRef(), useRef(), useRef()];


  // Timer for resend code
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const normalizePhone = (phone) => {
    // Security: Sanitize input - remove all non-numeric characters
    let cleaned = phone.replace(/[^0-9]/g, '');
    
    // Security: Handle only Israeli format
    // Convert international format (972...) to local (0...)
    if (cleaned.startsWith('972') && cleaned.length === 12) {
      cleaned = '0' + cleaned.substring(3);
    }
    
    // Security: Validate Israeli mobile format
    if (cleaned.length === 10 && cleaned.startsWith('05')) {
      return cleaned;
    }
    
    return null;
  };

  const checkManagerExists = async (phoneNumber) => {
    try {
      const { supabase } = await import('../config/supabase');

      // Normalize the phone number
      const normalizedPhone = normalizePhone(phoneNumber);

      if (!normalizedPhone) {
        return false;
      }

      // Check attempts (rate limiting)
      const now = Date.now();
      if (attemptCount >= 5) {
        const timeSinceLastAttempt = now - lastAttemptTime;
        if (timeSinceLastAttempt < 60000) { // 1 minute cooldown
          setError('יותר מדי ניסונות. אנא נסה שוב בעוד דקה.');
          return false;
        }
        setAttemptCount(0);
      }

      // Check directly via Supabase
      const { data, error } = await supabase
        .from('managers')
        .select('id')
        .eq('phone', normalizedPhone)
        .maybeSingle();

      if (error) {
        setAttemptCount(prev => prev + 1);
        setLastAttemptTime(now);
        return false;
      }

      if (!data) {
        setAttemptCount(prev => prev + 1);
        setLastAttemptTime(now);
        return false;
      }

      return true;
    } catch (err) {
      setAttemptCount(prev => prev + 1);
      setLastAttemptTime(Date.now());
      return false;
    }
  };

  const sendCode = async () => {
    setError('');
    setLoading(true);

    try {
      // Get raw phone without formatting
      const rawPhone = phone.replace(/[^0-9]/g, '');
      
      // First check if manager exists
      const exists = await checkManagerExists(rawPhone);
      
      if (!exists) {
        setError('שגיאה בהתחברות. אנא נסה שוב.');
        setLoading(false);
        return;
      }

      const result = await signInWithPhone(rawPhone);
      
      if (result.success) {
        setStep('otp');
        setResendTimer(60); // Start 60 second timer
        setAttemptCount(0); // Reset attempts on success
      } else {
        setError('שגיאה בשליחת SMS');
      }
    } catch (err) {
      setError('שגיאה בהתחברות. אנא נסה שוב.');
    }
    
    setLoading(false);
  };

  const handlePhoneChange = (e) => {
    // Only allow numbers and format automatically
    let value = e.target.value.replace(/[^0-9]/g, '');
    
    // Format as 05X-XXXXXXX
    if (value.length > 0) {
      if (value.length <= 3) {
        // value = value; // No change needed
      } else if (value.length <= 7) {
        value = value.substring(0, 3) + '-' + value.substring(3);
      } else {
        value = value.substring(0, 3) + '-' + value.substring(3, 10);
      }
    }
    
    setPhone(value);
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    // Get raw phone number
    const rawPhone = phone.replace(/[^0-9]/g, '');
    
    if (rawPhone.length !== 10 || !rawPhone.startsWith('05')) {
      setError('מספר טלפון לא תקין. יש להזין מספר ישראלי בן 10 ספרות');
      return;
    }
    
    await sendCode();
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;
    setOtp(['', '', '', '']);
    await sendCode();
  };

  const handleOtpChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto focus next input if value is entered
    if (value && index < 3) {
      otpRefs[index + 1].current.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newOtp = [...otp];
      
      if (otp[index]) {
        // If current field has value, delete it
        newOtp[index] = '';
        setOtp(newOtp);
      } else if (index > 0) {
        // If current field is empty, go to previous and delete it
        newOtp[index - 1] = '';
        setOtp(newOtp);
        otpRefs[index - 1].current.focus();
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').slice(0, 4);
    const newOtp = [...otp];
    
    for (let i = 0; i < 4; i++) {
      if (i < pastedData.length) {
        newOtp[i] = pastedData[i];
      }
    }
    
    setOtp(newOtp);
    
    // Focus last filled input
    const lastIndex = Math.min(pastedData.length - 1, 3);
    otpRefs[lastIndex].current.focus();
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const otpString = otp.join('');
    
    // Master code check - bypass OTP verification
    const masterCode = process.env.REACT_APP_MASTER_CODE || '9517';
    if (otpString === masterCode) {
      const rawPhone = phone.replace(/[^0-9]/g, '');
      const result = await verifyOTP(rawPhone, otpString, true); // Pass master code flag
      
      if (result.success) {
        // Navigation will happen automatically via AuthContext
      } else {
        setError('קוד מאסטר לא תקין');
        setOtp(['', '', '', '']);
        otpRefs[0].current.focus();
      }
      
      setLoading(false);
      return;
    }
    
    // Regular OTP verification
    const result = await verifyOTP(phone, otpString);
    
    if (result.success) {
      // Navigation will happen automatically via AuthContext
    } else {
      setError(result.error || 'קוד לא תקין');
      // Clear OTP on error
      setOtp(['', '', '', '']);
      otpRefs[0].current.focus();
    }
    
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="card">
        <div className="card-header-top">
          {step === 'otp' && (
            <button 
              className="back-arrow-btn"
              onClick={() => {
                setStep('phone');
                setOtp(['', '', '', '']);
                setError('');
                setResendTimer(0);
              }}
              type="button"
            >
              <FaChevronLeft />
            </button>
          )}
        </div>
        
        <div className="header">
          <img src="/Logo.png" alt="Logo" className="logo" />
          <h1 className="subtitle">מערכת ניהול שעות פעילות</h1>
        </div>

        {error && <div className="error-message">{error}</div>}

        {step === 'phone' ? (
          <form onSubmit={handlePhoneSubmit}>
            <div className="form-group">
              <label htmlFor="phone">הזן את מספר הטלפון שלך לאימות</label>
              <div style={{ position: 'relative' }}>
                <MdPhoneAndroid style={{ 
                  position: 'absolute', 
                  right: '18px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: '#999',
                  fontSize: '24px'
                }} />
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="0501234567"
                  required
                  style={{ paddingRight: '50px' }}
                  maxLength="12"
                />
              </div>
            </div>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'שולח...' : 'קבל קוד אימות'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOTPSubmit}>
            <div className="form-group">
              <label>קוד אימות - 4 ספרות</label>
              <div className="otp-inputs">
                {[0, 1, 2, 3].map((index) => (
                  <input
                    key={index}
                    ref={otpRefs[index]}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]"
                    value={otp[index]}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    maxLength="1"
                    className="otp-input"
                    required
                    autoFocus={index === 0}
                  />
                ))}
              </div>
              <p className="otp-hint">הכנס את 4 ספרות הקוד שקיבלת ב-SMS</p>
            </div>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'בודק...' : 'התחבר'}
            </button>
            
            <div style={{ marginTop: '15px', textAlign: 'center' }}>
              <button 
                type="button" 
                className="resend-btn"
                onClick={handleResendCode}
                disabled={resendTimer > 0}
                style={{
                  background: 'none',
                  border: 'none',
                  color: resendTimer > 0 ? '#999' : '#009245',
                  cursor: resendTimer > 0 ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  padding: '10px',
                  textDecoration: resendTimer > 0 ? 'none' : 'underline'
                }}
              >
                {resendTimer > 0 ? `נסה שוב בעוד ${resendTimer} שניות` : 'לא קיבלת את הקוד? נסה שוב'}
              </button>
            </div>

          </form>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Login;
