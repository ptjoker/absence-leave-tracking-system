import { Link } from "react-router-dom";
import "./App.css";

function Icon({ children }) {
  return <span className="icon">{children}</span>;
}

function Homepage() {
  return (
    <div className="app">
      {/* NAVBAR */}
      <header className="navbar">
        <div className="logo-area">
          <div className="logo-icon">✓</div>

          <div>
            <div className="logo-title">StudentAssistant</div>
            <div className="logo-subtitle">
              ABSENCE AND TRACKING SYSTEM
            </div>
          </div>
        </div>

        <nav className="nav-links">
          <a href="#home">⌂ &nbsp;Homepage</a>
          <button
            className="theme-button"
            onClick={() => document.body.classList.toggle("dark")}
          >
            ◔ &nbsp; Change mode
          </button>
        </nav>
      </header>

      <main>
        {/* HERO */}
        <section className="hero" id="home">
          <div className="hero-inner">
          <div className="hero-content">
            <span className="small-badge">Library Services</span>

            <h1>
              Student
              <br />
              Assistant
              <br />
              <span>Absence</span> &amp; Leave
              <br />
              Tracking system
            </h1>

            <p>
              A centralized platform for managing schedules, attendance,
              leave, shift exchanges and working hours across the iCenter.
            </p>

            <div className="hero-buttons">
              <Link to="/login" className="primary-button">
                Login <span>→</span>
              </Link>

              <button className="secondary-button">
                Sign-up
              </button>
            </div>
          </div>

          {/* HERO ILLUSTRATION */}
          <div className="hero-image">
            <div className="illustration-window">
              <div className="floating-circle circle-one"></div>
              <div className="floating-circle circle-two"></div>

              <div className="board">
                <div className="board-header">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>

                <div className="board-content">
                  <div className="check-lines">
                    <div>✓ ─────────</div>
                    <div>✓ ─────────</div>
                    <div>✓ ─────────</div>
                    <div>✓ ─────────</div>
                  </div>

                  <div className="calendar">
                    <div className="calendar-title">
                      Schedule
                    </div>
                    <div className="calendar-grid">
                      {Array.from({ length: 15 }).map((_, i) => (
                        <span key={i}></span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="person person-one">👩🏾‍💼</div>
              <div className="person person-two">👩🏻‍💻</div>
              <div className="person person-three">👨🏾‍💼</div>
              <div className="person person-four">👨🏻‍💻</div>

              <div className="laptop">▱</div>
            </div>
          </div>
          </div>
        </section>

        {/* MONITORING SECTION */}
        <section className="feature-section monitoring">
          <div className="dashboard-card">
            <div className="dashboard-title">
              STUDENT STAFF HUB
            </div>

            <div className="dashboard-body">
              <div className="mini-calendar">
                <h4>APPROVED LEAVE</h4>

                <div className="days">
                  <span>OCTOBER</span>
                  <span>MON</span>
                  <span>TUE</span>
                  <span>WED</span>
                  <span>THU</span>
                  <span>FRI</span>
                  <span>✓</span>
                  <span>23</span>
                  <span>24</span>
                  <span>25</span>
                  <span>26</span>
                  <span>27</span>
                  <span>✓</span>
                  <span>28</span>
                  <span>29</span>
                  <span>✓</span>
                  <span>30</span>
                  <span>✓</span>
                  <span>31</span>
                </div>
              </div>

              <div className="stats">
                <div className="stat approved">
                  <strong>✓</strong>
                  <div>
                    <small>TOTAL REQUESTS</small>
                    <b>12</b>
                  </div>
                </div>

                <div className="stat pending">
                  <strong>◷</strong>
                  <div>
                    <small>PENDING</small>
                    <b>4</b>
                  </div>
                </div>

                <div className="efficiency">
                  <small>EFFICIENCY SCORE: 95%</small>
                  <div>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="feature-text">
            <div className="section-label">
              ◉ &nbsp; REAL-TIME MANAGEMENT
            </div>

            <h2>
              Effortless Absence &amp; Leave
              <br />
              Monitoring
            </h2>

            <p>
              Ditch the spreadsheets. Our digital dashboard allows
              supervisors to view check-ins, verify absences, and
              manage leave requests in a single, high-contrast
              interface designed for quick scanning.
            </p>

            <ul>
              <li>Visual calendar for department-wide scheduling</li>
              <li>One-click verification for medical leaves</li>
              <li>Historical logs for payroll reconciliation</li>
              <li>
                Customized leave categories (Sick, Personal, Research)
              </li>
            </ul>
          </div>
        </section>

        {/* NOTIFICATIONS */}
        <section className="feature-section notifications">
          <div className="feature-text">
            <div className="section-label notification-label">
              ♧ &nbsp; STAY INFORMED
            </div>

            <h2>Automated Notifications &amp; Alerts</h2>

            <p>
              Ensure no request goes unnoticed. StudentAssistant
              proactively notifies relevant staff via email and app
              alerts whenever a student assistant logs an absence or
              submits a time-off request.
            </p>

            <div className="notification-cards">
              <div className="notification-card">
                <Icon>◷</Icon>
                <h4>Instant Alerts</h4>
                <p>
                  Receive real-time push notifications for
                  fast-moving schedule changes.
                </p>
              </div>

              <div className="notification-card">
                <Icon>♢</Icon>
                <h4>Status Updates</h4>
                <p>
                  Students are automatically notified whenever
                  their leave status changes.
                </p>
              </div>
            </div>
          </div>

          <div className="phone-area">
            <div className="phone">
              <div className="phone-speaker"></div>

              <div className="phone-screen">
                <div className="notification-icon">✓</div>

                <h5>Leave Request</h5>
                <strong>Update</strong>

                <p>
                  Your leave request has been approved.
                </p>

                <div className="phone-check">✓</div>
              </div>
            </div>
          </div>
        </section>

        {/* ROLES */}
        <section className="roles-section">
          <div className="roles-heading">
            <h2>Built for Every Role</h2>

            <p>
              Whether you're a department head or a student worker,
              Student Assistant Tracker simplifies your workflow.
            </p>
          </div>

          <div className="role-cards">
            <div className="role-card">
              <div className="role-icon blue">♧</div>

              <h3>Administrators</h3>

              <p>
                Oversee department-wide attendance, generate payroll
                reports, and manage staffing levels with
                comprehensive analytics.
              </p>

              <a href="#admin">
                Learn More&nbsp; →
              </a>
            </div>

            <div className="role-card">
              <div className="role-icon orange">▣</div>

              <h3>Supervisors</h3>

              <p>
                Approve or deny leave requests in seconds, view daily
                team schedules, and communicate directly with your
                student staff.
              </p>

              <a href="#supervisor">
                Learn More&nbsp; →
              </a>
            </div>

            <div className="role-card">
              <div className="role-icon green">✓</div>

              <h3>Student Assistant</h3>

              <p>
                Easily log absences, track remaining leave balance,
                and receive instant status updates on pending
                requests via mobile.
              </p>

              <a href="#student">
                Learn More&nbsp; →
              </a>
            </div>
          </div>

          <button className="contact-button">
            Contact Sales
          </button>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-columns">
          <div>
            <h4>Contact Us</h4>

            <p>◉ &nbsp;19 CR Sambo, Witbank, Emalahleni,</p>
            <p> &nbsp;&nbsp;&nbsp;&nbsp;1034, South Africa.</p>
            <p>☎ &nbsp;+27 (0) 116 889 2421</p>
            <p>✉ &nbsp;general@tut.ac.za</p>
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
            <a href="#compliance">Compliance</a>
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
              Ensuring seamless academic scheduling and
              management for all departments.
            </p>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            © 2026 Student Assistance Absence Tracker. All rights
            reserved.
          </span>

          <div>
            <a href="#accessibility">Accessibility</a>
            <a href="#support">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Homepage;
