'use client';

import { useState } from 'react';
import { Mail, MessageCircle, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const WHATSAPP_GROUP_LINK = 'https://chat.whatsapp.com/E8bMuZcjCxt5CMDOksvQWF';
const SUPPORT_EMAIL = 'resumebuddy0@gmail.com';

export default function SupportPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Compose email using mailto
    const subject = encodeURIComponent(formData.subject || 'Support Request');
    const body = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
    );
    const mailtoLink = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;

    // Open email client
    window.location.href = mailtoLink;

    // Show success toast
    toast.success('Email client opened!', {
      description: 'Your email app should open with the pre-filled message.',
    });

    // Reset form
    setFormData({ name: '', email: '', subject: '', message: '' });
    setIsSubmitting(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <div className="container max-w-5xl mx-auto px-4 py-12 sm:py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Get Support
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We're here to help! Choose your preferred way to reach out to our support team.
          </p>
        </div>

        {/* Support Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* WhatsApp Community */}
          <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-full bg-[#25D366]/10">
                  <MessageCircle className="h-6 w-6 text-[#25D366]" />
                </div>
                <CardTitle className="text-2xl">WhatsApp Group</CardTitle>
              </div>
              <CardDescription className="text-base">
                Join our community for instant support, tips, and discussions with other users.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-6 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Quick responses from the community
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Share tips and best practices
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Get updates and announcements
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Connect with other job seekers
                </li>
              </ul>
              <Button
                asChild
                className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white"
                size="lg"
              >
                <a
                  href={WHATSAPP_GROUP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Join WhatsApp Group
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Email Support */}
          <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-full bg-primary/10">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Email Support</CardTitle>
              </div>
              <CardDescription className="text-base">
                Send us an email for detailed inquiries or technical support issues.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-6 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Detailed support for complex issues
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Response within 24-48 hours
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Attach screenshots or files
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Private and confidential
                </li>
              </ul>
              <Button
                asChild
                variant="outline"
                className="w-full"
                size="lg"
              >
                <a href={`mailto:${SUPPORT_EMAIL}`}>
                  <Mail className="mr-2 h-5 w-5" />
                  Email: {SUPPORT_EMAIL}
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Contact Form */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl">Send Us a Message</CardTitle>
            <CardDescription>
              Fill out the form below and we'll get back to you as soon as possible.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name</Label>
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
                  <Label htmlFor="email">Your Email</Label>
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
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  name="subject"
                  placeholder="What do you need help with?"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Describe your issue or question in detail..."
                  rows={6}
                  value={formData.message}
                  onChange={handleChange}
                  required
                />
              </div>

              <Button 
                type="submit" 
                size="lg" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  'Opening Email Client...'
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    Send Message
                  </>
                )}
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                This will open your default email client with the pre-filled message.
              </p>
            </form>
          </CardContent>
        </Card>

        {/* FAQ Hint */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            Looking for quick answers? Check out our{' '}
            <a href="/about-us" className="text-primary hover:underline">
              About Us
            </a>{' '}
            page or join our WhatsApp group for community support.
          </p>
        </div>
      </div>
    </div>
  );
}
