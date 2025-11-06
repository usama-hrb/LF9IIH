from django.conf import settings
import jwt
from http import cookies
from datetime import datetime, timedelta
from typing import Tuple


def validate_password(password: str) -> Tuple[bool, str]:
    """Validate password and return (valid, first_error_message_or_empty_string)."""

    if not isinstance(password, str):
        return False, "Password must be a string."

    n = len(password)
    if n < settings.POLICY["min_length"]:
        return (
            False,
            f"Password must be at least {settings.POLICY['min_length']} characters.",
        )
    if n > settings.POLICY["max_length"]:
        return (
            False,
            f"Password must be at most {settings.POLICY['max_length']} characters.",
        )

    # character class checks (return on first failure)
    if settings.POLICY["require_upper"] and not any(c.isupper() for c in password):
        return False, "Password must include an uppercase letter."
    if settings.POLICY["require_lower"] and not any(c.islower() for c in password):
        return False, "Password must include a lowercase letter."
    if settings.POLICY["require_digit"] and not any(c.isdigit() for c in password):
        return False, "Password must include a digit."
    if settings.POLICY["require_special"] and not any(
        c in settings.POLICY["special_chars"] for c in password
    ):
        return False, "Password must include a special character."

    # common password substring check
    low = password.lower()
    for common in settings.POLICY["common_passwords"]:
        if common in low:
            return False, "Password contains a commonly used substring."

    # consecutive identical characters check
    if settings.POLICY["max_consecutive"] and settings.POLICY["max_consecutive"] >= 1:
        cur = 1
        for a, b in zip(password, password[1:]):
            if a == b:
                cur += 1
                if cur > settings.POLICY["max_consecutive"]:
                    return (
                        False,
                        f"No more than {settings.POLICY['max_consecutive']} identical characters in a row allowed.",
                    )
            else:
                cur = 1
    return True, ""


def generate_user_tokens(code):
    """
    Generate access and refresh tokens for a user with proper cookie security flags
    Returns: (cookie_string, access_token, refresh_token, access_cookie_dict, refresh_cookie_dict)
    """
    # Determine environment for cookie security settings
    is_prod = not getattr(settings, "DEBUG", False) and getattr(settings, "ENV", "production") != "development"
    
    # Generate token values
    access_token = encode(minutes=int(settings.TOKEN_ACCESS_LIFETIME), code=code)
    refresh_token = encode(minutes=int(settings.TOKEN_REFRESH_LIFETIME), code=code)
    
    # Prepare cookie configuration dictionaries for Django's response.set_cookie()
    access_cookie_dict = {
        "httponly": True,
        "path": "/",
        "samesite": "None" if is_prod else "Lax",
    }
    
    refresh_cookie_dict = {
        "httponly": True,
        "path": "/api/auth/refresh/",
        "samesite": "None" if is_prod else "Lax",
    }
    
    # Add secure flag in production
    if is_prod:
        access_cookie_dict["secure"] = True
        refresh_cookie_dict["secure"] = True
    
    # For backward compatibility, also create SimpleCookie output
    cookie = cookies.SimpleCookie()
    cookie[settings.TOKEN_ACCESS_NAME] = access_token
    cookie[settings.TOKEN_ACCESS_NAME]["httponly"] = True
    cookie[settings.TOKEN_ACCESS_NAME]["path"] = "/"
    cookie[settings.TOKEN_ACCESS_NAME]["samesite"] = access_cookie_dict["samesite"]
    if is_prod:
        cookie[settings.TOKEN_ACCESS_NAME]["secure"] = True
    
    cookie[settings.TOKEN_REFRESH_NAME] = refresh_token
    cookie[settings.TOKEN_REFRESH_NAME]["httponly"] = True
    cookie[settings.TOKEN_REFRESH_NAME]["path"] = "/api/auth/refresh/"
    cookie[settings.TOKEN_REFRESH_NAME]["samesite"] = refresh_cookie_dict["samesite"]
    if is_prod:
        cookie[settings.TOKEN_REFRESH_NAME]["secure"] = True

    return (
        cookie.output(header="", sep=""),
        access_token,
        refresh_token,
        access_cookie_dict,
        refresh_cookie_dict,
    )


def encode(minutes=15, **kwargs):
    """
    Encode user data into a jwt token
    """
    payload = {"exp": datetime.now() + timedelta(minutes=minutes)}
    for k, v in kwargs.items():
        payload[k] = v
    token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm="HS256")
    return token


def decode(token):
    """
    Decode a jwt token
    """
    return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=["HS256"])


def send_verification_email(email, verification_link):
    """
    send verification email to user
    """
    return
    # msg = MIMEMultipart()
    # msg["From"] = settings.GOOGLE_EMAIL_SENDER
    # msg["To"] = email
    # msg["Subject"] = "Email Verification"
    # text = f"Welcome! Please verify your account by clicking this link:\n{verification_link}"
    # html = f"""
    #     <html>
    #     <body>
    #         <p>Welcome!<br>
    #         Please verify your account by clicking this link:<br>
    #         <a href="{verification_link}">Verify Account</a>
    #         </p>
    #     </body>
    #     </html>
    # """
    # msg.attach(MIMEText(text, "plain"))
    # msg.attach(MIMEText(html, "html"))
    # server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
    # server.starttls()
    # server.login(settings.SMTP_USERNAME, settings.SMTP_APP_PASSWORD)
    # server.sendmail(settings.SMTP_USERNAME, email, msg.as_string())
    # server.quit()
