import Hero from '@/components/sections/Hero';
import Features from '@/components/sections/Features';
import Categories from '@/components/sections/Categories';
import FeaturedCarousel from '@/components/sections/FeaturedCarousel';
import NewArrivals from '@/components/sections/NewArrivals';
import WeddingTales from '@/components/sections/WeddingTales';
import DesignersOnDiscount from '@/components/sections/DesignersOnDiscount';
import SummerSale from '@/components/sections/SummerSale';
import About from '@/components/sections/About';
import Testimonials from '@/components/sections/Testimonials';
import Newsletter from '@/components/sections/Newsletter';

export default function Home() {
  return (
    <>
      <Hero />
      <Features />
      <Categories />
      <FeaturedCarousel />
      <NewArrivals />
      <WeddingTales />
      <DesignersOnDiscount />
      <SummerSale />
      <About />
      <Testimonials />
      <Newsletter />
    </>
  );
}
