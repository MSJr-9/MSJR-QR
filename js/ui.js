const UI = (() => {
  let toastTimer = null;

  function toast(message, duration = 2500) {
    const el = document.getElementById('toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), duration);
  }

  function showTab(type) {
    document.querySelectorAll('.tab').forEach(t => {
      t.classList.toggle('active', t.dataset.type === type);
    });
    document.querySelectorAll('.form-group').forEach(g => {
      g.classList.toggle('hidden', g.dataset.type !== type);
    });
  }

  function clearErrors() {
    document.querySelectorAll('.error').forEach(e => e.textContent = '');
  }

  function setError(id, message) {
    const el = document.getElementById(id);
    if (el) el.textContent = message;
  }

  function renderHistory(items, onSelect, onDelete) {
    const list = document.getElementById('historyList');
    const clearBtn = document.getElementById('clearHistory');

    if (!items.length) {
      list.innerHTML = '<p class="history-empty">No saved QR codes yet.</p>';
      clearBtn.classList.add('hidden');
      return;
    }

    clearBtn.classList.remove('hidden');
    list.innerHTML = items.map(item => `
      <div class="history-item" data-id="${item.id}">
        <div class="type-badge">${item.type}</div>
        <div class="content-preview">${escapeHtml(item.label || item.payload || '')}</div>
        <button class="delete-btn" data-delete="${item.id}" title="Delete">✕</button>
      </div>
    `).join('');

    list.querySelectorAll('.history-item').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.dataset.delete) return;
        onSelect(el.dataset.id);
      });
    });

    list.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        onDelete(btn.dataset.delete);
      });
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function setPreviewStatus(text) {
    document.getElementById('previewStatus').textContent = text || '';
  }

  function enableCopy(enabled) {
    document.getElementById('copyContent').disabled = !enabled;
  }

  return { toast, showTab, clearErrors, setError, renderHistory, setPreviewStatus, enableCopy };
})();