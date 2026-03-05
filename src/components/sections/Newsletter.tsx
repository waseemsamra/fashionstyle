import { useEffect, useRef, useState } from 'react';
import { Send, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function Newsletter() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success('Thank you for subscribing!');
    setEmail('');
    setIsSubmitting(false);
  };

  return (
    <section ref={sectionRef} className="section-padding bg-beige-100">
      <div className="container-custom">
        <div className={`relative bg-black rounded-3xl overflow-hidden transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-64 h-64 bg-gold rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
          </div>

          <div className="relative z-10 px-6 py-16 md:py-20 lg:px-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Content */}
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-6">
                  <Mail className="w-4 h-4 text-gold" />
                  <span className="text-white/80 text-sm font-medium">
                    Newsletter
                  </span>
                </div>
                
                <h2 className="font-playfair text-3xl md:text-4xl lg:text-5xl font-semibold text-white mb-4 leading-tight">
                  Subscribe to Our<br />
                  <span className="text-gold font-dancing font-normal">Newsletter</span>
                </h2>
                
                <p className="text-white/70 leading-relaxed max-w-md">
                  Get exclusive offers, early access to new collections, and styling tips 
                  delivered straight to your inbox.
                </p>
              </div>

              {/* Form */}
              <div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-full text-white placeholder:text-white/50 focus:outline-none focus:border-gold transition-colors duration-300"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-6 py-4 bg-gold text-white font-medium rounded-full flex items-center justify-center gap-2 hover:bg-gold-dark transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Subscribing...
                      </span>
                    ) : (
                      <>
                        Subscribe Now
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <p className="text-white/50 text-sm mt-4 text-center">
                  By subscribing, you agree to our Privacy Policy and consent to receive updates.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
