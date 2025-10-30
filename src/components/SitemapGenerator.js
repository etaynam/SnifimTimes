import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { generateSitemap, downloadSitemap } from '../utils/generateSitemap';
import './SitemapGenerator.css';

const SitemapGenerator = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sitemapContent, setSitemapContent] = useState('');

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('branches')
        .select('id, name, updated_at')
        .order('id');

      if (error) throw error;
      setBranches(data || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSitemapContent = () => {
    const sitemap = generateSitemap(branches);
    setSitemapContent(sitemap);
  };

  const downloadSitemapFile = () => {
    downloadSitemap(branches);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sitemapContent);
    alert('Sitemap copied to clipboard!');
  };

  return (
    <div className="sitemap-generator">
      <h2>יצירת Sitemap לקידום SEO</h2>
      
      <div className="sitemap-info">
        <p>זה כלי ליצירת sitemap.xml עבור כל הסניפים שלנו.</p>
        <p>הקובץ הזה עוזר לגוגל למצוא ולאנדקס את כל העמודים שלנו.</p>
      </div>

      <div className="sitemap-stats">
        <p>מספר סניפים: <strong>{branches.length}</strong></p>
        <p>כתובת האתר: <strong>https://snfm.m-shuk.net</strong></p>
      </div>

      <div className="sitemap-actions">
        <button 
          onClick={generateSitemapContent}
          disabled={loading || branches.length === 0}
          className="btn btn-primary"
        >
          {loading ? 'טוען...' : 'צור Sitemap'}
        </button>

        {sitemapContent && (
          <>
            <button 
              onClick={downloadSitemapFile}
              className="btn btn-secondary"
            >
              הורד קובץ XML
            </button>
            
            <button 
              onClick={copyToClipboard}
              className="btn btn-secondary"
            >
              העתק לקליפבורד
            </button>
          </>
        )}
      </div>

      {sitemapContent && (
        <div className="sitemap-preview">
          <h3>תצוגה מקדימה של Sitemap:</h3>
          <pre className="sitemap-code">
            {sitemapContent}
          </pre>
        </div>
      )}

      <div className="sitemap-instructions">
        <h3>הוראות התקנה:</h3>
        <ol>
          <li>לחץ על "צור Sitemap"</li>
          <li>לחץ על "הורד קובץ XML"</li>
          <li>שמור את הקובץ כ-<code>sitemap.xml</code></li>
          <li>העלה את הקובץ לתיקיית <code>public/</code> בפרויקט</li>
          <li>הוסף את הכתובת ל-Google Search Console</li>
        </ol>
      </div>
    </div>
  );
};

export default SitemapGenerator;
