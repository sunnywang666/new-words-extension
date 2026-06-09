import { useEffect } from 'react';

const extensionBase = new URL('extension/', import.meta.env.BASE_URL).toString();

function getExtensionAsset(path: string) {
  return new URL(path, extensionBase).toString();
}

const sampleWords = ['ephemeral', 'serendipity', 'ubiquitous', 'pragmatic', 'eloquent'];

export default function App() {
  useEffect(() => {
    let mockStorage: Record<string, unknown> = { vocabList: [] };

    (window as Window & { chrome?: unknown }).chrome = {
      runtime: {
        getURL: (path: string) => getExtensionAsset(path),
        sendMessage: (msg: { action?: string; word?: string }, callback: (value: unknown) => void) => {
          if (msg.action !== 'fetchDefinition' || !msg.word) {
            callback({ success: false });
            return;
          }

          const word = msg.word.toLowerCase();
          const cacheKey = `def_${word}`;

          if (mockStorage[cacheKey]) {
            callback({ success: true, data: mockStorage[cacheKey] });
            return;
          }

          fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)
            .then((res) => res.json())
            .then((data) => {
              if (!Array.isArray(data)) {
                callback({ success: false });
                return;
              }

              mockStorage = { ...mockStorage, [cacheKey]: data };
              callback({ success: true, data });
            })
            .catch(() => callback({ success: false }));
        },
      },
      storage: {
        local: {
          get: (_keys: unknown, callback: (value: Record<string, unknown>) => void) => {
            callback(mockStorage);
          },
          set: (items: Record<string, unknown>, callback?: () => void) => {
            mockStorage = { ...mockStorage, ...items };
            callback?.();

            const iframe = document.querySelector('iframe');
            iframe?.contentWindow?.postMessage('vocab-updated', '*');
          },
        },
      },
    };

    const script = document.createElement('script');
    script.src = getExtensionAsset('content.js');
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      (window as Window & { chrome?: unknown }).chrome = undefined;
    };
  }, []);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#fef3c7,_#f8fafc_38%,_#dbeafe_100%)] px-6 py-12 text-slate-900 sm:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 lg:flex-row lg:items-stretch">
        <section className="flex-1 rounded-[32px] border border-white/70 bg-white/80 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur md:p-10">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-amber-700">
            New Words Extension Demo
          </p>
          <h1 className="max-w-2xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Select a word and feel the extension without installing anything.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            This page runs the latest tooltip, dictionary lookup, save flow, vocabulary book, and
            import/export features from your Chrome extension in a browser-friendly sandbox.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {sampleWords.map((word) => (
              <span
                key={word}
                className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900"
              >
                {word}
              </span>
            ))}
          </div>

          <div className="mt-10 rounded-[28px] border border-slate-200 bg-slate-50 p-6">
            <p className="text-base leading-8 text-slate-700">
              Language learning often works best when vocabulary appears in context. Try highlighting{' '}
              <strong className="cursor-text text-sky-700">ephemeral</strong> in this sentence, then
              click save. The demo will fetch a definition, keep the sentence, and add the word to the
              vocabulary book on the right. You can also test{' '}
              <strong className="cursor-text text-sky-700">serendipity</strong>,{' '}
              <strong className="cursor-text text-sky-700">ubiquitous</strong>,{' '}
              <strong className="cursor-text text-sky-700">pragmatic</strong>, and{' '}
              <strong className="cursor-text text-sky-700">eloquent</strong>.
            </p>
            <p className="mt-5 text-base leading-8 text-slate-700">
              The tooltip UI still runs inside a Shadow DOM, so the extension styles stay isolated even
              on this styled marketing page. That means the online demo behaves much closer to the real
              extension experience.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                What works here
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Tooltip lookup, save animation, popup preview, audio playback, and import/export all run
                in this page.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Install later
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                When someone wants the full browser experience, they can still load the unpacked files
                from <code className="rounded bg-slate-100 px-1 py-0.5">public/extension</code>.
              </p>
            </div>
          </div>
        </section>

        <aside className="w-full shrink-0 lg:w-[360px]">
          <div className="rounded-[32px] border border-slate-200 bg-white/90 p-5 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Live Popup
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Vocabulary Book</h2>
              </div>
              <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-800">
                Interactive
              </span>
            </div>

            <div
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-inner"
              style={{ width: '320px', height: '450px', margin: '0 auto' }}
            >
              <iframe
                src={getExtensionAsset('popup.html')}
                className="h-full w-full border-none bg-white"
                title="Extension Popup Preview"
                onLoad={(event) => {
                  const iframeWindow = (event.target as HTMLIFrameElement).contentWindow;
                  if (iframeWindow) {
                    (iframeWindow as Window & { chrome?: unknown }).chrome = (window as Window & {
                      chrome?: unknown;
                    }).chrome;
                    iframeWindow.postMessage('chrome-injected', '*');
                  }
                }}
              />
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
