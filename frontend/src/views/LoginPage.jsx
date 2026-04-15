import { useState } from "react";

export default function LoginPage({ initialPhone, onLogin }) {
  const [phone, setPhone] = useState(initialPhone || "");
  const [touched, setTouched] = useState(false);

  const digits = phone.replace(/\D/g, "");
  const valid = digits.length === 10;

  function handleSubmit(event) {
    event.preventDefault();
    setTouched(true);

    if (!valid) {
      return;
    }

    onLogin(`+91 ${digits}`);
  }

  return (
    <div className="login-shell">
      <section className="login-card">
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-copy login-copy-centered">
            <p className="eyebrow">DarkStore OS</p>
            <h1>Sign in to operations</h1>
            <p>
              Secure access for warehouse managers, dispatch teams, and store admins. Use your registered
              phone number to continue.
            </p>
          </div>

          <div className="login-centerpiece">
            <label className="field">
              <span>Phone number</span>
              <div className="phone-field">
                <strong>+91</strong>
                <input
                  inputMode="numeric"
                  maxLength={10}
                  onBlur={() => setTouched(true)}
                  onChange={(event) => setPhone(event.target.value.replace(/[^\d]/g, ""))}
                  placeholder="9876543210"
                  type="tel"
                  value={digits}
                />
              </div>
            </label>

            <label className="field">
              <span>Access code</span>
              <input className="text-field" placeholder="••••••" type="password" value="246810" readOnly />
            </label>
          </div>

          {touched && !valid && <p className="field-error">Enter a valid 10-digit phone number.</p>}

          <button className="login-button" type="submit">
            Continue to workspace
          </button>

          <p className="login-note">Demo mode is enabled. Any valid 10-digit number will sign in.</p>

          <div className="login-trust login-trust-centered">
            <span>Phone-based access</span>
            <span>Live control room</span>
            <span>Audit-friendly workspace</span>
          </div>
        </form>
      </section>
    </div>
  );
}
