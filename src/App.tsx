/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    // Mock chrome API for the live preview environment
    (window as any).chrome = {
      runtime: {
        getURL: (path: string) => {
          if (path === 'styles.css') return '/extension/styles.css';
          return path;
        },
        sendMessage: (msg: any, callback: any) => {
          if (msg.action === 'fetchDefinition') {
            fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(msg.word)}`)
              .then(res => res.json())
              .then(data => {
                if (Array.isArray(data)) {
                  callback({ success: true, data });
                } else {
                  callback({ success: false });
                }
              })
              .catch(() => callback({ success: false }));
          }
        }
      }
    };

    // Load the content script dynamically for the preview
    const script = document.createElement('script');
    script.src = '/extension/content.js';
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      (window as any).chrome = undefined;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-12 font-sans text-gray-900 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white p-10 rounded-3xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-bold mb-6 tracking-tight">Test Your Extension Here</h1>
        <p className="text-lg leading-relaxed mb-6 text-gray-600">
          Try selecting a word in this paragraph to see the vocabulary tooltip in action. 
          For example, highlight the word <strong className="text-blue-600 font-semibold cursor-text">ephemeral</strong> or <strong className="text-blue-600 font-semibold cursor-text">serendipity</strong>.
        </p>
        <p className="text-lg leading-relaxed mb-6 text-gray-600">
          The extension uses a Shadow DOM to ensure its styles remain completely isolated from this page's Tailwind CSS. 
          When you click save, it will trigger a delightful animation with a self-deprecating bear emoji!
        </p>
        <p className="text-lg leading-relaxed text-gray-600">
          Words like <strong className="text-blue-600 font-semibold cursor-text">ubiquitous</strong>, <strong className="text-blue-600 font-semibold cursor-text">pragmatic</strong>, and <strong className="text-blue-600 font-semibold cursor-text">eloquent</strong> are great for testing the dictionary API.
        </p>
        
        <div className="mt-12 p-6 bg-blue-50 rounded-2xl border border-blue-100">
          <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-2">How to install</h3>
          <p className="text-sm text-blue-800">
            The extension files have been generated in the <code>/public/extension</code> folder. 
            You can download them and load them into Chrome via <code>chrome://extensions</code> (Developer mode -&gt; Load unpacked).
          </p>
        </div>
      </div>
    </div>
  );
}
