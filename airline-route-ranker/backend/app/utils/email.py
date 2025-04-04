"""
Email utilities for sending contact form messages.
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Email configuration
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "asadismaeel@gmail.com")

# Log configuration (without password)
logger.info(f"Email configuration loaded - Server: {SMTP_SERVER}, Port: {SMTP_PORT}")
logger.info(f"Username: {SMTP_USERNAME}, Admin Email: {ADMIN_EMAIL}")
if not SMTP_USERNAME or not SMTP_PASSWORD:
    logger.warning("SMTP credentials not fully configured - email sending will be disabled")


def send_contact_email(name: str, email: str, subject: str, message: str) -> bool:
    """
    Send an email from the contact form.
    
    Args:
        name: The sender's name
        email: The sender's email address
        subject: The email subject
        message: The email message body
    
    Returns:
        bool: True if the email was sent successfully, False otherwise
    """
    logger.info(f"Attempting to send contact email from {email} with subject: {subject}")
    
    if not SMTP_USERNAME or not SMTP_PASSWORD:
        logger.error("SMTP credentials not configured. Email sending is disabled.")
        return False
    
    try:
        # Create message container
        msg = MIMEMultipart()
        msg['From'] = SMTP_USERNAME
        msg['To'] = ADMIN_EMAIL
        msg['Subject'] = f"Contact Form: {subject}"
        logger.info(f"Email will be sent from {SMTP_USERNAME} to {ADMIN_EMAIL}")
        
        # Create HTML body with formatted contact information
        html_message = f"""
        <html>
        <body>
            <h2>Contact Form Submission</h2>
            <p><strong>From:</strong> {name} ({email})</p>
            <p><strong>Subject:</strong> {subject}</p>
            <div style="margin-top: 20px; padding: 10px; border-left: 4px solid #ccc;">
                {message.replace('\n', '<br>')}
            </div>
        </body>
        </html>
        """
        
        # Attach HTML part
        msg.attach(MIMEText(html_message, 'html'))
        logger.info("Message content created successfully")
        
        # Connect to SMTP server
        logger.info(f"Connecting to SMTP server {SMTP_SERVER}:{SMTP_PORT}")
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        logger.info(f"Attempting login with username: {SMTP_USERNAME}")
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        
        # Send email
        logger.info("Sending email message")
        server.send_message(msg)
        server.quit()
        
        logger.info(f"Contact email sent successfully from {email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send contact email: {e}")
        # Add more detailed error information
        import traceback
        logger.error(traceback.format_exc())
        return False 