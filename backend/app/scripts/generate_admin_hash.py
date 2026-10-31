#!/usr/bin/env python3
"""CLI utility to generate a secure PBKDF2-HMAC-SHA256 password hash for administrator provisioning.

Usage:
    python -m app.scripts.generate_admin_hash
    python -m app.scripts.generate_admin_hash --generate-secret
    python -m app.scripts.generate_admin_hash --generate-secret --update-env
"""

import argparse
import getpass
from pathlib import Path
import secrets
import sys
from typing import Optional

from app.services.auth import hash_password


def update_env_file(
    hash_value: str,
    secret_key: Optional[str] = None,
    env_path: str = "backend/.env",
) -> bool:
    """Safely update ADMIN_PASSWORD_HASH and ADMIN_SECRET_KEY in backend/.env."""
    path = Path(env_path)
    if not path.exists():
        return False
    lines = path.read_text(encoding="utf-8").splitlines(keepends=True)
    new_lines = []
    hash_updated = False
    secret_updated = False

    for line in lines:
        if line.startswith("ADMIN_PASSWORD_HASH="):
            new_lines.append(f"ADMIN_PASSWORD_HASH={hash_value}\n")
            hash_updated = True
        elif secret_key and line.startswith("ADMIN_SECRET_KEY="):
            new_lines.append(f"ADMIN_SECRET_KEY={secret_key}\n")
            secret_updated = True
        else:
            new_lines.append(line)

    if not hash_updated:
        new_lines.append(f"ADMIN_PASSWORD_HASH={hash_value}\n")
    if secret_key and not secret_updated:
        new_lines.append(f"ADMIN_SECRET_KEY={secret_key}\n")

    path.write_text("".join(new_lines), encoding="utf-8")
    return True


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate a secure PBKDF2-HMAC-SHA256 password hash for ShasthoBondhu administrator.",
    )
    parser.add_argument(
        "--generate-secret",
        action="store_true",
        help="Also generate a cryptographically strong ADMIN_SECRET_KEY for signing tokens.",
    )
    parser.add_argument(
        "--generate-password",
        action="store_true",
        help="Automatically generate a cryptographically strong random administrator password.",
    )
    parser.add_argument(
        "--update-env",
        action="store_true",
        help="Directly update backend/.env with the generated hash (and secret, if generated).",
    )
    parser.add_argument(
        "--password-file-out",
        type=str,
        default=None,
        help="Optionally write the plaintext password to a local file for administrative retrieval.",
    )
    args = parser.parse_args()

    signing_secret = None
    if args.generate_secret:
        signing_secret = secrets.token_urlsafe(48)
        if not args.update_env:
            print("Generated ADMIN_SECRET_KEY:")
            print(signing_secret)
            print()

    # Obtain administrator password: generated, interactive prompt, or piped stdin
    try:
        if args.generate_password:
            pwd = secrets.token_urlsafe(32)
        elif sys.stdin.isatty():
            pwd = getpass.getpass("Enter administrator password: ")
        else:
            pwd = sys.stdin.readline().rstrip("\r\n")

        if not pwd:
            print("Error: Password cannot be empty.", file=sys.stderr)
            sys.exit(1)

        if len(pwd) < 12:
            print("Error: Administrator password must be at least 12 characters long.", file=sys.stderr)
            sys.exit(1)

        if not args.generate_password:
            if sys.stdin.isatty():
                confirm = getpass.getpass("Confirm administrator password: ")
            else:
                confirm = sys.stdin.readline().rstrip("\r\n")

            if pwd != confirm:
                print("Error: Passwords do not match.", file=sys.stderr)
                sys.exit(1)

        # Generate PBKDF2 hash (600,000 iterations, random 16-byte salt)
        encoded_hash = hash_password(pwd)

        if args.update_env:
            success = update_env_file(encoded_hash, signing_secret)
            if success:
                print("[SUCCESS] backend/.env updated with new administrator credentials.")
            else:
                print("[ERROR] backend/.env file not found.", file=sys.stderr)
                sys.exit(1)
        else:
            print("\nADMIN_PASSWORD_HASH:")
            print(encoded_hash)

        if args.password_file_out:
            out_p = Path(args.password_file_out)
            out_p.write_text(f"ADMIN_USERNAME=admin\nADMIN_PASSWORD={pwd}\n", encoding="utf-8")
            print(f"[INFO] Credentials written to local file: {args.password_file_out}")

    except (KeyboardInterrupt, EOFError):
        print("\nAborted.", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()


