"""
API tests for the Payment app endpoints.

All tests use direct URL paths and patch authentication-related decorators
to avoid JWT logic. Decorators are patched at the pay.views module level.
"""

from decimal import Decimal
from unittest.mock import patch
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework.exceptions import ValidationError

from doctor.models import Doctor
from student.models import Student
from pay.models import Payment


class PaymentAPITestCase(TestCase):
    """Base test case with shared setup and decorator patches."""

    @classmethod
    def setUpTestData(cls):
        """Create test data: two doctors with students and baseline payments."""
        # Doctor A with two students
        cls.doctor_a = Doctor.objects.create(
            code="654654",
            first_name="Alice",
            last_name="Anderson",
            email="alice@example.com",
            phone_number="1234567890",
            password="hashedpassword",
        )
        cls.student_1 = Student.objects.create(
            code="123456",  # Numeric-looking code for int:student converter
            first_name="Bob",
            last_name="Brown",
            email="bob@example.com",
            phone_number="1111111111",
            doctor=cls.doctor_a,
        )
        cls.student_2 = Student.objects.create(
            code="234567",
            first_name="Charlie",
            last_name="Clark",
            email="charlie@example.com",
            phone_number="2222222222",
            doctor=cls.doctor_a,
        )

        # Doctor B with one student
        cls.doctor_b = Doctor.objects.create(
            code="321654",
            first_name="Diana",
            last_name="Davis",
            email="diana@example.com",
            phone_number="9876543210",
            password="hashedpassword",
        )
        cls.student_3 = Student.objects.create(
            code="345678",
            first_name="Eve",
            last_name="Evans",
            email="eve@example.com",
            phone_number="3333333333",
            doctor=cls.doctor_b,
        )

        # Create baseline payments for sorting/filtering tests
        cls.payment_1 = Payment.objects.create(
            doctor=cls.doctor_a,
            student=cls.student_1,
            amount=Decimal("100.50"),
            month=1,
            year=2024,
        )
        cls.payment_2 = Payment.objects.create(
            doctor=cls.doctor_a,
            student=cls.student_1,
            amount=Decimal("200.75"),
            month=2,
            year=2024,
        )
        cls.payment_3 = Payment.objects.create(
            doctor=cls.doctor_a,
            student=cls.student_2,
            amount=Decimal("150.00"),
            month=1,
            year=2024,
        )
        cls.payment_4 = Payment.objects.create(
            doctor=cls.doctor_b,
            student=cls.student_3,
            amount=Decimal("300.00"),
            month=1,
            year=2024,
        )
        cls.payment_5 = Payment.objects.create(
            doctor=cls.doctor_a,
            student=cls.student_1,
            amount=Decimal("175.25"),
            month=12,
            year=2023,
        )

    def setUp(self):
        """Set up API client for each test."""
        self.client = APIClient()


class CreatePaymentViewTests(PaymentAPITestCase):
    """Tests for POST /payments/{code}/create endpoint."""

    def _mock_authentication_decorator(self, doctor):
        """
        Factory to create authentication decorator mock.
        Sets request.doctor and request.code from the given doctor.
        """

        def decorator(view_func):
            def wrapper(request, *args, **kwargs):
                request.doctor = doctor
                request.code = doctor.code
                return view_func(request, *args, **kwargs)

            return wrapper

        return decorator

    def _mock_student_action_decorator(self):
        """
        Mock student_action_decorator.
        Resolves request.student from kwargs["student"] and enforces doctor ownership.
        """

        def decorator(view_func):
            def wrapper(request, *args, **kwargs):
                student_code = kwargs.get("student")
                try:
                    student = Student.objects.get(code=student_code)
                except Student.DoesNotExist:
                    raise ValidationError("Student not found")

                if student.doctor.code != request.code:
                    raise ValidationError("Permission denied")

                request.student = student
                return view_func(request, *args, **kwargs)

            return wrapper

        return decorator

    @patch("pay.views.authentication_decorator")
    @patch("pay.views.student_action_decorator")
    def test_create_payment_new(self, mock_student_action, mock_auth):
        """201: Creates new payment when none exists for (student, month, year)."""
        mock_auth.side_effect = self._mock_authentication_decorator(self.doctor_a)
        mock_student_action.side_effect = self._mock_student_action_decorator()

        initial_count = Payment.objects.count()
        data = {"amount": "125.50", "month": 3, "year": 2024}

        response = self.client.post(
            f"/payments/{self.student_1.code}/create", data, format="json"
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Payment.objects.count(), initial_count + 1)

        new_payment = Payment.objects.get(student=self.student_1, month=3, year=2024)
        self.assertEqual(new_payment.amount, Decimal("125.50"))
        self.assertEqual(new_payment.doctor, self.doctor_a)

    @patch("pay.views.authentication_decorator")
    @patch("pay.views.student_action_decorator")
    def test_create_payment_update_existing(self, mock_student_action, mock_auth):
        """201: Updates amount when payment exists for (student, month, year)."""
        mock_auth.side_effect = self._mock_authentication_decorator(self.doctor_a)
        mock_student_action.side_effect = self._mock_student_action_decorator()

        initial_count = Payment.objects.count()
        data = {"amount": "999.99", "month": 1, "year": 2024}

        response = self.client.post(
            f"/payments/{self.student_1.code}/create", data, format="json"
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Payment.objects.count(), initial_count)  # No new row

        updated_payment = Payment.objects.get(
            student=self.student_1, month=1, year=2024
        )
        self.assertEqual(updated_payment.amount, Decimal("999.99"))

    @patch("pay.views.authentication_decorator")
    @patch("pay.views.student_action_decorator")
    def test_create_payment_month_too_low(self, mock_student_action, mock_auth):
        """400: Validation error when month < 1."""
        mock_auth.side_effect = self._mock_authentication_decorator(self.doctor_a)
        mock_student_action.side_effect = self._mock_student_action_decorator()

        data = {"amount": "100.00", "month": 0, "year": 2024}

        response = self.client.post(
            f"/payments/{self.student_1.code}/create", data, format="json"
        )

        self.assertEqual(response.status_code, 400)

    @patch("pay.views.authentication_decorator")
    @patch("pay.views.student_action_decorator")
    def test_create_payment_month_too_high(self, mock_student_action, mock_auth):
        """400: Validation error when month > 12."""
        mock_auth.side_effect = self._mock_authentication_decorator(self.doctor_a)
        mock_student_action.side_effect = self._mock_student_action_decorator()

        data = {"amount": "100.00", "month": 13, "year": 2024}

        response = self.client.post(
            f"/payments/{self.student_1.code}/create", data, format="json"
        )

        self.assertEqual(response.status_code, 400)

    @patch("pay.views.authentication_decorator")
    @patch("pay.views.student_action_decorator")
    def test_create_payment_year_too_low(self, mock_student_action, mock_auth):
        """400: Validation error when year < 2000."""
        mock_auth.side_effect = self._mock_authentication_decorator(self.doctor_a)
        mock_student_action.side_effect = self._mock_student_action_decorator()

        data = {"amount": "100.00", "month": 1, "year": 1999}

        response = self.client.post(
            f"/payments/{self.student_1.code}/create", data, format="json"
        )

        self.assertEqual(response.status_code, 400)

    @patch("pay.views.authentication_decorator")
    @patch("pay.views.student_action_decorator")
    def test_create_payment_year_too_high(self, mock_student_action, mock_auth):
        """400: Validation error when year > 2100."""
        mock_auth.side_effect = self._mock_authentication_decorator(self.doctor_a)
        mock_student_action.side_effect = self._mock_student_action_decorator()

        data = {"amount": "100.00", "month": 1, "year": 2101}

        response = self.client.post(
            f"/payments/{self.student_1.code}/create", data, format="json"
        )

        self.assertEqual(response.status_code, 400)

    @patch("pay.views.authentication_decorator")
    @patch("pay.views.student_action_decorator")
    def test_create_payment_permission_denied(self, mock_student_action, mock_auth):
        """400: Permission denied when doctor tries to create for another doctor's student."""
        mock_auth.side_effect = self._mock_authentication_decorator(self.doctor_a)
        mock_student_action.side_effect = self._mock_student_action_decorator()

        data = {"amount": "100.00", "month": 5, "year": 2024}

        # student_3 belongs to doctor_b, but request is from doctor_a
        response = self.client.post(
            f"/payments/{self.student_3.code}/create", data, format="json"
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("Permission denied", str(response.data))

    @patch("pay.views.authentication_decorator")
    @patch("pay.views.student_action_decorator")
    def test_create_payment_student_not_found(self, mock_student_action, mock_auth):
        """400: Student not found with invalid code."""
        mock_auth.side_effect = self._mock_authentication_decorator(self.doctor_a)
        mock_student_action.side_effect = self._mock_student_action_decorator()

        data = {"amount": "100.00", "month": 5, "year": 2024}

        response = self.client.post("/payments/999999/create", data, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertIn("Student not found", str(response.data))


class DoctorPaymentViewTests(PaymentAPITestCase):
    """Tests for GET /payments/all?month=&year= endpoint."""

    def _mock_authentication_decorator(self, doctor):
        """Mock authentication decorator."""

        def decorator(view_func):
            def wrapper(request, *args, **kwargs):
                request.doctor = doctor
                request.code = doctor.code
                return view_func(request, *args, **kwargs)

            return wrapper

        return decorator

    def _mock_year_month_decorator(self):
        """Mock year_month_decorator to read from query params."""

        def decorator(view_func):
            def wrapper(request, *args, **kwargs):
                try:
                    request.month = int(request.query_params.get("month"))
                    request.year = int(request.query_params.get("year"))
                except (TypeError, ValueError):
                    raise ValidationError("month/year required")
                return view_func(request, *args, **kwargs)

            return wrapper

        return decorator

    @patch("pay.views.authentication_decorator")
    @patch("pay.views.year_month_decorator")
    def test_doctor_payment_view_filters_by_month_year(
        self, mock_year_month, mock_auth
    ):
        """200: Returns only payments matching month/year for doctor's students."""
        mock_auth.side_effect = self._mock_authentication_decorator(self.doctor_a)
        mock_year_month.side_effect = self._mock_year_month_decorator()

        response = self.client.get("/payments/all?month=1&year=2024")

        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.data, list)

        # Doctor A has 2 students
        self.assertEqual(len(response.data), 2)

    @patch("pay.views.authentication_decorator")
    @patch("pay.views.year_month_decorator")
    def test_doctor_payment_view_includes_all_students(
        self, mock_year_month, mock_auth
    ):
        """200: Includes all doctor's students even if no payments that month."""
        mock_auth.side_effect = self._mock_authentication_decorator(self.doctor_a)
        mock_year_month.side_effect = self._mock_year_month_decorator()

        # Query month/year with no payments for student_2
        response = self.client.get("/payments/all?month=2&year=2024")

        self.assertEqual(response.status_code, 200)
        # Should still include both students
        self.assertEqual(len(response.data), 2)

    @patch("pay.views.authentication_decorator")
    @patch("pay.views.year_month_decorator")
    def test_doctor_payment_view_excludes_other_doctors(
        self, mock_year_month, mock_auth
    ):
        """200: Excludes payments from other doctors."""
        mock_auth.side_effect = self._mock_authentication_decorator(self.doctor_a)
        mock_year_month.side_effect = self._mock_year_month_decorator()

        response = self.client.get("/payments/all?month=1&year=2024")

        self.assertEqual(response.status_code, 200)

        # Doctor A should not see doctor B's student
        student_codes = [student.get("code") for student in response.data]
        self.assertNotIn(self.student_3.code, student_codes)

    @patch("pay.views.authentication_decorator")
    @patch("pay.views.year_month_decorator")
    def test_doctor_payment_view_ordering(self, mock_year_month, mock_auth):
        """200: Students ordered by first_name, last_name."""
        mock_auth.side_effect = self._mock_authentication_decorator(self.doctor_a)
        mock_year_month.side_effect = self._mock_year_month_decorator()

        response = self.client.get("/payments/all?month=1&year=2024")

        self.assertEqual(response.status_code, 200)
        # Bob Brown should come before Charlie Clark
        first_names = [student.get("first_name") for student in response.data]
        self.assertEqual(first_names[0], "Bob")
        self.assertEqual(first_names[1], "Charlie")


class StudentPaymentViewTests(PaymentAPITestCase):
    """Tests for GET /payments/{code}/all endpoint."""

    def _mock_authentication_decorator(self, doctor):
        """Mock authentication decorator."""

        def decorator(view_func):
            def wrapper(request, *args, **kwargs):
                request.doctor = doctor
                request.code = doctor.code
                return view_func(request, *args, **kwargs)

            return wrapper

        return decorator

    def _mock_student_action_decorator(self):
        """Mock student_action_decorator."""

        def decorator(view_func):
            def wrapper(request, *args, **kwargs):
                student_code = kwargs.get("student")
                try:
                    student = Student.objects.get(code=student_code)
                except Student.DoesNotExist:
                    raise ValidationError("Student not found")

                if student.doctor.code != request.code:
                    raise ValidationError("Permission denied")

                request.student = student
                return view_func(request, *args, **kwargs)

            return wrapper

        return decorator

    @patch("pay.views.authentication_decorator")
    @patch("pay.views.student_action_decorator")
    def test_student_payment_view_returns_student_payments(
        self, mock_student_action, mock_auth
    ):
        """200: Returns only that student's payments."""
        mock_auth.side_effect = self._mock_authentication_decorator(self.doctor_a)
        mock_student_action.side_effect = self._mock_student_action_decorator()

        response = self.client.get(f"/payments/{self.student_1.code}/all")

        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.data, list)

        # student_1 has 3 payments
        self.assertEqual(len(response.data), 3)

    @patch("pay.views.authentication_decorator")
    @patch("pay.views.student_action_decorator")
    def test_student_payment_view_ordering(self, mock_student_action, mock_auth):
        """200: Payments ordered by -year, -month."""
        mock_auth.side_effect = self._mock_authentication_decorator(self.doctor_a)
        mock_student_action.side_effect = self._mock_student_action_decorator()

        response = self.client.get(f"/payments/{self.student_1.code}/all")

        self.assertEqual(response.status_code, 200)

        # Expected order: 2024/2, 2024/1, 2023/12
        payments = response.data
        self.assertEqual(payments[0]["year"], 2024)
        self.assertEqual(payments[0]["month"], 2)
        self.assertEqual(payments[1]["year"], 2024)
        self.assertEqual(payments[1]["month"], 1)
        self.assertEqual(payments[2]["year"], 2023)
        self.assertEqual(payments[2]["month"], 12)

    @patch("pay.views.authentication_decorator")
    @patch("pay.views.student_action_decorator")
    def test_student_payment_view_permission_denied(
        self, mock_student_action, mock_auth
    ):
        """400: Permission denied for mismatched doctor."""
        mock_auth.side_effect = self._mock_authentication_decorator(self.doctor_a)
        mock_student_action.side_effect = self._mock_student_action_decorator()

        # Try to access doctor_b's student
        response = self.client.get(f"/payments/{self.student_3.code}/all")

        self.assertEqual(response.status_code, 400)
        self.assertIn("Permission denied", str(response.data))

    @patch("pay.views.authentication_decorator")
    @patch("pay.views.student_action_decorator")
    def test_student_payment_view_student_not_found(
        self, mock_student_action, mock_auth
    ):
        """400: Student not found with invalid code."""
        mock_auth.side_effect = self._mock_authentication_decorator(self.doctor_a)
        mock_student_action.side_effect = self._mock_student_action_decorator()

        response = self.client.get("/payments/999999/all")

        self.assertEqual(response.status_code, 400)
        self.assertIn("Student not found", str(response.data))


class GetAllPaymentsViewTests(PaymentAPITestCase):
    """Tests for GET /payments/total endpoint."""

    def _mock_authentication_decorator(self, doctor):
        """Mock authentication decorator."""

        def decorator(view_func):
            def wrapper(request, *args, **kwargs):
                request.doctor = doctor
                request.code = doctor.code
                return view_func(request, *args, **kwargs)

            return wrapper

        return decorator

    @patch("pay.views.authentication_decorator")
    def test_get_total_payments_correct_sum(self, mock_auth):
        """200: Total equals sum of doctor's payments only."""
        mock_auth.side_effect = self._mock_authentication_decorator(self.doctor_a)

        response = self.client.get("/payments/total")

        self.assertEqual(response.status_code, 200)

        # Doctor A's payments: 100.50 + 200.75 + 150.00 + 175.25 = 626.50
        expected_total = Decimal("626.50")
        actual_total = Decimal(str(response.data["total"]))

        self.assertEqual(actual_total, expected_total)

    @patch("pay.views.authentication_decorator")
    def test_get_total_payments_excludes_other_doctors(self, mock_auth):
        """200: Total excludes other doctors' payments."""
        mock_auth.side_effect = self._mock_authentication_decorator(self.doctor_b)

        response = self.client.get("/payments/total")

        self.assertEqual(response.status_code, 200)

        # Doctor B has only one payment: 300.00
        expected_total = Decimal("300.00")
        actual_total = Decimal(str(response.data["total"]))

        self.assertEqual(actual_total, expected_total)

    @patch("pay.views.authentication_decorator")
    def test_get_total_payments_no_payments(self, mock_auth):
        """200: Returns 0.0 when doctor has no payments."""
        # Create new doctor with no payments
        doctor_c = Doctor.objects.create(
            code="DOC003",
            first_name="Frank",
            last_name="Foster",
            email="frank@example.com",
            phone_number="5555555555",
            password="hashedpassword",
        )

        mock_auth.side_effect = self._mock_authentication_decorator(doctor_c)

        response = self.client.get("/payments/total")

        self.assertEqual(response.status_code, 200)

        actual_total = Decimal(str(response.data["total"]))
        self.assertEqual(actual_total, Decimal("0.0"))

    @patch("pay.views.authentication_decorator")
    def test_get_total_payments_decimal_precision(self, mock_auth):
        """200: Maintains decimal precision in total."""
        mock_auth.side_effect = self._mock_authentication_decorator(self.doctor_a)

        # Create payment with precise decimal
        Payment.objects.create(
            doctor=self.doctor_a,
            student=self.student_1,
            amount=Decimal("0.01"),
            month=6,
            year=2024,
        )

        response = self.client.get("/payments/total")

        self.assertEqual(response.status_code, 200)

        # Total should now be 626.51
        expected_total = Decimal("626.51")
        actual_total = Decimal(str(response.data["total"]))

        self.assertEqual(actual_total, expected_total)
