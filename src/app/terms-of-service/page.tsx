'use client';

import { FileText, UserCheck, CreditCard, Shield, AlertTriangle, Scale, Globe, Ban } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function TermsOfServicePage() {
  const lastUpdated = 'January 14, 2025';
  const effectiveDate = 'January 14, 2025';

  const sections = [
    {
      icon: UserCheck,
      title: '1. Acceptance of Terms',
      content: (
        <>
          <p className="mb-4 text-muted-foreground">
            By accessing or using ResumeBuddy ("the Service"), you agree to be bound by these Terms of Service 
            ("Terms"). If you do not agree to these Terms, do not use the Service.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>You must be at least 16 years old to use this Service</li>
            <li>You must provide accurate and complete registration information</li>
            <li>You are responsible for maintaining the confidentiality of your account credentials</li>
            <li>You agree to accept responsibility for all activities that occur under your account</li>
          </ul>
        </>
      ),
    },
    {
      icon: FileText,
      title: '2. Service Description',
      content: (
        <>
          <p className="mb-4 text-muted-foreground">
            ResumeBuddy provides AI-powered tools for resume optimization, job application support, and career development:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
            <li><strong>Resume Analysis:</strong> ATS scoring, keyword analysis, and personalized recommendations</li>
            <li><strong>Interview Preparation:</strong> AI-generated questions, mock interviews, and evaluation</li>
            <li><strong>Resume Builder:</strong> Professional templates and formatting tools</li>
            <li><strong>Cover Letter Generator:</strong> Customized cover letters for job applications</li>
            <li><strong>Q&A Generation:</strong> Interview question preparation based on your resume</li>
          </ul>
          <p className="text-muted-foreground italic">
            <strong>Important:</strong> ResumeBuddy provides suggestions and recommendations. Final hiring decisions 
            are made by employers. We do not guarantee job placement, interviews, or specific outcomes.
          </p>
        </>
      ),
    },
    {
      icon: CreditCard,
      title: '3. Subscription and Payments',
      content: (
        <>
          <h3 className="font-semibold text-lg mb-3">3.1 Subscription Plans</h3>
          <ul className="list-disc pl-6 mb-4 space-y-2 text-muted-foreground">
            <li><strong>Free Plan:</strong> Limited features with 3 AI credits per day</li>
            <li><strong>Pro Plan:</strong> Full access with 10 AI credits per day for ₹99/30 days (one-time payment, non-recurring)</li>
          </ul>

          <h3 className="font-semibold text-lg mb-3 mt-6">3.2 Payment Terms</h3>
          <ul className="list-disc pl-6 mb-4 space-y-2 text-muted-foreground">
            <li>All payments are processed securely through Razorpay</li>
            <li>Prices are in Indian Rupees (INR) unless otherwise stated</li>
            <li>Pro subscriptions are valid for 30 days from purchase date</li>
            <li><strong>No Auto-Renewal:</strong> Subscriptions do NOT automatically renew. You must manually purchase again after expiration</li>
            <li>We reserve the right to change pricing with 30 days advance notice to existing users</li>
          </ul>

          <h3 className="font-semibold text-lg mb-3 mt-6">3.3 Refund Policy</h3>
          <ul className="list-disc pl-6 mb-4 space-y-2 text-muted-foreground">
            <li><strong>7-Day Money-Back Guarantee:</strong> Full refund within 7 days of purchase if you're not satisfied</li>
            <li>Refund requests must be submitted via email to <a href="mailto:resumebuddy0@gmail.com" className="text-primary hover:underline">resumebuddy0@gmail.com</a></li>
            <li>Refunds are processed within 5-7 business days</li>
            <li>No refunds after 7 days or if you've exhausted 80% or more of your monthly credits</li>
            <li>Abuse of refund policy may result in account suspension</li>
          </ul>
        </>
      ),
    },
    {
      icon: Shield,
      title: '4. User Responsibilities and Acceptable Use',
      content: (
        <>
          <p className="mb-4 text-muted-foreground">You agree to use ResumeBuddy only for lawful purposes. You agree NOT to:</p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
            <li>Provide false, misleading, or fraudulent information</li>
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe on intellectual property rights of others</li>
            <li>Upload malicious code, viruses, or harmful content</li>
            <li>Attempt to reverse engineer, hack, or breach our security</li>
            <li>Use automated bots or scrapers to access the Service</li>
            <li>Resell or redistribute Service access to third parties</li>
            <li>Create multiple accounts to bypass usage limits</li>
            <li>Harass, abuse, or harm other users or our team</li>
            <li>Use the Service for spam or unsolicited communications</li>
          </ul>
          <p className="text-muted-foreground">
            <strong>Violation of these terms may result in immediate account suspension or termination without refund.</strong>
          </p>
        </>
      ),
    },
    {
      icon: FileText,
      title: '5. Intellectual Property',
      content: (
        <>
          <h3 className="font-semibold text-lg mb-3">5.1 Our Content</h3>
          <p className="mb-4 text-muted-foreground">
            All content on ResumeBuddy, including text, graphics, logos, code, and AI models, is owned by 
            ResumeBuddy or its licensors and is protected by copyright, trademark, and other intellectual property laws.
          </p>

          <h3 className="font-semibold text-lg mb-3 mt-6">5.2 Your Content</h3>
          <p className="mb-4 text-muted-foreground">
            You retain ownership of all content you upload (resumes, job descriptions, personal information). 
            By using our Service, you grant us a limited license to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
            <li>Process your content through AI systems to provide analysis and recommendations</li>
            <li>Store your content securely for service delivery</li>
            <li>Use anonymized, aggregated data for service improvement (no personal identification)</li>
          </ul>
          <p className="text-muted-foreground">
            We do NOT claim ownership of your resumes or personal content. You may delete your content at any time 
            through your account settings.
          </p>
        </>
      ),
    },
    {
      icon: AlertTriangle,
      title: '6. Disclaimers and Limitations of Liability',
      content: (
        <>
          <h3 className="font-semibold text-lg mb-3">6.1 Service "As Is"</h3>
          <p className="mb-4 text-muted-foreground">
            ResumeBuddy is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, either express or implied. 
            We do not guarantee:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
            <li>Uninterrupted or error-free service</li>
            <li>Accuracy or reliability of AI-generated content</li>
            <li>Job placement, interview invitations, or hiring outcomes</li>
            <li>Compatibility with all devices or browsers</li>
          </ul>

          <h3 className="font-semibold text-lg mb-3 mt-6">6.2 Limitation of Liability</h3>
          <p className="mb-4 text-muted-foreground">
            To the maximum extent permitted by law, ResumeBuddy and its team shall not be liable for:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
            <li>Indirect, incidental, consequential, or punitive damages</li>
            <li>Loss of profits, data, or business opportunities</li>
            <li>Hiring decisions made by employers based on your resume</li>
            <li>Third-party actions (AI providers, payment processors, etc.)</li>
          </ul>
          <p className="text-muted-foreground">
            <strong>Our total liability is limited to the amount you paid for the Service in the past 12 months, 
            up to a maximum of ₹500.</strong>
          </p>

          <h3 className="font-semibold text-lg mb-3 mt-6">6.3 AI Disclaimer</h3>
          <p className="text-muted-foreground">
            Our AI systems provide suggestions based on patterns and best practices. While we strive for accuracy:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-2">
            <li>AI may occasionally generate incorrect or biased recommendations</li>
            <li>You are responsible for reviewing and verifying all AI-generated content</li>
            <li>AI analysis does not replace professional career counseling</li>
          </ul>
        </>
      ),
    },
    {
      icon: Ban,
      title: '7. Account Termination',
      content: (
        <>
          <h3 className="font-semibold text-lg mb-3">7.1 Your Right to Terminate</h3>
          <p className="mb-4 text-muted-foreground">
            You may close your account at any time through account settings or by contacting support. Upon termination:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
            <li>Your data will be permanently deleted within 30 days</li>
            <li>Remaining subscription days are forfeited (no pro-rated refunds)</li>
            <li>You lose access to all stored resumes and analysis</li>
          </ul>

          <h3 className="font-semibold text-lg mb-3 mt-6">7.2 Our Right to Terminate</h3>
          <p className="mb-4 text-muted-foreground">
            We reserve the right to suspend or terminate accounts that:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Violate these Terms of Service</li>
            <li>Engage in fraudulent or abusive behavior</li>
            <li>Attempt to harm the Service or other users</li>
            <li>Are inactive for more than 2 years</li>
          </ul>
          <p className="text-muted-foreground mt-4">
            We will provide reasonable notice before termination unless immediate action is required for security reasons.
          </p>
        </>
      ),
    },
    {
      icon: Globe,
      title: '8. Governing Law and Dispute Resolution',
      content: (
        <>
          <p className="mb-4 text-muted-foreground">
            These Terms are governed by the laws of India. Any disputes shall be resolved through:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
            <li><strong>Informal Resolution:</strong> Contact us first to resolve issues amicably</li>
            <li><strong>Mediation:</strong> If informal resolution fails, we agree to mediation</li>
            <li><strong>Arbitration:</strong> Binding arbitration in accordance with Indian Arbitration and Conciliation Act, 1996</li>
            <li><strong>Jurisdiction:</strong> Courts in [Your City], India (if arbitration fails)</li>
          </ul>
          <p className="text-muted-foreground">
            <strong>For International Users:</strong> You agree to the above governing law. EU users retain GDPR rights. 
            California users retain CCPA rights.
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
            <Scale className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
            Terms of Service
          </h1>
          <p className="text-lg text-muted-foreground mb-2">
            The rules and guidelines for using ResumeBuddy
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center text-sm text-muted-foreground">
            <p><strong>Effective Date:</strong> {effectiveDate}</p>
            <span className="hidden sm:inline">•</span>
            <p><strong>Last Updated:</strong> {lastUpdated}</p>
          </div>
        </div>

        {/* Important Notice */}
        <Alert className="mb-8 border-2 border-primary/30">
          <AlertTriangle className="h-5 w-5 text-primary" />
          <AlertDescription className="text-base">
            <strong>Please Read Carefully:</strong> By creating an account or using ResumeBuddy, you agree to these 
            Terms of Service. This is a legally binding agreement. If you do not agree, please do not use our Service.
          </AlertDescription>
        </Alert>

        {/* Introduction */}
        <Card className="mb-8 border-2">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome to ResumeBuddy</CardTitle>
            <CardDescription className="text-base">
              These Terms of Service ("Terms") govern your use of the ResumeBuddy platform and services. 
              We've written them in clear language to help you understand your rights and responsibilities.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-primary/10 border-l-4 border-l-primary p-4 rounded">
              <p className="text-sm text-muted-foreground">
                <strong>Quick Summary:</strong> Use ResumeBuddy responsibly. Pay for Pro features if you want them. 
                We provide tools to help with job searches, but we don't guarantee job placement. You own your content. 
                We can terminate accounts that violate our rules. Questions? Contact us at <a href="mailto:resumebuddy0@gmail.com" className="text-primary hover:underline">resumebuddy0@gmail.com</a>.
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

        {/* Changes to Terms */}
        <Card className="mt-6 border-2">
          <CardHeader>
            <CardTitle className="text-xl">9. Changes to Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              We may update these Terms from time to time. When we make material changes:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
              <li>We'll update the "Last Updated" date</li>
              <li>We'll notify you via email or in-app notification</li>
              <li>We'll provide a 30-day notice period before changes take effect</li>
              <li>Continued use after changes indicates acceptance</li>
            </ul>
            <p className="text-muted-foreground">
              If you don't agree to updated Terms, you may close your account before they take effect.
            </p>
          </CardContent>
        </Card>

        {/* Severability */}
        <Card className="mt-6 border-2">
          <CardHeader>
            <CardTitle className="text-xl">10. Miscellaneous</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Severability:</strong> If any provision is found unenforceable, remaining provisions remain in effect</li>
              <li><strong>No Waiver:</strong> Failure to enforce any right doesn't waive that right</li>
              <li><strong>Entire Agreement:</strong> These Terms constitute the entire agreement between you and ResumeBuddy</li>
              <li><strong>Assignment:</strong> You may not transfer your account; we may transfer our rights with notice</li>
              <li><strong>Force Majeure:</strong> We're not liable for delays caused by events beyond our control</li>
            </ul>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        {/* Contact Section */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Questions About These Terms?</CardTitle>
            <CardDescription className="text-center text-base">
              If you have questions or concerns about these Terms of Service, we're here to help.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="text-center sm:text-left">
                <p className="text-muted-foreground mb-2">
                  <strong>Email:</strong> <a href="mailto:resumebuddy0@gmail.com" className="text-primary hover:underline">resumebuddy0@gmail.com</a>
                </p>
                <p className="text-muted-foreground mb-2">
                  <strong>Support:</strong> <Link href="/support" className="text-primary hover:underline">Visit Support Page</Link>
                </p>
                <p className="text-muted-foreground">
                  <strong>Legal Inquiries:</strong> Include "Legal - Terms" in subject line
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Acknowledgment */}
        <div className="mt-8 text-center">
          <Card className="border-2 border-amber-500/20 bg-amber-500/5">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                By clicking "I Agree" during registration or by using ResumeBuddy, you acknowledge that you have read, 
                understood, and agree to be bound by these Terms of Service and our{' '}
                <Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
