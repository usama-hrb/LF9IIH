from .utils import send_verification_email, generate_user_tokens, encode
from rest_framework.exceptions import ValidationError, NotAuthenticated
from django.utils.decorators import method_decorator
from rest_framework.response import Response
from django.http import HttpResponse
from django.urls import get_resolver
from rest_framework import generics
from django.conf import settings
from http import HTTPStatus
from functools import wraps
from .models import Doctor
import re
from .serializers import (
    code_serializer,
    token_serializer,
    signup_serializer,
    get_me_serializer,
    login_serializer,
)


def list_endpoints(request):
    """
    View to list all configured Django endpoints with their URL parameters, rendered as HTML.
    """
    resolver = get_resolver()
    urls = []

    def collect_urls(patterns, prefix=""):
        for pattern in patterns:
            if hasattr(pattern, "url_patterns"):
                new_prefix = (
                    prefix.rstrip("/") + "/" + str(pattern.pattern).lstrip("/")
                    if prefix
                    else str(pattern.pattern).lstrip("/")
                )
                collect_urls(pattern.url_patterns, new_prefix)
            else:
                pattern_str = ""
                if hasattr(pattern.pattern, "_route"):
                    pattern_str = pattern.pattern._route
                elif hasattr(pattern.pattern, "regex"):
                    pattern_str = str(pattern.pattern.regex.pattern)
                else:
                    pattern_str = str(pattern.pattern)

                path = (
                    prefix.rstrip("/") + "/" + pattern_str.lstrip("/")
                    if prefix
                    else pattern_str.lstrip("/")
                )
                path = re.sub(r"<(\w+):(\w+)>", r":\2(\1)", path)
                urls.append({"path": path})

    collect_urls(resolver.url_patterns)
    html = """
    <html>
    <head>
        <title>Django Endpoints</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            ul { list-style-type: none; padding: 0; }
            li { margin: 5px 0; padding: 3px 20px; }
            .path { font-family: monospace; color: #0066cc; }
            .path:hover { text-decoration: underline; cursor: pointer; }
        </style>
    </head>
    <body>
        <h1>Configured Django Endpoints</h1>
        <ul>
    """
    for url in urls:
        html += f"<li><a href='/{url['path']}' class='path'>{url['path']}</a></li>"
    html += """
        </ul>
    </body>
    </html>
    """

    return HttpResponse(html)


def authentication_decorator(func):
    @wraps(func)
    def wrapper(request, *args, **kwargs):
        doctor_code = getattr(request, "code", None)
        if not doctor_code:
            raise NotAuthenticated("Authentication credentials were not provided.")
        doctor = Doctor.objects.filter(code=doctor_code).first()
        if not doctor:
            raise NotAuthenticated("User not found")
        request.doctor = doctor
        return func(request, *args, **kwargs)

    return wrapper


class reset_password_view(generics.GenericAPIView):
    def get(self, request, *args, **kwargs):
        pass  # Implementation not shown

    def post(self, request, *args, **kwargs):
        pass  # Implementation not shown


class get_me_view(generics.GenericAPIView):
    queryset = Doctor.objects.all()
    serializer_class = get_me_serializer

    @method_decorator(authentication_decorator)
    def get(self, request, *args, **kwargs):
        user_serializer = get_me_serializer(request.doctor)
        user = user_serializer.data
        return Response(user, status=HTTPStatus.OK)


class verify_account_view(generics.GenericAPIView):
    def get(self, request, *args, **kwargs):
        # token = request.query_params.get("token", None)
        # if not token:
        #     raise ValidationError("Token is required")
        # try:
        #     code = decode(token)
        #     user = Doctor.objects.get(code=code)
        #     if user.verified:
        #         raise ValidationError("User is already verified")
        #     user.verified = True
        #     user.save()
        #     success = success_serializer(data={})
        #     success.is_valid(raise_exception=False)
        #     return Response(success.data)
        # except Doctor.DoesNotExist:
        #     raise ValidationError("Invalid token")
        # except Exception as e:
        #     raise ValidationError(str(e))
        pass


class login_view(generics.GenericAPIView):
    queryset = Doctor.objects.all()
    serializer_class = login_serializer

    def post(self, request, *args, **kwargs):
        """
        User login, verify code, generate tokens
        return success response with tokens in cookies
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        code = serializer.validated_data["code"]
        # Allow login for any existing user code, regardless of verification status
        user = Doctor.objects.filter(code=code).first()
        if not user:
            raise ValidationError("Invalid code")
        
        # Generate tokens (returns: cookie_string, access_token, refresh_token, access_cookie_dict, refresh_cookie_dict)
        tokens_result = generate_user_tokens(code)
        access_cookie_dict = tokens_result[3]
        refresh_cookie_dict = tokens_result[4]
        
        # Debug: Print cookies being set
        print(f"🔐 Login successful for code: {code}")
        print(f"🍪 Setting _access cookie with SameSite={access_cookie_dict.get('samesite')}")
        print(f"🍪 Setting _refresh cookie with SameSite={refresh_cookie_dict.get('samesite')}")
        
        user_serializer = get_me_serializer(user)
        user_data = user_serializer.data
        
        # Create response and set cookies using the proper method
        response = Response(user_data, status=HTTPStatus.OK)
        response.set_cookie(
            key=settings.TOKEN_ACCESS_NAME,
            value=tokens_result[1],
            **access_cookie_dict
        )
        response.set_cookie(
            key=settings.TOKEN_REFRESH_NAME,
            value=tokens_result[2],
            **refresh_cookie_dict
        )
        return response


class signup_view(generics.CreateAPIView):
    queryset = Doctor.objects.all()
    serializer_class = signup_serializer

    def user_exists(self, email):
        """
        Check if user with email exists, raise ValidationError if so
        """
        if Doctor.objects.filter(email=email, verified=False).exists():
            raise ValidationError(
                "User with this email already exists but is not verified."
            )
        elif Doctor.objects.filter(email=email, verified=True).exists():
            raise ValidationError("User with this email already exists.")

    def create(self, request, *args, **kwargs):
        """
        Verify Posted Data, check if user exists, create user, generate tokens,
        send verification email, return success response with refresh and access tokens in cookies
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        self.user_exists(email)
        serializer.save()
        user = Doctor.objects.get(email=email)
        
        # Generate tokens (returns: cookie_string, access_token, refresh_token, access_cookie_dict, refresh_cookie_dict)
        tokens_result = generate_user_tokens(user.code)
        access_token = tokens_result[1]
        refresh_token = tokens_result[2]
        access_cookie_dict = tokens_result[3]
        refresh_cookie_dict = tokens_result[4]
        
        verify_token = encode(minutes=10, code=user.code)
        send_verification_email(email, f"<verification_link>?token={verify_token}")
        
        if settings.ENV == "development":
            res = token_serializer(
                {
                    "access": access_token,
                    "refresh": refresh_token,
                    "code": user.code,
                }
            )
            response = Response(res.data, status=HTTPStatus.CREATED)
        else:
            code = code_serializer({"code": user.code})
            response = Response(code.data, status=HTTPStatus.CREATED)
        
        # Set cookies using the proper method
        response.set_cookie(
            key=settings.TOKEN_ACCESS_NAME,
            value=access_token,
            **access_cookie_dict
        )
        response.set_cookie(
            key=settings.TOKEN_REFRESH_NAME,
            value=refresh_token,
            **refresh_cookie_dict
        )
        return response
