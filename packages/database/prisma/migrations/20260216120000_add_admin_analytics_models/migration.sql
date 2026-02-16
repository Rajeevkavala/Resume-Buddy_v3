-- CreateTable
CREATE TABLE "admin_actions" (
    "id" UUID NOT NULL,
    "admin_id" VARCHAR(128) NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "target_id" VARCHAR(128),
    "details" JSONB,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_call_logs" (
    "id" UUID NOT NULL,
    "user_id" VARCHAR(128) NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "operation" VARCHAR(100) NOT NULL,
    "tokens_used" INTEGER NOT NULL DEFAULT 0,
    "latency_ms" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "error" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_call_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_activity" (
    "id" UUID NOT NULL,
    "user_id" VARCHAR(128) NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "details" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_actions_admin_id_created_at_idx" ON "admin_actions"("admin_id", "created_at");

-- CreateIndex
CREATE INDEX "admin_actions_action_idx" ON "admin_actions"("action");

-- CreateIndex
CREATE INDEX "api_call_logs_user_id_created_at_idx" ON "api_call_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "api_call_logs_provider_created_at_idx" ON "api_call_logs"("provider", "created_at");

-- CreateIndex
CREATE INDEX "api_call_logs_created_at_idx" ON "api_call_logs"("created_at");

-- CreateIndex
CREATE INDEX "user_activity_user_id_created_at_idx" ON "user_activity"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "user_activity_action_idx" ON "user_activity"("action");
