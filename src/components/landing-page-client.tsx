'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NumberTicker } from '@/components/ui/number-ticker';
import { 
  FileText, 
  Brain, 
  MessageSquare, 
  Target, 
  Zap, 
  Shield, 
  ArrowRight,
  CheckCircle,
  Users,
  TrendingUp,
  Upload,
  Sparkles,
  BarChart3,
  Clock,
  Award
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import LandingNavbar from '@/components/landing-navbar';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { motion } from 'framer-motion';
import { 
  fadeInUp, 
  fadeInLeft, 
  fadeInRight,
  staggerContainer, 
  scaleIn,
  viewportOnce 
} from '@/lib/animations';

interface LandingPageClientProps {
  features: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  stats: Array<{
    value: string;
    label: string;
  }>;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Brain,
  MessageSquare,
  Target,
  FileText,
  Zap,
  Shield,
};

export function LandingPageClient({ features, stats }: LandingPageClientProps) {
  const { user, loading: authLoading } = useAuth();

  return (
    <>
      {/* Conditional Navbar */}
      {user ? <Navbar /> : <LandingNavbar />}
      
      <div className="flex-1">
        {/* Hero Section - Clean Product Design */}
        <section id="hero" className="relative min-h-[85vh] flex items-center pt-24 pb-12 overflow-hidden bg-gradient-to-b from-background via-background to-muted/20">
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
          
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
            <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
              {/* Left: Copy */}
              <motion.div 
                className="space-y-8"
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
              >
                {/* Status badge */}
                <motion.div variants={fadeInUp}>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/20 text-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="text-muted-foreground">Analyzing <span className="text-foreground font-medium">50+ resumes</span> daily</span>
                  </div>
                </motion.div>

                {/* Headline */}
                <motion.div variants={fadeInUp}>
                  <h1 className="text-5xl sm:text-6xl lg:text-7xl font-headline font-bold tracking-tight text-foreground leading-[1.1]">
                    Land interviews
                    <br />
                    <span className="text-primary">with confidence</span>
                  </h1>
                </motion.div>

                {/* Subhead */}
                <motion.p 
                  className="text-lg sm:text-xl text-muted-foreground max-w-lg leading-relaxed"
                  variants={fadeInUp}
                >
                  Get instant AI feedback on your resume. Know exactly what recruiters and ATS systems see — and how to improve it.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div 
                  className="flex flex-col sm:flex-row gap-4 pt-2"
                  variants={fadeInUp}
                >
                  {!authLoading && (
                    <>
                      {user ? (
                        <Link href="/dashboard">
                          <Button 
                            size="lg" 
                            className="h-14 px-8 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow"
                          >
                            Go to Dashboard
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </Button>
                        </Link>
                      ) : (
                        <>
                          <Link href="/signup">
                            <Button 
                              size="lg" 
                              className="h-14 px-8 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow"
                            >
                              Analyze my resume
                              <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                          </Link>
                          <Link href="#how-it-works">
                            <Button 
                              variant="outline" 
                              size="lg" 
                              className="h-14 px-8 text-base font-medium"
                            >
                              How it works
                            </Button>
                          </Link>
                        </>
                      )}
                    </>
                  )}
                </motion.div>

                {/* Trust indicators */}
                <motion.div 
                  className="flex items-center gap-6 pt-6"
                  variants={fadeInUp}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {[
                        { name: 'Priya Sharma', role: 'Software Engineer', color: '#3B82F6' },
                        { name: 'Rahul Patel', role: 'Data Analyst', color: '#8B5CF6' },
                        { name: 'Ananya Reddy', role: 'Product Manager', color: '#EC4899' },
                        { name: 'Vikram Singh', role: 'Full Stack Dev', color: '#10B981' },
                      ].map((user, i) => (
                        <div 
                          key={user.name} 
                          className="relative group/avatar"
                        >
                          <div 
                            className="w-9 h-9 rounded-full border-2 border-background flex items-center justify-center text-xs font-semibold cursor-pointer transition-transform hover:scale-110 hover:z-10"
                            style={{ backgroundColor: user.color, color: 'white' }}
                          >
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-foreground text-background text-xs rounded-lg opacity-0 group-hover/avatar:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                            <div className="font-semibold">{user.name}</div>
                            <div className="text-background/70">{user.role}</div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-foreground" />
                          </div>
                        </div>
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">Trusted by <span className="font-medium text-foreground">50+</span> students</span>
                  </div>
                  <div className="h-4 w-px bg-border hidden sm:block" />
                  <div className="hidden sm:flex items-center gap-1.5">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 20 20">
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">4.9/5</span>
                  </div>
                </motion.div>
              </motion.div>

              {/* Right: Product Preview */}
              <motion.div 
                className="relative"
                initial="hidden"
                animate="visible"
                variants={fadeInRight}
              >
                <div className="relative">
                  {/* Browser/App Window Frame */}
                  <div className="bg-card rounded-2xl border shadow-2xl shadow-black/10 overflow-hidden">
                    {/* Window Chrome */}
                    <div className="h-10 bg-muted/50 border-b flex items-center gap-2 px-4">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-400" />
                        <div className="w-3 h-3 rounded-full bg-amber-400" />
                        <div className="w-3 h-3 rounded-full bg-green-400" />
                      </div>
                      <div className="flex-1 flex justify-center">
                        <div className="px-4 py-1 bg-background rounded-md text-xs text-muted-foreground">
                          www.resume-buddy.tech/analysis/
                        </div>
                      </div>
                    </div>
                    
                    {/* App Content */}
                    <div className="p-6 bg-gradient-to-br from-background to-muted/30">
                      {/* Analysis Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="font-semibold text-foreground">Resume Analysis</h3>
                          <p className="text-xs text-muted-foreground">John_Doe_Resume.pdf</p>
                        </div>
                        <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Complete
                        </div>
                      </div>

                      {/* Score Cards Grid */}
                      <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="bg-background rounded-xl p-4 border">
                          <div className="text-2xl font-bold text-primary">94</div>
                          <div className="text-xs text-muted-foreground mt-1">ATS Score</div>
                        </div>
                        <div className="bg-background rounded-xl p-4 border">
                          <div className="text-2xl font-bold text-foreground">12</div>
                          <div className="text-xs text-muted-foreground mt-1">Improvements</div>
                        </div>
                        <div className="bg-background rounded-xl p-4 border">
                          <div className="text-2xl font-bold text-emerald-500">A+</div>
                          <div className="text-xs text-muted-foreground mt-1">Format</div>
                        </div>
                      </div>

                      {/* Analysis Items */}
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                          <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-foreground">Strong action verbs</p>
                            <p className="text-xs text-muted-foreground">Your experience section uses compelling language</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                          <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-foreground">Add metrics to achievements</p>
                            <p className="text-xs text-muted-foreground">Quantify your impact with numbers</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                          <Target className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-foreground">Keyword optimization</p>
                            <p className="text-xs text-muted-foreground">Match 8/10 key skills from job description</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Decorative gradient blur */}
                  <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-r from-primary/20 via-purple-500/10 to-primary/20 rounded-full blur-3xl opacity-50" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats Section - Bento Grid */}
        <section id="stats" className="py-24 bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="text-center mb-16 space-y-4"
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              variants={staggerContainer}
            >
              <motion.h2 
                className="text-section text-foreground"
                variants={fadeInUp}
              >
                Trusted by Students
              </motion.h2>
              <motion.p 
                className="text-lg text-muted-foreground"
                variants={fadeInUp}
              >
                Join the community transforming careers with AI
              </motion.p>
            </motion.div>
            
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              variants={staggerContainer}
            >
              {/* Large stat */}
              <motion.div 
                className="col-span-2 md:col-span-1 p-8 rounded-3xl bg-card border hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                variants={scaleIn}
              >
                <NumberTicker 
                  value={1000} 
                  suffix="+" 
                  className="text-5xl font-accent font-bold text-foreground" 
                />
                <p className="mt-2 text-muted-foreground">Resumes Analyzed</p>
              </motion.div>

              {/* Highlighted stat with primary */}
              <motion.div 
                className="p-8 rounded-3xl bg-primary text-primary-foreground hover:scale-[1.02] transition-transform duration-300 cursor-default"
                variants={scaleIn}
              >
                <NumberTicker 
                  value={95} 
                  suffix="%" 
                  className="text-5xl font-accent font-bold" 
                  delay={0.2}
                />
                <p className="mt-2 opacity-90">Success Rate</p>
              </motion.div>

              {/* Icon stat */}
              <motion.div 
                className="p-8 rounded-3xl bg-card border flex flex-col justify-between hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                variants={scaleIn}
              >
                <div className="text-5xl font-accent font-bold text-foreground">2.5×</div>
                <div>
                  <p className="mt-2 text-muted-foreground">More Interviews</p>
                  <TrendingUp className="w-6 h-6 text-success mt-4" />
                </div>
              </motion.div>

              {/* 24/7 with animation */}
              <motion.div 
                className="p-8 rounded-3xl bg-foreground text-background flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300 cursor-default"
                variants={scaleIn}
              >
                <div className="text-5xl font-accent font-bold">24/7</div>
                <div>
                  <p className="opacity-80">AI Never Sleeps</p>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-success" />
                    </span>
                    <span className="text-sm opacity-70">Online now</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Features Section - Bento Grid with Varied Sizes */}
        <section id="features" className="py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="text-center space-y-4 mb-16"
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp}>
                <Badge variant="outline" className="mb-4 px-4 py-2 border-primary/30 text-primary">
                  <Brain className="w-4 h-4 mr-2" />
                  Powerful Features
                </Badge>
              </motion.div>
              <motion.h2 
                className="text-section text-foreground"
                variants={fadeInUp}
              >
                Everything You Need to{' '}
                <span className="text-primary">Succeed</span>
              </motion.h2>
              <motion.p 
                className="mx-auto max-w-2xl text-lg text-muted-foreground"
                variants={fadeInUp}
              >
                Comprehensive AI-powered tools to optimize your job search and land your dream role.
              </motion.p>
            </motion.div>

            <motion.div 
              className="grid grid-cols-1 md:grid-cols-6 gap-4 auto-rows-[200px]"
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              variants={staggerContainer}
            >
              {/* Large feature: AI Analysis */}
              <motion.div 
                className="col-span-full md:col-span-4 row-span-2 rounded-3xl border bg-card p-8 flex flex-col justify-between overflow-hidden relative group hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300"
                variants={scaleIn}
              >
                {/* Background illustration */}
                <div className="absolute top-0 right-0 w-1/2 h-full opacity-5 group-hover:opacity-15 transition-opacity duration-500">
                  <Brain className="w-full h-full text-primary" />
                </div>

                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                    <Brain className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-2xl font-headline font-semibold mb-3 group-hover:text-primary transition-colors">AI Resume Analysis</h3>
                  <p className="text-muted-foreground max-w-md">
                    Deep analysis of your resume content, formatting, and ATS compatibility. 
                    Get actionable insights to improve your chances.
                  </p>
                </div>

                <div className="relative z-10 flex gap-2 mt-8 flex-wrap">
                  <Badge variant="secondary" className="text-xs group-hover:bg-primary/10 group-hover:text-primary transition-colors">NLP Processing</Badge>
                  <Badge variant="secondary" className="text-xs group-hover:bg-primary/10 group-hover:text-primary transition-colors">Keyword Matching</Badge>
                  <Badge variant="secondary" className="text-xs group-hover:bg-primary/10 group-hover:text-primary transition-colors">ATS Simulation</Badge>
                </div>
              </motion.div>

              {/* Small feature: Interview Prep */}
              <motion.div 
                className="col-span-1 md:col-span-2 rounded-3xl border bg-card p-6 flex flex-col justify-between group hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300"
                variants={scaleIn}
              >
                <MessageSquare className="w-8 h-8 text-primary group-hover:scale-110 group-hover:rotate-3 transition-transform" />
                <div>
                  <h3 className="font-headline font-semibold group-hover:text-primary transition-colors">Interview Prep</h3>
                  <p className="text-sm text-muted-foreground mt-1">AI-generated Q&A</p>
                </div>
              </motion.div>

              {/* Small feature: Job Matching */}
              <motion.div 
                className="col-span-1 md:col-span-2 rounded-3xl border bg-card p-6 flex flex-col justify-between group hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300"
                variants={scaleIn}
              >
                <Target className="w-8 h-8 text-primary group-hover:scale-110 group-hover:rotate-3 transition-transform" />
                <div>
                  <h3 className="font-headline font-semibold group-hover:text-primary transition-colors">Job Matching</h3>
                  <p className="text-sm text-muted-foreground mt-1">Compare with job descriptions</p>
                </div>
              </motion.div>

              {/* Medium feature: Improvements */}
              <motion.div 
                className="col-span-1 md:col-span-3 rounded-3xl border bg-card p-6 flex flex-col justify-between group hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300"
                variants={scaleIn}
              >
                <div className="flex items-start justify-between">
                  <Zap className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                  <Badge className="bg-primary/10 text-primary border-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">Popular</Badge>
                </div>
                <div>
                  <h3 className="font-headline font-semibold text-lg group-hover:text-primary transition-colors">Smart Improvements</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Get specific suggestions to enhance every section of your resume
                  </p>
                </div>
              </motion.div>

              {/* Medium feature: Resume Export */}
              <motion.div 
                className="col-span-1 md:col-span-3 rounded-3xl border bg-card p-6 flex flex-col justify-between group hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300"
                variants={scaleIn}
              >
                <FileText className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                <div>
                  <h3 className="font-headline font-semibold text-lg">PDF Export</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Export your optimized resume as a professional PDF with LaTeX formatting
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* How It Works Section - Timeline */}
        <section id="how-it-works" className="py-24 bg-muted/30 overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="text-center mb-16 space-y-4"
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp}>
                <Badge variant="outline" className="mb-4 px-4 py-2 border-primary/30 text-primary">
                  <Clock className="w-4 h-4 mr-2" />
                  Simple Process
                </Badge>
              </motion.div>
              <motion.h2 
                className="text-section text-foreground"
                variants={fadeInUp}
              >
                How <span className="text-primary">ResumeBuddy</span> Works
              </motion.h2>
              <motion.p 
                className="mx-auto max-w-2xl text-lg text-muted-foreground"
                variants={fadeInUp}
              >
                Get started in just three simple steps and transform your job search today.
              </motion.p>
            </motion.div>

            <motion.div 
              className="relative"
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              variants={staggerContainer}
            >
              {/* Connecting line for desktop */}
              <div className="absolute top-[60px] left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent hidden lg:block" />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-6">
                {[
                  {
                    step: "1",
                    title: "Upload Resume",
                    description: "Upload your resume in PDF or DOCX format. Our AI will extract and analyze the content instantly.",
                    icon: FileText
                  },
                  {
                    step: "2",
                    title: "Add Job Description",
                    description: "Paste the job description you're targeting. Our AI will compare it with your resume for perfect matching.",
                    icon: Target
                  },
                  {
                    step: "3",
                    title: "Get AI Insights",
                    description: "Receive detailed analysis, interview questions, and optimization suggestions to land your dream job.",
                    icon: Brain
                  }
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div 
                      key={index} 
                      className="relative group"
                      variants={fadeInUp}
                    >
                      <div className="bg-card border rounded-2xl p-8 text-center hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 h-full">
                        {/* Step number badge */}
                        <div className="relative mx-auto mb-6">
                          <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25 group-hover:scale-110 transition-transform duration-300">
                            <span className="text-xl font-bold">{item.step}</span>
                          </div>
                        </div>

                        {/* Icon */}
                        <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>

                        <h3 className="text-lg font-headline font-semibold mb-3 group-hover:text-primary transition-colors">{item.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {!authLoading && !user && (
              <motion.div 
                className="text-center mt-16"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewportOnce}
              >
                <Link href="/signup">
                  <Button 
                    size="lg" 
                    className="px-8 py-6 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
                  >
                    Start Your Journey
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </motion.div>
            )}
          </div>
        </section>

        {/* CTA Section - Subtle gradient with depth */}
        <section id="cta" className="py-24 relative overflow-hidden">
          {/* Subtle gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-foreground via-foreground to-foreground/95" />
          
          {/* Noise texture overlay */}
          <div className="absolute inset-0 noise-bg opacity-[0.02]" />
          
          {/* Subtle primary glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />

          <motion.div 
            className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
          >
            <div className="max-w-3xl mx-auto text-center text-background space-y-8">
              <motion.h2 
                className="text-4xl md:text-5xl font-headline font-bold"
                variants={fadeInUp}
              >
                Ready to land your dream job?
              </motion.h2>
              
              <motion.p 
                className="text-xl opacity-80"
                variants={fadeInUp}
              >
                Join thousands who&apos;ve already improved their resumes with ResumeBuddy.
              </motion.p>

              {/* CTA Actions */}
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
                variants={fadeInUp}
              >
                {!authLoading && (
                  <>
                    {user ? (
                      <Link href="/dashboard">
                        <Button 
                          size="lg" 
                          className="px-10 py-6 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
                        >
                          Go to Dashboard
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                      </Link>
                    ) : (
                      <>
                        <Link href="/signup">
                          <Button 
                            size="lg" 
                            className="px-10 py-6 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
                          >
                            Start Free Analysis
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </Button>
                        </Link>
                        <Link href="/login">
                          <Button 
                            variant="outline" 
                            size="lg" 
                            className="px-8 py-6 text-base border-background/40 text-foreground hover:bg-background hover:text-foreground transition-all duration-300"
                          >
                            Sign In
                          </Button>
                        </Link>
                      </>
                    )}
                  </>
                )}
              </motion.div>

              <motion.p 
                className="text-sm opacity-60"
                variants={fadeInUp}
              >
                Free forever. No credit card required.
              </motion.p>

              {/* Social proof */}
              <motion.div 
                className="pt-8 flex items-center justify-center gap-8 flex-wrap opacity-70 text-sm"
                variants={fadeInUp}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>50+ students trust us</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  <span>4.9/5 rating</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>
      </div>
      
      {/* Footer */}
      <Footer />
    </>
  );
}
