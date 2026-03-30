import { useState, useCallback } from 'react';
import useAuthStore from '../store/authStore';

export default function LoginForm() {
  const { login, loading, error } = useAuthStore();
  const [form, setForm] = useState({
    email: 'react@hipster-inc.com',
    password: 'React@123',
    keyPass: '07ba959153fe7eec778361bf42079439',
  });
  const [formErrors, setFormErrors] = useState({});

  const validate = useCallback(() => {
    const errs = {};
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
    if (!form.password) errs.password = 'Password is required';
    if (!form.keyPass) errs.keyPass = 'Key pass is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }, [form]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!validate()) return;
      try {
        await login(form.email, form.password, form.keyPass);
      } catch {
        // error is set in the store
      }
    },
    [form, validate, login]
  );

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>🧖 SPA Booking</h1>
        <p>Sign in to manage bookings</p>

        {error && (
          <div className="alert alert-error">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              className={`form-input${formErrors.email ? ' error' : ''}`}
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="Enter email"
            />
            {formErrors.email && <div className="form-error">{formErrors.email}</div>}
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              className={`form-input${formErrors.password ? ' error' : ''}`}
              type="password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              placeholder="Enter password"
            />
            {formErrors.password && <div className="form-error">{formErrors.password}</div>}
          </div>

          <div className="form-group">
            <label>Key Pass (Captcha Bypass)</label>
            <input
              className={`form-input${formErrors.keyPass ? ' error' : ''}`}
              type="text"
              value={form.keyPass}
              onChange={(e) => setForm((p) => ({ ...p, keyPass: e.target.value }))}
              placeholder="Enter key pass"
            />
            {formErrors.keyPass && <div className="form-error">{formErrors.keyPass}</div>}
          </div>

          <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
