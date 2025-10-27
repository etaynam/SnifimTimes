import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <img 
          src="/images/MAB.png" 
          alt="מחלקת שיווק" 
          className="footer-logo"
        />
        <span className="footer-version">גרסה 1.0</span>
      </div>
    </footer>
  );
};

export default Footer;

