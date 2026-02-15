import Link from 'next/link';
import { FileText, Brain, Target, MessageSquare, Shield, Mail, MessageCircle } from 'lucide-react';

// WhatsApp support group link - update this with your actual group link
const WHATSAPP_GROUP_LINK = 'https://chat.whatsapp.com/YOUR_GROUP_INVITE_CODE';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: 'Resume Analyzer', href: '/analysis', description: 'AI-powered resume analysis' },
      { name: 'Resume Builder', href: '/create-resume', description: 'Create professional resumes' },
      { name: 'Interview Prep', href: '/interview', description: 'Practice interview questions' },
      { name: 'Q&A Generator', href: '/qa', description: 'Generate interview Q&A' },
    ],
    resources: [
      { name: 'Dashboard', href: '/dashboard', description: 'Your resume dashboard' },
      { name: 'Improvements', href: '/improvement', description: 'Get resume suggestions' },
    ],
    company: [
      { name: 'About Us', href: '#', description: 'Learn about ResumeBuddy' },
      { name: 'Privacy Policy', href: '#', description: 'Our privacy practices' },
      { name: 'Terms of Service', href: '#', description: 'Our terms of service' },
    ],
    support: [
      { name: 'WhatsApp Group', href: WHATSAPP_GROUP_LINK, description: 'Join our support group', external: true },
      { name: 'Email Support', href: 'mailto:resumebuddy0@gmail.com', description: 'Contact via email', external: true },
    ],
  };

  return (
    <footer className="bg-background border-t" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2" aria-label="ResumeBuddy Home">
              <FileText className="h-6 w-6 text-primary" aria-hidden="true" />
              <span className="text-xl font-bold">ResumeBuddy</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              Transform your resume with AI-powered analysis. Get instant ATS scores, personalized improvements, and land your dream job.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-green-500" aria-hidden="true" />
              <span>Your data is secure & private</span>
            </div>
          </div>

          {/* Product Links */}
          <nav aria-label="Product navigation">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">
              Product
            </h3>
            <ul className="space-y-3" role="list">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    title={link.description}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Resources Links */}
          <nav aria-label="Resources navigation">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">
              Resources
            </h3>
            <ul className="space-y-3" role="list">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    title={link.description}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Company Links */}
          <nav aria-label="Company navigation">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">
              Company
            </h3>
            <ul className="space-y-3" role="list">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    title={link.description}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Support Links */}
          <nav aria-label="Support navigation">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">
              Support
            </h3>
            <ul className="space-y-3" role="list">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                    title={link.description}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noopener noreferrer' : undefined}
                  >
                    {link.name === 'WhatsApp Group' && <MessageCircle className="h-4 w-4 text-[#25D366]" />}
                    {link.name === 'Email Support' && <Mail className="h-4 w-4" />}
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 border-t pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {currentYear} ResumeBuddy. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-primary transition-colors">
                Privacy
              </Link>
              <Link href="#" className="hover:text-primary transition-colors">
                Terms
              </Link>
              <Link href="#" className="hover:text-primary transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
