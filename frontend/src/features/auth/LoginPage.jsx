import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { ApiError } from "../../api/client.js";
import { useAuth } from "../../state/useAuth.js";
import FormError from "../../shared/ui/FormError.jsx";
import FormField from "../../shared/ui/FormField.jsx";
import "./auth.css";

const EMPTY_FORM = { email: "", password: "" };

function validate({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = ["Email is required."];
  if (!password) errors.password = ["Password is required."];
  return errors;
}

export default function LoginPage() {
  const { login, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [values, setValues] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (status === "authenthicated") return <Navigate to="/" replace />;

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
      <h1>Login</h1>
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
        <button type="submit" disabled={submitting}>
          {submitting ? "Logging in..." : "Log in"}
        </button>
      </form>
      <p>
        No account yet? <Link to="/register">Register</Link>
      </p>
    </section>
  );
}
