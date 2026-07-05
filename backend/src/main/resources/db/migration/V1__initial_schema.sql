CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    role VARCHAR(20) NOT NULL DEFAULT 'STUDENT',
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    mime_type VARCHAR(50),
    size BIGINT NOT NULL DEFAULT 0,
    extracted_text TEXT,
    author VARCHAR(255),
    title VARCHAR(255),
    subject VARCHAR(100),
    unit VARCHAR(50),
    topic VARCHAR(100),
    source VARCHAR(50),
    source_url VARCHAR(500),
    page_count INTEGER,
    tags TEXT,
    chunk_count INTEGER DEFAULT 0,
    indexed BOOLEAN NOT NULL DEFAULT FALSE,
    error_message TEXT,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);

CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    message_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    role VARCHAR(10) NOT NULL,
    content TEXT NOT NULL,
    sources TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE app_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description VARCHAR(255),
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_documents_subject ON documents(subject);
CREATE INDEX idx_documents_unit ON documents(unit);
CREATE INDEX idx_documents_indexed ON documents(indexed);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at);
CREATE INDEX idx_app_settings_key ON app_settings(key);

-- Default settings
INSERT INTO app_settings (key, value, description) VALUES
('ai.provider', 'openai', 'Proveedor de IA: openai, ollama'),
('ai.model', 'gpt-4o', 'Modelo de chat'),
('ai.embedding.model', 'text-embedding-3-small', 'Modelo de embeddings'),
('ai.temperature', '0.3', 'Temperatura del modelo'),
('rag.chunk_size', '512', 'Tamaño de chunks para indexación'),
('rag.chunk_overlap', '64', 'Solapamiento entre chunks'),
('rag.top_k', '10', 'Número de resultados a recuperar'),
('rag.similarity_threshold', '0.75', 'Umbral de similitud'),
('math.engine', 'symja', 'Motor de cálculo simbólico');
