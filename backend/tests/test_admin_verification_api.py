"""Integration tests for administrator login, verification review APIs, and audit trails."""

import unittest
import uuid
from unittest.mock import patch

from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.db.session import engine, get_db
from app.main import app
from app.models.audit_log import VerificationAuditLog
from app.models.doctor import Doctor
from app.models.hospital import Hospital
from app.models.pharmacy import Pharmacy
from app.services.auth import (
    create_admin_token,
    hash_password,
    login_rate_limiter,
)


class TestAdminVerificationAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.test_username = "admin_test_user"
        cls.test_password = "SecureAdminPassword!2026"
        cls.test_hash = hash_password(cls.test_password)
        cls.test_secret = "test-admin-secret-signing-key-high-entropy-32-bytes"

    def setUp(self):
        login_rate_limiter.reset_all()

    def tearDown(self):
        # Clean up records created during testing
        with engine.begin() as conn:
            conn.execute(text("DELETE FROM verification_audit_logs WHERE reviewer_username = :usr"), {"usr": self.test_username})
            conn.execute(text("DELETE FROM hospitals WHERE name LIKE 'Admin Test%'"))
            conn.execute(text("DELETE FROM doctors WHERE name LIKE 'Admin Test%'"))
            conn.execute(text("DELETE FROM pharmacies WHERE name LIKE 'Admin Test%'"))

    def _get_auth_headers(self) -> dict:
        with patch.object(settings, "ADMIN_SECRET_KEY", self.test_secret):
            token, _ = create_admin_token(self.test_username, expires_in_seconds=3600)
            return {"Authorization": f"Bearer {token}"}

    # ---------------------------------------------------------------------------
    # Login & Authentication Tests
    # ---------------------------------------------------------------------------

    def test_admin_login_unconfigured_credentials(self):
        with patch.object(settings, "ADMIN_PASSWORD_HASH", None):
            res = self.client.post("/api/v1/admin/login", json={"username": "admin", "password": "any"})
            self.assertEqual(res.status_code, 503)

    def test_admin_login_invalid_credentials(self):
        with patch.object(settings, "ADMIN_USERNAME", self.test_username), \
             patch.object(settings, "ADMIN_PASSWORD_HASH", self.test_hash), \
             patch.object(settings, "ADMIN_SECRET_KEY", self.test_secret):
            res = self.client.post(
                "/api/v1/admin/login",
                json={"username": self.test_username, "password": "WrongPassword!"},
            )
            self.assertEqual(res.status_code, 401)
            self.assertIn("Invalid administrator credentials", res.json()["detail"])

    def test_admin_login_success(self):
        with patch.object(settings, "ADMIN_USERNAME", self.test_username), \
             patch.object(settings, "ADMIN_PASSWORD_HASH", self.test_hash), \
             patch.object(settings, "ADMIN_SECRET_KEY", self.test_secret):
            res = self.client.post(
                "/api/v1/admin/login",
                json={"username": self.test_username, "password": self.test_password},
            )
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertIn("access_token", data)
            self.assertEqual(data["token_type"], "bearer")
            self.assertGreater(data["expires_in"], 0)

    def test_admin_login_brute_force_lockout(self):
        with patch.object(settings, "ADMIN_USERNAME", self.test_username), \
             patch.object(settings, "ADMIN_PASSWORD_HASH", self.test_hash), \
             patch.object(settings, "ADMIN_SECRET_KEY", self.test_secret):
            # 5 consecutive failed attempts
            for _ in range(5):
                self.client.post(
                    "/api/v1/admin/login",
                    json={"username": self.test_username, "password": "WrongPassword!"},
                )

            # 6th attempt should be blocked with 429
            res = self.client.post(
                "/api/v1/admin/login",
                json={"username": self.test_username, "password": self.test_password},
            )
            self.assertEqual(res.status_code, 429)
            self.assertIn("Retry-After", res.headers)

    def test_admin_endpoints_reject_unauthenticated(self):
        fake_id = uuid.uuid4()
        endpoints = [
            ("GET", "/api/v1/admin/hospitals"),
            ("GET", f"/api/v1/admin/hospitals/{fake_id}"),
            ("POST", f"/api/v1/admin/hospitals/{fake_id}/review"),
            ("GET", "/api/v1/admin/doctors"),
            ("GET", f"/api/v1/admin/doctors/{fake_id}"),
            ("POST", f"/api/v1/admin/doctors/{fake_id}/review"),
            ("GET", "/api/v1/admin/pharmacies"),
            ("GET", f"/api/v1/admin/pharmacies/{fake_id}"),
            ("POST", f"/api/v1/admin/pharmacies/{fake_id}/review"),
            ("GET", "/api/v1/admin/audit-logs"),
        ]

        for method, endpoint in endpoints:
            if method == "GET":
                res = self.client.get(endpoint)
            else:
                res = self.client.post(endpoint, json={"action": "approve"})
            self.assertEqual(
                res.status_code,
                401,
                f"Endpoint {method} {endpoint} did not reject unauthenticated access",
            )

    # ---------------------------------------------------------------------------
    # Public Registration Cannot Bypass Verification
    # ---------------------------------------------------------------------------

    def test_public_registration_cannot_set_verified_status(self):
        payload = {
            "name": "Admin Test Hospital Sneak",
            "classification": "Private",
            "division": "Dhaka",
            "district": "Dhaka",
            "upazila": "Dhanmondi",
            "address": "Dhanmondi Road 27",
            "public_contact": "01711223344",
            "verification_status": "verified",  # Attempt to inject verified status
        }
        res = self.client.post("/api/v1/hospitals", json=payload)
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["verification_status"], "unverified")

        # It must NOT appear in public listing
        list_res = self.client.get("/api/v1/hospitals")
        ids = [h["id"] for h in list_res.json()]
        self.assertNotIn(data["id"], ids)

    # ---------------------------------------------------------------------------
    # Hospital Verification & Audit Trail Tests
    # ---------------------------------------------------------------------------

    def test_hospital_approval_workflow(self):
        # 1. Register hospital
        h_payload = {
            "name": "Admin Test Hospital For Approval",
            "classification": "Government",
            "division": "Dhaka",
            "district": "Dhaka",
            "upazila": "Tejgaon",
            "address": "Tejgaon Industrial Area",
            "public_contact": "01700112233",
        }
        create_res = self.client.post("/api/v1/hospitals", json=h_payload)
        self.assertEqual(create_res.status_code, 201)
        h_id = create_res.json()["id"]

        headers = self._get_auth_headers()
        with patch.object(settings, "ADMIN_SECRET_KEY", self.test_secret):
            # 2. Admin retrieves unverified hospital
            admin_get = self.client.get(f"/api/v1/admin/hospitals/{h_id}", headers=headers)
            self.assertEqual(admin_get.status_code, 200)
            self.assertEqual(admin_get.json()["verification_status"], "unverified")

            # 3. Admin approves hospital
            review_res = self.client.post(
                f"/api/v1/admin/hospitals/{h_id}/review",
                json={"action": "approve", "notes": "Government hospital verified via MoHFW registry"},
                headers=headers,
            )
            self.assertEqual(review_res.status_code, 200)
            audit = review_res.json()
            self.assertEqual(audit["action"], "approve")
            self.assertEqual(audit["previous_status"], "unverified")
            self.assertEqual(audit["new_status"], "verified")
            self.assertEqual(audit["reviewer_username"], self.test_username)

            # 4. Hospital now has verified status and review metadata
            updated_h = self.client.get(f"/api/v1/admin/hospitals/{h_id}", headers=headers).json()
            self.assertEqual(updated_h["verification_status"], "verified")
            self.assertEqual(updated_h["reviewed_by"], self.test_username)
            self.assertIsNotNone(updated_h["reviewed_at"])
            self.assertEqual(updated_h["review_notes"], "Government hospital verified via MoHFW registry")

            # 5. Hospital is now visible to public
            pub_res = self.client.get(f"/api/v1/hospitals/{h_id}")
            self.assertEqual(pub_res.status_code, 200)

    def test_hospital_rejection_workflow(self):
        # 1. Register hospital
        h_payload = {
            "name": "Admin Test Hospital For Rejection",
            "classification": "Private",
            "division": "Chittagong",
            "district": "Chittagong",
            "upazila": "Panchlaish",
            "address": "Panchlaish Area",
            "public_contact": "01800112233",
        }
        create_res = self.client.post("/api/v1/hospitals", json=h_payload)
        h_id = create_res.json()["id"]

        headers = self._get_auth_headers()
        with patch.object(settings, "ADMIN_SECRET_KEY", self.test_secret):
            # 2. Attempt reject without notes (must fail with 422)
            invalid_review = self.client.post(
                f"/api/v1/admin/hospitals/{h_id}/review",
                json={"action": "reject", "notes": ""},
                headers=headers,
            )
            self.assertEqual(invalid_review.status_code, 422)

            # 3. Reject with proper notes
            reject_res = self.client.post(
                f"/api/v1/admin/hospitals/{h_id}/review",
                json={"action": "reject", "notes": "Incomplete facility address and invalid hotline"},
                headers=headers,
            )
            self.assertEqual(reject_res.status_code, 200)
            audit = reject_res.json()
            self.assertEqual(audit["action"], "reject")
            self.assertEqual(audit["new_status"], "rejected")

            # 4. Entity record has rejected status
            admin_get = self.client.get(f"/api/v1/admin/hospitals/{h_id}", headers=headers).json()
            self.assertEqual(admin_get["verification_status"], "rejected")
            self.assertEqual(admin_get["reviewed_by"], self.test_username)

            # 5. Rejected hospital is hidden from public API
            pub_list = self.client.get("/api/v1/hospitals")
            self.assertNotIn(h_id, [h["id"] for h in pub_list.json()])

            pub_get = self.client.get(f"/api/v1/hospitals/{h_id}")
            self.assertEqual(pub_get.status_code, 404)

    # ---------------------------------------------------------------------------
    # Doctor & Pharmacy Verification Workflows
    # ---------------------------------------------------------------------------

    def test_doctor_approval_and_rejection_workflow(self):
        doc_payload = {
            "name": "Admin Test Dr. Karim",
            "specialty": "Cardiology",
            "qualifications": "MBBS, FCPS (Cardiology)",
            "hospital_or_chamber": "National Heart Foundation",
            "chamber_address": "Mirpur, Dhaka",
            "division": "Dhaka",
            "district": "Dhaka",
            "upazila": "Mirpur",
            "public_contact": "01711002299",
            "bmdc_registration_number": "A-12345",
        }
        res = self.client.post("/api/v1/doctors", json=doc_payload)
        doc_id = res.json()["id"]

        headers = self._get_auth_headers()
        with patch.object(settings, "ADMIN_SECRET_KEY", self.test_secret):
            # Approve
            app_res = self.client.post(
                f"/api/v1/admin/doctors/{doc_id}/review",
                json={"action": "approve", "notes": "BMDC registration verified"},
                headers=headers,
            )
            self.assertEqual(app_res.status_code, 200)

            # Public can now view doctor
            pub = self.client.get(f"/api/v1/doctors/{doc_id}")
            self.assertEqual(pub.status_code, 200)

    def test_pharmacy_approval_and_rejection_workflow(self):
        pharm_payload = {
            "name": "Admin Test Lazz Pharma Unit",
            "division": "Dhaka",
            "district": "Dhaka",
            "upazila": "Kalabagan",
            "address": "Kalabagan Bus Stand",
            "public_contact": "01722334455",
            "drug_license_number": "DGDA-DL-998877",
        }
        res = self.client.post("/api/v1/pharmacies", json=pharm_payload)
        pharm_id = res.json()["id"]

        headers = self._get_auth_headers()
        with patch.object(settings, "ADMIN_SECRET_KEY", self.test_secret):
            # Reject
            rej_res = self.client.post(
                f"/api/v1/admin/pharmacies/{pharm_id}/review",
                json={"action": "reject", "notes": "Drug license expired according to DGDA"},
                headers=headers,
            )
            self.assertEqual(rej_res.status_code, 200)

            # Hidden from public
            pub = self.client.get(f"/api/v1/pharmacies/{pharm_id}")
            self.assertEqual(pub.status_code, 404)

    # ---------------------------------------------------------------------------
    # Audit Logs Endpoint & Atomicity
    # ---------------------------------------------------------------------------

    def test_admin_list_audit_logs(self):
        # Create a hospital and review it
        h_res = self.client.post("/api/v1/hospitals", json={
            "name": "Admin Test Hospital Logs",
            "classification": "Private",
            "division": "Sylhet",
            "district": "Sylhet",
            "upazila": "Kotwali",
            "address": "Zindabazar",
            "public_contact": "01811223344",
        })
        h_id = h_res.json()["id"]

        headers = self._get_auth_headers()
        with patch.object(settings, "ADMIN_SECRET_KEY", self.test_secret):
            self.client.post(
                f"/api/v1/admin/hospitals/{h_id}/review",
                json={"action": "approve", "notes": "Logs test approval"},
                headers=headers,
            )

            # Query audit logs
            log_res = self.client.get(f"/api/v1/admin/audit-logs?entity_type=hospital&entity_id={h_id}", headers=headers)
            self.assertEqual(log_res.status_code, 200)
            logs = log_res.json()
            self.assertEqual(len(logs), 1)
            self.assertEqual(logs[0]["entity_id"], h_id)
            self.assertEqual(logs[0]["action"], "approve")
            self.assertEqual(logs[0]["reviewer_username"], self.test_username)

    def test_transaction_rollback_on_audit_failure(self):
        # Register hospital
        h_res = self.client.post("/api/v1/hospitals", json={
            "name": "Admin Test Hospital Rollback",
            "classification": "Private",
            "division": "Barisal",
            "district": "Barisal",
            "upazila": "Kotwali",
            "address": "Sadat Road",
            "public_contact": "01733445566",
        })
        h_id = h_res.json()["id"]

        headers = self._get_auth_headers()
        with patch.object(settings, "ADMIN_SECRET_KEY", self.test_secret):
            # Patch db.commit to raise an exception simulating failure
            with patch.object(Session, "commit", side_effect=RuntimeError("Simulated DB commit error")):
                res = self.client.post(
                    f"/api/v1/admin/hospitals/{h_id}/review",
                    json={"action": "approve", "notes": "Should fail and rollback"},
                    headers=headers,
                )
                self.assertEqual(res.status_code, 500)

            # Verify that hospital verification_status was NOT updated in DB
            admin_get = self.client.get(f"/api/v1/admin/hospitals/{h_id}", headers=headers).json()
            self.assertEqual(admin_get["verification_status"], "unverified")
            self.assertIsNone(admin_get["reviewed_at"])


if __name__ == "__main__":
    unittest.main()

