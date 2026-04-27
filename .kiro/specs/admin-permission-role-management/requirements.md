# Requirements Document

## Introduction

This document specifies the requirements for the Admin Permission and Role Management feature in the Corporate Finance Dashboard (CFD). The feature enables system administrators to manage permissions, roles, and role-permission mappings through dedicated CRUD interfaces, as well as refactor and finalize existing admin menu components (User Management, Dashboard Threshold, and Audit Log) to align with the current database structure and UI standards.

## Glossary

- **Permission_Manager**: The UI component for managing permissions (CRUD operations)
- **Role_Manager**: The UI component for managing roles (CRUD operations) with integrated role-permission mapping
- **User_Manager**: The refactored UI component for managing users and their corporate access
- **User_Profile_Page**: The page where users can view and edit their own profile information
- **User_Menu**: The dropdown menu in the header showing user avatar, name, role, and access information
- **Activation_Page**: The public page where new users set their initial password
- **Password_Reset_Page**: The public page where users can reset their password using a token
- **Threshold_Manager**: The finalized UI component for managing dashboard thresholds
- **Audit_Log_Viewer**: The finalized UI component for viewing audit logs
- **Permission_API**: The backend API endpoints for permission management
- **Role_API**: The backend API endpoints for role management
- **Role_Permission_API**: The backend API endpoints for role-permission mapping (integrated with Role_API)
- **System**: The Corporate Finance Dashboard application
- **Admin_User**: A user with appropriate admin permissions
- **Email_Service**: The service responsible for sending activation and password reset emails
- **Reset_Token**: A secure, time-limited token used for password reset verification
- **Activation_Token**: A secure, time-limited token used for account activation
- **Database**: The PostgreSQL database with tables `permissions`, `roles`, `role_permissions`, `users`, `user_corporate_accesses`, and `audit_logs`
- **Password_Strength**: A measure of password security based on length, complexity, and character variety

## Requirements

### Requirement 1: Permission Management API

**User Story:** As an Admin_User, I want to manage permissions through API endpoints, so that I can create, read, update, and delete permission records programmatically.

#### Acceptance Criteria

1. THE Permission_API SHALL provide an endpoint to list all permissions with filtering by module and active status
2. THE Permission_API SHALL provide an endpoint to retrieve a single permission by ID
3. WHEN creating a permission, THE Permission_API SHALL validate that the key is unique and follows the format `module.resource.action`
4. WHEN creating a permission, THE Permission_API SHALL require fields: key, module, description, and created_by
5. WHEN updating a permission, THE Permission_API SHALL allow modification of description, metadata, and is_active fields
6. WHEN updating a permission, THE Permission_API SHALL record updated_by and updated_at timestamps
7. THE Permission_API SHALL provide an endpoint to toggle permission active status
8. WHEN any write operation occurs, THE Permission_API SHALL create an audit log entry with entity_type "permission"
9. THE Permission_API SHALL use Zod schema validation for all input data
10. THE Permission_API SHALL return consistent error responses with appropriate HTTP status codes (400, 404, 422, 500)

### Requirement 2: Role Management API

**User Story:** As an Admin_User, I want to manage roles through API endpoints, so that I can create, read, update, and delete role records with proper scope validation.

#### Acceptance Criteria

1. THE Role_API SHALL provide an endpoint to list all roles with filtering by scope and active status
2. THE Role_API SHALL provide an endpoint to retrieve a single role by ID including associated permissions
3. WHEN creating a role, THE Role_API SHALL validate that the name is unique
4. WHEN creating a role, THE Role_API SHALL require fields: name, scope, description, and created_by
5. WHEN creating a role, THE Role_API SHALL validate that scope is one of: "system", "corporate", or "department"
6. WHEN updating a role, THE Role_API SHALL allow modification of name, description, and is_active fields
7. WHEN updating a role, THE Role_API SHALL record updated_by and updated_at timestamps
8. THE Role_API SHALL provide an endpoint to toggle role active status
9. WHEN any write operation occurs, THE Role_API SHALL create an audit log entry with entity_type "role"
10. THE Role_API SHALL use Zod schema validation for all input data
11. THE Role_API SHALL return consistent error responses with appropriate HTTP status codes (400, 404, 422, 500)

### Requirement 3: Role-Permission Mapping API

**User Story:** As an Admin_User, I want to manage role-permission mappings through API endpoints, so that I can assign and revoke permissions for specific roles.

#### Acceptance Criteria

1. THE Role_Permission_API SHALL provide an endpoint to list all permissions assigned to a specific role
2. THE Role_Permission_API SHALL provide an endpoint to assign multiple permissions to a role in a single transaction
3. WHEN assigning permissions, THE Role_Permission_API SHALL validate that both role_id and permission_id exist
4. WHEN assigning permissions, THE Role_Permission_API SHALL prevent duplicate role-permission mappings
5. WHEN assigning permissions, THE Role_Permission_API SHALL record granted_by and created_at fields
6. THE Role_Permission_API SHALL provide an endpoint to revoke a permission from a role
7. WHEN revoking permissions, THE Role_Permission_API SHALL increment authz_version for all users with that role
8. WHEN any write operation occurs, THE Role_Permission_API SHALL create an audit log entry with entity_type "role_permission"
9. THE Role_Permission_API SHALL use Zod schema validation for all input data
10. THE Role_Permission_API SHALL return consistent error responses with appropriate HTTP status codes (400, 404, 422, 500)

### Requirement 4: Permission Manager UI Component

**User Story:** As an Admin_User, I want a UI component to manage permissions, so that I can view, create, edit, and deactivate permissions through a user-friendly interface.

#### Acceptance Criteria

1. THE Permission_Manager SHALL display a table with columns: key, module, description, status, and actions
2. THE Permission_Manager SHALL provide search functionality to filter permissions by key or module
3. THE Permission_Manager SHALL provide a filter dropdown to show all, active, or inactive permissions
4. THE Permission_Manager SHALL implement pagination with configurable page size
5. THE Permission_Manager SHALL display loading skeletons while fetching data
6. WHEN data fetch fails, THE Permission_Manager SHALL display an error message with a retry button
7. THE Permission_Manager SHALL provide a modal form for creating new permissions
8. THE Permission_Manager SHALL provide a modal form for editing existing permissions
9. WHEN creating or editing, THE Permission_Manager SHALL validate input using Zod schema before submission
10. THE Permission_Manager SHALL display toast notifications for success and error states
11. THE Permission_Manager SHALL use i18n files for all text content (no hardcoded strings)
12. THE Permission_Manager SHALL follow the CorporateManager.tsx template for UI consistency
13. THE Permission_Manager SHALL use Tailwind CSS 4 with premium styling (glassmorphism, subtle borders)

### Requirement 5: Role Manager UI Component

**User Story:** As an Admin_User, I want a UI component to manage roles, so that I can view, create, edit, and deactivate roles through a user-friendly interface.

#### Acceptance Criteria

1. THE Role_Manager SHALL display a table with columns: name, scope, description, status, and actions
2. THE Role_Manager SHALL provide search functionality to filter roles by name
3. THE Role_Manager SHALL provide a filter dropdown to show all, active, or inactive roles
4. THE Role_Manager SHALL provide a filter dropdown to filter by scope (system, corporate, department)
5. THE Role_Manager SHALL implement pagination with configurable page size
6. THE Role_Manager SHALL display loading skeletons while fetching data
7. WHEN data fetch fails, THE Role_Manager SHALL display an error message with a retry button
8. THE Role_Manager SHALL provide a modal form for creating new roles
9. THE Role_Manager SHALL provide a modal form for editing existing roles
10. WHEN creating or editing, THE Role_Manager SHALL validate input using Zod schema before submission
11. THE Role_Manager SHALL display toast notifications for success and error states
12. THE Role_Manager SHALL use i18n files for all text content (no hardcoded strings)
13. THE Role_Manager SHALL follow the CorporateManager.tsx template for UI consistency
14. THE Role_Manager SHALL use Tailwind CSS 4 with premium styling (glassmorphism, subtle borders)

### Requirement 6: Role Manager with Integrated Permission Mapping

**User Story:** As an Admin_User, I want a UI component to manage roles and their permissions in one place, so that I can efficiently configure role-based access control.

#### Acceptance Criteria

1. THE Role_Manager SHALL display a table with columns: name, scope, description, assigned permissions count, status, and actions
2. THE Role_Manager SHALL provide search functionality to filter roles by name
3. THE Role_Manager SHALL provide a filter dropdown to show all, active, or inactive roles
4. THE Role_Manager SHALL provide a filter dropdown to filter by scope (system, corporate, department)
5. THE Role_Manager SHALL implement pagination with configurable page size
6. THE Role_Manager SHALL display loading skeletons while fetching data
7. WHEN data fetch fails, THE Role_Manager SHALL display an error message with a retry button
8. THE Role_Manager SHALL provide a modal form for creating new roles
9. THE Role_Manager SHALL provide a modal form for editing existing roles
10. THE Role_Manager SHALL provide a "Manage Permissions" action button for each role
11. WHEN "Manage Permissions" is clicked, THE Role_Manager SHALL open a modal displaying all available permissions grouped by module
12. THE Role_Manager SHALL display checkboxes for each permission indicating assignment status
13. THE Role_Manager SHALL provide a "Select All" and "Deselect All" option per module in the permissions modal
14. WHEN saving permission changes, THE Role_Manager SHALL send only the delta (added/removed permissions)
15. WHEN creating or editing, THE Role_Manager SHALL validate input using Zod schema before submission
16. THE Role_Manager SHALL display toast notifications for success and error states
17. THE Role_Manager SHALL use i18n files for all text content (no hardcoded strings)
18. THE Role_Manager SHALL follow the CorporateManager.tsx template for UI consistency
19. THE Role_Manager SHALL use Tailwind CSS 4 with premium styling (glassmorphism, subtle borders)

### Requirement 7: User Manager without Password Input

**User Story:** As an Admin_User, I want the User Manager component to handle user creation and management without password input, so that security is enhanced through email-based activation.

#### Acceptance Criteria

1. THE User_Manager SHALL display a table with columns: username, email, full_name, email_verified status, account status, and actions
2. THE User_Manager SHALL provide search functionality to filter users by username or email
3. THE User_Manager SHALL provide a filter dropdown to show all, active, or inactive users
4. THE User_Manager SHALL provide a filter dropdown to show all, verified, or unverified email status
5. THE User_Manager SHALL implement pagination with configurable page size
6. THE User_Manager SHALL display loading skeletons while fetching data
7. WHEN data fetch fails, THE User_Manager SHALL display an error message with a retry button
8. THE User_Manager SHALL provide a modal form for creating new users with fields: username, email, full_name (NO password field)
9. WHEN creating a user, THE User_Manager SHALL send an activation email to the user's email address
10. THE User_Manager SHALL display a confirmation message after successfully sending the activation email
11. THE User_Manager SHALL provide a modal form for editing existing users (username, email, full_name only)
12. THE User_Manager SHALL provide a "Resend Activation Email" action button for users with unverified email
13. THE User_Manager SHALL provide a "Force Reset Password" action button for verified users
14. WHEN "Force Reset Password" is clicked, THE User_Manager SHALL send a password reset email to the user
15. THE User_Manager SHALL provide a separate modal for managing user corporate access via user_corporate_accesses table
16. WHEN managing corporate access, THE User_Manager SHALL display role, scope, corporate, and department selectors
17. WHEN managing corporate access, THE User_Manager SHALL validate scope constraints (system: no corporate/dept, corporate: corporate only, department: both required)
18. THE User_Manager SHALL provide a toggle button to activate/deactivate users
19. WHEN creating or editing, THE User_Manager SHALL validate input using Zod schema before submission
20. THE User_Manager SHALL display toast notifications for success and error states
21. THE User_Manager SHALL use i18n files for all text content (no hardcoded strings)
22. THE User_Manager SHALL follow the CorporateManager.tsx template for UI consistency
23. THE User_Manager SHALL use Tailwind CSS 4 with premium styling (glassmorphism, subtle borders)

### Requirement 8: User Activation Flow via Email

**User Story:** As a new User, I want to receive an activation email when my account is created, so that I can securely set my initial password.

#### Acceptance Criteria

1. WHEN an admin creates a new user, THE System SHALL generate a secure random activation token
2. THE System SHALL hash the activation token before storing in the database (password_reset_token_hash field, reused for activation)
3. THE System SHALL set token expiration time to 7 days from generation (password_reset_expires_at field)
4. THE System SHALL set the user's is_active status to false until activation is completed
5. THE System SHALL set email_verified field to false
6. THE System SHALL send an activation email to the user's registered email address containing the activation link
7. THE activation email SHALL include: user's name, activation link with token, expiration time, and welcome message
8. THE activation link SHALL follow the format: `{base_url}/activate-account?token={activation_token}`
9. THE System SHALL use a professional email template with company branding
10. THE System SHALL support both Indonesian and English email templates based on system language setting
11. WHEN email sending fails, THE System SHALL return an error to the admin and log the failure
12. WHEN email is sent successfully, THE System SHALL return a success message to the admin
13. THE System SHALL provide an admin action to resend activation email for unverified users
14. THE System SHALL invalidate any previous activation tokens for the user when generating a new one
15. THE System SHALL create an audit log entry with action "send_activation_email" and entity_type "user"

### Requirement 9: Account Activation Page

**User Story:** As a new User, I want a secure page to activate my account and set my initial password, so that I can start using the system.

#### Acceptance Criteria

1. THE Activation_Page SHALL be accessible without authentication at `/activate-account` route
2. THE Activation_Page SHALL extract the activation token from the URL query parameter
3. WHEN the page loads, THE Activation_Page SHALL validate the token with the backend
4. WHEN the token is invalid or expired, THE Activation_Page SHALL display an error message with contact admin option
5. WHEN the token is valid, THE Activation_Page SHALL display an account activation form
6. THE activation form SHALL include: username (read-only), email (read-only), new password field, confirm password field, and submit button
7. THE activation form SHALL display a real-time password strength indicator
8. THE activation form SHALL validate that new password meets minimum strength requirements (at least "good" strength)
9. THE activation form SHALL validate that new password and confirm password match
10. WHEN passwords don't match, THE Activation_Page SHALL display an error message
11. WHEN form is submitted, THE Activation_Page SHALL send the new password and token to the backend
12. WHEN activation is successful, THE Activation_Page SHALL display a success message and redirect to login page after 3 seconds
13. WHEN activation fails, THE Activation_Page SHALL display an error message with retry option
14. THE Activation_Page SHALL use i18n files for all text content (no hardcoded strings)
15. THE Activation_Page SHALL use Tailwind CSS 4 with premium styling matching the login page design
16. THE Activation_Page SHALL be responsive and work on mobile devices

### Requirement 10: Account Activation API

**User Story:** As the System, I want secure API endpoints for account activation flow, so that new users can safely set their initial password.

#### Acceptance Criteria

1. THE System SHALL provide a POST endpoint `/api/auth/send-activation-email` to send/resend activation email
2. THE send-activation-email endpoint SHALL accept user_id as input (called by admin with `cfd.users.write` permission)
3. THE System SHALL provide a POST endpoint `/api/auth/validate-activation-token` to validate an activation token
4. THE validate-activation-token endpoint SHALL be publicly accessible (no authentication required)
5. THE validate-activation-token endpoint SHALL return token validity status and user info (username, email) without exposing sensitive data
6. THE System SHALL provide a POST endpoint `/api/auth/activate-account` to complete account activation
7. THE activate-account endpoint SHALL be publicly accessible (no authentication required)
8. THE activate-account endpoint SHALL accept: activation_token and new_password
9. THE activate-account endpoint SHALL validate the token is not expired and matches the hashed token in database
10. THE activate-account endpoint SHALL validate the new password meets strength requirements
11. WHEN activation is successful, THE System SHALL hash the new password and update the user record
12. WHEN activation is successful, THE System SHALL set is_active to true
13. WHEN activation is successful, THE System SHALL set email_verified to true
14. WHEN activation is successful, THE System SHALL clear the activation token fields (password_reset_token_hash, password_reset_expires_at)
15. WHEN activation is successful, THE System SHALL set password_changed_at timestamp
16. WHEN activation is successful, THE System SHALL create an audit log entry with action "account_activated" and entity_type "user"
17. THE System SHALL implement rate limiting on activation endpoints to prevent abuse (max 5 attempts per hour per IP)
18. THE System SHALL use Zod schema validation for all input data
19. THE System SHALL return consistent error responses with appropriate HTTP status codes

### Requirement 11: Password Reset Flow via Email

**User Story:** As a User, I want to receive a password reset email with a secure link, so that I can reset my password safely without admin intervention.

#### Acceptance Criteria

1. WHEN an admin triggers password reset, THE System SHALL generate a secure random reset token
2. THE System SHALL hash the reset token before storing in the database (password_reset_token_hash field)
3. THE System SHALL set token expiration time to 24 hours from generation (password_reset_expires_at field)
4. THE System SHALL send an email to the user's registered email address containing the reset link
5. THE reset email SHALL include: user's name, reset link with token, expiration time, and security notice
6. THE reset link SHALL follow the format: `{base_url}/reset-password?token={reset_token}`
7. THE System SHALL use a professional email template with company branding
8. THE System SHALL support both Indonesian and English email templates based on user's language preference
9. WHEN email sending fails, THE System SHALL return an error to the admin and log the failure
10. WHEN email is sent successfully, THE System SHALL return a success message to the admin
11. THE System SHALL invalidate any previous reset tokens for the user when generating a new one
12. THE System SHALL create an audit log entry with action "request_password_reset" and entity_type "user"

### Requirement 12: Password Reset Page

**User Story:** As a User, I want a secure page to reset my password using the token from my email, so that I can regain access to my account.

#### Acceptance Criteria

1. THE Password_Reset_Page SHALL be accessible without authentication at `/reset-password` route
2. THE Password_Reset_Page SHALL extract the reset token from the URL query parameter
3. WHEN the page loads, THE Password_Reset_Page SHALL validate the token with the backend
4. WHEN the token is invalid or expired, THE Password_Reset_Page SHALL display an error message with option to request a new reset
5. WHEN the token is valid, THE Password_Reset_Page SHALL display a password reset form
6. THE password reset form SHALL include: new password field, confirm password field, and submit button
7. THE password reset form SHALL display a real-time password strength indicator
8. THE password reset form SHALL validate that new password meets minimum strength requirements (at least "good" strength)
9. THE password reset form SHALL validate that new password and confirm password match
10. WHEN passwords don't match, THE Password_Reset_Page SHALL display an error message
11. WHEN form is submitted, THE Password_Reset_Page SHALL send the new password and token to the backend
12. WHEN reset is successful, THE Password_Reset_Page SHALL display a success message and redirect to login page after 3 seconds
13. WHEN reset fails, THE Password_Reset_Page SHALL display an error message with retry option
14. THE Password_Reset_Page SHALL use i18n files for all text content (no hardcoded strings)
15. THE Password_Reset_Page SHALL use Tailwind CSS 4 with premium styling matching the login page design
16. THE Password_Reset_Page SHALL be responsive and work on mobile devices

### Requirement 13: Password Reset API

**User Story:** As the System, I want secure API endpoints for password reset flow, so that the process is protected against abuse and attacks.

#### Acceptance Criteria

1. THE System SHALL provide a POST endpoint `/api/auth/request-password-reset` to initiate password reset
2. THE request-password-reset endpoint SHALL accept user_id as input (called by admin with `cfd.users.reset_password` permission)
3. THE System SHALL provide a POST endpoint `/api/auth/validate-reset-token` to validate a reset token
4. THE validate-reset-token endpoint SHALL be publicly accessible (no authentication required)
5. THE validate-reset-token endpoint SHALL return token validity status without exposing user information
6. THE System SHALL provide a POST endpoint `/api/auth/reset-password` to complete password reset
7. THE reset-password endpoint SHALL be publicly accessible (no authentication required)
8. THE reset-password endpoint SHALL accept: reset_token and new_password
9. THE reset-password endpoint SHALL validate the token is not expired and matches the hashed token in database
10. THE reset-password endpoint SHALL validate the new password meets strength requirements
11. WHEN password is reset successfully, THE System SHALL hash the new password and update the user record
12. WHEN password is reset successfully, THE System SHALL clear the reset token fields (password_reset_token_hash, password_reset_expires_at)
13. WHEN password is reset successfully, THE System SHALL update password_changed_at timestamp
14. WHEN password is reset successfully, THE System SHALL increment authz_version to invalidate existing sessions
15. WHEN password is reset successfully, THE System SHALL create an audit log entry with action "password_reset_completed" and entity_type "user"
16. THE System SHALL implement rate limiting on reset endpoints to prevent abuse (max 5 attempts per hour per IP)
17. THE System SHALL use Zod schema validation for all input data
18. THE System SHALL return consistent error responses with appropriate HTTP status codes

### Requirement 14: User Menu in Header

**User Story:** As a User, I want a user menu in the header showing my profile information, so that I can quickly access my profile and logout.

#### Acceptance Criteria

1. THE System SHALL display a user menu in the top-right corner of the header
2. THE user menu trigger SHALL display the user's avatar (or initials if no avatar)
3. WHEN clicked, THE user menu SHALL open a dropdown panel
4. THE dropdown panel SHALL display: user avatar, full name, and primary role name only
5. THE dropdown panel SHALL provide a "Profile" menu item that navigates to the user profile page
6. THE dropdown panel SHALL provide a "Logout" menu item that logs the user out
7. THE user menu SHALL remove the user name and role display from the sidebar footer
8. THE user menu SHALL use i18n files for all text content (no hardcoded strings)
9. THE user menu SHALL use Tailwind CSS 4 with premium styling (glassmorphism, subtle borders)
10. THE user menu SHALL be responsive and work on mobile devices
11. THE dropdown panel SHALL close when clicking outside or pressing Escape key

### Requirement 15: User Profile Page

**User Story:** As a User, I want a profile page where I can view and edit my personal information, change my password, and manage my account settings.

#### Acceptance Criteria

1. THE User_Profile_Page SHALL be accessible at `/profile` route (requires authentication)
2. THE User_Profile_Page SHALL display the user's current information: avatar, username, email, full name
3. THE User_Profile_Page SHALL provide an avatar upload section with preview
4. THE avatar upload SHALL accept image files (jpg, jpeg, png, webp) with max size 2MB
5. THE avatar upload SHALL display a cropping interface for uploaded images
6. THE User_Profile_Page SHALL provide an editable form for: full name, email
7. THE User_Profile_Page SHALL provide a separate "Change Password" section
8. THE change password section SHALL include: current password, new password, confirm new password fields
9. THE change password section SHALL display a real-time password strength indicator
10. THE change password section SHALL validate that current password is correct before allowing change
11. THE change password section SHALL validate that new password meets minimum strength requirements (at least "good" strength)
12. THE change password section SHALL validate that new password and confirm password match
13. THE User_Profile_Page SHALL provide an "Account Security" section displaying: last login date/time, password last changed date, email verification status
14. THE User_Profile_Page SHALL provide a "Recent Activity" section showing the user's last 10 login activities (date, time, IP address, device/browser)
15. THE User_Profile_Page SHALL provide a "Corporate Access" section displaying all assigned roles with their scope and associated corporates/departments (read-only)
16. WHEN profile information is updated, THE System SHALL validate input using Zod schema
17. WHEN password is changed, THE System SHALL increment authz_version to invalidate other sessions
18. WHEN password is changed, THE System SHALL update password_changed_at timestamp
19. WHEN password is changed, THE System SHALL create an audit log entry with action "password_changed" and entity_type "user"
20. WHEN avatar is uploaded, THE System SHALL store the image and update avatar_url field
21. THE User_Profile_Page SHALL display toast notifications for success and error states
22. THE User_Profile_Page SHALL use i18n files for all text content (no hardcoded strings)
23. THE User_Profile_Page SHALL use Tailwind CSS 4 with premium styling (glassmorphism, subtle borders)
24. THE User_Profile_Page SHALL be responsive and work on mobile devices

### Requirement 16: User Profile API

**User Story:** As the System, I want secure API endpoints for user profile management, so that users can safely manage their own information.

#### Acceptance Criteria

1. THE System SHALL provide a GET endpoint `/api/profile` to retrieve current user's profile information
2. THE System SHALL provide a PUT endpoint `/api/profile` to update current user's profile (full_name, email)
3. THE System SHALL provide a POST endpoint `/api/profile/avatar` to upload user avatar
4. THE System SHALL provide a POST endpoint `/api/profile/change-password` to change current user's password
5. THE change-password endpoint SHALL require: current_password, new_password
6. THE change-password endpoint SHALL validate that current_password matches the user's current password
7. THE change-password endpoint SHALL validate that new_password meets strength requirements
8. WHEN password is changed, THE System SHALL hash the new password and update the user record
9. WHEN password is changed, THE System SHALL update password_changed_at timestamp
10. WHEN password is changed, THE System SHALL increment authz_version
11. WHEN password is changed, THE System SHALL create an audit log entry
12. THE System SHALL provide a GET endpoint `/api/profile/activity` to retrieve user's recent login activities
13. THE System SHALL provide a GET endpoint `/api/profile/corporate-access` to retrieve user's corporate access information
14. ALL profile endpoints SHALL require authentication (use JWT token)
15. THE System SHALL use Zod schema validation for all input data
16. THE System SHALL return consistent error responses with appropriate HTTP status codes

### Requirement 17: Threshold Manager Finalization

**User Story:** As an Admin_User, I want the Threshold Manager component finalized, so that it follows the current UI standards and database structure.

#### Acceptance Criteria

1. THE Threshold_Manager SHALL maintain all existing functionality from ThresholdConfig.tsx
2. THE Threshold_Manager SHALL use i18n files for all text content (verify no hardcoded strings)
3. THE Threshold_Manager SHALL use commonsI18n for standard UI elements (save, cancel, retry, etc.)
4. THE Threshold_Manager SHALL follow the CorporateManager.tsx template for UI consistency where applicable
5. THE Threshold_Manager SHALL use Tailwind CSS 4 with premium styling (glassmorphism, subtle borders)
6. THE Threshold_Manager SHALL display loading skeletons while fetching data
7. WHEN data fetch fails, THE Threshold_Manager SHALL display an error message with a retry button
8. THE Threshold_Manager SHALL validate input using Zod schema before submission
9. THE Threshold_Manager SHALL display toast notifications for success and error states

### Requirement 18: Audit Log Viewer Finalization

**User Story:** As an Admin_User, I want the Audit Log Viewer component finalized, so that it follows the current UI standards and database structure.

#### Acceptance Criteria

1. THE Audit_Log_Viewer SHALL maintain all existing functionality from AuditLog.tsx
2. THE Audit_Log_Viewer SHALL use i18n files for all text content (verify no hardcoded strings)
3. THE Audit_Log_Viewer SHALL use commonsI18n for standard UI elements (refresh, retry, etc.)
4. THE Audit_Log_Viewer SHALL follow the CorporateManager.tsx template for UI consistency where applicable
5. THE Audit_Log_Viewer SHALL use Tailwind CSS 4 with premium styling (glassmorphism, subtle borders)
6. THE Audit_Log_Viewer SHALL display loading skeletons while fetching data
7. WHEN data fetch fails, THE Audit_Log_Viewer SHALL display an error message with a retry button
8. THE Audit_Log_Viewer SHALL display toast notifications for error states

### Requirement 19: Internationalization (i18n) Support

**User Story:** As a user, I want all new components to support Indonesian and English languages, so that I can use the application in my preferred language.

#### Acceptance Criteria

1. THE System SHALL provide i18n files for Permission_Manager in both Indonesian and English
2. THE System SHALL provide i18n files for Role_Manager (including permission mapping) in both Indonesian and English
3. THE System SHALL provide i18n files for User_Manager in both Indonesian and English
4. THE System SHALL provide i18n files for User_Profile_Page (including password strength labels) in both Indonesian and English
5. THE System SHALL provide i18n files for User_Menu in both Indonesian and English
6. THE System SHALL provide i18n files for Activation_Page in both Indonesian and English
7. THE System SHALL provide i18n files for Password_Reset_Page in both Indonesian and English
8. THE System SHALL provide email templates for account activation in both Indonesian and English
9. THE System SHALL provide email templates for password reset in both Indonesian and English
10. THE System SHALL reuse commonsI18n for standard UI elements (save, cancel, delete, edit, retry, etc.)
11. THE System SHALL use placeholder replacement for dynamic strings (e.g., `.replace('{name}', name)`)
12. THE System SHALL NOT use ternary operators for language selection in JSX
13. THE System SHALL NOT hardcode any user-facing text in components
14. THE System SHALL provide translations for password strength levels (weak, fair, good, strong)
15. THE System SHALL provide translations for email subjects and bodies

### Requirement 20: Permission-Based Access Control for Admin Menus

**User Story:** As the System, I want all admin menu endpoints and UI components protected by specific permissions, so that only authorized users can access each admin functionality.

#### Acceptance Criteria

1. THE Permission_API SHALL require `cfd.permissions.write` permission for create, update, and delete operations
2. THE Permission_API SHALL require `cfd.permissions.read` permission for list and retrieve operations
3. THE Role_API SHALL require `cfd.roles.write` permission for create, update, and delete operations
4. THE Role_API SHALL require `cfd.roles.read` permission for list and retrieve operations
5. THE Role_Permission_API SHALL require `cfd.roles.write` permission for assign and revoke operations
6. THE User_API SHALL require `cfd.users.write` permission for create, update, and delete operations
7. THE User_API SHALL require `cfd.users.read` permission for list and retrieve operations
8. THE User_API SHALL require `cfd.users.reset_password` permission for password reset operations
9. THE Threshold_API SHALL require `cfd.thresholds.write` permission for update operations
10. THE Threshold_API SHALL require `cfd.thresholds.read` permission for list and retrieve operations
11. THE Audit_Log_API SHALL require `cfd.audit_log.read` permission for list and retrieve operations
12. THE Permission_Manager UI SHALL check `cfd.permissions.read` permission before rendering
13. THE Role_Manager UI SHALL check `cfd.roles.read` permission before rendering
14. THE User_Manager UI SHALL check `cfd.users.read` permission before rendering
15. THE Threshold_Manager UI SHALL check `cfd.thresholds.read` permission before rendering
16. THE Audit_Log_Viewer UI SHALL check `cfd.audit_log.read` permission before rendering
17. WHEN a user lacks required permissions, THE System SHALL return HTTP 403 with error code "FRS_FORBIDDEN"
18. THE System SHALL use the requirePermission middleware for all protected endpoints
19. THE System SHALL hide action buttons (create, edit, delete, reset password) when user lacks write permissions
20. THE System SHALL display a "No Permission" message when user tries to access a restricted menu

### Requirement 21: Audit Logging for All Write Operations

**User Story:** As an Admin_User, I want all write operations logged in the audit log, so that I can track changes to permissions, roles, role-permission mappings, and user management.

#### Acceptance Criteria

1. WHEN a permission is created, THE System SHALL create an audit log entry with action "create" and entity_type "permission"
2. WHEN a permission is updated, THE System SHALL create an audit log entry with action "update", old_values, and new_values
3. WHEN a permission is deactivated, THE System SHALL create an audit log entry with action "update" and new_values showing is_active change
4. WHEN a role is created, THE System SHALL create an audit log entry with action "create" and entity_type "role"
5. WHEN a role is updated, THE System SHALL create an audit log entry with action "update", old_values, and new_values
6. WHEN a role is deactivated, THE System SHALL create an audit log entry with action "update" and new_values showing is_active change
7. WHEN permissions are assigned to a role, THE System SHALL create an audit log entry with action "create" and entity_type "role_permission"
8. WHEN permissions are revoked from a role, THE System SHALL create an audit log entry with action "delete" and entity_type "role_permission"
9. WHEN a user is created, THE System SHALL create an audit log entry with action "create" and entity_type "user"
10. WHEN a user is updated, THE System SHALL create an audit log entry with action "update", old_values, and new_values
11. WHEN an activation email is sent, THE System SHALL create an audit log entry with action "send_activation_email" and entity_type "user"
12. WHEN an account is activated, THE System SHALL create an audit log entry with action "account_activated" and entity_type "user"
13. WHEN a password reset is requested by admin, THE System SHALL create an audit log entry with action "request_password_reset" and entity_type "user"
14. WHEN a password reset is completed by user, THE System SHALL create an audit log entry with action "password_reset_completed" and entity_type "user"
15. WHEN a user changes their own password, THE System SHALL create an audit log entry with action "password_changed" and entity_type "user"
16. WHEN a user updates their profile, THE System SHALL create an audit log entry with action "profile_updated" and entity_type "user"
17. WHEN a user uploads an avatar, THE System SHALL create an audit log entry with action "avatar_uploaded" and entity_type "user"
18. WHEN user corporate access is modified, THE System SHALL create an audit log entry with action "update" and entity_type "user_corporate_access"
19. THE System SHALL record user_id, ip_address, and user_agent for all audit log entries
20. THE System SHALL NOT log password values in audit log entries (only record that password was changed)

### Requirement 22: Password Security and Validation

**User Story:** As a developer, I want robust password validation and strength checking, so that user accounts are protected with strong passwords.

#### Acceptance Criteria

1. THE System SHALL define a password strength calculation algorithm that evaluates: length, uppercase, lowercase, numbers, and special characters
2. THE System SHALL classify password strength as: weak (score 0-25), fair (score 26-50), good (score 51-75), strong (score 76-100)
3. THE System SHALL require minimum password length of 8 characters
4. THE System SHALL require passwords to contain at least one uppercase letter, one lowercase letter, and one number
5. THE System SHALL recommend (but not require) special characters for stronger passwords
6. THE System SHALL reject passwords that are classified as "weak"
7. THE System SHALL accept passwords classified as "fair", "good", or "strong"
8. THE System SHALL provide real-time password strength feedback in the UI with color coding (red=weak, yellow=fair, blue=good, green=strong)
9. THE System SHALL display specific requirements that are not met (e.g., "Missing uppercase letter")
10. WHEN a password is reset, THE System SHALL enforce the same strength requirements as password creation
11. THE System SHALL hash passwords using bcrypt before storing in the database
12. THE System SHALL never log or display plain-text passwords in any system output

### Requirement 23: Data Validation and Error Handling

**User Story:** As a developer, I want consistent validation and error handling across all new endpoints, so that the API is reliable and predictable.

#### Acceptance Criteria

1. THE System SHALL use Zod schemas for validating all API request bodies
2. WHEN validation fails, THE System SHALL return HTTP 400 with error code "FRS_VALIDATION_ERROR" and descriptive messages
3. WHEN a resource is not found, THE System SHALL return HTTP 404 with error code "FRS_NOT_FOUND"
4. WHEN a unique constraint is violated, THE System SHALL return HTTP 422 with error code "FRS_VALIDATION_ERROR"
5. WHEN an internal error occurs, THE System SHALL return HTTP 500 with error code "FRS_INTERNAL_ERROR"
6. THE System SHALL use the asyncHandler wrapper for all route handlers
7. THE System SHALL log all errors to the console with stack traces for debugging

### Requirement 24: Database Transaction Safety

**User Story:** As a developer, I want write operations that affect multiple tables to use database transactions, so that data integrity is maintained.

#### Acceptance Criteria

1. WHEN assigning multiple permissions to a role, THE System SHALL use a database transaction
2. WHEN revoking permissions and incrementing authz_version, THE System SHALL use a database transaction
3. WHEN creating a user with corporate access, THE System SHALL use a database transaction
4. WHEN updating user corporate access, THE System SHALL use a database transaction
5. IF any operation in a transaction fails, THE System SHALL rollback all changes

### Requirement 25: UI Component Reusability

**User Story:** As a developer, I want reusable hooks and components for common patterns, so that I can maintain consistency and reduce code duplication.

#### Acceptance Criteria

1. THE System SHALL provide a usePermissions hook for fetching and managing permissions
2. THE System SHALL provide a useRoles hook for fetching and managing roles
3. THE System SHALL provide a useRolePermissions hook for fetching and managing role-permission mappings
4. THE System SHALL provide a usePasswordStrength hook for calculating and displaying password strength
5. THE System SHALL provide a useUserProfile hook for fetching and updating user profile
6. THE System SHALL provide a useUserActivity hook for fetching user login activities
7. THE System SHALL reuse the SearchableSelect component for all dropdown selectors with many options
8. THE System SHALL reuse the Modal component from CorporateManager.tsx for all modal dialogs
9. THE System SHALL reuse the SectionHeader component from CorporateManager.tsx for form sections
10. THE System SHALL create a reusable PasswordStrengthIndicator component for password forms
11. THE System SHALL create a reusable AvatarUpload component for avatar management

### Requirement 26: Email Service Integration

**User Story:** As the System, I want a reliable email service for sending activation and password reset emails, so that users can securely manage their accounts.

#### Acceptance Criteria

1. THE System SHALL integrate with an email service provider (e.g., SendGrid, AWS SES, or SMTP)
2. THE System SHALL configure email service credentials via environment variables
3. THE System SHALL provide a sendActivationEmail function that accepts: user email, user name, activation token, and language preference
4. THE System SHALL provide a sendPasswordResetEmail function that accepts: user email, user name, reset token, and language preference
5. THE System SHALL use HTML email templates with responsive design
6. THE activation email template SHALL include: company logo, user greeting, activation link button, expiration notice (7 days), and welcome message
7. THE password reset email template SHALL include: company logo, user greeting, reset link button, expiration notice (24 hours), and security warning
8. THE System SHALL handle email sending failures gracefully and return appropriate error messages
9. THE System SHALL log email sending attempts (success/failure) for debugging
10. THE System SHALL NOT expose email service credentials in logs or error messages
11. THE System SHALL implement retry logic for transient email sending failures (max 3 retries)
12. THE System SHALL provide a fallback mechanism if email service is unavailable (log error and notify admin)

### Requirement 27: Database Schema Extensions

**User Story:** As a developer, I want database schema extensions to support new features, so that all user account and activity data is properly stored.

#### Acceptance Criteria

1. THE System SHALL add an email_verified boolean field to the users table (default: false)
2. THE System SHALL add a last_login_ip varchar field to the users table to store last login IP address
3. THE System SHALL add a last_login_user_agent text field to the users table to store last login device/browser info
4. THE System SHALL create a user_login_activities table with fields: id, user_id, login_at, ip_address, user_agent, success (boolean)
5. THE user_login_activities table SHALL have an index on user_id and login_at for efficient querying
6. THE System SHALL record login attempts (both successful and failed) in user_login_activities table
7. THE System SHALL automatically clean up user_login_activities older than 90 days (via scheduled job or trigger)
8. THE System SHALL reuse existing password_reset_token_hash and password_reset_expires_at fields for activation tokens
9. ALL new fields SHALL follow the existing naming conventions and data types
10. ALL schema changes SHALL be implemented via Drizzle ORM migrations
