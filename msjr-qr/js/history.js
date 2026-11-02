const HistoryManager = (() => {
  const STORAGE_KEY = 'msjr_qr_history';
  const MAX_ITEMS = 50;

  function getAll() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch { return []; }
  }

  function save(entry) {
    const items = getAll();
    const newEntry = {
      ...entry,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      createdAt: new Date().toISOString()
    };
    items.unshift(newEntry);
    if (items.length > MAX_ITEMS) items.length = MAX_ITEMS;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return newEntry;
  }

  function remove(id) {
    const items = getAll().filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function clear() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function findById(id) {
    return getAll().find(item => item.id === id) || null;
  }

  return { getAll, save, remove, clear, findById };
})();