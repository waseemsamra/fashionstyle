import Hero from '@/components/sections/Hero';
import Features from '@/components/sections/Features';
import Categories from '@/components/sections/Categories';
import FeaturedProducts from '@/components/sections/FeaturedProducts';
import NewArrivals from '@/components/sections/NewArrivals';
import About from '@/components/sections/About';
import Testimonials from '@/components/sections/Testimonials';
import Newsletter from '@/components/sections/Newsletter';

export default function Home() {
  return (
    <>
      <Hero />
      <Features />
      <Categories />
      <FeaturedProducts />
      <NewArrivals />
      <About />
      <Testimonials />
      <Newsletter />
    </>
  );
}
