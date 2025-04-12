CREATE TABLE bot.commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_id TEXT NOT NULL,
    floor INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'pending',
    robot_id TEXT
);