import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import useVisitTracker from './hooks/useVisitTracker'
import Home from './pages/Home'
import Interviews from './pages/Interviews'
import Categories from './pages/Categories'
import Topics from './pages/Topics'
import About from './pages/About'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import Dashboard from './pages/Dashboard'
import NotFound from './pages/NotFound'
import styles from './App.module.scss'

function AppContent() {
  useVisitTracker()

  return (
    <div className={styles.app}>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/interviews" element={<Interviews />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/topics" element={<Topics />} />
          <Route path="/about" element={<About />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
