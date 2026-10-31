import unittest
import uuid
from datetime import datetime, timezone
import pydantic
from app.models import Base, Donor, BloodRequest, Hospital, Doctor, Pharmacy, VerificationAuditLog
from app.schemas.donor import DonorCreate, DonorPublic, VALID_BLOOD_GROUPS
from app.schemas.blood_request import BloodRequestCreate, BloodRequestPublic
from app.schemas.hospital import HospitalCreate
from app.schemas.doctor import DoctorCreate
from app.schemas.pharmacy import PharmacyCreate


class TestModelsAndConstraints(unittest.TestCase):
    def test_all_models_registered_in_metadata(self):
        table_names = set(Base.metadata.tables.keys())
        expected = {"donors", "blood_requests", "hospitals", "doctors", "pharmacies", "verification_audit_logs"}
        self.assertTrue(expected.issubset(table_names), f"Missing tables: {expected - table_names}")

    def test_audit_log_table_constraints(self):
        table = Base.metadata.tables["verification_audit_logs"]
        constraint_names = {c.name for c in table.constraints if c.name}
        self.assertIn("ck_verification_audit_logs_entity_type", constraint_names)
        self.assertIn("ck_verification_audit_logs_action", constraint_names)

    def test_donor_table_constraints(self):
        table = Base.metadata.tables["donors"]
        constraint_names = {c.name for c in table.constraints if c.name}
        self.assertIn("ck_donors_blood_group", constraint_names)
        self.assertIn("ck_donors_total_donations_non_negative", constraint_names)

    def test_blood_request_table_constraints(self):
        table = Base.metadata.tables["blood_requests"]
        constraint_names = {c.name for c in table.constraints if c.name}
        self.assertIn("ck_blood_requests_blood_group", constraint_names)
        self.assertIn("ck_blood_requests_units_positive", constraint_names)
        self.assertIn("ck_blood_requests_status", constraint_names)

    def test_hospital_table_constraints(self):
        table = Base.metadata.tables["hospitals"]
        constraint_names = {c.name for c in table.constraints if c.name}
        self.assertIn("ck_hospitals_verification_status", constraint_names)
        self.assertIn("ck_hospitals_classification", constraint_names)

    def test_doctor_table_constraints(self):
        table = Base.metadata.tables["doctors"]
        constraint_names = {c.name for c in table.constraints if c.name}
        self.assertIn("ck_doctors_verification_status", constraint_names)

    def test_pharmacy_table_constraints(self):
        table = Base.metadata.tables["pharmacies"]
        constraint_names = {c.name for c in table.constraints if c.name}
        self.assertIn("ck_pharmacies_verification_status", constraint_names)

    def test_uuid_and_timestamp_server_defaults(self):
        for table_name in ("donors", "blood_requests", "hospitals", "doctors", "pharmacies"):
            table = Base.metadata.tables[table_name]
            id_col = table.columns["id"]
            self.assertIsNotNone(id_col.server_default, f"{table_name}.id is missing server_default")
            self.assertIn("gen_random_uuid", str(id_col.server_default.arg).lower())

            created_col = table.columns["created_at"]
            self.assertIsNotNone(created_col.server_default, f"{table_name}.created_at missing server_default")
            self.assertIn("now", str(created_col.server_default.arg).lower())

            updated_col = table.columns["updated_at"]
            self.assertIsNotNone(updated_col.server_default, f"{table_name}.updated_at missing server_default")
            self.assertIn("now", str(updated_col.server_default.arg).lower())


class TestSchemas(unittest.TestCase):
    def test_donor_schema_valid(self):
        donor_data = {
            "name": "Rahim Ahmed",
            "blood_group": "B+",
            "division": "Dhaka",
            "district": "Dhaka",
            "upazila": "Dhanmondi",
            "phone": "01712345678",
            "consent_given": True,
        }
        schema = DonorCreate(**donor_data)
        self.assertEqual(schema.blood_group, "B+")
        self.assertTrue(schema.consent_given)

    def test_donor_schema_invalid_blood_group(self):
        donor_data = {
            "name": "Rahim Ahmed",
            "blood_group": "X+",
            "division": "Dhaka",
            "district": "Dhaka",
            "upazila": "Dhanmondi",
            "phone": "01712345678",
            "consent_given": True,
        }
        with self.assertRaises(pydantic.ValidationError):
            DonorCreate(**donor_data)

    def test_donor_schema_requires_consent(self):
        donor_data = {
            "name": "Rahim Ahmed",
            "blood_group": "O+",
            "division": "Dhaka",
            "district": "Dhaka",
            "upazila": "Dhanmondi",
            "phone": "01712345678",
            "consent_given": False,
        }
        with self.assertRaises(pydantic.ValidationError):
            DonorCreate(**donor_data)

    def test_blood_request_schema_positive_units(self):
        req_data = {
            "blood_group": "A+",
            "division": "Dhaka",
            "district": "Dhaka",
            "upazila": "Mirpur",
            "units_required": 0,
            "required_by": datetime.now(timezone.utc),
            "hospital_name": "Dhaka Medical College Hospital",
            "contact_name": "Karim",
            "contact_phone": "01812345678",
        }
        with self.assertRaises(pydantic.ValidationError):
            BloodRequestCreate(**req_data)

    def test_hospital_schema_valid_classification(self):
        hosp_data = {
            "name": "Dhaka Medical College Hospital",
            "classification": "Government",
            "division": "Dhaka",
            "district": "Dhaka",
            "upazila": "Ramna",
            "address": "Secretariat Road, Dhaka",
            "public_contact": "+880 2-55165001",
        }
        hospital = HospitalCreate(**hosp_data)
        self.assertEqual(hospital.classification, "Government")

    def test_hospital_schema_invalid_classification(self):
        hosp_data = {
            "name": "Mystery Clinic",
            "classification": "InvalidClassification",
            "division": "Dhaka",
            "district": "Dhaka",
            "upazila": "Ramna",
            "address": "Secretariat Road, Dhaka",
            "public_contact": "+880 2-55165001",
        }
        with self.assertRaises(pydantic.ValidationError):
            HospitalCreate(**hosp_data)


if __name__ == "__main__":
    unittest.main()

