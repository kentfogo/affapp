# Development Rules & Principles

## Core Principles

### Rule 1: DRY (Don't Repeat Yourself)
**Before generating new code, check if similar functionality exists.**
- Extend or reuse existing code
- If functionality is too different, extract shared logic into clean, composable functions
- Avoid code duplication at all costs

### Rule 2: Security-First
**Implement with secure defaults:**
- Store secrets in environment variables
- Validate input server-side
- Sanitize user data
- Implement role-based authentication
- Use parameterized queries
- Never expose credentials client-side
- Refer to community best practices before inventing custom flows

### Rule 3: Single Responsibility Principle - Debugging
**Break into single-purpose functions:**
- Validate input separately
- Handle database logic separately
- Manage side effects separately
- Name each function clearly based on its sole job
- One function = one responsibility

### Rule 4: Stick with your Framework
**Check if the framework or community library provides the feature.**
- Use standard options first
- Only go custom with strong justification
- Leverage Flutter ecosystem packages
- Leverage Firebase services
- List the standard option first

### Rule 5: When Principles Clash (And They Will)
**Priority order:**
1. **Clarity beats cleverness** - Code should be readable and maintainable
2. **Security trumps everything** - Never compromise on security
3. **Stick with the ecosystem** - Use standard patterns and libraries

### Rule 6: Three Habits that Anchor Your System

1. **Save working code every 30 minutes**
   - Commit frequently
   - Don't lose progress

2. **Build end-to-end**
   - Don't write all frontends first, then all backends
   - Finish one feature completely: UI, logic, data
   - Test the complete flow before moving on

3. **Organize by user action**
   - Keep everything related to "user login" in one place
   - Same for payments, profiles, sessions, etc.
   - Group related functionality together

### Rule 7: Project Structure & Workflow

1. **Structure folders by feature**
   - Organize code by feature, not by type
   - Example: `features/auth/`, `features/sessions/`, `features/affirmations/`

2. **Commit after each working milestone**
   - Don't wait until everything is done
   - Commit when a feature works end-to-end

3. **Complete one user-facing feature before moving to the next**
   - Finish authentication completely before starting sessions
   - Finish sessions completely before starting history
   - Avoid partially implemented features

## Implementation Guidelines

### Code Organization
- Feature-based folder structure
- Shared utilities in `lib/shared/`
- Models in feature folders
- Services in feature folders or `lib/services/`

### Testing Strategy
- Test each feature end-to-end
- Test user flows, not just functions
- Verify security measures

### Documentation
- Document complex logic
- Keep README updated
- Document API contracts
- Document security measures

## Questions to Ask Before Coding

1. **How will users know this solved their problem?**
   - Define success from user perspective

2. **What does "working well" look like in real usage?**
   - Define the ideal user experience

3. **What specific outcomes define "done"?**
   - Define clear completion criteria

## Flutter-Specific Guidelines

### State Management
- Use Flutter's recommended state management solution
- Consider Provider, Riverpod, or Bloc based on complexity

### Firebase Integration
- Use Firebase Auth for authentication
- Use Firestore for data storage
- Use Cloud Storage for audio files
- Use Cloud Functions for server-side logic (negativity screening)

### UI/UX
- Follow Material Design guidelines
- Ensure smooth animations
- Optimize for performance
- Test on multiple devices

## Security Checklist

- [ ] All secrets in environment variables
- [ ] Input validation on client and server
- [ ] User data sanitization
- [ ] Secure authentication flow
- [ ] Role-based access control
- [ ] Parameterized queries (if using SQL)
- [ ] No credentials in client code
- [ ] HTTPS for all network requests
- [ ] Secure storage for sensitive data

