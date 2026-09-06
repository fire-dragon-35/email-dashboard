interface CredentialFieldsProps {
  email: string;
  onEmailChange: (value: string) => void;
  password: string;
  onPasswordChange: (value: string) => void;
}

export function CredentialFields({ email, onEmailChange, password, onPasswordChange }: CredentialFieldsProps) {
  return (
    <>
      <div className="login-form__field">
        <label htmlFor="login-email">Email address</label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          required
        />
      </div>
      <div className="login-form__field">
        <label htmlFor="login-password">App password</label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          required
        />
      </div>
    </>
  );
}
