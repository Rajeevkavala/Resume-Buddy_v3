import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, addDoc, Timestamp } from 'firebase/firestore';

// Initial admin email
const ADMIN_EMAIL = 'resumebuddy0@gmail.com';

export async function POST() {
  try {
    // Check if already initialized
    const whitelistRef = doc(db, 'whitelist', ADMIN_EMAIL);
    const existingDoc = await getDoc(whitelistRef);

    if (existingDoc.exists()) {
      return NextResponse.json({
        success: true,
        message: 'Admin already initialized',
        admin: existingDoc.data(),
      });
    }

    // Create whitelist entry for admin
    await setDoc(whitelistRef, {
      email: ADMIN_EMAIL,
      role: 'admin',
      status: 'active',
      addedBy: 'system',
      addedAt: Timestamp.now(),
      notes: 'Initial super admin - Resume Buddy',
    });

    // Create app_config
    const configRef = doc(db, 'app_config', 'settings');
    const configDoc = await getDoc(configRef);

    if (!configDoc.exists()) {
      await setDoc(configRef, {
        whitelistEnabled: true,
        allowPublicSignup: false,
        defaultDailyLimit: 10,
        defaultMonthlyLimit: 300,
        adminDailyLimit: 100,
        adminMonthlyLimit: 300,
        maintenanceMode: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }

    // Log the initialization
    await addDoc(collection(db, 'admin_actions'), {
      adminId: 'system',
      adminEmail: 'system',
      action: 'system_init',
      targetEmail: ADMIN_EMAIL,
      details: {
        message: 'Admin panel initialized via API',
      },
      timestamp: Timestamp.now(),
    });

    return NextResponse.json({
      success: true,
      message: 'Admin initialized successfully',
      admin: {
        email: ADMIN_EMAIL,
        role: 'admin',
        status: 'active',
      },
      collections: ['whitelist', 'app_config', 'admin_actions'],
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
    const whitelistRef = doc(db, 'whitelist', ADMIN_EMAIL);
    const whitelistDoc = await getDoc(whitelistRef);

    if (whitelistDoc.exists()) {
      return NextResponse.json({
        initialized: true,
        admin: whitelistDoc.data(),
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
