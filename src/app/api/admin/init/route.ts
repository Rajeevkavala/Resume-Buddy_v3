import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Initial admin email
const ADMIN_EMAIL = 'resumebuddy0@gmail.com';

export async function POST() {
  try {
    // Check if admin already exists
    const existing = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
    });

    if (existing && existing.role === 'ADMIN') {
      return NextResponse.json({
        success: true,
        message: 'Admin already initialized',
        admin: { email: existing.email, role: 'admin', status: existing.status.toLowerCase() },
      });
    }

    // Upsert the admin user
    const admin = await prisma.user.upsert({
      where: { email: ADMIN_EMAIL },
      update: { role: 'ADMIN', status: 'ACTIVE' },
      create: {
        email: ADMIN_EMAIL,
        name: 'Resume Buddy Admin',
        role: 'ADMIN',
        status: 'ACTIVE',
        passwordHash: '', // Admin logs in via Google OAuth
      },
    });

    // Log the initialization
    await prisma.adminAction.create({
      data: {
        adminId: admin.id,
        action: 'system_init',
        targetId: admin.id,
        details: {
          message: 'Admin panel initialized via API',
          targetEmail: ADMIN_EMAIL,
          adminEmail: 'system',
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Admin initialized successfully',
      admin: { email: ADMIN_EMAIL, role: 'admin', status: 'active' },
    });

  } catch (error) {
    console.error('Initialization error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize admin', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const admin = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
      select: { email: true, role: true, status: true, createdAt: true },
    });

    if (admin && admin.role === 'ADMIN') {
      return NextResponse.json({
        initialized: true,
        admin: { email: admin.email, role: 'admin', status: admin.status.toLowerCase() },
      });
    }

    return NextResponse.json({
      initialized: false,
      message: 'Admin not yet initialized. Send POST request to initialize.',
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check status', details: String(error) },
      { status: 500 }
    );
  }
}
