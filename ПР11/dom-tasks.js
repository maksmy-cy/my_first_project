// =====================================================================
// ПР №11: JavaScript — манипуляции DOM-деревом
// =====================================================================

// ---------------------------------------------------------------------
// ЗАДАНИЕ 1: Создание и вставка элементов
// ---------------------------------------------------------------------

// 1.1. Создает карточку с заголовком и текстом и добавляет её в #target1
function createCard(title, content) {
    const target = document.getElementById('target1');
    if (!target) return null;

    const card = document.createElement('div');
    card.className = 'card';

    const heading = document.createElement('h4');
    heading.textContent = title;          // textContent — безопасно, HTML не разбирается

    const paragraph = document.createElement('p');
    paragraph.textContent = content;

    card.append(heading, paragraph);
    target.appendChild(card);
    return card;
}

// 1.2. Создает нумерованный список из массива и добавляет его в #target1
function createList(items) {
    if (!Array.isArray(items)) {
        throw new TypeError('createList: ожидается массив');
    }
    const target = document.getElementById('target1');
    if (!target) return null;

    const ol = document.createElement('ol');
    // DocumentFragment: все <li> собираем «в воздухе» и вставляем одной операцией
    const fragment = document.createDocumentFragment();
    items.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = String(item);
        fragment.appendChild(li);
    });
    ol.appendChild(fragment);

    target.appendChild(ol);
    return ol;
}

// ---------------------------------------------------------------------
// ЗАДАНИЕ 2: Навигация по DOM
// ---------------------------------------------------------------------

// 2.1. Количество дочерних ЭЛЕМЕНТОВ (текстовые узлы не считаются)
function countChildren() {
    const parent = document.getElementById('parent-element');
    return parent ? parent.children.length : 0;
}

// 2.2. Текст элемента с классом "special" внутри #parent-element
function findSpecialChild() {
    const parent = document.getElementById('parent-element');
    if (!parent) return null;
    const special = parent.querySelector('.special');
    return special ? special.textContent.trim() : null;
}

// 2.3. Цвет фона родителя для .child (через parentElement + computed style)
function getParentBackground() {
    const child = document.querySelector('.child');
    if (!child || !child.parentElement) return null;
    return getComputedStyle(child.parentElement).backgroundColor;
}

// ---------------------------------------------------------------------
// ЗАДАНИЕ 3: Работа с классами и стилями
// ---------------------------------------------------------------------

// 3.1. Переключение класса "active-style" у #style-target по клику на #toggle-style
function setupStyleToggle() {
    const button = document.getElementById('toggle-style');
    const target = document.getElementById('style-target');
    if (!button || !target) return;
    if (button.dataset.bound) return;     // защита от повторной подписки
    button.dataset.bound = 'true';

    button.addEventListener('click', () => {
        target.classList.toggle('active-style');
    });
}

// 3.2. Случайный цвет фона для header. Возвращает выбранный цвет (#rrggbb)
function changeHeaderColor() {
    const header = document.querySelector('header');
    if (!header) return null;

    const value = Math.floor(Math.random() * 0x1000000);   // 0 .. 16777215
    const color = '#' + value.toString(16).padStart(6, '0');

    // background (а не backgroundColor): перекрывает градиент из CSS
    header.style.background = color;
    return color;
}

// 3.3. Анимация #style-target: меняем размер и прозрачность, затем возвращаем.
// Возвращает Promise, который выполняется по окончании анимации.
function animateElement(duration = 600) {
    const el = document.getElementById('style-target');
    if (!el) return Promise.resolve(false);

    el.style.transition = `transform ${duration / 2}ms ease, opacity ${duration / 2}ms ease`;
    el.style.transform = 'scale(1.15)';
    el.style.opacity = '0.4';

    return new Promise((resolve) => {
        setTimeout(() => {
            el.style.transform = '';
            el.style.opacity = '';
            // убираем inline-transition, чтобы вернулся transition из CSS
            setTimeout(() => {
                el.style.transition = '';
                resolve(true);
            }, duration / 2);
        }, duration / 2);
    });
}

// ---------------------------------------------------------------------
// ЗАДАНИЕ 4: Обработка событий
// ---------------------------------------------------------------------

// 4.1. Счётчик кликов
function setupClickCounter() {
    const button = document.getElementById('click-btn');
    const counter = document.getElementById('click-counter');
    if (!button || !counter) return;
    if (button.dataset.bound) return;
    button.dataset.bound = 'true';

    let count = 0;
    button.addEventListener('click', () => {
        count++;
        counter.textContent = `Кликов: ${count}`;
    });
}

// 4.2. Отображение вводимого текста в реальном времени
function setupInputDisplay() {
    const input = document.getElementById('text-input');
    const display = document.getElementById('input-display');
    if (!input || !display) return;
    if (input.dataset.bound) return;
    input.dataset.bound = 'true';

    input.addEventListener('input', () => {
        display.textContent = input.value;   // textContent — защита от XSS
    });
}

// 4.3. Клавиатурные события на документе
let keyboardHandlers = null;

function setupKeyboardEvents() {
    // если уже подписывались — сначала снимаем старые обработчики
    if (keyboardHandlers) {
        document.removeEventListener('keydown', keyboardHandlers.down);
        document.removeEventListener('keyup', keyboardHandlers.up);
    }

    const down = (e) => console.log(`keydown: code=${e.code}, key="${e.key}"`);
    const up = (e) => console.log(`keyup: code=${e.code}, key="${e.key}"`);

    document.addEventListener('keydown', down);
    document.addEventListener('keyup', up);
    keyboardHandlers = { down, up };
}

// ---------------------------------------------------------------------
// ЗАДАНИЕ 5: Динамические списки
// ---------------------------------------------------------------------

// 5.1. Добавление элемента из #item-input в #dynamic-list
function addListItem() {
    const input = document.getElementById('item-input');
    const list = document.getElementById('dynamic-list');
    if (!input || !list) return null;

    const text = input.value.trim();
    if (text === '') return null;            // пустые значения не добавляем

    const li = document.createElement('li');
    li.className = 'list-item';

    const span = document.createElement('span');
    span.textContent = text;

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = 'Удалить';

    li.append(span, deleteBtn);
    list.appendChild(li);

    input.value = '';
    input.focus();
    return li;
}

// 5.2. Удаление элемента списка по клику на кнопку удаления
function removeListItem(event) {
    const target = event && event.target;
    if (!(target instanceof Element)) return false;

    const button = target.closest('.delete-btn');   // клик мог прийти на вложенный элемент
    if (!button) return false;

    const item = button.closest('.list-item');
    if (!item) return false;

    item.remove();
    return true;
}

// 5.3. Очистка всего списка
function clearList() {
    const list = document.getElementById('dynamic-list');
    if (list) list.replaceChildren();
}

// 5.4. Подписка на все события списка
function setupListEvents() {
    const addBtn = document.getElementById('add-item');
    const clearBtn = document.getElementById('clear-list');
    const input = document.getElementById('item-input');
    const list = document.getElementById('dynamic-list');

    if (addBtn && !addBtn.dataset.bound) {
        addBtn.dataset.bound = 'true';
        addBtn.addEventListener('click', addListItem);
    }
    if (clearBtn && !clearBtn.dataset.bound) {
        clearBtn.dataset.bound = 'true';
        clearBtn.addEventListener('click', clearList);
    }
    if (input && !input.dataset.bound) {
        input.dataset.bound = 'true';
        // Enter в поле ввода тоже добавляет элемент
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') addListItem();
        });
    }
    if (list && !list.dataset.bound) {
        list.dataset.bound = 'true';
        // Делегирование: один обработчик на <ul> для всех текущих и будущих кнопок
        list.addEventListener('click', removeListItem);
    }
}

// ---------------------------------------------------------------------
// ЗАДАНИЕ 6: Работа с формами
// ---------------------------------------------------------------------

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// 6.1. Валидация. formData: { name, email, age } (или FormData с такими же ключами).
// Возвращает объект с ошибками { name?, email?, age? } или null, если всё верно.
function validateForm(formData) {
    let data = formData || {};
    if (typeof FormData !== 'undefined' && data instanceof FormData) {
        data = Object.fromEntries(data.entries());
    }

    const errors = {};

    // Имя: не пустое, минимум 2 символа (пробелы по краям не считаются)
    const name = typeof data.name === 'string' ? data.name.trim() : '';
    if (name === '') {
        errors.name = 'Введите имя';
    } else if (name.length < 2) {
        errors.name = 'Имя должно содержать минимум 2 символа';
    }

    // Email
    const email = typeof data.email === 'string' ? data.email.trim() : '';
    if (email === '') {
        errors.email = 'Введите email';
    } else if (!EMAIL_REGEX.test(email)) {
        errors.email = 'Некорректный формат email';
    }

    // Возраст: целое число от 1 до 120
    const ageRaw = data.age === null || data.age === undefined ? '' : String(data.age).trim();
    if (ageRaw === '') {
        errors.age = 'Введите возраст';
    } else if (!/^\d+$/.test(ageRaw)) {
        errors.age = 'Возраст должен быть целым числом';
    } else {
        const age = Number(ageRaw);
        if (age < 1 || age > 120) {
            errors.age = 'Возраст должен быть от 1 до 120';
        }
    }

    return Object.keys(errors).length > 0 ? errors : null;
}

// 6.2. Показ ошибок валидации в #form-output
function displayFormErrors(errors) {
    const output = document.getElementById('form-output');
    if (!output) return;

    output.replaceChildren();               // убираем предыдущий результат
    if (!errors) return;

    Object.entries(errors).forEach(([field, message]) => {
        const div = document.createElement('div');
        div.className = 'error-message';
        div.dataset.field = field;
        div.style.padding = '0.5rem 1rem';
        div.style.margin = '0.25rem 0';
        div.style.borderRadius = '4px';
        div.textContent = message;
        output.appendChild(div);
    });
}

// 6.3. Показ успешного сообщения с данными пользователя
function displayFormSuccess(userData) {
    const output = document.getElementById('form-output');
    if (!output) return;

    output.replaceChildren();

    const box = document.createElement('div');
    box.className = 'success-message';
    box.style.padding = '1rem';
    box.style.borderRadius = '4px';

    const title = document.createElement('h4');
    title.textContent = '✅ Форма успешно отправлена!';
    box.appendChild(title);

    const rows = [
        ['Имя', userData.name],
        ['Email', userData.email],
        ['Возраст', userData.age],
    ];
    rows.forEach(([label, value]) => {
        const p = document.createElement('p');
        const strong = document.createElement('strong');
        strong.textContent = `${label}: `;
        p.append(strong, document.createTextNode(String(value)));
        box.appendChild(p);
    });

    output.appendChild(box);
}

// 6.4. Обработка отправки формы
function handleFormSubmit(event) {
    if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();             // отменяем перезагрузку страницы
    }

    const form = event && event.currentTarget instanceof HTMLFormElement
        ? event.currentTarget
        : document.getElementById('user-form');
    if (!form) return null;

    const data = {
        name: form.elements['user-name'].value.trim(),
        email: form.elements['user-email'].value.trim(),
        age: form.elements['user-age'].value.trim(),
    };

    const errors = validateForm(data);
    if (errors) {
        displayFormErrors(errors);
        return { valid: false, errors };
    }

    displayFormSuccess(data);
    return { valid: true, data };
}

// 6.5. Подписка на submit формы
function setupForm() {
    const form = document.getElementById('user-form');
    if (!form || form.dataset.bound) return;
    form.dataset.bound = 'true';

    // Отключаем встроенную проверку браузера, чтобы работала наша валидация
    form.noValidate = true;
    form.addEventListener('submit', handleFormSubmit);
}

// ---------------------------------------------------------------------
// ИНИЦИАЛИЗАЦИЯ ВСЕХ ФУНКЦИЙ
// ---------------------------------------------------------------------
function initializeApp() {
    setupStyleToggle();
    setupClickCounter();
    setupInputDisplay();
    setupKeyboardEvents();
    setupListEvents();
    setupForm();

    createCard('Пример карточки', 'Это содержимое карточки');
    createList(['Первый элемент', 'Второй элемент', 'Третий элемент']);

    console.log('Приложение инициализировано!');
}

// Запуск инициализации, когда DOM загружен
document.addEventListener('DOMContentLoaded', initializeApp);
