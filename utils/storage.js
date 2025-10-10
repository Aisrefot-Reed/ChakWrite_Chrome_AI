/**
 * Retrieves the full configuration from chrome.storage.local.
 * @returns {Promise<object>} A promise that resolves with the configuration object.
 */
export function getConfig() {
  return new Promise((resolve) => {
    chrome.storage.local.get(null, (items) => {
      resolve(items || {});
    });
  });
}

/**
 * Retrieves a specific item from chrome.storage.local.
 * @param {string} key - The key of the item to retrieve.
 * @returns {Promise<any>} A promise that resolves with the requested item.
 */
export function getStorage(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      resolve(result[key]);
    });
  });
}

/**
 * Saves an item to chrome.storage.local.
 * @param {object} obj - An object with key/value pairs to save.
 * @returns {Promise<void>} A promise that resolves when the item is saved.
 */
export function setStorage(obj) {
  return new Promise((resolve) => {
    chrome.storage.local.set(obj, () => {
      resolve();
    });
  });
}
