import bcrypt

# Test the passwords
passwords = {
    "admin123": "$2b$12$vQe4b6tJV4AM9X3yjf6zleHJWBIGOZQQytIX7vR3BjqHeOETH3AIC",
    "manager123": "$2b$12$s7Ij4XM6EkEE3ql5P/7Ere9l.mLKvI/B4Ndt5OJTNwRAkFgXpn9Gq",
    "employee123": "$2b$12$MOldpeN4ROURjM/Wzzq1ruQur89xu2.VtgyM.yNaiuSQWMBedt02."
}

print("\n=== Testing Password Verification ===\n")
for password, hash_val in passwords.items():
    result = bcrypt.checkpw(password.encode(), hash_val.encode())
    print(f"{password:15} -> {result}")

print("\n=== Testing with passlib (like backend) ===\n")
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

for password, hash_val in passwords.items():
    try:
        result = pwd_context.verify(password, hash_val)
        print(f"{password:15} -> {result}")
    except Exception as e:
        print(f"{password:15} -> ERROR: {e}")









