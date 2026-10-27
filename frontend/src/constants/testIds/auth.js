// Test IDs for the auth feature (login, register, password reset, logout).
// Add new keys here as you wire up additional auth UI; see ./index.js for
// the recipe to add a new feature file.
//
// Directive:
//   - Keys are camelCase, values are kebab-case shaped as `<feature>-<element>`
//     (or `<feature>-<element>-<qualifier>` when an element repeats). Examples:
//     'login-submit-button', 'cart-quantity-input', 'product-card-image'.
//   - Reference them in JSX as `data-testid={LOGIN.submitButton}`.
//
// Why kebab-case values: required by qabot's CSS-attribute selector matcher
// and the lint rule `emergent(kebab-case-testid)`.

export const LOGIN = {
	emailInput: 'login-email-input',
	passwordInput: 'login-password-input',
	submitButton: 'login-submit-button',
	forgotPasswordLink: 'login-forgot-password-link',
	registerLink: 'login-register-link',
	googleButton: 'login-google-button',
	passwordToggle: 'login-password-toggle',
};

export const REGISTER = {
	nameInput: 'register-name-input',
	emailInput: 'register-email-input',
	passwordInput: 'register-password-input',
	passwordConfirmInput: 'register-password-confirm-input',
	submitButton: 'register-submit-button',
	loginLink: 'register-login-link',
	googleButton: 'register-google-button',
	passwordToggle: 'register-password-toggle',
	passwordRequirement: 'register-password-requirement',
};

export const RESET = {
	emailInput: 'reset-email-input',
	submitButton: 'reset-submit-button',
	signInLink: 'reset-sign-in-link',
	confirmation: 'reset-confirmation',
	sentTo: 'reset-sent-to',
	resendButton: 'reset-resend-button',
	backToSignInButton: 'reset-back-to-sign-in-button',
};

export const LOGOUT = {
	button: 'logout-button',
	accountEmail: 'logout-account-email',
};
