/**
 * Tab cloaking utilities.
 * Spawns the app inside an about:blank iframe to hide the real URL from the browser bar.
 */

export type CloakPreset = 'about:blank' | 'Google Docs' | 'Google Drive' | 'Canvas' | 'Khan Academy' | 'Wikipedia';

export const CLOAK_CONFIGS: Record<CloakPreset, { title: string; favicon: string }> = {
  'about:blank': { title: '', favicon: '' },
  'Google Docs': {
    title: 'Google Docs',
    favicon: 'https://ssl.gstatic.com/docs/documents/images/kix-favicon-2023q4-r4.ico',
  },
  'Google Drive': {
    title: 'My Drive - Google Drive',
    favicon: 'https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png',
  },
  'Canvas': {
    title: 'Dashboard',
    favicon: 'https://du11hjcvx0uqb.cloudfront.net/dist/images/favicon-e10d657a73.svg',
  },
  'Khan Academy': {
    title: 'Khan Academy | Free Online Courses',
    favicon: 'https://www.khanacademy.org/favicon.ico',
  },
  'Wikipedia': {
    title: 'Wikipedia',
    favicon: 'https://en.wikipedia.org/static/favicon/wikipedia.ico',
  },
};

/**
 * Launch the app inside an about:blank tab, cloaking the real URL.
 * Call this from the main page to open a new cloaked tab.
 */
export function launchCloakedTab(cloak: CloakPreset = 'about:blank'): Window | null {
  const config = CLOAK_CONFIGS[cloak];
  const newWin = window.open('about:blank', '_blank');
  if (!newWin) return null;

  const doc = newWin.document;
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${config.title}</title>
        ${config.favicon ? `<link rel="icon" href="${config.favicon}">` : ''}
        <style>
          * { margin: 0; padding: 0; }
          html, body, iframe { width: 100%; height: 100%; border: none; }
          body { overflow: hidden; }
        </style>
      </head>
      <body>
        <iframe src="${window.location.href}" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"></iframe>
      </body>
    </html>
  `);
  doc.close();
  return newWin;
}

/**
 * Apply cloak to the current document's title and favicon.
 */
export function applyCloak(cloak: CloakPreset): void {
  const config = CLOAK_CONFIGS[cloak];
  if (config.title) {
    document.title = config.title;
  }
  if (config.favicon) {
    let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = config.favicon;
  }
}

/**
 * Remove cloak and restore original title/favicon.
 */
export function removeCloak(): void {
  document.title = 'Phaxe';
  let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
  if (link) {
    link.href = '/favicon.svg';
  }
}
