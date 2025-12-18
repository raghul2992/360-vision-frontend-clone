export function register (config) {
  navigator.serviceWorker.register(config).then(registration => {
    registration.onupdatefound = () => {
      const installingWorker = registration.installing
      installingWorker.onstatechange = () => {
        if (installingWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            window.location.reload()
          }
        }
      }
    }
  })
}
