import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { ApiError } from "../../api/client.js";
import { usePageTitle } from "../../shared/hooks/usePageTitle.js";
import Button from "../../shared/ui/Button.jsx";
import FormError from "../../shared/ui/FormError.jsx";
import FormField from "../../shared/ui/FormField.jsx";
import { useAuth } from "../../state/useAuth.js";
import "./auth.css";

const EMPTY_FORM = { email: "", password: "" };

function validate({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = ["Email is required."];
  if (!password) errors.password = ["Password is required."];
  return errors;
}

export default function LoginPage() {
  usePageTitle("Log in");

  const { login, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [values, setValues] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (status === "authenticated") return <Navigate to="/" replace />;

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    const clientErrors = validate(values);
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    setSubmitting(true);
    try {
      await login(values);
      navigate(location.state?.from?.pathname ?? "/", { replace: true });
    } catch (err) {
      setSubmitting(false);
      if (err instanceof ApiError && err.status === 401) {
        // One fixed message: never reveal which field was wrong.
        setFormError("Incorrect email or password.");
      } else if (err instanceof ApiError && err.status === 0) {
        setFormError(err.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <h1>Log in</h1>
        <p className="auth-card__intro">Welcome back to your library.</p>

        <form onSubmit={handleSubmit} noValidate className="form">
          <FormField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            value={values.email}
            onChange={handleChange}
            errors={errors.email}
          />
          <FormField
            id="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            value={values.password}
            onChange={handleChange}
            errors={errors.password}
          />
          <FormError>{formError}</FormError>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Logging in..." : "Log in"}
          </Button>
        </form>

        <p className="auth-card__footer">
          No account yet? <Link to="/register">Register</Link>
        </p>
      </div>
    </section>
  );
}
