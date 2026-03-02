import { useEffect, useRef } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current || !contentRef.current) return;
      const scrollY = window.scrollY;
      const heroHeight = heroRef.current.offsetHeight;
      const progress = Math.min(scrollY / heroHeight, 1);
      
      // Parallax effect for background
      const bgElement = heroRef.current.querySelector('.hero-bg') as HTMLElement;
      if (bgElement) {
        bgElement.style.transform = `translateY(${scrollY * 0.5}px) scale(${1 + progress * 0.05})`;
      }
      
      // Fade out content on scroll
      if (contentRef.current) {
        contentRef.current.style.opacity = `${1 - progress * 1.5}`;
        contentRef.current.style.transform = `translateY(${scrollY * 0.3}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section
      id="home"
      ref={heroRef}
      className="relative min-h-screen w-full overflow-hidden flex items-center"
    >
      {/* Background Image with Parallax */}
      <div className="hero-bg absolute inset-0 w-full h-full">
        <img
          src="/hero-image.jpg"
          alt="Pakistani Fashion"
          className="w-full h-full object-cover"
        />
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 right-10 w-32 h-32 border border-white/20 rounded-full animate-float opacity-30" />
      <div className="absolute bottom-40 right-20 w-20 h-20 border border-gold/30 rounded-full animate-float animation-delay-500 opacity-40" />
      <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-gold rounded-full animate-pulse-soft" />

      {/* Content */}
      <div
        ref={contentRef}
        className="relative z-10 container-custom pt-24"
      >
        <div className="max-w-2xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6 animate-fade-in-up">
            <Sparkles className="w-4 h-4 text-gold" />
            <span className="text-white/90 text-sm font-medium tracking-wide">
              New Collection 2024
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-playfair text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white font-semibold leading-tight mb-6">
            <span className="block overflow-hidden">
              <span className="block animate-slide-in-left">Discover the</span>
            </span>
            <span className="block overflow-hidden">
              <span className="block animate-slide-in-left animation-delay-200">
                Elegance of{' '}
                <span className="text-gold font-dancing font-normal">Pakistani</span>
              </span>
            </span>
            <span className="block overflow-hidden">
              <span className="block animate-slide-in-left animation-delay-300">Fashion</span>
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-white/80 text-base md:text-lg leading-relaxed mb-8 max-w-lg animate-fade-in-up animation-delay-400">
            Exquisite handcrafted dresses that blend tradition with contemporary style. 
            Experience the beauty of authentic Pakistani craftsmanship.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up animation-delay-500">
            <a
              href="/shop"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-black font-medium text-sm tracking-wide rounded-full transition-all duration-300 hover:bg-gold hover:text-white hover:shadow-xl hover:-translate-y-0.5"
            >
              Shop Collection
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
            <a
              href="/new-arrivals"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent text-white border border-white/30 font-medium text-sm tracking-wide rounded-full transition-all duration-300 hover:bg-white/10 hover:border-white/50"
            >
              Explore New Arrivals
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-white/20 animate-fade-in-up animation-delay-600">
            <div>
              <p className="font-playfair text-3xl md:text-4xl text-gold font-semibold">25+</p>
              <p className="text-white/60 text-sm mt-1">Years Experience</p>
            </div>
            <div>
              <p className="font-playfair text-3xl md:text-4xl text-gold font-semibold">10K+</p>
              <p className="text-white/60 text-sm mt-1">Happy Customers</p>
            </div>
            <div>
              <p className="font-playfair text-3xl md:text-4xl text-gold font-semibold">500+</p>
              <p className="text-white/60 text-sm mt-1">Unique Designs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-beige-100 to-transparent" />
    </section>
  );
}
