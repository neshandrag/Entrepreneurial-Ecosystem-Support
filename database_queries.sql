-- =====================================================
-- CIBTIF Database Table Creation Queries
-- =====================================================
-- This file contains SQL DDL statements equivalent to your MongoDB models
-- Note: Your application uses MongoDB, but these SQL queries can be used
-- for reference or if you decide to migrate to a SQL database

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
CREATE TABLE users (
    id VARCHAR(24) PRIMARY KEY, -- MongoDB ObjectId equivalent
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(30) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('individual', 'enterprise', 'admin') DEFAULT 'individual',
    profile_complete BOOLEAN DEFAULT FALSE,
    is_email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP NULL,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_username_length CHECK (CHAR_LENGTH(username) >= 3),
    CONSTRAINT chk_password_length CHECK (CHAR_LENGTH(password) >= 6),
    CONSTRAINT chk_email_format CHECK (email REGEXP '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
);

-- Indexes for users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);

-- =====================================================
-- 2. PROFILES TABLE
-- =====================================================
CREATE TABLE profiles (
    id VARCHAR(24) PRIMARY KEY,
    user_id VARCHAR(24) UNIQUE NOT NULL,
    
    -- Step 1: Personal Information
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    location VARCHAR(255) NOT NULL,
    
    -- Step 2: Enterprise Information
    startup_name VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    application_type ENUM('innovation', 'incubation') NOT NULL,
    founder_name VARCHAR(255) NOT NULL,
    co_founder_names JSON, -- Array of strings
    sector VARCHAR(100) NOT NULL,
    linkedin_profile VARCHAR(500),
    
    -- Step 3: Incubation Details
    previously_incubated BOOLEAN DEFAULT FALSE,
    incubator_name VARCHAR(255),
    incubator_location VARCHAR(255),
    incubation_duration VARCHAR(100),
    incubator_type VARCHAR(100),
    incubation_mode ENUM('online', 'offline', 'hybrid'),
    supports_received JSON, -- Array of strings
    
    -- Step 4: Documentation
    aadhaar_doc VARCHAR(500) NOT NULL,
    incorporation_cert VARCHAR(500),
    msme_cert VARCHAR(500),
    dpiit_cert VARCHAR(500),
    mou_partnership VARCHAR(500),
    
    -- Step 5: Pitch Deck & Traction
    business_documents JSON, -- Array of strings
    traction_details JSON, -- Array of strings
    balance_sheet VARCHAR(500),
    
    -- Step 6: Funding Information
    funding_stage VARCHAR(100) NOT NULL,
    already_funded BOOLEAN DEFAULT FALSE,
    funding_amount DECIMAL(15,2),
    funding_source VARCHAR(255),
    funding_date DATE,
    
    -- Additional fields
    is_complete BOOLEAN DEFAULT FALSE,
    completion_percentage INT DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for profiles table
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_application_type ON profiles(application_type);
CREATE INDEX idx_profiles_sector ON profiles(sector);
CREATE INDEX idx_profiles_is_complete ON profiles(is_complete);

-- =====================================================
-- 3. STARTUPS TABLE
-- =====================================================
CREATE TABLE startups (
    id VARCHAR(24) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    founder VARCHAR(255) NOT NULL,
    sector VARCHAR(100) NOT NULL,
    type ENUM('innovation', 'incubation') NOT NULL,
    status ENUM('pending', 'active', 'completed', 'dropout') DEFAULT 'pending',
    trl_level TINYINT NOT NULL CHECK (trl_level >= 1 AND trl_level <= 9),
    email VARCHAR(255) NOT NULL,
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(24) NOT NULL,
    profile_id VARCHAR(24),
    
    -- Additional startup information
    description TEXT,
    website VARCHAR(500),
    linkedin_profile VARCHAR(500),
    team_size INT CHECK (team_size >= 1),
    founded_year INT CHECK (founded_year >= 1900 AND founded_year <= YEAR(CURRENT_DATE)),
    location VARCHAR(255),
    
    -- Application details
    application_status ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected') DEFAULT 'draft',
    review_notes TEXT,
    assigned_mentor VARCHAR(24),
    assigned_investor VARCHAR(24),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_mentor) REFERENCES mentors(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_investor) REFERENCES investors(id) ON DELETE SET NULL
);

-- Indexes for startups table
CREATE INDEX idx_startups_user_id ON startups(user_id);
CREATE INDEX idx_startups_status ON startups(status);
CREATE INDEX idx_startups_type ON startups(type);
CREATE INDEX idx_startups_sector ON startups(sector);
CREATE INDEX idx_startups_application_status ON startups(application_status);
CREATE INDEX idx_startups_trl_level ON startups(trl_level);
CREATE INDEX idx_startups_assigned_mentor ON startups(assigned_mentor);
CREATE INDEX idx_startups_assigned_investor ON startups(assigned_investor);

-- =====================================================
-- 4. STARTUP MILESTONES TABLE
-- =====================================================
CREATE TABLE startup_milestones (
    id VARCHAR(24) PRIMARY KEY,
    startup_id VARCHAR(24) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target_date DATE NOT NULL,
    completed_date DATE,
    status ENUM('pending', 'in_progress', 'completed', 'overdue') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (startup_id) REFERENCES startups(id) ON DELETE CASCADE
);

-- Indexes for startup_milestones table
CREATE INDEX idx_startup_milestones_startup_id ON startup_milestones(startup_id);
CREATE INDEX idx_startup_milestones_status ON startup_milestones(status);
CREATE INDEX idx_startup_milestones_target_date ON startup_milestones(target_date);

-- =====================================================
-- 5. STARTUP FUNDING HISTORY TABLE
-- =====================================================
CREATE TABLE startup_funding_history (
    id VARCHAR(24) PRIMARY KEY,
    startup_id VARCHAR(24) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    source VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    stage VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (startup_id) REFERENCES startups(id) ON DELETE CASCADE
);

-- Indexes for startup_funding_history table
CREATE INDEX idx_startup_funding_startup_id ON startup_funding_history(startup_id);
CREATE INDEX idx_startup_funding_date ON startup_funding_history(date);
CREATE INDEX idx_startup_funding_stage ON startup_funding_history(stage);

-- =====================================================
-- 6. INVESTORS TABLE
-- =====================================================
CREATE TABLE investors (
    id VARCHAR(24) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    firm VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    investment_range VARCHAR(100) NOT NULL,
    focus_areas JSON NOT NULL, -- Array of strings
    background_summary TEXT NOT NULL,
    profile_picture VARCHAR(500) DEFAULT '',
    user_id VARCHAR(24),
    
    -- Additional investor information
    linkedin_profile VARCHAR(500),
    website VARCHAR(500),
    location VARCHAR(255),
    position VARCHAR(255),
    
    -- Investment preferences
    min_investment DECIMAL(15,2) DEFAULT 0,
    max_investment DECIMAL(15,2) DEFAULT 1000000,
    preferred_sectors JSON, -- Array of strings
    preferred_stages JSON, -- Array of strings
    geographic_focus JSON, -- Array of strings
    investment_criteria JSON, -- Array of strings
    
    -- Statistics
    total_investments INT DEFAULT 0,
    total_amount_invested DECIMAL(15,2) DEFAULT 0,
    active_investments INT DEFAULT 0,
    successful_exits INT DEFAULT 0,
    average_investment_size DECIMAL(15,2) DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for investors table
CREATE INDEX idx_investors_email ON investors(email);
CREATE INDEX idx_investors_is_active ON investors(is_active);
CREATE INDEX idx_investors_is_verified ON investors(is_verified);
CREATE INDEX idx_investors_firm ON investors(firm);

-- =====================================================
-- 7. INVESTOR PORTFOLIO TABLE
-- =====================================================
CREATE TABLE investor_portfolio (
    id VARCHAR(24) PRIMARY KEY,
    investor_id VARCHAR(24) NOT NULL,
    startup_id VARCHAR(24) NOT NULL,
    investment_amount DECIMAL(15,2) NOT NULL,
    investment_date DATE NOT NULL,
    equity_percentage DECIMAL(5,2),
    status ENUM('active', 'exited', 'written_off') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (investor_id) REFERENCES investors(id) ON DELETE CASCADE,
    FOREIGN KEY (startup_id) REFERENCES startups(id) ON DELETE CASCADE
);

-- Indexes for investor_portfolio table
CREATE INDEX idx_investor_portfolio_investor_id ON investor_portfolio(investor_id);
CREATE INDEX idx_investor_portfolio_startup_id ON investor_portfolio(startup_id);
CREATE INDEX idx_investor_portfolio_status ON investor_portfolio(status);
CREATE INDEX idx_investor_portfolio_investment_date ON investor_portfolio(investment_date);

-- =====================================================
-- 8. MENTORS TABLE
-- =====================================================
CREATE TABLE mentors (
    id VARCHAR(24) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    experience TEXT NOT NULL,
    bio TEXT NOT NULL,
    profile_picture VARCHAR(500) DEFAULT '',
    rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    user_id VARCHAR(24),
    
    -- Additional mentor information
    phone_number VARCHAR(20),
    linkedin_profile VARCHAR(500),
    website VARCHAR(500),
    location VARCHAR(255),
    
    -- Expertise areas
    expertise JSON, -- Array of strings
    sectors JSON, -- Array of strings
    
    -- Availability
    availability_days JSON, -- Array of strings
    availability_time_slots JSON, -- Array of objects with start/end times
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Mentoring preferences
    max_mentees INT DEFAULT 5 CHECK (max_mentees >= 1 AND max_mentees <= 20),
    preferred_sectors JSON, -- Array of strings
    preferred_stages JSON, -- Array of strings
    meeting_frequency ENUM('weekly', 'bi-weekly', 'monthly') DEFAULT 'monthly',
    
    -- Current mentees
    current_mentees JSON, -- Array of startup IDs
    
    -- Statistics
    total_mentees INT DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    total_sessions INT DEFAULT 0,
    years_of_experience INT DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for mentors table
CREATE INDEX idx_mentors_email ON mentors(email);
CREATE INDEX idx_mentors_is_active ON mentors(is_active);
CREATE INDEX idx_mentors_is_verified ON mentors(is_verified);
CREATE INDEX idx_mentors_rating ON mentors(rating DESC);

-- =====================================================
-- 9. EVENTS TABLE
-- =====================================================
CREATE TABLE events (
    id VARCHAR(24) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    location VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    organized_by VARCHAR(255) NOT NULL,
    registration_link VARCHAR(500),
    online_event_url VARCHAR(500),
    user_id VARCHAR(24) NOT NULL,
    
    -- Additional event information
    image VARCHAR(500),
    max_attendees INT CHECK (max_attendees >= 1),
    current_attendees INT DEFAULT 0 CHECK (current_attendees >= 0),
    price DECIMAL(10,2) CHECK (price >= 0),
    is_free BOOLEAN DEFAULT TRUE,
    
    -- Event details
    event_type ENUM('workshop', 'seminar', 'networking', 'pitch', 'demo', 'other') NOT NULL,
    duration INT NOT NULL CHECK (duration >= 15), -- in minutes
    requirements JSON, -- Array of strings
    materials JSON, -- Array of strings
    
    -- Registration
    registration_required BOOLEAN DEFAULT TRUE,
    registration_deadline TIMESTAMP,
    attendees JSON, -- Array of user IDs
    
    -- Status
    status ENUM('draft', 'published', 'cancelled', 'completed') DEFAULT 'draft',
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Tags and keywords
    tags JSON, -- Array of strings
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for events table
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_is_active ON events(is_active);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_user_id ON events(user_id);

-- =====================================================
-- 10. DOCUMENTS TABLE
-- =====================================================
CREATE TABLE documents (
    id VARCHAR(24) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(500) NOT NULL,
    owner VARCHAR(255) NOT NULL,
    file_size VARCHAR(20) NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    type VARCHAR(100) NOT NULL,
    user_id VARCHAR(24) NOT NULL,
    
    -- Additional document information
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    description TEXT,
    category ENUM('profile', 'startup', 'pitch_deck', 'financial', 'legal', 'other') NOT NULL,
    
    -- Access control
    is_public BOOLEAN DEFAULT FALSE,
    allowed_users JSON, -- Array of user IDs
    
    -- Document metadata
    metadata_pages INT,
    metadata_version VARCHAR(50),
    metadata_checksum VARCHAR(255),
    metadata_last_modified TIMESTAMP,
    
    -- Status
    status ENUM('uploading', 'processing', 'ready', 'error') DEFAULT 'uploading',
    error_message TEXT,
    
    -- Tags and keywords
    tags JSON, -- Array of strings
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for documents table
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_is_public ON documents(is_public);
CREATE INDEX idx_documents_upload_date ON documents(upload_date DESC);

-- =====================================================
-- 11. REPORTS TABLE
-- =====================================================
CREATE TABLE reports (
    id VARCHAR(24) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    date_generated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    file_size VARCHAR(20) DEFAULT '0 B',
    status ENUM('ready', 'processing', 'error') DEFAULT 'processing',
    user_id VARCHAR(24) NOT NULL,
    
    -- Additional report information
    description TEXT,
    parameters JSON DEFAULT '{}',
    
    -- File information
    file_path VARCHAR(500),
    file_name VARCHAR(255),
    mime_type VARCHAR(100),
    
    -- Report configuration
    report_format ENUM('pdf', 'excel', 'csv', 'json') DEFAULT 'pdf',
    template VARCHAR(255),
    filters JSON DEFAULT '{}',
    date_range_start DATE,
    date_range_end DATE,
    
    -- Processing information
    processing_started_at TIMESTAMP,
    processing_completed_at TIMESTAMP,
    processing_error_message TEXT,
    retry_count INT DEFAULT 0,
    
    -- Access control
    is_public BOOLEAN DEFAULT FALSE,
    allowed_users JSON, -- Array of user IDs
    
    -- Tags and keywords
    tags JSON, -- Array of strings
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for reports table
CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_type ON reports(type);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_date_generated ON reports(date_generated DESC);
CREATE INDEX idx_reports_is_public ON reports(is_public);

-- =====================================================
-- SAMPLE DATA INSERTION QUERIES
-- =====================================================

-- Insert sample admin user
INSERT INTO users (id, full_name, email, username, password, role, profile_complete, is_email_verified) 
VALUES ('507f1f77bcf86cd799439011', 'Admin User', 'admin@citbif.com', 'admin', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8J8J8J8', 'admin', TRUE, TRUE);

-- Insert sample individual user
INSERT INTO users (id, full_name, email, username, password, role, profile_complete, is_email_verified) 
VALUES ('507f1f77bcf86cd799439012', 'John Doe', 'john.doe@example.com', 'johndoe', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8J8J8J8', 'individual', FALSE, TRUE);

-- Insert sample enterprise user
INSERT INTO users (id, full_name, email, username, password, role, profile_complete, is_email_verified) 
VALUES ('507f1f77bcf86cd799439013', 'Jane Smith', 'jane.smith@startup.com', 'janesmith', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8J8J8J8', 'enterprise', FALSE, TRUE);

-- Insert sample profile
INSERT INTO profiles (id, user_id, full_name, email, phone_number, location, startup_name, entity_type, application_type, founder_name, sector, aadhaar_doc, funding_stage, is_complete, completion_percentage) 
VALUES ('507f1f77bcf86cd799439014', '507f1f77bcf86cd799439012', 'John Doe', 'john.doe@example.com', '+1234567890', 'New York, USA', 'TechStart Inc', 'Private Limited', 'innovation', 'John Doe', 'Technology', 'aadhaar_doc_path', 'Seed', TRUE, 100);

-- Insert sample startup
INSERT INTO startups (id, name, founder, sector, type, status, trl_level, email, user_id, profile_id, description, team_size, founded_year, location, application_status) 
VALUES ('507f1f77bcf86cd799439015', 'TechStart Inc', 'John Doe', 'Technology', 'innovation', 'active', 5, 'john.doe@example.com', '507f1f77bcf86cd799439012', '507f1f77bcf86cd799439014', 'A revolutionary tech startup', 5, 2023, 'New York, USA', 'approved');

-- Insert sample investor
INSERT INTO investors (id, name, firm, email, phone_number, investment_range, focus_areas, background_summary, is_active, is_verified) 
VALUES ('507f1f77bcf86cd799439016', 'Alice Johnson', 'Venture Capital Partners', 'alice@vcpartners.com', '+1987654321', '$100K - $1M', '["Technology", "AI", "Fintech"]', 'Experienced venture capitalist with 10+ years in tech investments', TRUE, TRUE);

-- Insert sample mentor
INSERT INTO mentors (id, name, role, email, experience, bio, rating, is_active, is_verified, expertise, sectors) 
VALUES ('507f1f77bcf86cd799439017', 'Bob Wilson', 'CTO', 'bob@mentor.com', '15+ years in software development', 'Experienced CTO and startup advisor', 4.5, TRUE, TRUE, '["Software Development", "Product Management"]', '["Technology", "SaaS"]');

-- Insert sample event
INSERT INTO events (id, title, description, date, time, location, category, organized_by, user_id, event_type, duration, is_free, status, is_active) 
VALUES ('507f1f77bcf86cd799439018', 'Startup Pitch Event', 'Monthly startup pitch event for entrepreneurs', '2024-02-15', '18:00:00', 'Conference Center, New York', 'Networking', 'CIBTIF', '507f1f77bcf86cd799439011', 'pitch', 120, TRUE, 'published', TRUE);

-- =====================================================
-- USEFUL QUERY EXAMPLES
-- =====================================================

-- Get all active startups with their profiles
SELECT s.*, p.startup_name, p.sector, p.funding_stage 
FROM startups s 
LEFT JOIN profiles p ON s.profile_id = p.id 
WHERE s.status = 'active';

-- Get all investors with their portfolio count
SELECT i.*, COUNT(ip.id) as portfolio_count 
FROM investors i 
LEFT JOIN investor_portfolio ip ON i.id = ip.investor_id 
WHERE i.is_active = TRUE 
GROUP BY i.id;

-- Get all mentors with their current mentee count
SELECT m.*, JSON_LENGTH(m.current_mentees) as current_mentee_count 
FROM mentors m 
WHERE m.is_active = TRUE;

-- Get upcoming events
SELECT * FROM events 
WHERE date >= CURDATE() 
AND status = 'published' 
AND is_active = TRUE 
ORDER BY date ASC;

-- Get startup funding history
SELECT s.name as startup_name, sfh.amount, sfh.source, sfh.date, sfh.stage 
FROM startup_funding_history sfh 
JOIN startups s ON sfh.startup_id = s.id 
ORDER BY sfh.date DESC;

-- Get documents by category
SELECT d.*, u.full_name as owner_name 
FROM documents d 
JOIN users u ON d.user_id = u.id 
WHERE d.category = 'pitch_deck' 
AND d.status = 'ready';

-- Get reports by user
SELECT r.*, u.full_name as user_name 
FROM reports r 
JOIN users u ON r.user_id = u.id 
WHERE r.user_id = '507f1f77bcf86cd799439012' 
ORDER BY r.date_generated DESC;

-- =====================================================
-- MONGODB COLLECTION CREATION QUERIES
-- =====================================================
-- These are the actual MongoDB commands you would use
-- since your application uses MongoDB with Mongoose

/*
// Create collections (MongoDB will create them automatically when you insert data)
// But you can also create them explicitly:

// Create users collection
db.createCollection("users")

// Create profiles collection  
db.createCollection("profiles")

// Create startups collection
db.createCollection("startups")

// Create investors collection
db.createCollection("investors")

// Create mentors collection
db.createCollection("mentors")

// Create events collection
db.createCollection("events")

// Create documents collection
db.createCollection("documents")

// Create reports collection
db.createCollection("reports")

// Create indexes for better performance
db.users.createIndex({ "email": 1 })
db.users.createIndex({ "username": 1 })
db.users.createIndex({ "role": 1 })

db.profiles.createIndex({ "userId": 1 })
db.profiles.createIndex({ "applicationType": 1 })
db.profiles.createIndex({ "sector": 1 })

db.startups.createIndex({ "userId": 1 })
db.startups.createIndex({ "status": 1 })
db.startups.createIndex({ "type": 1 })
db.startups.createIndex({ "sector": 1 })
db.startups.createIndex({ "applicationStatus": 1 })

db.investors.createIndex({ "email": 1 })
db.investors.createIndex({ "isActive": 1 })
db.investors.createIndex({ "isVerified": 1 })

db.mentors.createIndex({ "email": 1 })
db.mentors.createIndex({ "isActive": 1 })
db.mentors.createIndex({ "rating": -1 })

db.events.createIndex({ "date": 1 })
db.events.createIndex({ "status": 1 })
db.events.createIndex({ "isActive": 1 })

db.documents.createIndex({ "userId": 1 })
db.documents.createIndex({ "category": 1 })
db.documents.createIndex({ "status": 1 })

db.reports.createIndex({ "userId": 1 })
db.reports.createIndex({ "type": 1 })
db.reports.createIndex({ "status": 1 })
*/
