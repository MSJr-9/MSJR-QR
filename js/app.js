(() => {
  'use strict';

  let currentType = 'url';
  let currentPayload = '';
  let currentLabel = '';
  let logoDataUrl = null;

  // --- DOM refs ---
  const form = document.getElementById('qrForm');
  const typeTabs = document.getElementById('typeTabs');
  const historyDrawer = document.getElementById('historyDrawer');
  const historyToggle = document.getElementById('historyToggle');
  const historyClose = document.getElementById('historyClose');
  const copyBtn = document.getElementById('copyContent');

  // --- Initialization ---
  function init() {
    bindTabs();
    bindInputs();
    bindCustomization();
    bindExport();
    bindHistory();
    bindLogo();
    UI.showTab('url');
    validateAndRender();
  }

  // --- Tabs ---
  function bindTabs() {
    typeTabs.addEventListener('click', (e) => {
      const tab = e.target.closest('.tab');
      if (!tab) return;
      currentType = tab.dataset.type;
      UI.showTab(currentType);
      validateAndRender();
    });
  }

  // --- Input validation & payload building ---
  function bindInputs() {
    form.addEventListener('input', validateAndRender);
    form.addEventListener('change', validateAndRender);
  }

  function validateAndRender() {
    UI.clearErrors();
    const result = buildPayload();
    currentPayload = result.payload;
    currentLabel = result.label;

    if (result.error) {
      UI.enableCopy(false);
      QRGenerator.render('', {});
      UI.setPreviewStatus('Invalid input');
      return;
    }

    if (!result.payload) {
      UI.enableCopy(false);
      QRGenerator.render('', {});
      UI.setPreviewStatus('');
      return;
    }

    UI.enableCopy(true);
    const settings = getSettings();
    QRGenerator.render(result.payload, settings);
    UI.setPreviewStatus(`${result.payload.length} chars`);
  }

  function buildPayload() {
    switch (currentType) {
      case 'url': {
        const url = document.getElementById('urlInput').value.trim();
        if (!url) return { payload: '', label: '' };
        if (!isValidUrl(url)) {
          UI.setError('urlError', 'Enter a valid URL (https://…)');
          return { error: true };
        }
        return { payload: url, label: url };
      }

      case 'text': {
        const text = document.getElementById('textInput').value.trim();
        if (!text) return { payload: '', label: '' };
        return { payload: text, label: text };
      }

      case 'wifi': {
        const ssid = document.getElementById('wifiSsid').value.trim();
        const pass = document.getElementById('wifiPass').value;
        const enc = document.getElementById('wifiEnc').value;
        if (!ssid) {
          UI.setError('wifiError', 'SSID is required');
          return { error: true };
        }
        if (enc !== 'nopass' && !pass) {
          UI.setError('wifiError', 'Password required for WPA/WEP');
          return { error: true };
        }
        const escapedSsid = ssid.replace(/([\\;,:"])/g, '\\$1');
        const escapedPass = pass.replace(/([\\;,:"])/g, '\\$1');
        const payload = `WIFI:T:${enc};S:${escapedSsid};P:${escapedPass};;`;
        return { payload, label: `Wi‑Fi: ${ssid}` };
      }

      case 'email': {
        const to = document.getElementById('emailTo').value.trim();
        const subject = document.getElementById('emailSubject').value.trim();
        const body = document.getElementById('emailBody').value.trim();
        if (!to) return { payload: '', label: '' };
        if (!isValidEmail(to)) {
          UI.setError('emailError', 'Enter a valid email address');
          return { error: true };
        }
        let payload = `mailto:${to}`;
        const params = [];
        if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
        if (body) params.push(`body=${encodeURIComponent(body)}`);
        if (params.length) payload += '?' + params.join('&');
        return { payload, label: `Email: ${to}` };
      }

      case 'phone': {
        const phone = document.getElementById('phoneNumber').value.trim();
        if (!phone) return { payload: '', label: '' };
        if (!isValidPhone(phone)) {
          UI.setError('phoneError', 'Enter a valid phone number');
          return { error: true };
        }
        return { payload: `tel:${phone}`, label: `Phone: ${phone}` };
      }

      case 'sms': {
        const number = document.getElementById('smsNumber').value.trim();
        const message = document.getElementById('smsMessage').value.trim();
        if (!number) return { payload: '', label: '' };
        if (!isValidPhone(number)) {
          UI.setError('smsError', 'Enter a valid phone number');
          return { error: true };
        }
        const payload = `SMSTO:${number}:${message || ''}`;
        return { payload, label: `SMS: ${number}` };
      }

      case 'vcard': {
        const first = document.getElementById('vcFirstName').value.trim();
        const last = document.getElementById('vcLastName').value.trim();
        const phone = document.getElementById('vcPhone').value.trim();
        const email = document.getElementById('vcEmail').value.trim();
        const org = document.getElementById('vcOrg').value.trim();
        if (!first && !last) return { payload: '', label: '' };
        if (email && !isValidEmail(email)) {
          UI.setError('vcardError', 'Enter a valid email');
          return { error: true };
        }
        const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
        lines.push(`N:${last};${first};;;`);
        lines.push(`FN:${first} ${last}`.trim());
        if (phone) lines.push(`TEL:${phone}`);
        if (email) lines.push(`EMAIL:${email}`);
        if (org) lines.push(`ORG:${org}`);
        lines.push('END:VCARD');
        const payload = lines.join('\n');
        return { payload, label: `vCard: ${first} ${last}`.trim() };
      }

      case 'whatsapp': {
        const number = document.getElementById('waNumber').value.trim();
        const message = document.getElementById('waMessage').value.trim();
        if (!number) return { payload: '', label: '' };
        const clean = number.replace(/[^0-9]/g, '');
        if (clean.length < 7) {
          UI.setError('whatsappError', 'Enter a valid number with country code');
          return { error: true };
        }
        let payload = `https://wa.me/${clean}`;
        if (message) payload += `?text=${encodeURIComponent(message)}`;
        return { payload, label: `WhatsApp: ${number}` };
      }

      default:
        return { payload: '', label: '' };
    }
  }

  // --- Helpers ---
  function isValidUrl(str) {
    try { new URL(str); return true; } catch { return false; }
  }
  function isValidEmail(str) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str); }
  function isValidPhone(str) { return /^[\+\d][\d\s\-().]{6,}$/.test(str); }

  // --- Settings ---
  function getSettings() {
    return {
      fgColor: document.getElementById('fgColor').value,
      bgColor: document.getElementById('bgColor').value,
      transparentBg: document.getElementById('transparentBg').checked,
      dotStyle: document.getElementById('dotStyle').value,
      cornerStyle: document.getElementById('cornerStyle').value,
      errorLevel: document.getElementById('errorLevel').value,
      logoSize: parseFloat(document.getElementById('logoSize').value),
      exportSize: parseInt(document.getElementById('exportSize').value, 10)
    };
  }

  function bindCustomization() {
    ['fgColor', 'bgColor', 'transparentBg', 'dotStyle', 'cornerStyle', 'errorLevel', 'logoSize'].forEach(id => {
      document.getElementById(id).addEventListener('input', () => {
        if (currentPayload) {
          QRGenerator.render(currentPayload, getSettings());
        }
      });
    });
  }

  // --- Logo ---
  function bindLogo() {
    document.getElementById('logoUpload').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        UI.toast('Logo must be under 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        logoDataUrl = ev.target.result;
        QRGenerator.setLogo(logoDataUrl);
        if (currentPayload) QRGenerator.render(currentPayload, getSettings());
        UI.toast('Logo added');
      };
      reader.readAsDataURL(file);
    });

    document.getElementById('removeLogo').addEventListener('click', () => {
      logoDataUrl = null;
      QRGenerator.setLogo(null);
      document.getElementById('logoUpload').value = '';
      if (currentPayload) QRGenerator.render(currentPayload, getSettings());
      UI.toast('Logo removed');
    });
  }

  // --- Export ---
  function bindExport() {
    document.getElementById('downloadPng').addEventListener('click', () => {
      if (!currentPayload) { UI.toast('Generate a QR code first'); return; }
      const size = parseInt(document.getElementById('exportSize').value, 10);
      QRGenerator.download('png', size);
      saveToHistory();
      UI.toast('PNG downloaded');
    });

    document.getElementById('downloadSvg').addEventListener('click', () => {
      if (!currentPayload) { UI.toast('Generate a QR code first'); return; }
      const size = parseInt(document.getElementById('exportSize').value, 10);
      QRGenerator.download('svg', size);
      saveToHistory();
      UI.toast('SVG downloaded');
    });
  }

  // --- Copy ---
  copyBtn.addEventListener('click', () => {
    if (!currentPayload) return;
    navigator.clipboard.writeText(currentPayload).then(() => {
      UI.toast('Content copied');
    }).catch(() => {
      UI.toast('Copy failed');
    });
  });

  // --- History ---
  function saveToHistory() {
    if (!currentPayload) return;
    HistoryManager.save({
      type: currentType,
      payload: currentPayload,
      label: currentLabel,
      settings: getSettings()
    });
    refreshHistoryList();
  }

  function bindHistory() {
    historyToggle.addEventListener('click', () => {
      historyDrawer.classList.toggle('open');
      refreshHistoryList();
    });

    historyClose.addEventListener('click', () => {
      historyDrawer.classList.remove('open');
    });

    document.getElementById('clearHistory').addEventListener('click', () => {
      if (!confirm('Delete all saved QR codes? This cannot be undone.')) return;
      HistoryManager.clear();
      refreshHistoryList();
      UI.toast('History cleared');
    });
  }

  function refreshHistoryList() {
    const items = HistoryManager.getAll();
    UI.renderHistory(items, (id) => {
      const entry = HistoryManager.findById(id);
      if (!entry) return;
      loadEntry(entry);
      historyDrawer.classList.remove('open');
      UI.toast('Loaded from history');
    }, (id) => {
      HistoryManager.remove(id);
      refreshHistoryList();
      UI.toast('Entry deleted');
    });
  }

  function loadEntry(entry) {
    currentType = entry.type;
    UI.showTab(entry.type);

    // Restore form fields based on type
    switch (entry.type) {
      case 'url': document.getElementById('urlInput').value = entry.payload; break;
      case 'text': document.getElementById('textInput').value = entry.payload; break;
      case 'wifi': {
        // Parse WIFI:T:WPA;S:ssid;P:pass;;
        const m = entry.payload.match(/WIFI:T:([^;]*);S:([^;]*);P:([^;]*);/);
        if (m) {
          document.getElementById('wifiEnc').value = m[1];
          document.getElementById('wifiSsid').value = m[2].replace(/\\(.)/g, '$1');
          document.getElementById('wifiPass').value = m[3].replace(/\\(.)/g, '$1');
        }
        break;
      }
      case 'email': {
        const match = entry.payload.match(/^mailto:([^?]+)(?:\?(.*))?$/);
        if (match) {
          document.getElementById('emailTo').value = match[1];
          const params = new URLSearchParams(match[2] || '');
          document.getElementById('emailSubject').value = params.get('subject') || '';
          document.getElementById('emailBody').value = params.get('body') || '';
        }
        break;
      }
      case 'phone': document.getElementById('phoneNumber').value = entry.payload.replace('tel:', ''); break;
      case 'sms': {
        const parts = entry.payload.replace('SMSTO:', '').split(':');
        document.getElementById('smsNumber').value = parts[0] || '';
        document.getElementById('smsMessage').value = parts.slice(1).join(':') || '';
        break;
      }
      case 'vcard': {
        const fnMatch = entry.payload.match(/FN:(.*)/);
        if (fnMatch) {
          const names = fnMatch[1].trim().split(' ');
          document.getElementById('vcFirstName').value = names[0] || '';
          document.getElementById('vcLastName').value = names.slice(1).join(' ') || '';
        }
        const telMatch = entry.payload.match(/TEL:(.*)/);
        if (telMatch) document.getElementById('vcPhone').value = telMatch[1];
        const emailMatch = entry.payload.match(/EMAIL:(.*)/);
        if (emailMatch) document.getElementById('vcEmail').value = emailMatch[1];
        const orgMatch = entry.payload.match(/ORG:(.*)/);
        if (orgMatch) document.getElementById('vcOrg').value = orgMatch[1];
        break;
      }
      case 'whatsapp': {
        const clean = entry.payload.replace('https://wa.me/', '').split('?')[0];
        document.getElementById('waNumber').value = clean;
        const qs = entry.payload.split('?')[1];
        if (qs) {
          const params = new URLSearchParams(qs);
          document.getElementById('waMessage').value = params.get('text') || '';
        }
        break;
      }
    }

    // Restore settings
    if (entry.settings) {
      const s = entry.settings;
      document.getElementById('fgColor').value = s.fgColor || '#f0211a';
      document.getElementById('bgColor').value = s.bgColor || '#0b0b0f';
      document.getElementById('transparentBg').checked = !!s.transparentBg;
      document.getElementById('dotStyle').value = s.dotStyle || 'rounded';
      document.getElementById('cornerStyle').value = s.cornerStyle || 'dot';
      document.getElementById('errorLevel').value = s.errorLevel || 'Q';
      document.getElementById('logoSize').value = s.logoSize || 0.4;
      document.getElementById('exportSize').value = s.exportSize || 600;
    }

    validateAndRender();
  }

  // --- Boot ---
  document.addEventListener('DOMContentLoaded', init);
})();