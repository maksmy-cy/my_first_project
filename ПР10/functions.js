"use strict";

/* ================= Часть 2: основные задания ================= */

/** Сумма любого количества чисел (rest parameters). sum() === 0. */
function sum(...numbers) {
    let total = 0;
    for (const n of numbers) {
        if (typeof n !== "number") {
            throw new TypeError(`sum: аргумент "${String(n)}" не является числом`);
        }
        total += n;
    }
    return total;
}

/** Создание строки о пользователе (деструктуризация + значение по умолчанию). */
function createUser({ name, age, email = "не указан" } = {}) {
    if (typeof name !== "string" || name.trim() === "") {
        throw new TypeError("createUser: name должен быть непустой строкой");
    }
    if (typeof age !== "number" || !Number.isFinite(age) || age < 0) {
        throw new TypeError("createUser: age должен быть неотрицательным числом");
    }
    return `Пользователь: ${name}, возраст: ${age}, email: ${email}`;
}

/** Замыкание: сообщение недоступно снаружи, только через проверку пароля. */
function secretMessage(password, message) {
    return function (attempt) {
        return attempt === password ? message : "Доступ запрещен";
    };
}

/* ========= Часть 3: рекурсия и функции высшего порядка ========= */

/**
 * compose(f, g, h)(x) === f(g(h(x))) — применение справа налево
 * (как в математике). Без функций возвращает тождественную функцию.
 */
function compose(...functions) {
    for (const f of functions) {
        if (typeof f !== "function") throw new TypeError("compose: все аргументы должны быть функциями");
    }
    return function (...args) {
        if (functions.length === 0) return args[0];
        let result = functions[functions.length - 1].apply(this, args);
        for (let i = functions.length - 2; i >= 0; i--) {
            result = functions[i].call(this, result);
        }
        return result;
    };
}

/** Бонус: pipe(f, g, h)(x) === h(g(f(x))) — слева направо. */
function pipe(...functions) {
    return compose(...functions.slice().reverse());
}

function assertCallback(name, callback) {
    if (typeof callback !== "function") {
        throw new TypeError(`${name}: callback должен быть функцией`);
    }
}

function assertArray(name, array) {
    if (!Array.isArray(array)) throw new TypeError(`${name}: первый аргумент должен быть массивом`);
}

/** Аналог Array.prototype.map (пропускает «дырки», передаёт index и array). */
function myMap(array, callback) {
    assertArray("myMap", array);
    assertCallback("myMap", callback);
    const result = new Array(array.length);
    for (let i = 0; i < array.length; i++) {
        if (i in array) result[i] = callback(array[i], i, array);
    }
    return result;
}

/** Аналог Array.prototype.filter. */
function myFilter(array, callback) {
    assertArray("myFilter", array);
    assertCallback("myFilter", callback);
    const result = [];
    for (let i = 0; i < array.length; i++) {
        if (i in array && callback(array[i], i, array)) result.push(array[i]);
    }
    return result;
}

/** Аналог Array.prototype.reduce (без initialValue берёт первый элемент). */
function myReduce(array, callback, initialValue) {
    assertArray("myReduce", array);
    assertCallback("myReduce", callback);
    let i = 0;
    let acc;
    if (arguments.length >= 3) {
        acc = initialValue;
    } else {
        while (i < array.length && !(i in array)) i++;
        if (i >= array.length) {
            throw new TypeError("myReduce: пустой массив без начального значения");
        }
        acc = array[i++];
    }
    for (; i < array.length; i++) {
        if (i in array) acc = callback(acc, array[i], i, array);
    }
    return acc;
}

/* --- Бонус: примеры рекурсии --- */

/** Факториал (рекурсия). */
function factorial(n) {
    if (!Number.isInteger(n) || n < 0) throw new RangeError("factorial: нужно целое n >= 0");
    return n <= 1 ? 1 : n * factorial(n - 1);
}

/** Глубокое «выпрямление» вложенных массивов (рекурсия). */
function flattenDeep(array) {
    assertArray("flattenDeep", array);
    return myReduce(array, (acc, item) => acc.concat(Array.isArray(item) ? flattenDeep(item) : [item]), []);
}

/* ================= Часть 4: сложно, но важно ================= */

/** Каррирование: curry(f)(1)(2)(3) === curry(f)(1, 2)(3) === f(1, 2, 3). */
function curry(fn) {
    if (typeof fn !== "function") throw new TypeError("curry: fn должен быть функцией");
    return function curried(...args) {
        if (args.length >= fn.length) return fn.apply(this, args);
        return function (...next) {
            return curried.apply(this, args.concat(next));
        };
    };
}

/** Мемоизация: кэш по набору аргументов; кэширует и undefined, и ошибки не кэширует. */
function memoize(fn) {
    if (typeof fn !== "function") throw new TypeError("memoize: fn должен быть функцией");
    const cache = new Map();

    function makeKey(args) {
        try {
            return args
                .map((a) => typeof a + ":" + (typeof a === "object" && a !== null ? JSON.stringify(a) : String(a)))
                .join("|");
        } catch (e) {
            return null; // нельзя построить ключ (например, циклическая структура)
        }
    }

    function memoized(...args) {
        const key = makeKey(args);
        if (key === null) return fn.apply(this, args);
        if (cache.has(key)) return cache.get(key);
        const result = fn.apply(this, args);
        cache.set(key, result);
        return result;
    }
    memoized.clear = () => cache.clear();
    memoized.size = () => cache.size;
    return memoized;
}

/** Debounce: вызов fn через delay мс после ПОСЛЕДНЕГО вызова. */
function debounce(fn, delay) {
    if (typeof fn !== "function") throw new TypeError("debounce: fn должен быть функцией");
    let timer = null;
    function debounced(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => {
            timer = null;
            fn.apply(this, args);
        }, delay);
    }
    debounced.cancel = () => {
        clearTimeout(timer);
        timer = null;
    };
    return debounced;
}

/** Throttle: не чаще одного вызова за interval мс (первый сразу + последний в конце окна). */
function throttle(fn, interval) {
    if (typeof fn !== "function") throw new TypeError("throttle: fn должен быть функцией");
    let lastCall = 0;
    let timer = null;
    let pendingArgs = null;
    let pendingThis = null;

    function throttled(...args) {
        const now = Date.now();
        const remaining = interval - (now - lastCall);
        if (remaining <= 0) {
            clearTimeout(timer);
            timer = null;
            pendingArgs = null;
            lastCall = now;
            fn.apply(this, args);
        } else {
            pendingArgs = args;
            pendingThis = this;
            if (!timer) {
                timer = setTimeout(() => {
                    timer = null;
                    lastCall = Date.now();
                    const a = pendingArgs;
                    pendingArgs = null;
                    if (a) fn.apply(pendingThis, a);
                }, remaining);
            }
        }
    }
    throttled.cancel = () => {
        clearTimeout(timer);
        timer = null;
        pendingArgs = null;
    };
    return throttled;
}

/**
 * createValidator({ minLength, requireDigit, requireUppercase })
 * Возвращает функцию: value => { valid: boolean, errors: string[] }
 */
function createValidator(options = {}) {
    const { minLength = 8, requireDigit = true, requireUppercase = true } = options;
    if (!Number.isInteger(minLength) || minLength < 0) {
        throw new RangeError("createValidator: minLength должен быть целым числом >= 0");
    }
    return function validate(value) {
        if (typeof value !== "string") {
            return { valid: false, errors: ["Значение должно быть строкой"] };
        }
        const errors = [];
        if (value.length < minLength) errors.push(`Минимальная длина — ${minLength} симв.`);
        if (requireDigit && !/\d/.test(value)) errors.push("Нужна хотя бы одна цифра");
        if (requireUppercase && !/\p{Lu}/u.test(value)) errors.push("Нужна хотя бы одна заглавная буква");
        return { valid: errors.length === 0, errors };
    };
}

/* Экспорт для Node.js (в браузере функции остаются глобальными) */
if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        sum, createUser, secretMessage, compose, pipe, myMap, myFilter, myReduce,
        factorial, flattenDeep, curry, memoize, debounce, throttle, createValidator,
    };
}
