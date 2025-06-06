CREATE TABLE IF NOT EXISTS events (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    details TEXT,
    vod_url TEXT,
    start_dtm TIMESTAMP NOT NULL,
    end_dtm TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS players (
    id VARCHAR(100) NOT NULL PRIMARY KEY,
    username VARCHAR(100),
    avatar_url TEXT,
    short VARCHAR(50),
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    session_id VARCHAR(128)
);

CREATE TABLE IF NOT EXISTS participations (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    event_id INT UNSIGNED NOT NULL,
    player_id VARCHAR(100) NOT NULL,
    participation_level ENUM('attended', 'raced', 'won') NOT NULL DEFAULT 'attended',

    UNIQUE KEY unique_participation (event_id, player_id),

    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS games (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    pre_title VARCHAR(100),
    title VARCHAR(100) NOT NULL,
    post_title VARCHAR(100),
    slug VARCHAR(50) NOT NULL UNIQUE,
    has_leaderboard BOOLEAN NOT NULL DEFAULT FALSE,
    board_layout JSON,
    board_cache JSON
);

CREATE TABLE IF NOT EXISTS segments (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    label VARCHAR(100) NOT NULL,
    notes TEXT,
    game_id INT UNSIGNED NOT NULL,
    is_full_run BOOLEAN NOT NULL DEFAULT FALSE,
    timing_type ENUM('millis', 'centis', 'seconds', 'frames', 'count') NOT NULL DEFAULT 'millis',
    timing_inverted BOOLEAN NOT NULL DEFAULT FALSE,

    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS segment_times (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    player_id VARCHAR(100) NOT NULL,
    segment_id INT UNSIGNED NOT NULL,
    segment_time INT UNSIGNED NOT NULL,
    posted_dtm TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    vod_url TEXT,

    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (segment_id) REFERENCES segments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS docs (
    slug VARCHAR(100) NOT NULL PRIMARY KEY,
    content TEXT
);

CREATE TABLE IF NOT EXISTS oauth_tokens (
    player_id VARCHAR(100) NOT NULL PRIMARY KEY,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,

    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);
