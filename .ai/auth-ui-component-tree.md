# Authentication UI - Component Tree

## 📁 File Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx                    ✅ NEW
│   │   ├── RegisterForm.tsx                 ✅ NEW
│   │   ├── ForgotPasswordForm.tsx           ✅ NEW
│   │   ├── ResetPasswordForm.tsx            ✅ NEW
│   │   └── PasswordStrengthIndicator.tsx    ✅ NEW
│   │
│   ├── layout/
│   │   └── Header.tsx                       ✅ NEW
│   │
│   └── ui/
│       └── dropdown-menu.tsx                ✅ NEW
│
├── pages/
│   └── auth/
│       ├── login.astro                      ✅ NEW
│       ├── register.astro                   ✅ NEW
│       ├── forgot-password.astro            ✅ NEW
│       ├── reset-password.astro             ✅ NEW
│       └── verify-email.astro               ✅ NEW
│
└── layouts/
    └── Layout.astro                         📝 MODIFIED
```

## 🔗 Component Dependencies

### Login Page Flow

```
login.astro
  └── Layout.astro
      └── Header.tsx (client:load)
          └── DropdownMenu (if authenticated)
  └── LoginForm.tsx (client:load)
      ├── Input (email)
      ├── Input (password)
      ├── Button (submit)
      └── Links (register, forgot-password)
```

### Register Page Flow

```
register.astro
  └── Layout.astro
      └── Header.tsx (client:load)
  └── RegisterForm.tsx (client:load)
      ├── Input (email)
      ├── Input (password)
      ├── Input (confirm password)
      ├── PasswordStrengthIndicator
      │   └── Progress bar + criteria hints
      ├── Button (submit)
      └── Success state (if registered)
```

### Forgot Password Page Flow

```
forgot-password.astro
  └── Layout.astro
      └── Header.tsx (client:load)
  └── ForgotPasswordForm.tsx (client:load)
      ├── Input (email)
      ├── Button (submit)
      └── Success state (if sent)
```

### Reset Password Page Flow

```
reset-password.astro
  └── Layout.astro
      └── Header.tsx (client:load)
  └── ResetPasswordForm.tsx (client:load)
      ├── Input (new password)
      ├── Input (confirm password)
      ├── PasswordStrengthIndicator
      ├── Button (submit)
      └── Success state (if reset)
  └── <script> (extract token from URL hash)
```

### Email Verification Page Flow

```
verify-email.astro
  └── Layout.astro
      └── Header.tsx (client:load)
  └── Static success message
      └── Link to login
```

## 🎨 Shared UI Components Used

All forms use these shadcn/ui components:

- ✅ `Button` - Submit buttons with loading states
- ✅ `Input` - Text and email inputs
- ✅ `Label` - Form field labels
- ✅ `DropdownMenu` - User menu in Header
- ✅ `Loader2` (lucide-react) - Loading spinner icon

## 🔄 State Management

### Form Components State

Each form manages its own state:

- `email` - Email input value
- `password` - Password input value
- `confirmPassword` - Confirm password value (register/reset)
- `isLoading` - Form submission state
- `error` - General error message
- `errors` - Field-specific validation errors
- `success` - Success state (register/forgot-password/reset)
- `showPassword` - Password visibility toggle
- `showConfirmPassword` - Confirm password visibility toggle

### Header Component State

- `isLoggingOut` - Logout action state
- `user` prop - User data (passed from Layout)

## 📊 Data Flow

### Current (UI Only)

```
User Input → Form Component → Console.log → Success/Error State
```

### Future (With Backend)

```
User Input → Form Component → API Endpoint → Supabase Auth → Response → Success/Error State
```

## 🎯 Props Interface

### Layout.astro

```typescript
interface Props {
  title?: string;
  user?: {
    id: string;
    email: string;
  } | null;
}
```

### Header.tsx

```typescript
interface HeaderProps {
  user?: {
    id: string;
    email: string;
  } | null;
}
```

### LoginForm.tsx

```typescript
interface LoginFormProps {
  redirectTo?: string;
}
```

### ResetPasswordForm.tsx

```typescript
interface ResetPasswordFormProps {
  token: string;
}
```

### PasswordStrengthIndicator.tsx

```typescript
interface PasswordStrengthIndicatorProps {
  password: string;
}
```

## 🎭 Conditional Rendering

### Header Component

```
if (user exists):
  - Show navigation links (Generate, My Flashcards)
  - Show user dropdown menu
else:
  - Show Sign in / Sign up buttons
```

### Form Success States

```
if (success):
  - Show success message
  - Hide form
  - Show relevant links/actions
else:
  - Show form
```

## 🔐 Validation Flow

```
User types → onChange → Clear field error
User blurs → onBlur → Validate field (optional)
User submits → onSubmit → Validate all fields → Show errors OR Submit
```

### Validation Rules Applied

- Email: format, required, max length
- Password (login): required, min length
- Password (register/reset): required, min/max length, complexity
- Confirm Password: required, must match

---

**All components are ready and follow React 19 best practices with TypeScript!** 🎉
