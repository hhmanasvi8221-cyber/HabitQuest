import { useEffect, useMemo, useState } from 'react'
import './App.css'

const HABITS_KEY = 'habitquest-habits'
const COMPLETIONS_KEY = 'habitquest-completions'
const THEME_KEY = 'habitquest-theme'

const starterHabits = [
  { id: 'move-body', name: 'Move your body', category: 'Fitness', icon: '🏃', color: 'orange', time: '30 min' },
  { id: 'read-pages', name: 'Read 10 pages', category: 'Learning', icon: '📚', color: 'blue', time: '10 pages' },
  { id: 'drink-water', name: 'Drink more water', category: 'Wellness', icon: '💧', color: 'cyan', time: '8 glasses' },
  { id: 'morning-journal', name: 'Morning journal', category: 'Mindfulness', icon: '✍️', color: 'pink', time: '5 min' },
]

const habitIcons = ['🏃', '📚', '💧', '✍️', '🧘', '🥗', '💤', '🎨', '🌱', '🎯', '🚶', '🧠']
const colorOptions = ['purple', 'orange', 'blue', 'cyan', 'pink', 'green']
const weekdayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function readStoredValue(key, fallback) {
  try {
    const value = window.localStorage.getItem(key)
    return value === null ? fallback : JSON.parse(value)
  } catch (error) {
    console.error(`Unable to read HabitQuest data (${key}).`, error)
    return fallback
  }
}

function writeStoredValue(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Unable to save HabitQuest data (${key}).`, error)
  }
}

function Icon({ name, size = 18 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }
  const paths = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></>,
    list: <><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4 6h.01M4 12h.01M4 18h.01" /></>,
    chart: <><path d="M4 19V5M4 19h17" /><path d="m7 14 4-4 3 2 6-7" /></>,
    trophy: <><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" /><path d="M7 7H4v2a4 4 0 0 0 4 4M17 7h3v2a4 4 0 0 1-4 4" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.8-.7a8 8 0 0 1-1.5.9l-.3 1.9h-2.8l-.3-1.9a8 8 0 0 1-1.5-.9l-1.8.7-1.4-2.4L7.5 15a8 8 0 0 1 0-1.8L6.1 12l1.4-2.4 1.8.7a8 8 0 0 1 1.5-.9l.3-1.9h2.8l.3 1.9a8 8 0 0 1 1.5.9l1.8-.7 1.4 2.4-1.4 1.2a8 8 0 0 1-.1 1.8Z" transform="translate(-1 -1) scale(1.08)" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>,
    moon: <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
    arrow: <><path d="M7 17 17 7M7 7h10v10" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></>,
    flame: <path d="M12 22a7 7 0 0 0 7-7c0-3.8-2.5-6.2-4.5-9-.5 2.4-1.8 3.6-2.5 4C12 6.5 10.4 3.7 8 2 8.5 6.5 5 9.1 5 15a7 7 0 0 0 7 7Z" />,
    edit: <><path d="m16 4 4 4M4 20l4-.8L19 8a2.8 2.8 0 0 0-4-4L4 15l-.8 5Z" /></>,
    trash: <><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" /></>,
  }
  return <svg {...common}>{paths[name] || paths.home}</svg>
}

function Modal({ habit, onClose, onSave }) {
  const [name, setName] = useState(habit?.name || '')
  const [category, setCategory] = useState(habit?.category || 'Wellness')
  const [icon, setIcon] = useState(habit?.icon || '🌱')
  const [time, setTime] = useState(habit?.time || '')
  const [color, setColor] = useState(habit?.color || 'purple')

  function handleSubmit(event) {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return
    onSave({ ...habit, id: habit?.id || `habit-${Date.now()}`, name: trimmedName, category, icon, time: time.trim(), color })
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="habit-modal" role="dialog" aria-modal="true" aria-labelledby="habit-modal-title">
        <div className="modal-heading">
          <div>
            <span className="eyebrow">{habit ? 'MAKE IT YOURS' : 'BUILD A BETTER DAY'}</span>
            <h2 id="habit-modal-title">{habit ? 'Edit habit' : 'Create a habit'}</h2>
          </div>
          <button className="icon-button" type="button" aria-label="Close dialog" onClick={onClose}><Icon name="close" /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="habit-name">Habit name</label>
          <input autoFocus id="habit-name" className="text-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Take a mindful walk" maxLength={48} required />
          <div className="form-row">
            <div>
              <label className="field-label" htmlFor="habit-category">Category</label>
              <select id="habit-category" className="text-input" value={category} onChange={(event) => setCategory(event.target.value)}>
                {['Wellness', 'Fitness', 'Learning', 'Mindfulness', 'Nutrition', 'Creativity', 'Other'].map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="habit-time">Daily goal <span className="optional">(optional)</span></label>
              <input id="habit-time" className="text-input" value={time} onChange={(event) => setTime(event.target.value)} placeholder="e.g. 20 min" maxLength={24} />
            </div>
          </div>
          <span className="field-label">Choose an icon</span>
          <div className="icon-picker" role="group" aria-label="Habit icon">
            {habitIcons.map((choice) => <button key={choice} className={`emoji-option ${icon === choice ? 'selected' : ''}`} type="button" aria-label={`Choose ${choice}`} aria-pressed={icon === choice} onClick={() => setIcon(choice)}>{choice}</button>)}
          </div>
          <span className="field-label">Card accent</span>
          <div className="color-picker" role="group" aria-label="Card accent color">
            {colorOptions.map((choice) => <button key={choice} type="button" className={`color-option ${choice} ${color === choice ? 'selected' : ''}`} aria-label={`Choose ${choice} accent`} aria-pressed={color === choice} onClick={() => setColor(choice)} />)}
          </div>
          <div className="modal-actions">
            <button type="button" className="button button-quiet" onClick={onClose}>Cancel</button>
            <button type="submit" className="button button-primary"><Icon name="check" size={16} />{habit ? 'Save changes' : 'Add habit'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function App() {
  const [habits, setHabits] = useState(() => {
    const stored = readStoredValue(HABITS_KEY, null)
    return Array.isArray(stored) ? stored : starterHabits
  })
  const [completions, setCompletions] = useState(() => {
    const stored = readStoredValue(COMPLETIONS_KEY, {})
    return stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {}
  })
  const [theme, setTheme] = useState(() => {
    const stored = readStoredValue(THEME_KEY, 'dark')
    return stored === 'light' ? 'light' : 'dark'
  })
  const [modalHabit, setModalHabit] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [activeNav, setActiveNav] = useState('Today')
  const [today, setToday] = useState(() => new Date())

  useEffect(() => {
    writeStoredValue(HABITS_KEY, habits)
  }, [habits])

  useEffect(() => {
    writeStoredValue(COMPLETIONS_KEY, completions)
  }, [completions])

  useEffect(() => {
    writeStoredValue(THEME_KEY, theme)
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    const timer = window.setInterval(() => {
      const currentDate = new Date()
      if (localDateKey(currentDate) !== localDateKey(today)) setToday(currentDate)
    }, 60_000)
    return () => window.clearInterval(timer)
  }, [today])

  const todayKey = localDateKey(today)
  const completedToday = completions[todayKey] || []
  const completedCount = habits.filter((habit) => completedToday.includes(habit.id)).length
  const progress = habits.length ? Math.round((completedCount / habits.length) * 100) : 0
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (6 - index))
    const dateKey = localDateKey(date)
    const ids = completions[dateKey] || []
    const count = habits.filter((habit) => ids.includes(habit.id)).length
    return { date, dateKey, count, percentage: habits.length ? Math.round((count / habits.length) * 100) : 0 }
  }), [today, completions, habits])
  const streak = useMemo(() => {
    let count = 0
    const cursor = new Date(today)
    if (!(completions[localDateKey(cursor)] || []).length) cursor.setDate(cursor.getDate() - 1)
    while ((completions[localDateKey(cursor)] || []).some((id) => habits.some((habit) => habit.id === id))) {
      count += 1
      cursor.setDate(cursor.getDate() - 1)
    }
    return count
  }, [today, completions, habits])
  const totalCheckIns = Object.values(completions).reduce((sum, day) => sum + (Array.isArray(day) ? day.length : 0), 0)
  const dateLabel = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 18 ? 'Good afternoon' : 'Good evening'

  function toggleHabit(id) {
    setCompletions((current) => {
      const day = current[todayKey] || []
      const nextDay = day.includes(id) ? day.filter((item) => item !== id) : [...day, id]
      return { ...current, [todayKey]: nextDay }
    })
  }

  function saveHabit(habit) {
    setHabits((current) => current.some((item) => item.id === habit.id)
      ? current.map((item) => item.id === habit.id ? habit : item)
      : [...current, habit])
    setModalOpen(false)
    setModalHabit(null)
  }

  function deleteHabit(id) {
    setHabits((current) => current.filter((habit) => habit.id !== id))
    setCompletions((current) => Object.fromEntries(Object.entries(current).map(([date, ids]) => [date, ids.filter((item) => item !== id)])))
  }

  function openModal(habit = null) {
    setModalHabit(habit)
    setModalOpen(true)
  }

  function navigate(label, target) {
    setActiveNav(label)
    document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const allDone = habits.length > 0 && completedCount === habits.length
  const badges = [
    { icon: '🌱', title: 'First step', description: 'Complete your first habit', unlocked: totalCheckIns > 0 },
    { icon: '🔥', title: 'On a roll', description: 'Build a 3-day streak', unlocked: streak >= 3 },
    { icon: '💜', title: 'Habit hero', description: 'Complete 25 habits', unlocked: totalCheckIns >= 25 },
  ]

  return (
    <div className="app-shell" data-theme={theme}>
      <aside className="sidebar">
        <a className="brand" href="#today" onClick={() => setActiveNav('Today')}>
          <span className="brand-mark"><span /><span /><span /></span>
          <span>habit<span className="brand-light">quest</span><small>MAKE TODAY COUNT</small></span>
        </a>
        <div className="side-label">WORKSPACE</div>
        <nav className="main-nav" aria-label="Main navigation">
          <button className={activeNav === 'Today' ? 'active' : ''} onClick={() => navigate('Today', 'today')}><Icon name="home" /><span>Today</span></button>
          <button className={activeNav === 'My habits' ? 'active' : ''} onClick={() => navigate('My habits', 'habits')}><Icon name="list" /><span>My habits</span><span className="nav-count">{habits.length}</span></button>
          <button className={activeNav === 'Insights' ? 'active' : ''} onClick={() => navigate('Insights', 'insights')}><Icon name="chart" /><span>Insights</span></button>
          <button className={activeNav === 'Achievements' ? 'active' : ''} onClick={() => navigate('Achievements', 'achievements')}><Icon name="trophy" /><span>Achievements</span></button>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <div className="tip-sparkle">✦</div>
            <strong>Small steps, big change.</strong>
            <p>Consistency is built one day at a time. Keep showing up for yourself.</p>
            <span>YOU'VE GOT THIS <span aria-hidden="true">↗</span></span>
          </div>
          <button className="profile-card" type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle color theme">
            <span className="avatar">H</span>
            <span className="profile-text"><strong>Habit explorer</strong><small>Your personal space</small></span>
            <span className="profile-theme"><Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17} /></span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-slash">/</span><strong>{activeNav}</strong></div>
          <div className="topbar-actions">
            <span className="today-pill"><Icon name="calendar" size={15} />{today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            <button className="theme-toggle" type="button" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}><Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17} /></button>
            <span className="top-avatar">H</span>
          </div>
        </header>

        <div className="dashboard">
          <section id="today" className="welcome-section">
            <div>
              <div className="date-line"><span className="date-dot" />{dateLabel}</div>
              <h1>{greeting}, <span>Habit explorer</span> <span className="wave">✦</span></h1>
              <p className="welcome-copy">A fresh day, a fresh chance to become who you want to be.</p>
            </div>
            <div className="week-streak"><span className="streak-icon"><Icon name="flame" size={18} /></span><span><strong>{streak} day{streak === 1 ? '' : 's'}</strong><small>current streak</small></span><span className="streak-divider" /><span className="streak-best">{weekDays.filter((day) => day.count > 0).length}<small>active this week</small></span></div>
          </section>

          <section className="summary-grid" aria-label="Daily summary">
            <article className="summary-card progress-card">
              <div className="summary-top"><span className="summary-label">DAILY PROGRESS</span><span className="summary-icon purple-icon"><Icon name="chart" size={17} /></span></div>
              <div className="progress-content"><strong className="summary-number">{progress}<span>%</span></strong><div className="progress-ring" style={{ '--progress': `${progress * 3.6}deg` }}><div><Icon name={allDone ? 'check' : 'flame'} size={18} /></div></div></div>
              <div className="summary-foot"><span>{completedCount} of {habits.length} habits complete</span><span className="mini-progress"><i style={{ width: `${progress}%` }} /></span></div>
            </article>
            <article className="summary-card">
              <div className="summary-top"><span className="summary-label">HABITS TODAY</span><span className="summary-icon green-icon"><Icon name="check" size={17} /></span></div>
              <div className="summary-number">{completedCount}<span className="number-muted"> / {habits.length}</span></div>
              <div className="summary-foot"><span>{allDone ? 'You showed up for every habit' : 'Every check-in is a win'}</span><span className="status-dot">● LIVE</span></div>
            </article>
            <article className="summary-card">
              <div className="summary-top"><span className="summary-label">CURRENT STREAK</span><span className="summary-icon orange-icon"><Icon name="flame" size={17} /></span></div>
              <div className="summary-number">{streak}<span className="number-muted"> day{streak === 1 ? '' : 's'}</span></div>
              <div className="summary-foot"><span>{streak >= 3 ? 'You’re on fire. Keep it up!' : 'Your next milestone: 3 days'}</span><span className="streak-emoji">🔥</span></div>
            </article>
          </section>

          <section className="content-grid">
            <div id="habits" className="habits-panel panel">
              <div className="panel-heading">
                <div><div className="section-kicker"><span className="heading-dot" />YOUR ROUTINE</div><h2>Today’s habits <span className="habit-total">{habits.length}</span></h2></div>
                <button className="button button-primary add-button" onClick={() => openModal()}><Icon name="plus" size={17} /><span>Add habit</span></button>
              </div>
              {habits.length ? (
                <div className="habit-list">
                  {habits.map((habit) => {
                    const isComplete = completedToday.includes(habit.id)
                    return (
                      <article className={`habit-row ${isComplete ? 'is-complete' : ''}`} key={habit.id}>
                        <button className={`habit-check ${isComplete ? 'checked' : ''}`} type="button" aria-label={`${isComplete ? 'Mark' : 'Complete'} ${habit.name} ${isComplete ? 'incomplete' : 'complete'}`} aria-pressed={isComplete} onClick={() => toggleHabit(habit.id)}>{isComplete && <Icon name="check" size={15} />}</button>
                        <div className={`habit-emoji ${habit.color || 'purple'}`}>{habit.icon}</div>
                        <div className="habit-info"><strong>{habit.name}</strong><span>{habit.category}{habit.time ? <><i />{habit.time}</> : null}</span></div>
                        <span className={`habit-state ${isComplete ? 'done' : ''}`}>{isComplete ? 'Completed' : 'Up next'}</span>
                        <div className="habit-actions">
                          <button className="icon-button small" type="button" aria-label={`Edit ${habit.name}`} onClick={() => openModal(habit)}><Icon name="edit" size={15} /></button>
                          <button className="icon-button small delete-button" type="button" aria-label={`Delete ${habit.name}`} onClick={() => deleteHabit(habit.id)}><Icon name="trash" size={15} /></button>
                        </div>
                      </article>
                    )
                  })}
                </div>
              ) : (
                <div className="empty-state"><span className="empty-emoji">🌿</span><strong>Your next chapter starts here</strong><p>Add a small daily habit and start building momentum.</p><button className="button button-primary" onClick={() => openModal()}><Icon name="plus" size={16} />Create your first habit</button></div>
              )}
              <div className={`encouragement ${allDone ? 'encouragement-done' : ''}`}><span className="encouragement-icon">{allDone ? '🎉' : '✦'}</span><span><strong>{allDone ? 'You did it — your day is complete!' : 'Progress, not perfection.'}</strong><small>{allDone ? 'Take a moment to celebrate showing up.' : 'One small win is still a win. Keep going!'}</small></span><span className="encouragement-sparkle">✧</span></div>
            </div>

            <div id="insights" className="insights-panel panel">
              <div className="panel-heading insights-heading"><div><div className="section-kicker"><span className="heading-dot" />YOUR MOMENTUM</div><h2>This week</h2></div><button className="period-button" type="button"><span>7 days</span><span>⌄</span></button></div>
              <div className="chart-summary"><strong>{weekDays.reduce((sum, day) => sum + day.count, 0)}</strong><span> check-ins</span><span className="chart-trend"><Icon name="arrow" size={13} /> this week</span></div>
              <div className="chart-area" role="img" aria-label={`Weekly activity chart: ${weekDays.map((day) => `${weekdayShort[day.date.getDay()]} ${day.count} completed`).join(', ')}`}>
                <div className="chart-guides"><span>100%</span><span>50%</span><span>0%</span><i /><i /><i /></div>
                <div className="chart-bars">
                  {weekDays.map((day) => <div className={`chart-day ${day.dateKey === todayKey ? 'is-today' : ''}`} key={day.dateKey}><div className="bar-track"><div className={`bar-fill ${day.percentage === 100 && habits.length ? 'full' : ''}`} style={{ height: `${Math.max(day.percentage, day.count ? 8 : 3)}%` }}><span>{day.count > 0 ? day.count : ''}</span></div></div><span className="chart-day-label">{weekdayShort[day.date.getDay()]}</span></div>)}
                </div>
              </div>
              <div className="chart-footer"><span><i className="legend-dot" />Habits completed</span><span className="chart-footer-note"><span className="legend-outline" />Today</span></div>
              <div className="weekly-note"><span className="note-icon">✧</span><p><strong>{weekDays.filter((day) => day.count > 0).length ? `${weekDays.filter((day) => day.count > 0).length} active days` : 'Your week starts now'}</strong> — {weekDays.filter((day) => day.count > 0).length ? 'you’re creating a rhythm worth keeping.' : 'check off a habit to see your momentum grow.'}</p></div>
            </div>
          </section>

          <section id="achievements" className="achievements-panel panel">
            <div className="panel-heading achievements-heading"><div><div className="section-kicker"><span className="heading-dot" />LITTLE WINS, BIG DEAL</div><h2>Your achievements</h2></div><span className="badge-count">{badges.filter((badge) => badge.unlocked).length} <span>/ {badges.length} unlocked</span></span></div>
            <div className="badge-grid">{badges.map((badge) => <article key={badge.title} className={`badge-card ${badge.unlocked ? 'unlocked' : ''}`}><div className="badge-icon">{badge.icon}</div><div><strong>{badge.title}</strong><span>{badge.description}</span></div><span className={`badge-status ${badge.unlocked ? 'earned' : ''}`}>{badge.unlocked ? 'EARNED' : 'LOCKED'}</span></article>)}</div>
          </section>

          <footer className="dashboard-footer">Built with care by Manasvi HH</footer>
        </div>
      </main>
      {modalOpen && <Modal habit={modalHabit} onClose={() => { setModalOpen(false); setModalHabit(null) }} onSave={saveHabit} />}
    </div>
  )
}

export default App
