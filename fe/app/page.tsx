import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Features from "@/components/Features";
import RunningMouse from "@/components/RunningMouse";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <RunningMouse />
      <HowItWorks />
      
      <Features />
      <Footer/>
    
      
    </main>
  );
}
