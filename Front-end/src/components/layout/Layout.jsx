//src/components/layout/Layout.jsx
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-surface text-text font-sans transition-colors duration-200">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
        <Outlet />
      </main>
      
      {/* Decorative background elements */}
      <div className="fixed top-20 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-status-in-progress/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
    </div>
  );
}