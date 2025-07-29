GuardianSense Security Checklist
This document outlines the security measures and compliance policies implemented in GuardianSense to ensure the protection of user data, adherence to privacy regulations (GDPR, COPPA), and robust system security. It addresses encryption, authentication, data retention, and other critical security practices.

🔒 Authentication Security

Secure Cookies:
Cookies are configured with secure=true to ensure transmission only over HTTPS.
SameSite=Lax is enforced to mitigate Cross-Site Request Forgery (CSRF) attacks.

Rate-Limiting:
Authentication routes (/login, /signup) are rate-limited to prevent brute-force attacks.
Configured using Express middleware (e.g., express-rate-limit) with a limit of 100 requests per 15 minutes per IP.

Helmet Middleware:
Express Helmet is used to set secure HTTP headers, including:
Content-Security-Policy to restrict resource loading.
X-Frame-Options: DENY to prevent clickjacking.
X-XSS-Protection to enable browser XSS filtering.
Strict-Transport-Security to enforce HTTPS with a max-age of 1 year.


🛡️ Encryption

Data in Transit:
All API endpoints and WebSocket communications (via Socket.IO) are served over HTTPS/TLS (v1.2 or higher).
TLS certificates are managed using a trusted Certificate Authority (e.g., Let’s Encrypt).


Data at Rest:
Passwords are hashed using bcrypt with a minimum work factor of 12.


📊 Data Retention Policies

Retention Period:
Location data (raw and fused tracks) is retained for 30 days to support analytics and safety narration, then automatically deleted.
User account data (e.g., parent profiles, settings) is retained until explicit deletion by the user or after 12 months of inactivity.
Safety alerts and narration logs are retained for 7 days for audit purposes.


Data Deletion:
Users can request data deletion via the /settings page, triggering a cascade delete in PostgreSQL and Redis.
Automated cron jobs purge expired data per the retention policy.


Backup Policy:
Encrypted backups of PostgreSQL are stored for 14 days, with access restricted to authorized administrators.
Backups are encrypted with AES-256 and stored in a secure, access-controlled environment.




🧑‍⚖️ GDPR Compliance

Lawful Basis:
Data processing is based on explicit user consent, obtained during signup and configurable via the /settings page.


User Rights:
Right to Rectification: Users can update their profile and preferences through the UI.


Data Minimization:
Only essential data (e.g., lat, lon, accuracy, user preferences) is collected.
Sensor data (e.g., wifiRtt, bleBeacons) is validated and sanitized to reject out-of-range or malformed inputs.


Breach Notification:
In case of a data breach, affected users and regulators are notified within 72 hours, as required by GDPR.




🧒 COPPA Compliance

Parental Consent:
For users under 13, explicit parental consent is required during signup, verified via email confirmation.
Consent can be revoked via the /settings page, triggering immediate data deletion for the child’s records.


Child Data Protection:
Child location and behavioral data (e.g., lat, lon, accel) are anonymized where possible and stored separately from identifiable parent data.
Access to child data is restricted to authenticated parents via WebSocket rooms (parent_<id>).


No Targeted Advertising:
GuardianSense does not use child data for advertising or share it with third parties, except as required by law.


Clear Privacy Notices:
A child-friendly privacy notice is provided during onboarding, accessible via the UI.




🧪 Data Processing & Validation

Input Validation:
The /child/location-update endpoint validates sensor data (lat, lon, floor, accuracy, wifiRtt, bleBeacons, accel, baro) for correct types and ranges.
Invalid or out-of-range inputs are rejected with a 400 Bad Request response.


Safety Narration:
The narration microservice uses Gemini function-calling to enforce structured JSON output (risk_level, recommended_action, nearest_exit, priority), stripping unnecessary tokens.
Latency is monitored, with a fallback to default responses if processing exceeds 400ms.


Dynamic Risk Detection:
Novelty detection (Mahalanobis distance model) is trained per child to identify unfamiliar locations, with risk alerts triggered when the distance exceeds a threshold.



🧪 Testing & Auditing

Unit Tests:
Backend APIs are tested with Jest and Supertest, covering authentication, location updates, and safety alerts.
Tests validate input sanitization and error handling.


UI Tests:
Cypress tests cover critical frontend flows (e.g., login, settings, map updates, alert display).


Validation Script:
validate.js simulates indoor/outdoor location traces, computes MAE, and evaluates alert precision/recall.


Security Audits:
Regular scans for vulnerabilities in dependencies (e.g., using npm audit).
Penetration testing conducted quarterly to identify and address potential weaknesses.




📜 Additional Notes

Third-Party Services:
LocationIQ (or equivalent map service) API calls are secured with API tokens stored in .env.
Redis and PostgreSQL instances are hosted in isolated VPCs with restricted network access.


Incident Response:
An incident response plan is in place, with logs stored for 90 days to support forensic analysis.


User Education:
The /settings page includes links to privacy policies and FAQs to inform users about data usage and rights.



This checklist ensures that GuardianSense maintains a high standard of security and compliance, protecting both parent and child data while adhering to regulatory requirements.