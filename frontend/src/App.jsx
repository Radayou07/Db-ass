import { useState } from 'react'
import './App.css'
import SideBar from "./components/SideBar"
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home     from './pages/Home'
import Product  from './pages/Product'
import Order    from './pages/Order'
import Customer from './pages/Customer'
import Supplier from './pages/Supplier'
import Analysis from './pages/Analysis'
import About    from './pages/About'

function App() {
  const [isDark, setIsDark] = useState(false)

  return (
    // Single dark class at the root — the cascade handles everything inside
    <div className={isDark ? "dark" : ""}>
      <Router>
        <div className="flex flex-row h-screen bg-main-bg dark:bg-main-dark-bg">
          <SideBar isDark={isDark} setIsDark={setIsDark} />
          <main className="flex-1 h-screen overflow-y-auto">
            <Routes>
              <Route path="/"         element={<Home />} />
              <Route path="/product"  element={<Product />} />
              <Route path="/order"    element={<Order />} />
              <Route path="/customer" element={<Customer />} />
              <Route path="/supplier" element={<Supplier />} />
              <Route path="/analysis" element={<Analysis />} />
              <Route path="/about"    element={<About />} />
            </Routes>
          </main>
        </div>
      </Router>
    </div>
  )
}

export default App