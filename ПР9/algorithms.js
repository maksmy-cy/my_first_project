'use strict';

/* =====================================================================
 *  Базовые алгоритмы на JavaScript
 *  n — размер входных данных; в комментариях указана временная (T)
 *  и дополнительная по памяти (S) сложность.
 * ===================================================================== */

/* ------------------------- 2.1. Числа ------------------------------- */

/**
 * Проверяет, является ли число простым.
 * T: O(√n) — проверяем делители только до корня из n, шагом 6k ± 1.
 * S: O(1)
 */
function isPrime(number) {
  if (!Number.isInteger(number) || number < 2) return false;
  if (number < 4) return true;                    // 2 и 3
  if (number % 2 === 0 || number % 3 === 0) return false;
  for (let i = 5; i * i <= number; i += 6) {
    if (number % i === 0 || number % (i + 2) === 0) return false;
  }
  return true;
}

/**
 * Факториал n (итеративно).
 * T: O(n)
 * S: O(1)
 * Для n > 170 результат выходит за пределы Number (Infinity).
 */
function factorial(n) {
  if (!Number.isInteger(n) || n < 0) {
    throw new RangeError('factorial: ожидается целое неотрицательное число');
  }
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

/**
 * Первые n чисел Фибоначчи (итеративно).
 * T: O(n)
 * S: O(n) — под возвращаемый массив
 */
function fibonacci(n) {
  if (!Number.isInteger(n) || n <= 0) return [];
  const result = [0];
  if (n === 1) return result;
  result.push(1);
  for (let i = 2; i < n; i++) {
    result.push(result[i - 1] + result[i - 2]);
  }
  return result;
}

/**
 * Наибольший общий делитель (алгоритм Евклида).
 * T: O(log(min(a, b)))
 * S: O(1)
 */
function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
}

/* ------------------------- 2.2. Строки ------------------------------ */

/**
 * Палиндром без учёта регистра, пробелов и знаков препинания.
 * T: O(n)
 * S: O(n) — очищенная копия строки
 */
function isPalindrome(str) {
  const clean = String(str).toLowerCase().replace(/ё/g, 'е').replace(/[^\p{L}\p{N}]/gu, '');
  for (let i = 0, j = clean.length - 1; i < j; i++, j--) {
    if (clean[i] !== clean[j]) return false;
  }
  return true;
}

/**
 * Количество гласных (русских и английских).
 * T: O(n)
 * S: O(1)
 */
function countVowels(str) {
  const vowels = new Set('аеёиоуыэюяaeiou');
  let count = 0;
  for (const ch of String(str).toLowerCase()) {
    if (vowels.has(ch)) count++;
  }
  return count;
}

/**
 * Разворот строки без split/reverse/join.
 * T: O(n)
 * S: O(n)
 */
function reverseString(str) {
  str = String(str);
  let result = '';
  for (let i = str.length - 1; i >= 0; i--) {
    result += str[i];
  }
  return result;
}

/**
 * Самое длинное слово в предложении (при равной длине — первое).
 * T: O(n)
 * S: O(n) — массив слов
 */
function findLongestWord(sentence) {
  const words = String(sentence).match(/[\p{L}\p{N}]+(?:[-'][\p{L}\p{N}]+)*/gu) || [];
  let longest = '';
  for (const word of words) {
    if (word.length > longest.length) longest = word;
  }
  return longest;
}

/* ------------------------- 2.3. Массивы ----------------------------- */

/**
 * Максимальный элемент массива (без Math.max).
 * T: O(n)
 * S: O(1)
 * Для пустого массива возвращает undefined.
 */
function findMax(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return undefined;
  let max = arr[0];
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > max) max = arr[i];
  }
  return max;
}

/**
 * Удаление дубликатов с сохранением порядка первого вхождения.
 * T: O(n) — Set даёт поиск за O(1) в среднем
 * S: O(n)
 */
function removeDuplicates(arr) {
  const seen = new Set();
  const result = [];
  for (const item of arr) {
    if (!seen.has(item)) {
      seen.add(item);
      result.push(item);
    }
  }
  return result;
}

/**
 * Пузырьковая сортировка (возвращает новый массив, исходный не меняется).
 * T: O(n²) в худшем и среднем случае, O(n) для уже отсортированного
 *    массива (благодаря флагу swapped)
 * S: O(n) — копия массива; сама сортировка in-place, O(1)
 */
function bubbleSort(arr) {
  const a = arr.slice();
  for (let i = 0; i < a.length - 1; i++) {
    let swapped = false;
    for (let j = 0; j < a.length - 1 - i; j++) {
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swapped = true;
      }
    }
    if (!swapped) break; // массив уже отсортирован
  }
  return a;
}

/**
 * Бинарный поиск в отсортированном по возрастанию массиве.
 * T: O(log n) — на каждом шаге отбрасываем половину диапазона
 * S: O(1)
 */
function binarySearch(sortedArr, target) {
  let left = 0;
  let right = sortedArr.length - 1;
  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    if (sortedArr[mid] === target) return mid;
    if (sortedArr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}

/* ------------------------- 2.4. Утилиты ----------------------------- */

/**
 * Форматирование денежной суммы: 1234.56 → "1 234.56 ₽".
 * T: O(d), где d — количество цифр
 * S: O(d)
 */
function formatCurrency(amount, currency = '₽') {
  const num = Number(amount);
  if (!Number.isFinite(num)) return '';
  const sign = num < 0 ? '-' : '';
  const [intPart, fracPart] = Math.abs(num).toFixed(2).split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${sign}${grouped}.${fracPart} ${currency}`;
}

/**
 * Проверка email регулярным выражением.
 * T: O(n)
 * S: O(1)
 */
function isValidEmail(email) {
  if (typeof email !== 'string' || email.length > 254) return false;
  const re = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/;
  return re.test(email) && !email.includes('..');
}

/**
 * Генерация случайного пароля: гарантированно есть заглавные, строчные,
 * цифры и спецсимволы (при length >= 4).
 * T: O(length)
 * S: O(length)
 */
function generatePassword(length = 8) {
  const sets = [
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    'abcdefghijklmnopqrstuvwxyz',
    '0123456789',
    '!@#$%^&*()-_=+[]{};:,.?',
  ];
  const all = sets.join('');
  length = Math.max(Math.floor(length), sets.length);

  const rand = (max) => {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      return crypto.getRandomValues(new Uint32Array(1))[0] % max;
    }
    return Math.floor(Math.random() * max);
  };

  // по одному символу из каждого набора + остальные из общего пула
  const chars = sets.map((s) => s[rand(s.length)]);
  while (chars.length < length) chars.push(all[rand(all.length)]);

  // перемешивание (Фишер — Йейтс), чтобы обязательные символы не стояли в начале
  for (let i = chars.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

/* Экспорт для Node.js (в браузере функции остаются глобальными) */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isPrime, factorial, fibonacci, gcd,
    isPalindrome, countVowels, reverseString, findLongestWord,
    findMax, removeDuplicates, bubbleSort, binarySearch,
    formatCurrency, isValidEmail, generatePassword,
  };
}
