import React, { useState, useEffect } from 'react';
import { FaTimes, FaWhatsapp, FaTiktok, FaInstagram, FaFacebook } from 'react-icons/fa';
import Logo from '../images/Logo.png';
import './MobileMenu.css';

const MobileMenu = ({ isOpen, onClose }) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsClosing(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300); // זמן האנימציה
  };
  const menuItems = [
    { label: 'דף הבית', url: 'https://m-shuk.net', isHome: true },
    { label: 'אודות', url: 'https://m-shuk.net/about-about/' },
    { label: 'מבצעים', url: 'https://m-shuk.net/shuk-flyer/' },
    { label: 'מועדון שוק פינוק', url: '#' },
    { label: 'סניפים', url: '/', isActive: true },
    { label: 'גיפט קארד', url: 'https://m-shuk.net/giftcard/' },
    { label: 'כרטיס אשראי', url: 'https://m-shuk.net/wincard/' },
    { label: 'דרושים', url: 'https://m-shuk.net/jobs/' },
    { label: 'שירות לקוחות', url: 'https://m-shuk.net/shuk-service/' }
  ];

  const handleMenuClick = (url, isInternal, isHome) => {
    handleClose(); // סגירת התפריט לפני ניווט
    if (isInternal) {
      // אם זה קישור פנימי (סניפים), מעבירים לעמוד הראשי
      window.location.href = '/';
    } else if (isHome) {
      // דף הבית - מעבירים לאותו חלון
      window.location.href = url;
    } else {
      // קישור חיצוני - פותחים בטאב חדש
      window.open(url, '_blank');
    }
  };

  const handleWhatsAppClick = () => {
    // כאן יש להוסיף את הקישור לקבוצת הוואטסאפ
    window.open('https://m-shuk.net/#elementor-action%3Aaction%3Dpopup%3Aclose%26settings%3DeyJkb19ub3Rfc2hvd19hZ2FpbiI6IiJ9', '_blank');
  };

  if (!isOpen && !isClosing) return null;

  return (
    <>
      {/* Overlay - רקע שחור שקוף */}
      <div 
        className={`mobile-menu-overlay ${isClosing ? 'closing' : ''}`}
        onClick={handleClose}
      />
      
      {/* תפריט */}
      <div className={`mobile-menu ${isOpen && !isClosing ? 'open' : ''} ${isClosing ? 'closing' : ''}`}>
        {/* כפתור סגירה */}
        <button 
          className="mobile-menu-close"
          onClick={handleClose}
          aria-label="סגור תפריט"
        >
          <FaTimes />
        </button>

        {/* לוגו */}
        <div className="mobile-menu-logo">
          <img src={Logo} alt="מחסני השוק" className="mobile-logo-img" />
        </div>

        {/* CTA - קריאה לפעולה */}
        <div className="mobile-menu-cta-wrapper">
          <div className="mobile-menu-divider" />
          <div className="mobile-menu-cta" onClick={handleWhatsAppClick}>
            <FaWhatsapp className="whatsapp-icon" />
            <span>להצטרפות לקבוצת <span className="cta-highlight">המבצעים</span></span>
          </div>
          <div className="mobile-menu-divider" />
        </div>

        {/* פריטי התפריט */}
        <nav className="mobile-menu-nav">
          {menuItems.map((item, index) => (
            <React.Fragment key={index}>
              <a
                href={item.url}
                className={`mobile-menu-item ${item.isActive ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleMenuClick(item.url, item.isActive, item.isHome);
                }}
              >
                {item.label}
              </a>
              {index < menuItems.length - 1 && <div className="mobile-menu-divider" />}
            </React.Fragment>
          ))}
        </nav>

        {/* אייקוני רשתות חברתיות */}
        <div className="mobile-menu-social">
          <a 
            href="https://wa.me/yournumber" 
            target="_blank" 
            rel="noopener noreferrer"
            className="social-icon"
            aria-label="וואטסאפ"
          >
            <FaWhatsapp />
          </a>
          <a 
            href="https://www.tiktok.com/@m-shuk" 
            target="_blank" 
            rel="noopener noreferrer"
            className="social-icon"
            aria-label="טיקטוק"
          >
            <FaTiktok />
          </a>
          <a 
            href="https://www.instagram.com/m-shuk" 
            target="_blank" 
            rel="noopener noreferrer"
            className="social-icon"
            aria-label="אינסטגרם"
          >
            <FaInstagram />
          </a>
          <a 
            href="https://www.facebook.com/m-shuk" 
            target="_blank" 
            rel="noopener noreferrer"
            className="social-icon"
            aria-label="פייסבוק"
          >
            <FaFacebook />
          </a>
        </div>
      </div>
    </>
  );
};

export default MobileMenu;
