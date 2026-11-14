'use strict';

/* Мини-фреймворк для тестов: работает и в браузере, и в Node.js */
if (typeof module !== 'undefined' && module.exports) {
  Object.assign(globalThis, require('./algorithms.js'));
}

const results = [];

function test(name, fn) {
  try {
    fn();
    results.push({ name, ok: true });
  } catch (err) {
    results.push({ name, ok: false, message: err.message });
  }
}

function assertEqual(actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`ожидалось ${e}, получено ${a}`);
}

function assertThrows(fn, ErrorType = Error) {
  try { fn(); } catch (err) {
    if (err instanceof ErrorType) return;
    throw new Error(`ожидалась ошибка ${ErrorType.name}, получена ${err.name}`);
  }
  throw new Error('ожидалось исключение, но его не было');
}

/* ------------------------------ Числа ------------------------------ */
test('isPrime: простые числа', () => {
  [2, 3, 5, 7, 11, 13, 97, 7919, 1000003].forEach((n) => assertEqual(isPrime(n), true));
});
test('isPrime: составные и крайние случаи', () => {
  [-7, 0, 1, 4, 9, 15, 100, 7917].forEach((n) => assertEqual(isPrime(n), false));
  assertEqual(isPrime(2.5), false);
  assertEqual(isPrime('7'), false);
});
test('factorial', () => {
  assertEqual(factorial(0), 1);
  assertEqual(factorial(1), 1);
  assertEqual(factorial(5), 120);
  assertEqual(factorial(10), 3628800);
});
test('factorial: некорректный ввод', () => {
  assertThrows(() => factorial(-1), RangeError);
  assertThrows(() => factorial(2.5), RangeError);
});
test('fibonacci', () => {
  assertEqual(fibonacci(0), []);
  assertEqual(fibonacci(1), [0]);
  assertEqual(fibonacci(2), [0, 1]);
  assertEqual(fibonacci(8), [0, 1, 1, 2, 3, 5, 8, 13]);
  assertEqual(fibonacci(-3), []);
});
test('gcd', () => {
  assertEqual(gcd(48, 18), 6);
  assertEqual(gcd(17, 5), 1);
  assertEqual(gcd(0, 9), 9);
  assertEqual(gcd(-12, 18), 6);
  assertEqual(gcd(100, 100), 100);
});

/* ------------------------------ Строки ----------------------------- */
test('isPalindrome', () => {
  assertEqual(isPalindrome('А роза упала на лапу Азора'), true);
  assertEqual(isPalindrome('A man, a plan, a canal: Panama'), true);
  assertEqual(isPalindrome('racecar'), true);
  assertEqual(isPalindrome('hello'), false);
  assertEqual(isPalindrome(''), true);
});
test('countVowels', () => {
  assertEqual(countVowels('Привет, мир!'), 3);
  assertEqual(countVowels('Hello World'), 3);
  assertEqual(countVowels('ёж'), 1);
  assertEqual(countVowels('rhythm'), 0);
  assertEqual(countVowels(''), 0);
});
test('reverseString', () => {
  assertEqual(reverseString('hello'), 'olleh');
  assertEqual(reverseString('Привет'), 'тевирП');
  assertEqual(reverseString(''), '');
  assertEqual(reverseString('a'), 'a');
});
test('findLongestWord', () => {
  assertEqual(findLongestWord('Я люблю программирование на JavaScript'), 'программирование');
  assertEqual(findLongestWord('кот и пёс'), 'кот');
  assertEqual(findLongestWord('Привет, мир!'), 'Привет');
  assertEqual(findLongestWord(''), '');
});

/* ------------------------------ Массивы ---------------------------- */
test('findMax', () => {
  assertEqual(findMax([3, 1, 4, 1, 5, 9, 2, 6]), 9);
  assertEqual(findMax([-5, -2, -9]), -2);
  assertEqual(findMax([7]), 7);
  assertEqual(findMax([]), undefined);
});
test('removeDuplicates', () => {
  assertEqual(removeDuplicates([1, 2, 2, 3, 4, 4, 5]), [1, 2, 3, 4, 5]);
  assertEqual(removeDuplicates(['a', 'b', 'a']), ['a', 'b']);
  assertEqual(removeDuplicates([]), []);
  assertEqual(removeDuplicates([1, 1, 1]), [1]);
});
test('bubbleSort', () => {
  assertEqual(bubbleSort([5, 3, 8, 1, 2]), [1, 2, 3, 5, 8]);
  assertEqual(bubbleSort([1, 2, 3]), [1, 2, 3]);
  assertEqual(bubbleSort([3, 2, 1]), [1, 2, 3]);
  assertEqual(bubbleSort([]), []);
  assertEqual(bubbleSort([2, 2, 1]), [1, 2, 2]);
});
test('bubbleSort: не мутирует исходный массив', () => {
  const src = [3, 1, 2];
  bubbleSort(src);
  assertEqual(src, [3, 1, 2]);
});
test('binarySearch', () => {
  const arr = [1, 3, 5, 7, 9, 11];
  assertEqual(binarySearch(arr, 7), 3);
  assertEqual(binarySearch(arr, 1), 0);
  assertEqual(binarySearch(arr, 11), 5);
  assertEqual(binarySearch(arr, 4), -1);
  assertEqual(binarySearch([], 1), -1);
});

/* ------------------------------ Утилиты ---------------------------- */
test('formatCurrency', () => {
  assertEqual(formatCurrency(1234.56), '1 234.56 ₽');
  assertEqual(formatCurrency(1000000), '1 000 000.00 ₽');
  assertEqual(formatCurrency(5, '$'), '5.00 $');
  assertEqual(formatCurrency(0), '0.00 ₽');
  assertEqual(formatCurrency(-1500.5), '-1 500.50 ₽');
});
test('isValidEmail', () => {
  ['user@example.com', 'first.last@mail.ru', 'a+tag@sub.domain.org'].forEach((e) => assertEqual(isValidEmail(e), true));
  ['', 'plainaddress', '@no-local.com', 'user@', 'user@domain', 'user@@domain.com', 'us er@domain.com', 'user@domain..com'].forEach((e) => assertEqual(isValidEmail(e), false));
});
test('generatePassword: длина и состав', () => {
  for (let i = 0; i < 50; i++) {
    const p = generatePassword(12);
    assertEqual(p.length, 12);
    assertEqual(/[A-Z]/.test(p) && /[a-z]/.test(p) && /\d/.test(p) && /[^A-Za-z0-9]/.test(p), true);
  }
  assertEqual(generatePassword().length, 8);
});
test('generatePassword: пароли различаются', () => {
  assertEqual(generatePassword(16) !== generatePassword(16), true);
});

/* ---------------------------- Вывод результатов -------------------- */
const passed = results.filter((r) => r.ok).length;

if (typeof document !== 'undefined') {
  const list = document.getElementById('results');
  const summary = document.getElementById('summary');
  results.forEach((r) => {
    const li = document.createElement('li');
    li.className = r.ok ? 'pass' : 'fail';
    li.textContent = `${r.ok ? '✓' : '✗'} ${r.name}${r.ok ? '' : ' — ' + r.message}`;
    list.append(li);
  });
  summary.textContent = `Пройдено ${passed} из ${results.length}`;
  summary.className = passed === results.length ? 'pass' : 'fail';
}

results.forEach((r) => console.log(`${r.ok ? '✓' : '✗'} ${r.name}${r.ok ? '' : ' — ' + r.message}`));
console.log(`\nПройдено ${passed} из ${results.length}`);
if (typeof process !== 'undefined' && passed !== results.length) process.exitCode = 1;
