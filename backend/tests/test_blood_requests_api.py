import unittest
import uuid
from datetime import datetime, timezone, timedelta
from unittest.mock import patch
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.db.session import SessionLocal
from app.models.blood_request import BloodRequest
from app.services.crypto import PhoneCryptoService


class TestBloodRequestsAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.db: Session = SessionLocal()
        cls.created_request_ids = []

    @classmethod
    def tearDownClass(cls):
        # Clean up any test records created during test run
        if cls.created_request_ids:
            cls.db.query(BloodRequest).filter(
                BloodRequest.id.in_(cls.created_request_ids)
            ).delete(synchronize_session=False)
            cls.db.commit()
        cls.db.close()

    def test_create_blood_request_success_and_encryption(self):
        future_date = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
        payload = {
            "blood_group": "A+",
            "division": "Dhaka",
            "district": "Dhaka",
            "upazila": "Mirpur",
            "units_required": 2,
            "required_by": future_date,
            "hospital_name": "Mirpur General Hospital (Demo)",
            "medical_reason": "Scheduled Surgery (Demo)",
            "additional_notes": "Urgent requirement for surgery",
            "contact_name": "Synthetic Test Contact",
            "contact_phone": "01812345678",
        }

        response = self.client.post("/api/v1/blood-requests", json=payload)
        self.assertEqual(response.status_code, 201, f"Failed: {response.text}")
        data = response.json()

        # Verify returned public structure
        self.assertIn("id", data)
        req_id = uuid.UUID(data["id"])
        self.created_request_ids.append(req_id)

        self.assertEqual(data["blood_group"], "A+")
        self.assertEqual(data["division"], "Dhaka")
        self.assertEqual(data["district"], "Dhaka")
        self.assertEqual(data["upazila"], "Mirpur")
        self.assertEqual(data["units_required"], 2)
        self.assertEqual(data["hospital_name"], "Mirpur General Hospital (Demo)")
        self.assertEqual(data["request_status"], "pending")
        self.assertEqual(data["contact_name"], "Synthetic Test Contact")
        self.assertEqual(data["contact_phone_masked"], "+880 18**-***678")

        # Verify privacy: sensitive fields strictly excluded
        self.assertNotIn("contact_phone_encrypted", data)
        self.assertNotIn("01812345678", str(data))

        # Inspect database record directly to verify true encryption at rest
        db_req = self.db.query(BloodRequest).filter(BloodRequest.id == req_id).first()
        self.assertIsNotNone(db_req)
        self.assertNotEqual(db_req.contact_phone_encrypted, "01812345678")
        self.assertNotIn("01812345678", db_req.contact_phone_encrypted)

        # Confirm decrypted value matches original input
        decrypted_phone = PhoneCryptoService.decrypt_phone(db_req.contact_phone_encrypted)
        self.assertEqual(decrypted_phone, "01812345678")

    def test_create_blood_request_invalid_blood_group(self):
        payload = {
            "blood_group": "INVALID+",
            "division": "Dhaka",
            "district": "Dhaka",
            "upazila": "Mirpur",
            "units_required": 1,
            "required_by": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
            "hospital_name": "Demo Hospital",
            "contact_name": "Demo User",
            "contact_phone": "01712345678",
        }
        response = self.client.post("/api/v1/blood-requests", json=payload)
        self.assertEqual(response.status_code, 422)

    def test_create_blood_request_zero_or_negative_units(self):
        # Test zero units
        payload_zero = {
            "blood_group": "O+",
            "division": "Dhaka",
            "district": "Dhaka",
            "upazila": "Mirpur",
            "units_required": 0,
            "required_by": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
            "hospital_name": "Demo Hospital",
            "contact_name": "Demo User",
            "contact_phone": "01712345678",
        }
        resp_zero = self.client.post("/api/v1/blood-requests", json=payload_zero)
        self.assertEqual(resp_zero.status_code, 422)

        # Test negative units
        payload_neg = payload_zero.copy()
        payload_neg["units_required"] = -2
        resp_neg = self.client.post("/api/v1/blood-requests", json=payload_neg)
        self.assertEqual(resp_neg.status_code, 422)

    def test_create_blood_request_missing_required_fields(self):
        # Missing contact_phone
        payload = {
            "blood_group": "B+",
            "division": "Dhaka",
            "district": "Dhaka",
            "upazila": "Mirpur",
            "units_required": 1,
            "required_by": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
            "hospital_name": "Demo Hospital",
            "contact_name": "Demo User",
        }
        response = self.client.post("/api/v1/blood-requests", json=payload)
        self.assertEqual(response.status_code, 422)

    def test_create_blood_request_invalid_dates(self):
        # Past date
        past_date = (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()
        payload_past = {
            "blood_group": "AB+",
            "division": "Dhaka",
            "district": "Dhaka",
            "upazila": "Mirpur",
            "units_required": 1,
            "required_by": past_date,
            "hospital_name": "Demo Hospital",
            "contact_name": "Demo User",
            "contact_phone": "01712345678",
        }
        resp_past = self.client.post("/api/v1/blood-requests", json=payload_past)
        self.assertEqual(resp_past.status_code, 422)

        # Malformed date string
        payload_malformed = payload_past.copy()
        payload_malformed["required_by"] = "invalid-date-format"
        resp_malformed = self.client.post("/api/v1/blood-requests", json=payload_malformed)
        self.assertEqual(resp_malformed.status_code, 422)

    def test_list_blood_requests_and_filters(self):
        future_date = (datetime.now(timezone.utc) + timedelta(days=3)).isoformat()
        payload_o = {
            "blood_group": "O+",
            "division": "Chittagong",
            "district": "Chittagong",
            "upazila": "Kotwali",
            "units_required": 1,
            "required_by": future_date,
            "hospital_name": "Chittagong Medical Hospital (Demo)",
            "contact_name": "Ctg Contact",
            "contact_phone": "01899999999",
        }
        resp_o = self.client.post("/api/v1/blood-requests", json=payload_o)
        self.assertEqual(resp_o.status_code, 201)
        req_id_o = uuid.UUID(resp_o.json()["id"])
        self.created_request_ids.append(req_id_o)

        payload_b = {
            "blood_group": "B+",
            "division": "Sylhet",
            "district": "Sylhet",
            "upazila": "Kotwali",
            "units_required": 3,
            "required_by": future_date,
            "hospital_name": "Sylhet MAG Osmani (Demo)",
            "contact_name": "Sylhet Contact",
            "contact_phone": "01788888888",
        }
        resp_b = self.client.post("/api/v1/blood-requests", json=payload_b)
        self.assertEqual(resp_b.status_code, 201)
        req_id_b = uuid.UUID(resp_b.json()["id"])
        self.created_request_ids.append(req_id_b)

        # 1. Filter by blood_group O+
        resp_filter_o = self.client.get("/api/v1/blood-requests?blood_group=O+")
        self.assertEqual(resp_filter_o.status_code, 200)
        items = resp_filter_o.json()
        self.assertTrue(any(r["id"] == str(req_id_o) for r in items))
        for r in items:
            self.assertEqual(r["blood_group"], "O+")
            self.assertNotIn("contact_phone_encrypted", r)

        # 2. Filter by division Sylhet
        resp_filter_div = self.client.get("/api/v1/blood-requests?division=Sylhet")
        self.assertEqual(resp_filter_div.status_code, 200)
        items_sylhet = resp_filter_div.json()
        self.assertTrue(any(r["id"] == str(req_id_b) for r in items_sylhet))

        # 3. Filter by invalid request status -> 400
        resp_invalid_status = self.client.get("/api/v1/blood-requests?request_status=non_existent_status")
        self.assertEqual(resp_invalid_status.status_code, 400)

    def test_pagination_limits(self):
        # Valid limit
        resp_limit = self.client.get("/api/v1/blood-requests?limit=2&offset=0")
        self.assertEqual(resp_limit.status_code, 200)

        # Zero limit -> 422
        resp_zero_limit = self.client.get("/api/v1/blood-requests?limit=0")
        self.assertEqual(resp_zero_limit.status_code, 422)

        # Exceeds max limit 100 -> 422
        resp_excess_limit = self.client.get("/api/v1/blood-requests?limit=101")
        self.assertEqual(resp_excess_limit.status_code, 422)

    def test_get_blood_request_by_id(self):
        future_date = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
        payload = {
            "blood_group": "AB-",
            "division": "Rajshahi",
            "district": "Rajshahi",
            "upazila": "Boalia",
            "units_required": 1,
            "required_by": future_date,
            "hospital_name": "Rajshahi Medical (Demo)",
            "contact_name": "Rajshahi Contact",
            "contact_phone": "01766666666",
        }
        create_resp = self.client.post("/api/v1/blood-requests", json=payload)
        self.assertEqual(create_resp.status_code, 201)
        req_id = create_resp.json()["id"]
        self.created_request_ids.append(uuid.UUID(req_id))

        # Successful fetch
        resp = self.client.get(f"/api/v1/blood-requests/{req_id}")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["blood_group"], "AB-")
        self.assertEqual(data["contact_phone_masked"], "+880 17**-***666")
        self.assertNotIn("contact_phone_encrypted", data)

        # 404 for nonexistent UUID
        random_id = str(uuid.uuid4())
        resp_404 = self.client.get(f"/api/v1/blood-requests/{random_id}")
        self.assertEqual(resp_404.status_code, 404)

        # 422 for malformed UUID
        resp_malformed = self.client.get("/api/v1/blood-requests/not-a-valid-uuid")
        self.assertEqual(resp_malformed.status_code, 422)

    def test_database_error_safe_response(self):
        """Confirm database error returns HTTP 500 without leaking raw connection strings or stack traces."""
        future_date = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
        payload = {
            "blood_group": "B-",
            "division": "Dhaka",
            "district": "Dhaka",
            "upazila": "Mirpur",
            "units_required": 1,
            "required_by": future_date,
            "hospital_name": "Demo Hospital",
            "contact_name": "Demo Contact",
            "contact_phone": "01755555555",
        }
        with patch.object(Session, "commit", side_effect=Exception("Simulated unexpected database failure")):
            response = self.client.post("/api/v1/blood-requests", json=payload)
            self.assertEqual(response.status_code, 500)
            data = response.json()
            # Ensure generic safe message is returned
            self.assertIn("Failed to register blood request in database", data["detail"])
            self.assertNotIn("password", str(data).lower())
            self.assertNotIn("postgresql://", str(data).lower())


if __name__ == "__main__":
    unittest.main()

