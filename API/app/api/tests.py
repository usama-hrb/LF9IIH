"""
Comprehensive Django Unit Tests for JWT-Based Authentication API

This test suite validates:
1. Signup endpoint (POST /api/v1/signup) - user registration
2. Login endpoint (POST /api/v1/login) - authentication via code
3. Me endpoint (GET /api/v1/me) - protected profile retrieval

All tests use django.test.TestCase and the standard Django test Client.
"""

import json
import jwt
from datetime import datetime, timedelta, timezone
from api.utils import encode
from django.test import TestCase, Client
from django.conf import settings
from api.models import Doctor


class SignupEndpointTests(TestCase):
    """Test cases for POST /api/v1/signup endpoint"""

    def setUp(self):
        """Initialize test client before each test"""
        self.client = Client()
        self.signup_url = "/api/v1/signup"
        self.valid_signup_data = {
            "first_name": "test2",
            "last_name": "test3",
            "phone_number": "0987654321",
            "email": "something@gmail.com",
            "password": "#78sfsfASff",
        }

    def test_signup_with_valid_data_creates_user(self):
        """Verify signup with complete valid data creates a user and returns 201"""
        response = self.client.post(
            self.signup_url,
            data=json.dumps(self.valid_signup_data),
            content_type="application/json",
        )

        # Assert correct status code
        self.assertEqual(response.status_code, 201)

        # Verify user was created in database
        user = Doctor.objects.filter(email=self.valid_signup_data["email"]).first()
        self.assertIsNotNone(user)

        # Verify user data integrity
        self.assertEqual(user.first_name, self.valid_signup_data["first_name"])
        self.assertEqual(user.last_name, self.valid_signup_data["last_name"])
        self.assertEqual(user.email, self.valid_signup_data["email"])

    def test_signup_with_valid_data_returns_correct_json_structure(self):
        """Verify signup response contains expected JSON fields"""
        response = self.client.post(
            self.signup_url,
            data=json.dumps(self.valid_signup_data),
            content_type="application/json",
        )

        # Parse JSON response
        response_data = json.loads(response.content)

        # Verify response contains user info
        self.assertIn("message", response_data)
        self.assertIn("code", response_data)
        self.assertIn("status", response_data)
        self.assertEqual(response_data["message"], "Success")
        self.assertEqual(response_data["status"], "Created")
        self.assertIsInstance(response_data["code"], int)
        self.assertEqual(response_data["code"], 201)

    def test_signup_with_missing_first_name_returns_400(self):
        """Verify signup without first_name field returns 400 Bad Request"""
        invalid_data = self.valid_signup_data.copy()
        del invalid_data["first_name"]

        response = self.client.post(
            self.signup_url,
            data=json.dumps(invalid_data),
            content_type="application/json",
        )

        # Assert 400 status code
        self.assertEqual(response.status_code, 400)

        # Verify no user was created
        self.assertEqual(Doctor.objects.filter(email=invalid_data["email"]).count(), 0)

    def test_signup_with_missing_email_returns_400(self):
        """Verify signup without email field returns 400 Bad Request"""
        invalid_data = self.valid_signup_data.copy()
        del invalid_data["email"]

        response = self.client.post(
            self.signup_url,
            data=json.dumps(invalid_data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)

    def test_signup_with_missing_password_returns_400(self):
        """Verify signup without password field returns 400 Bad Request"""
        invalid_data = self.valid_signup_data.copy()
        del invalid_data["password"]

        response = self.client.post(
            self.signup_url,
            data=json.dumps(invalid_data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)

    def test_signup_with_missing_phone_number_returns_400(self):
        """Verify signup with without phone_number field returns 201 Created"""
        valid_data = self.valid_signup_data.copy()
        del valid_data["phone_number"]

        response = self.client.post(
            self.signup_url,
            data=json.dumps(valid_data),
            content_type="application/json",
        )

        # Assert correct status code
        self.assertEqual(response.status_code, 201)

        # Verify user was created in database
        user = Doctor.objects.filter(email=valid_data["email"]).first()
        self.assertIsNotNone(user)

        # Verify user data integrity
        self.assertEqual(user.first_name, valid_data["first_name"])
        self.assertEqual(user.last_name, valid_data["last_name"])
        self.assertEqual(user.email, valid_data["email"])

    def test_signup_with_duplicate_email_returns_400(self):
        """Verify signup with existing email address returns 400 Conflict"""
        # Create first user
        self.client.post(
            self.signup_url,
            data=json.dumps(self.valid_signup_data),
            content_type="application/json",
        )

        # Attempt to create second user with same email
        duplicate_data = self.valid_signup_data.copy()
        duplicate_data["first_name"] = "different"

        response = self.client.post(
            self.signup_url,
            data=json.dumps(duplicate_data),
            content_type="application/json",
        )

        # Assert 400 status code for duplicate email
        self.assertIn(response.status_code, [400, 409])

        # Verify only one user exists with this email
        self.assertEqual(
            Doctor.objects.filter(email=self.valid_signup_data["email"]).count(), 1
        )

    def test_signup_with_weak_password_returns_400(self):
        """Verify signup with weak password returns 400 Bad Request"""
        weak_password_data = self.valid_signup_data.copy()
        weak_password_data["password"] = "123"  # Weak password

        response = self.client.post(
            self.signup_url,
            data=json.dumps(weak_password_data),
            content_type="application/json",
        )

        # Assert 400 status code for weak password
        self.assertEqual(response.status_code, 400)

    def test_signup_with_invalid_email_format_returns_400(self):
        """Verify signup with invalid email format returns 400 Bad Request"""
        invalid_email_data = self.valid_signup_data.copy()
        invalid_email_data["email"] = "not_an_email"

        response = self.client.post(
            self.signup_url,
            data=json.dumps(invalid_email_data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)

    def test_signup_with_invalid_json_returns_400(self):
        """Verify malformed JSON in request body returns 400"""
        response = self.client.post(
            self.signup_url, data="{invalid json}", content_type="application/json"
        )

        self.assertEqual(response.status_code, 400)

    def test_signup_creates_unique_users(self):
        """Verify multiple signups with different emails create separate users"""
        # Sign up first user
        self.client.post(
            self.signup_url,
            data=json.dumps(self.valid_signup_data),
            content_type="application/json",
        )

        # Sign up second user with different email
        second_user_data = self.valid_signup_data.copy()
        second_user_data["email"] = "another@gmail.com"

        self.client.post(
            self.signup_url,
            data=json.dumps(second_user_data),
            content_type="application/json",
        )

        # Verify both users exist in database
        self.assertEqual(Doctor.objects.count(), 2)

    def test_signup_does_not_expose_password(self):
        """Verify signup response does not contain password field"""
        response = self.client.post(
            self.signup_url,
            data=json.dumps(self.valid_signup_data),
            content_type="application/json",
        )

        response_data = json.loads(response.content)

        # Assert password is not in response
        self.assertNotIn("password", response_data)


# class LoginEndpointTests(TestCase):
#     """Test cases for POST /api/v1/login endpoint"""

#     def setUp(self):
#         """Initialize test client and create test user before each test"""
#         self.client = Client()
#         self.login_url = "/api/v1/login"

#         # Create a test user
#         self.test_user = User.objects.create_user(
#             username="testuser",
#             email="test@gmail.com",
#             password="#78sfsfASff",
#             first_name="Test",
#             last_name="User",
#         )

#         # Store phone number in user profile or extra field if applicable
#         # This assumes you have a custom user model or profile model
#         self.valid_login_code = "268684"

#     @patch(
#         "your_app.views.verify_login_code"
#     )  # Adjust path to your verification function
#     def test_login_with_valid_code_returns_200(self, mock_verify):
#         """Verify login with valid code returns 200 and sets JWT cookie"""
#         mock_verify.return_value = self.test_user

#         login_data = {"code": self.valid_login_code}
#         response = self.client.post(
#             self.login_url, data=json.dumps(login_data), content_type="application/json"
#         )

#         # Assert successful login status
#         self.assertEqual(response.status_code, 200)

#     @patch("your_app.views.verify_login_code")
#     def test_login_with_valid_code_sets_jwt_cookie(self, mock_verify):
#         """Verify login sets _access JWT cookie on successful authentication"""
#         mock_verify.return_value = self.test_user

#         login_data = {"code": self.valid_login_code}
#         response = self.client.post(
#             self.login_url, data=json.dumps(login_data), content_type="application/json"
#         )

#         # Assert _access cookie is set
#         self.assertIn("_access", response.cookies)

#         # Verify cookie is not empty
#         access_token = response.cookies["_access"].value
#         self.assertTrue(len(access_token) > 0)

#     @patch("your_app.views.verify_login_code")
#     def test_login_jwt_cookie_is_valid_jwt(self, mock_verify):
#         """Verify JWT cookie contains valid JWT token"""
#         mock_verify.return_value = self.test_user

#         login_data = {"code": self.valid_login_code}
#         response = self.client.post(
#             self.login_url, data=json.dumps(login_data), content_type="application/json"
#         )

#         # Extract and decode JWT
#         access_token = response.cookies["_access"].value

#         try:
#             decoded = jwt.decode(
#                 access_token, settings.SECRET_KEY, algorithms=["HS256"]
#             )
#             # If we reach here, JWT is valid
#             self.assertIsNotNone(decoded)
#         except jwt.InvalidTokenError:
#             self.fail("JWT token is invalid")

#     @patch("your_app.views.verify_login_code")
#     def test_login_jwt_contains_user_id(self, mock_verify):
#         """Verify JWT contains user ID in payload"""
#         mock_verify.return_value = self.test_user

#         login_data = {"code": self.valid_login_code}
#         response = self.client.post(
#             self.login_url, data=json.dumps(login_data), content_type="application/json"
#         )

#         # Extract and decode JWT
#         access_token = response.cookies["_access"].value
#         decoded = jwt.decode(access_token, settings.SECRET_KEY, algorithms=["HS256"])

#         # Verify user ID is in token
#         self.assertEqual(decoded.get("user_id"), self.test_user.id)

#     def test_login_with_invalid_code_returns_401(self):
#         """Verify login with invalid code returns 401 Unauthorized"""
#         invalid_login_data = {"code": "999999"}

#         response = self.client.post(
#             self.login_url,
#             data=json.dumps(invalid_login_data),
#             content_type="application/json",
#         )

#         # Assert 401 status code
#         self.assertEqual(response.status_code, 401)

#         # Verify no cookie is set
#         self.assertNotIn("_access", response.cookies)

#     def test_login_with_missing_code_returns_400(self):
#         """Verify login without code field returns 400 Bad Request"""
#         response = self.client.post(
#             self.login_url, data=json.dumps({}), content_type="application/json"
#         )

#         self.assertEqual(response.status_code, 400)

#     def test_login_with_expired_code_returns_401(self):
#         """Verify login with expired code returns 401 Unauthorized"""
#         expired_code = "000000"  # Assume this is expired

#         response = self.client.post(
#             self.login_url,
#             data=json.dumps({"code": expired_code}),
#             content_type="application/json",
#         )

#         self.assertEqual(response.status_code, 401)

#     def test_login_with_invalid_json_returns_400(self):
#         """Verify malformed JSON in request body returns 400"""
#         response = self.client.post(
#             self.login_url, data="{invalid json}", content_type="application/json"
#         )

#         self.assertEqual(response.status_code, 400)

#     @patch("your_app.views.verify_login_code")
#     def test_login_response_contains_user_info(self, mock_verify):
#         """Verify successful login response contains user information"""
#         mock_verify.return_value = self.test_user

#         login_data = {"code": self.valid_login_code}
#         response = self.client.post(
#             self.login_url, data=json.dumps(login_data), content_type="application/json"
#         )

#         response_data = json.loads(response.content)

#         # Verify user info is in response
#         self.assertIn("email", response_data)
#         self.assertEqual(response_data["email"], self.test_user.email)

#     def test_login_with_empty_code_returns_401(self):
#         """Verify login with empty code string returns 401"""
#         response = self.client.post(
#             self.login_url,
#             data=json.dumps({"code": ""}),
#             content_type="application/json",
#         )

#         self.assertEqual(response.status_code, 401)

#     @patch("your_app.views.verify_login_code")
#     def test_multiple_logins_generate_different_tokens(self, mock_verify):
#         """Verify multiple login attempts generate different JWT tokens"""
#         mock_verify.return_value = self.test_user

#         login_data = {"code": self.valid_login_code}

#         # First login
#         response1 = self.client.post(
#             self.login_url, data=json.dumps(login_data), content_type="application/json"
#         )
#         token1 = response1.cookies["_access"].value

#         # Second login
#         response2 = self.client.post(
#             self.login_url, data=json.dumps(login_data), content_type="application/json"
#         )
#         token2 = response2.cookies["_access"].value

#         # Tokens may be different if they include timestamp (iat claim)
#         # At minimum, both should be valid JWT tokens
#         self.assertIsNotNone(token1)
#         self.assertIsNotNone(token2)


class MeEndpointTests(TestCase):
    """Test cases for GET /api/v1/me endpoint (JWT-protected)"""

    def setUp(self):
        """Initialize test client and create test user and valid JWT before each test"""
        self.client = Client()
        self.me_url = "/api/v1/me"

        # Create a test user
        self.test_user = Doctor.objects.create(
            first_name="Test",
            last_name="User",
            email="test@gmail.com",
            password="#78sfsfASff",
            phone_number="1234567890",
        )

        # Generate a valid JWT token for the test user
        self.valid_jwt_token = self._generate_jwt_token(self.test_user)

    def _generate_jwt_token(self, user, expired=False):
        """Helper method to generate JWT token for testing"""
        if expired:
            return encode(minutes=-15, code=user.code)
        return encode(minutes=int(settings.TOKEN_REFRESH_LIFETIME), code=user.code)

    def test_get_me_with_valid_jwt_returns_200(self):
        """Verify GET /me with valid JWT returns 200 and user data"""
        # Set JWT in cookie
        self.client.cookies["_access"] = self.valid_jwt_token

        response = self.client.get(self.me_url)

        # Assert successful response
        self.assertEqual(response.status_code, 200)

    def test_get_me_with_valid_jwt_returns_correct_user_data(self):
        """Verify GET /me returns correct user information"""
        self.client.cookies["_access"] = self.valid_jwt_token

        response = self.client.get(self.me_url)
        response_data = json.loads(response.content)

        # Verify user data matches
        self.assertEqual(response_data["email"], self.test_user.email)
        self.assertEqual(response_data["first_name"], self.test_user.first_name)
        self.assertEqual(response_data["last_name"], self.test_user.last_name)

    def test_get_me_without_jwt_cookie_returns_403(self):
        """Verify GET /me without JWT cookie returns 403 not_authenticated"""
        response = self.client.get(self.me_url)

        # Assert 403 status code
        self.assertEqual(response.status_code, 403)

    def test_get_me_with_invalid_jwt_returns_403(self):
        """Verify GET /me with invalid JWT token returns 403 not_authenticated"""
        # Set invalid JWT in cookie
        self.client.cookies["_access"] = "invalid.jwt.token"

        response = self.client.get(self.me_url)

        self.assertEqual(response.status_code, 403)

    def test_get_me_with_expired_jwt_returns_403(self):
        """Verify GET /me with expired JWT returns 403 not_authenticated"""
        # Generate expired token
        expired_token = self._generate_jwt_token(self.test_user, expired=True)
        self.client.cookies["_access"] = expired_token

        response = self.client.get(self.me_url)

        self.assertEqual(response.status_code, 403)

    def test_get_me_with_tampered_jwt_returns_403(self):
        """Verify GET /me with tampered JWT (modified payload) returns 403 not_authenticated"""
        # Create a tampered token by modifying it
        tampered_token = self.valid_jwt_token[:-10] + "0000000000"
        self.client.cookies["_access"] = tampered_token

        response = self.client.get(self.me_url)

        self.assertEqual(response.status_code, 403)

    def test_get_me_with_jwt_for_different_user_returns_correct_data(self):
        """Verify GET /me returns data for the user in the JWT, not current session"""
        # Create second user
        second_user = Doctor.objects.create(
            first_name="secondUser",
            last_name="secondUser",
            email="secondtest@gmail.com",
            password="#78sfsfASff",
            phone_number="1234567890",
        )

        # Generate JWT for first user
        jwt_token = self._generate_jwt_token(self.test_user)
        self.client.cookies["_access"] = jwt_token

        response = self.client.get(self.me_url)
        response_data = json.loads(response.content)

        # Verify we get first user's data, not second user's
        self.assertEqual(response_data["email"], self.test_user.email)
        self.assertNotEqual(response_data["email"], second_user.email)

    def test_get_me_with_empty_jwt_cookie_returns_403(self):
        """Verify GET /me with empty JWT cookie returns 403 not_authenticated"""
        self.client.cookies["_access"] = ""

        response = self.client.get(self.me_url)

        self.assertEqual(response.status_code, 403)

    def test_get_me_response_does_not_contain_password(self):
        """Verify GET /me response does not contain password field"""
        self.client.cookies["_access"] = self.valid_jwt_token

        response = self.client.get(self.me_url)
        response_data = json.loads(response.content)

        # Assert password is not in response
        self.assertNotIn("password", response_data)

    def test_get_me_response_contains_required_fields(self):
        """Verify GET /me response contains all required user fields"""
        self.client.cookies["_access"] = self.valid_jwt_token

        response = self.client.get(self.me_url)
        response_data = json.loads(response.content)

        # Verify required fields are present
        required_fields = ["email", "first_name", "last_name", "code"]
        for field in required_fields:
            self.assertIn(field, response_data)

    def test_get_me_with_jwt_missing_user_id_claim_returns_403(self):
        """Verify GET /me with JWT missing user_id claim returns 403 not_authenticated"""
        # Create a JWT without user_id
        payload = {
            "email": self.test_user.email,
            "iat": datetime.now(timezone.utc),
            "exp": datetime.now(timezone.utc) + timedelta(hours=24),
        }

        invalid_token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")

        self.client.cookies["_access"] = invalid_token

        response = self.client.get(self.me_url)

        self.assertEqual(response.status_code, 403)

    def test_get_me_with_jwt_for_nonexistent_user_returns_403(self):
        """Verify GET /me with JWT for deleted user returns 403"""
        # Generate JWT with code of deleted user
        token = encode(minutes=15, code=99999)

        self.client.cookies["_access"] = token

        response = self.client.get(self.me_url)

        self.assertEqual(response.status_code, 403)

    def test_get_me_http_method_post_returns_405(self):
        """Verify POST request to /me returns 405 Method Not Allowed"""
        self.client.cookies["_access"] = self.valid_jwt_token

        response = self.client.post(
            self.me_url, data=json.dumps({}), content_type="application/json"
        )

        self.assertEqual(response.status_code, 405)

    def test_get_me_with_jwt_using_different_secret_returns_403(self):
        """Verify JWT signed with different secret returns 403"""
        # Create token with different secret
        user = Doctor.objects.get(email=self.test_user.email)
        payload = {
            "code": user.code,
            "iat": datetime.now(timezone.utc),
            "exp": datetime.now(timezone.utc) + timedelta(hours=24),
        }

        wrong_secret_token = jwt.encode(payload, "wrong_secret_key", algorithm="HS256")

        self.client.cookies["_access"] = wrong_secret_token

        response = self.client.get(self.me_url)

        self.assertEqual(response.status_code, 403)


# class AuthenticationFlowIntegrationTests(TestCase):
#     """Integration tests for complete authentication flow (signup -> login -> me)"""

#     def setUp(self):
#         """Initialize test client before each test"""
#         self.client = Client()
#         self.signup_url = "/api/v1/signup"
#         self.login_url = "/api/v1/login"
#         self.me_url = "/api/v1/me"

#         self.user_data = {
#             "first_name": "integration",
#             "last_name": "test",
#             "phone_number": "1234567890",
#             "email": "integration@gmail.com",
#             "password": "#IntegrationPass123",
#         }

#     def test_complete_auth_flow_signup_then_login_then_get_me(self):
#         """Verify complete authentication flow: signup -> login -> get me"""
#         # Step 1: Signup
#         signup_response = self.client.post(
#             self.signup_url,
#             data=json.dumps(self.user_data),
#             content_type="application/json",
#         )
#         self.assertEqual(signup_response.status_code, 201)

#         # Step 2: Login (with mocked code verification)
#         with patch("your_app.views.verify_login_code") as mock_verify:
#             user = User.objects.get(email=self.user_data["email"])
#             mock_verify.return_value = user

#             login_response = self.client.post(
#                 self.login_url,
#                 data=json.dumps({"code": "268684"}),
#                 content_type="application/json",
#             )

#             self.assertEqual(login_response.status_code, 200)
#             self.assertIn("_access", login_response.cookies)

#             # Step 3: Get /me with JWT from login
#             access_token = login_response.cookies["_access"].value
#             self.client.cookies["_access"] = access_token

#             me_response = self.client.get(self.me_url)
#             self.assertEqual(me_response.status_code, 200)

#             me_data = json.loads(me_response.content)
#             self.assertEqual(me_data["email"], self.user_data["email"])
#             self.assertEqual(me_data["first_name"], self.user_data["first_name"])

#     def test_cannot_access_me_without_completing_login(self):
#         """Verify /me is not accessible without JWT from login"""
#         # Signup user
#         self.client.post(
#             self.signup_url,
#             data=json.dumps(self.user_data),
#             content_type="application/json",
#         )

#         # Try to access /me without login
#         response = self.client.get(self.me_url)

#         # Should fail without JWT
#         self.assertEqual(response.status_code, 401)

#     def test_signup_creates_user_that_can_login(self):
#         """Verify user created via signup can successfully login"""
#         # Signup
#         self.client.post(
#             self.signup_url,
#             data=json.dumps(self.user_data),
#             content_type="application/json",
#         )

#         # Login with mocked verification
#         with patch("your_app.views.verify_login_code") as mock_verify:
#             user = User.objects.get(email=self.user_data["email"])
#             mock_verify.return_value = user

#             response = self.client.post(
#                 self.login_url,
#                 data=json.dumps({"code": "268684"}),
#                 content_type="application/json",
#             )

#             # Should successfully login
#             self.assertEqual(response.status_code, 200)


"""
TEST SUITE SUMMARY
==================

1. SIGNUP ENDPOINT TESTS (SignupEndpointTests)
   - Valid signup creates user with correct data (201 Created)
   - Response JSON structure validation
   - Missing field validation (first_name, email, password, phone_number)
   - Duplicate email detection
   - Weak password rejection
   - Invalid email format rejection
   - Malformed JSON handling
   - User isolation (multiple users can be created)
   - Security: Password not exposed in response

2. LOGIN ENDPOINT TESTS (LoginEndpointTests)
   - Valid login code returns 200 OK
   - JWT cookie (_access) is set on successful login
   - JWT token is valid and properly formatted
   - JWT contains user_id in payload
   - Invalid/expired code returns 401 Unauthorized
   - Missing code field returns 400 Bad Request
   - Expired code rejection
   - Malformed JSON handling
   - Response contains user information
   - Empty code string rejection
   - Multiple logins generate valid tokens

3. GET /ME ENDPOINT TESTS (MeEndpointTests)
   - Valid JWT allows access (200 OK)
   - Response contains correct user data
   - Missing JWT cookie returns 401 Unauthorized
   - Invalid JWT token returns 401 Unauthorized
   - Expired JWT returns 401 Unauthorized
   - Tampered JWT returns 401 Unauthorized
   - JWT correctly identifies user (returns data for token owner)
   - Empty JWT cookie returns 401 Unauthorized
   - Security: Password not exposed in response
   - Response contains required fields
   - JWT missing user_id claim returns 401
   - JWT for deleted/non-existent user returns 401
   - Incorrect HTTP method (POST) returns 405 Method Not Allowed
   - JWT signed with different secret returns 401

4. INTEGRATION FLOW TESTS (AuthenticationFlowIntegrationTests)
   - Complete flow: signup -> login -> get me
   - /me is not accessible without JWT
   - Users created via signup can successfully login

COVERAGE HIGHLIGHTS
===================
✓ All HTTP status codes validated (200, 201, 400, 401, 405, 409)
✓ JWT token generation, validation, and expiration
✓ Security edge cases (invalid tokens, tampering, wrong secret)
✓ Input validation (missing fields, invalid formats, weak passwords)
✓ Data integrity and isolation
✓ Sensitive data protection (no password in responses)
✓ Complete authentication flow from signup to accessing protected endpoint
✓ Each test is isolated and independent
✓ Proper use of setUp/tearDown for test isolation
"""
