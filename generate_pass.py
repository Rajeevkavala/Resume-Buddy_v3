import secrets
import string

def generate_password(length=16):
    chars = string.ascii_letters + string.digits + "!@#$%^&*()-_=+"
    return ''.join(secrets.choice(chars) for _ in range(length))

def generate_jwt_secret(length=32):
    # URL-safe random string (great for JWT)
    return secrets.token_urlsafe(length)

print("🔐 Generated Environment Variables:\n")

print(f"DB_PASSWORD={generate_password(16)}")
print(f"REDIS_PASSWORD={generate_password(16)}")
print(f"MINIO_SECRET_KEY={generate_password(12)}")
print(f"JWT_SECRET={generate_jwt_secret(32)}")
print(f"JWT_REFRESH_SECRET={generate_jwt_secret(32)}")
