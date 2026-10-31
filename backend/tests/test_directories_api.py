import unittest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.db.session import SessionLocal
from app.models.hospital import Hospital
from app.models.doctor import Doctor
from app.models.pharmacy import Pharmacy


class TestDirectoriesAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.db: Session = SessionLocal()
        cls.created_hospital_ids = []
        cls.created_doctor_ids = []
        cls.created_pharmacy_ids = []

    @classmethod
    def tearDownClass(cls):
        # Clean up any test records
        if cls.created_hospital_ids:
            cls.db.query(Hospital).filter(Hospital.id.in_(cls.created_hospital_ids)).delete(synchronize_session=False)
        if cls.created_doctor_ids:
            cls.db.query(Doctor).filter(Doctor.id.in_(cls.created_doctor_ids)).delete(synchronize_session=False)
        if cls.created_pharmacy_ids:
            cls.db.query(Pharmacy).filter(Pharmacy.id.in_(cls.created_pharmacy_ids)).delete(synchronize_session=False)
        cls.db.commit()
        cls.db.close()

    # ================= HOSPITALS TESTS =================

    def test_create_and_get_hospital(self):
        payload = {
            "name": "Dhaka Central Specialized Hospital",
            "name_bn": "ঢাকা সেন্ট্রাল বিশেষায়িত হাসপাতাল",
            "classification": "Specialized",
            "division": "Dhaka",
            "district": "Dhaka",
            "upazila": "Dhanmondi",
            "address": "House 12, Road 5, Dhanmondi, Dhaka",
            "address_bn": "বাড়ি ১২, রোড ৫, ধানমন্ডি, ঢাকা",
            "public_contact": "+880 2-9661234",
            "emergency_hotline": "10678",
            "available_services": ["24/7 Emergency", "ICU", "Dialysis Unit"],
            "has_icu": True,
            "has_emergency": True,
            "has_dialysis": True,
        }

        # POST /api/v1/hospitals (unverified by default)
        response = self.client.post("/api/v1/hospitals", json=payload)
        self.assertEqual(response.status_code, 201, f"Create failed: {response.text}")
        data = response.json()

        self.assertIn("id", data)
        hospital_id = uuid.UUID(data["id"])
        self.created_hospital_ids.append(hospital_id)

        self.assertEqual(data["name"], "Dhaka Central Specialized Hospital")
        self.assertEqual(data["classification"], "Specialized")
        self.assertEqual(data["division"], "Dhaka")
        self.assertEqual(data["district"], "Dhaka")
        self.assertEqual(data["upazila"], "Dhanmondi")
        self.assertTrue(data["has_icu"])
        self.assertTrue(data["has_emergency"])
        self.assertTrue(data["has_dialysis"])
        self.assertEqual(data["verification_status"], "unverified")
        self.assertFalse(data["is_demo"])

        # Unverified hospital MUST NOT be visible in ordinary public detail endpoint (404)
        get_unverified = self.client.get(f"/api/v1/hospitals/{hospital_id}")
        self.assertEqual(get_unverified.status_code, 404, "Unverified hospital must not be exposed on detail endpoint")

        # Unverified hospital MUST NOT appear in public directory listings
        list_res = self.client.get("/api/v1/hospitals?search=Dhaka Central Specialized")
        self.assertEqual(list_res.status_code, 200)
        names = [h["name"] for h in list_res.json()]
        self.assertNotIn("Dhaka Central Specialized Hospital", names)

        # Mark record as verified in DB directly (simulating administrative review)
        db_hospital = self.db.query(Hospital).filter(Hospital.id == hospital_id).first()
        self.assertIsNotNone(db_hospital)
        db_hospital.verification_status = "verified"
        self.db.commit()

        # Now verified hospital MUST be accessible in detail endpoint (200)
        get_verified = self.client.get(f"/api/v1/hospitals/{hospital_id}")
        self.assertEqual(get_verified.status_code, 200)
        self.assertEqual(get_verified.json()["name"], "Dhaka Central Specialized Hospital")
        self.assertEqual(get_verified.json()["verification_status"], "verified")

        # 404 on nonexistent hospital
        fake_id = uuid.uuid4()
        not_found = self.client.get(f"/api/v1/hospitals/{fake_id}")
        self.assertEqual(not_found.status_code, 404)

    def test_create_hospital_invalid_classification(self):
        payload = {
            "name": "Invalid Classification Hospital",
            "classification": "NonExistentType",
            "division": "Dhaka",
            "district": "Dhaka",
            "upazila": "Mirpur",
            "address": "Section 10, Mirpur",
            "public_contact": "+880 2-888888",
        }
        res = self.client.post("/api/v1/hospitals", json=payload)
        self.assertEqual(res.status_code, 422)

    def test_list_hospitals_filtering(self):
        hosp1 = Hospital(
            name="Chittagong General Hospital Test",
            classification="Government",
            division="Chittagong",
            district="Chittagong",
            upazila="Kotwali",
            address="Anderkilla, Chittagong",
            public_contact="+880 31-611234",
            available_services=["Emergency", "General Ward"],
            has_icu=False,
            has_emergency=True,
            has_dialysis=False,
            verification_status="verified",
            is_demo=False,
        )
        hosp2 = Hospital(
            name="Sylhet Heart Center Test",
            classification="Private",
            division="Sylhet",
            district="Sylhet",
            upazila="Osmani Nagar",
            address="Subidbazar, Sylhet",
            public_contact="+880 821-712345",
            available_services=["ICU", "Cath Lab", "Dialysis"],
            has_icu=True,
            has_emergency=True,
            has_dialysis=True,
            verification_status="verified",
            is_demo=False,
        )
        hosp_unverified = Hospital(
            name="Unpublished Draft Hospital Test",
            classification="Private",
            division="Chittagong",
            district="Chittagong",
            upazila="Kotwali",
            address="Anderkilla, Chittagong",
            public_contact="+880 31-999999",
            available_services=["Emergency"],
            has_icu=False,
            has_emergency=True,
            has_dialysis=False,
            verification_status="unverified",
            is_demo=False,
        )
        self.db.add_all([hosp1, hosp2, hosp_unverified])
        self.db.commit()
        self.created_hospital_ids.extend([hosp1.id, hosp2.id, hosp_unverified.id])

        # Filter by division Chittagong (must include verified hosp1, exclude verified hosp2 and unverified hosp_unverified)
        res = self.client.get("/api/v1/hospitals?division=Chittagong")
        self.assertEqual(res.status_code, 200)
        names = [h["name"] for h in res.json()]
        self.assertIn("Chittagong General Hospital Test", names)
        self.assertNotIn("Sylhet Heart Center Test", names)
        self.assertNotIn("Unpublished Draft Hospital Test", names, "Unverified hospital must not be returned")

        # Filter by has_icu=true
        res_icu = self.client.get("/api/v1/hospitals?has_icu=true&division=Sylhet")
        self.assertEqual(res_icu.status_code, 200)
        icu_names = [h["name"] for h in res_icu.json()]
        self.assertIn("Sylhet Heart Center Test", icu_names)

        # Search by keyword
        res_search = self.client.get("/api/v1/hospitals?search=Anderkilla")
        self.assertEqual(res_search.status_code, 200)
        self.assertTrue(any(h["name"] == "Chittagong General Hospital Test" for h in res_search.json()))
        self.assertFalse(any(h["name"] == "Unpublished Draft Hospital Test" for h in res_search.json()))

    # ================= DOCTORS TESTS =================

    def test_create_and_get_doctor(self):
        payload = {
            "name": "Dr. Sarah Ahmed Test",
            "name_bn": "ডা. সারাহ আহমেদ",
            "specialty": "Cardiology",
            "specialty_bn": "কার্ডিওলজি (হৃদরোগ)",
            "qualifications": "MBBS, FCPS (Cardiology)",
            "hospital_or_chamber": "National Heart Foundation",
            "chamber_address": "Plot 4, Mirpur 2, Dhaka",
            "division": "Dhaka",
            "district": "Dhaka",
            "upazila": "Mirpur",
            "visiting_hours": "5:00 PM - 9:00 PM (Sat-Thu)",
            "consultation_fee": "BDT 1200",
            "public_contact": "+880 1711-223344",
            "bmdc_registration_number": "A-12345",
        }

        # POST /api/v1/doctors
        response = self.client.post("/api/v1/doctors", json=payload)
        self.assertEqual(response.status_code, 201, f"Create failed: {response.text}")
        data = response.json()

        self.assertIn("id", data)
        doc_id = uuid.UUID(data["id"])
        self.created_doctor_ids.append(doc_id)

        self.assertEqual(data["name"], "Dr. Sarah Ahmed Test")
        self.assertEqual(data["specialty"], "Cardiology")
        self.assertEqual(data["division"], "Dhaka")
        self.assertEqual(data["bmdc_registration_number"], "A-12345")
        self.assertEqual(data["verification_status"], "unverified")

        # Unverified doctor profile must return 404 in public detail endpoint
        get_unverified = self.client.get(f"/api/v1/doctors/{doc_id}")
        self.assertEqual(get_unverified.status_code, 404, "Unverified doctor must not be exposed on detail endpoint")

        # Unverified doctor must NOT be in public listing
        list_res = self.client.get("/api/v1/doctors?search=Sarah Ahmed")
        self.assertEqual(list_res.status_code, 200)
        names = [d["name"] for d in list_res.json()]
        self.assertNotIn("Dr. Sarah Ahmed Test", names)

        # Mark as verified in DB
        db_doc = self.db.query(Doctor).filter(Doctor.id == doc_id).first()
        self.assertIsNotNone(db_doc)
        db_doc.verification_status = "verified"
        self.db.commit()

        # Verified doctor profile must return 200
        get_verified = self.client.get(f"/api/v1/doctors/{doc_id}")
        self.assertEqual(get_verified.status_code, 200)
        self.assertEqual(get_verified.json()["name"], "Dr. Sarah Ahmed Test")
        self.assertEqual(get_verified.json()["verification_status"], "verified")

        # 404 for invalid doctor ID
        fake_id = uuid.uuid4()
        not_found = self.client.get(f"/api/v1/doctors/{fake_id}")
        self.assertEqual(not_found.status_code, 404)

    def test_list_doctors_filtering(self):
        doc1 = Doctor(
            name="Dr. Kamal Hossain Test",
            specialty="Pediatrics",
            qualifications="MBBS, DCH",
            hospital_or_chamber="Chittagong Child Hospital",
            chamber_address="Panchlaish, Chittagong",
            division="Chittagong",
            district="Chittagong",
            upazila="Panchlaish",
            public_contact="+880 31-778899",
            verification_status="verified",
            is_demo=False,
        )
        doc2 = Doctor(
            name="Dr. Nasreen Sultana Test",
            specialty="Gynecology",
            qualifications="MBBS, MS (Gynae)",
            hospital_or_chamber="Rajshahi Medical College Chamber",
            chamber_address="Laxmipur, Rajshahi",
            division="Rajshahi",
            district="Rajshahi",
            upazila="Rajshahi Sadar",
            public_contact="+880 721-665544",
            verification_status="verified",
            is_demo=False,
        )
        doc_unverified = Doctor(
            name="Dr. Fake Unverified Test",
            specialty="Pediatrics",
            qualifications="None",
            hospital_or_chamber="Fake Clinic",
            chamber_address="Panchlaish, Chittagong",
            division="Chittagong",
            district="Chittagong",
            upazila="Panchlaish",
            public_contact="+880 31-000000",
            verification_status="unverified",
            is_demo=False,
        )
        self.db.add_all([doc1, doc2, doc_unverified])
        self.db.commit()
        self.created_doctor_ids.extend([doc1.id, doc2.id, doc_unverified.id])

        # Filter by specialty (verified only)
        res = self.client.get("/api/v1/doctors?specialty=Pediatrics")
        self.assertEqual(res.status_code, 200)
        names = [d["name"] for d in res.json()]
        self.assertIn("Dr. Kamal Hossain Test", names)
        self.assertNotIn("Dr. Nasreen Sultana Test", names)
        self.assertNotIn("Dr. Fake Unverified Test", names, "Unverified doctor must not be in directory")

        # Filter by division
        res_div = self.client.get("/api/v1/doctors?division=Rajshahi")
        self.assertEqual(res_div.status_code, 200)
        raj_names = [d["name"] for d in res_div.json()]
        self.assertIn("Dr. Nasreen Sultana Test", raj_names)

        # Search by chamber / name
        res_search = self.client.get("/api/v1/doctors?search=Child Hospital")
        self.assertEqual(res_search.status_code, 200)
        self.assertTrue(any(d["name"] == "Dr. Kamal Hossain Test" for d in res_search.json()))

    # ================= PHARMACIES TESTS =================

    def test_create_and_get_pharmacy(self):
        payload = {
            "name": "Central Lazz Pharma Test",
            "name_bn": "সেন্ট্রাল লাজ ফার্মা",
            "division": "Dhaka",
            "district": "Dhaka",
            "upazila": "Kalabagan",
            "address": "Green Road, Kalabagan, Dhaka",
            "address_bn": "গ্রিন রোড, কলাবাগান, ঢাকা",
            "public_contact": "+880 2-9112233",
            "is_open_24_hours": True,
            "opening_hours": "Open 24/7",
            "available_services": ["Prescription Dispensing", "Insulin Cold Chain", "Blood Glucose Check"],
            "drug_license_number": "DL-DHK-2024-8899",
        }

        # POST /api/v1/pharmacies
        response = self.client.post("/api/v1/pharmacies", json=payload)
        self.assertEqual(response.status_code, 201, f"Create failed: {response.text}")
        data = response.json()

        self.assertIn("id", data)
        pharma_id = uuid.UUID(data["id"])
        self.created_pharmacy_ids.append(pharma_id)

        self.assertEqual(data["name"], "Central Lazz Pharma Test")
        self.assertEqual(data["division"], "Dhaka")
        self.assertTrue(data["is_open_24_hours"])
        self.assertEqual(data["drug_license_number"], "DL-DHK-2024-8899")
        self.assertEqual(data["verification_status"], "unverified")

        # Unverified pharmacy must return 404 in public detail endpoint
        get_unverified = self.client.get(f"/api/v1/pharmacies/{pharma_id}")
        self.assertEqual(get_unverified.status_code, 404, "Unverified pharmacy must not be exposed on detail endpoint")

        # Unverified pharmacy must not be in public directory listings
        list_res = self.client.get("/api/v1/pharmacies?search=Central Lazz Pharma")
        self.assertEqual(list_res.status_code, 200)
        names = [p["name"] for p in list_res.json()]
        self.assertNotIn("Central Lazz Pharma Test", names)

        # Mark as verified in DB
        db_pharma = self.db.query(Pharmacy).filter(Pharmacy.id == pharma_id).first()
        self.assertIsNotNone(db_pharma)
        db_pharma.verification_status = "verified"
        self.db.commit()

        # Verified pharmacy must return 200
        get_verified = self.client.get(f"/api/v1/pharmacies/{pharma_id}")
        self.assertEqual(get_verified.status_code, 200)
        self.assertEqual(get_verified.json()["name"], "Central Lazz Pharma Test")
        self.assertEqual(get_verified.json()["verification_status"], "verified")

        # 404 for invalid pharmacy ID
        fake_id = uuid.uuid4()
        not_found = self.client.get(f"/api/v1/pharmacies/{fake_id}")
        self.assertEqual(not_found.status_code, 404)

    def test_list_pharmacies_filtering(self):
        p1 = Pharmacy(
            name="24 Hour Emergency Dispensary Test",
            division="Khulna",
            district="Khulna",
            upazila="Sonadanga",
            address="Medical College Gate, Sonadanga, Khulna",
            public_contact="+880 41-723344",
            is_open_24_hours=True,
            available_services=["Emergency Drugs"],
            verification_status="verified",
            is_demo=False,
        )
        p2 = Pharmacy(
            name="Barishal Day Pharma Test",
            division="Barishal",
            district="Barishal",
            upazila="Kotwali",
            address="Sadullapur Road, Barishal",
            public_contact="+880 431-61122",
            is_open_24_hours=False,
            opening_hours="8:00 AM - 10:00 PM",
            available_services=["General Medicine"],
            verification_status="verified",
            is_demo=False,
        )
        p_unverified = Pharmacy(
            name="Unverified 24 Hour Pharma Test",
            division="Khulna",
            district="Khulna",
            upazila="Sonadanga",
            address="Medical College Gate, Sonadanga, Khulna",
            public_contact="+880 41-000000",
            is_open_24_hours=True,
            available_services=["Emergency Drugs"],
            verification_status="unverified",
            is_demo=False,
        )
        self.db.add_all([p1, p2, p_unverified])
        self.db.commit()
        self.created_pharmacy_ids.extend([p1.id, p2.id, p_unverified.id])

        # Filter by 24h (verified only)
        res_24 = self.client.get("/api/v1/pharmacies?is_open_24_hours=true&division=Khulna")
        self.assertEqual(res_24.status_code, 200)
        names = [p["name"] for p in res_24.json()]
        self.assertIn("24 Hour Emergency Dispensary Test", names)
        self.assertNotIn("Barishal Day Pharma Test", names)
        self.assertNotIn("Unverified 24 Hour Pharma Test", names, "Unverified pharmacy must not appear in directory")

        # Filter by division
        res_bar = self.client.get("/api/v1/pharmacies?division=Barishal")
        self.assertEqual(res_bar.status_code, 200)
        bar_names = [p["name"] for p in res_bar.json()]
        self.assertIn("Barishal Day Pharma Test", bar_names)

        # Search keyword
        res_search = self.client.get("/api/v1/pharmacies?search=Sonadanga")
        self.assertEqual(res_search.status_code, 200)
        self.assertTrue(any(p["name"] == "24 Hour Emergency Dispensary Test" for p in res_search.json()))
        self.assertFalse(any(p["name"] == "Unverified 24 Hour Pharma Test" for p in res_search.json()))

    # ================= PAGINATION TESTS =================

    def test_directories_pagination(self):
        for endpoint in ["/api/v1/hospitals", "/api/v1/doctors", "/api/v1/pharmacies"]:
            res = self.client.get(f"{endpoint}?limit=5&offset=0")
            self.assertEqual(res.status_code, 200)
            self.assertIsInstance(res.json(), list)

            # limit < 1 should fail
            bad_limit = self.client.get(f"{endpoint}?limit=0")
            self.assertEqual(bad_limit.status_code, 422)

            # limit > 100 should fail
            too_high = self.client.get(f"{endpoint}?limit=101")
            self.assertEqual(too_high.status_code, 422)
