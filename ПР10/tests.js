(function () {
    "use strict";

    const F = typeof module !== "undefined" && module.exports ? require("./functions.js") : window;

    /* ---------- мини-фреймворк ---------- */
    const suites = [];
    let current = null;

    function describe(name, body) {
        current = { name, tests: [] };
        suites.push(current);
        body();
    }
    function it(name, fn) {
        current.tests.push({ name, fn });
    }
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    function deepEqual(a, b) {
        if (Object.is(a, b)) return true;
        if (typeof a !== "object" || typeof b !== "object" || !a || !b) return false;
        if (Array.isArray(a) !== Array.isArray(b)) return false;
        const ka = Object.keys(a), kb = Object.keys(b);
        return ka.length === kb.length && ka.every((k) => k in b && deepEqual(a[k], b[k]));
    }
    function fmt(v) {
        try { return typeof v === "string" ? JSON.stringify(v) : JSON.stringify(v) ?? String(v); }
        catch (e) { return String(v); }
    }
    function assertEqual(actual, expected, msg = "") {
        if (!deepEqual(actual, expected)) {
            throw new Error(`${msg} ожидалось ${fmt(expected)}, получено ${fmt(actual)}`.trim());
        }
    }
    function assertTrue(cond, msg = "Условие не выполнено") {
        if (!cond) throw new Error(msg);
    }
    function assertThrows(fn, ErrorType, msg = "") {
        try { fn(); } catch (e) {
            if (ErrorType && !(e instanceof ErrorType)) {
                throw new Error(`${msg} ожидалась ошибка ${ErrorType.name}, получена ${e && e.name}`.trim());
            }
            return;
        }
        throw new Error(`${msg} ожидалось исключение`.trim());
    }

    /* ---------- тесты ---------- */

    describe("sum", () => {
        it("суммирует несколько аргументов", () => assertEqual(F.sum(1, 2, 3, 4), 10));
        it("без аргументов даёт 0", () => assertEqual(F.sum(), 0));
        it("один аргумент", () => assertEqual(F.sum(5), 5));
        it("отрицательные и дробные числа", () => assertEqual(F.sum(-1, 0.5, 0.5, -2), -2));
        it("Infinity и NaN обрабатываются как числа", () => {
            assertEqual(F.sum(1, Infinity), Infinity);
            assertTrue(Number.isNaN(F.sum(1, NaN)));
        });
        it("строка вместо числа → TypeError", () => assertThrows(() => F.sum(1, "2"), TypeError));
        it("null/undefined → TypeError", () => {
            assertThrows(() => F.sum(null), TypeError);
            assertThrows(() => F.sum(undefined), TypeError);
        });
        it("работает со spread большого массива", () => assertEqual(F.sum(...Array(1000).fill(1)), 1000));
    });

    describe("createUser", () => {
        it("с email", () =>
            assertEqual(F.createUser({ name: "Аня", age: 20, email: "a@a.ru" }),
                "Пользователь: Аня, возраст: 20, email: a@a.ru"));
        it("без email — значение по умолчанию", () =>
            assertEqual(F.createUser({ name: "Иван", age: 30 }),
                "Пользователь: Иван, возраст: 30, email: не указан"));
        it("age = 0 допустим", () =>
            assertEqual(F.createUser({ name: "Малыш", age: 0 }),
                "Пользователь: Малыш, возраст: 0, email: не указан"));
        it("без аргументов → TypeError", () => assertThrows(() => F.createUser(), TypeError));
        it("пустое имя → TypeError", () => {
            assertThrows(() => F.createUser({ name: "", age: 1 }), TypeError);
            assertThrows(() => F.createUser({ name: "   ", age: 1 }), TypeError);
        });
        it("некорректный возраст → TypeError", () => {
            assertThrows(() => F.createUser({ name: "A", age: "20" }), TypeError);
            assertThrows(() => F.createUser({ name: "A", age: -5 }), TypeError);
            assertThrows(() => F.createUser({ name: "A", age: NaN }), TypeError);
        });
    });

    describe("secretMessage", () => {
        it("верный пароль", () => assertEqual(F.secretMessage("123", "тайна")("123"), "тайна"));
        it("неверный пароль", () => assertEqual(F.secretMessage("123", "тайна")("321"), "Доступ запрещен"));
        it("вызов без пароля", () => assertEqual(F.secretMessage("123", "тайна")(), "Доступ запрещен"));
        it("регистр важен", () => assertEqual(F.secretMessage("Abc", "x")("abc"), "Доступ запрещен"));
        it("сравнение строгое ('1' !== 1)", () => assertEqual(F.secretMessage(1, "x")("1"), "Доступ запрещен"));
        it("несколько независимых сейфов", () => {
            const a = F.secretMessage("a", "A"), b = F.secretMessage("b", "B");
            assertEqual([a("a"), a("b"), b("b"), b("a")], ["A", "Доступ запрещен", "B", "Доступ запрещен"]);
        });
        it("можно вызывать много раз", () => {
            const s = F.secretMessage("p", "m");
            assertEqual([s("p"), s("p"), s("x"), s("p")], ["m", "m", "Доступ запрещен", "m"]);
        });
    });

    describe("compose / pipe", () => {
        const inc = (x) => x + 1, dbl = (x) => x * 2;
        it("справа налево", () => assertEqual(F.compose(inc, dbl)(5), 11));
        it("pipe — слева направо", () => assertEqual(F.pipe(inc, dbl)(5), 12));
        it("одна функция", () => assertEqual(F.compose(dbl)(4), 8));
        it("без функций — тождественная", () => assertEqual(F.compose()(42), 42));
        it("первая функция может принимать несколько аргументов", () =>
            assertEqual(F.compose(dbl, (a, b) => a + b)(2, 3), 10));
        it("три функции", () => assertEqual(F.compose(String, inc, dbl)(2), "5"));
        it("не-функция → TypeError", () => assertThrows(() => F.compose(inc, 5), TypeError));
    });

    describe("myMap", () => {
        it("как Array.map", () => assertEqual(F.myMap([1, 2, 3], (x) => x * 2), [2, 4, 6]));
        it("пустой массив", () => assertEqual(F.myMap([], (x) => x), []));
        it("callback получает (item, index, array)", () => {
            const arr = ["a", "b"], calls = [];
            F.myMap(arr, (v, i, a) => calls.push([v, i, a === arr]));
            assertEqual(calls, [["a", 0, true], ["b", 1, true]]);
        });
        it("не мутирует исходный массив", () => {
            const arr = [1, 2];
            F.myMap(arr, (x) => x + 1);
            assertEqual(arr, [1, 2]);
        });
        it("сохраняет «дырки» как нативный map", () => {
            const sparse = [1, , 3];
            const r = F.myMap(sparse, (x) => x * 2);
            assertEqual(r.length, 3);
            assertTrue(!(1 in r), "дырка должна остаться дыркой");
            assertEqual(r[2], 6);
        });
        it("результат совпадает с Array.prototype.map", () => {
            const data = [3, -1, 0, 7, 2.5];
            assertEqual(F.myMap(data, (x, i) => x * i), data.map((x, i) => x * i));
        });
        it("не-функция → TypeError", () => assertThrows(() => F.myMap([1], null), TypeError));
        it("не-массив → TypeError", () => assertThrows(() => F.myMap("abc", (x) => x), TypeError));
    });

    describe("myFilter", () => {
        it("как Array.filter", () => assertEqual(F.myFilter([1, 2, 3, 4], (x) => x % 2 === 0), [2, 4]));
        it("ничего не подошло", () => assertEqual(F.myFilter([1, 3], (x) => x % 2 === 0), []));
        it("всё подошло", () => assertEqual(F.myFilter([1, 2], () => true), [1, 2]));
        it("пустой массив", () => assertEqual(F.myFilter([], () => true), []));
        it("callback получает index и array", () => {
            const arr = [10, 20, 30];
            assertEqual(F.myFilter(arr, (v, i, a) => i > 0 && a === arr), [20, 30]);
        });
        it("falsy-значения в массиве обрабатываются через callback", () =>
            assertEqual(F.myFilter([0, "", null, 1, "a"], Boolean), [1, "a"]));
        it("пропускает дырки", () => assertEqual(F.myFilter([1, , 3], () => true), [1, 3]));
        it("не-функция → TypeError", () => assertThrows(() => F.myFilter([1], 1), TypeError));
    });

    describe("myReduce", () => {
        it("сумма с начальным значением", () => assertEqual(F.myReduce([1, 2, 3], (a, x) => a + x, 10), 16));
        it("сумма без начального значения", () => assertEqual(F.myReduce([1, 2, 3], (a, x) => a + x), 6));
        it("пустой массив с initialValue", () => assertEqual(F.myReduce([], (a, x) => a + x, 7), 7));
        it("пустой массив без initialValue → TypeError", () =>
            assertThrows(() => F.myReduce([], (a, x) => a + x), TypeError));
        it("один элемент без initialValue — callback не вызывается", () => {
            let called = false;
            const r = F.myReduce([5], () => { called = true; });
            assertEqual(r, 5);
            assertTrue(!called);
        });
        it("initialValue = undefined считается переданным", () =>
            assertEqual(F.myReduce([1], (a, x) => (a === undefined ? "u" : "n") + x, undefined), "u1"));
        it("initialValue = 0 / null / ''", () => {
            assertEqual(F.myReduce([1, 2], (a, x) => a + x, 0), 3);
            assertEqual(F.myReduce(["a"], (a, x) => a + x, ""), "a");
        });
        it("callback получает (acc, item, index, array)", () => {
            const idx = [];
            F.myReduce([5, 6, 7], (a, x, i) => { idx.push(i); return a; }, 0);
            assertEqual(idx, [0, 1, 2]);
            const idx2 = [];
            F.myReduce([5, 6, 7], (a, x, i) => { idx2.push(i); return a; });
            assertEqual(idx2, [1, 2]);
        });
        it("строит объект (группировка)", () =>
            assertEqual(F.myReduce(["a", "bb", "cc"], (acc, s) => { (acc[s.length] ||= []).push(s); return acc; }, {}),
                { 1: ["a"], 2: ["bb", "cc"] }));
        it("совпадает с Array.prototype.reduce", () => {
            const d = [4, 8, 15, 16, 23, 42];
            assertEqual(F.myReduce(d, (a, x) => a * 2 + x), d.reduce((a, x) => a * 2 + x));
        });
        it("не-функция → TypeError", () => assertThrows(() => F.myReduce([1], 0, 0), TypeError));
    });

    describe("рекурсия: factorial, flattenDeep", () => {
        it("factorial(0) = 1, factorial(1) = 1", () => assertEqual([F.factorial(0), F.factorial(1)], [1, 1]));
        it("factorial(5) = 120", () => assertEqual(F.factorial(5), 120));
        it("factorial(10) = 3628800", () => assertEqual(F.factorial(10), 3628800));
        it("отрицательное / дробное → RangeError", () => {
            assertThrows(() => F.factorial(-1), RangeError);
            assertThrows(() => F.factorial(1.5), RangeError);
        });
        it("flattenDeep: вложенность", () => assertEqual(F.flattenDeep([1, [2, [3, [4]], 5]]), [1, 2, 3, 4, 5]));
        it("flattenDeep: пустые вложенные массивы", () => assertEqual(F.flattenDeep([[], [[]], 1]), [1]));
        it("flattenDeep: плоский массив не меняется", () => assertEqual(F.flattenDeep([1, 2]), [1, 2]));
    });

    describe("curry", () => {
        const add3 = (a, b, c) => a + b + c;
        it("по одному аргументу", () => assertEqual(F.curry(add3)(1)(2)(3), 6));
        it("несколько аргументов за раз", () => {
            const c = F.curry(add3);
            assertEqual([c(1, 2, 3), c(1, 2)(3), c(1)(2, 3), c(1)(2)(3)], [6, 6, 6, 6]);
        });
        it("промежуточные функции переиспользуются", () => {
            const add1 = F.curry(add3)(1);
            assertEqual([add1(2)(3), add1(10)(10)], [6, 21]);
        });
        it("функция без аргументов вызывается сразу", () => assertEqual(F.curry(() => 42)(), 42));
        it("функция с одним аргументом", () => assertEqual(F.curry((x) => x * 2)(4), 8));
        it("лишние аргументы передаются в fn", () => assertEqual(F.curry((a, b) => [a, b])(1, 2, 3), [1, 2]));
        it("не-функция → TypeError", () => assertThrows(() => F.curry(1), TypeError));
    });

    describe("memoize", () => {
        it("повторный вызов берётся из кэша", () => {
            let calls = 0;
            const sq = F.memoize((x) => { calls++; return x * x; });
            assertEqual([sq(4), sq(4), sq(4)], [16, 16, 16]);
            assertEqual(calls, 1);
        });
        it("разные аргументы — разные записи", () => {
            let calls = 0;
            const add = F.memoize((a, b) => { calls++; return a + b; });
            add(1, 2); add(2, 1); add(1, 2);
            assertEqual(calls, 2);
        });
        it("кэширует undefined и falsy-результаты", () => {
            let calls = 0;
            const f = F.memoize(() => { calls++; return undefined; });
            f(); f();
            assertEqual(calls, 1);
            let c2 = 0;
            const g = F.memoize((x) => { c2++; return 0; });
            g(1); g(1);
            assertEqual(c2, 1);
        });
        it("число 1 и строка '1' различаются", () => {
            const f = F.memoize((x) => typeof x);
            assertEqual([f(1), f("1")], ["number", "string"]);
        });
        it("объекты как аргументы (по содержимому)", () => {
            let calls = 0;
            const f = F.memoize((o) => { calls++; return o.a; });
            f({ a: 1 }); f({ a: 1 });
            assertEqual(calls, 1);
        });
        it("циклическая структура не ломает функцию", () => {
            const o = {}; o.self = o;
            const f = F.memoize(() => "ok");
            assertEqual(f(o), "ok");
        });
        it("ошибки не кэшируются", () => {
            let n = 0;
            const f = F.memoize(() => { n++; if (n === 1) throw new Error("fail"); return "ok"; });
            assertThrows(() => f());
            assertEqual(f(), "ok");
        });
        it("clear() сбрасывает кэш", () => {
            let calls = 0;
            const f = F.memoize((x) => { calls++; return x; });
            f(1); f.clear(); f(1);
            assertEqual(calls, 2);
        });
        it("быстрый рекурсивный fib(80)", () => {
            const fib = F.memoize((n) => (n < 2 ? n : fib(n - 1) + fib(n - 2)));
            assertEqual(fib(80), 23416728348467685);
        });
    });

    describe("debounce", () => {
        it("несколько быстрых вызовов → один, с последними аргументами", async () => {
            const calls = [];
            const d = F.debounce((x) => calls.push(x), 40);
            d(1); d(2); d(3);
            assertEqual(calls.length, 0, "сразу вызова быть не должно:");
            await sleep(100);
            assertEqual(calls, [3]);
        });
        it("вызовы с паузой больше delay срабатывают отдельно", async () => {
            let n = 0;
            const d = F.debounce(() => n++, 30);
            d(); await sleep(70); d(); await sleep(70);
            assertEqual(n, 2);
        });
        it("каждый новый вызов сдвигает таймер", async () => {
            let n = 0;
            const d = F.debounce(() => n++, 60);
            d(); await sleep(35); d(); await sleep(35);
            assertEqual(n, 0, "после 70мс ещё не должно сработать:");
            await sleep(60);
            assertEqual(n, 1);
        });
        it("cancel() отменяет отложенный вызов", async () => {
            let n = 0;
            const d = F.debounce(() => n++, 30);
            d(); d.cancel(); await sleep(70);
            assertEqual(n, 0);
        });
        it("сохраняет this", async () => {
            let ctx;
            const obj = { d: F.debounce(function () { ctx = this; }, 20) };
            obj.d(); await sleep(50);
            assertTrue(ctx === obj, "this потерян");
        });
    });

    describe("throttle", () => {
        it("первый вызов — сразу", () => {
            let n = 0;
            const t = F.throttle(() => n++, 50);
            t();
            assertEqual(n, 1);
            t.cancel();
        });
        it("серия быстрых вызовов: сразу + один в конце окна (последние аргументы)", async () => {
            const calls = [];
            const t = F.throttle((x) => calls.push(x), 60);
            t(1); t(2); t(3); t(4);
            assertEqual(calls, [1]);
            await sleep(120);
            assertEqual(calls, [1, 4]);
        });
        it("после паузы снова срабатывает сразу", async () => {
            let n = 0;
            const t = F.throttle(() => n++, 40);
            t(); await sleep(80); t();
            assertEqual(n, 2);
        });
        it("за время работы вызовов не больше, чем interval позволяет", async () => {
            let n = 0;
            const t = F.throttle(() => n++, 50);
            const start = Date.now();
            while (Date.now() - start < 220) { t(); await sleep(5); }
            await sleep(70);
            assertTrue(n <= 6 && n >= 3, `вызовов: ${n}`);
        });
        it("cancel() отменяет отложенный вызов", async () => {
            let n = 0;
            const t = F.throttle(() => n++, 40);
            t(); t(); t.cancel(); await sleep(80);
            assertEqual(n, 1);
        });
    });

    describe("createValidator", () => {
        const v = F.createValidator({ minLength: 6 });
        it("корректный пароль", () => assertEqual(v("Abcde1"), { valid: true, errors: [] }));
        it("слишком короткий", () => {
            const r = v("Ab1");
            assertTrue(!r.valid && r.errors.length === 1);
        });
        it("нет цифры", () => assertEqual(v("Abcdefg").valid, false));
        it("нет заглавной", () => assertEqual(v("abcdef1").valid, false));
        it("несколько ошибок сразу", () => assertEqual(v("abc").errors.length, 3));
        it("граница длины: ровно minLength", () => assertEqual(v("Abcde1").valid, true));
        it("пустая строка", () => assertEqual(v("").valid, false));
        it("кириллические заглавные", () => assertEqual(v("Пароль1").valid, true));
        it("не строка → invalid, без исключения", () => {
            assertEqual(v(12345).valid, false);
            assertEqual(v(null).valid, false);
            assertEqual(v(undefined).valid, false);
        });
        it("значения по умолчанию (minLength 8)", () => {
            const d = F.createValidator();
            assertEqual([d("Abcdef1").valid, d("Abcdefg1").valid], [false, true]);
        });
        it("отключение правил", () => {
            const lax = F.createValidator({ minLength: 0, requireDigit: false, requireUppercase: false });
            assertEqual(lax("").valid, true);
        });
        it("некорректный minLength → RangeError", () => {
            assertThrows(() => F.createValidator({ minLength: -1 }), RangeError);
            assertThrows(() => F.createValidator({ minLength: "5" }), RangeError);
        });
        it("валидаторы независимы", () => {
            const a = F.createValidator({ minLength: 3 }), b = F.createValidator({ minLength: 10 });
            assertEqual([a("Ab1").valid, b("Ab1").valid], [true, false]);
        });
    });

    /* ---------- запуск ---------- */
    async function runAll() {
        const out = [];
        let passed = 0, failed = 0;
        for (const s of suites) {
            const res = { name: s.name, items: [] };
            for (const t of s.tests) {
                try { await t.fn(); passed++; res.items.push({ name: t.name, ok: true }); }
                catch (e) { failed++; res.items.push({ name: t.name, ok: false, error: e.message }); }
            }
            out.push(res);
        }
        return { out, passed, failed };
    }

    function report({ out, passed, failed }) {
        if (typeof document !== "undefined" && document.getElementById("results")) {
            const root = document.getElementById("results");
            root.innerHTML = "";
            const summary = document.createElement("p");
            summary.className = "summary " + (failed ? "bad" : "good");
            summary.textContent = `Пройдено: ${passed}, провалено: ${failed}`;
            root.appendChild(summary);
            for (const s of out) {
                const h = document.createElement("h3");
                h.textContent = s.name;
                root.appendChild(h);
                const ul = document.createElement("ul");
                for (const i of s.items) {
                    const li = document.createElement("li");
                    li.className = i.ok ? "ok" : "fail";
                    li.textContent = (i.ok ? "✓ " : "✗ ") + i.name + (i.ok ? "" : " — " + i.error);
                    ul.appendChild(li);
                }
                root.appendChild(ul);
            }
        }
        for (const s of out) {
            console.log("\n" + s.name);
            for (const i of s.items) console.log((i.ok ? "  ✓ " : "  ✗ ") + i.name + (i.ok ? "" : "\n      " + i.error));
        }
        console.log(`\nПройдено: ${passed}, провалено: ${failed}`);
    }

    if (typeof window !== "undefined") {
        window.runTests = () => runAll().then(report);
        if (typeof document !== "undefined" && document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => window.runTests());
        } else {
            window.runTests();
        }
    } else {
        runAll().then((r) => { report(r); if (r.failed) process.exitCode = 1; });
    }
})();
