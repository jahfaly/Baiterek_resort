(() => {
  // --- Нейтральные описания по названию блюда (если в карточке нет .product-card__desc) ---
  const DESC_MAP = {
    'Стейк T Bone': 'Классический T-Bone: сочная вырезка, прожарка по вашему желанию.',
    'Шашлык из куриных крылышек': 'Куриные крылышки маринуются в специях и жарятся на мангале до готовности. Подаются горячими.',
    'Шашлык из говядины': 'Кусочки говядины маринуются и готовятся на открытом жаре. Прожарка — до полной готовности.',
    'Шашлык из утиного филе': 'Филе утки маринуется и жарится на мангале. Текстура более плотная, подача — горячей порцией.',
    'Шашлык из куриного филе': 'Куриное филе маринуется и жарится на мангале. Порция состоит из равномерно нарезанных кусочков.',
    'Салат от шефа': 'Болгарский перец, копченая индейка, ветчина, майонез.',
    'Стейк лосося': 'Кусок лосося на гриле, с хрустящей корочкой и сочной серединой.',
    'Феттучини с курицей и грибами': 'Итальянская паста с сливочным соусом, курицей и шампиньонами.',
    'Том Ям': 'Суп тайского происхождения на ароматном бульоне с травами.',
    'Жаровня из баранины': 'Сытная жаровня с бараниной, овощами и специями, томлёная до мягкости.',
    'Колбаски из говядины': 'Колбаски из говяжьего фарша жарятся до равномерного подрумянивания. Подаются горячими.',
    'Кавказская закуска': 'Свежие овощи, домашняя брынза, зелень, маслины.',
    'Хачапури по аджарски': 'Лодочка из теста с сыром, яйцом и маслом — подаётся горячей.',
    'Рыбное ассорти': 'Филе сёмги, масляной рыбы, профитроли с муссом из морской рыбы.',
    'Пицца Пепперони': 'Тонкое тесто, томатный соус, моцарелла и пикантная салями.',
    'Пицца Маргарита': 'Классика: томаты, моцарелла и специи на тонком тесте.'
  };

  // --- Создаём модалку, если её ещё нет в разметке ---
  function ensureModal() {
    let modal = document.getElementById('product-modal');
    if (modal) return modal;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div class="product-modal" id="product-modal" aria-hidden="true">
        <div class="product-modal__backdrop" data-modal-close></div>
        <div class="product-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
          <button class="product-modal__close" type="button" aria-label="Закрыть" data-modal-close>×</button>
          <img class="product-modal__img" alt="" />
          <h3 class="product-modal__title" id="product-modal-title"></h3>
          <p class="product-modal__desc" style="display:none"></p>
          <div class="product-modal__price"></div>
        </div>
      </div>`;
    document.body.appendChild(wrapper.firstElementChild);
    return document.getElementById('product-modal');
  }

  const modal = ensureModal();
  const img    = modal.querySelector('.product-modal__img');
  const title  = modal.querySelector('.product-modal__title');
  const price  = modal.querySelector('.product-modal__price');
  const descEl = modal.querySelector('.product-modal__desc');
  const closeEls = modal.querySelectorAll('[data-modal-close]');

  let lastActive = null;
  let isSwitching = false;
  let savedScrollY = 0;

  // --- Вспомогательные ---
  function preload(src) {
    return new Promise((resolve) => {
      if (!src) return resolve('');
      const ph = new Image();
      ph.onload = () => resolve(ph.src);
      ph.onerror = () => resolve(src);
      ph.src = src;
    });
  }

  function setBodyLock() {
    // сохраняем позицию скролла, чтобы не дёргался контент на мобилках
    savedScrollY = window.scrollY || document.documentElement.scrollTop || 0;

    // компенсируем ширину скроллбара, чтобы не было «зума»
    const sbw = window.innerWidth - document.documentElement.clientWidth;
    // блокируем прокрутку
    document.body.classList.add('has-modal');
    document.body.style.overflow = 'hidden';
  }

  function unsetBodyLock() {
    document.body.classList.remove('has-modal');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    // возвращаем позицию
    window.scrollTo(0, savedScrollY || 0);
  }

  // --- Открытие / закрытие ---
  async function openModal(data){
    if (isSwitching) return;
    isSwitching = true;

    const alreadyOpen = modal.classList.contains('is-open');

    // текст
    title.textContent = data.title || '';
    price.textContent = data.price || '';

    const descText = (data.desc || '').trim();
    if (descText) {
      descEl.textContent = descText;
      descEl.style.display = '';
    } else {
      descEl.textContent = '';
      descEl.style.display = 'none';
    }

    // картинка без «мигания»
    img.classList.remove('is-ready');
    const loadedSrc = await preload(data.imgSrc);
    img.src = loadedSrc || '';
    img.alt = data.imgAlt || data.title || '';

    if (!alreadyOpen) {
      lastActive = document.activeElement;
      setBodyLock();
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden','false');
      requestAnimationFrame(() => {
        const btn = modal.querySelector('.product-modal__close');
        if (btn) btn.focus();
      });
    }

    requestAnimationFrame(() => img.classList.add('is-ready'));

    // debounce на быстрые клики
    setTimeout(() => { isSwitching = false; }, 120);
  }

  function closeModal(){
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden','true');
    img.classList.remove('is-ready');
    unsetBodyLock();
    if (lastActive) lastActive.focus({preventScroll:true});
  }

  // --- Навешиваем обработчики на карточки товаров ---
  document.querySelectorAll('.product-card').forEach((card) => {
    if (!card.hasAttribute('tabindex')) card.tabIndex = 0;

    const show = () => {
      const imgEl   = card.querySelector('.product-card__img');
      const titleEl = card.querySelector('.product-card__title');
      const priceEl = card.querySelector('.product-card__price');
      const descFromCard = card.querySelector('.product-card__desc')?.textContent?.trim() || '';
      const name = titleEl ? titleEl.textContent.trim() : '';

      openModal({
        imgSrc: imgEl ? imgEl.getAttribute('src') : '',
        imgAlt: imgEl ? imgEl.getAttribute('alt') : '',
        title:  name,
        price:  priceEl ? priceEl.textContent.trim() : '',
        desc:   descFromCard || (name && DESC_MAP[name]) || ''
      });
    };

    card.addEventListener('click', show, {passive:true});
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(); }
    });
  });

  // --- Закрытие модалки ---
  closeEls.forEach((el) => el.addEventListener('click', closeModal));
  modal.addEventListener('click', (e) => {
    if (e.target.matches('.product-modal__backdrop')) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });
})();






















document.addEventListener("DOMContentLoaded", () => {
  const THEME_KEY = "theme";
  const body = document.body;
  const btn  = document.getElementById("theme-toggle");
  const logo = document.querySelector(".logo");

  // пути к логотипам
  const logoDark = "img/main/BR-logo-light.png"; // белый (для тёмной темы)
  const logoLight = "img/main/BR-logo-dark.png"; // чёрный (для светлой темы)

  // Восстановить тему (по умолчанию — dark)
  const saved = localStorage.getItem(THEME_KEY);
  const startTheme = saved === "light" ? "light" : "dark";
  body.classList.toggle("light-theme", startTheme === "light");

  // Установить правильный логотип
  if (logo) logo.src = startTheme === "light" ? logoLight : logoDark;

  // Установить иконку кнопки
  if (btn) {
    btn.textContent = startTheme === "light" ? "☀️" : "🌙";
  }

  // Клик по переключателю
  if (btn) {
    btn.addEventListener("click", () => {
      const isLight = body.classList.toggle("light-theme");
      const theme   = isLight ? "light" : "dark";
      localStorage.setItem(THEME_KEY, theme);

      // меняем логотип
      if (logo) logo.src = isLight ? logoLight : logoDark;

      // меняем иконку
      btn.textContent = isLight ? "☀️" : "🌙";
    });
  }
});











// Инициализация погодного виджета из main.js
document.addEventListener('DOMContentLoaded', async () => {
  const root = document.getElementById('weather-here');
  if (!root) return;
  try {
    const { initWeatherWidget } = await import('./weather-widget.js');
    initWeatherWidget(root, { city: 'Караганда' });
  } catch (e) {
    console.error('Weather widget failed to load:', e);
  }
});
