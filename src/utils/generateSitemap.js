// Generate sitemap.xml for SEO
// This utility generates a sitemap with all branches

export const generateSitemap = (branches) => {
  const baseUrl = 'https://snfm.m-shuk.net';
  const currentDate = new Date().toISOString();
  
  // Create URL entries for each branch
  const branchUrls = branches.map(branch => {
    // Create slug from branch name or use ID
    const slug = branch.name 
      ? branch.name
          .toLowerCase()
          .replace(/[^a-z0-9\u0590-\u05FF\s]/g, '') // Keep Hebrew and alphanumeric
          .replace(/\s+/g, '-')
          .trim()
      : `branch-${branch.id}`;
    
    return `  <url>
    <loc>${baseUrl}/branch/${branch.id}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  }).join('\n');

  // Main sitemap XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Main pages -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Branch pages -->
${branchUrls}
</urlset>`;

  return sitemap;
};

// Function to download sitemap as file
export const downloadSitemap = (branches) => {
  const sitemap = generateSitemap(branches);
  const blob = new Blob([sitemap], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = 'sitemap.xml';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
