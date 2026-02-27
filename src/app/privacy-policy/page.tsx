'use client';

import { Shield, Lock, Eye, Database, UserCheck, Globe, Mail, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  const lastUpdated = 'January 14, 2025';

  const sections = [
    {
      icon: Database,
      title: '1. Information We Collect',
      content: (
        <>
          <h3 className="font-semibold text-lg mb-3">1.1 Information You Provide</h3>
          <p className="mb-4 text-muted-foreground">
            When you create an account and use ResumeBuddy, we collect information you voluntarily provide:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2 text-muted-foreground">
            <li><strong>Account Information:</strong> Name, email address, password (encrypted)</li>
            <li><strong>Profile Data:</strong> Professional details, work experience, education, skills</li>
            <li><strong>Resume Content:</strong> Resume text, uploaded files, job descriptions you analyze</li>
            <li><strong>Payment Information:</strong> Processed securely through Razorpay (we don't store credit card details)</li>
            <li><strong>Communication Data:</strong> Messages you send through our support channels</li>
          </ul>

          <h3 className="font-semibold text-lg mb-3 mt-6">1.2 Automatically Collected Information</h3>
          <ul className="list-disc pl-6 mb-4 space-y-2 text-muted-foreground">
            <li><strong>Usage Data:</strong> Features used, time spent, actions taken within the platform</li>
            <li><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
            <li><strong>Cookies:</strong> Session cookies for authentication and functionality (see Cookie Policy below)</li>
          </ul>
        </>
      ),
    },
    {
      icon: Lock,
      title: '2. How We Use Your Information',
      content: (
        <>
          <p className="mb-4 text-muted-foreground">We use your information for the following purposes:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2 text-muted-foreground">
            <li><strong>Service Delivery:</strong> Provide AI-powered resume analysis, interview preparation, and related features</li>
            <li><strong>Personalization:</strong> Customize recommendations and improve accuracy based on your profile</li>
            <li><strong>Account Management:</strong> Maintain your account, process payments, manage subscriptions</li>
            <li><strong>Communication:</strong> Send service updates, respond to support requests, notify about important changes</li>
            <li><strong>Improvement:</strong> Analyze usage patterns to enhance our platform and develop new features</li>
            <li><strong>Security:</strong> Detect fraud, prevent abuse, protect user accounts</li>
            <li><strong>Legal Compliance:</strong> Comply with applicable laws and regulations</li>
          </ul>
        </>
      ),
    },
    {
      icon: Eye,
      title: '3. Information Sharing and Disclosure',
      content: (
        <>
          <p className="mb-4 text-muted-foreground">
            We respect your privacy and <strong>do not sell your personal information</strong>. We only share data in these limited circumstances:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2 text-muted-foreground">
            <li>
              <strong>AI Service Providers:</strong> Resume content is sent to AI providers (Groq, Google Gemini, OpenRouter) 
              for analysis. These providers process data according to their privacy policies and do not retain your data permanently.
            </li>
            <li>
              <strong>Payment Processors:</strong> Razorpay processes payments securely. We don't store your credit card information.
            </li>
            <li>
              <strong>Service Infrastructure:</strong> Cloud hosting providers (Vercel, AWS, or similar) store data with encryption.
            </li>
            <li>
              <strong>Legal Requirements:</strong> When required by law, court order, or government regulations.
            </li>
            <li>
              <strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, with advance notice to users.
            </li>
            <li>
              <strong>With Your Consent:</strong> Any other sharing only with your explicit permission.
            </li>
          </ul>
        </>
      ),
    },
    {
      icon: Shield,
      title: '4. Data Security',
      content: (
        <>
          <p className="mb-4 text-muted-foreground">We implement industry-standard security measures:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2 text-muted-foreground">
            <li><strong>Encryption:</strong> All data is encrypted in transit (TLS/SSL) and at rest (AES-256)</li>
            <li><strong>Authentication:</strong> JWT-based secure session management with encrypted tokens</li>
            <li><strong>Access Controls:</strong> Role-based access with strict permission management</li>
            <li><strong>Regular Audits:</strong> Security reviews and vulnerability assessments</li>
            <li><strong>Secure Infrastructure:</strong> Data stored in secure, monitored data centers</li>
          </ul>
          <p className="text-muted-foreground italic mt-4">
            While we take extensive precautions, no system is 100% secure. We encourage you to use strong passwords 
            and enable two-factor authentication when available.
          </p>
        </>
      ),
    },
    {
      icon: UserCheck,
      title: '5. Your Rights and Choices',
      content: (
        <>
          <p className="mb-4 text-muted-foreground">You have the following rights regarding your data:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2 text-muted-foreground">
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Correction:</strong> Update or correct inaccurate information through your profile settings</li>
            <li><strong>Deletion:</strong> Request account deletion (we'll permanently delete your data within 30 days)</li>
            <li><strong>Data Portability:</strong> Export your resume data in standard formats</li>
            <li><strong>Opt-Out:</strong> Unsubscribe from marketing emails (service emails may still be sent)</li>
            <li><strong>Object:</strong> Object to certain data processing activities</li>
            <li><strong>Withdraw Consent:</strong> Revoke consent for optional data uses</li>
          </ul>
          <p className="text-muted-foreground mt-4">
            To exercise these rights, contact us at <a href="mailto:resumebuddy0@gmail.com" className="text-primary hover:underline">resumebuddy0@gmail.com</a> 
            or visit our <Link href="/support" className="text-primary hover:underline">Support Page</Link>.
          </p>
        </>
      ),
    },
    {
      icon: FileText,
      title: '6. Data Retention',
      content: (
        <>
          <p className="mb-4 text-muted-foreground">We retain your data according to these policies:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2 text-muted-foreground">
            <li><strong>Active Accounts:</strong> Data retained while your account is active</li>
            <li><strong>Inactive Accounts:</strong> After 2 years of inactivity, we may delete non-essential data</li>
            <li><strong>Deleted Accounts:</strong> Permanent deletion within 30 days of request (except legal obligations)</li>
            <li><strong>Backups:</strong> May persist in backups for up to 90 days after deletion</li>
            <li><strong>Analytics Data:</strong> Anonymized usage data retained for improvement purposes</li>
          </ul>
        </>
      ),
    },
    {
      icon: Globe,
      title: '7. International Data Transfers',
      content: (
        <>
          <p className="mb-4 text-muted-foreground">
            ResumeBuddy is operated from India. If you access our services from outside India, your data may be 
            transferred to and processed in India or other countries where our service providers operate.
          </p>
          <p className="text-muted-foreground">
            We ensure appropriate safeguards are in place for international transfers, including compliance with 
            GDPR (for EU users), CCPA (for California users), and other applicable data protection laws.
          </p>
        </>
      ),
    },
    {
      icon: Mail,
      title: '8. Cookies and Tracking',
      content: (
        <>
          <p className="mb-4 text-muted-foreground">We use cookies and similar technologies for:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2 text-muted-foreground">
            <li><strong>Essential Cookies:</strong> Required for authentication and core functionality (cannot be disabled)</li>
            <li><strong>Analytics Cookies:</strong> Understand usage patterns and improve the platform</li>
            <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
          </ul>
          <p className="text-muted-foreground">
            You can control non-essential cookies through your browser settings. Note that disabling cookies may 
            limit platform functionality.
          </p>
        </>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5">
      <div className="container max-w-5xl mx-auto px-4 py-12 sm:py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4" variant="secondary">
            Legal
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 flex items-center justify-center gap-3">
            <Shield className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
            Privacy Policy
          </h1>
          <p className="text-lg text-muted-foreground mb-2">
            How we collect, use, and protect your information
          </p>
          <p className="text-sm text-muted-foreground">
            <strong>Last Updated:</strong> {lastUpdated}
          </p>
        </div>

        {/* Introduction */}
        <Card className="mb-8 border-2">
          <CardHeader>
            <CardTitle className="text-2xl">Our Commitment to Your Privacy</CardTitle>
            <CardDescription className="text-base">
              At ResumeBuddy, we take your privacy seriously. This Privacy Policy explains how we collect, 
              use, store, and protect your personal information when you use our platform. By using ResumeBuddy, 
              you agree to the practices described in this policy.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-primary/10 border-l-4 border-l-primary p-4 rounded">
              <p className="text-sm text-muted-foreground">
                <strong>TL;DR:</strong> We collect only what's necessary to provide our services. We never sell 
                your data. You have full control over your information. Your resume content is processed by AI 
                but not stored permanently by AI providers.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Main Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <Card key={index} className="border-2 hover:border-primary/30 transition-colors">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose dark:prose-invert max-w-none">
                  {section.content}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Children's Privacy */}
        <Card className="mt-6 border-2 border-amber-500/20 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-xl">9. Children's Privacy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              ResumeBuddy is intended for users aged 16 and above. We do not knowingly collect personal information 
              from children under 16. If you believe we have inadvertently collected such information, please contact 
              us immediately at <a href="mailto:resumebuddy0@gmail.com" className="text-primary hover:underline">resumebuddy0@gmail.com</a>.
            </p>
          </CardContent>
        </Card>

        {/* Changes to Policy */}
        <Card className="mt-6 border-2">
          <CardHeader>
            <CardTitle className="text-xl">10. Changes to This Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              We may update this Privacy Policy from time to time to reflect changes in our practices or legal 
              requirements. When we make significant changes, we will:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
              <li>Update the "Last Updated" date at the top of this page</li>
              <li>Notify you via email or in-app notification</li>
              <li>Provide a 30-day notice period before changes take effect</li>
            </ul>
            <p className="text-muted-foreground">
              Continued use of ResumeBuddy after policy changes indicates acceptance of the updated terms.
            </p>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        {/* Contact Section */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Questions About Privacy?</CardTitle>
            <CardDescription className="text-center text-base">
              If you have questions, concerns, or requests regarding this Privacy Policy or your personal data, 
              we're here to help.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="text-center sm:text-left">
                <p className="text-muted-foreground mb-2">
                  <strong>Email:</strong> <a href="mailto:resumebuddy0@gmail.com" className="text-primary hover:underline">resumebuddy0@gmail.com</a>
                </p>
                <p className="text-muted-foreground">
                  <strong>Support:</strong> <Link href="/support" className="text-primary hover:underline">Visit Support Page</Link>
                </p>
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-6">
              We typically respond to privacy inquiries within 5 business days.
            </p>
          </CardContent>
        </Card>

        {/* Legal Disclaimer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            This Privacy Policy is governed by the laws of India. For users in the EU, GDPR rights apply. 
            For users in California, CCPA rights apply.
          </p>
        </div>
      </div>
    </div>
  );
}
