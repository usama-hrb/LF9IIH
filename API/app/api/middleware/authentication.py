from django.conf import settings
import jwt


class AuthenticationMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        token = request.COOKIES.get(settings.TOKEN_ACCESS_NAME)
        if token:
            try:
                payload = jwt.decode(
                    token, settings.JWT_SECRET_KEY, algorithms=["HS256"]
                )
                request.code = payload.get("code")
                print(f"✅ Auth: Valid token for code: {request.code} | Path: {request.path}")
            except jwt.ExpiredSignatureError:
                request.code = None
                print(f"❌ Auth: Token expired | Path: {request.path}")
            except jwt.InvalidTokenError:
                request.code = None
                print(f"❌ Auth: Invalid token | Path: {request.path}")
        else:
            request.code = None
            # Only log for API paths (ignore static files)
            if request.path.startswith('/api/'):
                print(f"⚠️  Auth: No token found | Path: {request.path} | Cookies: {list(request.COOKIES.keys())}")

        response = self.get_response(request)
        return response
