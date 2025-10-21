// src/utils/storage.js
// Утилиты для работы с chrome.storage.local.

/**
 * Получает полную конфигурацию из chrome.storage.local.
 * @returns {Promise<object>} промис с объектом конфигурации
 */
function getConfig() {
  return new Promise((resolve) => {
    chrome.storage.local.get(null, (items) => {
      resolve(items || {});
    });
  });
}

/**
 * Получает конкретное значение из chrome.storage.local.
 * @param {string} key - ключ для получения
 * @returns {Promise<any>} промис с запрошенным значением
 */
function getStorage(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => {
      resolve(result[key]);
    });
  });
}

/**
 * Сохраняет значения в chrome.storage.local.
 * @param {object} obj - объект с парами ключ-значение для сохранения
 * @returns {Promise<void>} промис, разрешающийся после сохранения
 */
function setStorage(obj) {
  return new Promise((resolve) => {
    chrome.storage.local.set(obj, () => {
      resolve();
    });
  });
}
