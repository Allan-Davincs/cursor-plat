import { Link } from 'react-router-dom';
import { Package, Mail, MapPin, Phone, Github, Twitter, Instagram } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">
                <span className="text-gradient">Luxe</span>Store
              </span>
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
              Premium products curated for the modern lifestyle. Quality meets elegance in every item.
            </p>
            <div className="flex items-center gap-3">
              {[Github, Twitter, Instagram].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 dark:hover:text-primary-400 transition-all"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              {[{ to: '/products', label: 'All Products' }, { to: '/categories', label: 'Categories' }, { to: '/products?featured=true', label: 'Featured' }, { to: '/admin', label: 'Admin' }].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Customer Care</h4>
            <ul className="space-y-3 text-sm">
              {['Shipping Info', 'Returns & Exchanges', 'FAQ', 'Size Guide'].map(text => (
                <li key={text}>
                  <a href="#" className="text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    {text}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <Mail className="w-4 h-4" /> hello@luxestore.com
              </li>
              <li className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <Phone className="w-4 h-4" /> +1 (234) 567-890
              </li>
              <li className="flex items-start gap-2 text-gray-500 dark:text-gray-400">
                <MapPin className="w-4 h-4 mt-0.5" /> 123 Commerce St, Tech City
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
          <p>&copy; {new Date().getFullYear()} LuxeStore. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-primary-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-primary-600 transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
