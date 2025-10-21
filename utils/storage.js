/**
 * Возвращает весь конфиг из chrome.storage.local.
 * @returns {Promise<object>}
 */
function getConfig() {
  return new Promise((resolve) => {
    chrome.storage.local.get(null, (items) => {
      resolve(items || {});
    });
  });
}

/**
 * Возвращает значение по ключу или весь storage, если ключ не указан.
 * @param {string} key
 * @returns {Promise<any>}
 */
function getStorage(key) {
  return new Promise((resolve) => {
    if (key === undefined || key === null) {
      chrome.storage.local.get(null, (items) => {
        resolve(items || {});
      });
    } else {
      chrome.storage.local.get(key, (result) => {
        resolve(result[key]);
      });
    }
  });
}

/**
 * Сохраняет объект в chrome.storage.local.
 * @param {object} obj
 */
function setStorage(obj) {
  return new Promise((resolve) => {
    chrome.storage.local.set(obj, () => {
      resolve();
    });
  });
}
