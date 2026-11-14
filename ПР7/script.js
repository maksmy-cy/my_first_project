'use strict';

/* ===== Валидация формы регистрации (без внешних библиотек) ===== */

const form = document.getElementById('registration-form');
const summary = document.getElementById('form-summary');
const successMsg = document.getElementById('form-success');

const MIN_AGE = 14;
const touched = new Set(); // поля, с которыми пользователь уже взаимодействовал

/* ---------- Правила для каждого поля: возвращают текст ошибки или '' ---------- */
const validators = {
  fullName(value) {
    const v = value.trim();
    if (!v) return 'Введите имя и фамилию.';
    if (v.length < 2) return 'Имя слишком короткое (минимум 2 символа).';
    if (!/^[\p{L}][\p{L}\s'-]*$/u.test(v)) return 'Допустимы только буквы, пробел, дефис и апостроф.';
    if (v.split(/\s+/).length < 2) return 'Укажите и имя, и фамилию.';
    return '';
  },

  birthDate(value) {
    if (!value) return 'Укажите дату рождения.';
    const birth = new Date(value);
    const today = new Date();
    if (Number.isNaN(birth.getTime())) return 'Некорректная дата.';
    if (birth > today) return 'Дата рождения не может быть в будущем.';
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    if (age > 120) return 'Проверьте год рождения.';
    if (age < MIN_AGE) return `Регистрация доступна с ${MIN_AGE} лет.`;
    return '';
  },

  country(value) {
    return value ? '' : 'Выберите страну из списка.';
  },

  gender() {
    return form.elements.gender.value ? '' : 'Выберите один из вариантов.';
  },

  email(value) {
    const v = value.trim();
    if (!v) return 'Введите email.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Введите корректный email, например name@example.com.';
    return '';
  },

  phone(value) {
    const v = value.trim();
    if (!v) return 'Введите номер телефона.';
    const digits = v.replace(/\D/g, '');
    const ok = /^[78]\d{10}$/.test(digits) && /^(\+7|8|7)/.test(v.replace(/[\s()-]/g, ''));
    return ok ? '' : 'Формат: +7 900 123-45-67 (11 цифр).';
  },

  password(value) {
    if (!value) return 'Придумайте пароль.';
    const failed = Object.entries(passwordRules).filter(([, test]) => !test(value)).map(([key]) => key);
    if (failed.length) return 'Пароль слишком слабый: ' + failed.map((k) => ruleText[k]).join(', ') + '.';
    return '';
  },

  passwordConfirm(value) {
    if (!value) return 'Повторите пароль.';
    if (value !== form.elements.password.value) return 'Пароли не совпадают.';
    return '';
  },

  about(value) {
    return value.length > 200 ? 'Не более 200 символов.' : '';
  },

  terms() {
    return form.elements.terms.checked ? '' : 'Необходимо принять условия использования.';
  },
};

/* ---------- Правила пароля ---------- */
const passwordRules = {
  length: (v) => v.length >= 8,
  lower: (v) => /[a-zа-яё]/.test(v),
  upper: (v) => /[A-ZА-ЯЁ]/.test(v),
  digit: (v) => /\d/.test(v),
  special: (v) => /[^\p{L}\d\s]/u.test(v),
};
const ruleText = {
  length: 'минимум 8 символов',
  lower: 'строчная буква',
  upper: 'заглавная буква',
  digit: 'цифра',
  special: 'спецсимвол',
};

/* ---------- Отображение состояния поля ---------- */
function getControl(name) {
  const el = form.elements[name];
  // для радио-группы form.elements возвращает RadioNodeList
  return el instanceof RadioNodeList ? el[0].closest('fieldset') : el;
}

function showState(name, message) {
  const control = getControl(name);
  const errorEl = document.getElementById(`${name}-error`);
  const isGroup = control.tagName === 'FIELDSET';

  errorEl.textContent = message;
  control.classList.toggle('is-invalid', Boolean(message));
  control.classList.toggle('is-valid', !message && !isGroup && hasValue(name));

  if (isGroup) {
    form.elements[name].forEach((r) => r.setAttribute('aria-invalid', String(Boolean(message))));
  } else {
    control.setAttribute('aria-invalid', String(Boolean(message)));
  }
}

function hasValue(name) {
  const el = form.elements[name];
  return el.type === 'checkbox' ? el.checked : Boolean(el.value);
}

function validateField(name) {
  const el = form.elements[name];
  const value = el.type === 'checkbox' || el instanceof RadioNodeList ? '' : el.value;
  const message = validators[name](value);
  showState(name, message);
  return message;
}

/* ---------- События в реальном времени ---------- */
const fieldNames = Object.keys(validators);

form.addEventListener('blur', (e) => {
  const name = e.target.name;
  if (!validators[name]) return;
  touched.add(name);
  validateField(name);
}, true); // capture: blur не всплывает

form.addEventListener('input', (e) => {
  const name = e.target.name;
  if (!validators[name]) return;
  if (touched.has(name)) validateField(name);

  if (name === 'password') {
    updateStrength(e.target.value);
    // пароль изменился — подтверждение нужно перепроверить
    if (touched.has('passwordConfirm')) validateField('passwordConfirm');
  }
  if (name === 'about') updateCounter();
});

form.addEventListener('change', (e) => {
  const name = e.target.name;
  if (!validators[name]) return;
  touched.add(name);
  validateField(name);
});

/* ---------- Индикатор надёжности пароля ---------- */
const strengthBar = document.getElementById('strength-bar');
const strengthText = document.getElementById('strength-text');
const levels = ['—', 'очень слабый', 'слабый', 'средний', 'хороший', 'отличный'];

function updateStrength(value) {
  let score = 0;
  document.querySelectorAll('#password-rules li').forEach((li) => {
    const ok = passwordRules[li.dataset.rule](value);
    li.classList.toggle('ok', ok);
    if (ok) score++;
  });
  if (!value) score = 0;
  strengthBar.style.width = `${score * 20}%`;
  strengthBar.dataset.level = score;
  strengthText.textContent = `Надёжность пароля: ${levels[score]}`;
}

/* ---------- Счётчик символов ---------- */
function updateCounter() {
  const left = 200 - form.elements.about.value.length;
  document.getElementById('about-counter').textContent = `Осталось символов: ${left}`;
}

/* ---------- Показать / скрыть пароль ---------- */
document.querySelectorAll('.toggle').forEach((btn) => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.toggle);
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.textContent = show ? 'Скрыть' : 'Показать';
    btn.setAttribute('aria-pressed', String(show));
  });
});

/* ---------- Отправка формы ---------- */
const labels = {
  fullName: 'Имя и фамилия', birthDate: 'Дата рождения', country: 'Страна', gender: 'Пол',
  email: 'Email', phone: 'Телефон', password: 'Пароль', passwordConfirm: 'Повтор пароля',
  about: 'О себе', terms: 'Условия использования',
};

form.addEventListener('submit', (e) => {
  e.preventDefault();
  successMsg.hidden = true;

  const errors = [];
  fieldNames.forEach((name) => {
    touched.add(name);
    const message = validateField(name);
    if (message) errors.push({ name, message });
  });

  if (errors.length) {
    renderSummary(errors);
    focusField(errors[0].name);
    return;
  }

  summary.hidden = true;
  successMsg.hidden = false;
  successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  // Здесь могла бы быть отправка на сервер: fetch('/api/register', { method: 'POST', body: new FormData(form) })
  console.log('Данные формы:', Object.fromEntries(new FormData(form)));
});

function renderSummary(errors) {
  summary.innerHTML = '';
  const title = document.createElement('strong');
  title.textContent = `Исправьте ошибки (${errors.length}):`;
  const list = document.createElement('ul');
  errors.forEach(({ name, message }) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `#${name === 'gender' ? 'gender-error' : name}`;
    a.textContent = `${labels[name]}: ${message}`;
    a.addEventListener('click', (ev) => { ev.preventDefault(); focusField(name); });
    li.append(a);
    list.append(li);
  });
  summary.append(title, list);
  summary.hidden = false;
}

function focusField(name) {
  const el = form.elements[name];
  (el instanceof RadioNodeList ? el[0] : el).focus();
}

/* ---------- Сброс формы ---------- */
form.addEventListener('reset', () => {
  touched.clear();
  summary.hidden = true;
  successMsg.hidden = true;
  // даём браузеру очистить значения, затем сбрасываем визуальное состояние
  setTimeout(() => {
    fieldNames.forEach((n) => showState(n, ''));
    document.querySelectorAll('.is-valid').forEach((el) => el.classList.remove('is-valid'));
    updateStrength('');
    updateCounter();
  }, 0);
});

// Ограничиваем выбор даты рождения сегодняшним днём
form.elements.birthDate.max = new Date().toISOString().split('T')[0];
