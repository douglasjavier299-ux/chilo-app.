'use strict';

(() => {
  const frame = document.getElementById('operations');
  const launch = document.getElementById('launch');
  const message = document.getElementById('launchMessage');
  const spinner = document.getElementById('spinner');
  const recovery = document.getElementById('recovery');
  const direct = document.getElementById('openDirect');
  const offline = document.getElementById('offline');

  let ready = false;
  let timeout;
  let appUrl = '';

  function validUrl(value) {
    try {
      const url = new URL(value);
      return (
        url.protocol === 'https:' &&
        url.hostname === 'script.google.com' &&
        !url.username &&
        !url.password &&
        /^\/macros\/s\/[a-zA-Z0-9_-]+\/exec$/.test(url.pathname)
      ) ? url.href : '';
    } catch (_) {
      return '';
    }
  }

  function showLaunch(text, canRetry = false) {
    launch.hidden = false;
    message.textContent = text;
    spinner.hidden = true;
    recovery.hidden = !canRetry;
    direct.hidden = !appUrl;
  }

  function load() {
    clearTimeout(timeout);

    if (!appUrl) return;

    if (!navigator.onLine) {
      showLaunch(
        'Necesitas conexión a internet para abrir tus operaciones.',
        true
      );
      return;
    }

    launch.hidden = false;
    spinner.hidden = false;
    recovery.hidden = true;
    message.textContent = 'Abriendo tus operaciones…';
    ready = false;
    frame.hidden = false;
    frame.src = appUrl;

    timeout = setTimeout(() => {
      if (!ready) {
        showLaunch(
          'La carga está tardando. Puedes volver a intentar o abrir tus operaciones directamente.',
          true
        );
      }
    }, 20000);
  }

  window.addEventListener('message', event => {
    let url;

    try {
      url = new URL(event.origin);
    } catch (_) {
      return;
    }

    const trustedHost =
      url.hostname === 'script.google.com' ||
      url.hostname === 'script.googleusercontent.com' ||
      url.hostname.endsWith('.script.googleusercontent.com') ||
      url.hostname.endsWith('-script.googleusercontent.com');

    if (!appUrl || url.protocol !== 'https:' || !trustedHost) return;
    if (!event.data || event.data.type !== 'chilo:ready') return;

    clearTimeout(timeout);
    ready = true;
    launch.hidden = true;
    spinner.hidden = true;
    frame.hidden = false;
  });

  document.getElementById('retry').addEventListener('click', load);

  function connectivity() {
    offline.hidden = navigator.onLine;

    if (!navigator.onLine && !ready) {
      clearTimeout(timeout);
      showLaunch(
        'Necesitas conexión a internet para abrir tus operaciones.',
        true
      );
    } else if (navigator.onLine && !ready && appUrl) {
      load();
    }
  }

  window.addEventListener('online', connectivity);
  window.addEventListener('offline', connectivity);

  appUrl = validUrl((window.CHILO_CONFIG || {}).appsScriptUrl);

  if (appUrl) {
    direct.href = appUrl;
    load();
  } else {
    showLaunch(
      'La conexión de Chilo todavía no está configurada. Completa la instalación antes de usar la app.'
    );
  }

  offline.hidden = navigator.onLine;

  if ('serviceWorker' in navigator && window.isSecureContext) {
    navigator.serviceWorker
      .register('./sw.js', { scope: './' })
      .catch(() => {
        // El acceso en línea funciona aunque no se permita caché.
      });
  }
})();
