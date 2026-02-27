'use client';

import { Target, Users, Zap, Heart, TrendingUp, Shield, Globe, Award } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AboutUsPage() {
  const values = [
    {
      icon: Users,
      title: 'Student-First Approach',
      description: 'We understand the challenges students face. Our platform is designed with affordability and accessibility in mind.',
    },
    {
      icon: Zap,
      title: 'AI-Powered Excellence',
      description: 'Leveraging cutting-edge AI technology to provide instant, accurate resume analysis and personalized recommendations.',
    },
    {
      icon: Shield,
      title: 'Privacy & Security',
      description: 'Your data is encrypted and protected. We never share your information with third parties without your consent.',
    },
    {
      icon: Heart,
      title: 'Community Support',
      description: 'A growing community of job seekers helping each other succeed through shared knowledge and experiences.',
    },
  ];

  const features = [
    {
      title: 'ATS Score Analysis',
      description: 'Real-time analysis of how well your resume matches job descriptions and passes through Applicant Tracking Systems.',
    },
    {
      title: 'Personalized Improvements',
      description: 'Get specific, actionable suggestions to enhance your resume based on industry best practices.',
    },
    {
      title: 'Interview Preparation',
      description: 'Practice with AI-generated interview questions tailored to your resume and target role.',
    },
    {
      title: 'Multiple Templates',
      description: 'Professional, ATS-friendly resume templates designed for different industries and roles.',
    },
    {
      title: 'Cover Letter Generator',
      description: 'Create compelling cover letters customized for specific job applications.',
    },
    {
      title: 'Q&A Generator',
      description: 'Prepare for common interview questions with personalized answers based on your experience.',
    },
  ];

  const stats = [
    { value: '10+', label: 'Users Worldwide' },
    { value: '500+', label: 'Resumes Analyzed' },
    { value: '95%', label: 'User Satisfaction' },
    { value: '24/7', label: 'Support Available' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <div className="container max-w-6xl mx-auto px-4 py-12 sm:py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge className="mb-4" variant="secondary">
            About ResumeBuddy
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            Empowering Job Seekers with AI
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            ResumeBuddy is your intelligent companion in the job search journey. We combine advanced AI technology 
            with career expertise to help you create resumes that stand out and land interviews.
          </p>
        </div>

        {/* Mission Section */}
        <Card className="mb-16 border-2">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10 w-fit">
              <Target className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl mb-4">Our Mission</CardTitle>
            <CardDescription className="text-lg max-w-3xl mx-auto">
              To democratize access to professional career tools and make the job application process 
              less stressful and more successful for everyone, especially students and early-career professionals.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Our Story */}
        <div className="mb-16 space-y-6">
          <h2 className="text-3xl font-bold text-center mb-8">Our Story</h2>
          <div className="prose prose-lg dark:prose-invert max-w-4xl mx-auto">
            <Card className="border-l-4 border-l-primary">
              <CardContent className="pt-6">
                <p className="text-muted-foreground leading-relaxed mb-4">
                  ResumeBuddy was born from a simple observation: job searching is hard, especially for students 
                  and early-career professionals. We've all been there—spending hours perfecting a resume, only 
                  to receive no response from applications.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We realized that many qualified candidates were being filtered out not because they lacked skills, 
                  but because their resumes weren't optimized for Applicant Tracking Systems (ATS) or didn't 
                  effectively showcase their achievements.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  That's why we created ResumeBuddy—to give everyone access to the same professional tools and 
                  insights that career coaches charge hundreds of dollars for. Using advanced AI technology, 
                  we provide instant feedback, personalized suggestions, and interview preparation to help you 
                  succeed in your job search.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <Card key={index} className="border-2 hover:border-primary/50 transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 rounded-full bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{value.title}</CardTitle>
                    </div>
                    <CardDescription className="text-base">
                      {value.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">What We Offer</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    {feature.title}
                  </CardTitle>
                  <CardDescription>
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Why Choose Us */}
        <Card className="mb-16 bg-gradient-to-br from-primary/5 to-primary/10 border-2">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl mb-4">Why Choose ResumeBuddy?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="mx-auto mb-4 p-4 rounded-full bg-primary/20 w-fit">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Instant Results</h3>
                <p className="text-sm text-muted-foreground">
                  Get AI-powered analysis and recommendations in seconds, not days.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4 p-4 rounded-full bg-primary/20 w-fit">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Student-Friendly Pricing</h3>
                <p className="text-sm text-muted-foreground">
                  Affordable plans starting at just ₹99 for 30 days. No recurring charges.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4 p-4 rounded-full bg-primary/20 w-fit">
                  <Globe className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Global Standards</h3>
                <p className="text-sm text-muted-foreground">
                  ATS-optimized templates and advice that work worldwide.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="pt-8 pb-8">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                Ready to Land Your Dream Job?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Join thousands of successful job seekers who have improved their resumes with ResumeBuddy.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="text-lg">
                  <Link href="/dashboard">
                    Get Started Free
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-lg">
                  <Link href="/support">
                    Contact Support
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
