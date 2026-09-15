import { useState } from "react";
import { Link } from "react-router-dom";
import "./LoginPage.css";

function Icon({ children }) {
  return <span className="icon">{children}</span>;
}

function LoginPage({ onStudentSignIn, onSupervisorSignIn }) {
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleStudentSignIn(e) {
    e.preventDefault();
    if (onStudentSignIn) onStudentSignIn({ email, password, keepSignedIn });
  }

  function handleSupervisorSignIn(e) {
    e.preventDefault();
    if (onSupervisorSignIn) onSupervisorSignIn({ email, password, keepSignedIn });
  }

  return (
    <div className="login-page">
      {/* NAVBAR */}
      <header className="login-navbar">
        <div className="logo-area">
          <div className="logo-icon">
            <Icon>&#128197;</Icon>
          </div>
          <div>
            <div className="logo-title">StudentAssist</div>
            <div className="logo-subtitle">ABSENCE TRACKER</div>
          </div>
        </div>

        <nav className="login-nav-links">
          <a href="#dashboard">
            <Icon>&#9638;</Icon> Dashboard
          </a>
          <a href="#logs">Absence Logs</a>
          <a href="#settings">
            <Icon>&#9881;</Icon> Settings
          </a>
        </nav>

        <div className="login-nav-actions">
          <a href="#signup" className="signup-link">
            Sign-up
          </a>
          <Link to="/" className="home-button">
            Home
          </Link>
        </div>
      </header>

      {/* HERO */}
      <main className="login-hero">
        <div className="login-left">
          <span className="badge-secure">
            <Icon>&#128274;</Icon> SECURE PORTAL
          </span>

          <h1>Welcome Back</h1>

          <p className="lede">
            Sign in to your StudentAssist account to manage absences,
            approvals, and schedules.
          </p>

          <form className="login-card" onSubmit={handleStudentSignIn}>
            <label className="field-label" htmlFor="email">
              Institutional Email
            </label>
            <div className="input-wrap">
              <Icon>&#9993;</Icon>
              <input
                id="email"
                type="email"
                placeholder="e.g. name@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="field-row">
              <label className="field-label" htmlFor="password">
                Password
              </label>
              <a href="#forgot" className="forgot-link">
                Forgot Password?
              </a>
            </div>
            <div className="input-wrap">
              <Icon>&#128274;</Icon>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="toggle-visibility"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={keepSignedIn}
                onChange={(e) => setKeepSignedIn(e.target.checked)}
              />
              Keep me signed in for 30 days
            </label>

            <div className="signin-buttons">
              <button type="submit" className="student-btn">
                Student Sign in <span>→</span>
              </button>
              <button
                type="button"
                className="supervisor-btn"
                onClick={handleSupervisorSignIn}
              >
                Supervisor Sign in <span>→</span>
              </button>
            </div>

            <div className="divider">
              <span>INSTITUTIONAL ACCESS</span>
            </div>

            <p className="help-text">
              Need help accessing your account?{" "}
              <a href="#support">Contact IT Support</a>
            </p>
          </form>

          <div className="maintenance-note">
            <Icon>&#8505;</Icon>
            <div>
              <strong>System Maintenance</strong>
              <p>
                The StudentAssist portal will be undergoing scheduled
                updates this Sunday from 2:00 AM to 4:00 AM EST.
              </p>
            </div>
          </div>
        </div>

        <div className="login-right">
          <div className="photo-panel">
            <div className="verified-badge">
              <span className="verified-icon">
                <Icon>&#128197;</Icon>
              </span>
              <div>
                <strong>Verified</strong>
                <small>Attendance Logged</small>
              </div>
            </div>

            <div className="notebook-illustration">
              <div className="notebook notebook-left"></div>
              <div className="notebook notebook-right"></div>
              <div className="notebook notebook-front">
                <span className="notebook-year">2025</span>
              </div>
            </div>

            <div className="progress-card">
              <div className="progress-head">
                <span>Weekly Progress</span>
                <span className="progress-pct">92%</span>
              </div>
              <div className="progress-bar">
                <span style={{ width: "92%" }}></span>
              </div>
              <p>
                Departmental assistants have reached target attendance
                milestones for the current semester.
              </p>
            </div>
          </div>

          <h3>Centralized Management</h3>
          <p className="right-copy">
            The primary tool for managing student assistant leave requests,
            absence tracking, and departmental scheduling efficiency.
          </p>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="login-footer">
        <div className="footer-columns">
          <div>
            <h4>Contact Us</h4>
            <p>&#9679; &nbsp;19 CR Sambo, Witbank, Emalahleni,</p>
            <p>&nbsp;&nbsp;&nbsp;&nbsp;1034, South Africa.</p>
            <p>&#9742; &nbsp;+27 (0) 116 889 2421</p>
            <p>&#9993; &nbsp;general@tut.ac.za</p>
          </div>

          <div>
            <h4>Platform</h4>
            <a href="#features">Features</a>
            <a href="#documentation">Documentation</a>
            <a href="#support">Support Center</a>
            <a href="#status">Status</a>
          </div>

          <div>
            <h4>Legal</h4>
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
            <a href="#security">Security</a>
            <a href="#administration">Administration</a>
          </div>

          <div>
            <h4>Connect</h4>
            <div className="socials">
              <span>𝕏</span>
              <span>in</span>
              <span>◎</span>
              <span>◉</span>
            </div>
            <p>
              Ensuring seamless academic scheduling and management for all
              departments.
            </p>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 StudentAssist Absence Tracker. All rights reserved.</span>
          <div>
            <a href="#accessibility">Accessibility</a>
            <a href="#support">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LoginPage;
