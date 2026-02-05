import { Box } from '@mui/material'
import Header from './components/Header'
import Hero from './components/Hero'
import SocialProofBar from './components/SocialProofBar'
import ProblemSection from './components/ProblemSection'
import HowItWorks from './components/HowItWorks'
import Features from './components/Features'
import Testimonials from './components/Testimonials'
import Integrations from './components/Integrations'
import Pricing from './components/Pricing'
import FAQ from './components/FAQ'
import FinalCTA from './components/FinalCTA'
import Footer from './components/Footer'

export default function LandingPage() {
  return (
    <Box>
      <Header />
      <Hero />
      <SocialProofBar />
      <ProblemSection />
      <HowItWorks />
      <Features />
      <Testimonials />
      <Integrations />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </Box>
  )
}
