import { useState } from "react";
import { ApiError } from "../../api/client.js";
import { register } from "./api.js";
import FormError from "../../shared/ui/FormError.jsx";
import FormField from "../../shared/ui/FormField.jsx";
import "./auth.css";
import { Link } from "react-router";

const EMPTY_FORM = { username: "", email: "", password: "" };

function validate({ username, email, password }) {
  const errors = {};
  if (!username.trim()) errors.username = ["Username is required."];
  if (!email.trim()) {
    errors.email = ["Email is required."];
  } else if (!/^\S+@\S+\.\S+$/.test(email)) {
    errors.email = ["Enter a valid email address."];
  }
  if (!password) errors.password = ["Password is required."];
  return errors;
}

export default function RegisterPage() {
  const [values, setValues] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [status, setStatus] = useState("idle");
  const [createdEmail, setCreatedEmail] = useState("");

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

    setStatus("submitting");
    try {
      const user = await register(values);
      setCreatedEmail(user.email);
      setStatus("success");
    } catch (err) {
      setStatus("idle");
      if (err instanceof ApiError && err.status === 400 && err.data) {
        const { non_field_errors, ...fieldErrors } = err.data;
        setErrors(fieldErrors);
        if (non_field_errors) setFormError(non_field_errors.join(" "));
      } else if (err instanceof ApiError && err.status === 0) {
        setFormError(err.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    }
  }

  if (status === "success") {
    return (
      <section className="auth-page">
        <h1>Account created</h1>
        <p role="status">
          Your account for <strong>{createdEmail}</strong> is ready.{" "}
          <Link to="/login">Login</Link> to continue.
        </p>
      </section>
    );
  }

  const submitting = status === "submitting";

  return (
    <section className="auth-page">
      <h1>Register an account</h1>
      <form onSubmit={handleSubmit} noValidate className="form">
        <FormField
          id="username"
          label="Username"
          autoComplete="username"
          autoCapitalize="none"
          value={values.username}
          onChange={handleChange}
          errors={errors.username}
        />
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
          autoComplete="new-password"
          value={values.password}
          onChange={handleChange}
          errors={errors.password}
        />
        <FormError>{formError}</FormError>
        <button type="submit" disabled={submitting}>
          {submitting ? "Creating account..." : "Create account"}
        </button>
      </form>
    </section>
  );
}
