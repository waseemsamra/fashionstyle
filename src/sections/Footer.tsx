import { Facebook, Instagram, Twitter, MapPin, Phone, Mail, CreditCard, Truck, Shield, RotateCcw } from 'lucide-react';

const footerLinks = {
  shop: [
    { name: 'New Arrivals', href: '#new-arrivals' },
    { name: 'Best Sellers', href: '#featured' },
    { name: 'Sale', href: '#categories' },
    { name: 'Collections', href: '#categories' },
  ],
  customerCare: [
    { name: 'Contact Us', href: '#' },
    { name: 'Shipping Info', href: '#' },
    { name: 'Returns', href: '#' },
    { name: 'FAQ', href: '#' },
  ],
  company: [
    { name: 'About Us', href: '#about' },
    { name: 'Careers', href: '#' },
    { name: 'Press', href: '#' },
    { name: 'Blog', href: '#' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '#' },
    { name: 'Terms of Service', href: '#' },
    { name: 'Cookie Policy', href: '#' },
    { name: 'Admin', href: '/admin/login' },
  ],
};

const socialLinks = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Twitter, href: '#', label: 'Twitter' },
];

const paymentMethods = [
  { name: 'Visa', icon: CreditCard },
  { name: 'Mastercard', icon: CreditCard },
  { name: 'PayPal', icon: CreditCard },
  { name: 'Apple Pay', icon: CreditCard },
];

const features = [
  { icon: Truck, text: 'Free Shipping over $100' },
  { icon: Shield, text: 'Secure Payment' },
  { icon: RotateCcw, text: '30-Day Returns' },
];

export default function Footer() {
  return (
    <footer className="bg-beige-100 border-t border-black/5">
      {/* Features Bar */}
      <div className="border-b border-black/5">
        <div className="container-custom py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div key={feature.text} className="flex items-center justify-center md:justify-start gap-3">
                <feature.icon className="w-5 h-5 text-gold" />
                <span className="text-sm text-gray-600">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container-custom py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <a href="#home" className="inline-block mb-6">
              <span className="font-playfair text-2xl font-semibold">Noor</span>
              <span className="font-dancing text-xl text-gold ml-1">by Faisal</span>
            </a>
            <p className="text-gray-600 text-sm leading-relaxed mb-6 max-w-xs">
              Bringing the finest Pakistani fashion to the world. 
              Experience the elegance of traditional craftsmanship.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-gold" />
                <span>123 Fashion Street, Karachi, Pakistan</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Phone className="w-4 h-4 text-gold" />
                <span>+92 300 1234567</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Mail className="w-4 h-4 text-gold" />
                <span>hello@noorfashion.com</span>
              </div>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="font-playfair text-lg font-semibold mb-5">Shop</h4>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-sm text-gray-600 hover:text-gold transition-colors duration-300 underline-animation"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Care Links */}
          <div>
            <h4 className="font-playfair text-lg font-semibold mb-5">Customer Care</h4>
            <ul className="space-y-3">
              {footerLinks.customerCare.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-sm text-gray-600 hover:text-gold transition-colors duration-300 underline-animation"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-playfair text-lg font-semibold mb-5">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-sm text-gray-600 hover:text-gold transition-colors duration-300 underline-animation"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-playfair text-lg font-semibold mb-5">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-sm text-gray-600 hover:text-gold transition-colors duration-300 underline-animation"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-black/5">
        <div className="container-custom py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <p className="text-sm text-gray-500 text-center md:text-left">
              © 2024 Noor by Faisal. All rights reserved.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 rounded-full bg-beige-200 flex items-center justify-center text-gray-600 hover:bg-gold hover:text-white transition-all duration-300"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>

            {/* Payment Methods */}
            <div className="flex items-center gap-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.name}
                  className="w-10 h-6 bg-white rounded flex items-center justify-center shadow-sm"
                  title={method.name}
                >
                  <method.icon className="w-5 h-3 text-gray-400" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
