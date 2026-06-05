import Hero from '@/components/sections/Hero';
import Features from '@/components/sections/Features';
import Categories from '@/components/sections/Categories';
import FeaturedCarousel from '@/components/sections/FeaturedCarousel';
import NewArrivals from '@/components/sections/NewArrivals';
import WeddingTales from '@/components/sections/WeddingTales';
import DesignersOnDiscount from '@/components/sections/DesignersOnDiscount';
import SummerCollection from '@/components/sections/SummerCollection';
import TrendingNow from '@/components/sections/TrendingNow';
import LeadingBrands from '@/components/sections/LeadingBrands';
import DesignersSpotlight from '@/components/sections/DesignersSpotlight';
import HandPicked from '@/components/sections/HandPicked';
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
      <SummerCollection />
      <TrendingNow />
      <LeadingBrands />
      <DesignersSpotlight />
      <HandPicked />
      <About />
      <Testimonials />
      <Newsletter />
    </>
  );
}