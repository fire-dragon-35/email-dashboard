interface VaultPassphraseFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export function VaultPassphraseField({ value, onChange }: VaultPassphraseFieldProps) {
  return (
    <div className="login-form__field">
      <label htmlFor="login-vault-passphrase">Vault passphrase (used to encrypt this on this device)</label>
      <input
        id="login-vault-passphrase"
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      />
    </div>
  );
}
