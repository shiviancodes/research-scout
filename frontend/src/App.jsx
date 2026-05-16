import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import History from './pages/History.jsx';
import BriefViewer from './pages/BriefViewer.jsx';
import Standards from './pages/Standards.jsx';

export default function App() {
  return (
    <div
      className="text-zinc-100"
      style={{ backgroundColor: '#0a0a0a', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
    >
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-10 page-enter" style={{ flex: 1, width: '100%' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/history" element={<History />} />
          <Route path="/brief/:domain/:filename" element={<BriefViewer />} />
          <Route path="/standards" element={<Standards />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function NotFound() {
  return (
    <div className="text-zinc-400">
      <h1 className="text-2xl font-semibold mb-2">Not found</h1>
      <p>That route does not exist.</p>
    </div>
  );
}
