import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Award, Users, Globe } from 'lucide-react';

export default function About() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const stats = [
    { icon: Award, value: '25+', label: 'Years of Excellence' },
    { icon: Users, value: '50K+', label: 'Happy Customers' },
    { icon: Globe, value: '30+', label: 'Countries Served' },
  ];

  return (
    <section id="about" ref={sectionRef} className="section-padding bg-beige-100 overflow-hidden">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Image Side */}
          <div className={`relative transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-16'}`}>
            {/* Main Image */}
            <div className="relative z-10">
              <div className="aspect-[4/5] rounded-3xl overflow-hidden">
                <img
                  src="/about-image.jpg"
                  alt="About Pakistani Fashion"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-6 -left-6 w-32 h-32 bg-gold/10 rounded-full -z-0" />
            <div className="absolute -bottom-8 -right-8 w-48 h-48 border-2 border-gold/20 rounded-full -z-0" />
            
            {/* Experience Badge */}
            <div className="absolute bottom-8 -right-4 lg:-right-8 bg-white rounded-2xl p-6 shadow-elevated z-20">
              <p className="font-playfair text-4xl font-bold text-gold">25+</p>
              <p className="text-gray-600 text-sm">Years of<br />Excellence</p>
            </div>
          </div>

          {/* Content Side */}
          <div className={`transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-16'}`}>
            <span className="text-gold text-sm font-medium tracking-wider uppercase mb-4 block">
              Our Story
            </span>
            
            <h2 className="font-playfair text-3xl md:text-4xl lg:text-5xl font-semibold text-black mb-6 leading-tight">
              Crafting Elegance<br />
              <span className="text-gold font-dancing font-normal">Since 1995</span>
            </h2>
            
            <div className="space-y-4 text-gray-600 leading-relaxed mb-8">
              <p>
                For over two decades, we have been dedicated to bringing the finest Pakistani 
                fashion to the world. Each piece in our collection is a testament to the rich 
                heritage of craftsmanship and the timeless beauty of traditional designs.
              </p>
              <p>
                Our artisans pour their heart into every stitch, creating garments that tell 
                stories of culture, elegance, and sophistication. From intricate embroidery 
                to delicate beadwork, every detail is meticulously crafted to perfection.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              {stats.map((stat, index) => (
                <div 
                  key={stat.label}
                  className={`text-center transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${index * 100 + 500}ms` }}
                >
                  <stat.icon className="w-6 h-6 text-gold mx-auto mb-2" />
                  <p className="font-playfair text-2xl font-bold text-black">{stat.value}</p>
                  <p className="text-gray-500 text-xs mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <a
              href="#categories"
              className="group inline-flex items-center gap-3 px-8 py-4 bg-black text-white font-medium text-sm tracking-wide rounded-full transition-all duration-300 hover:bg-gold hover:shadow-lg hover:-translate-y-0.5"
            >
              Read Our Story
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
