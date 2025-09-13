// weather-widget.js
export async function initWeatherWidget(rootEl, { city = "Алматы" } = {}) {
  rootEl.innerHTML = `
    <style>
      .ww{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}
      .ww header{display:flex;gap:.5rem;flex-wrap:wrap;align-items:center}
      .ww input,.ww button{font-size:1rem;padding:.6rem .8rem;border:1px solid #ccc;border-radius:.6rem}
      .ww button{cursor:pointer}
      .ww .muted{color:#666;font-size:.9rem}
      .ww .cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:1rem;margin-top:1rem}
      .ww .card{border:1px solid #eee;border-radius:1rem;padding:1rem;box-shadow:0 1px 4px rgba(0,0,0,.05)}
    </style>
    <div class="ww">
      <header>
        <input id="ww-city" placeholder="Город" value="${city}"/>
        <button id="ww-load">Показать</button>
        <span id="ww-status" class="muted"></span>
      </header>
      <div id="ww-location" class="muted"></div>
      <div id="ww-today"></div>
      <div class="cards" id="ww-daily"></div>
      <div class="muted" style="margin-top:1rem">Источник: Open-Meteo</div>
    </div>
  `;

  const $ = sel => rootEl.querySelector(sel);
  const statusEl = $('#ww-status'), locEl = $('#ww-location'), todayEl = $('#ww-today'), dailyEl = $('#ww-daily');
  const wmo = c => ({
    0:"☀️ Ясно",1:"🌤️ Преим. ясно",2:"⛅ Переменная облачность",3:"☁️ Облачно",
    45:"🌫️ Туман",48:"🌫️ Иней/туман",51:"🌦️ Мелкая морось",53:"🌦️ Морось",55:"🌦️ Сильная морось",
    61:"🌧️ Небольшой дождь",63:"🌧️ Дождь",65:"🌧️ Ливень",66:"🌧️ Ледяной дождь (слаб.)",67:"🌧️ Ледяной дождь",
    71:"🌨️ Небольшой снег",73:"🌨️ Снег",75:"🌨️ Сильный снег",77:"🌨️ Снежные зерна",
    80:"🌧️ Ливни",81:"🌧️ Сильные ливни",82:"🌧️ Очень сильные ливни",85:"🌨️ Снегопад",86:"🌨️ Сильный снегопад",
    95:"⛈️ Гроза",96:"⛈️ Гроза с градом",99:"⛈️ Сильная гроза с градом"
  }[c] || "Погода");

  async function geocode(q){
    const u = new URL('https://geocoding-api.open-meteo.com/v1/search');
    u.searchParams.set('name', q); u.searchParams.set('count', 1); u.searchParams.set('language', 'ru');
    const r = await fetch(u); if(!r.ok) throw new Error('Геокодинг недоступен');
    const d = await r.json(); if(!d.results?.length) throw new Error('Город не найден');
    return d.results[0];
  }
  async function forecast(lat, lon, tz){
    const u = new URL('https://api.open-meteo.com/v1/forecast');
    u.searchParams.set('latitude', lat); u.searchParams.set('longitude', lon);
    u.searchParams.set('timezone', tz || 'auto');
    u.searchParams.set('current', 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m');
    u.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min');
    u.searchParams.set('forecast_days', '7');
    const r = await fetch(u); if(!r.ok) throw new Error('API прогноза недоступен');
    return r.json();
  }
  function render(cityInfo, f){
    const { name, country, admin1, timezone } = cityInfo;
    locEl.textContent = `${name}${admin1?`, ${admin1}`:''}, ${country} • ${timezone}`;
    const c = f.current;
    todayEl.innerHTML = `<h3>Сейчас: ${c.temperature_2m.toFixed(0)}°C • ${wmo(c.weather_code)}</h3>
      <div class="muted">Ощущается как ${c.apparent_temperature.toFixed(0)}°C • Ветер ${c.wind_speed_10m.toFixed(0)} м/с</div>`;
    const d = f.daily;
    dailyEl.innerHTML = '';
    for(let i=0;i<d.time.length;i++){
      const date = new Date(d.time[i]);
      const title = date.toLocaleDateString('ru-RU',{weekday:'short',day:'2-digit',month:'2-digit'});
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `<div class="muted">${title}</div>
        <div style="font-size:1.1rem;margin:.25rem 0">${wmo(d.weather_code[i])}</div>
        <div>днём: <b>${Math.round(d.temperature_2m_max[i])}°C</b></div>
        <div>ночью: <b>${Math.round(d.temperature_2m_min[i])}°C</b></div>`;
      dailyEl.appendChild(card);
    }
  }
  async function load(q){
    statusEl.textContent = 'Загружаю...';
    try {
      const cityInfo = await geocode(q);
      const data = await forecast(cityInfo.latitude, cityInfo.longitude, cityInfo.timezone);
      render(cityInfo, data);
      statusEl.textContent = '';
    } catch (e) { statusEl.textContent = e.message || 'Ошибка'; }
  }
  rootEl.querySelector('#ww-load').addEventListener('click', ()=>load(rootEl.querySelector('#ww-city').value.trim()));
  load(rootEl.querySelector('#ww-city').value.trim());
}
