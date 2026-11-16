// =====================================================================
// dom-tests.js — тесты для dom-tasks.js
// Запускаются автоматически после загрузки страницы.
// Результаты: в консоли и в блоке #test-results внизу страницы.
//
// Как это работает: на время тестов настоящий .container убирается из
// документа и заменяется «чистой» копией разметки (FIXTURE). Каждый тест
// получает свежий DOM, поэтому тесты не зависят друг от друга и не портят
// страницу. После тестов исходный DOM (с обработчиками) возвращается.
// =====================================================================

(function () {
    'use strict';

    // ---------- Мини-фреймворк ----------

    const tests = [];

    function test(name, fn) {
        tests.push({ name, fn });
    }

    function assert(condition, message) {
        if (!condition) throw new Error(message || 'Assertion failed');
    }

    function assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(
                `${message || 'Значения не равны'}: ожидалось ${JSON.stringify(expected)}, получено ${JSON.stringify(actual)}`
            );
        }
    }

    function assertDeepEqual(actual, expected, message) {
        const a = JSON.stringify(actual);
        const e = JSON.stringify(expected);
        if (a !== e) throw new Error(`${message || 'Объекты не равны'}: ожидалось ${e}, получено ${a}`);
    }

    function assertThrows(fn, ErrorType, message) {
        try {
            fn();
        } catch (err) {
            if (ErrorType && !(err instanceof ErrorType)) {
                throw new Error(`${message || 'Неверный тип ошибки'}: получено ${err.name}`);
            }
            return;
        }
        throw new Error(message || 'Ожидалось исключение, но его не было');
    }

    // ---------- Вспомогательные функции ----------

    const FIXTURE = `
    <div class="container">
        <header id="main-header"><h1>Тест</h1></header>
        <section id="tasks-section">
            <div class="task-area" id="task1"><div class="target" id="target1"></div></div>
            <div class="task-area" id="task2">
                <div class="family-tree">
                    <div class="parent" id="parent-element">
                        Родительский элемент
                        <div class="child">Дочерний элемент 1</div>
                        <div class="child">Дочерний элемент 2</div>
                        <div class="child special">Особый дочерний элемент</div>
                    </div>
                </div>
            </div>
            <div class="task-area" id="task3">
                <div class="style-demo" id="style-target">Этот элемент будет стилизоваться</div>
                <button id="toggle-style">Переключить стиль</button>
            </div>
            <div class="task-area" id="task4">
                <button id="click-btn">Нажми меня</button>
                <div id="click-counter">Кликов: 0</div>
                <input type="text" id="text-input">
                <div id="input-display"></div>
            </div>
            <div class="task-area" id="task5">
                <input type="text" id="item-input">
                <button id="add-item">Добавить</button>
                <button id="clear-list">Очистить</button>
                <ul id="dynamic-list"></ul>
            </div>
            <div class="task-area" id="task6">
                <form id="user-form">
                    <div><input type="text" id="user-name" required></div>
                    <div><input type="email" id="user-email" required></div>
                    <div><input type="number" id="user-age" min="1" max="120"></div>
                    <button type="submit">Отправить</button>
                </form>
                <div id="form-output"></div>
            </div>
        </section>
    </div>`;

    const $ = (id) => document.getElementById(id);

    function click(el) {
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    }

    function typeInto(el, value) {
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
    }

    function fillForm(name, email, age) {
        $('user-name').value = name;
        $('user-email').value = email;
        $('user-age').value = age;
    }

    function hexToRgb(hex) {
        const n = parseInt(hex.slice(1), 16);
        return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
    }

    // Подменяет console.log на время вызова fn и возвращает записанные вызовы
    function captureLog(fn) {
        const original = console.log;
        const calls = [];
        console.log = (...args) => calls.push(args.join(' '));
        try {
            fn();
        } finally {
            console.log = original;
        }
        return calls;
    }

    // Подменяет Math.random на время вызова fn
    function withRandom(value, fn) {
        const original = Math.random;
        Math.random = () => value;
        try {
            return fn();
        } finally {
            Math.random = original;
        }
    }

    // =================================================================
    // ТЕСТЫ
    // =================================================================

    // ---------- Задание 1: создание элементов ----------

    test('createCard: создает div.card с h4 и p внутри #target1', () => {
        const card = createCard('Заголовок', 'Текст');
        assertEqual(card.tagName, 'DIV');
        assert(card.classList.contains('card'), 'нет класса card');
        assertEqual(card.parentElement, $('target1'), 'карточка не в #target1');
        assertEqual(card.children.length, 2);
        assertEqual(card.children[0].tagName, 'H4');
        assertEqual(card.children[0].textContent, 'Заголовок');
        assertEqual(card.children[1].tagName, 'P');
        assertEqual(card.children[1].textContent, 'Текст');
    });

    test('createCard: повторные вызовы добавляют карточки, а не заменяют', () => {
        createCard('A', 'a');
        createCard('B', 'b');
        assertEqual($('target1').querySelectorAll('.card').length, 2);
    });

    test('createCard: HTML в аргументах не разбирается (защита от XSS)', () => {
        const card = createCard('<img src=x onerror=alert(1)>', '<b>жирный</b>');
        assertEqual(card.querySelectorAll('img, b').length, 0, 'внутри появились HTML-теги');
        assertEqual(card.children[0].textContent, '<img src=x onerror=alert(1)>');
        assertEqual(card.children[1].textContent, '<b>жирный</b>');
    });

    test('createCard: пустые строки не ломают функцию', () => {
        const card = createCard('', '');
        assertEqual(card.children[0].textContent, '');
        assertEqual(card.children[1].textContent, '');
    });

    test('createCard: если #target1 нет в DOM — возвращает null без ошибки', () => {
        $('target1').remove();
        assertEqual(createCard('a', 'b'), null);
    });

    test('createList: создает ol с нужным числом li в #target1', () => {
        const ol = createList(['один', 'два', 'три']);
        assertEqual(ol.tagName, 'OL');
        assertEqual(ol.parentElement, $('target1'));
        assertEqual(ol.children.length, 3);
        assertEqual(ol.children[1].tagName, 'LI');
        assertEqual(ol.children[1].textContent, 'два');
    });

    test('createList: порядок элементов сохраняется', () => {
        const ol = createList(['c', 'a', 'b']);
        assertDeepEqual([...ol.children].map((li) => li.textContent), ['c', 'a', 'b']);
    });

    test('createList: пустой массив — пустой ol', () => {
        const ol = createList([]);
        assertEqual(ol.tagName, 'OL');
        assertEqual(ol.children.length, 0);
    });

    test('createList: числа и спецсимволы превращаются в текст', () => {
        const ol = createList([42, 0, '<i>x</i>']);
        assertEqual(ol.children[0].textContent, '42');
        assertEqual(ol.children[1].textContent, '0');
        assertEqual(ol.querySelectorAll('i').length, 0, 'HTML был разобран');
    });

    test('createList: не массив — TypeError', () => {
        assertThrows(() => createList('строка'), TypeError);
        assertThrows(() => createList(null), TypeError);
        assertThrows(() => createList(undefined), TypeError);
    });

    // ---------- Задание 2: навигация ----------

    test('countChildren: считает только элементы (3), текстовые узлы игнорируются', () => {
        assertEqual(countChildren(), 3);
    });

    test('countChildren: реагирует на добавление и удаление детей', () => {
        const parent = $('parent-element');
        parent.appendChild(document.createElement('span'));
        assertEqual(countChildren(), 4);
        parent.replaceChildren();
        assertEqual(countChildren(), 0);
    });

    test('countChildren: нет #parent-element — 0', () => {
        $('parent-element').remove();
        assertEqual(countChildren(), 0);
    });

    test('findSpecialChild: возвращает текст .special', () => {
        assertEqual(findSpecialChild(), 'Особый дочерний элемент');
    });

    test('findSpecialChild: нет .special — null', () => {
        document.querySelector('.special').classList.remove('special');
        assertEqual(findSpecialChild(), null);
    });

    test('findSpecialChild: находит вложенный (не прямой) потомок', () => {
        document.querySelector('.special').classList.remove('special');
        const wrapper = document.createElement('div');
        wrapper.innerHTML = '<span class="special">  вложенный  </span>';
        $('parent-element').appendChild(wrapper);
        assertEqual(findSpecialChild(), 'вложенный');
    });

    test('getParentBackground: цвет фона родителя (#3498db)', () => {
        assertEqual(getParentBackground(), 'rgb(52, 152, 219)');
    });

    test('getParentBackground: учитывает изменение стиля родителя', () => {
        $('parent-element').style.backgroundColor = 'rgb(1, 2, 3)';
        assertEqual(getParentBackground(), 'rgb(1, 2, 3)');
    });

    test('getParentBackground: нет .child — null', () => {
        document.querySelectorAll('.child').forEach((c) => c.remove());
        assertEqual(getParentBackground(), null);
    });

    // ---------- Задание 3: классы и стили ----------

    test('setupStyleToggle: клик включает и выключает active-style', () => {
        setupStyleToggle();
        const target = $('style-target');
        assert(!target.classList.contains('active-style'), 'класс есть до клика');
        click($('toggle-style'));
        assert(target.classList.contains('active-style'), 'класс не добавился');
        click($('toggle-style'));
        assert(!target.classList.contains('active-style'), 'класс не убрался');
    });

    test('setupStyleToggle: повторный вызов не дублирует обработчик', () => {
        setupStyleToggle();
        setupStyleToggle();
        click($('toggle-style'));
        assert($('style-target').classList.contains('active-style'), 'двойной обработчик отменил переключение');
    });

    test('setupStyleToggle: не трогает другие классы элемента', () => {
        setupStyleToggle();
        click($('toggle-style'));
        assert($('style-target').classList.contains('style-demo'), 'потерян класс style-demo');
    });

    test('changeHeaderColor: возвращает корректный hex и применяет его к header', () => {
        const color = changeHeaderColor();
        assert(/^#[0-9a-f]{6}$/i.test(color), `неверный формат цвета: ${color}`);
        assertEqual(document.querySelector('header').style.backgroundColor, hexToRgb(color));
    });

    test('changeHeaderColor: граничные значения Math.random (0 → #000000)', () => {
        assertEqual(withRandom(0, changeHeaderColor), '#000000');
    });

    test('changeHeaderColor: граничные значения Math.random (≈1 → #ffffff)', () => {
        assertEqual(withRandom(0.9999999999, changeHeaderColor), '#ffffff');
    });

    test('changeHeaderColor: малые значения дополняются нулями до 6 знаков', () => {
        const color = withRandom(0.00001, changeHeaderColor);   // ≈ 167 → 0000a7
        assertEqual(color.length, 7);
        assert(color.startsWith('#0000'), `нет ведущих нулей: ${color}`);
    });

    test('changeHeaderColor: цвета разные при разных вызовах', () => {
        const a = withRandom(0.2, changeHeaderColor);
        const b = withRandom(0.7, changeHeaderColor);
        assert(a !== b, 'цвет не изменился');
    });

    test('animateElement: во время анимации меняются размер и прозрачность', () => {
        const el = $('style-target');
        animateElement(40);
        assert(parseFloat(el.style.opacity) < 1, 'прозрачность не изменилась');
        assert(el.style.transform.includes('scale'), 'размер не изменился');
    });

    test('animateElement: после анимации стили возвращаются', async () => {
        const el = $('style-target');
        const result = await animateElement(40);
        assertEqual(result, true);
        assertEqual(el.style.opacity, '');
        assertEqual(el.style.transform, '');
    });

    test('animateElement: нет #style-target — Promise<false> без ошибки', async () => {
        $('style-target').remove();
        assertEqual(await animateElement(10), false);
    });

    // ---------- Задание 4: события ----------

    test('setupClickCounter: считает клики и обновляет текст', () => {
        setupClickCounter();
        assertEqual($('click-counter').textContent, 'Кликов: 0');
        click($('click-btn'));
        click($('click-btn'));
        click($('click-btn'));
        assertEqual($('click-counter').textContent, 'Кликов: 3');
    });

    test('setupClickCounter: двойная настройка не удваивает счёт', () => {
        setupClickCounter();
        setupClickCounter();
        click($('click-btn'));
        assertEqual($('click-counter').textContent, 'Кликов: 1');
    });

    test('setupClickCounter: много кликов (100)', () => {
        setupClickCounter();
        for (let i = 0; i < 100; i++) click($('click-btn'));
        assertEqual($('click-counter').textContent, 'Кликов: 100');
    });

    test('setupInputDisplay: текст отображается в реальном времени', () => {
        setupInputDisplay();
        typeInto($('text-input'), 'Привет');
        assertEqual($('input-display').textContent, 'Привет');
        typeInto($('text-input'), 'Привет, мир');
        assertEqual($('input-display').textContent, 'Привет, мир');
    });

    test('setupInputDisplay: очистка поля очищает вывод', () => {
        setupInputDisplay();
        typeInto($('text-input'), 'abc');
        typeInto($('text-input'), '');
        assertEqual($('input-display').textContent, '');
    });

    test('setupInputDisplay: HTML не интерпретируется', () => {
        setupInputDisplay();
        typeInto($('text-input'), '<b>жирный</b>');
        assertEqual($('input-display').children.length, 0, 'HTML был разобран');
        assertEqual($('input-display').textContent, '<b>жирный</b>');
    });

    test('setupInputDisplay: пробелы и юникод сохраняются', () => {
        setupInputDisplay();
        typeInto($('text-input'), '  😀 тест  ');
        assertEqual($('input-display').textContent, '  😀 тест  ');
    });

    test('setupKeyboardEvents: keydown и keyup пишут код и символ клавиши в консоль', () => {
        setupKeyboardEvents();
        const logs = captureLog(() => {
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', code: 'KeyA' }));
            document.dispatchEvent(new KeyboardEvent('keyup', { key: 'a', code: 'KeyA' }));
        });
        assertEqual(logs.length, 2);
        assert(logs[0].includes('keydown') && logs[0].includes('KeyA') && logs[0].includes('a'), `лог keydown: ${logs[0]}`);
        assert(logs[1].includes('keyup') && logs[1].includes('KeyA'), `лог keyup: ${logs[1]}`);
    });

    test('setupKeyboardEvents: повторный вызов не дублирует логи', () => {
        setupKeyboardEvents();
        setupKeyboardEvents();
        const logs = captureLog(() => {
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter' }));
        });
        assertEqual(logs.length, 1);
    });

    test('setupKeyboardEvents: специальные клавиши (Escape, пробел)', () => {
        setupKeyboardEvents();
        const logs = captureLog(() => {
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape' }));
            document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space' }));
        });
        assert(logs[0].includes('Escape'));
        assert(logs[1].includes('Space'));
    });

    // ---------- Задание 5: динамические списки ----------

    test('addListItem: добавляет li.list-item с текстом и кнопкой удаления', () => {
        $('item-input').value = 'Молоко';
        const li = addListItem();
        assertEqual(li.tagName, 'LI');
        assert(li.classList.contains('list-item'), 'нет класса list-item');
        assertEqual(li.parentElement, $('dynamic-list'));
        assert(li.textContent.includes('Молоко'), 'нет текста');
        const btn = li.querySelector('button');
        assert(btn !== null, 'нет кнопки удаления');
        assert(btn.classList.contains('delete-btn'), 'у кнопки нет класса delete-btn');
    });

    test('addListItem: очищает поле ввода', () => {
        $('item-input').value = 'Хлеб';
        addListItem();
        assertEqual($('item-input').value, '');
    });

    test('addListItem: пустая строка и пробелы не добавляются', () => {
        $('item-input').value = '';
        assertEqual(addListItem(), null);
        $('item-input').value = '     ';
        assertEqual(addListItem(), null);
        assertEqual($('dynamic-list').children.length, 0);
    });

    test('addListItem: пробелы по краям обрезаются', () => {
        $('item-input').value = '   сыр   ';
        const li = addListItem();
        assertEqual(li.querySelector('span').textContent, 'сыр');
    });

    test('addListItem: HTML в значении не разбирается', () => {
        $('item-input').value = '<script>alert(1)</script><b>x</b>';
        const li = addListItem();
        assertEqual(li.querySelectorAll('script, b').length, 0, 'HTML был разобран');
    });

    test('addListItem: одинаковые значения допускаются, порядок сохраняется', () => {
        ['один', 'один', 'два'].forEach((v) => {
            $('item-input').value = v;
            addListItem();
        });
        const texts = [...$('dynamic-list').children].map((li) => li.querySelector('span').textContent);
        assertDeepEqual(texts, ['один', 'один', 'два']);
    });

    test('removeListItem: клик по кнопке удаляет родительский li', () => {
        $('item-input').value = 'x';
        const li = addListItem();
        const result = removeListItem({ target: li.querySelector('button') });
        assertEqual(result, true);
        assertEqual($('dynamic-list').children.length, 0);
    });

    test('removeListItem: клик не по кнопке ничего не удаляет', () => {
        $('item-input').value = 'x';
        const li = addListItem();
        assertEqual(removeListItem({ target: li.querySelector('span') }), false);
        assertEqual(removeListItem({ target: li }), false);
        assertEqual($('dynamic-list').children.length, 1);
    });

    test('removeListItem: некорректное событие не вызывает ошибок', () => {
        assertEqual(removeListItem(undefined), false);
        assertEqual(removeListItem({}), false);
        assertEqual(removeListItem({ target: null }), false);
        assertEqual(removeListItem({ target: document }), false);
    });

    test('removeListItem: удаляется только нужный элемент', () => {
        ['a', 'b', 'c'].forEach((v) => {
            $('item-input').value = v;
            addListItem();
        });
        const middle = $('dynamic-list').children[1];
        removeListItem({ target: middle.querySelector('button') });
        const texts = [...$('dynamic-list').children].map((li) => li.querySelector('span').textContent);
        assertDeepEqual(texts, ['a', 'c']);
    });

    test('clearList: очищает все элементы', () => {
        ['a', 'b', 'c'].forEach((v) => {
            $('item-input').value = v;
            addListItem();
        });
        clearList();
        assertEqual($('dynamic-list').children.length, 0);
    });

    test('clearList: пустой список не вызывает ошибок', () => {
        clearList();
        clearList();
        assertEqual($('dynamic-list').children.length, 0);
    });

    test('setupListEvents: кнопка «Добавить» добавляет элемент', () => {
        setupListEvents();
        $('item-input').value = 'тест';
        click($('add-item'));
        assertEqual($('dynamic-list').children.length, 1);
    });

    test('setupListEvents: Enter в поле ввода добавляет элемент', () => {
        setupListEvents();
        $('item-input').value = 'enter';
        $('item-input').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        assertEqual($('dynamic-list').children.length, 1);
    });

    test('setupListEvents: другие клавиши не добавляют элемент', () => {
        setupListEvents();
        $('item-input').value = 'abc';
        $('item-input').dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
        assertEqual($('dynamic-list').children.length, 0);
    });

    test('setupListEvents: делегирование — удаление работает и для новых элементов', () => {
        setupListEvents();
        ['a', 'b'].forEach((v) => {
            $('item-input').value = v;
            click($('add-item'));
        });
        click($('dynamic-list').children[0].querySelector('button'));
        assertEqual($('dynamic-list').children.length, 1);
        // элемент, добавленный ПОСЛЕ первого удаления, тоже удаляется
        $('item-input').value = 'c';
        click($('add-item'));
        click($('dynamic-list').lastElementChild.querySelector('button'));
        assertEqual($('dynamic-list').children.length, 1);
    });

    test('setupListEvents: клик по тексту элемента его не удаляет', () => {
        setupListEvents();
        $('item-input').value = 'a';
        click($('add-item'));
        click($('dynamic-list').children[0].querySelector('span'));
        assertEqual($('dynamic-list').children.length, 1);
    });

    test('setupListEvents: кнопка «Очистить» очищает список', () => {
        setupListEvents();
        ['a', 'b'].forEach((v) => {
            $('item-input').value = v;
            click($('add-item'));
        });
        click($('clear-list'));
        assertEqual($('dynamic-list').children.length, 0);
    });

    test('setupListEvents: двойная настройка не дублирует добавление', () => {
        setupListEvents();
        setupListEvents();
        $('item-input').value = 'один раз';
        click($('add-item'));
        assertEqual($('dynamic-list').children.length, 1);
    });

    // ---------- Задание 6: формы ----------

    const VALID = { name: 'Иван', email: 'ivan@example.com', age: '25' };

    test('validateForm: корректные данные — null', () => {
        assertEqual(validateForm(VALID), null);
    });

    test('validateForm: возраст числом (не строкой) тоже подходит', () => {
        assertEqual(validateForm({ ...VALID, age: 25 }), null);
    });

    test('validateForm: пустое имя и имя из пробелов — ошибка', () => {
        assert(validateForm({ ...VALID, name: '' }).name, 'пустое имя принято');
        assert(validateForm({ ...VALID, name: '    ' }).name, 'имя из пробелов принято');
    });

    test('validateForm: имя — граница 1 и 2 символа', () => {
        assert(validateForm({ ...VALID, name: 'И' }).name, '1 символ принят');
        assertEqual(validateForm({ ...VALID, name: 'Ян' }), null);
        assert(validateForm({ ...VALID, name: ' Я ' }).name, 'пробелы засчитаны как символы');
    });

    test('validateForm: неверные email отклоняются', () => {
        ['', 'abc', 'a@b', 'a@b.', '@b.com', 'a@@b.com', 'a b@c.com', 'a@b .com', 'a@b.c'].forEach((email) => {
            assert(validateForm({ ...VALID, email }).email, `принят email: "${email}"`);
        });
    });

    test('validateForm: корректные email принимаются', () => {
        ['a@b.co', 'user.name+tag@example.com', 'x_y@sub.domain.org', ' ivan@example.com '].forEach((email) => {
            assertEqual(validateForm({ ...VALID, email }), null, `отклонен email: "${email}"`);
        });
    });

    test('validateForm: возраст — граничные значения 0, 1, 120, 121', () => {
        assert(validateForm({ ...VALID, age: '0' }).age, '0 принят');
        assertEqual(validateForm({ ...VALID, age: '1' }), null, '1 отклонен');
        assertEqual(validateForm({ ...VALID, age: '120' }), null, '120 отклонен');
        assert(validateForm({ ...VALID, age: '121' }).age, '121 принят');
    });

    test('validateForm: отрицательный, дробный, нечисловой и пустой возраст — ошибка', () => {
        ['-5', '25.5', '1e2', 'abc', '12abc', '', '   ', ' - '].forEach((age) => {
            assert(validateForm({ ...VALID, age }).age, `принят возраст: "${age}"`);
        });
        assert(validateForm({ ...VALID, age: null }).age, 'null принят');
        assert(validateForm({ ...VALID, age: undefined }).age, 'undefined принят');
        assert(validateForm({ ...VALID, age: NaN }).age, 'NaN принят');
    });

    test('validateForm: несколько ошибок сразу, ключи name / email / age', () => {
        const errors = validateForm({ name: '', email: 'bad', age: '500' });
        assertDeepEqual(Object.keys(errors).sort(), ['age', 'email', 'name']);
    });

    test('validateForm: ошибка только в одном поле — только один ключ', () => {
        assertDeepEqual(Object.keys(validateForm({ ...VALID, email: 'bad' })), ['email']);
    });

    test('validateForm: undefined / null / {} не бросают исключение и дают ошибки', () => {
        assertDeepEqual(Object.keys(validateForm(undefined)).sort(), ['age', 'email', 'name']);
        assertDeepEqual(Object.keys(validateForm(null)).sort(), ['age', 'email', 'name']);
        assertDeepEqual(Object.keys(validateForm({})).sort(), ['age', 'email', 'name']);
    });

    test('validateForm: принимает объект FormData', () => {
        const fd = new FormData();
        fd.append('name', 'Анна');
        fd.append('email', 'anna@example.com');
        fd.append('age', '30');
        assertEqual(validateForm(fd), null);
    });

    test('validateForm: не изменяет входной объект', () => {
        const data = { name: '  Иван ', email: 'ivan@example.com', age: '25' };
        const copy = { ...data };
        validateForm(data);
        assertDeepEqual(data, copy);
    });

    test('displayFormErrors: по одному .error-message на каждую ошибку', () => {
        displayFormErrors({ name: 'Ошибка имени', email: 'Ошибка email' });
        const items = $('form-output').querySelectorAll('.error-message');
        assertEqual(items.length, 2);
        assertEqual(items[0].textContent, 'Ошибка имени');
        assertEqual(items[1].textContent, 'Ошибка email');
    });

    test('displayFormErrors: предыдущие сообщения удаляются', () => {
        displayFormErrors({ name: 'a', email: 'b', age: 'c' });
        displayFormErrors({ age: 'только возраст' });
        assertEqual($('form-output').querySelectorAll('.error-message').length, 1);
    });

    test('displayFormErrors: очищает ранее показанный успех', () => {
        displayFormSuccess(VALID);
        displayFormErrors({ name: 'x' });
        assertEqual($('form-output').querySelectorAll('.success-message').length, 0);
    });

    test('displayFormErrors: null / пустой объект — вывод пуст', () => {
        displayFormErrors({ name: 'x' });
        displayFormErrors(null);
        assertEqual($('form-output').children.length, 0);
        displayFormErrors({});
        assertEqual($('form-output').children.length, 0);
    });

    test('displayFormErrors: HTML в тексте ошибки не разбирается', () => {
        displayFormErrors({ name: '<b>x</b>' });
        assertEqual($('form-output').querySelectorAll('b').length, 0);
    });

    test('displayFormSuccess: .success-message содержит имя, email и возраст', () => {
        displayFormSuccess(VALID);
        const box = $('form-output').querySelector('.success-message');
        assert(box !== null, 'нет .success-message');
        ['Иван', 'ivan@example.com', '25'].forEach((part) => {
            assert(box.textContent.includes(part), `нет "${part}" в выводе`);
        });
    });

    test('displayFormSuccess: повторный вызов заменяет предыдущий результат', () => {
        displayFormSuccess(VALID);
        displayFormSuccess({ ...VALID, name: 'Пётр' });
        assertEqual($('form-output').querySelectorAll('.success-message').length, 1);
        assert($('form-output').textContent.includes('Пётр'));
        assert(!$('form-output').textContent.includes('Иван'));
    });

    test('displayFormSuccess: HTML в данных не разбирается', () => {
        displayFormSuccess({ name: '<img src=x>', email: 'a@b.co', age: '5' });
        assertEqual($('form-output').querySelectorAll('img').length, 0);
    });

    test('handleFormSubmit: вызывает preventDefault', () => {
        let prevented = false;
        handleFormSubmit({ preventDefault: () => { prevented = true; } });
        assert(prevented, 'preventDefault не вызван');
    });

    test('handleFormSubmit: невалидные данные — ошибки на странице', () => {
        fillForm('', 'bad', '500');
        const result = handleFormSubmit({ preventDefault() {} });
        assertEqual(result.valid, false);
        assertEqual($('form-output').querySelectorAll('.error-message').length, 3);
        assertEqual($('form-output').querySelectorAll('.success-message').length, 0);
    });

    test('handleFormSubmit: валидные данные — сообщение об успехе', () => {
        fillForm('  Иван  ', 'ivan@example.com', '25');
        const result = handleFormSubmit({ preventDefault() {} });
        assertEqual(result.valid, true);
        assertEqual(result.data.name, 'Иван', 'имя не обрезано');
        assertEqual($('form-output').querySelectorAll('.success-message').length, 1);
        assertEqual($('form-output').querySelectorAll('.error-message').length, 0);
    });

    test('handleFormSubmit: после ошибки исправленная форма показывает успех', () => {
        fillForm('', '', '');
        handleFormSubmit({ preventDefault() {} });
        fillForm('Анна', 'anna@example.com', '30');
        handleFormSubmit({ preventDefault() {} });
        assertEqual($('form-output').querySelectorAll('.error-message').length, 0);
        assertEqual($('form-output').querySelectorAll('.success-message').length, 1);
    });

    test('setupForm: submit перехватывается (defaultPrevented) и результат выводится', () => {
        setupForm();
        fillForm('Мария', 'maria@example.com', '41');
        const submit = new Event('submit', { bubbles: true, cancelable: true });
        $('user-form').dispatchEvent(submit);
        assertEqual(submit.defaultPrevented, true, 'стандартная отправка не отменена');
        assertEqual($('form-output').querySelectorAll('.success-message').length, 1);
    });

    test('setupForm: отключает встроенную валидацию, чтобы работала собственная', () => {
        setupForm();
        assertEqual($('user-form').noValidate, true);
    });

    test('setupForm: двойная настройка не дублирует вывод', () => {
        setupForm();
        setupForm();
        fillForm('', '', '');
        $('user-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        assertEqual($('form-output').querySelectorAll('.error-message').length, 3);
    });

    // =================================================================
    // ЗАПУСК
    // =================================================================

    async function runAll() {
        const realContainer = document.querySelector('.container');
        const placeholder = document.createComment('tests-placeholder');
        realContainer.replaceWith(placeholder);          // прячем настоящий DOM (с обработчиками)

        const results = [];

        for (const { name, fn } of tests) {
            // свежий DOM для каждого теста
            document.querySelector('.container.test-fixture')?.remove();
            const fixture = document.createElement('div');
            fixture.innerHTML = FIXTURE;
            const fixtureRoot = fixture.firstElementChild;
            fixtureRoot.classList.add('test-fixture');
            placeholder.after(fixtureRoot);

            try {
                await fn();
                results.push({ name, ok: true });
            } catch (err) {
                results.push({ name, ok: false, error: err.message });
            }
        }

        document.querySelector('.container.test-fixture')?.remove();
        placeholder.replaceWith(realContainer);          // возвращаем исходный DOM

        report(results);
    }

    function report(results) {
        const passed = results.filter((r) => r.ok).length;
        const failed = results.length - passed;

        console.log(`%cТЕСТЫ: пройдено ${passed} из ${results.length}`,
            `font-weight:bold;color:${failed ? '#e74c3c' : '#27ae60'}`);
        results.forEach((r) => {
            if (r.ok) console.log(`✅ ${r.name}`);
            else console.error(`❌ ${r.name}\n    → ${r.error}`);
        });

        // Вывод на страницу
        let panel = document.getElementById('test-results');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'test-results';
            panel.style.cssText = 'max-width:1000px;margin:0 auto 40px;padding:0 20px;';
            document.body.appendChild(panel);
        }
        panel.replaceChildren();

        const summary = document.createElement('div');
        summary.className = `test-result ${failed ? 'test-failure' : 'test-success'}`;
        const strong = document.createElement('strong');
        strong.textContent = `Тесты: ${passed} / ${results.length} пройдено`;
        summary.appendChild(strong);
        panel.appendChild(summary);

        results.forEach((r) => {
            const row = document.createElement('div');
            row.className = `test-result ${r.ok ? 'test-success' : 'test-failure'}`;
            row.textContent = `${r.ok ? '✅' : '❌'} ${r.name}${r.ok ? '' : ' — ' + r.error}`;
            panel.appendChild(row);
        });
    }

    if (document.readyState === 'loading') {
        // регистрируемся после dom-tasks.js, поэтому выполнимся после initializeApp
        document.addEventListener('DOMContentLoaded', runAll);
    } else {
        runAll();
    }
})();
