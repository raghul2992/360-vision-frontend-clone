const FORCE_SHOW_UPDATE_PROMPT = false
export function register (swUrl) {
  if (!('serviceWorker' in navigator)) return

  navigator.serviceWorker.register(swUrl).then(registration => {
    if (FORCE_SHOW_UPDATE_PROMPT) {
      showUpdatePrompt({
        postMessage: msg => console.log('Mock worker message:', msg)
      })
      return
    }

    if (registration.waiting) {
      showUpdatePrompt(registration.waiting)
    }

    registration.onupdatefound = () => {
      const installingWorker = registration.installing

      installingWorker.onstatechange = () => {
        if (
          installingWorker.state === 'installed' &&
          navigator.serviceWorker.controller
        ) {
          showUpdatePrompt(installingWorker)
        }
      }
    }
  })

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload()
  })
}

/* ---------- Popup Reload Prompt UI ---------- */
function showUpdatePrompt (worker) {
  if (document.getElementById('sw-update-popup')) return

  const popup = document.createElement('div')
  popup.id = 'sw-update-popup'

  popup.innerHTML = `
    <div style="font-weight:600;font-size:15px;margin-bottom:6px">
      Update Available
    </div>
    <div style="font-size:13px;opacity:.85;margin-bottom:10px">
      A newer version of this app is ready.
      Reload to get the latest updates.
    </div>
    <button id="sw-update-btn">Reload</button>
  `

  Object.assign(popup.style, {
    position: 'fixed',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#2a2f45',
    color: '#ffffff',
    padding: '16px 18px',
    borderRadius: '10px',
    width: '280px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
    zIndex: 9999
  })

  const btn = popup.querySelector('#sw-update-btn')
  Object.assign(btn.style, {
    width: '100%',
    background: '#3885CC',
    border: 'none',
    color: '#ffffff',
    padding: '8px 12px',
    borderRadius: '9999px',
    cursor: 'pointer',
    fontWeight: 600
  })

  btn.onclick = () => {
    worker?.postMessage?.('SKIP_WAITING')
    console.log('Reload triggered')
  }

  document.body.appendChild(popup)
}
