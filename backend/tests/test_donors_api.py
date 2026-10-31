import unittest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.db.session import SessionLocal
from app.models.donor import Donor
from app.services.crypto import PhoneCryptoService


class TestDonorsAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.db: Session = SessionLocal()
        cls.created_donor_ids = []

    @classmethod
    def tearDownClass(cls):
        # Clean up any test records created during testing
        if cls.created_donor_ids:
            cls.db.query(Donor).filter(Donor.id.in_(cls.created_donor_ids)).delete(synchronize_session=False)
            cls.db.commit()
        cls.db.close()

    def test_register_donor_success_and_encryption(self):
        payload = {
            "name": "Tanvir Hasan Test",
            "blood_group": "O+",
            "division": "Dhaka",
            "district": "Dhaka",
            "upazila": "Dhanmondi",
            "area": "Road 27",
            "phone": "01712345482",
            "email": "tanvir.test@example.com",
            "consent_given": True,
        }

        response = self.client.post("/api/v1/donors", json=payload)
        self.assertEqual(response.status_code, 201, f"Failed: {response.text}")
        data = response.json()

        # Verify returned public structure
        self.assertIn("id", data)
        donor_id = uuid.UUID(data["id"])
        self.created_donor_ids.append(donor_id)

        self.assertEqual(data["name"], "Tanvir Hasan Test")
        self.assertEqual(data["blood_group"], "O+")
        self.assertEqual(data["division"], "Dhaka")
        self.assertEqual(data["district"], "Dhaka")
        self.assertEqual(data["upazila"], "Dhanmondi")
        self.assertEqual(data["phone_masked"], "+880 17**-***482")
        self.assertTrue(data["is_available"])

        # Strictly verify privacy: sensitive fields are NEVER returned in response
        self.assertNotIn("phone_encrypted", data)
        self.assertNotIn("consent_ip_hash", data)
        self.assertNotIn("consent_timestamp", data)
        self.assertNotIn("email", data)
        self.assertNotIn("01712345482", str(data))

        # Inspect database record directly to verify true encryption at rest
        db_donor = self.db.query(Donor).filter(Donor.id == donor_id).first()
        self.assertIsNotNone(db_donor)
        self.assertNotEqual(db_donor.phone_encrypted, "01712345482")
        self.assertNotIn("01712345482", db_donor.phone_encrypted)

        # Confirm decrypted value matches original input
        decrypted_phone = PhoneCryptoService.decrypt_phone(db_donor.phone_encrypted)
        self.assertEqual(decrypted_phone, "01712345482")

        # Confirm consent audit trail was captured
        self.assertTrue(db_donor.consent_given)
        self.assertIsNotNone(db_donor.consent_timestamp)
        self.assertIsNotNone(db_donor.consent_ip_hash)

    def test_register_donor_refused_without_consent(self):
        payload = {
            "name": "No Consent User",
            "blood_group": "A+",
            "division": "Dhaka",
            "district": "Dhaka",
            "upazila": "Mirpur",
            "phone": "01812345678",
            "consent_given": False,
        }
        response = self.client.post("/api/v1/donors", json=payload)
        self.assertEqual(response.status_code, 422)

    def test_register_donor_invalid_blood_group(self):
        payload = {
            "name": "Invalid BG User",
            "blood_group": "Z+",
            "division": "Dhaka",
            "district": "Dhaka",
            "upazila": "Mirpur",
            "phone": "01812345678",
            "consent_given": True,
        }
        response = self.client.post("/api/v1/donors", json=payload)
        self.assertEqual(response.status_code, 422)

    def test_register_donor_invalid_phone(self):
        payload = {
            "name": "Short Phone User",
            "blood_group": "B+",
            "division": "Dhaka",
            "district": "Dhaka",
            "upazila": "Mirpur",
            "phone": "12345",
            "consent_given": True,
        }
        response = self.client.post("/api/v1/donors", json=payload)
        self.assertEqual(response.status_code, 422)

    def test_list_donors_search_filters(self):
        # Create a specific donor for filter testing
        payload = {
            "name": "Sylhet Test Donor",
            "blood_group": "AB+",
            "division": "Sylhet",
            "district": "Sylhet",
            "upazila": "Kotwali",
            "phone": "01912345999",
            "consent_given": True,
        }
        create_resp = self.client.post("/api/v1/donors", json=payload)
        self.assertEqual(create_resp.status_code, 201)
        donor_id = uuid.UUID(create_resp.json()["id"])
        self.created_donor_ids.append(donor_id)

        # 1. Search by blood_group AB+
        resp = self.client.get("/api/v1/donors?blood_group=AB+")
        self.assertEqual(resp.status_code, 200)
        items = resp.json()
        self.assertIsInstance(items, list)
        self.assertTrue(any(d["id"] == str(donor_id) for d in items))
        for d in items:
            self.assertEqual(d["blood_group"], "AB+")
            self.assertNotIn("phone_encrypted", d)

        # 2. Search by division Sylhet
        resp = self.client.get("/api/v1/donors?division=Sylhet")
        self.assertEqual(resp.status_code, 200)
        items = resp.json()
        self.assertTrue(any(d["id"] == str(donor_id) for d in items))

        # 3. Search with non-matching filter
        resp = self.client.get("/api/v1/donors?division=Barisal&blood_group=AB+")
        self.assertEqual(resp.status_code, 200)
        items = resp.json()
        self.assertFalse(any(d["id"] == str(donor_id) for d in items))

    def test_get_donor_by_id(self):
        payload = {
            "name": "Detail Test Donor",
            "blood_group": "B-",
            "division": "Chittagong",
            "district": "Chittagong",
            "upazila": "Panchlaish",
            "phone": "01612345678",
            "consent_given": True,
        }
        create_resp = self.client.post("/api/v1/donors", json=payload)
        self.assertEqual(create_resp.status_code, 201)
        donor_id = create_resp.json()["id"]
        self.created_donor_ids.append(uuid.UUID(donor_id))

        # Successful fetch
        resp = self.client.get(f"/api/v1/donors/{donor_id}")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["name"], "Detail Test Donor")
        self.assertEqual(data["blood_group"], "B-")
        self.assertNotIn("phone_encrypted", data)

        # Non-existent ID fetch
        random_id = str(uuid.uuid4())
        resp_404 = self.client.get(f"/api/v1/donors/{random_id}")
        self.assertEqual(resp_404.status_code, 404)


if __name__ == "__main__":
    unittest.main()

