-- CreateTable
CREATE TABLE "tbl_chart_data" (
    "id_data" BIGSERIAL NOT NULL,
    "month" INTEGER,
    "year" INTEGER,
    "id_class" BIGINT,
    "total_present" INTEGER DEFAULT 0,
    "total_menstruation" INTEGER DEFAULT 0,
    "total_warnings" INTEGER DEFAULT 0,

    CONSTRAINT "tbl_chart_data_pkey" PRIMARY KEY ("id_data")
);

-- CreateTable
CREATE TABLE "tbl_notifications" (
    "id_notification" BIGSERIAL NOT NULL,
    "id_student" BIGINT,
    "message" TEXT,
    "read_status" VARCHAR(10),
    "sent_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_notifications_pkey" PRIMARY KEY ("id_notification")
);

-- CreateTable
CREATE TABLE "tbl_warnings" (
    "id_warning" BIGSERIAL NOT NULL,
    "id_student" BIGINT,
    "warning_date" DATE,
    "warning_type" VARCHAR(50),
    "read_status" VARCHAR(10),
    "admin_action" TEXT,

    CONSTRAINT "tbl_warnings_pkey" PRIMARY KEY ("id_warning")
);

-- CreateTable
CREATE TABLE "tbl_menstruation_periods" (
    "id_period" BIGSERIAL NOT NULL,
    "id_student" BIGINT,
    "start_date" DATE,
    "end_date" DATE,
    "duration" INTEGER,
    "completion_status" VARCHAR(10),
    "remarks" VARCHAR(50),

    CONSTRAINT "tbl_menstruation_periods_pkey" PRIMARY KEY ("id_period")
);

-- CreateTable
CREATE TABLE "tbl_monthly_recaps" (
    "id_recap" BIGSERIAL NOT NULL,
    "id_student" BIGINT,
    "month" INTEGER,
    "year" INTEGER,
    "total_prayers" INTEGER DEFAULT 0,
    "total_menstruation" INTEGER DEFAULT 0,
    "total_present" INTEGER DEFAULT 0,
    "total_excused" INTEGER DEFAULT 0,
    "total_absent" INTEGER DEFAULT 0,
    "total_warnings" INTEGER DEFAULT 0,

    CONSTRAINT "tbl_monthly_recaps_pkey" PRIMARY KEY ("id_recap")
);

-- CreateTable
CREATE TABLE "tbl_attendance" (
    "id_attendance" BIGSERIAL NOT NULL,
    "id_student" BIGINT,
    "id_user" BIGINT,
    "date" DATE NOT NULL,
    "time" VARCHAR(10),
    "status" VARCHAR(20),
    "remarks" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "method" VARCHAR(10),

    CONSTRAINT "tbl_attendance_pkey" PRIMARY KEY ("id_attendance")
);

-- CreateTable
CREATE TABLE "tbl_menstruation_settings" (
    "id_setting" BIGSERIAL NOT NULL,
    "min_duration" INTEGER DEFAULT 5,
    "standard_duration" INTEGER DEFAULT 7,
    "max_duration" INTEGER DEFAULT 10,
    "over_limit" INTEGER DEFAULT 30,

    CONSTRAINT "tbl_menstruation_settings_pkey" PRIMARY KEY ("id_setting")
);

-- CreateTable
CREATE TABLE "tbl_prayers" (
    "id_cache" BIGSERIAL NOT NULL,
    "date" DATE NOT NULL,
    "fajr" VARCHAR(5) NOT NULL,
    "dhuhr" VARCHAR(5) NOT NULL,
    "asr" VARCHAR(5) NOT NULL,
    "maghrib" VARCHAR(5) NOT NULL,
    "isha" VARCHAR(5) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_prayers_pkey" PRIMARY KEY ("id_cache")
);

-- CreateTable
CREATE TABLE "tbl_geographic" (
    "id_setting" INTEGER NOT NULL DEFAULT 1,
    "country" VARCHAR(50) NOT NULL DEFAULT 'Indonesia',
    "city" VARCHAR(100) NOT NULL DEFAULT 'Kota Blitar / Jawa Timur',
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'Asia/Jakarta',
    "method" VARCHAR(10) NOT NULL DEFAULT '20',
    "is_api_active" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_geographic_pkey" PRIMARY KEY ("id_setting")
);

-- CreateTable
CREATE TABLE "tbl_qr_generator" (
    "id_setting" INTEGER NOT NULL DEFAULT 1,
    "qr_shape" TEXT NOT NULL DEFAULT 'square',
    "qr_color" TEXT NOT NULL DEFAULT '#000000',
    "bg_color" TEXT NOT NULL DEFAULT '#ffffff',
    "is_bg_transparent" BOOLEAN NOT NULL DEFAULT true,
    "qr_pattern" TEXT NOT NULL DEFAULT 'square',
    "error_level" TEXT NOT NULL DEFAULT 'Q',
    "corner_square" TEXT NOT NULL DEFAULT 'square',
    "corner_square_color" TEXT NOT NULL DEFAULT '#000000',
    "corner_dot" TEXT NOT NULL DEFAULT 'square',
    "corner_dot_color" TEXT NOT NULL DEFAULT '#000000',
    "main_dot_color" TEXT NOT NULL DEFAULT '#000000',
    "is_custom_color" BOOLEAN NOT NULL DEFAULT false,
    "qr_icon" TEXT,
    "image_size" DOUBLE PRECISION NOT NULL DEFAULT 0.4,
    "icon_margin" INTEGER NOT NULL DEFAULT 5,
    "hide_dots_bg" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tbl_qr_generator_pkey" PRIMARY KEY ("id_setting")
);

-- CreateTable
CREATE TABLE "tbl_routine" (
    "day_name" VARCHAR(15) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "track_fajr" BOOLEAN NOT NULL DEFAULT false,
    "track_dhuhr" BOOLEAN NOT NULL DEFAULT true,
    "track_asr" BOOLEAN NOT NULL DEFAULT true,
    "track_maghrib" BOOLEAN NOT NULL DEFAULT false,
    "track_isha" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_routine_pkey" PRIMARY KEY ("day_name")
);

-- CreateTable
CREATE TABLE "tbl_classes" (
    "id_class" BIGSERIAL NOT NULL,
    "class_name" VARCHAR(50) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "batch" INTEGER NOT NULL,
    "academic_year" VARCHAR(20),
    "advisor" VARCHAR(100),
    "description" TEXT,

    CONSTRAINT "tbl_classes_pkey" PRIMARY KEY ("id_class")
);

-- CreateTable
CREATE TABLE "tbl_students" (
    "id_student" BIGSERIAL NOT NULL,
    "nano_id" VARCHAR(32) NOT NULL,
    "nis" VARCHAR NOT NULL,
    "full_name" VARCHAR NOT NULL,
    "avatar_url" TEXT,
    "id_class" BIGINT,
    "period_status" VARCHAR,
    "notes" TEXT,
    "icode" VARCHAR(50) NOT NULL,

    CONSTRAINT "tbl_students_pkey" PRIMARY KEY ("id_student")
);

-- CreateTable
CREATE TABLE "tbl_users" (
    "id_user" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'Pelaksana',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "photo_url" TEXT,
    "session_version" INTEGER NOT NULL DEFAULT 1,
    "last_login" TIMESTAMPTZ(6),
    "last_seen_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tbl_users_pkey" PRIMARY KEY ("id_user")
);

-- CreateTable
CREATE TABLE "tbl_connections" (
    "id_connection" BIGSERIAL NOT NULL,
    "id_user" BIGINT NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "provider_id" VARCHAR(255) NOT NULL,
    "display_name" VARCHAR(150),
    "username" VARCHAR(150),
    "email" VARCHAR(150),
    "avatar_url" TEXT,
    "profile_url" TEXT,
    "metadata" JSONB,
    "connected_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tbl_connections_pkey" PRIMARY KEY ("id_connection")
);

-- CreateTable
CREATE TABLE "tbl_activity_logs" (
    "id_log" BIGSERIAL NOT NULL,
    "actor_type" VARCHAR(20) NOT NULL DEFAULT 'USER',
    "id_user" BIGINT,
    "actor_name" VARCHAR(100),
    "actor_role" VARCHAR(20),
    "category" VARCHAR(50) NOT NULL,
    "scope" VARCHAR(100) NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "outcome" VARCHAR(20),
    "target_type" VARCHAR(50),
    "target_id" VARCHAR(100),
    "summary" VARCHAR(255) NOT NULL,
    "details" JSONB,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tbl_activity_logs_pkey" PRIMARY KEY ("id_log")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl_prayers_date_key" ON "tbl_prayers"("date");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_classes_slug_key" ON "tbl_classes"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_students_nano_id_key" ON "tbl_students"("nano_id");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_students_icode_key" ON "tbl_students"("icode");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_users_username_key" ON "tbl_users"("username");

-- CreateIndex
CREATE INDEX "tbl_connections_id_user_idx" ON "tbl_connections"("id_user");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_connections_provider_provider_id_key" ON "tbl_connections"("provider", "provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "tbl_connections_id_user_provider_key" ON "tbl_connections"("id_user", "provider");

-- CreateIndex
CREATE INDEX "tbl_activity_logs_category_scope_timestamp_idx" ON "tbl_activity_logs"("category", "scope", "timestamp");

-- CreateIndex
CREATE INDEX "tbl_activity_logs_id_user_timestamp_idx" ON "tbl_activity_logs"("id_user", "timestamp");

-- CreateIndex
CREATE INDEX "tbl_activity_logs_target_type_target_id_timestamp_idx" ON "tbl_activity_logs"("target_type", "target_id", "timestamp");

-- AddForeignKey
ALTER TABLE "tbl_chart_data" ADD CONSTRAINT "tbl_chart_data_id_class_fkey" FOREIGN KEY ("id_class") REFERENCES "tbl_classes"("id_class") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_notifications" ADD CONSTRAINT "tbl_notifications_id_student_fkey" FOREIGN KEY ("id_student") REFERENCES "tbl_students"("id_student") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_warnings" ADD CONSTRAINT "tbl_warnings_id_student_fkey" FOREIGN KEY ("id_student") REFERENCES "tbl_students"("id_student") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_menstruation_periods" ADD CONSTRAINT "tbl_menstruation_periods_id_student_fkey" FOREIGN KEY ("id_student") REFERENCES "tbl_students"("id_student") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_monthly_recaps" ADD CONSTRAINT "tbl_monthly_recaps_id_student_fkey" FOREIGN KEY ("id_student") REFERENCES "tbl_students"("id_student") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_attendance" ADD CONSTRAINT "tbl_attendance_id_student_fkey" FOREIGN KEY ("id_student") REFERENCES "tbl_students"("id_student") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_attendance" ADD CONSTRAINT "tbl_attendance_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "tbl_users"("id_user") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_students" ADD CONSTRAINT "tbl_students_id_class_fkey" FOREIGN KEY ("id_class") REFERENCES "tbl_classes"("id_class") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_connections" ADD CONSTRAINT "tbl_connections_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "tbl_users"("id_user") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tbl_activity_logs" ADD CONSTRAINT "tbl_activity_logs_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "tbl_users"("id_user") ON DELETE SET NULL ON UPDATE NO ACTION;
