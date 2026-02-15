-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'PRO');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'PAST_DUE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "InterviewType" AS ENUM ('TECHNICAL', 'BEHAVIORAL', 'SYSTEM_DESIGN', 'HR', 'MIXED', 'DSA');

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ResumeFormat" AS ENUM ('LATEX', 'PDF', 'DOCX');

-- CreateEnum
CREATE TYPE "ResumeStatus" AS ENUM ('DRAFT', 'GENERATING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "VerificationType" AS ENUM ('EMAIL', 'PHONE', 'PASSWORD_RESET');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255),
    "password_hash" VARCHAR(255),
    "phone" VARCHAR(20),
    "phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "avatar" VARCHAR(500),
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "provider_account_id" VARCHAR(255) NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "session_id" VARCHAR(100) NOT NULL,
    "user_id" UUID NOT NULL,
    "user_agent" TEXT,
    "ip_address" VARCHAR(45),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "user_id" UUID NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "revoked_at" TIMESTAMP(3),
    "replaced_by_token" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" VARCHAR(255) NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "type" "VerificationType" NOT NULL DEFAULT 'EMAIL',
    "expires" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tier" "SubscriptionTier" NOT NULL DEFAULT 'FREE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "razorpay_subscription_id" VARCHAR(255),
    "razorpay_customer_id" VARCHAR(255),
    "razorpay_order_id" VARCHAR(255),
    "razorpay_payment_id" VARCHAR(255),
    "current_period_start" TIMESTAMP(3),
    "current_period_end" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'INR',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "razorpay_payment_id" VARCHAR(255),
    "razorpay_order_id" VARCHAR(255),
    "razorpay_signature" VARCHAR(500),
    "plan_type" VARCHAR(50),
    "description" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_records" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "feature" VARCHAR(50) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_data" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" VARCHAR(255),
    "resume_text" TEXT,
    "job_description" TEXT,
    "job_role" VARCHAR(100),
    "job_url" VARCHAR(500),
    "parsed_data" JSONB,
    "analysis" JSONB,
    "improvements" JSONB,
    "qa_history" JSONB,
    "cover_letter" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_analyzed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resume_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interviews" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "resume_data_id" UUID,
    "type" "InterviewType" NOT NULL,
    "difficulty" "DifficultyLevel" NOT NULL,
    "role" VARCHAR(100),
    "company" VARCHAR(100),
    "questions" JSONB NOT NULL,
    "answers" JSONB,
    "feedback" JSONB,
    "score" INTEGER,
    "status" "InterviewStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stored_files" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "size" INTEGER NOT NULL,
    "bucket" VARCHAR(100) NOT NULL DEFAULT 'resumebuddy',
    "object_key" VARCHAR(500) NOT NULL,
    "public_url" VARCHAR(500),
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stored_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_resumes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "resume_data_id" UUID NOT NULL,
    "template_id" VARCHAR(50) NOT NULL,
    "format" "ResumeFormat" NOT NULL,
    "latex_source" TEXT,
    "file_id" UUID,
    "status" "ResumeStatus" NOT NULL DEFAULT 'DRAFT',
    "error" TEXT,
    "generated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "generated_resumes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_id_key" ON "sessions"("session_id");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_user_id_key" ON "subscriptions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_razorpay_payment_id_key" ON "payments"("razorpay_payment_id");

-- CreateIndex
CREATE INDEX "payments_user_id_created_at_idx" ON "payments"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "payments_razorpay_payment_id_idx" ON "payments"("razorpay_payment_id");

-- CreateIndex
CREATE INDEX "usage_records_user_id_date_idx" ON "usage_records"("user_id", "date");

-- CreateIndex
CREATE INDEX "usage_records_user_id_feature_idx" ON "usage_records"("user_id", "feature");

-- CreateIndex
CREATE UNIQUE INDEX "usage_records_user_id_feature_date_key" ON "usage_records"("user_id", "feature", "date");

-- CreateIndex
CREATE INDEX "resume_data_user_id_is_active_idx" ON "resume_data"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "resume_data_user_id_created_at_idx" ON "resume_data"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "interviews_user_id_created_at_idx" ON "interviews"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "interviews_user_id_status_idx" ON "interviews"("user_id", "status");

-- CreateIndex
CREATE INDEX "stored_files_user_id_created_at_idx" ON "stored_files"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "generated_resumes_user_id_created_at_idx" ON "generated_resumes"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_data" ADD CONSTRAINT "resume_data_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_resume_data_id_fkey" FOREIGN KEY ("resume_data_id") REFERENCES "resume_data"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stored_files" ADD CONSTRAINT "stored_files_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_resumes" ADD CONSTRAINT "generated_resumes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_resumes" ADD CONSTRAINT "generated_resumes_resume_data_id_fkey" FOREIGN KEY ("resume_data_id") REFERENCES "resume_data"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_resumes" ADD CONSTRAINT "generated_resumes_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "stored_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

