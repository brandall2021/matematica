CREATE TABLE usage_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    model_provider VARCHAR(50) NOT NULL,
    model_name VARCHAR(100),
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    estimated_cost DOUBLE PRECISION DEFAULT 0.0,
    operation_type VARCHAR(50) NOT NULL,
    duration_ms BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_created_at ON usage_logs(created_at);
CREATE INDEX idx_usage_logs_model_provider ON usage_logs(model_provider);
