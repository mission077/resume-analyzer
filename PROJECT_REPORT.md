# Project Report: Resumize

## Project Name and Team

**Team name:** Trinity

**Project name:** Resumize

---

## Project Description

**Resumize** is an AI-powered web application designed to help job seekers optimize their resumes for specific job applications. The platform combines advanced document processing, artificial intelligence analysis, and professional resume generation to provide users with actionable insights and improved resume formats.

### Main Features

1. **Resume Upload and Analysis**
   - Supports PDF and DOCX file formats
   - Automatic text extraction using MarkItDown (PDF) and mammoth (DOCX) libraries
   - AI-powered analysis comparing resumes against specific job descriptions

2. **Comprehensive AI Analysis**
   - ATS (Applicant Tracking System) score calculation
   - Overall resume quality score (0-100)
   - Identification of strengths and gaps in the resume
   - Section-by-section feedback with specific recommendations
   - Skills matching analysis
   - Actionable improvement suggestions

3. **Resume Generation**
   - Professional LaTeX-based resume template generation
   - Automatic formatting and structure optimization
   - PDF output for easy sharing and printing

4. **User Dashboard**
   - History tracking of all resume analyses
   - Comparison of multiple analyses over time
   - Performance metrics and score trends
   - Easy access to previous analyses and generated resumes

5. **User Authentication and Data Management**
   - Secure user registration and login system
   - JWT-based authentication
   - Encrypted password storage using bcrypt
   - User-specific data isolation

### Target Audience

- **Job Seekers**: Individuals actively applying for positions who want to optimize their resumes for specific job postings
- **Career Changers**: Professionals transitioning between industries who need to reframe their experience
- **Recent Graduates**: Entry-level candidates who need guidance on resume structure and content
- **Professionals**: Experienced workers looking to improve their resume presentation and ATS compatibility

---

## Technical Details

### Technologies Utilized

#### Programming Languages
- **TypeScript**: Primary language for the Next.js application, providing type safety and improved developer experience
- **JavaScript**: Used in React components and client-side logic
- **Python 3.12**: Used for backend microservices (LaTeX compiler and MarkItDown API)
- **SQL**: Database schema design and queries

#### Frameworks and Libraries

**Frontend:**
- **Next.js 15**: React framework with App Router for server-side rendering and API routes
- **React 19**: UI library for building interactive components
- **TailwindCSS 4**: Utility-first CSS framework for responsive design
- **React Dropzone**: File upload component with drag-and-drop support

**Backend:**
- **FastAPI**: Python web framework for microservices (LaTeX compiler and MarkItDown API)
- **Next.js API Routes**: Server-side endpoints for business logic
- **Jinja2**: Python templating engine for LaTeX template injection

**Database:**
- **PostgreSQL 13**: Relational database for user data and analysis storage
- **pg (node-postgres)**: PostgreSQL client for Node.js

**Authentication:**
- **JWT (JSON Web Tokens)**: Token-based authentication using `jsonwebtoken` and `jose` libraries
- **bcryptjs**: Password hashing and verification

**AI/ML:**
- **Google Gemini AI**: Large language model for resume analysis and text parsing
- **Anthropic Claude API**: Alternative AI provider (configured but primarily using Gemini)

**Document Processing:**
- **MarkItDown**: Microsoft's document conversion library for PDF to text conversion
- **mammoth**: JavaScript library for DOCX to text conversion
- **LaTeX/pdflatex**: Professional typesetting system for resume generation

**DevOps and Deployment:**
- **Docker & Docker Compose**: Containerization for multi-service deployment
- **Git**: Version control system
- **Node.js**: Runtime environment for the Next.js application

### Demonstration of Required Skills

#### Algorithms & Data Structures

1. **String Processing Algorithms**:
   - Text extraction and parsing from PDF/DOCX files
   - JSON parsing with error recovery (`lib/llmParser.ts` - `extractJsonFromText()` function)
   - Regular expression matching for pattern extraction in resume text

2. **Data Structures**:
   - **Hash Maps/Objects**: Used extensively for storing resume data (personal info, experiences, skills as key-value pairs)
   - **Arrays**: For storing lists (education, experiences, projects, certifications)
   - **Trees**: JSON structures representing nested resume data
   - **Graphs**: Database relationships (users → analyses → resumes)

3. **Search and Matching Algorithms**:
   - Skills matching algorithm comparing resume skills against job requirements
   - Keyword extraction and frequency analysis for ATS scoring

#### Concurrency (Threads)

1. **Asynchronous Processing**:
   - Node.js event loop for handling multiple concurrent API requests
   - Async/await patterns throughout the codebase for non-blocking I/O operations
   - Promise-based concurrent API calls (e.g., simultaneous text extraction and analysis preparation)

2. **Python Threading**:
   - FastAPI's async request handling for concurrent document processing
   - Background task processing for LaTeX compilation

3. **Database Connection Pooling**:
   - PostgreSQL connection pool management for handling multiple simultaneous database queries
   - Concurrent user session management

#### Networking (Sockets)

1. **HTTP/HTTPS Communication**:
   - RESTful API design with Next.js API routes (`/api/resume/extract`, `/api/resume/analyze`)
   - HTTP client-server architecture between frontend and backend
   - Inter-service communication via HTTP (Next.js app ↔ FastAPI services)

2. **WebSocket Potential**:
   - Architecture supports real-time updates (can be extended for live analysis progress)
   - Current implementation uses polling/HTTP for status updates

3. **Network Protocols**:
   - TCP/IP for database connections (PostgreSQL)
   - HTTP for external API calls (Google Gemini AI, Anthropic Claude)

#### Scheduling (Operating Systems)

1. **Process Scheduling**:
   - Docker container orchestration managing multiple services (app, postgres, latex-compiler, markitdown-api)
   - Service dependency management in docker-compose (health checks, startup order)

2. **Task Scheduling**:
   - Database trigger-based automatic timestamp updates (`update_updated_at_column()` function)
   - Scheduled cleanup tasks (can be extended for session management)

3. **Resource Management**:
   - Memory management for file uploads (temporary file handling)
   - CPU scheduling for LaTeX compilation processes

#### Software Design

1. **Service Layer Architecture**:
   - Separation of concerns: API routes (controllers), services (business logic), utilities (pure functions)
   - Modular design with clear boundaries between file extraction, analysis, and generation services

2. **Design Principles**:
   - **DRY (Don't Repeat Yourself)**: Unified file extraction interface for PDF and DOCX
   - **Single Responsibility**: Each service handles one specific task
   - **Dependency Injection**: Services are imported and used rather than tightly coupled

3. **Architecture Patterns**:
   - **Microservices**: Separate services for LaTeX compilation and PDF parsing
   - **RESTful API**: Standard HTTP methods and status codes
   - **MVC-like Structure**: Models (database schemas), Views (React components), Controllers (API routes)

#### Object-Oriented Design Patterns

1. **Factory Pattern**:
   - File extractor factory (`services/fileExtraction/index.ts`) that returns appropriate extractor based on file type

2. **Strategy Pattern**:
   - Different extraction strategies for PDF vs DOCX files
   - Multiple AI provider support (Gemini, Claude) with interchangeable interfaces

3. **Repository Pattern**:
   - Database access abstraction through API routes
   - Data access layer separation from business logic

4. **Singleton Pattern**:
   - Database connection pool (single instance shared across requests)
   - Configuration management (environment variables)

5. **Observer Pattern**:
   - React's state management and component re-rendering
   - Event-driven architecture for file uploads and form submissions

#### Complexity Analysis (Big O)

1. **Time Complexity**:
   - **Text Extraction**: O(n) where n is the file size - linear scan through document
   - **JSON Parsing**: O(n) where n is response length - single pass through text
   - **Database Queries**: 
     - User lookup by email: O(log n) with indexed email column
     - Analysis retrieval: O(log n) with indexed user_id and created_at
   - **Resume Analysis**: O(n) where n is resume text length - processed by AI model
   - **LaTeX Compilation**: O(n) where n is template complexity

2. **Space Complexity**:
   - **File Storage**: O(n) where n is file size - temporary storage during processing
   - **Database**: O(n) where n is number of users/analyses - linear growth
   - **Memory**: O(n) for resume text and analysis results in memory

3. **Optimization Techniques**:
   - Database indexes on frequently queried columns (email, user_id, created_at)
   - Connection pooling to reduce connection overhead
   - Efficient JSON parsing with error recovery to avoid re-processing

#### Database

1. **Database Design**:
   - **Relational Model**: Normalized schema with foreign key relationships
   - **Tables**: 
     - `users`: User authentication and profile data
     - `resume_analyses`: Analysis results and metadata
     - `resumes`: Generated resume data (if implemented)
   - **Indexes**: Created on email, user_id, created_at for query optimization
   - **Constraints**: Foreign keys, check constraints, unique constraints

2. **Database Features**:
   - **Triggers**: Automatic timestamp updates on record modification
   - **JSONB**: Storage of flexible analysis data (strengths, gaps, recommendations)
   - **Transactions**: ACID compliance for data integrity
   - **Cascading Deletes**: Automatic cleanup of related records

3. **Query Optimization**:
   - Indexed lookups for user authentication
   - Efficient joins for retrieving user analyses
   - Pagination support for large result sets

#### User Interface

1. **Frontend Technologies**:
   - **React**: Component-based UI architecture
   - **Next.js**: Server-side rendering for improved performance
   - **TailwindCSS**: Utility-first styling for responsive design
   - **TypeScript**: Type-safe component development

2. **UI/UX Features**:
   - Responsive design (mobile, tablet, desktop)
   - Drag-and-drop file upload
   - Real-time form validation
   - Loading states and progress indicators
   - Modal dialogs for confirmations
   - Toast notifications for user feedback
   - Smooth scrolling and animations

3. **Accessibility**:
   - Semantic HTML elements
   - ARIA labels where appropriate
   - Keyboard navigation support
   - Focus management in modals

#### Distributed Systems

1. **Microservices Architecture**:
   - **Next.js App Service**: Main application and API gateway
   - **PostgreSQL Service**: Centralized database
   - **LaTeX Compiler Service**: Isolated resume generation service
   - **MarkItDown API Service**: Document processing service

2. **Service Communication**:
   - HTTP-based inter-service communication
   - Docker networking for service discovery
   - Environment variable configuration for service URLs

3. **Scalability Considerations**:
   - Stateless API design (JWT tokens for authentication)
   - Horizontal scaling capability (multiple app instances)
   - Database connection pooling
   - Containerized deployment for easy scaling

4. **Distributed System Patterns**:
   - **API Gateway Pattern**: Next.js routes as entry point
   - **Service Discovery**: Docker Compose networking
   - **Load Balancing**: Can be extended with reverse proxy (nginx)

---

## Ethics, Privacy and Legal Impacts

### Ethical Concerns

1. **AI Bias and Fairness**:
   - **Concern**: AI models may perpetuate biases in hiring practices, potentially disadvantaging certain groups based on resume content analysis.
   - **Mitigation**: We use Google Gemini AI, which has been trained with bias mitigation efforts. However, we acknowledge that no AI system is perfect and recommend users review AI suggestions critically.

2. **Job Market Impact**:
   - **Concern**: Widespread use of resume optimization tools could lead to "resume inflation" where all candidates appear similarly qualified, making genuine differentiation difficult.
   - **Mitigation**: Our tool focuses on honest optimization and highlighting genuine strengths rather than fabricating qualifications.

3. **Accessibility and Equity**:
   - **Concern**: The tool requires internet access and may have costs associated with AI API usage, potentially limiting access for underprivileged job seekers.
   - **Current Status**: Currently free for users, but future monetization could create access barriers.

### Privacy and Data Protection

1. **Information Collection**:
   - **User Data**: Email addresses, hashed passwords, names (optional)
   - **Resume Data**: Uploaded resume files, extracted text, job descriptions, company names
   - **Analysis Data**: AI-generated analysis results, scores, recommendations
   - **Usage Data**: Analysis history, timestamps, file names

2. **Data Protection Measures**:
   - **Password Security**: Passwords are hashed using bcrypt with salt rounds, never stored in plain text
   - **Authentication**: JWT tokens with expiration (7 days) and httpOnly cookies to prevent XSS attacks
   - **Database Security**: 
     - Environment variables for sensitive credentials
     - SQL injection prevention through parameterized queries (pg library)
     - User data isolation through user_id foreign keys
   - **File Handling**: Temporary file storage with cleanup after processing
   - **HTTPS**: Recommended for production deployment (secure flag in cookies)

3. **Data Retention**:
   - User data is retained as long as the account exists
   - Users can delete their analyses, which removes associated data
   - Database cascading deletes ensure related data is removed

4. **Third-Party Services**:
   - **Google Gemini AI**: Resume text and job descriptions are sent to Google's API for analysis. Users should be aware of Google's privacy policy.
   - **Future Consideration**: Privacy policy and terms of service should be added to inform users about data sharing with third parties.

### Legal Issues

1. **Intellectual Property**:
   - **User Content**: Users retain ownership of their resume content
   - **Generated Content**: LaTeX templates and formatting are our intellectual property
   - **AI-Generated Analysis**: Ownership of AI-generated recommendations may be unclear; we claim no ownership of user's original content

2. **Data Privacy Regulations**:
   - **GDPR Compliance** (if serving EU users):
     - Right to access: Users can view their stored data
     - Right to deletion: Users can delete their accounts and data
     - Data portability: Can be implemented to export user data
     - **Current Gap**: No explicit GDPR compliance features implemented yet
   - **CCPA Compliance** (if serving California users):
     - Similar rights to access and deletion
     - **Current Gap**: No explicit CCPA compliance features

3. **Liability**:
   - **AI Recommendations**: We cannot guarantee job placement or interview success
   - **Data Loss**: While we implement backups, we cannot guarantee 100% data availability
   - **Service Availability**: No SLA currently provided
   - **Recommendation**: Terms of service and disclaimer should be added

4. **Commercialization Considerations**:
   - **API Rate Limits**: Google Gemini API has usage limits and costs
   - **Scalability Costs**: Database and hosting costs increase with user base
   - **Monetization**: If commercialized, subscription model would need clear pricing and refund policies
   - **Competition**: Similar tools exist (Resume.io, Zety); differentiation is key

5. **Recommendations for Production**:
   - Implement comprehensive privacy policy and terms of service
   - Add user consent checkboxes for data processing
   - Implement data export functionality (GDPR requirement)
   - Add audit logging for security and compliance
   - Regular security audits and penetration testing
   - Consider data encryption at rest for sensitive fields
   - Implement rate limiting to prevent abuse
   - Add content moderation to prevent malicious file uploads

---

## Source Code and Artifacts

### Repository Information

The project source code is hosted on GitHub as a **private repository**. The repository contains:

- Complete Next.js application source code
- Python microservices (LaTeX compiler and MarkItDown API)
- Database migration scripts
- Docker configuration files
- Documentation (README, DATA_FLOW.md)
- Environment variable templates

### Submission Method

**Option 1: GitHub Repository (Recommended)**
- **Repository URL**: [To be provided - currently private]
- **Access**: Repository will be made accessible to course instructors upon request
- **Branch**: Main branch contains the production-ready code

**Option 2: Archive Submission (If GitHub is not preferred)**
- **Archive Format**: `tar.gz` or `zip`
- **Archive Name**: `resumize-trinity-capstone-[date].tar.gz`
- **Contents**:
  - All source code files
  - Configuration files (docker-compose.yml, Dockerfiles, package.json, requirements.txt)
  - Database migration scripts
  - Documentation files
  - `.gitignore` (excluding node_modules, .next, venv, __pycache__, .env files)
- **Estimated Size**: < 50 MB (excluding dependencies)

### Repository Structure

```
resume-analyzer/
├── app/                          # Next.js application
│   ├── (auth)/                  # Authentication pages
│   ├── (dashboard)/             # Dashboard pages
│   ├── (root)/                  # Landing page
│   └── api/                     # API routes
├── components/                  # React components
├── services/                    # Business logic services
│   ├── latex-compiler/         # LaTeX compilation service
│   └── markitdown-api/         # PDF parsing service
├── lib/                         # Utility functions
├── migrations/                  # Database migration scripts
├── docker-compose.yml           # Multi-service orchestration
├── Dockerfile                   # Next.js app containerization
├── README.md                    # Project documentation
└── DATA_FLOW.md                 # Architecture documentation
```

### Build and Run Instructions

Detailed setup instructions are provided in the `README.md` file. The project can be run using:

1. **Docker Compose** (Recommended for full stack):
   ```bash
   docker-compose up --build
   ```

2. **Local Development**:
   - Start PostgreSQL database
   - Start Python services (LaTeX compiler, MarkItDown API)
   - Run Next.js dev server: `npm run dev`

### Dependencies

All dependencies are specified in:
- `package.json` (Node.js/TypeScript dependencies)
- `services/latex-compiler/requirements.txt` (Python dependencies)
- `services/markitdown-api/requirements.txt` (Python dependencies)

### Environment Variables

A `.env.example` file (or documentation) should be provided with required environment variables:
- Database credentials
- JWT secret
- AI API keys (Google Gemini, Anthropic)
- Service URLs

---

## Conclusion

Resumize demonstrates a comprehensive full-stack web application with modern technologies, distributed architecture, and AI integration. The project showcases skills in software engineering, database design, user interface development, and ethical software development practices. The modular architecture allows for future enhancements and scalability, while the containerized deployment ensures consistent environments across development and production.

