import os
import ssl
import smtplib
import logging
import re
from datetime import datetime
from email.message import EmailMessage

logger = logging.getLogger("uvicorn.error")

# Color themes configuration
THEMES = {
    "blue": {
        "primary": "#4f46e5",
        "secondary": "#3b82f6",
        "shadow": "rgba(79, 70, 229, 0.2)"
    },
    "amber": {
        "primary": "#d97706",
        "secondary": "#f59e0b",
        "shadow": "rgba(217, 119, 6, 0.2)"
    },
    "green": {
        "primary": "#059669",
        "secondary": "#10b981",
        "shadow": "rgba(5, 150, 105, 0.2)"
    },
    "rose": {
        "primary": "#dc2626",
        "secondary": "#f43f5e",
        "shadow": "rgba(220, 38, 38, 0.2)"
    }
}

def get_smtp_config():
    """Retrieves and normalizes SMTP configuration from environment variables."""
    smtp_host = (os.getenv("HR_TOOL_SMTP_HOST") or "").strip()
    smtp_username = (os.getenv("HR_TOOL_SMTP_USERNAME") or "").strip()
    smtp_password = os.getenv("HR_TOOL_SMTP_PASSWORD") or ""
    sender = (os.getenv("HR_TOOL_SMTP_SENDER") or smtp_username).strip()
    
    smtp_port_raw = (os.getenv("HR_TOOL_SMTP_PORT") or "587").strip()
    try:
        smtp_port = int(smtp_port_raw)
    except ValueError:
        smtp_port = 587
        
    use_tls = (os.getenv("HR_TOOL_SMTP_USE_TLS") or "true").strip().lower() in {"1", "true", "yes", "on"}
    frontend_url = (os.getenv("HR_TOOL_FRONTEND_URL") or "http://localhost:5173").strip().rstrip("/")
    
    return {
        "host": smtp_host,
        "port": smtp_port,
        "username": smtp_username,
        "password": smtp_password,
        "sender": sender,
        "use_tls": use_tls,
        "frontend_url": frontend_url
    }

def generate_themed_html(
    title: str,
    preheader: str,
    welcome_text: str,
    body_html: str,
    theme: str = "blue",
    button_text: str = None,
    button_url: str = None,
    next_steps_html: str = None
) -> str:
    """Generates a premium, responsive HTML email utilizing the designated status theme."""
    t_colors = THEMES.get(theme, THEMES["blue"])
    primary = t_colors["primary"]
    secondary = t_colors["secondary"]
    shadow = t_colors["shadow"]
    
    button_section = ""
    if button_text and button_url:
        button_section = f"""
        <div class="button-container">
          <a href="{button_url}" class="action-button">{button_text}</a>
        </div>
        """
        
    next_steps_section = ""
    if next_steps_html:
        next_steps_section = f"""
        <div class="info-footer">
          {next_steps_html}
        </div>
        """
        
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <style>
    body {{
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: #f8fafc;
      color: #1e293b;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }}
    .email-container {{
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03), 0 10px 15px -3px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }}
    .email-header {{
      background: linear-gradient(135deg, {primary} 0%, {secondary} 100%);
      padding: 32px 24px;
      text-align: center;
    }}
    .email-header h1 {{
      color: #ffffff;
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.025em;
    }}
    .email-body {{
      padding: 40px 32px;
    }}
    .welcome-text {{
      font-size: 20px;
      font-weight: 600;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 16px;
    }}
    .intro-paragraph {{
      font-size: 16px;
      line-height: 1.6;
      color: #475569;
      margin-bottom: 24px;
    }}
    .details-card {{
      background-color: #f1f5f9;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      border: 1px solid #e2e8f0;
    }}
    .details-header {{
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin-top: 0;
      margin-bottom: 16px;
    }}
    .detail-row {{
      margin-bottom: 12px;
      font-size: 15px;
      line-height: 1.5;
    }}
    .detail-row:last-child {{
      margin-bottom: 0;
    }}
    .detail-label {{
      font-weight: 600;
      color: #334155;
      display: inline-block;
      width: 140px;
    }}
    .detail-value {{
      color: #0f172a;
    }}
    .button-container {{
      text-align: center;
      margin: 32px 0;
    }}
    .action-button {{
      display: inline-block;
      background-color: {primary};
      color: #ffffff !important;
      font-weight: 600;
      font-size: 16px;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px {shadow};
      transition: background-color 0.2s ease;
    }}
    .info-footer {{
      border-top: 1px solid #f1f5f9;
      padding-top: 24px;
      font-size: 14px;
      line-height: 1.5;
      color: #64748b;
    }}
    .email-footer {{
      background-color: #f8fafc;
      padding: 24px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
    }}
    .email-footer p {{
      margin: 0 0 8px 0;
    }}
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>HR Tool Portal</h1>
    </div>
    <div class="email-body">
      <h2 class="welcome-text">{welcome_text}</h2>
      <p class="intro-paragraph">{preheader}</p>
      
      {body_html}
      {button_section}
      {next_steps_section}
    </div>
    <div class="email-footer">
      <p>This is an automated system notification. Please do not reply directly to this email.</p>
      <p>&copy; {datetime.now().year} HR Tool Portal. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
"""

def save_mock_email(recipient_email: str, subject: str, plain_content: str, html_content: str = None, category: str = "general") -> str:
    """Saves the email to a local mock_emails directory for development and verification."""
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    mock_dir = os.path.join(backend_dir, "mock_emails")
    os.makedirs(mock_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_email = re.sub(r"[^a-zA-Z0-9_\-\.]", "_", recipient_email)
    filename = f"{category}_{safe_email}_{timestamp}.html"
    filepath = os.path.join(mock_dir, filename)
    
    header_info = (
        f"<!--\n"
        f"FROM: Mock Mail System\n"
        f"TO: {recipient_email}\n"
        f"SUBJECT: {subject}\n"
        f"DATE: {datetime.now().isoformat()}\n"
        f"CATEGORY: {category}\n"
        f"-->\n"
    )
    
    content = html_content if html_content else f"<pre>{plain_content}</pre>"
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(header_info + content)
        
    logger.info(f"[EMAIL MOCK] Saved simulated email ({category}) to: {filepath}")
    return filepath

def send_email(recipient_email: str, subject: str, plain_content: str, html_content: str = None, category: str = "general") -> bool:
    """Sends an email or falls back to saving it as a mock file if SMTP is not configured."""
    config = get_smtp_config()
    
    if not config["host"] or not config["sender"] or not recipient_email:
        logger.warning(
            f"[EMAIL] SMTP is not fully configured (host: '{config['host']}', sender: '{config['sender']}'). "
            f"Saving simulated email locally."
        )
        save_mock_email(recipient_email, subject, plain_content, html_content, category)
        return True

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = config["sender"]
    msg["To"] = recipient_email
    msg.set_content(plain_content)
    
    if html_content:
        msg.add_alternative(html_content, subtype="html")

    try:
        if config["use_tls"]:
            context = ssl.create_default_context()
            with smtplib.SMTP(config["host"], config["port"], timeout=10) as smtp:
                smtp.starttls(context=context)
                if config["username"] and config["password"]:
                    smtp.login(config["username"], config["password"])
                smtp.send_message(msg)
        else:
            with smtplib.SMTP(config["host"], config["port"], timeout=10) as smtp:
                if config["username"] and config["password"]:
                    smtp.login(config["username"], config["password"])
                smtp.send_message(msg)
        logger.info(f"[EMAIL] Successfully sent email ({category}) to {recipient_email}")
        return True
    except Exception:
        logger.exception(f"[EMAIL] Failed to send email to {recipient_email}")
        try:
            save_mock_email(recipient_email, subject, plain_content, html_content, category)
        except Exception as mock_ex:
            logger.error(f"[EMAIL] Also failed to write mock email: {mock_ex}")
        return False

# ---------------------------------------------------------------------------
# Specific Notification Wrappers
# ---------------------------------------------------------------------------

def send_welcome_email(recipient_email: str, full_name: str, temporary_password: str, role: str, department: str) -> bool:
    """Constructs and sends a welcome onboarding email."""
    config = get_smtp_config()
    login_url = f"{config['frontend_url']}/login"
    
    subject = f"Welcome to the Team, {full_name}!"
    
    plain_content = (
        f"Welcome to the Team, {full_name}!\n\n"
        f"Your employee account has been created.\n"
        f"Portal URL: {login_url}\n"
        f"Username/Email: {recipient_email}\n"
        f"Temporary Password: {temporary_password}\n\n"
        f"Role: {role}\n"
        f"Department: {department}\n"
    )
    
    body_html = f"""
    <div class="details-card">
      <div class="details-header">Your Login Credentials</div>
      <div class="detail-row">
        <span class="detail-label">Portal Link:</span>
        <a href="{login_url}" style="color: #4f46e5; font-weight: 500;">{login_url}</a>
      </div>
      <div class="detail-row">
        <span class="detail-label">Username/Email:</span>
        <span class="detail-value" style="font-family: monospace; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">{recipient_email}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Temp Password:</span>
        <span class="detail-value" style="font-family: monospace; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-weight: bold;">{temporary_password}</span>
      </div>
    </div>
    <div class="detail-row" style="margin-bottom: 24px;">
      <strong>Assigned Role:</strong> {role}<br>
      <strong>Department:</strong> {department}
    </div>
    """
    
    next_steps = """
    <p><strong>Next Steps:</strong> Log in using your temporary password and update it immediately via your Account Profile Settings.</p>
    """
    
    html_content = generate_themed_html(
        title=subject,
        preheader="We are thrilled to welcome you to the company! Your employee profile and system account are ready.",
        welcome_text=f"Welcome to the Team, {full_name}!",
        body_html=body_html,
        theme="blue",
        button_text="Sign In to Portal",
        button_url=login_url,
        next_steps_html=next_steps
    )
    return send_email(recipient_email, subject, plain_content, html_content, "onboarding")

def send_leave_request_notification(
    recipient_email: str,
    requester_name: str,
    leave_type: str,
    start_date: str,
    end_date: str,
    days: int,
    reason: str,
    reviewer_name: str = None,
    is_reviewer: bool = True
) -> bool:
    """Sends a leave application notice to either the reviewer (action needed) or the employee (confirmation)."""
    config = get_smtp_config()
    dashboard_url = f"{config['frontend_url']}/my-profile" # fallback dashboard link
    
    if is_reviewer:
        subject = f"Leave Request Pending Review: {requester_name}"
        welcome_text = f"Leave Request Pending Review"
        preheader = f"{requester_name} has submitted a new leave application that requires your assessment."
        theme = "blue"
        btn_text = "View Actions Dashboard"
    else:
        subject = f"Leave Request Submitted: {leave_type}"
        welcome_text = f"Leave Request Submitted Successfully"
        preheader = f"Your leave request has been submitted and is currently pending review."
        theme = "blue"
        btn_text = "View My Request"
        
    plain_content = (
        f"{preheader}\n\n"
        f"Details:\n"
        f"- Requester: {requester_name}\n"
        f"- Leave Type: {leave_type}\n"
        f"- Period: {start_date} to {end_date} ({days} day(s))\n"
        f"- Reason: {reason}\n"
        f"- Reviewer: {reviewer_name or 'N/A'}\n"
    )
    
    body_html = f"""
    <div class="details-card">
      <div class="details-header">Request Details</div>
      <div class="detail-row">
        <span class="detail-label">Employee:</span>
        <span class="detail-value">{requester_name}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Leave Type:</span>
        <span class="detail-value">{leave_type}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Period:</span>
        <span class="detail-value">{start_date} to {end_date} ({days} day(s))</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Reason:</span>
        <span class="detail-value">{reason}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Reviewer:</span>
        <span class="detail-value">{reviewer_name or 'Line Manager'}</span>
      </div>
    </div>
    """
    
    html_content = generate_themed_html(
        title=subject,
        preheader=preheader,
        welcome_text=welcome_text,
        body_html=body_html,
        theme=theme,
        button_text=btn_text,
        button_url=dashboard_url
    )
    return send_email(recipient_email, subject, plain_content, html_content, "leave_requested")

def send_leave_action_notification(
    recipient_email: str,
    requester_name: str,
    leave_type: str,
    start_date: str,
    end_date: str,
    days: int,
    status: str,
    actioned_by: str
) -> bool:
    """Notifies the employee when their leave request has been approved or rejected."""
    config = get_smtp_config()
    dashboard_url = f"{config['frontend_url']}/my-profile"
    
    is_approved = status.lower() == "approved"
    theme = "green" if is_approved else "rose"
    
    subject = f"Leave Request {status}: {leave_type}"
    welcome_text = f"Leave Request {status}"
    preheader = f"Your leave request has been actioned by {actioned_by}."
    
    plain_content = (
        f"Hello {requester_name},\n\n"
        f"Your leave request has been {status}.\n"
        f"Details:\n"
        f"- Leave Type: {leave_type}\n"
        f"- Period: {start_date} to {end_date} ({days} day(s))\n"
        f"- Actioned By: {actioned_by}\n"
    )
    
    body_html = f"""
    <div class="details-card">
      <div class="details-header">Decision Summary</div>
      <div class="detail-row">
        <span class="detail-label">Leave Type:</span>
        <span class="detail-value">{leave_type}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Period:</span>
        <span class="detail-value">{start_date} to {end_date} ({days} day(s))</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Status:</span>
        <span class="detail-value" style="font-weight: bold; color: {'#059669' if is_approved else '#dc2626'}">{status}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Actioned By:</span>
        <span class="detail-value">{actioned_by}</span>
      </div>
    </div>
    """
    
    html_content = generate_themed_html(
        title=subject,
        preheader=preheader,
        welcome_text=welcome_text,
        body_html=body_html,
        theme=theme,
        button_text="View Leave Planner",
        button_url=dashboard_url
    )
    return send_email(recipient_email, subject, plain_content, html_content, "leave_actioned")

def send_profile_update_submitted_notification(
    recipient_email: str,
    requester_name: str,
    requested_fields: list,
    note: str
) -> bool:
    """Notifies HR managers of a submitted profile update request."""
    config = get_smtp_config()
    dashboard_url = f"{config['frontend_url']}/my-profile"
    
    subject = f"Profile Update Request: {requester_name}"
    welcome_text = "Profile Update Request Submitted"
    preheader = f"A new profile update request has been submitted by {requester_name} and is awaiting review."
    
    fields_list = ", ".join(requested_fields)
    plain_content = (
        f"{preheader}\n\n"
        f"Details:\n"
        f"- Requester: {requester_name}\n"
        f"- Fields requested: {fields_list}\n"
        f"- Note: {note}\n"
    )
    
    body_html = f"""
    <div class="details-card">
      <div class="details-header">Request Summary</div>
      <div class="detail-row">
        <span class="detail-label">Requester:</span>
        <span class="detail-value">{requester_name}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Fields:</span>
        <span class="detail-value">{fields_list}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Note:</span>
        <span class="detail-value">"{note or 'N/A'}"</span>
      </div>
    </div>
    """
    
    html_content = generate_themed_html(
        title=subject,
        preheader=preheader,
        welcome_text=welcome_text,
        body_html=body_html,
        theme="amber",
        button_text="View Request",
        button_url=dashboard_url
    )
    return send_email(recipient_email, subject, plain_content, html_content, "profile_update_requested")

def send_profile_update_processed_notification(
    recipient_email: str,
    requester_name: str,
    requested_fields: list,
    status: str,
    reviewer_name: str,
    review_note: str
) -> bool:
    """Notifies the employee of the outcome of their profile update request."""
    config = get_smtp_config()
    dashboard_url = f"{config['frontend_url']}/my-profile"
    
    is_approved = status.lower() == "approved"
    theme = "green" if is_approved else "rose"
    
    subject = f"Profile Update Request {status}"
    welcome_text = f"Profile Update Request {status}"
    preheader = f"Your profile update request has been actioned by {reviewer_name}."
    
    fields_list = ", ".join(requested_fields)
    plain_content = (
        f"Hello {requester_name},\n\n"
        f"Your profile update request has been {status} by {reviewer_name}.\n"
        f"Fields: {fields_list}\n"
        f"Reviewer Note: {review_note}\n"
    )
    
    body_html = f"""
    <div class="details-card">
      <div class="details-header">Action Result</div>
      <div class="detail-row">
        <span class="detail-label">Status:</span>
        <span class="detail-value" style="font-weight: bold; color: {'#059669' if is_approved else '#dc2626'}">{status}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Fields Handled:</span>
        <span class="detail-value">{fields_list}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Reviewer Notes:</span>
        <span class="detail-value">"{review_note or 'N/A'}"</span>
      </div>
    </div>
    """
    
    html_content = generate_themed_html(
        title=subject,
        preheader=preheader,
        welcome_text=welcome_text,
        body_html=body_html,
        theme=theme,
        button_text="View Profile Status",
        button_url=dashboard_url
    )
    return send_email(recipient_email, subject, plain_content, html_content, "profile_update_processed")

def send_performance_review_cycle_created_notification(
    recipient_email: str,
    employee_name: str,
    cycle_title: str,
    department: str,
    deadline: str,
    target_audience: str
) -> bool:
    """Notifies employees that a new performance review cycle has been started."""
    config = get_smtp_config()
    dashboard_url = f"{config['frontend_url']}/my-profile"
    
    subject = f"Active Review Cycle: {cycle_title}"
    welcome_text = "New Performance Review Cycle Started"
    preheader = f"Hello {employee_name}, a new performance review cycle has been initiated and requires your input."
    
    plain_content = (
        f"{preheader}\n\n"
        f"Cycle Details:\n"
        f"- Title: {cycle_title}\n"
        f"- Department: {department}\n"
        f"- Target Audience: {target_audience}\n"
        f"- Submission Deadline: {deadline}\n"
    )
    
    body_html = f"""
    <div class="details-card">
      <div class="details-header">Cycle details</div>
      <div class="detail-row">
        <span class="detail-label">Cycle Title:</span>
        <span class="detail-value">{cycle_title}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Department:</span>
        <span class="detail-value">{department}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Target:</span>
        <span class="detail-value">{target_audience}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Deadline:</span>
        <span class="detail-value" style="font-weight: bold; color: #d97706;">{deadline}</span>
      </div>
    </div>
    """
    
    html_content = generate_themed_html(
        title=subject,
        preheader=preheader,
        welcome_text=welcome_text,
        body_html=body_html,
        theme="blue",
        button_text="Start Review Submission",
        button_url=dashboard_url
    )
    return send_email(recipient_email, subject, plain_content, html_content, "review_cycle_created")

def send_performance_review_submitted_notification(
    recipient_email: str,
    employee_name: str,
    cycle_title: str,
    document_filename: str
) -> bool:
    """Notifies the manager or HR that a staff member has uploaded their self-review response."""
    config = get_smtp_config()
    dashboard_url = f"{config['frontend_url']}/my-profile"
    
    subject = f"Performance Review Uploaded: {employee_name}"
    welcome_text = "Performance Review Submitted"
    preheader = f"{employee_name} has submitted their performance review for '{cycle_title}'."
    
    plain_content = (
        f"{preheader}\n\n"
        f"Submission Details:\n"
        f"- Employee: {employee_name}\n"
        f"- Cycle: {cycle_title}\n"
        f"- Document Name: {document_filename}\n"
    )
    
    body_html = f"""
    <div class="details-card">
      <div class="details-header">Submission details</div>
      <div class="detail-row">
        <span class="detail-label">Employee:</span>
        <span class="detail-value">{employee_name}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Cycle:</span>
        <span class="detail-value">{cycle_title}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">File Uploaded:</span>
        <span class="detail-value" style="font-family: monospace;">{document_filename or 'SelfReview.pdf'}</span>
      </div>
    </div>
    """
    
    html_content = generate_themed_html(
        title=subject,
        preheader=preheader,
        welcome_text=welcome_text,
        body_html=body_html,
        theme="amber",
        button_text="Go to Review Portal",
        button_url=dashboard_url
    )
    return send_email(recipient_email, subject, plain_content, html_content, "review_submitted")

def send_performance_review_assessed_notification(
    recipient_email: str,
    employee_name: str,
    cycle_title: str,
    manager_name: str,
    manager_comment: str
) -> bool:
    """Notifies the employee that their line manager has assessed their performance review."""
    config = get_smtp_config()
    dashboard_url = f"{config['frontend_url']}/my-profile"
    
    subject = f"Performance Review Assessed: {cycle_title}"
    welcome_text = "Review Assessment Completed"
    preheader = f"Hello {employee_name}, your performance review for '{cycle_title}' has been assessed by {manager_name}."
    
    plain_content = (
        f"{preheader}\n\n"
        f"Assessment Details:\n"
        f"- Manager: {manager_name}\n"
        f"- Manager Comments: {manager_comment}\n"
    )
    
    body_html = f"""
    <div class="details-card">
      <div class="details-header">Assessment Feedback</div>
      <div class="detail-row">
        <span class="detail-label">Assessed By:</span>
        <span class="detail-value">{manager_name}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Comments:</span>
        <span class="detail-value">"{manager_comment}"</span>
      </div>
    </div>
    """
    
    html_content = generate_themed_html(
        title=subject,
        preheader=preheader,
        welcome_text=welcome_text,
        body_html=body_html,
        theme="amber",
        button_text="View Full Review",
        button_url=dashboard_url
    )
    return send_email(recipient_email, subject, plain_content, html_content, "review_assessed")

def send_performance_review_scored_notification(
    recipient_email: str,
    employee_name: str,
    cycle_title: str,
    hr_name: str,
    hr_score: float,
    hr_notes: str
) -> bool:
    """Notifies the employee that their review cycle is fully scored and closed."""
    config = get_smtp_config()
    dashboard_url = f"{config['frontend_url']}/my-profile"
    
    subject = f"Performance Review Completed: {cycle_title}"
    welcome_text = "Review Cycle Completed & Scored"
    preheader = f"Hello {employee_name}, your performance review for '{cycle_title}' has been scored by HR."
    
    plain_content = (
        f"{preheader}\n\n"
        f"Final Details:\n"
        f"- Scored By: {hr_name}\n"
        f"- Score: {hr_score}/5.0\n"
        f"- Notes: {hr_notes}\n"
    )
    
    body_html = f"""
    <div class="details-card">
      <div class="details-header">Final Outcome</div>
      <div class="detail-row">
        <span class="detail-label">Completed By:</span>
        <span class="detail-value">{hr_name}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">HR Score:</span>
        <span class="detail-value" style="font-weight: bold; color: #059669; font-size: 16px;">{hr_score} / 5.0</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">HR Notes:</span>
        <span class="detail-value">"{hr_notes or 'N/A'}"</span>
      </div>
    </div>
    """
    
    html_content = generate_themed_html(
        title=subject,
        preheader=preheader,
        welcome_text=welcome_text,
        body_html=body_html,
        theme="green",
        button_text="View Final Results",
        button_url=dashboard_url
    )
    return send_email(recipient_email, subject, plain_content, html_content, "review_completed")
