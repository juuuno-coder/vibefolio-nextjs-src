-- Migration: Create received_emails table for Resend inbound emails
-- Created: 2026-01-18

CREATE TABLE IF NOT EXISTS received_emails (
    email_id BIGSERIAL PRIMARY KEY,
    from_email TEXT NOT NULL,
    to_email TEXT NOT NULL,
    subject TEXT,
    text_content TEXT,
    html_content TEXT,
    headers JSONB,
    attachments JSONB,
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- 인덱스
CREATE INDEX idx_received_emails_from ON received_emails(from_email);
CREATE INDEX idx_received_emails_to ON received_emails(to_email);
CREATE INDEX idx_received_emails_created ON received_emails(created_at DESC);

-- RLS 정책 (관리자만 접근)
ALTER TABLE received_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view all received emails"
    ON received_emails
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

COMMENT ON TABLE received_emails IS 'Resend를 통해 수신된 이메일 저장';
