import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface HomePageProps {
  user: User;
  onNavigateToDashboard: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ user, onNavigateToDashboard }) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      quote: "KRONOSX AI has completely revolutionized our content integrity audits. We process millions of text blocks with near-zero latency, flagging coordinated bot networks instantly.",
      author: "Dr. Elena Rostova",
      role: "Director of Integrity Research, Global Communications Institute",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=150&auto=format&fit=crop"
    },
    {
      quote: "As an enterprise news publisher, credibility is our currency. KRONOSX provides our editorial team with instant claims verification, serving as a trusted line of defense.",
      author: "Marcus Vance",
      role: "VP of News Integrity, Axiom Syndicate Press",
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=150&auto=format&fit=crop"
    },
    {
      quote: "The explainable AI insights are what set this platform apart. We don't just get a credibility score; we receive a clear, trace-backed reasoning path for every claim analyzed.",
      author: "Sarah Jenkins",
      role: "Lead Fact Checker, Verification Alliance",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <div className="space-y-32">
      
      {/* 1. Immersive Hero Section */}
      <section className="relative pt-12 md:pt-20 pb-16 flex flex-col items-center justify-center text-center">
        
        {/* Neon Background Glows */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full radial-glow-cyan pointer-events-none opacity-60"></div>
        <div className="absolute top-1/3 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] rounded-full radial-glow-purple pointer-events-none opacity-60"></div>
        
        <div className="max-w-5xl w-full mx-auto space-y-8 z-10">
          
          {/* Futuristic Badge */}
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-cyan-400/20 bg-cyan-950/20 text-cyan-400 text-xs font-bold uppercase tracking-widest animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,1)]"></span>
            <span>KRONOSX AI Generative V2.5 Ready</span>
          </div>

          <h1 className="text-5xl md:text-8xl font-black font-heading tracking-tight leading-none text-white">
            Detect Misinformation <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 hover:brightness-110 transition-all duration-300">
              Before It Spreads
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/60 max-w-3xl mx-auto font-sans leading-relaxed">
            Harness the power of KRONOSX AI's advanced NLP pipelines, Vision Transformers, and live narrative indexing. Detect manipulated media, evaluate article authenticity, and audit global credibility threats in under 120 milliseconds.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <button 
              onClick={onNavigateToDashboard} 
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-sm uppercase tracking-wider transition-all duration-300 transform hover:scale-105 hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] focus:outline-none"
            >
              Access Control Console
            </button>
            <a 
              href="#features" 
              className="w-full sm:w-auto px-8 py-4 rounded-xl glass border border-white/10 hover:border-cyan-400/30 hover:bg-white/5 text-white/80 hover:text-white font-extrabold text-sm uppercase tracking-wider transition-all duration-300"
            >
              Analyze Features
            </a>
          </div>

        </div>

        {/* Hero Interactive Scanning Visualizer */}
        <div className="w-full max-w-4xl mt-20 z-10 animate-float">
          <div className="glass rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden">
            <div className="px-6 py-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <span className="text-xs text-white/40 font-mono pl-4">credibility-auditor-v2.5 // Live-feed</span>
              </div>
              <span className="text-xs text-cyan-400 font-mono uppercase tracking-widest bg-cyan-400/10 px-2 py-0.5 rounded">Active Network</span>
            </div>
            
            <div className="p-6 md:p-8 space-y-6 text-left">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Metric 1 */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-xs text-white/40 uppercase tracking-widest font-bold">Global Accuracy Index</p>
                  <p className="text-3xl font-black text-white font-heading mt-1">99.82%</p>
                  <p className="text-[10px] text-green-400 font-mono mt-1">▲ 0.04% Verified Node Accuracy</p>
                </div>
                
                {/* Metric 2 */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-xs text-white/40 uppercase tracking-widest font-bold">Latency Overhead</p>
                  <p className="text-3xl font-black text-white font-heading mt-1">114ms</p>
                  <p className="text-[10px] text-cyan-400 font-mono mt-1">■ NLP Transformer Batch Size: 64</p>
                </div>

                {/* Metric 3 */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-xs text-white/40 uppercase tracking-widest font-bold">Narratives cataloged</p>
                  <p className="text-3xl font-black text-white font-heading mt-1">4.2M+</p>
                  <p className="text-[10px] text-purple-400 font-mono mt-1">▼ 1,204 threat campaigns cataloged</p>
                </div>

              </div>

              {/* Scrolling Simulated Feed */}
              <div className="space-y-2 font-mono text-xs text-white/70 p-4 bg-cyber-dark/80 rounded-xl border border-white/5 max-h-[140px] overflow-hidden select-none">
                <p className="text-green-400">&gt; INITIALIZING PRE-TRANSFORM DATA CLEANING PIPELINE...</p>
                <p className="text-cyan-400">&gt; SOURCE VERIFIED: Reuter News Hub [Confidence 98.4%]</p>
                <p className="text-yellow-400">&gt; WARNING: Deepfake anomalies detected in binary frame header [ID: 8089-A]</p>
                <p className="text-purple-400">&gt; RUNNING CLAIMS DISPATCHER ON NARRATIVE VECTOR FIELD 404B...</p>
                <p className="text-red-500">&gt; MISINFORMATION THREAT MITIGATED: Coordinated propaganda ring flagged.</p>
              </div>

            </div>
          </div>
        </div>

      </section>

      {/* 2. SaaS Features Grid */}
      <section id="features" className="container mx-auto px-6 sm:px-8 space-y-16">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h2 className="text-xs text-cyan-400 uppercase tracking-widest font-black">Robust Infrastructure</h2>
          <p className="text-3xl md:text-5xl font-black font-heading text-white">Military-Grade Core Verification Engine</p>
          <p className="text-white/60">An intelligent web of NLP neural nets, Vision transformers, and live social narrative trackers working to keep digital assets secure.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Card 1 */}
          <div className="glass glass-card p-8 rounded-2xl border border-white/5 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.15)]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
              </div>
              <h3 className="text-xl font-bold font-heading text-white">NLP Claims Parsing</h3>
              <p className="text-sm text-white/60 leading-relaxed">Breaks text into logical claims segments, scanning semantic elements for factual alignment against decentralized, authenticated global databases.</p>
            </div>
            <span className="text-xs text-cyan-400 font-mono mt-4 inline-block">Learn More &gt;</span>
          </div>

          {/* Card 2 */}
          <div className="glass glass-card p-8 rounded-2xl border border-white/5 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 shadow-[0_0_15px_rgba(189,0,255,0.15)]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
              </div>
              <h3 className="text-xl font-bold font-heading text-white">Deep Learning Engine</h3>
              <p className="text-sm text-white/60 leading-relaxed">Recognizes syntactic profiles and emotional manipulation strategies. Detects fake news templates before traditional fact checkers index them.</p>
            </div>
            <span className="text-xs text-purple-400 font-mono mt-4 inline-block">Learn More &gt;</span>
          </div>

          {/* Card 3 */}
          <div className="glass glass-card p-8 rounded-2xl border border-white/5 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              </div>
              <h3 className="text-xl font-bold font-heading text-white">Vision Authenticity Audit</h3>
              <p className="text-sm text-white/60 leading-relaxed">Examines metadata structural anomalies, color-channel discrepancies, and noise-distribution templates to detect AI-generated imagery and deepfakes.</p>
            </div>
            <span className="text-xs text-indigo-400 font-mono mt-4 inline-block">Learn More &gt;</span>
          </div>

          {/* Card 4 */}
          <div className="glass glass-card p-8 rounded-2xl border border-white/5 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
              </div>
              <h3 className="text-xl font-bold font-heading text-white">Narrative Diffusion Trace</h3>
              <p className="text-sm text-white/60 leading-relaxed">Tracks the velocity, network spread, and source origins of malicious talking points to mitigate organized viral disinformation campaigns early.</p>
            </div>
            <span className="text-xs text-red-400 font-mono mt-4 inline-block">Learn More &gt;</span>
          </div>

          {/* Card 5 */}
          <div className="glass glass-card p-8 rounded-2xl border border-white/5 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.15)]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
              </div>
              <h3 className="text-xl font-bold font-heading text-white">Explainable AI (XAI)</h3>
              <p className="text-sm text-white/60 leading-relaxed">Every fact-audit provides clear justification pathways, factual citations, and reference links instead of opaque, non-verifiable classifications.</p>
            </div>
            <span className="text-xs text-green-400 font-mono mt-4 inline-block">Learn More &gt;</span>
          </div>

          {/* Card 6 */}
          <div className="glass glass-card p-8 rounded-2xl border border-white/5 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.15)]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
              </div>
              <h3 className="text-xl font-bold font-heading text-white">Multilingual Auditing</h3>
              <p className="text-sm text-white/60 leading-relaxed">Seamlessly parses, translates, and verifies factual statements across 64 global languages, removing localized security verification blindspots.</p>
            </div>
            <span className="text-xs text-yellow-400 font-mono mt-4 inline-block">Learn More &gt;</span>
          </div>

        </div>
      </section>

      {/* 3. Stats Counter Section */}
      <section className="border-y border-white/5 bg-cyber-dark/40 py-16">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            
            <div className="space-y-2">
              <h3 className="text-4xl md:text-6xl font-black font-heading text-white glow-text-cyan">99.8%</h3>
              <p className="text-xs uppercase tracking-widest text-white/50 font-semibold">Verification Accuracy</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-center items-baseline text-white">
                <h3 className="text-4xl md:text-6xl font-black font-heading glow-text-purple">120</h3>
                <span className="text-xl md:text-2xl font-bold font-heading ml-1">ms</span>
              </div>
              <p className="text-xs uppercase tracking-widest text-white/50 font-semibold">Average Audit Latency</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-4xl md:text-6xl font-black font-heading text-white glow-text-cyan">15M+</h3>
              <p className="text-xs uppercase tracking-widest text-white/50 font-semibold">Claims Monitored</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-4xl md:text-6xl font-black font-heading text-white glow-text-purple">4,500+</h3>
              <p className="text-xs uppercase tracking-widest text-white/50 font-semibold">Enterprise Pipelines Protected</p>
            </div>

          </div>
        </div>
      </section>

      {/* 4. Interactive Testimonials Slide */}
      <section className="container mx-auto px-6 sm:px-8 max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-xs text-cyan-400 uppercase tracking-widest font-black">Trusted globally</h2>
          <p className="text-3xl font-black font-heading text-white mt-1">Enterprise Validation</p>
        </div>

        <div className="relative glass p-8 md:p-12 rounded-3xl border border-white/5 shadow-2xl overflow-hidden min-h-[300px] flex flex-col justify-between">
          
          {/* Glowing Background Ring */}
          <div className="absolute -bottom-1/2 -right-1/4 w-[300px] h-[300px] rounded-full radial-glow-cyan pointer-events-none opacity-40"></div>

          {/* Testimonial Content */}
          <div className="space-y-6">
            <svg className="w-12 h-12 text-cyan-400 opacity-20" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"></path></svg>
            <p className="text-lg md:text-2xl text-white/90 italic font-medium leading-relaxed font-sans">
              "{testimonials[currentTestimonial].quote}"
            </p>
          </div>

          <div className="flex items-center space-x-4 pt-8 mt-8 border-t border-white/5">
            <img src={testimonials[currentTestimonial].avatar} alt={testimonials[currentTestimonial].author} className="w-12 h-12 rounded-full object-cover border border-cyan-400/30" />
            <div>
              <p className="font-bold text-white text-base">{testimonials[currentTestimonial].author}</p>
              <p className="text-xs text-white/50">{testimonials[currentTestimonial].role}</p>
            </div>
          </div>

          {/* Carousel Selector dots */}
          <div className="absolute bottom-8 right-8 flex space-x-2">
            {testimonials.map((_, idx) => (
              <button 
                key={idx}
                onClick={() => setCurrentTestimonial(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${idx === currentTestimonial ? 'bg-cyan-400 w-6' : 'bg-white/20 hover:bg-white/40'}`}
                aria-label={`Go to testimonial ${idx + 1}`}
              ></button>
            ))}
          </div>

        </div>
      </section>

      {/* 5. FAQ Section */}
      <section className="container mx-auto px-6 sm:px-8 max-w-4xl space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-xs text-cyan-400 uppercase tracking-widest font-black">Help center</h2>
          <p className="text-3xl md:text-5xl font-black font-heading text-white">Expert FAQ</p>
        </div>

        <div className="glass p-6 md:p-10 rounded-2xl border border-white/5 space-y-1">
          
          {[
            {
              question: "What is KRONOSX AI credibility engine?",
              answer: "KRONOSX AI is a secure enterprise platform parsing media authenticity in real-time. We combine neural NLP factual matching pipelines with sophisticated machine learning image matrices to shield organizations from digital misinformation threats."
            },
            {
              question: "How does deepfake authenticity auditing work?",
              answer: "Our vision pipeline checks uploaded image headers for binary abnormalities, searches color channel pixel layouts for visual artifact patterns, and measures high-frequency noise distributions to flag AI generative signatures."
            },
            {
              question: "Does KRONOSX protect user privacy?",
              answer: "Factual statements are evaluated in completely encrypted memory streams. Uploaded media is securely parsed, verified, and cleared, leaving zero digital footprints behind. Your historical logs are saved exclusively within your browser's local sandbox storage."
            },
            {
              question: "Can I connect third-party platforms via API?",
              answer: "Yes. KRONOSX AI is designed for seamless REST API integration. Enterprise accounts receive dedicated developer endpoints to audit massive content arrays with robust SLAs."
            }
          ].map((faq, idx) => (
            <div key={idx} className="border-b border-white/5 py-5 last:border-0">
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full flex justify-between items-center text-left text-lg font-bold text-white hover:text-cyan-400 transition-colors focus:outline-none"
              >
                <span>{faq.question}</span>
                <span className={`transform transition-transform duration-300 text-cyan-400 ${activeFaq === idx ? 'rotate-180' : ''}`}>▼</span>
              </button>
              {activeFaq === idx && (
                <div className="mt-4 text-white/75 text-sm leading-relaxed max-w-3xl animate-float">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}

        </div>
      </section>

    </div>
  );
};

export default HomePage;