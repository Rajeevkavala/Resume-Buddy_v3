'use client';

import { Mail, MessageCircle, Send, MapPin, Clock, Phone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useState } from 'react';

const SUPPORT_EMAIL = 'resumebuddy0@gmail.com';
const WHATSAPP_GROUP_LINK = 'https://chat.whatsapp.com/E8bMuZcjCxt5CMDOksvQWF';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create mailto link with pre-filled content
    const mailtoLink = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      formData.subject
    )}&body=${encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
    )}`;
    
    window.location.href = mailtoLink;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const contactMethods = [
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Send us a detailed message and we\'ll respond within 24 hours',
      value: SUPPORT_EMAIL,
      action: 'Send Email',
      link: `mailto:${SUPPORT_EMAIL}`,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp Community',
      description: 'Join our community for quick help and peer support',
      value: 'Join Group',
      action: 'Open WhatsApp',
      link: WHATSAPP_GROUP_LINK,
      color: 'text-[#25D366]',
      bgColor: 'bg-[#25D366]/10',
      external: true,
    },
  ];

  const info = [
    {
      icon: Clock,
      label: 'Response Time',
      value: 'Within 24 hours',
    },
    {
      icon: MapPin,
      label: 'Location',
      value: 'India',
    },
    {
      icon: Phone,
      label: 'Support Hours',
      value: '9 AM - 9 PM IST',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <div className="container max-w-6xl mx-auto px-4 py-12 sm:py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4" variant="secondary">
            Get in Touch
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            Contact Us
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Have questions, feedback, or need help? We're here to assist you. Choose your preferred way to reach us.
          </p>
        </div>

        {/* Quick Contact Methods */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {contactMethods.map((method, index) => {
            const Icon = method.icon;
            return (
              <Card
                key={index}
                className="border-2 hover:border-primary/30 transition-all duration-300 group"
              >
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-3 rounded-full ${method.bgColor} group-hover:scale-110 transition-transform`}>
                      <Icon className={`h-6 w-6 ${method.color}`} />
                    </div>
                    <CardTitle className="text-xl">{method.title}</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    {method.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4 font-mono text-sm break-all">
                    {method.value}
                  </p>
                  <Button
                    asChild
                    className="w-full"
                    variant={index === 0 ? 'default' : 'outline'}
                  >
                    <a
                      href={method.link}
                      target={method.external ? '_blank' : '_self'}
                      rel={method.external ? 'noopener noreferrer' : undefined}
                    >
                      {method.action}
                    </a>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Contact Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Send className="h-6 w-6 text-primary" />
                  Send Us a Message
                </CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      name="subject"
                      placeholder="How can we help you?"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Tell us more about your inquiry..."
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      required
                      className="resize-none"
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full sm:w-auto">
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
                  </Button>

                  <p className="text-sm text-muted-foreground">
                    By submitting this form, you agree to our{' '}
                    <Link href="/privacy-policy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Info Sidebar */}
          <div className="space-y-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-xl">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {info.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={index} className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-primary/10 mt-1">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.value}</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="border-2 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="text-lg">Need Immediate Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  For urgent issues or technical support, visit our comprehensive support page.
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/support">
                    Visit Support Page
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-amber-500/20 bg-amber-500/5">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> Response times may vary during weekends and holidays. 
                  We appreciate your patience and will respond as quickly as possible.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Prompt */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="pt-8 pb-8 text-center">
            <h2 className="text-2xl font-bold mb-3">Before You Contact Us</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Many common questions are answered in our documentation. Check out these resources first:
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="outline">
                <Link href="/about-us">About Us</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/privacy-policy">Privacy Policy</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/terms-of-service">Terms of Service</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
