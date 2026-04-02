function App() {
  return (
    <div className="auth-page">
      <div className="left-pane">
        <div className="lang-switch">
          <button className="lang active" type="button">
            ҚАЗ
          </button>
          <button className="lang" type="button">
            РУС
          </button>
        </div>

        <div className="brand">
          <span className="brand-icon">🏛️</span>
          Приёмная Комиссия
        </div>

        <div className="label">ОФИЦИАЛЬНЫЙ ПОРТАЛ УНИВЕРСИТЕТА</div>
        <p className="line-hint">● Приёмный процесс в цифровом формате</p>

        <div className="floating-card smart">
          <strong>Смарт-заявка</strong>
          <p>Управляйте несколькими направлениями из одного кабинета</p>
        </div>

        <h1>Первый шаг в будущее</h1>

        <p className="status-line">
          Сейчас: <strong>управление документами</strong>
        </p>

        <p className="subtext">
          Подавайте заявки онлайн, отслеживайте статус и напрямую взаимодействуйте
          с приёмной комиссией университета.
        </p>

        <div className="feature-list">
          <div className="feature-item">📝 Онлайн подача заявок</div>
          <div className="feature-item">🧭 Отслеживание статуса в реальном времени</div>
          <div className="feature-item">🔒 Безопасное хранение данных</div>
        </div>

        <div className="floating-card live">
          <strong>Живой статус</strong>
          <p>Каждое изменение сразу видно на экране</p>
        </div>

        <div className="floating-card quick">
          <strong>Быстрое сообщение</strong>
          <p>Связь с комиссией остаётся под рукой</p>
        </div>

        <div className="stats">
          <div className="stat-card">
            <strong>24/7</strong>
            <small>ПОДДЕРЖКА</small>
          </div>
          <div className="stat-card">
            <strong>140</strong>
            <small>МАКС. ЕНТ</small>
          </div>
          <div className="stat-card">
            <strong>100%</strong>
            <small>ОНЛАЙН</small>
          </div>
        </div>
      </div>

      <div className="right-pane">
        <div className="top-actions">
          <button className="mini active" type="button">
            🇰🇿 ҚАЗ
          </button>
          <button className="mini" type="button">
            🇷🇺 РУС
          </button>
        </div>

        <div className="login-card">
          <div className="icon-box">🔑</div>
          <h2>Войти в систему</h2>
          <p>Войдите в свой аккаунт</p>

          <label htmlFor="email">Email адрес</label>
          <input id="email" type="email" placeholder="example@mail.com" defaultValue="" />

          <label htmlFor="password">Пароль</label>
          <input id="password" type="password" placeholder="••••••••" defaultValue="" />

          <button className="submit" type="button">
            Войти →
          </button>
          <small>
            Нет аккаунта? <a href="#">Зарегистрироваться</a>
          </small>
        </div>
      </div>
    </div>
  )
}

export default App
