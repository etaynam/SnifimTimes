import React, { useState } from 'react';
import { FaShoppingCart, FaBars } from 'react-icons/fa';
import Logo from '../images/Logo.png';
import MobileMenu from './MobileMenu';
import './Header.css';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { label: 'דף הבית', url: 'https://m-shuk.net', isHome: true },
    { label: 'אודות', url: 'https://m-shuk.net/about-about/' },
    { label: 'מבצעים', url: 'https://m-shuk.net/shuk-flyer/' },
    { label: 'מועדון שוק פינוק', url: '#' },
    { label: 'סניפים', url: '/', isActive: true }, // הקישור שלנו - האפליקציה הנוכחית
    { label: 'גיפט קארד', url: 'https://m-shuk.net/giftcard/' },
    { label: 'כרטיס אשראי', url: 'https://m-shuk.net/wincard/' },
    { label: 'דרושים', url: 'https://m-shuk.net/jobs/' },
    { label: 'שירות לקוחות', url: 'https://m-shuk.net/shuk-service/' }
  ];

  const handleMenuClick = (url, isInternal, isHome) => {
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

  const handleOnlinePurchase = () => {
    window.open('http://www.mck.co.il/', '_blank');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="main-header">
      <div className="header-container">
        {/* לוגו */}
        <div className="header-left">
          <div className="logo-container">
            <img src={Logo} alt="מחסני השוק" className="main-logo" />
          </div>
        </div>

        {/* תפריט ניווט */}
        <nav className="header-nav">
          <ul className="nav-menu">
            {menuItems.map((item, index) => (
              <li key={index} className="nav-item">
                <a
                  href={item.url}
                  className={`nav-link ${item.isActive ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleMenuClick(item.url, item.isActive, item.isHome);
                  }}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* כפתור לקנייה אונליין */}
        <div className="header-right">
          <button 
            className="online-purchase-btn"
            onClick={handleOnlinePurchase}
          >
            <span>לקנייה אונליין</span>
            <FaShoppingCart className="cart-icon" />
          </button>
        </div>

        {/* כפתור המבורגר למובייל */}
        {!isMobileMenuOpen && (
          <button 
            className="mobile-menu-toggle"
            onClick={toggleMobileMenu}
            aria-label="תפריט"
          >
            <FaBars />
          </button>
        )}
      </div>

      {/* תפריט נייד */}
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
    </header>
  );
};

export default Header;