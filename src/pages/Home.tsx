import Hero from '@/sections/Hero';
import Features from '@/sections/Features';
import Categories from '@/sections/Categories';
import FeaturedProducts from '@/sections/FeaturedProducts';
import NewArrivals from '@/sections/NewArrivals';
import About from '@/sections/About';
import Testimonials from '@/sections/Testimonials';
import Newsletter from '@/sections/Newsletter';

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
