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

        <div className="brand">Приемная Комиссия</div>
        <p className="tag">Образовательный портал университета</p>
        <h1>Первый шаг в будущее</h1>
        <p className="subtext">
          Выбор, контроль статуса и взаимодействие с приемной комиссией в одном окне.
        </p>

        <div className="stats">
          <div className="stat-card">
            <span>Статус</span>
            <strong>24/7</strong>
            <small>поддержка</small>
          </div>
          <div className="stat-card">
            <span>Быстро</span>
            <strong>140</strong>
            <small>заявок/день</small>
          </div>
          <div className="stat-card">
            <span>Точность</span>
            <strong>100%</strong>
            <small>статусы</small>
          </div>
        </div>
      </div>

      <div className="right-pane">
        <div className="top-actions">
          <button className="mini active" type="button">
            КАЗ
          </button>
          <button className="mini" type="button">
            РУС
          </button>
        </div>

        <div className="login-card">
          <div className="icon-box">🔐</div>
          <h2>Войти в систему</h2>
          <p>Введите свои данные</p>

          <label htmlFor="email">Email адрес</label>
          <input id="email" type="email" placeholder="example@mail.com" />

          <label htmlFor="password">Пароль</label>
          <input id="password" type="password" placeholder="••••••••" />

          <button className="submit" type="button">
            Войти
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
